const {deployProxy} = require("@openzeppelin/truffle-upgrades");
const PlennyContractRegistry = artifacts.require("PlennyContractRegistry");
const PlennyValidatorElection = artifacts.require("PlennyValidatorElection");

module.exports = async function (deployer) {
	const registry = await PlennyContractRegistry.deployed();
	await deployProxy(PlennyValidatorElection, [registry.address], {deployer});
};