const Client = require('bitcoin-core');
const {logger} = require('./utils/logger');

const clientConfig = {
    host: process.env.BTC_HOST,
    port: process.env.BTC_PORT,
    username: process.env.BTC_USERNAME,
    password: process.env.BTC_PASSWORD,
    version: process.env.BTC_VERSION,
    network: process.env.BTC_NETWORK
}

class Btc {
    constructor() {
        this.client = new Client(clientConfig);
    }

    async init() {
        try {
            return await this.client.getBlockchainInfo();
        } catch (err) {
            logger.error('GetInfo Failed: ' + err);
        }
    }

    async getBlockchainInfo() {
        try {
            return await this.client.getBlockchainInfo();
        } catch (err) {
            logger.error('Getting Blockchain info failed: ' + err);
        }
    }

    async getTransactionInfo(txId) {
        return await this.client.command('getrawtransaction', txId, true);
    }

    async getBlockInfo(blockHash) {
        try {
            return await this.client.command('getblock', blockHash, 1)
        } catch (err) {
            logger.error('Getting BTC block info failed: ' + err);
        }
    }

    async getUnspentTransactionOut(txId, index) {
        try {
            return await this.client.command('gettxout', txId, index, false);
        } catch (err) {
            logger.error("Getting BTC unspent info failed: " + err);
        }
    }
}

module.exports = new Btc();