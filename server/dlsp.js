// Import Libraries
const _ = require('lodash');
const path = require('path');
const axios = require('axios');
const https = require('https');
const cron = require('node-cron');
const contract = require("truffle-contract");
const HDWalletProvider = require('truffle-hdwallet-provider');
const {createAlchemyWeb3} = require("@alch/alchemy-web3");

// Import contracts ABI's
const PlennyOceanJSON = require(path.join(__dirname, '../build/contracts/PlennyOceanV2.json'));
const PlennyDappFactoryJSON = require(path.join(__dirname, '../build/contracts/PlennyDappFactoryV2.json'));
const PlennyCoordinatorJSON = require(path.join(__dirname, '../build/contracts/PlennyCoordinatorV2.json'));
const PlennyOracleValidatorJSON = require(path.join(__dirname, '../build/contracts/PlennyOracleValidatorV2.json'));
const PlennyValidatorElectionJSON = require(path.join(__dirname, '../build/contracts/PlennyValidatorElectionV2.json'));

// Import custom modules
const lnd = require('./lnd');
const btc = require('./btc');
const db = require('./database/db');
const {logger} = require('./utils/logger');
const {BadRequest} = require('./utils/errors');

// Custom Wallet provider
const privateKeyProvider = new HDWalletProvider(process.env.ETH_PRIV_KEY, process.env.LOCAL_RPC_URL);

// Allow closing sub-marginal (profitless) channels.
const ALLOW_AUTO_CLOSING_CHANNELS = process.env.ALLOW_AUTO_CLOSING_CHANNELS;
const CHANNEL_FAILED_ATTEMPTS_LIMIT = process.env.CHANNEL_FAILED_ATTEMPTS_LIMIT || 3;
const DELAY_CHANNEL_PROCESSING = process.env.DELAY_CHANNEL_PROCESSING || 1000;
const MAX_RETRIES = process.env.MAX_RETRIES ? process.env.MAX_RETRIES : 3;
const RETRY_INTERVAL = process.env.RETRY_INTERVAL ? process.env.RETRY_INTERVAL : 1000;
const RETRY_JITTER = process.env.RETRY_JITTER ? process.env.RETRY_JITTER : 250;

// Validator & Maker
class Dlsp {

    constructor() {
        this.web3 = createAlchemyWeb3(process.env.LOCAL_RPC_URL,
            {
                writeProvider: privateKeyProvider,
                maxRetries: MAX_RETRIES,
                retryInterval: RETRY_INTERVAL,
                retryJitter: RETRY_JITTER
            }
        );

        this.web3L1 = createAlchemyWeb3(process.env.L1_RPC_URL,
            {
                writeProvider: privateKeyProvider,
                maxRetries: MAX_RETRIES,
                retryInterval: RETRY_INTERVAL,
                retryJitter: RETRY_JITTER
            }
        );

        this.webWS = createAlchemyWeb3(process.env.SOCKET_RPC_URL,
            {
                writeProvider: privateKeyProvider,
                maxRetries: MAX_RETRIES,
                retryInterval: RETRY_INTERVAL,
                retryJitter: RETRY_JITTER
            }
        );

        this.pendingChannelIndexes = [];
        this.activeChannelIndexes = [];
        this.pendingCapacityIndexes = [];
    }

