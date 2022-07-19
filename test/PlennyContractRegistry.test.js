require("@babel/polyfill");

const {expectRevert} = require('@openzeppelin/test-helpers');

// Load compiled artifacts
const Migrations = artifacts.require('Migrations');
const PlennyFeeV3 = artifacts.require('PlennyRePLENishmentV3');
const PlennyDao = artifacts.require('PlennyDao');
const PlennyERC20 = artifacts.require('PlennyERC20');
const PlennyOceanV2 = artifacts.require('PlennyOceanV2');
const PlennyReward = artifacts.require('PlennyReward');
const PlennyStakeGovDelV = artifacts.require('PlennyStakeGovDelV');
const PlennyLockingPoSLT = artifacts.require('PlennyLockingPoSLT');
const PlennyTreasury = artifacts.require('PlennyTreasury');
const PlennyLiqMining = artifacts.require('PlennyLiqMining');
const PlennyCoordinatorV2 = artifacts.require('PlennyCoordinatorV2');
const PlennyDappFactory = artifacts.require('PlennyDappFactory');
const PlennyDappFactoryV2 = artifacts.require('PlennyDappFactoryV2');
const PlennyDistribution = artifacts.require('PlennyDistribution');
const PlennyOracleValidatorV2 = artifacts.require('PlennyOracleValidatorV2');
const PlennyContractRegistry = artifacts.require('PlennyContractRegistry');
const PlennyValidatorElectionV2 = artifacts.require('PlennyValidatorElectionV2');

const UniswapV2Pair = artifacts.require('IUniswapV2Pair');

