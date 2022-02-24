const envParsed = process.env;
const logger = require('logops');
const PlennyERC20 = artifacts.require('PlennyERC20');
const PlennyERC20V2 = artifacts.require('PlennyERC20V2');
const PlennyDistribution = artifacts.require('PlennyDistribution');

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
		const arbToken = envParsed.L2_TOKEN_ADDRESS;

		const distributionInstance = await PlennyDistribution.deployed();
		const plennyAddress = await distributionInstance.getPlennyTokenAddress.call({gasPrice: 0});
		logger.info('PL2 address: ' + plennyAddress);

		let plennyToken = await PlennyERC20.at(plennyAddress);

		const plennyOwner = await plennyToken.owner.call({gasPrice: 0});
		logger.info('PL2 Owner: ' + plennyOwner);

		logger.info('Seed accounts: ' + accounts);

		if (actions.includes('setArbGateway')) {

			const gateway = envParsed.ETHERC20_BRIDGE_ADDRESS;

			// set gateway
			const arbGatewayTxn = await plennyToken.setArbGateway(gateway, {gasPrice: gasPrice, gasLimit: gasLimit});
			logger.info('Setting Arb Gateway: ' + arbGatewayTxn.tx + ' Gas used: ' + arbGatewayTxn.receipt.gasUsed);
		}

		if (actions.includes('setArbRouter')) {

			const router = envParsed.L1_ROUTER_ADDRESS;

			// set router
			const arbRouterTx = await plennyToken.setArbRouter(router, {gasPrice: gasPrice, gasLimit: gasLimit});
			logger.info('Setting Arb Router: ' + arbRouterTx.tx + ' Gas used: ' + arbRouterTx.receipt.gasUsed);
		}

		if (arbToken && actions.includes('upgradePL2')) {
			//await deployer.deploy(PlennyERC20V2);
			const plennyLogicInstance = await PlennyERC20V2.deployed();
			console.log(' New PL2 logic address: ' + plennyLogicInstance.address);
			const upgradePl2Txn = await distributionInstance.upgradeTo(plennyLogicInstance.address, {gasPrice: gasPrice, gasLimit: gasLimit});
			logger.info('Upgrading PL2 token: ' + upgradePl2Txn.tx + ' Gas used: ' + upgradePl2Txn.receipt.gasUsed);
		}

		if (arbToken && actions.includes('registerTokenOnL2')) {

			const maxSubmissionCost = 400000000000;
			const maxGas = 4000000;
			const gasPriceBid = 590818592;
			const l2TxFee = (gasPriceBid * maxGas) + maxSubmissionCost;

			plennyToken = await PlennyERC20V2.at(plennyAddress);

			// register L1-L2 mapping
			const registerL2Txn = await plennyToken.registerTokenOnL2(arbToken, maxSubmissionCost, maxGas, gasPriceBid,
				l2TxFee, l2TxFee, {gasPrice: gasPrice, value: 2 * l2TxFee, gasLimit: gasLimit});
			logger.info('Registering L2 token: ' + registerL2Txn.tx + ' Gas used: ' + registerL2Txn.receipt.gasUsed);
			logger.info('L2 token info: ' + registerL2Txn.receipt);
		}

		callback();
	} catch (e) {
		console.log(e);
		callback();
	}
};