    async init() {
        this.accounts = await this.web3.eth.getAccounts();
        // Get contract websocket and http instances
        const [
            oceanWs, escrowWs, oracleValidatorWs, validatorElectionWS,
            ocean, coordinator, dappFactory, oracleValidator, validatorElection
        ] = await Promise.all([
            this._setContractProvider(PlennyOceanJSON, this.webWS.currentProvider),
            this._setContractProvider(PlennyCoordinatorJSON, this.webWS.currentProvider),
            this._setContractProvider(PlennyOracleValidatorJSON, this.webWS.currentProvider),
            this._setContractProvider(PlennyValidatorElectionJSON, this.webWS.currentProvider),
            this._setContractProvider(PlennyOceanJSON, this.web3.currentProvider),
            this._setContractProvider(PlennyCoordinatorJSON, this.web3.currentProvider),
            this._setContractProvider(PlennyDappFactoryJSON, this.web3.currentProvider),
            this._setContractProvider(PlennyOracleValidatorJSON, this.web3.currentProvider),
            this._setContractProvider(PlennyValidatorElectionJSON, this.web3.currentProvider)
        ]);

        // Websocket contract instances
        this.oceanWs = oceanWs;
        this.escrowWs = escrowWs;
        this.oracleValidatorWs = oracleValidatorWs;
        this.validatorElectionWS = validatorElectionWS;

        // HTTP contract instances
        this.ocean = ocean;
        this.coordinator = coordinator;
        this.dappFactory = dappFactory;
        this.oracleValidator = oracleValidator;
        this.validatorElection = validatorElection;

        const cronPendingTimers = `*/10 * * * *`; // 10 minutes
        const cronCapacityTimers = `*/10 * * * *`; // 10 minutes
        const cronActiveTimers = `*/20 * * * *`; // 20 minutes
        const cronClosingTimers = `*/60 * * * *`; // 60 minutes

        this.taskLoopPendingChannels = cron.schedule(cronPendingTimers, () => {
            this.loopPendingChannels();
        }, {scheduled: true});

        this.taskLoopCapacityRequests = cron.schedule(cronCapacityTimers, () => {
            this.loopCapacityRequests();
        }, {scheduled: true});

        this.taskLoopActiveChannels = cron.schedule(cronActiveTimers, () => {
            this.loopActiveChannels();
        }, {scheduled: true});

        this.taskLoopProfitlessChannels = cron.schedule(cronClosingTimers, () => {
            this.closeActiveProfitlessChannels();
        }, {scheduled: true});

        // Start the services
        await this.startTasks();

        // Restart the service on new validator election cycle
        if (this.validatorElectionWS) {
            this.validatorElectionWS.NewValidators().on('data', event => {
                if (event.returnValues.newValidators.length > 0) {
                    this.restartTasks();
                }
            });
        }

        // Restart the service when it becomes a maker service
        if (this.oceanWs) {
            this.oceanWs.MakerAdded().on('data', event => {
                if (event.returnValues.account === this.accounts[0] && event.returnValues.created) {
                    this.restartTasks();
                }
            });

            this.oceanWs.MakerRemoved().on('data', event => {
                if (event.returnValues.account === this.accounts[0]) {
                    this.restartTasks();
                }
            });
        }
    }

    async startTasks() {
        const account = this.accounts[0];
        const latestElectionBlock = await this.validatorElection.latestElectionBlock();
        const [isOracleValidator, isElectedValidator, isMaker] = await Promise.all([
            this.dappFactory.isOracleValidator(account, {from: account}),
            this.validatorElection.validators(latestElectionBlock, account, {from: account}),
            this.ocean.makerIndexPerAddress(account, {from: account})
        ]);

        if (isOracleValidator > 0 && isElectedValidator) {
            logger.info('---- Running oracle service ----');
            await this.subscribeActiveChannels();
            await this.loopActiveChannels();
            this.taskLoopActiveChannels.start();

            await this.subscribePendingChannels();
            await this.loopPendingChannels();
            this.taskLoopPendingChannels.start();
        } else {
            logger.warn('Not an elected validator');
            this.taskLoopActiveChannels.stop();
            this.taskLoopPendingChannels.stop();
        }

        if (isMaker > 0) {
            logger.info('---- Running maker service ----');
            await this.subscribeCapacityRequests();
            await this.loopCapacityRequests();
            this.taskLoopCapacityRequests.start();

            if (ALLOW_AUTO_CLOSING_CHANNELS) {
                this.taskLoopProfitlessChannels.start();
            }
        } else {
            logger.warn('Not a liquidity maker');
            this.taskLoopCapacityRequests.stop();

            if (ALLOW_AUTO_CLOSING_CHANNELS) {
                this.taskLoopProfitlessChannels.stop();
            }
        }
    }

    stopTasks() {
        this.taskLoopPendingChannels.stop();
        this.taskLoopActiveChannels.stop();
        this.taskLoopCapacityRequests.stop();
        this.taskLoopProfitlessChannels.stop();
    }

    async restartTasks() {
        logger.debug('---- Restarting DLSP ----');
        this.stopTasks();
        await this.startTasks();
    }

