const logger = require('logops');
const {upgradeProxy} = require('@openzeppelin/truffle-upgrades');

// Existing contract deployed on LIVE
const PlennyRePLENishmentV2 = artifacts.require('PlennyRePLENishmentV2');
// Replacement contract to be deployed on LIVE
const PlennyRePLENishmentV3 = artifacts.require('PlennyRePLENishmentV3');

module.exports = async function (deployer, network) {

	if (deployer) {
		const existing = await PlennyRePLENishmentV2.deployed();
		const upgraded = await upgradeProxy(existing.address, PlennyRePLENishmentV3, {deployer});

		logger.info(`Contract Implementation Upgraded: from ${existing.address} to ${upgraded.address}`);
	}
};