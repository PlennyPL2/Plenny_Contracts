require("@babel/polyfill");

const {assert} = require("chai");
const {expectRevert} = require("@openzeppelin/test-helpers");
const {web3} = require("@openzeppelin/test-environment");

// Load compiled artifacts
const PlennyOceanV2 = artifacts.require('PlennyOceanV2');
const PlennyCoordinatorV2 = artifacts.require('PlennyCoordinatorV2');
const PlennyDappFactoryV2 = artifacts.require('PlennyDappFactoryV2');


contract("PlennyOcean", (accounts) => {
    let [owner, alice] = accounts;
    let plennyOceanV2;
    let plennyCoordinatorV2;
    let plennyDappFactoryV2;

    before(async () => {
        plennyOceanV2 = await PlennyOceanV2.deployed();
        plennyCoordinatorV2 = await PlennyCoordinatorV2.deployed();
        plennyDappFactoryV2 = await PlennyDappFactoryV2.deployed();
    });

    after(async () => {
        plennyOceanV2 = null;
        plennyCoordinatorV2 = null;
        plennyDappFactoryV2 = null;
    });

    describe("addMaker", async () => {
        it("should add/register a new maker in the ocean.", async () => {
            const makersCount = await plennyOceanV2.makersCount();
            assert.equal(makersCount.toString(), '0');

            await plennyOceanV2.addMaker('Maker', 'https://localhost:3001', '1', '10000000000', '1');
            const newMakersCount = await plennyOceanV2.makersCount();
            assert.equal(newMakersCount.toString(), '1');

            const maker = await plennyOceanV2.makers('1');
            assert.equal(maker.makerName.toString(), 'Maker');
            assert.equal(maker.makerServiceUrl.toString(), 'https://localhost:3001');
            assert.equal(maker.makerAddress.toString(), owner);
            assert.equal(maker.makerNodeIndex.toString(), '1');
            assert.equal(maker.makerProvidingAmount.toString(), '10000000000');
            assert.equal(maker.makerRatePl2Sat.toString(), '1');
        });
    });

    describe("removeMaker", async () => {
        it("should remove/unregister an existing maker in the ocean.", async () => {
            const makersCount = await plennyOceanV2.makersCount();
            assert.equal(makersCount.toString(), '1');

            await plennyOceanV2.removeMaker();
            const newMakersCount = await plennyOceanV2.makersCount();
            assert.equal(newMakersCount.toString(), '0');
        });
    });

    describe("setTakerFee", async () => {
        it("should change the taker fee, fail otherwise", async () => {
            const takerFee = await plennyOceanV2.takerFee();
            await plennyOceanV2.setTakerFee('100');
            const newTakerFee = await plennyOceanV2.takerFee();

            assert.equal(newTakerFee.toString(), '100');
            assert.notEqual(takerFee.toString(), newTakerFee.toString());
            await expectRevert(plennyOceanV2.setTakerFee('100', {from: alice}), "Ownable: caller is not the owner.");
        });
    });

    describe("setMakerCapacityOneTimeReward", async () => {
        it("should change the oracle fixed reward, fail otherwise", async () => {
            const makerCapacityOneTimeReward = await plennyOceanV2.makerCapacityOneTimeReward();
            await plennyOceanV2.setMakerCapacityOneTimeReward('100');
            const newMakerCapacityOneTimeReward = await plennyOceanV2.makerCapacityOneTimeReward();

            assert.equal(newMakerCapacityOneTimeReward.toString(), '100');
            assert.notEqual(makerCapacityOneTimeReward.toString(), newMakerCapacityOneTimeReward.toString());
            await expectRevert(plennyOceanV2.setMakerCapacityOneTimeReward('100', {from: alice}), "Ownable: caller is not the owner.");
        });
    });

    describe("setMakerRewardFee", async () => {
        it("should change the oracle fixed reward, fail otherwise", async () => {
            const makerRewardFee = await plennyOceanV2.makerRewardFee();
            await plennyOceanV2.setMakerRewardFee('100');
            const newMakerRewardFee = await plennyOceanV2.makerRewardFee();

            assert.equal(newMakerRewardFee.toString(), '100');
            assert.notEqual(makerRewardFee.toString(), newMakerRewardFee.toString());
            await expectRevert(plennyOceanV2.setMakerRewardFee('100', {from: alice}), "Ownable: caller is not the owner.");
        });
    });

    describe("getCapacityRequestPerMaker", async () => {
        it("should return the ids of liquidity requests for the given maker address.", async () => {
            const count = await plennyOceanV2.getCapacityRequestPerMaker(owner);
            assert.equal(count.toString(), '');
        });
    });

    describe("getCapacityRequestPerTaker", async () => {
        it("should return the ids of liquidity requests for the given maker address.", async () => {
            const count = await plennyOceanV2.getCapacityRequestPerMaker(alice);
            assert.equal(count.toString(), '');
        });
    });
});
