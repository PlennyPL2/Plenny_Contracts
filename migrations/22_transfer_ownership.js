const logger = require("logops");
const {checkAndRetrieveArtifact, checkAndRetrieveContract} = require("../scripts/deployment/helper");
const PlennyDao = artifacts.require("PlennyDao");
const PlennyFee = artifacts.require('PlennyRePLENishment');
const PlennyFeeV2 = checkAndRetrieveArtifact('PlennyRePLENishmentV2');
const PlennyFeeV3 = checkAndRetrieveArtifact('PlennyRePLENishmentV3');
const PlennyOcean = artifacts.require("PlennyOcean");
const PlennyERC20 = artifacts.require("PlennyERC20");
const PlennyReward = artifacts.require("PlennyReward");
const PlennyStakeGovDelV = artifacts.require("PlennyStakeGovDelV");
const PlennyStaking = artifacts.require("PlennyStaking");
const PlennyTreasury = artifacts.require("PlennyTreasury");
const PlennyLiqMining = artifacts.require("PlennyLiqMining");
const PlennyCoordinator = artifacts.require("PlennyCoordinator");
const PlennyDappFactory = artifacts.require("PlennyDappFactory");
const PlennyDistribution = artifacts.require("PlennyDistribution");
const PlennyOracleValidator = artifacts.require("PlennyOracleValidator");
const PlennyOracleValidatorV2 = checkAndRetrieveArtifact('PlennyOracleValidatorV2');
const PlennyValidatorElection = artifacts.require("PlennyValidatorElection");

const {admin} = require("@openzeppelin/truffle-upgrades");

