require("@babel/polyfill");

const {assert} = require("chai");
const {expectRevert} = require("@openzeppelin/test-helpers");
const {web3} = require("@openzeppelin/test-environment");

// Load compiled artifacts
const PlennyERC20 = artifacts.require("PlennyERC20");
const PlennyDistribution = artifacts.require("PlennyDistribution");
const UniswapV2Pair = artifacts.require('IUniswapV2Pair');
const IUniswapV2Router02 = artifacts.require("IUniswapV2Router02");
const PlennyLiqMining = artifacts.require('PlennyLiqMining');
const PlennyLockingPoSLT = artifacts.require('PlennyLockingPoSLT');
const PlennyRePLENishmentV3 = artifacts.require('PlennyRePLENishmentV3');
const PlennyContractRegistry = artifacts.require('PlennyContractRegistry');

contract("PlennyReplenishment", (accounts) => {
    let [owner, alice] = accounts;
    let plennyToken;
    let plennyTokenAddress;
    let plennyDistribution;
    let plennyLiqMining;
    let plennyLockingPoSLT;
    let plennyRePLENishment;
    let plennyContractRegistry;
    let uniswapRouter;
    let uniswapV2Pair;
    let ethAddress;

    before(async () => {
        plennyDistribution = await PlennyDistribution.deployed();
        plennyTokenAddress = await plennyDistribution.getPlennyTokenAddress();
        plennyToken = await PlennyERC20.at(plennyTokenAddress);
        plennyLiqMining = await PlennyLiqMining.deployed();
        plennyLockingPoSLT = await PlennyLockingPoSLT.deployed();
        plennyRePLENishment = await PlennyRePLENishmentV3.deployed();
        plennyContractRegistry = await PlennyContractRegistry.deployed();
        uniswapRouter = await IUniswapV2Router02.at(await plennyContractRegistry.uniswapRouterV2());
        uniswapV2Pair = await UniswapV2Pair.at(await plennyContractRegistry.lpContract());
        ethAddress = await uniswapRouter.WETH();

        await plennyToken.approve(uniswapRouter.address, web3.utils.toWei('1000000000'), {from: owner});
        await uniswapRouter.addLiquidityETH(
            plennyToken.address,
            web3.utils.toWei('1000000'),
            web3.utils.toWei('1000000'),
            web3.utils.toWei('0.1'),
            owner, "1000000000000000000000",
            {from: owner, value: web3.utils.toWei('0.1')}
        );

        await plennyToken.approve(plennyLockingPoSLT.address, web3.utils.toWei('100000000'), {from: owner});
        await plennyLockingPoSLT.lockPlenny(web3.utils.toWei('100000000'), {from: owner});
        await plennyLockingPoSLT.unlockPlenny(web3.utils.toWei('100000000'), {from: owner});

        await uniswapV2Pair.approve(plennyLiqMining.address, web3.utils.toWei('10'), {from: owner});
        await plennyLiqMining.lockLP(web3.utils.toWei('10'), '0', {from: owner});
        await plennyLiqMining.withdrawLP('0'); // index 0
    });

    after(async () => {
        plennyDistribution = null;
        plennyTokenAddress = null;
        plennyToken = null;
        plennyLockingPoSLT = null;
        plennyRePLENishment = null;
        plennyContractRegistry = null;
        uniswapRouter = null;
        uniswapV2Pair = null;
        ethAddress = null;
    });

    describe("plennyReplenishment", async () => {
        it("should run the re-distribution of the fees by sending all the fees directly to the Treasury HODL", async () => {
            const pl2Fee = await plennyToken.balanceOf(plennyRePLENishment.address);
            const slpFee = await uniswapV2Pair.balanceOf(plennyRePLENishment.address);

            assert.equal(pl2Fee, '1000000000000000000000000');
            assert.equal(slpFee, '50000000000000000');
            await plennyRePLENishment.plennyReplenishment();

            const newPl2Fee = await plennyToken.balanceOf(plennyRePLENishment.address);
            const newSlpFee = await uniswapV2Pair.balanceOf(plennyRePLENishment.address);
            assert.equal(newPl2Fee, '0');
            assert.equal(newSlpFee, '0');
        });
    });

    describe("setBuyBackPercentagePl2", async () => {
        it("should change the buyback percentage, fail otherwise", async () => {
            const buyBackPercentagePl2 = await plennyRePLENishment.buyBackPercentagePl2();
            await plennyRePLENishment.setBuyBackPercentagePl2('100');
            const newBuyBackPercentagePl2 = await plennyRePLENishment.buyBackPercentagePl2();

            assert.notEqual(Number(buyBackPercentagePl2), Number(newBuyBackPercentagePl2));
            assert.equal(newBuyBackPercentagePl2.toString(), '100');
            await expectRevert(plennyRePLENishment.setBuyBackPercentagePl2('100', {from: alice}));
        });
    });

    describe("setLpBurningPercentage", async () => {
        it("should change the LP burning percentage, fail otherwise", async () => {
            const lpBurningPercentage = await plennyRePLENishment.lpBurningPercentage();
            await plennyRePLENishment.setLpBurningPercentage('100');
            const newLpBurningPercentage = await plennyRePLENishment.lpBurningPercentage();

            assert.notEqual(Number(lpBurningPercentage), Number(newLpBurningPercentage));
            assert.equal(newLpBurningPercentage.toString(), '100');
            await expectRevert(plennyRePLENishment.setLpBurningPercentage('100', {from: alice}));
        });
    });

    describe("setReplenishRewardPercentage", async () => {
        it("should change the replenishment reward percentage, fail otherwise", async () => {
            const replenishRewardPercentage = await plennyRePLENishment.replenishRewardPercentage();
            await plennyRePLENishment.setReplenishRewardPercentage('100');
            const newReplenishRewardPercentage = await plennyRePLENishment.replenishRewardPercentage();

            assert.notEqual(Number(replenishRewardPercentage), Number(newReplenishRewardPercentage));
            assert.equal(newReplenishRewardPercentage.toString(), '100');
            await expectRevert(plennyRePLENishment.setReplenishRewardPercentage('100', {from: alice}));
        });
    });

    describe("setDailyInflationRewardPercentage", async () => {
        it("should change the daily inflation reward percentage, fail otherwise", async () => {
            const dailyInflationRewardPercentage = await plennyRePLENishment.dailyInflationRewardPercentage();
            await plennyRePLENishment.setDailyInflationRewardPercentage('100');
            const newDailyInflationRewardPercentage = await plennyRePLENishment.dailyInflationRewardPercentage();

            assert.notEqual(Number(dailyInflationRewardPercentage), Number(newDailyInflationRewardPercentage));
            assert.equal(newDailyInflationRewardPercentage.toString(), '100');
            await expectRevert(plennyRePLENishment.setDailyInflationRewardPercentage('100', {from: alice}));
        });
    });

    describe("setLpThresholdForBurning", async () => {
        it("should change the LP threshold for burning, fail otherwise", async () => {
            const lpThresholdForBurning = await plennyRePLENishment.lpThresholdForBurning();
            await plennyRePLENishment.setLpThresholdForBurning(web3.utils.toWei('50'));
            const newLpThresholdForBurning = await plennyRePLENishment.lpThresholdForBurning();

            assert.notEqual(Number(lpThresholdForBurning), Number(newLpThresholdForBurning));
            assert.equal(newLpThresholdForBurning.toString(), web3.utils.toWei('50'));
            await expectRevert(plennyRePLENishment.setLpThresholdForBurning('50', {from: alice}));
        });
    });

    describe("setPlennyThresholdForBuyback", async () => {
        it("should change the PL2 threshold for buyback, fail otherwise", async () => {
            const plennyThresholdForBuyback = await plennyRePLENishment.plennyThresholdForBuyback();
            await plennyRePLENishment.setPlennyThresholdForBuyback(web3.utils.toWei('50'));
            const newPlennyThresholdForBuyback = await plennyRePLENishment.plennyThresholdForBuyback();

            assert.notEqual(Number(plennyThresholdForBuyback), Number(newPlennyThresholdForBuyback));
            assert.equal(newPlennyThresholdForBuyback.toString(), web3.utils.toWei('50'));
            await expectRevert(plennyRePLENishment.setPlennyThresholdForBuyback('50', {from: alice}));
        });
    });

    describe("setMaintenanceBlockLimit", async () => {
        it("should change the maintenance block limit, fail otherwise", async () => {
            const maintenanceBlockLimit = await plennyRePLENishment.maintenanceBlockLimit();
            await plennyRePLENishment.setMaintenanceBlockLimit('5');
            const newMaintenanceBlockLimit = await plennyRePLENishment.maintenanceBlockLimit();

            assert.notEqual(Number(maintenanceBlockLimit), Number(newMaintenanceBlockLimit));
            assert.equal(newMaintenanceBlockLimit.toString(), '5');
            await expectRevert(plennyRePLENishment.setMaintenanceBlockLimit('5', {from: alice}));
        });
    });

    describe("setInflationAmountPerBlock", async () => {
        it("should change the inflation amount per block, fail otherwise", async () => {
            const inflationAmountPerBlock = await plennyRePLENishment.inflationAmountPerBlock();
            await plennyRePLENishment.setInflationAmountPerBlock(web3.utils.toWei('10'));
            const newInflationAmountPerBlock = await plennyRePLENishment.inflationAmountPerBlock();

            assert.notEqual(Number(inflationAmountPerBlock), Number(newInflationAmountPerBlock));
            assert.equal(newInflationAmountPerBlock.toString(), web3.utils.toWei('10'));
            await expectRevert(plennyRePLENishment.setInflationAmountPerBlock('10', {from: alice}));
        });
    });
});
