const {deployProxy} = require("@openzeppelin/truffle-upgrades");
const PlennyDappFactory = artifacts.require("PlennyDappFactory");
const PlennyContractRegistry = artifacts.require("PlennyContractRegistry");

module.exports = async function (deployer) {
	await deployProxy(PlennyContractRegistry, [], {deployer});
	const registry = await PlennyContractRegistry.deployed();
	await deployProxy(PlennyDappFactory, [registry.address], {deployer});
};