// Import Libraries
require('dotenv').config();
const fs = require('fs');
const cors = require('cors');
const path = require('path');
const Web3 = require('web3');
const https = require('https');
const morgan = require('morgan');
const express = require('express');
const compression = require('compression');
const contract = require("truffle-contract");
const HDWalletProvider = require('truffle-hdwallet-provider');

// Import custom modules
const lnd = require('./lnd');
const btc = require('./btc');
const plennyDLSP = require('./dlsp');
const {logger, accessLogStream} = require('./utils/logger');
const handleErrors = require('./middleware/handleErrors');

// Get contracts ABI
const PlennyCoordinatorJSON = require(path.join(__dirname, '../build/contracts/PlennyCoordinator.json'));

// Instantiate web3 provider
const privateKeyProvider = new HDWalletProvider(process.env.ETH_PRIV_KEY, process.env.LOCAL_RPC_URL);
web3 = new Web3(privateKeyProvider);

// https options use with valid certificate
const options = {
    key: fs.readFileSync(path.resolve(__dirname, "./certificates/key.pem")),
    cert: fs.readFileSync(path.resolve(__dirname, "./certificates/cert.pem"))
};

// Set server ports
const PORT = process.env.PORT || 3001;

// Restart Plenny services interval
const ALLOW_AUTO_RESTART = process.env.ALLOW_AUTO_RESTART;

// Create a new Express application and Configure it
const app = express();
// setup logger
app.use(morgan("combined"));
// log all requests to access.log
app.use(morgan('combined', {stream: accessLogStream}));
app.use(express.static(path.join(__dirname + "/public")));
app.use(express.urlencoded({extended: true}));
app.use(express.json());
app.use(compression());
app.use(cors());

process.on('uncaughtException', (err) => {
    logger.error('There was an uncaught error', err);
    process.exit(1); //mandatory (as per the Node docs)
});

process.on('unhandledRejection', error => {
    logger.error('Unhandled rejection: ', error);
});

// Configure Routes
app.get('/', (req, res) => {
    return res.send('Received a GET HTTP method');
});

app.get('/lndInfo', async (req, res, next) => {

    try {
        const lndInfo = await lnd.getLightningNodeInfo();
        res.status(200).json(lndInfo);
    } catch (error) {
        return next(error);
    }

});

app.get('/healthcheck', async (req, res, next) => {

    try {
        const [lndInfo, btcInfo] = await Promise.all([
            lnd.getInfo(),
            btc.getBlockchainInfo()
        ]);

        res.status(200).json({lnd: lndInfo, btc: btcInfo});
    } catch (error) {
        logger.error('Test connection failed:', error);
        return next(error);
    }

});

app.get('/walletbalance', async (req, res, next) => {
    try {
        const lndInfo = await lnd.getWalletBalance();
        res.status(200).json(lndInfo);
    } catch (error) {
        logger.error('Get wallet balance failed:', error);
        return next(error);
    }
});

app.get('/restart', async function (req, res, next) {
    if (ALLOW_AUTO_RESTART === 'true') {
        try {
            const [, lndInfo, btcInfo] = await Promise.all([
                plennyDLSP.restartTasks(),
                lnd.getInfo(),
                btc.getBlockchainInfo()
            ]);

            res.status(200).json({
                serverStatus: 'online',
                message: 'Server restarted successfully',
                lnd: lndInfo,
                btc: btcInfo
            });
        } catch (error) {
            logger.error('Server restart failed: ' + error);
            return next(error);
        }
    } else {
        res.status(403).send('Not allowed');
    }
});

