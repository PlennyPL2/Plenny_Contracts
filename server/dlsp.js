// Import Libraries
const _ = require('lodash');
const path = require('path');
const Web3 = require('web3');
const axios = require('axios');
const https = require('https');
const cron = require('node-cron');
const contract = require("truffle-contract");
const HDWalletProvider = require('truffle-hdwallet-provider');

// Import contracts ABI's
const PlennyOceanJSON = require(path.join(__dirname, '../build/contracts/PlennyOceanV2.json'));
const PlennyDappFactoryJSON = require(path.join(__dirname, '../build/contracts/PlennyDappFactoryV2.json'));
const PlennyCoordinatorJSON = require(path.join(__dirname, '../build/contracts/PlennyCoordinator.json'));
const PlennyOracleValidatorJSON = require(path.join(__dirname, '../build/contracts/PlennyOracleValidatorV2.json'));
const PlennyValidatorElectionJSON = require(path.join(__dirname, '../build/contracts/PlennyValidatorElectionV2.json'));

// Import custom modules
const lnd = require('./lnd');
const btc = require('./btc');
const db = require('./database/db');
const {logger} = require('./utils/logger');
const {BadRequest} = require('./utils/errors');

// Wallet provider
const privateKeyProvider = new HDWalletProvider(process.env.ETH_PRIV_KEY, process.env.LOCAL_RPC_URL);
const webSocketProvider = new Web3.providers.WebsocketProvider(process.env.SOCKET_RPC_URL);

// Average daily block count
const ALLOW_AUTO_RESTART = process.env.ALLOW_AUTO_RESTART;
const RESTART_INTERVAL_SECONDS = process.env.RESTART_INTERVAL_SECONDS ? process.env.RESTART_INTERVAL_SECONDS : 3600;
const AVERAGE_DAILY_BLOCK_COUNT = process.env.AVERAGE_DAILY_BLOCK_COUNT ? process.env.AVERAGE_DAILY_BLOCK_COUNT : 6500;

// Validator & Maker
class Dlsp {

    constructor() {
        // set props normally
        // nothing async can go here
        this.web3 = new Web3(privateKeyProvider);

        this.pendingChannelTimers = new Map();
        this.activeChannelTimers = new Map();
        this.pendingCapacityTimers = new Map();
    }

