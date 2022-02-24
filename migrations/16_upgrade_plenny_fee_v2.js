const logger = require('logops');
const {upgradeProxy} = require('@openzeppelin/truffle-upgrades');

// Existing contract deployed on LIVE
const PlennyRePLENishment = artifacts.require('PlennyRePLENishment');
// Replacement contract to be deployed on LIVE
const PlennyRePLENishmentV2 = artifacts.require('PlennyRePLENishmentV2');

module.exports = async function (deployer, network) {

	if (deployer) {
		const existing = await PlennyRePLENishment.deployed();
		const upgraded = await upgradeProxy(existing.address, PlennyRePLENishmentV2, {deployer});

		logger.info(`Contract Implementation Upgraded: from ${existing.address} to ${upgraded.address}`);
	}
};