    /* **************************************************************
     *                       PENDING CHANNELS                        *
     ************************************************************** */
    async subscribePendingChannels() {
        logger.info('subscribePendingChannels');

        if (this.escrowWs) {
            this.escrowWs.LightningChannelOpeningPending().on('data', event => {
                const channelIndex = event.returnValues.channelIndex;
                this._pushIfNotExists(this.pendingChannelIndexes, channelIndex.toString());
            });
        }

        if (this.oracleValidatorWs) {
            this.oracleValidatorWs.ChannelOpeningCommit().on('data', event => {
                const channelIndex = event.returnValues.channelIndex;
                logger.debug('Channel commit event: ' + channelIndex);
                this._pushIfNotExists(this.pendingChannelIndexes, channelIndex.toString());
            });
            this.oracleValidatorWs.ChannelOpeningVerify().on('data', event => {
                const channelIndex = event.returnValues.channelIndex;
                logger.debug('Channel verify event: ' + channelIndex);
                this._pushIfNotExists(this.pendingChannelIndexes, channelIndex.toString());
            });
            this.oracleValidatorWs.ChannelClosingCommit().on('data', event => {
                const channelIndex = event.returnValues.channelIndex;
                logger.debug('Channel close commit event: ' + channelIndex);
                this._pushIfNotExists(this.activeChannelIndexes, channelIndex.toString());
            });
            this.oracleValidatorWs.ChannelClosingVerify().on('data', event => {
                const channelIndex = event.returnValues.channelIndex;
                logger.debug('Channel close verify event: ' + channelIndex);
                this._pushIfNotExists(this.activeChannelIndexes, channelIndex.toString());
            });
        }
    }

    async getPendingChannels() {
        try {
            const account = this.accounts[0];
            const [channelCount, currentBlock, expirePeriod] = await Promise.all([
                this.coordinator.channelsCount({from: account}),
                this.web3L1.eth.getBlockNumber(),
                this.ocean.cancelingRequestPeriod()
            ]);

            for (let j = 1; j <= channelCount; j++) {
                const req = await this.coordinator.channels(j, {from: account});

                // Tracking failed attempts to process channel per channelIndex.
                let failedAttemptsCount = 0;
                try {
                    failedAttemptsCount = await db.get(`failedAttempt_${j}`);
                } catch (e) {
                    // swallow
                }

                if (failedAttemptsCount < CHANNEL_FAILED_ATTEMPTS_LIMIT
                    && Number(req.status) === 0 && ((currentBlock - parseFloat(req.appliedDate.toString())) < expirePeriod)) {
                    this._pushIfNotExists(this.pendingChannelIndexes, String(j));
                } else {
                    this.pendingChannelIndexes = this.pendingChannelIndexes.filter(item => item !== String(j));
                }
            }

            logger.info("Pending channel indexes: " + this.pendingChannelIndexes);
        } catch (err) {
            logger.error('getPendingChannels failed: ' + err);
        }
    }

