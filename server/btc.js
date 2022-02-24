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
            const info = await this.client.getBlockchainInfo();
            logger.info('GetInfo:', info)
        } catch (err) {
            logger.error('GetInfo Failed:', err);
        }
    }

    async getBlockchainInfo() {
        try {
            return await this.client.getBlockchainInfo();
        } catch (err) {
            logger.error('Getting Blockchain info error:', err);
        }
    }

    async getTransactionInfo(txId) {
        try {
            return await this.client.command('getrawtransaction', txId, true);
        } catch (err) {
            logger.error('Getting BTC tx info error:', err);
        }
    }

    async getBlockInfo(blockHash) {
        try {
            return await this.client.command('getblock', blockHash, 1)
        } catch (err) {
            logger.error('Getting BTC block info error:', err);
        }
    }

    async getUnspentTransactionOut(txId, index) {
        try {
            return await this.client.command('gettxout', txId, index, false);
        } catch (err) {
            logger.error("Getting BTC unspent info error:", err);
        }
    }
}

module.exports = new Btc();