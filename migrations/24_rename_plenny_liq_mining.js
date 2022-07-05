const logger = require('logops');
const {upgradeProxy} = require('@openzeppelin/truffle-upgrades');

// Existing contract deployed on LIVE
const PlennyLiqMining = artifacts.require('PlennyLiqMining');

// Replacement contract to be deployed on LIVE
const PlennyLiqStaking = artifacts.require('PlennyLiqStaking');

module.exports = async function (deployer, network) {
	if (deployer) {
		const mining = await PlennyLiqMining.deployed();
		const plennyLiqStaking = await upgradeProxy(mining.address, PlennyLiqStaking, {deployer});
		logger.info(`PlennyLiqStaking Smart Contract Implementation Upgraded: from ${mining.address} to ${plennyLiqStaking.address}`);
	}
};