    async init() {
        // Get accounts
        this.accounts = await this.web3.eth.getAccounts();

        // Get contract websocket instances
        const [oceanWs, escrowWs, dappFactoryWs, oracleValidatorWs, validatorElectionWS] = await Promise.all([
            this._setContractProvider(PlennyOceanJSON, webSocketProvider),
            this._setContractProvider(PlennyCoordinatorJSON, webSocketProvider),
            this._setContractProvider(PlennyDappFactoryJSON, webSocketProvider),
            this._setContractProvider(PlennyOracleValidatorJSON, webSocketProvider),
            this._setContractProvider(PlennyValidatorElectionJSON, webSocketProvider)
        ]);
        this.oceanWs = oceanWs;
        this.escrowWs = escrowWs;
        this.dappFactoryWs = dappFactoryWs;
        this.oracleValidatorWs = oracleValidatorWs;
        this.validatorElectionWS = validatorElectionWS;

        // Get contract instances
        const [ocean, coordinator, dappFactory, oracleValidator, validatorElection] = await Promise.all([
            this._setContractProvider(PlennyOceanJSON, privateKeyProvider),
            this._setContractProvider(PlennyCoordinatorJSON, privateKeyProvider),
            this._setContractProvider(PlennyDappFactoryJSON, privateKeyProvider),
            this._setContractProvider(PlennyOracleValidatorJSON, privateKeyProvider),
            this._setContractProvider(PlennyValidatorElectionJSON, privateKeyProvider)
        ]);
        this.ocean = ocean;
        this.coordinator = coordinator;
        this.dappFactory = dappFactory;
        this.oracleValidator = oracleValidator;
        this.validatorElection = validatorElection;

        // track timers
        const cronTimers = '*/10 * * * *';

        this.taskLoopPendingChannels = cron.schedule(cronTimers, () => {
            this.loopPendingChannels();
        });

        this.taskLoopActiveChannels = cron.schedule(cronTimers, () => {
            this.loopActiveChannels();
        });

        this.taskLoopCapacityRequests = cron.schedule(cronTimers, () => {
            this.loopCapacityRequests();
        });

        // Start the services
        await this.startTasks();

        // Restart periodically
        if (ALLOW_AUTO_RESTART === 'true') {
            setInterval(() => {
                this.restartTasks();
            }, RESTART_INTERVAL_SECONDS * 1000);
        }

        // Restart the service on new validator election cycle
        if (this.validatorElectionWS) {
            this.validatorElectionWS.NewValidators().on('data', event => {
                if (event.returnValues.newValidators > 0) {
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
        }
    }


    /* **************************************************************
     *                       PENDING CHANNELS                        *
     ************************************************************** */
    async processPendingChannel(channelIndex) {
        try {
            const account = this.accounts[0];
            const latestElectionBlock = await this.validatorElection.latestElectionBlock();

            // if I am not an elected validator --> exit
            const isElectedValidator = await this.validatorElection.validators(latestElectionBlock, account, {from: account});
            if (!isElectedValidator) {
                logger.info('Not an elected validator');
                return true;
            }

            // if I have already answered --> exit
            const answered = await this.oracleValidator.oracleOpenChannelAnswers(channelIndex, account, {from: account});
            if (answered) {
                logger.info('Already answered');
                return true;
            }

            // if channel expired --> exit
            const [channel, currentBlock] = await Promise.all([
                this.coordinator.channels(channelIndex),
                this.web3.eth.getBlockNumber()
            ]);

            if ((currentBlock - channel.creationDate) > AVERAGE_DAILY_BLOCK_COUNT) {
                logger.info('Channel expired: ' + channel);
                return true;
            }

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
                        logger.info('Getting channel opening signatures from db');
                        const fetchedData = JSON.parse(await db.get(keyPrefix))
                        signatures.push(...fetchedData);
                        logger.info('Got channel opening signatures from db');
                    } catch (e) {
                        // ignore
                        logger.info('Signatures not found in database');
                    }

                    // Check if we have reached the consensus, then open the channel.
                    const consensusCount = signatures.length;
                    const minQuorum = await this.oracleValidator.minQuorum({from: account});

                    if (consensusCount >= minQuorum) {
                        const signaturesOnly = this._extractSignaturesOnly(signatures);

                        logger.info('confirmChannelOpening: ' + channelId + " " + channelIndex);
                        const channelOpeningResult = await this.oracleValidator.execChannelOpening(
                            channelIndex, channelCapacity, channelId, node1PubKey, node2Pubkey, signaturesOnly, {from: account});
                        logger.info('Channel opening results: ' + 'channelId: ' + channelId + ' ' + JSON.stringify(channelOpeningResult));

                        // Channel got opened --> exit
                        return true;
                    }

                    // Consensus was not reached, request for more signatures.
                    const validatorsList = await this._getElectedValidators();

                    if (validatorsList.length > 0) {
                        const reqData = {channelIndex: channelIndex, channelId: channelId}
                        await this._processPendingSignatureRequests(validatorsList, signatures, keyPrefix, reqData, "/signChannelOpening");
                    } else {
                        logger.info('There are no active validators YET:');
                    }
                } else {
                    logger.info('No such channel info found YET: ' + channelId);
                }
            } else {
                logger.info('No such channel found YET: ' + channelPoint);
            }
        } catch (e) {
            logger.error('Error:' + e.message);
        }
    }

    async lightningChannelPending(channelIndex) {
        // for every channelIndex, check if there is an existing timer; if not create one
        let timer = this.pendingChannelTimers.get(channelIndex.toString());
        if (!timer) {
            timer = setTimeout(async function myTimer() {
                this.processPendingChannel(channelIndex).then(function (result) {
                    if (!result) {
                        timer = setTimeout(myTimer.bind(this), 60000);
                        this.pendingChannelTimers.set(channelIndex.toString(), timer);
                    } else {
                        clearTimeout(timer);
                        this.pendingChannelTimers.delete(channelIndex.toString());
                    }
                }.bind(this)).catch((err) => {
                    timer = setTimeout(myTimer.bind(this), 60000);
                    this.pendingChannelTimers.set(channelIndex.toString(), timer);
                });
            }.bind(this), 5000);

            this.pendingChannelTimers.set(channelIndex.toString(), timer);
        }
        return timer;
    }

    async getPendingChannels() {
        logger.info('getPendingChannels');
        try {
            const account = this.accounts[0];
            const pendingChannelsIndex = [];
            const [channelCount, currentBlock] = await Promise.all([
                this.coordinator.channelsCount({from: account}),
                this.web3.eth.getBlockNumber()
            ]);

            for (let j = 1; j <= channelCount; j++) {
                const req = await this.coordinator.channels(j, {from: account});

                if (req.status == 0 && ((currentBlock - parseFloat(req.appliedDate.toString())) < AVERAGE_DAILY_BLOCK_COUNT)) {
                    pendingChannelsIndex.push(j);
                }
            }

            logger.info("Pending channel indexes: " + pendingChannelsIndex);
            const promises = _.map(pendingChannelsIndex, async (channelIndex) => {

                let timer = await this.lightningChannelPending(channelIndex);
                return new Promise((res, rej) => {
                    res(timer);
                });
            });

            return await Promise.all(promises);
        } catch (err) {
            logger.error('getPendingChannels failed: ' + err);
            return err;
        }
    }

