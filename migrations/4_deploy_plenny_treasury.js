const PlennyTreasury = artifacts.require("PlennyTreasury");
const {deployProxy} = require("@openzeppelin/truffle-upgrades");
const PlennyContractRegistry = artifacts.require("PlennyContractRegistry");

module.exports = async function (deployer) {
	const registry = await PlennyContractRegistry.deployed();
	await deployProxy(PlennyTreasury, [registry.address], {deployer});
};