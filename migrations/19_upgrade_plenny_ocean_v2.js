const logger = require('logops');
const {upgradeProxy} = require('@openzeppelin/truffle-upgrades');

// Existing contract deployed on LIVE
const PlennyOcean = artifacts.require('PlennyOcean');
// Replacement contract to be deployed on LIVE
const PlennyOceanV2 = artifacts.require('PlennyOceanV2');

module.exports = async function (deployer, network) {

	if (deployer) {
		const existing = await PlennyOcean.deployed();
		const upgraded = await upgradeProxy(existing.address, PlennyOceanV2, {deployer});

		logger.info(`Contract Implementation Upgraded: from ${existing.address} to ${upgraded.address}`);
	}
};