    async subscribePendingChannels() {
        logger.info('subscribePendingChannels');

        if (this.escrowWs) {
            this.escrowWs.LightningChannelOpeningPending().on('data', event => {
                const channelIndex = event.returnValues.channelIndex;
                this.lightningChannelPending(channelIndex);
            });
        }

        if (this.oracleValidatorWs) {
            this.oracleValidatorWs.ChannelOpeningCommit().on('data', event => {
                const channelIndex = event.returnValues.channelIndex;
                logger.info('Channel commit event: ' + channelIndex);
                this.lightningChannelPending(channelIndex);
            });
            this.oracleValidatorWs.ChannelOpeningVerify().on('data', event => {
                const channelIndex = event.returnValues.channelIndex;
                logger.info('Channel verify event: ' + channelIndex);
                this.lightningChannelPending(channelIndex);
            });
            this.oracleValidatorWs.ChannelClosingCommit().on('data', event => {
                const channelIndex = event.returnValues.channelIndex;
                logger.info('Channel close commit event: ' + channelIndex);
                this.lightningChannelActive(channelIndex);
            });
            this.oracleValidatorWs.ChannelClosingVerify().on('data', event => {
                const channelIndex = event.returnValues.channelIndex;
                logger.info('Channel close verify event: ' + channelIndex);
                this.lightningChannelActive(channelIndex);
            });
        }
    }

    async openChannelRequested(capacityRequestIndex, channelPoint) {
        try {
            const account = this.accounts[0];
            const txCount = await this.web3.eth.getTransactionCount(account, 'pending');
            logger.info('openChannelRequested nonce: ' + txCount);
            const options = {from: account, nonce: this.web3.utils.toHex(txCount)};
            await this.ocean.openChannelRequested(channelPoint.toString(), capacityRequestIndex, options);
        } catch (e) {
            logger.error('openChannelRequested failed: ' + e)
            throw e;
        }
    }


    /* **************************************************************
     *                       ACTIVE CHANNELS                        *
     ************************************************************** */
    async processActiveChannel(channelIndex) {
        try {
            const account = this.accounts[0];

            // if I am not an elected validator --> exit
            const latestElectionBlock = await this.validatorElection.latestElectionBlock();
            const isElectedValidator = await this.validatorElection.validators(latestElectionBlock, account, {from: account});
            if (!isElectedValidator) {
                logger.error('Not an elected validator');
                return true;
            }

            // if I have already answered --> exit
            const answered = await this.oracleValidator.oracleCloseChannelAnswers(channelIndex, account, {from: account});
            if (answered) {
                logger.error('Already answered');
                return true;
            }

            const channel = await this.coordinator.channels(channelIndex);
            const channelPoint = channel.channelPoint;
            // parse the channel point
            const channelPointArray = _.split(channelPoint, ':', 2);

            if (channelPointArray.length === 2) {
                logger.info("Channel point: " + channelPointArray);

                // check if the txn really exists
                const txId = channelPointArray[0];
                const txIndex = parseInt(channelPointArray[1]);
                const txInfo = await btc.getTransactionInfo(txId);

                if (txInfo && txInfo.txid) {
                    const fundingOutput = await btc.getUnspentTransactionOut(txId, txIndex);
                    // no unspent transaction output
                    if (!fundingOutput) {
                        return await this.channelClosed(channelIndex, txId);
                    }
                }
            }
        } catch (err) {
            logger.error(err);
        }
    }

    async lightningChannelActive(channelIndex) {
        // for every channelIndex, check if there is an existing timer; if not create one
        let timer = this.activeChannelTimers.get(channelIndex.toString());
        if (!timer) {
            timer = setTimeout(async function myTimer() {
                this.processActiveChannel(channelIndex).then(function (result) {
                    if (!result) {
                        timer = setTimeout(myTimer.bind(this), 60000);
                        this.activeChannelTimers.set(channelIndex.toString(), timer);
                    } else {
                        clearTimeout(timer);
                        this.activeChannelTimers.delete(channelIndex.toString());
                    }
                }.bind(this)).catch((err) => {
                    timer = setTimeout(myTimer.bind(this), 60000);
                    this.activeChannelTimers.set(channelIndex.toString(), timer);
                });
            }.bind(this), 5000);

            this.activeChannelTimers.set(channelIndex.toString(), timer);
        }
        return timer;
    }

