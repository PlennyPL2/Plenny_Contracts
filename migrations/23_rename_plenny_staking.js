const logger = require('logops');
const {upgradeProxy} = require('@openzeppelin/truffle-upgrades');

// Existing contract deployed on LIVE
const PlennyStaking = artifacts.require('PlennyStaking');

// Replacement contract to be deployed on LIVE
const PlennyLockingPoSLT = artifacts.require('PlennyLockingPoSLT');

module.exports = async function (deployer, network) {
	if (deployer) {
		const staking = await PlennyStaking.deployed();
		const plennyLockingPoSLT = await upgradeProxy(staking.address, PlennyLockingPoSLT, {deployer});
		logger.info(`PlennyLockingPoSLT Smart Contract Implementation Upgraded: from ${staking.address} to ${plennyLockingPoSLT.address}`);
	}
};