const PlennyDistribution = artifacts.require("PlennyDistribution");
const PlennyERC20 = artifacts.require("PlennyERC20");
const PlennyArbERC20 = artifacts.require("PlennyArbERC20");

module.exports = async function (deployer, network, accounts) {

	let plennyLogicInstance;

	if (network === "arbitrum" || network === "arbitrum-testnet") {
		await deployer.deploy(PlennyArbERC20);
		plennyLogicInstance = await PlennyArbERC20.deployed();
	} else {
		await deployer.deploy(PlennyERC20);
		plennyLogicInstance = await PlennyERC20.deployed();
	}

	// deploy the TGE
	await deployer.deploy(PlennyDistribution, plennyLogicInstance.address);
};