    async processPendingChannel(channelIndex) {
        try {
            const account = this.accounts[0];

            // if I have already answered --> exit
            const answered = await this.oracleValidator.oracleOpenChannelAnswers(channelIndex, account, {from: account});
            if (answered) {
                logger.error('Already answered');
                this.pendingChannelIndexes = this.pendingChannelIndexes.filter(item => item !== channelIndex.toString());
            }

            const [channel, currentBlock, expirePeriod] = await Promise.all([
                this.coordinator.channels(channelIndex),
                this.web3L1.eth.getBlockNumber(),
                this.ocean.cancelingRequestPeriod()
            ]);

            // if channel is already opened --> exit
            if (Number(channel.status) === 1) {
                logger.error('Channel already opened');
                this.pendingChannelIndexes = this.pendingChannelIndexes.filter(item => item !== channelIndex.toString());
            }

            // if channel expired --> exit
            if ((currentBlock - channel.creationDate) > expirePeriod) {
                logger.error('Channel expired: ' + channel);
                this.pendingChannelIndexes = this.pendingChannelIndexes.filter(item => item !== channelIndex.toString());
            }

            // Tracking failed attempts to process channel per channelIndex.
            let failedAttemptsCount = 0;
            try {
                failedAttemptsCount = await db.get(`failedAttempt_${channelIndex}`);
            } catch (e) {
                // ignore
            }

            if (failedAttemptsCount < CHANNEL_FAILED_ATTEMPTS_LIMIT) {
                // we passed all checks proceed with channel processing
                const channelPoint = channel.channelPoint.toString();
                const channelId = await this.getChannelId(channelPoint);

                if (channelId) {
                    const channelInfo = await lnd.getChannelInfo(channelId);

                    if (channelInfo && channelInfo.channel_id) {
                        const channelCapacity = channelInfo.capacity;
                        const node1PubKey = channelInfo.node1_pub;
                        const node2Pubkey = channelInfo.node2_pub;

                        const signatures = [];
                        const keyPrefix = `open_${channelId}`;

                        // fetch channel opening signatures from db
                        try {
                            logger.debug('Getting channel opening signatures from db');
                            const fetchedData = JSON.parse(await db.get(keyPrefix));
                            signatures.push(...fetchedData);
                            logger.debug('Got channel opening signatures from db');
                        } catch (e) {
                            // ignore
                            logger.debug('Signatures not found in database');
                        }

                        // Check if we have reached the consensus, then open the channel.
                        const consensusCount = signatures.length;
                        const minQuorum = await this.oracleValidator.minQuorum({from: account});

                        if (consensusCount >= minQuorum) {
                            const signaturesOnly = this._extractSignaturesOnly(signatures);

                            const txCount = await this.web3.eth.getTransactionCount(account);
                            logger.debug('processPendingChannel nonce: ' + txCount);
                            logger.info('Confirm channel opening: ' + channelId + " " + channelIndex);
                            const channelOpeningResult = await this.oracleValidator.execChannelOpening(
                                channelIndex, channelCapacity, channelId, node1PubKey, node2Pubkey, signaturesOnly, {
                                    from: account,
                                    nonce: this.web3.utils.toHex(txCount)
                                });
                            logger.info('Channel opening results: ' + 'channelId: ' + channelId + ' ' + JSON.stringify(channelOpeningResult));

                            // Channel got opened --> exit
                            this.pendingChannelIndexes = this.pendingChannelIndexes.filter(item => item !== channelIndex.toString());
                        }

                        // Consensus was not reached, request for more signatures.
                        const validatorsList = await this._getElectedValidators();

                        if (validatorsList.length > 0) {
                            const reqData = {channelIndex: channelIndex, channelId: channelId}
                            await this._processPendingSignatureRequests(validatorsList, signatures, keyPrefix, reqData, "/signChannelOpening");
                        } else {
                            logger.warn('There are no active validators YET:');
                        }
                    } else {
                        logger.warn('No such channel info found YET: ' + channelId);
                    }
                }
            }
        } catch (e) {
            await this._handleFailedChannelAttempts(channelIndex);
            if (e.message.includes('edge not found') || e.message.includes('zombie')) {
                logger.debug('ChannelInfoFailed: ' + e.message);
            } else {
                logger.error('Error: ' + e.message);
            }
        }
    }

    async openChannelRequested(capacityRequestIndex, channelPoint) {
        try {
            const account = this.accounts[0];
            const txCount = await this.web3.eth.getTransactionCount(account);
            logger.debug('openChannelRequested nonce: ' + txCount);
            await this.ocean.openChannelRequested(channelPoint.toString(), capacityRequestIndex, {
                from: account,
                nonce: this.web3.utils.toHex(txCount)
            });
        } catch (e) {
            logger.error('openChannelRequested failed: ' + e)
            throw e;
        }
    }


    /* **************************************************************
     *                       ACTIVE CHANNELS                        *
     ************************************************************** */
    async subscribeActiveChannels() {
        logger.info('subscribeActiveChannels');

        if (this.escrowWs) {
            this.escrowWs.LightningChannelOpeningConfirmed().on('data', event => {
                const channelIndex = event.returnValues.channelIndex;
                this._pushIfNotExists(this.activeChannelIndexes, channelIndex.toString());
            });
        }
    }

    async getActiveChannels() {
        try {
            const account = this.accounts[0];
            const channelCount = await this.coordinator.channelsCount({from: account});

            for (let j = 1; j <= channelCount; j++) {
                const req = await this.coordinator.channels(j, {from: account});
                if (req.status == 1) {
                    this._pushIfNotExists(this.activeChannelIndexes, String(j));
                }
            }

            logger.info("Active channel indexes: " + this.activeChannelIndexes);
        } catch (err) {
            logger.error("getActiveChannels failed: " + err);
            return (err);
        }
    }

