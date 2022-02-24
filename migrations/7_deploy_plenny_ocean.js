const PlennyOcean = artifacts.require("PlennyOcean");
const {deployProxy} = require("@openzeppelin/truffle-upgrades");
const PlennyContractRegistry = artifacts.require("PlennyContractRegistry");

module.exports = async function (deployer) {
	const registry = await PlennyContractRegistry.deployed();
	await deployProxy(PlennyOcean, [registry.address], {deployer});
};