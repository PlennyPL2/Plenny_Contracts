const logger = require('logops');
const {upgradeProxy} = require('@openzeppelin/truffle-upgrades');

// Existing contract deployed on LIVE
const PlennyDappFactory = artifacts.require('PlennyDappFactory');
// Replacement contract to be deployed on LIVE
const PlennyDappFactoryV2 = artifacts.require('PlennyDappFactoryV2');

module.exports = async function (deployer, network) {

	if (deployer) {
		const existing = await PlennyDappFactory.deployed();
		const upgraded = await upgradeProxy(existing.address, PlennyDappFactoryV2, {deployer});

		logger.info(`Contract Implementation Upgraded: from ${existing.address} to ${upgraded.address}`);
	}
};


