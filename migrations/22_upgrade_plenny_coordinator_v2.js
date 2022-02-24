const logger = require('logops');
const {upgradeProxy} = require('@openzeppelin/truffle-upgrades');

// Existing contract deployed on LIVE
const PlennyCoordinator = artifacts.require('PlennyCoordinator');
// Replacement contract to be deployed on LIVE
const PlennyCoordinatorV2 = artifacts.require('PlennyCoordinatorV2');

module.exports = async function (deployer, network) {

	if (deployer) {
		const existing = await PlennyCoordinator.deployed();
		const upgraded = await upgradeProxy(existing.address, PlennyCoordinatorV2, {deployer});

		logger.info(`Contract Implementation Upgraded: from ${existing.address} to ${upgraded.address}`);
	}
};