const logger = require('logops');
const {checkAndRetrieveContract} = require('./helper');
const contract = require('@truffle/contract');
const Migrations = artifacts.require('Migrations');
const PlennyFee = checkAndRetrieveArtifact('PlennyRePLENishment');
const PlennyFeeV2 = checkAndRetrieveArtifact('PlennyRePLENishmentV2');
const PlennyFeeV3 = checkAndRetrieveArtifact('PlennyRePLENishmentV3');
const PlennyDao = checkAndRetrieveArtifact('PlennyDao');
const PlennyERC20 = artifacts.require('PlennyERC20');
const PlennyOcean = artifacts.require('PlennyOcean');
const PlennyOceanV2 = artifacts.require('PlennyOceanV2');
const PlennyReward = artifacts.require('PlennyReward');
const PlennyLocking = artifacts.require('PlennyLocking');
const PlennyStaking = artifacts.require('PlennyStaking');
const PlennyTreasury = artifacts.require('PlennyTreasury');
const PlennyLiqMining = artifacts.require('PlennyLiqMining');
const PlennyCoordinator = artifacts.require('PlennyCoordinator');
const PlennyCoordinatorV2 = artifacts.require('PlennyCoordinatorV2');
const PlennyDappFactory = artifacts.require('PlennyDappFactory');
const PlennyDappFactoryV2 = artifacts.require('PlennyDappFactoryV2');
const PlennyDistribution = artifacts.require('PlennyDistribution');
const PlennyOracleValidator = artifacts.require('PlennyOracleValidator');
const PlennyOracleValidatorV2 = artifacts.require('PlennyOracleValidatorV2');
const PlennyContractRegistry = artifacts.require('PlennyContractRegistry');
const PlennyValidatorElection = artifacts.require('PlennyValidatorElection');
const PlennyValidatorElectionV2 = artifacts.require('PlennyValidatorElectionV2');

const UniswapV2FactoryJson = require('@uniswap/v2-core/build/UniswapV2Factory.json');
const UniswapV2Factory = contract(UniswapV2FactoryJson);

const UniswapV2Router02Json = require('@uniswap/v2-periphery/build/UniswapV2Router02.json');
const UniswapV2Router02 = contract(UniswapV2Router02Json);


const Web3 = require('web3');

function checkAndRetrieveArtifact(artifact) {
	try {
		return artifacts.require(artifact);
	} catch (e) {
		return undefined;
	}
}