    async processActiveChannel(channelIndex) {
        try {
            const account = this.accounts[0];

            // if I have already answered --> exit
            const answered = await this.oracleValidator.oracleCloseChannelAnswers(channelIndex, account, {from: account});
            if (answered) {
                logger.error('Already answered');
                this.activeChannelIndexes = this.activeChannelIndexes.filter(item => item !== channelIndex.toString());
            }

            // if channel is already closed --> exit
            const channel = await this.coordinator.channels(channelIndex);
            if (Number(channel.status) === 2) {
                logger.error('Channel already closed');
                this.activeChannelIndexes = this.activeChannelIndexes.filter(item => item !== channelIndex.toString());
            }

            // parse the channel point
            const channelPoint = channel.channelPoint;
            const channelPointArray = _.split(channelPoint, ':', 2);

            if (channelPointArray.length === 2) {
                // check if the txn really exists
                const txId = channelPointArray[0];
                const txIndex = parseInt(channelPointArray[1]);
                const txInfo = await btc.getTransactionInfo(txId);

                if (txInfo && txInfo.txid) {
                    const fundingOutput = await btc.getUnspentTransactionOut(txId, txIndex);
                    // no unspent transaction output
                    if (!fundingOutput) {
                        await this.channelClosed(channelIndex, txId);
                    }
                }
            }
        } catch (err) {
            if (err.message.includes('edge not found') || err.message.includes('zombie')) {
                logger.debug('ChannelInfoFailed: ' + err.message);
            } else {
                logger.error('Error:' + err.message);
            }
        }
    }

    async closeActiveProfitlessChannels() {
        logger.info('Attempt to close profitless channels');

        try {
            const account = this.accounts[0];

            const capacityRequests = [];
            const capacityRequestsCount = await this.ocean.capacityRequestsCount();

            for (let i = 1; i <= capacityRequestsCount; i++) {
                const capacityRequest = await this.ocean.capacityRequests(i);
                capacityRequests.push(capacityRequest);
            }

            const channels = [];
            const channelCount = await this.coordinator.channelsCount({from: account});

            for (let j = 1; j <= channelCount; j++) {
                const channel = await this.coordinator.channels(j, {from: account});
                channels.push(channel);
            }

            channels.forEach(channel => {
                const matchingCapacityRequest = capacityRequests.find(capReq => (capReq.channelPoint === channel.channelPoint));
                const channelReward = this.web3.utils.fromWei(channel.rewardAmount);
                const capacityReward = matchingCapacityRequest ? this.web3.utils.fromWei(matchingCapacityRequest.plennyReward) : 0;
                const remainingRewards = Number.parseFloat(channelReward) + Number.parseFloat(capacityReward);

                if (matchingCapacityRequest && account === matchingCapacityRequest.makerAddress && channel.status.toString() === '1' && remainingRewards === 0) {
                    const [channelPoint, outputIndex] = channel.channelPoint.split(':');
                    lnd.closeChannel(channelPoint, outputIndex);
                    logger.info("Attempted channel closing: " + channelPoint + ' ' + outputIndex);
                }
            });
        } catch (e) {
            logger.error('Channel closing attempt failed: ' + e);
        }
    }

    async channelClosed(channelIndex, closingTransactionId) {
        try {
            const account = this.accounts[0];
            const signatures = [];
            const keyPrefix = `close_${channelIndex}`;

            // fetch channel closing signatures from db
            try {
                logger.debug('Getting channel closing signatures from db');
                const fetchedData = JSON.parse(await db.get(keyPrefix))
                signatures.push(...fetchedData);
                logger.debug('Got channel closing signatures from db');
            } catch (e) {
                // ignore
                logger.debug('Signatures not found in database');
            }

            const consensusCount = signatures.length;
            const minQuorum = await this.oracleValidator.minQuorum({from: account});

            // Check if we have reached the consensus, then close the channel.
            if (consensusCount >= minQuorum) {
                const signaturesOnly = this._extractSignaturesOnly(signatures);

                const txCount = await this.web3.eth.getTransactionCount(account);
                logger.debug('Closing channel... tx nonce: ' + txCount);

                const channelClosingResult = await this.oracleValidator.execCloseChannel(
                    channelIndex, closingTransactionId, signaturesOnly, {
                        from: account,
                        nonce: this.web3.utils.toHex(txCount)
                    });
                logger.info('Channel closing result:' + 'channelIndex: ' + channelIndex + ' ' + JSON.stringify(channelClosingResult));

                // Channel got closed --> exit
                this.activeChannelIndexes = this.activeChannelIndexes.filter(item => item !== channelIndex.toString());
            }

            // Consensus was not reached, request for more signatures.
            const validatorsList = await this._getElectedValidators();

            if (validatorsList.length > 0) {
                const reqData = {channelIndex: channelIndex}
                await this._processPendingSignatureRequests(validatorsList, signatures, keyPrefix, reqData, "/signChannelClosing");
            } else {
                logger.warn('There are no active validators YET:');
            }

        } catch (e) {
            logger.error('channelClosed failed: ' + e);
            throw e;
        }
    }


