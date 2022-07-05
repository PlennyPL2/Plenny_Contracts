const logger = require('logops');
const {upgradeProxy} = require('@openzeppelin/truffle-upgrades');

const PlennyRePLENishment = artifacts.require('PlennyRePLENishmentV3');

// Existing contract deployed on LIVE
const PlennyStaking = artifacts.require('PlennyStaking');

// Replacement contract to be deployed on LIVE
const PlennyLockingPoSLT = artifacts.require('PlennyLockingPoSLT');

module.exports = async function (deployer, network) {

	if (deployer) {
		const replenishment = await PlennyRePLENishment.deployed();
		const upgraded = await upgradeProxy(replenishment.address, PlennyRePLENishment, {deployer});
		logger.info(`PlennyRePLENishment Smart Contract Implementation Upgraded: from ${replenishment.address} to ${upgraded.address}`);

		const staking = await PlennyStaking.deployed();
		const plennyLockingPoSLT = await upgradeProxy(staking.address, PlennyLockingPoSLT, {deployer});
		logger.info(`PlennyLockingPoSLT Smart Contract Implementation Upgraded: from ${staking.address} to ${plennyLockingPoSLT.address}`);
	}
};