module.exports = async function (callback) {

	try {
		const accounts = await web3.eth.getAccounts();
		const network = process.argv[5];
		const networkId = await web3.eth.net.getId();
		const newtworkType = await web3.eth.net.getNetworkType();

		console.log('network: ' + network);
		console.log('network id: ' + networkId);
		console.log('network type: ' + newtworkType);

		const actions = JSON.parse(process.env.ACTIONS);
		const gasPrice = process.env.GAS_PRICE ? process.env.GAS_PRICE : config.gasPrice;
		const gasLimit = process.env.GAS_LIMIT ? process.env.GAS_LIMIT : config.gas;

		const electionPeriod = process.env.ELECTION_PERIOD ? process.env.ELECTION_PERIOD : 45500;
		const blockLimit = process.env.BLOCK_LIMIT ? process.env.BLOCK_LIMIT : 6500;

		// create factory/registry contract
		const factoryInstance = await checkAndRetrieveContract(PlennyDappFactory, PlennyDappFactoryV2);
		const registry = await PlennyContractRegistry.deployed();

		// create SC instances
		const daoInstance = await checkAndRetrieveContract(PlennyDao);
		const feeInstance = await checkAndRetrieveContract(PlennyFee, PlennyFeeV2, PlennyFeeV3);
		const oceanInstance = await checkAndRetrieveContract(PlennyOcean, PlennyOceanV2);
		const rewardInstance = await checkAndRetrieveContract(PlennyReward);
		const stakingInstance = await checkAndRetrieveContract(PlennyStaking);
		const lockingInstance = await checkAndRetrieveContract(PlennyLocking);
		const miningInstance = await checkAndRetrieveContract(PlennyLiqMining);
		const treasuryInstance = await checkAndRetrieveContract(PlennyTreasury);
		const coordinatorInstance = await checkAndRetrieveContract(PlennyCoordinator, PlennyCoordinatorV2);
		const validatorInstance = await checkAndRetrieveContract(PlennyOracleValidator, PlennyOracleValidatorV2);
		const distributionInstance = await checkAndRetrieveContract(PlennyDistribution);
		const electionInstance = await checkAndRetrieveContract(PlennyValidatorElection, PlennyValidatorElectionV2);

		// deploy uniswap
		const adapter = Migrations.interfaceAdapter;
		const provider = adapter.web3.currentProvider;
		UniswapV2Factory.setProvider(provider);
		UniswapV2Router02.setProvider(provider);

		const uniswapRouterAddress = process.env.UNISWAP_ROUTER_V2;
		const uniswapRouter = await UniswapV2Router02.at(uniswapRouterAddress);
		const uniswapAddress = await uniswapRouter.factory();

		const plennyAddress = await distributionInstance.getPlennyTokenAddress();
		const plennyToken = await PlennyERC20.at(plennyAddress);
		const wEthAddress = await uniswapRouter.WETH();
		const uniswapInstance = await UniswapV2Factory.at(uniswapAddress);

		let getPairAddress = await uniswapInstance.getPair(wEthAddress, plennyAddress);
		if (actions.includes('createPair')) {
			await uniswapInstance.createPair(wEthAddress, plennyAddress, {from: accounts[0], gasPrice: gasPrice, gasLimit: gasLimit});
			logger.info('UniSwap pool created using WETH/PL2 tokens.');

			getPairAddress = await uniswapInstance.getPair(wEthAddress, plennyAddress);
			logger.info('Got pool pair address.', getPairAddress);
		}

		const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000';

		// gather contract address
		let addresses = [
			plennyAddress || ZERO_ADDRESS,
			getPairAddress || ZERO_ADDRESS,
			wEthAddress || ZERO_ADDRESS,
			coordinatorInstance ? coordinatorInstance.address : ZERO_ADDRESS,
			miningInstance ? miningInstance.address : ZERO_ADDRESS,
			daoInstance ? daoInstance.address : ZERO_ADDRESS,
			validatorInstance ? validatorInstance.address : ZERO_ADDRESS,
			oceanInstance ? oceanInstance.address : ZERO_ADDRESS,
			treasuryInstance ? treasuryInstance.address : ZERO_ADDRESS,
			stakingInstance ? stakingInstance.address : ZERO_ADDRESS,
			lockingInstance ? lockingInstance.address : ZERO_ADDRESS,
			distributionInstance ? distributionInstance.address : ZERO_ADDRESS,
			rewardInstance ? rewardInstance.address : ZERO_ADDRESS,
			feeInstance ? feeInstance.address : ZERO_ADDRESS,
			uniswapRouter ? uniswapRouter.address : ZERO_ADDRESS,
			electionInstance ? electionInstance.address : ZERO_ADDRESS,
			factoryInstance ? factoryInstance.address : ZERO_ADDRESS];

		if (actions.includes('setContractAddress')) {
			// init the addresses in the registry
			await registry.importAddresses(
				[
					Web3.utils.asciiToHex('PlennyERC20'),
					Web3.utils.asciiToHex('UNIETH-PL2'),
					Web3.utils.asciiToHex('WETH'),
					Web3.utils.asciiToHex('PlennyCoordinator'),
					Web3.utils.asciiToHex('PlennyLiqMining'),
					Web3.utils.asciiToHex('PlennyDao'),
					Web3.utils.asciiToHex('PlennyOracleValidator'),
					Web3.utils.asciiToHex('PlennyOcean'),
					Web3.utils.asciiToHex('PlennyTreasury'),
					Web3.utils.asciiToHex('PlennyStaking'),
					Web3.utils.asciiToHex('PlennyLocking'),
					Web3.utils.asciiToHex('PlennyDistribution'),
					Web3.utils.asciiToHex('PlennyReward'),
					Web3.utils.asciiToHex('PlennyRePLENishment'),
					Web3.utils.asciiToHex('UniswapRouterV2'),
					Web3.utils.asciiToHex('PlennyValidatorElection'),
					Web3.utils.asciiToHex('PlennyDappFactory'),
				],
				addresses,
				{gasPrice: gasPrice, gasLimit: gasLimit}
			);

			logger.info('Initialized the addresses in the registry');
		}

		if (actions.includes('createDefaultValidator')) {
			await factoryInstance.createDefaultValidator(
				process.env.DEFAULT_ORACLE_PUBLIUC_KEY,
				process.env.DEFAULT_ORACLE_NAME,
				process.env.DEFAULT_ORACLE_NODE_IP,
				process.env.DEFAULT_ORACLE_NODE_PORT,
				process.env.DEFAULT_ORACLE_SERVICE_URL,
				process.env.DEFAULT_ORACLE_ACCOUNT,
				{gasPrice: gasPrice, gasLimit: gasLimit}
			);
			logger.info('Default oracle created.');
		}

		if (actions.includes('addMinter')) {
			if (typeof feeInstance !== 'undefined') {
				await plennyToken.addMinter(feeInstance.address, {gasPrice: gasPrice, gasLimit: gasLimit});
				logger.info('Minter added', feeInstance.address);
			}
		}

		if (actions.includes('addMintAddress')) {
			if (typeof feeInstance !== 'undefined') {
				await plennyToken.addMintAddress(feeInstance.address, {gasPrice: gasPrice, gasLimit: gasLimit});
				logger.info('Mint address added', feeInstance.address);
			}
		}

		if (actions.includes('toggleWhitelisting')) {
			await plennyToken.toggleWhitelisting(true, {gasPrice: gasPrice, gasLimit: gasLimit});
			logger.info('Token whitelisting is on.');
		}

		if (actions.includes('setUserChannelRewardPeriod')) {
			let periodInSeconds = 300;

			await factoryInstance.setUserChannelRewardPeriod(periodInSeconds, {from: accounts[0], gasPrice: gasPrice, gasLimit: gasLimit});
			logger.info(`User channel reward period set to ${periodInSeconds}`);
		}

		if (actions.includes('setNextDistributionSeconds')) {
			let periodInSeconds = 300;

			if (typeof lockingInstance !== 'undefined') {
				await lockingInstance.setNextDistributionSeconds(periodInSeconds, {from: accounts[0], gasPrice: gasPrice, gasLimit: gasLimit});
				logger.info(`Governance next distribution set to ${periodInSeconds}`);
			}

			if (typeof miningInstance !== 'undefined') {
				await miningInstance.setNextDistributionSeconds(periodInSeconds, {from: accounts[0], gasPrice: gasPrice, gasLimit: gasLimit});
				logger.info(`Liquidity Mining next distribution set to ${periodInSeconds}`);
			}
		}

		if (actions.includes('setMaintenanceBlockLimit')) {

			if (typeof feeInstance !== 'undefined') {
				await feeInstance.setMaintenanceBlockLimit(blockLimit, {from: accounts[0], gasPrice: gasPrice, gasLimit: gasLimit});
				logger.info(`Replenish Treasury period has been set to ${blockLimit} block(s)`);
			}
		}

		if (actions.includes('setNewElectionPeriod')) {

			await electionInstance.setNewElectionPeriod(electionPeriod, {from: accounts[0], gasPrice: gasPrice, gasLimit: gasLimit});
			logger.info(`Election period has been set to ${electionPeriod} block(s)`);
		}

		if (actions.includes('setUserRewardPercent')) {
			let userRewardPercent = 2000;

			await electionInstance.setUserRewardPercent(userRewardPercent, {from: accounts[0], gasPrice: gasPrice, gasLimit: gasLimit});
			logger.info(`Election user trigger reward has been set to ${userRewardPercent}`);
		}

		if (actions.includes('setElectionTriggerUserReward')) {
			let userReward = '100000';

			await electionInstance.setElectionTriggerUserReward(Web3.utils.toWei(userReward), {from: accounts[0], gasPrice: gasPrice, gasLimit: gasLimit});
			logger.info(`Election user trigger reward has been set to ${userReward}`);
		}

		if (actions.includes('setMaximumChannelCapacity')) {
			let newMaximum = 16000000;

			await coordinatorInstance.setMaximumChannelCapacity(newMaximum, {from: accounts[0], gasPrice: gasPrice, gasLimit: gasLimit});
			logger.info(`Maximum channel capacity has been set to ${newMaximum} sats`);
		}

		if (actions.includes('setMinimumChannelCapacity')) {
			let newMinimum = 20000;

			await coordinatorInstance.setMinimumChannelCapacity(newMinimum, {from: accounts[0], gasPrice: gasPrice, gasLimit: gasLimit});
			logger.info(`Minimum channel capacity has been set to ${newMinimum} sats`);
		}

		if (actions.includes('setChannelRewardThreshold')) {
			let newThreshold = 500000;

			await coordinatorInstance.setChannelRewardThreshold(newThreshold, {from: accounts[0], gasPrice: gasPrice, gasLimit: gasLimit});
			logger.info(`Channel Reward threshold has been set to ${newThreshold} sats`);
		}

		if (actions.includes('setRewardBaseline')) {
			let rewardBaseline = '250';

			await coordinatorInstance.setRewardBaseline(Web3.utils.toWei(rewardBaseline), {from: accounts[0], gasPrice: gasPrice, gasLimit: gasLimit});
			logger.info(`Reward baseline has been set to ${rewardBaseline}`);
		}

		callback();
	} catch (e) {
		console.log(e);
		callback();
	}
};