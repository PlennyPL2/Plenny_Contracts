require("@babel/polyfill");

const {assert} = require("chai");
const {expectRevert} = require("@openzeppelin/test-helpers");
const {web3} = require("@openzeppelin/test-environment");

// Load compiled artifacts
const PlennyERC20 = artifacts.require("PlennyERC20");
const PlennyReward = artifacts.require('PlennyReward');
const PlennyDistribution = artifacts.require('PlennyDistribution');
const PlennyContractRegistry = artifacts.require('PlennyContractRegistry');

contract("PlennyReward", (accounts) => {
    let [owner] = accounts;
    let plennyDistribution;
    let plennyTokenAddress;
    let plennyToken;
    let plennyReward;
    let plennyContractRegistry;

    before(async () => {
        plennyDistribution = await PlennyDistribution.deployed();
        plennyTokenAddress = await plennyDistribution.getPlennyTokenAddress();
        plennyToken = await PlennyERC20.at(plennyTokenAddress);
        plennyReward = await PlennyReward.deployed();
        plennyContractRegistry = await PlennyContractRegistry.deployed();

        const balanceToTransferToTH = '150000000';
        await plennyToken.transfer(plennyReward.address, web3.utils.toWei(balanceToTransferToTH));
    });

    after(async () => {
        plennyDistribution = null;
        plennyTokenAddress = null;
        plennyToken = null;
        plennyReward = null;
        plennyContractRegistry = null;
    });

    describe("transfer", async () => {
        it("should return true when transfer can be made, false otherwise", async () => {
            const miningAddress = await plennyContractRegistry.getAddressByString("PlennyLiqMining");
            const lockingAddress = await plennyContractRegistry.getAddressByString("PlennyLocking");

            assert.isTrue(await plennyReward.transfer.call(owner, web3.utils.toWei("1"), {from: miningAddress}));
            assert.isTrue(await plennyReward.transfer.call(owner, web3.utils.toWei("1"), {from: lockingAddress}));
            await expectRevert(plennyReward.transfer.call(owner, web3.utils.toWei("1"), {from: owner}), "ERR_NOT_AUTH");
        });

        it("should return true when called with amount of 0", async () => {
            const miningAddress = await plennyContractRegistry.getAddressByString("PlennyLiqMining");
            assert.isTrue(await plennyReward.transfer.call(owner, web3.utils.toWei("0"), {from: miningAddress}));
        });
    });
});