    /* **************************************************************
     *                       CAPACITY REQUEST                       *
     ************************************************************** */
    async relayChannelOpening(nodeUrl, capacity, makerAddress, owner, nonce, signature) {
        const account = this.accounts[0];

        try {

            if (makerAddress !== account) {
                return new BadRequest('Wrong ethereum account selected.');
            }

            const makerIndex = await this.ocean.makerIndexPerAddress(makerAddress, {from: account});
            if (makerIndex <= 0) {
                return new BadRequest('User is not a Liquidity Maker.');
            }

            const makerInfo = await this.ocean.makers(makerIndex, {from: account});
            const makerLndInfo = await this.coordinator.nodes(makerInfo.makerNodeIndex.toString());
            const lndInfo = await lnd.getInfo();

            if (makerLndInfo.publicKey !== lndInfo.identity_pubkey) {
                return new BadRequest('Lightning public keys not matching.');
            }

            const txCount = await this.web3.eth.getTransactionCount(account);
            logger.debug('nonce: ' + txCount);

            return await this.ocean.requestLightningCapacity(nodeUrl, capacity, makerAddress, owner, nonce, signature, {
                from: account,
                nonce: this.web3.utils.toHex(txCount)
            });
        } catch (e) {
            logger.error('relayChannelOpening failed: ' + e);
            throw e;
        }
    }

    async subscribeCapacityRequests() {
        logger.info('subscribeCapacityRequests');

        if (this.oceanWs) {
            this.oceanWs.CapacityRequestPending().on('data', event => {
                const capacityRequestIndex = event.returnValues.capacityRequestIndex;
                const makerAddress = event.returnValues.makerAddress;

                // check if makerAddress == dapp adddress
                if (this.web3.utils.toChecksumAddress(this.accounts[0]) == makerAddress) {
                    logger.info('New Capacity Request Received');
                    this._pushIfNotExists(this.pendingCapacityIndexes, capacityRequestIndex.toString());
                }
            });
        }
    }

    async getPendingCapacityRequests() {
        logger.info('getPendingCapacityRequests');

        try {
            const account = this.accounts[0];
            const capacityRequestCounts = await this.ocean.capacityRequestsCount({from: account});

            for (let j = 1; j <= capacityRequestCounts; j++) {
                const req = await this.ocean.capacityRequests(j, {from: account});
                if (req.makerAddress == this.web3.utils.toChecksumAddress(account) && req.status == 0) {
                    this._pushIfNotExists(this.pendingCapacityIndexes, String(j));
                }
            }

            logger.info("Pending capacity indexes: " + this.pendingCapacityIndexes);
        } catch (err) {
            logger.error('getPendingCapacityRequests failed: ' + err);
        }
    }