app.post('/relayChannelOpening', async (req, res, next) => {
    let txRequest = req.body;

    try {
        const {nodeUrl, capacity, makerAddress, owner, nonce, signature} = txRequest;

        // first check if the lnd has enough capacity to process the request
        const walletBalance = await lnd.getWalletBalance();
        if (walletBalance.total_balance < capacity) {
            logger.error("Maker's LND has not enough wallet balance.");
            return res.status(400).json({message: "Maker's LND has not enough wallet balance."});
        }

        // parseNodeUrl and try to connect to the peer
        let publicKey = nodeUrl.split('@')[0];
        let host = nodeUrl.split('@')[1];
        await lnd.connectPeer(publicKey, host);

        // then relay the transaction
        const relayedResult = await plennyDLSP.relayChannelOpening(nodeUrl, capacity, makerAddress, owner, nonce, signature);
        res.status(200).json(relayedResult);

    } catch (error) {
        logger.error('Relay channel opening failed:', error);
        return next(error);
    }
});

app.post('/signChannelOpening', async (req, res, next) => {

    const {channelIndex, channelId} = req.body;

    try {
        const account = (await web3.eth.getAccounts())[0];

        const channelInfo = await lnd.getChannelInfo(channelId);

        const hashKey = web3.utils.soliditySha3(
            {t: 'uint256', v: channelIndex},
            {t: 'uint256', v: channelInfo.capacity},
            {t: 'uint256', v: channelInfo.channel_id},
            {t: 'string', v: channelInfo.node1_pub},
            {t: 'string', v: channelInfo.node2_pub}
        );

        const signature = await web3.eth.sign(hashKey, account);

        res.status(200).json({signature});
    } catch (error) {
        logger.error('Signing the channel opening tx failed:', error);
        return next(error);
    }

});

app.post('/signChannelClosing', async (req, res, next) => {

    const {channelIndex} = req.body;

    try {
        // get contract instance
        const plennyCoordinator = contract(PlennyCoordinatorJSON);
        plennyCoordinator.setProvider(privateKeyProvider);
        const coordinatorInstance = await plennyCoordinator.deployed();

        // find the channel point
        const channel = await coordinatorInstance.channels(channelIndex);
        const channelPoint = channel.channelPoint;

        // parse the channel point
        const channelPointArray = channelPoint.split(':', 2);

        if (channelPointArray.length !== 2) {
            return res.status(404).json({message: 'No valid channel point found'});
        }

        // check if the txn really exists
        const [txId, outputIndex] = channelPointArray;
        const txInfo = await btc.getTransactionInfo(txId);

        if (!txInfo && !txInfo.txid) {
            return res.status(404).json({message: 'No transaction info found'});
        }

        const fundingOutput = await btc.getUnspentTransactionOut(txId, Number.parseInt(outputIndex));

        if (!fundingOutput) {
            const account = (await web3.eth.getAccounts())[0];
            const hashKey = web3.utils.soliditySha3(
                {t: 'uint256', v: channelIndex},
                {t: 'string', v: txId}
            );

            const signature = await web3.eth.sign(hashKey, account);

            return res.status(200).json({signature});
        }
    } catch (error) {
        logger.error('Signing the channel closing tx failed:', error);
        return next(error);
    }

});

// Handle method not allowed.
app.all(
    ['/lndInfo', '/healthcheck', '/walletbalance'], (req, res, next) => {
        logger.info('Method not allowed');
        res.status(405).send('Method not allowed');
    }
);

// Handle method not allowed.
app.all(
    ['/relayChannelOpening', '/signChannelOpening', '/signChannelClosing'], (req, res, next) => {
        logger.info('Method not allowed');
        res.status(405).send('Method not allowed');
    }
);

// Handle all other errors
app.use(handleErrors);

// Creates the HTTPS server instance
const sslServer = https.createServer(options, app);

const startServer = (server) => {
    server.listen(PORT, async () => {
        console.log(`
* **************************************************************
*                       Plenny Service started.                *
************************************************************** *`);
        try {
            const host = server.address().address;
            const port = server.address().port;
            logger.debug(`Plenny DLSP server listening at ${host}:${port}`);
            logger.info(`Plenny DLSP server listening at ${host}:${port}`);

            await Promise.all([lnd.init(), btc.init(), plennyDLSP.init()]);
        } catch (e) {
            logger.error(`Error starting the Plenny Service: ` + JSON.stringify(e));
        }
    });
}

// Starts the HTTPS server
startServer(sslServer);