const logger = require('logops');
const PlennyDistribution = artifacts.require('PlennyDistribution');
const Web3 = require('web3');

const envParsed = process.env;

module.exports = async function (callback) {

	try {
		const accounts = await web3.eth.getAccounts();
		const network = process.argv[5];
		const networkId = await web3.eth.net.getId();
		const newtworkType = await web3.eth.net.getNetworkType();

		console.log('network: ' + network);
		console.log('network id: ' + networkId);
		console.log('network type: ' + newtworkType);

		const gasPrice = process.env.GAS_PRICE ? process.env.GAS_PRICE : config.gasPrice;
		const gasLimit = process.env.GAS_LIMIT ? process.env.GAS_LIMIT : config.gas;

		const actions = JSON.parse(envParsed.ACTIONS);

		const plennySupply = '1000000000'; // 1bil
		const salt = '0x';
		let _data;

		const distributionInstance = await PlennyDistribution.deployed();
		// create the token
		if (actions.includes('createToken')) {
			const tokenCreateInfo = await distributionInstance.createToken(salt, {gasPrice: gasPrice, gasLimit: gasLimit});
			logger.info('Creating PL2: ' + tokenCreateInfo.tx + ' Gas used: ' + tokenCreateInfo.receipt.gasUsed);
		}

		if (network === 'arbitrum' || network === 'arbitrum-testnet') {

			const bridgeAddress = envParsed.ARBITRUM_BRIDGE_ADDRESS;
			const l1TokenAddress = envParsed.L1_TOKEN_ADDRESS;

			// init data for L2 token
			_data = web3.eth.abi.encodeParameters(['string', 'string', 'address', 'address'],
				['Plenny', 'PL2', l1TokenAddress, bridgeAddress]);

		} else {
			const bridgeAddress = envParsed.ETHERC20_BRIDGE_ADDRESS;
			const routerAddress = envParsed.L1_ROUTER_ADDRESS;

			// init data for L1 token
			_data = web3.eth.abi.encodeParameters(['string', 'string', 'address', 'address'],
				['Plenny', 'PL2', bridgeAddress, routerAddress]);
		}

		if (actions.includes('tokenInit')) {
			// init the token
			const tokenInitInfo = await distributionInstance.tokenInit(_data, {gasPrice: gasPrice, gasLimit: gasLimit});
			logger.info('Init PL2: ' + tokenInitInfo.tx + ' Gas used: ' + tokenInitInfo.receipt.gasUsed);
		}

		if (actions.includes('tokenMint')) {
			// mint token supply
			const tokenMintInfo = await distributionInstance.tokenMint(Web3.utils.toWei(plennySupply), {gasPrice: gasPrice, gasLimit: gasLimit});
			logger.info('Minting PL2: ' + tokenMintInfo.tx + ' Gas used: ' + tokenMintInfo.receipt.gasUsed);
		}

		const plennyAddress = await distributionInstance.getPlennyTokenAddress.call({from: accounts[0], gasPrice: 0});
		logger.info('PL2 created at: ' + plennyAddress);

		const plennyTotalSupply = await distributionInstance.plennyTotalSupply.call({from: accounts[0], gasPrice: 0});
		logger.info('PL2 total supply: ' + Web3.utils.fromWei(plennyTotalSupply));

		callback();
	} catch (e) {
		console.log(e);
		callback();
	}
};