    async getActiveChannels() {
        logger.info('getActiveChannels');

        try {
            const account = this.accounts[0];
            const activeChannelsIndex = [];
            const channelCount = await this.coordinator.channelsCount({from: account});

            for (let j = 1; j <= channelCount; j++) {
                const req = await this.coordinator.channels(j, {from: account});
                if (req.status == 1) {
                    activeChannelsIndex.push(j);
                }
            }

            logger.info("Active channel indexes: " + activeChannelsIndex);

            // check if some of the channels have been closed
            const promises = _.map(activeChannelsIndex, async (channelIndex) => {
                let timer = await this.lightningChannelActive(channelIndex);
                return new Promise((res, rej) => {
                    res(timer)
                })
            });

            return await Promise.all(promises);
        } catch (err) {
            logger.error("getActiveChannels failed: " + err);
            return (err);
        }
    }

    async subscribeActiveChannels() {
        logger.info('subscribeActiveChannels');

        if (this.escrowWs) {
            this.escrowWs.LightningChannelOpeningConfirmed().on('data', event => {
                const channelIndex = event.returnValues.channelIndex;
                logger.info('ON CHANNEL OPENING EVENT: ' + channelIndex)
                this.lightningChannelActive(channelIndex);
            });
        }
    }

    async channelClosed(channelIndex, closingTransactionId) {
        try {
            const account = this.accounts[0];
            const signatures = [];
            const keyPrefix = `close_${channelIndex}`;

            // fetch channel closing signatures from db
            try {
                logger.info('Getting channel closing signatures from db');
                const fetchedData = JSON.parse(await db.get(keyPrefix))
                signatures.push(...fetchedData);
                logger.info('Got channel closing signatures from db');
            } catch (e) {
                // ignore
                logger.info('Signatures not found in database');
            }

            const consensusCount = signatures.length;
            const minQuorum = await this.oracleValidator.minQuorum({from: account});

            // Check if we have reached the consensus, then close the channel.
            if (consensusCount >= minQuorum) {
                const signaturesOnly = this._extractSignaturesOnly(signatures);

                logger.info('Closing channel...');
                const txCount = await this.web3.eth.getTransactionCount(account, 'pending');
                logger.info('nonce: ' + txCount);

                const channelClosingResult = await this.oracleValidator.execCloseChannel(
                    channelIndex, closingTransactionId, signaturesOnly, {from: account});
                logger.info('Channel closing result:' + 'channelIndex: ' + channelIndex + ' ' + JSON.stringify(channelClosingResult));

                // Channel got closed --> exit
                return true;
            }

            // Consensus was not reached, request for more signatures.
            const validatorsList = await this._getElectedValidators();

            if (validatorsList.length > 0) {
                const reqData = {channelIndex: channelIndex}
                await this._processPendingSignatureRequests(validatorsList, signatures, keyPrefix, reqData, "/signChannelClosing");
            } else {
                logger.info('There are no active validators YET:');
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

            const txCount = await this.web3.eth.getTransactionCount(account, 'pending');
            logger.info('nonce: ' + txCount);

            return await this.ocean.requestLightningCapacity(nodeUrl, capacity, makerAddress, owner, nonce, signature, {
                from: account,
                nonce: this.web3.utils.toHex(txCount)
            });
        } catch (e) {
            logger.error('relayChannelOpening failed: ' + e);
            throw e;
        }
    }

    async processPendingCapacityRequest(capacityRequestIndex) {
        const capacityRequest = await this.ocean.capacityRequests(capacityRequestIndex);

        const nodeUrl = capacityRequest.nodeUrl;
        const capacity = parseInt(capacityRequest.capacity);

        // check status
        const status = capacityRequest.status;
        if (status > 0) {
            logger.info('Invalid capacity request: ' + capacityRequest);
            return true;
        }

        let savedChannelPoint;
        // check if the channel point was already saved
        try {
            logger.info('Getting from DB');
            savedChannelPoint = await db.get(capacityRequestIndex);
        } catch (e) {
            // ignore
        }

        if (savedChannelPoint) {
            try {
                await this.openChannelRequested(capacityRequestIndex, savedChannelPoint);
                return true;
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
        return true;
    }

    async capacityRequestPending(capacityRequestIndex) {
        // for every capacityRequestIndex, check if there is an existing timer; if not create one
        let timer = this.pendingCapacityTimers.get(capacityRequestIndex.toString());
        if (!timer) {
            timer = setTimeout(async function myTimer() {
                this.processPendingCapacityRequest(capacityRequestIndex).then(function (result) {
                    if (!result) {
                        timer = setTimeout(myTimer.bind(this), 60000);
                        this.pendingCapacityTimers.set(capacityRequestIndex.toString(), timer);
                    } else {
                        clearTimeout(timer);
                        this.pendingCapacityTimers.delete(capacityRequestIndex.toString());
                    }
                }.bind(this)).catch((err) => {
                    timer = setTimeout(myTimer.bind(this), 60000);
                    this.pendingCapacityTimers.set(capacityRequestIndex.toString(), timer);
                });
            }.bind(this), 5000);

            this.pendingCapacityTimers.set(capacityRequestIndex.toString(), timer);
        }
        return timer;
    }

    async getPendingCapacityRequests() {
        logger.info('getPendingCapacityRequests');

        try {
            const account = this.accounts[0];
            const pendingCapacityIndexes = [];
            const capacityRequestCounts = await this.ocean.capacityRequestsCount({from: account});

            for (let j = 1; j <= capacityRequestCounts; j++) {
                const req = await this.ocean.capacityRequests(j, {from: account});
                if (req.makerAddress == this.web3.utils.toChecksumAddress(account) && req.status == 0) {
                    pendingCapacityIndexes.push(j);
                }
            }

            logger.info("Pending capacity indexes: " + pendingCapacityIndexes);
            const promises = _.map(pendingCapacityIndexes, async (capacityRequestIndex) => {

                let timer = await this.capacityRequestPending(capacityRequestIndex);
                return new Promise((res, rej) => {
                    res(timer)
                })
            });

            return await Promise.all(promises);
        } catch (err) {
            logger.error('getPendingCapacityRequests failed: ' + err);
            return err;
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
                    this.capacityRequestPending(capacityRequestIndex);
                }
            });
        }
    }


