const logger = require('logops');
const {upgradeProxy} = require('@openzeppelin/truffle-upgrades');

// Existing contract deployed on LIVE
const PlennyValidatorElection = artifacts.require('PlennyValidatorElection');
// Replacement contract to be deployed on LIVE
const PlennyValidatorElectionV2 = artifacts.require('PlennyValidatorElectionV2');

module.exports = async function (deployer, network) {

	if (deployer) {
		const existing = await PlennyValidatorElection.deployed();
		const upgraded = await upgradeProxy(existing.address, PlennyValidatorElectionV2, {deployer});

		logger.info(`Contract Implementation Upgraded: from ${existing.address} to ${upgraded.address}`);
	}
};