module.exports = async function (deployer, network, accounts) {

    const actions = JSON.parse(process.env.ACTIONS);
    const gasPrice = process.env.GAS_PRICE ? process.env.GAS_PRICE : 30000000000;

    const proxyAdmin = process.env.PROXY_ADMIN_ADDRESS && process.env.PROXY_ADMIN_ADDRESS;
    const newAdmin = process.env.NEW_ADMIN_ADDRESS && process.env.NEW_ADMIN_ADDRESS;

    // create contract instances
    const daoInstance = await checkAndRetrieveContract(PlennyDao);
    const feeInstance = await checkAndRetrieveContract(PlennyFee, PlennyFeeV2, PlennyFeeV3);
    const oceanInstance = await checkAndRetrieveContract(PlennyOcean);
    const rewardInstance = await checkAndRetrieveContract(PlennyReward);
    const lockingInstance = await checkAndRetrieveContract(PlennyStakeGovDelV);
    const stakingInstance = await checkAndRetrieveContract(PlennyStaking);
    const miningInstance = await checkAndRetrieveContract(PlennyLiqMining);
    const treasuryInstance = await checkAndRetrieveContract(PlennyTreasury);
    const factoryInstance = await checkAndRetrieveContract(PlennyDappFactory);
    const coordinatorInstance = await checkAndRetrieveContract(PlennyCoordinator);
    const validatorInstance = await checkAndRetrieveContract(PlennyOracleValidator, PlennyOracleValidatorV2);
    const distributionInstance = await checkAndRetrieveContract(PlennyDistribution);
    const electionInstance = await checkAndRetrieveContract(PlennyValidatorElection);

    const plennyAddress = await distributionInstance.getPlennyTokenAddress();
    const plennyToken = await PlennyERC20.at(plennyAddress);

    if ((await factoryInstance.owner() &&
            await validatorInstance.owner() &&
            await miningInstance.owner() &&
            await stakingInstance.owner() &&
            await oceanInstance.owner() &&
            await plennyToken.owner() &&
            await daoInstance.owner() &&
            await treasuryInstance.owner() &&
            await lockingInstance.owner() &&
            await rewardInstance.owner() &&
            await feeInstance.owner() &&
            await electionInstance.owner() &&
            await coordinatorInstance.owner())
        === proxyAdmin) {
        // minters & pausers
        if (actions.includes("addPauser")) {
            // if (typeof factoryInstance !== "undefined") {
            //     await factoryInstance.addPauser(newAdmin, {gasPrice: gasPrice});
            //     logger.info(`Contract: ${factoryInstance.address} ==> Pauser: ${newAdmin}`);
            // }

            // if (typeof validatorInstance !== "undefined") {
            //     await validatorInstance.addPauser(newAdmin, {gasPrice: gasPrice});
            //     logger.info(`Contract: ${validatorInstance.address} ==> Pauser: ${newAdmin}`);
            // }

            // if (typeof treasuryInstance !== "undefined") {
            //     await treasuryInstance.addPauser(newAdmin, {gasPrice: gasPrice});
            //     logger.info(`Contract: ${treasuryInstance.address} ==> Pauser: ${newAdmin}`);
            // }

            // if (typeof plennyToken !== "undefined") {
            //     await plennyToken.addPauser(newAdmin, {gasPrice: gasPrice});
            //     logger.info(`Contract: ${plennyToken.address} ==> Pauser: ${newAdmin}`);
            // }

            if (typeof plennyToken !== "undefined") {
                await plennyToken.addMinter(newAdmin, {gasPrice: gasPrice});
                logger.info(`Contract: ${plennyToken.address} ==> Minter: ${newAdmin}`);
            }
        }

        // transfer ownership
        if (actions.includes("transferOwnership")) {
            if (typeof factoryInstance !== "undefined") {
                await factoryInstance.transferOwnership(newAdmin, {gasPrice: gasPrice});
                logger.info(`Transferred ownership to ${newAdmin}`);
            }

            if (typeof validatorInstance !== "undefined") {
                await validatorInstance.transferOwnership(newAdmin, {gasPrice: gasPrice}),
                    logger.info(`Transferred ownership to ${newAdmin}`);
            }

            if (typeof miningInstance !== "undefined") {
                await miningInstance.transferOwnership(newAdmin, {gasPrice: gasPrice}),
                    logger.info(`Transferred ownership to ${newAdmin}`);
            }

            if (typeof stakingInstance !== "undefined") {
                await stakingInstance.transferOwnership(newAdmin, {gasPrice: gasPrice}),
                    logger.info(`Transferred ownership to ${newAdmin}`);
            }

            if (typeof oceanInstance !== "undefined") {
                await oceanInstance.transferOwnership(newAdmin, {gasPrice: gasPrice}),
                    logger.info(`Transferred ownership to ${newAdmin}`);
            }

            if (typeof plennyToken !== "undefined") {
                await plennyToken.transferOwnership(newAdmin, {gasPrice: gasPrice}),
                    logger.info(`Transferred ownership to ${newAdmin}`);
            }

            if (typeof daoInstance !== "undefined") {
                await daoInstance.transferOwnership(newAdmin, {gasPrice: gasPrice}),
                    logger.info(`Transferred ownership to ${newAdmin}`);
            }

            if (typeof treasuryInstance !== "undefined") {
                await treasuryInstance.transferOwnership(newAdmin, {gasPrice: gasPrice}),
                    logger.info(`Transferred ownership to ${newAdmin}`);
            }

            if (typeof lockingInstance !== "undefined") {
                await lockingInstance.transferOwnership(newAdmin, {gasPrice: gasPrice}),
                    logger.info(`Transferred ownership to ${newAdmin}`);
            }

            if (typeof rewardInstance !== "undefined") {
                await rewardInstance.transferOwnership(newAdmin, {gasPrice: gasPrice}),
                    logger.info(`Transferred ownership to ${newAdmin}`);
            }

            if (typeof feeInstance !== "undefined") {
                await feeInstance.transferOwnership(newAdmin, {gasPrice: gasPrice}),
                    logger.info(`Transferred ownership to ${newAdmin}`);
            }

            if (typeof electionInstance !== "undefined") {
                await electionInstance.transferOwnership(newAdmin, {gasPrice: gasPrice}),
                    logger.info(`Transferred ownership to ${newAdmin}`);
            }

            if (typeof coordinatorInstance !== "undefined") {
                await coordinatorInstance.transferOwnership(newAdmin, {gasPrice: gasPrice}),
                    logger.info(`Transferred ownership to ${newAdmin}`);
            }
        }

        // The owner of the ProxyAdmin can upgrade our contracts
        
        // if (actions.includes("transferAdminOwnership") && typeof daoInstance !== "undefined") {
        //     await admin.transferProxyAdminOwnership(newAdmin, {gasPrice: gasPrice});
        //     logger.info("Transfer Proxy Admin ownership succeeded");
        // }
    } else {
        throw 'Caller is not the owner!'
    }
};