    async processPendingCapacityRequest(capacityRequestIndex) {
        const capacityRequest = await this.ocean.capacityRequests(capacityRequestIndex);

        const nodeUrl = capacityRequest.nodeUrl;
        const capacity = parseInt(capacityRequest.capacity);

        // check status
        const status = capacityRequest.status;
        if (status > 0) {
            logger.error('Invalid capacity request: ' + capacityRequest);
            this.pendingCapacityIndexes = this.pendingCapacityIndexes.filter(item => item !== capacityRequestIndex.toString());
        }

        let savedChannelPoint;
        // check if the channel point was already saved
        try {
            logger.debug('Getting pending capacity requests from DB');
            savedChannelPoint = await db.get(capacityRequestIndex);
        } catch (e) {
            // ignore
        }

        if (savedChannelPoint) {
            try {
                await this.openChannelRequested(capacityRequestIndex, savedChannelPoint);
                this.pendingCapacityIndexes = this.pendingCapacityIndexes.filter(item => item !== capacityRequestIndex.toString());
            } catch (e) {
                logger.error(e);
                throw e;
            }
        }

        let call = lnd.openChannel(nodeUrl, capacity);
        // open channel
        await new Promise((resolve, reject) => {
            call.on('data', function (response) {
                // A response was received from the server.
                logger.info('DATA ' + this._logObject(response));

                if (response.chan_pending) {
                    // save the channel point in db
                    const fundingTxId = response.chan_pending.txid.reverse().toString('hex');
                    const outputIndex = response.chan_pending.output_index;
                    const channelPoint = fundingTxId + ":" + outputIndex;

                    // save the entry
                    logger.info('channelPoint:', channelPoint);
                    // save the channelPoint
                    db.put(capacityRequestIndex, channelPoint);

                    this.openChannelRequested(capacityRequestIndex, channelPoint).then(function (channel) {
                        db.del(capacityRequestIndex);
                        resolve(channel);
                    }.bind(this)).catch(function (err) {
                        logger.error(err);
                        reject(err);
                    });
                }
            }.bind(this));
            call.on('status', function (status) {
                // The current status of the stream.;
            });
            call.on('error', function (err) {
                // Error in stream
                logger.error('ERROR: ' + err);
                reject(err);
            });
            call.on('end', function () {
                // The server has closed the stream.
            });
        });
        this.pendingCapacityIndexes = this.pendingCapacityIndexes.filter(item => item !== capacityRequestIndex.toString());
    }


    // TODO: Refactor - implement message queue
    /* **************************************************************
     *                       LOOP NODES & CHANNELS                  *
     ************************************************************** */

    processChannels(channels, executor, delay) {
        for (let i = 0; i < channels.length; i++) {
            (function (ind) {
                setTimeout(async function () {
                    await executor(channels[i]);
                }, 1000 + (delay * ind));
            })(i);
        }
    }

    async loopPendingChannels() {
        try {
            await this.getPendingChannels();
            this.processChannels(this.pendingChannelIndexes, this.processPendingChannel.bind(this), DELAY_CHANNEL_PROCESSING);
            logger.info('DONE loopPendingChannels');
        } catch (err) {
            logger.error("Pending channel error", err);
        }
    }

    async loopActiveChannels() {
        try {
            await this.getActiveChannels();
            this.processChannels(this.activeChannelIndexes, this.processActiveChannel.bind(this), DELAY_CHANNEL_PROCESSING);
            logger.info('DONE loopActiveChannels');
        } catch (err) {
            logger.error("Active channel error", err);
        }
    }

    async loopCapacityRequests() {
        try {
            await this.getPendingCapacityRequests();
            this.processChannels(this.pendingCapacityIndexes, this.processPendingCapacityRequest.bind(this), DELAY_CHANNEL_PROCESSING);
            logger.info('DONE loopPendingCapacityRequests');
        } catch (err) {
            logger.error("Pending capacity error", err);
        }
    }

    /* **************************************************************
     *                       UTILS                                  *
     ************************************************************** */
    async getChannelId(channelPoint) {
        const channelPointArray = _.split(channelPoint, ':', 2);
        if (channelPointArray.length === 2) {
            const txId = channelPointArray[0];
            const txIndex = parseInt(channelPointArray[1]);
            const txInfo = await btc.getTransactionInfo(txId);

            if (txInfo && txInfo.txid && txInfo.blockhash) {
                // find the status and the block
                const blockHash = txInfo.blockhash;
                const blockInfo = await btc.getBlockInfo(blockHash);

                let txBlockIndex;

                if (blockInfo && blockInfo.confirmations > 0) {
                    const blockIndex = blockInfo.height;
                    const blockTxns = blockInfo.tx;
                    for (let k = 0; k < blockTxns.length; k++) {
                        if (blockTxns[k] === txId) {
                            txBlockIndex = k;
                        }
                    }

                    if (txBlockIndex) {
                        // we found a channel id:  blockIndex x txBlockIndex x txIndex;
                        const longChannelId = (BigInt(this.web3.utils.toBN(blockIndex).shln(40).toString())) |
                            (BigInt(this.web3.utils.toBN(txBlockIndex).shln(16).toString())) |
                            (BigInt(txIndex));
                        return longChannelId.toString();
                    }
                }
            }
        }
    }