    // TODO: Refactor - implement message queue
    /* **************************************************************
     *                       LOOP NODES & CHANNELS                  *
     ************************************************************** */

    async loopPendingChannels() {
        try {
            await this.getPendingChannels();
            logger.info('DONE loopPendingChannels');
        } catch (err) {
            logger.error("pending channel error", err);
        }
    }

    async loopActiveChannels() {
        try {
            await this.getActiveChannels();
            logger.info('DONE loopActiveChannels');
        } catch (err) {
            logger.error("Active channel error", err);
        }
    }

    async loopCapacityRequests() {
        try {
            await this.getPendingCapacityRequests();
            logger.info('DONE loopPendingCapacityRequests');
        } catch (err) {
            logger.error("Pending capacity error", err);
        }
    }

    async startTasks() {
        const account = this.accounts[0];
        const [isOracleValidator, isMaker] = await Promise.all([
            this.dappFactory.isOracleValidator(account, {from: account}),
            this.ocean.makerIndexPerAddress(account, {from: account})
        ]);

        if (isOracleValidator > 0) {
            logger.info('----Running oracle service----');
            await this.subscribePendingChannels();
            await this.subscribeActiveChannels();

            await this.loopActiveChannels();
            this.taskLoopActiveChannels.start();

            await this.loopPendingChannels();
            this.taskLoopPendingChannels.start();
        }

        if (isMaker > 0) {
            logger.info('----Running maker scheduler----');
            await this.subscribeCapacityRequests();
            await this.loopCapacityRequests();
            this.taskLoopCapacityRequests.start();
        }
    }

    stopTasks() {
        this.taskLoopPendingChannels.stop();
        this.taskLoopActiveChannels.stop();
        this.taskLoopCapacityRequests.stop();
    }

    async restartTasks() {
        logger.info('---Restarting scheduler----');
        this.stopTasks();
        await this.startTasks();
    }

    /* **************************************************************
     *                       UTILS                                  *
     ************************************************************** */
    async getChannelId(channelPoint) {
        const channelPointArray = _.split(channelPoint, ':', 2);
        if (channelPointArray.length == 2) {
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
                        if (blockTxns[k] == txId) {
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
            } catch(e) {
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
                            logger.info('Got signature from: ' + validatorInfo.validatorServiceUrl + endpoint, 'SIGNATURE', signature);

                            _signatures.push({address: validator, signature: signature});
                        } catch (e) {
                            // swallow exception
                            logger.error('Failed to request signature from validator with address: ' + validator, e.message);
                        }
                    }
                }
            }
        }

        // Store the results array in database
        db.put(dbKeyPrefix, JSON.stringify(_signatures));
        logger.info('Signatures stored');
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
}

module.exports = new Dlsp();
