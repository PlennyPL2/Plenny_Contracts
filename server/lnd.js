const fs = require("fs");
const grpc = require('grpc');
const {logger} = require('./utils/logger');

// Due to updated ECDSA generated tls.cert we need to let gprc know that
// we need to use that cipher suite otherwise there will be a handshake
// error when we communicate with the lnd rpc server.
process.env.GRPC_SSL_CIPHER_SUITES = 'HIGH+ECDSA'

// Notes: rpc expects a request object and a callback, we promisify the callbacks.
// grpc library does not support ES6 async/await.
class Lnd {

    constructor() {
        this.lnrpc = grpc.load("rpc.proto").lnrpc;
        this.credentials = this._getCredentials();
    }

    init() {
        this._unlockWallet();
    }

    async getInfo() {
        logger.info('Getting LND info...');

        return new Promise((resolve, reject) => {
            this.client.getInfo({}, (err, res) => {
                if (!err) {
                    resolve(res);
                } else {
                    logger.error('GetInfoFailed', err);
                    reject(err);
                }
            });
        });
    };

    async getChannelInfo(channelId) {
        logger.info('Getting LND channel info');

        return new Promise((resolve, reject) => {
            this.client.getChanInfo({chan_id: channelId}, (err, res) => {
                if (!err) {
                    resolve(res);
                } else {
                    logger.error('GetChanInfoFailed', err);
                    reject(err);
                }
            });
        });
    }

    getLightningNodeInfo() {
        logger.info('Getting Node info');

        return new Promise(async (resolve, reject) => {
            const node = await this.getInfo();
            this.client.getNodeInfo(node.identity_pubkey, (err, res) => {
                if (!err) {
                    let nodeInfo = {
                        numberOfChannels: res.num_channels,
                        totalCapacity: res.total_capacity,
                        connectedNodes: node.num_peers
                    };
                    resolve(nodeInfo);
                } else {
                    logger.error('GetWalletBalanceFailed', err);
                    reject(err);
                }
            });
        });
    }

    async connectPeer(nodePubKey, host) {
        logger.info("Connecting peer: " + nodePubKey + "@" + host);

        return new Promise((resolve, reject) => {

            let request = {
                addr: {pubkey: nodePubKey, host: host},
                perm: true
            };

            this.client.connectPeer(request, (err, res) => {
                if (!err) {
                    resolve(res);
                }

                if (err && err.details.includes('already connected to peer:')) {
                    logger.info('already connected to peer.');
                    resolve();
                } else {
                    logger.error('connectPeer failed', err);
                    reject(err);
                }
            });
        });
    }

    openChannel(nodeUrl, capacity) {
        logger.info('Opening channel');

        let request = {
            node_pubkey: Buffer.from(nodeUrl, 'hex'),
            node_pubkey_string: nodeUrl,
            local_funding_amount: capacity,
            target_conf: 6
        };

        return this.client.openChannel(request);
    }

    async listChannels() {
        logger.info('Listing LND channels');

        return new Promise((resolve, reject) => {
            this.client.listChannels({}, (err, res) => {
                if (!err) {
                    resolve(res);
                } else {
                    logger.error('LND listChannelFailed:', err);
                    reject(err);
                }
            });
        });
    }

    async getWalletBalance() {
        logger.info('Getting LND wallet balance');

        return new Promise((resolve, reject) => {
            this.client.walletBalance({}, (err, res) => {
                if (!err) {
                    resolve(res);
                } else {
                    logger.error('GetWalletBalanceFailed', err);
                    reject(err);
                }
            });
        });
    }

    // SSL Certificate
    _readAdminMacaroonFile() {
        let macaroon;

        if (process.env.LND_ADMIN_MACAROON_HEX) {
            macaroon = process.env.LND_ADMIN_MACAROON_HEX;
        } else {
            const m = fs.readFileSync(process.env.LND_ADMIN_MACAROON);
            macaroon = m.toString('hex');
        }

        return macaroon;
    }

    _readSslFile() {
        // build ssl credentials using the cert the same as before
        let lndCert;

        if (process.env.LND_TLS_CERT_HEX) {
            lndCert = Buffer.from(process.env.LND_TLS_CERT_HEX, "hex");
        } else {
            lndCert = fs.readFileSync(process.env.LND_TLS_CERT);
        }

        return lndCert;
    }

    _buildMacaroonCredentials() {
        // build meta data credentials
        const metadata = new grpc.Metadata();
        metadata.add('macaroon', this._readAdminMacaroonFile());

        return grpc.credentials.createFromMetadataGenerator(
            (_args, callback) => callback(null, metadata)
        );
    }

    _buildSslCredentials() {
        // build ssl credentials using the cert the same as before
        return grpc.credentials.createSsl(this._readSslFile());
    }

    _getCredentials() {
        // combine the cert credentials and the macaroon auth credentials
        // such that every call is properly encrypted and authenticated
        logger.info('Reading certificate credentials...');
        return grpc.credentials.combineChannelCredentials(this._buildSslCredentials(), this._buildMacaroonCredentials());
    }

    _unlockWallet() {
        const passByte = Buffer.from(process.env.LND_WALLET_PASS);

        new this.lnrpc.WalletUnlocker(process.env.LND_HOST_PORT, this.credentials)
            .unlockWallet({wallet_password: passByte}, (unlockerr, unlockres) => {
                if (!unlockerr) {
                    logger.info('UnlockWallet:', unlockres);
                } else if (unlockerr.toString() === 'Error: 12 UNIMPLEMENTED: unknown service lnrpc.WalletUnlocker') {
                    logger.info('Wallet already unlocked');
                } else {
                    logger.error('UnlockWalletFailed:', unlockerr);
                }

                // test client info
                this.client = new this.lnrpc.Lightning(process.env.LND_HOST_PORT, this.credentials);
                this.client.getInfo({}, (err, res) => {
                    if (!err) {
                        logger.info('Wallet unlocked check & GetInfo:', res);
                    } else {
                        logger.error('GetInfoFailed:', err);
                    }
                });
            });
    }
}

module.exports = new Lnd();