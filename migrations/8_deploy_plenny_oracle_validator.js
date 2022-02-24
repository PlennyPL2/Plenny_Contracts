const {deployProxy} = require("@openzeppelin/truffle-upgrades");
const PlennyContractRegistry = artifacts.require("PlennyContractRegistry");
const PlennyOracleValidator = artifacts.require("PlennyOracleValidator");

module.exports = async function (deployer) {
	const registry = await PlennyContractRegistry.deployed();
	await deployProxy(PlennyOracleValidator, [registry.address], {deployer});
};