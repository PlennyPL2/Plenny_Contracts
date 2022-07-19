require("@babel/polyfill");

const {assert} = require("chai");
const {expectRevert} = require("@openzeppelin/test-helpers");

// Load compiled artifacts
const PlennyERC20 = artifacts.require("PlennyERC20");
const PlennyDistribution = artifacts.require("PlennyDistribution");
const PlennyCoordinatorV2 = artifacts.require('PlennyCoordinatorV2');
const PlennyLockingPoSLT = artifacts.require('PlennyLockingPoSLT');
const PlennyDappFactoryV2 = artifacts.require('PlennyDappFactoryV2');
const PlennyContractRegistry = artifacts.require('PlennyContractRegistry');
const PlennyOracleValidatorV2 = artifacts.require('PlennyOracleValidatorV2');


contract("PlennyOracleValidator", (accounts) => {
    let [owner, alice] = accounts;
    let plennyToken;
    let plennyTokenAddress;
    let plennyDistribution;
    let plennyLockingPoSLT;
    let plennyDappFactoryV2;
    let plennyCoordinatorV2;
    let plennyContractRegistry;
    let plennyOracleValidatorV2;


    before(async () => {
        plennyDistribution = await PlennyDistribution.deployed();
        plennyTokenAddress = await plennyDistribution.getPlennyTokenAddress();
        plennyToken = await PlennyERC20.at(plennyTokenAddress);
        plennyLockingPoSLT = await PlennyLockingPoSLT.deployed();
        plennyDappFactoryV2 = await PlennyDappFactoryV2.deployed();
        plennyCoordinatorV2 = await PlennyCoordinatorV2.deployed();
        plennyContractRegistry = await PlennyContractRegistry.deployed();
        plennyOracleValidatorV2 = await PlennyOracleValidatorV2.deployed();
    });

    after(async () => {
        plennyDistribution = null;
        plennyTokenAddress = null;
        plennyToken = null;
        plennyLockingPoSLT = null;
        plennyDappFactoryV2 = null;
        plennyCoordinatorV2 = null;
        plennyContractRegistry = null;
        plennyOracleValidatorV2 = null;
    });

    describe("minQuorum", async () => {
        it("should return minimum quorum for reaching the oracle validator consensus.", async () => {
            const minQuorum = await plennyOracleValidatorV2.minQuorum();
            assert.equal(minQuorum.toString(), '1');
        });
    });

    describe("setOracleRewardPercentage", async () => {
        it("should change the oracle reward percentage, fail otherwise ", async () => {
            const oracleRewardPercentage = await plennyOracleValidatorV2.oracleRewardPercentage();
            await plennyOracleValidatorV2.setOracleRewardPercentage('100');
            const newOracleRewardPercentage = await plennyOracleValidatorV2.oracleRewardPercentage();

            assert.equal(newOracleRewardPercentage.toString(), '100');
            assert.notEqual(oracleRewardPercentage.toString(), newOracleRewardPercentage.toString());
            await expectRevert(plennyOracleValidatorV2.setOracleRewardPercentage('100', {from: alice}), "Ownable: caller is not the owner.");
        });
    });

    describe("setOracleFixedRewardAmount", async () => {
        it("should change the oracle fixed reward, fail otherwise", async () => {
            const oracleFixedRewardAmount = await plennyOracleValidatorV2.oracleFixedRewardAmount();
            await plennyOracleValidatorV2.setOracleFixedRewardAmount('100');
            const newOracleFixedRewardAmount = await plennyOracleValidatorV2.oracleFixedRewardAmount();

            assert.equal(newOracleFixedRewardAmount.toString(), '100');
            assert.notEqual(oracleFixedRewardAmount.toString(), newOracleFixedRewardAmount.toString());
            await expectRevert(plennyOracleValidatorV2.setOracleRewardPercentage('100', {from: alice}), "Ownable: caller is not the owner.");
        });
    });
});