    // Contracts
    async _checkAndRetrieveContract(...contracts) {
        let latest = null;

        for (const contract of contracts) {
            try {
                latest = await contract.deployed();
            } catch (e) {
                logger.error('Failed to retrieve contract.', e);
            }
        }

        return latest;
    }

    async _setContractProvider(abi, provider) {
        try {
            const c = contract(abi);
            c.setProvider(provider);

            return await this._checkAndRetrieveContract(c);
        } catch (e) {
            logger.error('Failed to set contract provider', e);
        }
    }


    // Signatures
    _extractSignaturesOnly(arr) {
        return arr.map(el => {
            if (el.hasOwnProperty('signature') && typeof el.signature !== 'undefined') {
                return el.signature.substr(0, 130) + (el.signature.substr(130) === "00" ? "1b" : "1c"); // v: 0,1 => 27,28
            }
        });
    }

    async _pendingSignatureRequests(validatorsList, signatures) {
        let pendingSignatureRequests = [];

        for (const validator of validatorsList) {
            pendingSignatureRequests = validatorsList.filter(validator => {
                if (signatures.length > 0) {
                    signatures.forEach(signature => {
                        if (signature.hasOwnProperty('address')) {
                            return validator !== signature.address;
                        }
                    });
                } else {
                    return validator;
                }
            });
        }

        return pendingSignatureRequests;
    }

    async _processPendingSignatureRequests(validatorsList, signatures, dbKeyPrefix, reqData, endpoint) {
        let _signatures = signatures;
        let pendingSignatureRequests = await this._pendingSignatureRequests(validatorsList, signatures);

        if (pendingSignatureRequests.length > 0) {

            for (const pendingSignatureRequest of pendingSignatureRequests) {
                for (const validator of validatorsList) {

                    if (pendingSignatureRequest === validator) {

                        const validatorIndexPerAddress = await this.dappFactory.validatorIndexPerAddress(pendingSignatureRequest);
                        const validatorInfo = await this.dappFactory.validators(validatorIndexPerAddress);

                        try {
                            logger.info('Requesting signature from URL: ' + validatorInfo.validatorServiceUrl + endpoint);

                            const agent = new https.Agent({
                                rejectUnauthorized: false
                            });

                            const response = await axios.post(
                                validatorInfo.validatorServiceUrl + endpoint,
                                reqData,
                                {
                                    httpsAgent: agent,
                                    headers: {'Content-Type': 'application/json'},
                                });

                            const signature = response.data.signature;

                            if (signature) {
                                logger.info('Got signature from: ' + validatorInfo.validatorServiceUrl + endpoint);
                                logger.info('Signature: ' + signature);

                                // Store the results array in database
                                _signatures.push({address: validator, signature: signature});
                                db.put(dbKeyPrefix, JSON.stringify(_signatures));
                                logger.info('Signatures stored');
                            }
                        } catch (e) {
                            // swallow exception
                            logger.error(`Failed to request signature from validator with address: ${validator} - ${e.message}`);
                        }
                    }
                }
            }
        }
    }

    // Election
    async _getElectedValidators() {
        const validatorsList = [];
        const latestElectionBlock = await this.validatorElection.latestElectionBlock();
        const validatorsCount = await this.validatorElection.getElectedValidatorsCount(latestElectionBlock);

        for (let i = 0; i < validatorsCount; i++) {
            validatorsList.push(await this.validatorElection.electedValidators(latestElectionBlock, i));
        }

        return validatorsList;
    }

    // Utils
    _logObject(obj, prefix = "") {
        for (let key in obj) {
            let value = obj[key];
            prefix += typeof value === 'object' ?
                ` ${key}:${JSON.stringify(value)},` :
                ` ${key}:${value},`;
        }
        return prefix;
    };

    async _handleFailedChannelAttempts(channelIndex) {
        let failedChannelAttempts = 0;

        try {
            failedChannelAttempts = await db.get(`failedAttempt_${channelIndex}`);
        } catch (e) {
            // ignore
        }

        logger.debug('Failed attempt count: ' + failedChannelAttempts);
        db.put(`failedAttempt_${channelIndex}`, ++failedChannelAttempts);
    }

    _pushIfNotExists(arr, value) {
        if (!arr.includes(value)) {
            arr.push(value);
        }
    }
}

module.exports = new Dlsp();
