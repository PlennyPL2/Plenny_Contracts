const PlennyFee = artifacts.require("PlennyRePLENishment");
const {deployProxy} = require("@openzeppelin/truffle-upgrades");
const PlennyContractRegistry = artifacts.require("PlennyContractRegistry");

module.exports = async function (deployer, network) {
	const registry = await PlennyContractRegistry.deployed();
	await deployProxy(PlennyFee, [registry.address], {deployer});
};