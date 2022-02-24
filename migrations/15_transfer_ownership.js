const logger = require("logops");
const {checkAndRetrieveArtifact, checkAndRetrieveContract} = require("../scripts/deployment/helper");
const PlennyDao = artifacts.require("PlennyDao");
const PlennyFee = artifacts.require('PlennyRePLENishment');
const PlennyFeeV2 = checkAndRetrieveArtifact('PlennyRePLENishmentV2');
const PlennyFeeV3 = checkAndRetrieveArtifact('PlennyRePLENishmentV3');
const PlennyOcean = artifacts.require("PlennyOcean");
const PlennyERC20 = artifacts.require("PlennyERC20");
const PlennyReward = artifacts.require("PlennyReward");
const PlennyLocking = artifacts.require("PlennyLocking");
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

	// create contract instances
	const daoInstance = await checkAndRetrieveContract(PlennyDao);
	const feeInstance = await checkAndRetrieveContract(PlennyFee, PlennyFeeV2, PlennyFeeV3);
	const oceanInstance = await checkAndRetrieveContract(PlennyOcean);
	const rewardInstance = await checkAndRetrieveContract(PlennyReward);
	const lockingInstance = await checkAndRetrieveContract(PlennyLocking);
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

  if (
    (await factoryInstance.owner() &&
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
    await coordinatorInstance.owner() )
    === accounts[0] ) {
      // minters & pausers
      if (actions.includes("addPauser")) {
        if (typeof factoryInstance !== "undefined") {
          await factoryInstance.addPauser(PlennyDao.address, {gasPrice: gasPrice});
          logger.info(`Contract: ${factoryInstance.address} ==> Pauser: ${daoInstance.address}`);
        }

        if (typeof validatorInstance !== "undefined") {
          await validatorInstance.addPauser(PlennyDao.address, {gasPrice: gasPrice});
          logger.info(`Contract: ${validatorInstance.address} ==> Pauser: ${daoInstance.address}`);
        }

        if (typeof treasuryInstance !== "undefined") {
          await treasuryInstance.addPauser(PlennyDao.address, {gasPrice: gasPrice});
          logger.info(`Contract: ${treasuryInstance.address} ==> Pauser: ${daoInstance.address}`);
        }

        if (typeof plennyToken !== "undefined") {
          await plennyToken.addPauser(PlennyDao.address, {gasPrice: gasPrice});
          logger.info(`Contract: ${plennyToken.address} ==> Pauser: ${daoInstance.address}`);
        }

        if (typeof plennyToken !== "undefined") {
          await plennyToken.addMinter(PlennyDao.address, {gasPrice: gasPrice});
          logger.info(`Contract: ${plennyToken.address} ==> Minter: ${daoInstance.address}`);
        }
      }

      // transfer ownership
      if (actions.includes("transferOwnership")) {
        if (typeof factoryInstance !== "undefined") {
          await factoryInstance.transferOwnership(daoInstance.address, {gasPrice: gasPrice});
          logger.info(`Transferred ownership to ${daoInstance.address}`);
        }

        if (typeof validatorInstance !== "undefined") {
          await validatorInstance.transferOwnership(daoInstance.address, {gasPrice: gasPrice}),
            logger.info(`Transferred ownership to ${daoInstance.address}`);
        }

        if (typeof miningInstance !== "undefined") {
          await miningInstance.transferOwnership(daoInstance.address, {gasPrice: gasPrice}),
            logger.info(`Transferred ownership to ${daoInstance.address}`);
        }

        if (typeof stakingInstance !== "undefined") {
          await stakingInstance.transferOwnership(daoInstance.address, {gasPrice: gasPrice}),
            logger.info(`Transferred ownership to ${daoInstance.address}`);
        }

        if (typeof oceanInstance !== "undefined") {
          await oceanInstance.transferOwnership(daoInstance.address, {gasPrice: gasPrice}),
            logger.info(`Transferred ownership to ${daoInstance.address}`);
        }

        if (typeof plennyToken !== "undefined") {
          await plennyToken.transferOwnership(daoInstance.address, {gasPrice: gasPrice}),
            logger.info(`Transferred ownership to ${daoInstance.address}`);
        }

        if (typeof daoInstance !== "undefined") {
          await daoInstance.transferOwnership(daoInstance.address, {gasPrice: gasPrice}),
            logger.info(`Transferred ownership to ${daoInstance.address}`);
        }

        if (typeof treasuryInstance !== "undefined") {
          await treasuryInstance.transferOwnership(daoInstance.address, {gasPrice: gasPrice}),
            logger.info(`Transferred ownership to ${daoInstance.address}`);
        }

        if (typeof lockingInstance !== "undefined") {
          await lockingInstance.transferOwnership(daoInstance.address, {gasPrice: gasPrice}),
            logger.info(`Transferred ownership to ${daoInstance.address}`);
        }

        if (typeof rewardInstance !== "undefined") {
          await rewardInstance.transferOwnership(daoInstance.address, {gasPrice: gasPrice}),
            logger.info(`Transferred ownership to ${daoInstance.address}`);
        }

        if (typeof feeInstance !== "undefined") {
          await feeInstance.transferOwnership(daoInstance.address, {gasPrice: gasPrice}),
            logger.info(`Transferred ownership to ${daoInstance.address}`);
        }

        if (typeof electionInstance !== "undefined") {
          await electionInstance.transferOwnership(daoInstance.address, {gasPrice: gasPrice}),
            logger.info(`Transferred ownership to ${daoInstance.address}`);
        }

        if (typeof coordinatorInstance !== "undefined") {
          await coordinatorInstance.transferOwnership(daoInstance.address, {gasPrice: gasPrice}),
            logger.info(`Transferred ownership to ${daoInstance.address}`);
        }
      }

      // The owner of the ProxyAdmin can upgrade our contracts
      if (actions.includes("transferAdminOwnership") && typeof daoInstance !== "undefined") {
        await admin.transferProxyAdminOwnership(daoInstance.address, {gasPrice: gasPrice});
        logger.info("Transfer Proxy Admin ownership succeeded");
      }
  } else {
    throw 'Caller is not the owner!'
  }
};