const logger = require('logops');
const {checkAndRetrieveContract} = require('./helper');
const contract = require('@truffle/contract');
const Migrations = artifacts.require('Migrations');
const PlennyFee = checkAndRetrieveArtifact('PlennyRePLENishment');
const PlennyDao = checkAndRetrieveArtifact('PlennyDao');
const PlennyOcean = artifacts.require('PlennyOcean');
const PlennyReward = artifacts.require('PlennyReward');
const PlennyStakeGovDelV = artifacts.require('PlennyStakeGovDelV');
const PlennyStaking = artifacts.require('PlennyStaking');
const PlennyTreasury = artifacts.require('PlennyTreasury');
const PlennyLiqMining = artifacts.require('PlennyLiqMining');
const PlennyCoordinator = artifacts.require('PlennyCoordinator');
const PlennyDappFactory = artifacts.require('PlennyDappFactory');
const PlennyDistribution = artifacts.require('PlennyDistribution');
const PlennyOracleValidator = artifacts.require('PlennyOracleValidator');
const PlennyContractRegistry = artifacts.require('PlennyContractRegistry');
const PlennyValidatorElection = artifacts.require('PlennyValidatorElection');

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
		const factoryInstance = await checkAndRetrieveContract(PlennyDappFactory);
		const registry = await PlennyContractRegistry.deployed();

		// create SC instances
		const daoInstance = await checkAndRetrieveContract(PlennyDao);
		const feeInstance = await checkAndRetrieveContract(PlennyFee);
		const oceanInstance = await checkAndRetrieveContract(PlennyOcean);
		const rewardInstance = await checkAndRetrieveContract(PlennyReward);
		// Attn: unnecessary contract name change due to staking/locking
		const lockingInstance = await checkAndRetrieveContract(PlennyStakeGovDelV);
		const stakingInstance = await checkAndRetrieveContract(PlennyStaking);
		const miningInstance = await checkAndRetrieveContract(PlennyLiqMining);

		const treasuryInstance = await checkAndRetrieveContract(PlennyTreasury);
		const coordinatorInstance = await checkAndRetrieveContract(PlennyCoordinator);
		const validatorInstance = await checkAndRetrieveContract(PlennyOracleValidator);
		const distributionInstance = await checkAndRetrieveContract(PlennyDistribution);
		const electionInstance = await checkAndRetrieveContract(PlennyValidatorElection);

		// deploy uniswap
		const adapter = Migrations.interfaceAdapter;
		const provider = adapter.web3.currentProvider;
		UniswapV2Factory.setProvider(provider);
		UniswapV2Router02.setProvider(provider);

		const uniswapRouterAddress = process.env.UNISWAP_ROUTER_V2;
		const uniswapRouter = await UniswapV2Router02.at(uniswapRouterAddress);
		const uniswapAddress = await uniswapRouter.factory();

		const plennyAddress = await distributionInstance.getPlennyTokenAddress();
		const wEthAddress = await uniswapRouter.WETH();
		const uniswapInstance = await UniswapV2Factory.at(uniswapAddress);

		let getPairAddress = await uniswapInstance.getPair(wEthAddress, plennyAddress);

		const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000';

		// gather contract address (Attn: name/address mapping)
		let addresses = [
			plennyAddress || ZERO_ADDRESS,
			getPairAddress || ZERO_ADDRESS,
			wEthAddress || ZERO_ADDRESS,
			coordinatorInstance ? coordinatorInstance.address : ZERO_ADDRESS,
			miningInstance ? miningInstance.address : ZERO_ADDRESS, // PlennyLiqStaking
			daoInstance ? daoInstance.address : ZERO_ADDRESS,
			validatorInstance ? validatorInstance.address : ZERO_ADDRESS,
			oceanInstance ? oceanInstance.address : ZERO_ADDRESS,
			treasuryInstance ? treasuryInstance.address : ZERO_ADDRESS,
			stakingInstance ? stakingInstance.address : ZERO_ADDRESS, // PlennyLockingPoSLT
			lockingInstance ? lockingInstance.address : ZERO_ADDRESS, // PlennyStakeGovDelV
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
					Web3.utils.asciiToHex('PlennyLiqMining'), // PlennyLiqStaking
					Web3.utils.asciiToHex('PlennyDao'),
					Web3.utils.asciiToHex('PlennyOracleValidator'),
					Web3.utils.asciiToHex('PlennyOcean'),
					Web3.utils.asciiToHex('PlennyTreasury'),
					Web3.utils.asciiToHex('PlennyStaking'), // PlennyLockingPoSLT
					Web3.utils.asciiToHex('PlennyLocking'), // PlennyStakeGovDelV
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

			for (const address of addresses) {
				logger.info('address', address);
			}

			logger.info('Initialized the addresses in the registry');
		}

		callback();
	} catch (e) {
		console.log(e);
		callback();
	}
};