contract('PlennyContractRegistry', (accounts) => {
    let registryInstance;
    let plennyDistributionInstance;
    let plennyAddress;
    let plennyToken;
    let miningInstance;
    let rewardHodlInstance;
    let uniswapV2Pair;
    let factoryInstance;
    let registry;
    let daoInstance;
    let feeInstance;
    let oceanInstance;
    let rewardInstance;
    let lockingInstance;
    let stakingInstance;
    let treasuryInstance;
    let coordinatorInstance;
    let validatorInstance;
    let distributionInstance;
    let electionInstance;
    let uniswapRouterAddress;
    let uniswapRouter;
    let uniswapAddress;
    let wEthAddress;
    let uniswapInstance;
    let getPairAddress;
    let ZERO_ADDRESS;
    let adapter;
    let provider;

    beforeEach(async () => {

        // create factory/registry contract
        factoryInstance = await PlennyDappFactoryV2.deployed();
        registry = await PlennyContractRegistry.deployed();

        // create SC instances
        daoInstance = await PlennyDao.deployed();
        feeInstance = await PlennyFeeV3.deployed();
        oceanInstance = await PlennyOceanV2.deployed();
        rewardInstance = await PlennyReward.deployed();
        // Attn: unnecessary contract name change due to staking/locking
        lockingInstance = await PlennyStakeGovDelV.deployed();
        stakingInstance = await PlennyLockingPoSLT.deployed();
        miningInstance = await PlennyLiqMining.deployed();
        treasuryInstance = await PlennyTreasury.deployed();
        coordinatorInstance = await PlennyCoordinatorV2.deployed();
        validatorInstance = await PlennyOracleValidatorV2.deployed();
        distributionInstance = await PlennyDistribution.deployed();
        electionInstance = await PlennyValidatorElectionV2.deployed();

        // deploy uniswap
        adapter = Migrations.interfaceAdapter;
        provider = adapter.web3.currentProvider;

        uniswapRouterAddress = process.env.UNISWAP_ROUTER_V2;
        uniswapRouter = '0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D';
        plennyAddress = await distributionInstance.getPlennyTokenAddress();
        plennyToken = await PlennyERC20.at(plennyAddress);
        wEthAddress = '0xc778417e063141139fce010982780140aa0cd5ab';

        getPairAddress = '0xbf1B747B6D50D8f53ec2CB8936fA7af7EfE89771';

        ZERO_ADDRESS = '0x0000000000000000000000000000000000000000';

        registryInstance = await PlennyContractRegistry.deployed();
        plennyDistributionInstance = await PlennyDistribution.deployed();
        plennyAddress = await plennyDistributionInstance.getPlennyTokenAddress();
        plennyToken = await PlennyERC20.at(plennyAddress);
        miningInstance = await PlennyLiqMining.deployed();
        rewardHodlInstance = await PlennyReward.deployed();
        uniswapV2Pair = await UniswapV2Pair.at(await registryInstance.lpContract());
    });

    afterEach(async () => {
        registryInstance = null;
        plennyDistributionInstance = null;
        plennyAddress = null;
        plennyToken = null;
        miningInstance = null;
        rewardHodlInstance = null;
        uniswapV2Pair = null;
        factoryInstance = null;
        registry = null;
        daoInstance = null;
        feeInstance = null;
        oceanInstance = null;
        rewardInstance = null;
        lockingInstance = null;
        stakingInstance = null;
        treasuryInstance = null;
        coordinatorInstance = null;
        validatorInstance = null;
        distributionInstance = null;
        electionInstance = null;
        uniswapRouterAddress = null;
        uniswapRouter = null;
        uniswapAddress = null;
        wEthAddress = null;
        uniswapInstance = null;
        getPairAddress = null;
        ZERO_ADDRESS = null;
        adapter = null;
        provider = null;
    });

    describe('PlennyContractRegistry - importAddresses', async () => {
        it('should not allow importing of the addresses in the registry', async () => {
            let addresses = [
                plennyAddress || ZERO_ADDRESS,
                getPairAddress || ZERO_ADDRESS,
                wEthAddress || ZERO_ADDRESS,
                coordinatorInstance ? coordinatorInstance.address : ZERO_ADDRESS,
                miningInstance ? miningInstance.address : ZERO_ADDRESS,
                treasuryInstance ? treasuryInstance.address : ZERO_ADDRESS,
                stakingInstance ? stakingInstance.address : ZERO_ADDRESS, // PlennyLockingPoSLT
                lockingInstance ? lockingInstance.address : ZERO_ADDRESS, // PlennyStakeGovDelV
                distributionInstance ? distributionInstance.address : ZERO_ADDRESS,
                uniswapRouter ? uniswapRouter : ZERO_ADDRESS,
                electionInstance ? electionInstance.address : ZERO_ADDRESS,
                factoryInstance ? factoryInstance.address : ZERO_ADDRESS];

            // init the addresses in the registry
            await expectRevert(registry.importAddresses(
                [
                    web3.utils.asciiToHex('PlennyERC20'),
                    web3.utils.asciiToHex('UNIETH-PL2'),
                    web3.utils.asciiToHex('WETH'),
                    web3.utils.asciiToHex('PlennyCoordinator'),
                    web3.utils.asciiToHex('PlennyLiqMining'),
                    web3.utils.asciiToHex('PlennyDao'),
                    web3.utils.asciiToHex('PlennyOracleValidator'),
                    web3.utils.asciiToHex('PlennyOcean'),
                    web3.utils.asciiToHex('PlennyTreasury'),
                    web3.utils.asciiToHex('PlennyStaking'), // PlennyLockingPoSLT
                    web3.utils.asciiToHex('PlennyLocking'), // PlennyStakeGovDelV
                    web3.utils.asciiToHex('PlennyDistribution'),
                    web3.utils.asciiToHex('PlennyReward'),
                    web3.utils.asciiToHex('PlennyRePLENishment'),
                    web3.utils.asciiToHex('UniswapRouterV2'),
                    web3.utils.asciiToHex('PlennyValidatorElection'),
                    web3.utils.asciiToHex('PlennyDappFactory'),
                ],
                addresses
            ), 'ERR_INVALID_LENGTH')
        });


        it('should allow importing of the addresses in the registry', async () => {
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
                stakingInstance ? stakingInstance.address : ZERO_ADDRESS, // PlennyLockingPoSLT
                lockingInstance ? lockingInstance.address : ZERO_ADDRESS, // PlennyStakeGovDelV
                distributionInstance ? distributionInstance.address : ZERO_ADDRESS,
                rewardInstance ? rewardInstance.address : ZERO_ADDRESS,
                feeInstance ? feeInstance.address : ZERO_ADDRESS,
                uniswapRouter ? uniswapRouter : ZERO_ADDRESS,
                electionInstance ? electionInstance.address : ZERO_ADDRESS,
                factoryInstance ? factoryInstance.address : ZERO_ADDRESS];

            // init the addresses in the registry
            await registry.importAddresses(
                [
                    web3.utils.asciiToHex('PlennyERC20'),
                    web3.utils.asciiToHex('UNIETH-PL2'),
                    web3.utils.asciiToHex('WETH'),
                    web3.utils.asciiToHex('PlennyCoordinator'),
                    web3.utils.asciiToHex('PlennyLiqMining'),
                    web3.utils.asciiToHex('PlennyDao'),
                    web3.utils.asciiToHex('PlennyOracleValidator'),
                    web3.utils.asciiToHex('PlennyOcean'),
                    web3.utils.asciiToHex('PlennyTreasury'),
                    web3.utils.asciiToHex('PlennyStaking'), // PlennyLockingPoSLT
                    web3.utils.asciiToHex('PlennyLocking'), // PlennyStakeGovDelV
                    web3.utils.asciiToHex('PlennyDistribution'),
                    web3.utils.asciiToHex('PlennyReward'),
                    web3.utils.asciiToHex('PlennyRePLENishment'),
                    web3.utils.asciiToHex('UniswapRouterV2'),
                    web3.utils.asciiToHex('PlennyValidatorElection'),
                    web3.utils.asciiToHex('PlennyDappFactory'),
                ],
                addresses
            );

            // TODO: check the imported addresses; dont print
            console.log('ADDRESSES: ', addresses);
        });
    });
});