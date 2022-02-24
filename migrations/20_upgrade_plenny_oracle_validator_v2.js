const logger = require('logops');
const {upgradeProxy} = require('@openzeppelin/truffle-upgrades');

// Existing contract deployed on LIVE
const PlennyOracleValidator = artifacts.require('PlennyOracleValidator');
// Replacement contract to be deployed on LIVE
const PlennyOracleValidatorV2 = artifacts.require('PlennyOracleValidatorV2');

module.exports = async function (deployer, network) {

	if (deployer) {
		const existing = await PlennyOracleValidator.deployed();
		const upgraded = await upgradeProxy(existing.address, PlennyOracleValidatorV2, {deployer});

		logger.info(`Contract Implementation Upgraded: from ${existing.address} to ${upgraded.address}`);
	}
};


