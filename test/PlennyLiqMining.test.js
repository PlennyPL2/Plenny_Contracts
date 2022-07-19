require("@babel/polyfill");

const {assert, expect} = require('chai');
const {mineBlocks} = require('./helpers/helper');
const {expectRevert} = require("@openzeppelin/test-helpers");

// Load compiled artifacts
const PlennyERC20 = artifacts.require("PlennyERC20");
const PlennyDistribution = artifacts.require('PlennyDistribution');
const PlennyLiqMining = artifacts.require('PlennyLiqMining');
const PlennyReward = artifacts.require('PlennyReward');
const UniswapV2Pair = artifacts.require('IUniswapV2Pair');
const PlennyContractRegistry = artifacts.require("PlennyContractRegistry");
const IUniswapV2Router02 = artifacts.require("IUniswapV2Router02");

contract('PlennyLiqMining', (accounts) => {

    let owner = accounts[0];
    let account_two = accounts[1];

    let registryInstance;
    let plennyDistributionInstance;
    let plennyAddress;
    let plennyToken;
    let miningInstance;
    let rewardHodlInstance;
    let uniswapV2Pair;

    const balanceToTransferToRH = '150000000';

    before(async () => {
        try {
            const registry = await PlennyContractRegistry.deployed();
            const plennyDistribution = await PlennyDistribution.deployed();
            const plennyAddress = await plennyDistribution.getPlennyTokenAddress();
            const plennyToken = await PlennyERC20.at(plennyAddress);
            const uniswapRouter = await IUniswapV2Router02.at(await registry.uniswapRouterV2());

            const uniswapV2Pair = await UniswapV2Pair.at(await registry.lpContract());

            await plennyToken.approve(uniswapRouter.address, web3.utils.toWei('1000000000'), {from: owner});

            await uniswapRouter.addLiquidityETH(
                plennyToken.address,
                web3.utils.toWei('1000000'),
                web3.utils.toWei('1000000'),
                web3.utils.toWei('0.1'),
                owner, "1000000000000000000000",
                {from: owner, value: web3.utils.toWei('0.1')}
            );

            const lpBalance = await uniswapV2Pair.balanceOf(owner);
            console.log('lp balance: ' + web3.utils.fromWei(lpBalance));
        } catch (e) {
            console.log(e);
        }
    })

    beforeEach(async () => {
        registryInstance = await PlennyContractRegistry.deployed();
        plennyDistributionInstance = await PlennyDistribution.deployed();
        plennyAddress = await plennyDistributionInstance.getPlennyTokenAddress();
        plennyToken = await PlennyERC20.at(plennyAddress);
        miningInstance = await PlennyLiqMining.deployed();
        rewardHodlInstance = await PlennyReward.deployed();
        uniswapV2Pair = await UniswapV2Pair.at(await registryInstance.lpContract());

        // set averageBlocksPerWeek = 1
        await miningInstance.setAverageBlockCountPerWeek('1');

        // set nextDistributionBlocks = 15
        await miningInstance.setNextDistributionSeconds('15');
    });

    afterEach(async () => {
        registryInstance = null
        plennyDistributionInstance = null;
        plennyAddress = null;
        plennyToken = null;
        miningInstance = null;
        rewardHodlInstance = null;
        uniswapV2Pair = null;
    });

    describe("PlennyLiqMining - lockLP", async () => {

        it('should not allow to stake SLP-PL2 when the spending of plenny is not approved', async () => {
            let stakeAmount = '1';
            let stakedBalance = '0';
            let period = '0';

            expect(await miningInstance.totalUserLocked(owner)).to.be.bignumber.equal(web3.utils.toWei(stakedBalance));
            await expectRevert(miningInstance.lockLP(web3.utils.toWei(stakeAmount), period, {from: owner}), 'revert');
            expect(await miningInstance.totalUserLocked(owner)).to.be.bignumber.equal(web3.utils.toWei(stakedBalance));
        });

        it('should not allow to stake SLP-PL2 when the amount is not set', async () => {
            let stakeAmount = '1';
            let stakedBalance = '0';
            let period = '0';

            expect(await miningInstance.totalUserLocked(owner)).to.be.bignumber.equal(web3.utils.toWei(stakedBalance));
            await expectRevert(miningInstance.lockLP(period), 'Invalid number of parameters for "lockLP". Got 1 expected 2!');
            expect(await miningInstance.totalUserLocked(owner)).to.be.bignumber.equal(web3.utils.toWei(stakedBalance));
        });

        it('should not allow to stake SLP-PL2 when the period is not set', async () => {
            let stakeAmount = '1';
            let stakedBalance = '0';
            let period = '0';

            expect(await miningInstance.totalUserLocked(owner)).to.be.bignumber.equal(web3.utils.toWei(stakedBalance));
            await expectRevert(miningInstance.lockLP(web3.utils.toWei(stakeAmount)), 'Invalid number of parameters for "lockLP". Got 1 expected 2!');
            expect(await miningInstance.totalUserLocked(owner)).to.be.bignumber.equal(web3.utils.toWei(stakedBalance));
        });

        it('should not allow to stake SLP-PL2 when the amount & period are not set', async () => {
            let stakedBalance = '0';

            expect(await miningInstance.totalUserLocked(owner)).to.be.bignumber.equal(web3.utils.toWei(stakedBalance));
            await expectRevert(miningInstance.lockLP(), 'Invalid number of parameters for "lockLP". Got 0 expected 2!');
            expect(await miningInstance.totalUserLocked(owner)).to.be.bignumber.equal(web3.utils.toWei(stakedBalance));
        });

        it('should not allow to stake SLP-PL2 when the amount is negative integer number', async () => {
            let stakeAmount = '-10';
            let stakedBalance = '0';

            expect(await miningInstance.totalUserLocked(owner)).to.be.bignumber.equal(web3.utils.toWei(stakedBalance));
            await expectRevert(miningInstance.lockLP(web3.utils.toWei(stakeAmount), {from: owner}), 'value out-of-bounds');
            expect(await miningInstance.totalUserLocked(owner)).to.be.bignumber.equal(web3.utils.toWei(stakedBalance));
        });

        it('should not allow to stake SLP-PL2 when the amount is negative decimal number', async () => {
            let stakeAmount = '-10.5';
            let stakedBalance = '0';

            expect(await miningInstance.totalUserLocked(owner)).to.be.bignumber.equal(web3.utils.toWei(stakedBalance));
            await expectRevert(miningInstance.lockLP(web3.utils.toWei(stakeAmount), {from: owner}), 'value out-of-bounds');
            expect(await miningInstance.totalUserLocked(owner)).to.be.bignumber.equal(web3.utils.toWei(stakedBalance));
        });

        it(`should not allow to stake SLP-PL2 when the amount is greater than user's wallet balance`, async () => {
            const ownerLPBalance = await uniswapV2Pair.balanceOf(owner);
            let ownerLPBalanceString = web3.utils.fromWei(ownerLPBalance).toString();
            let totalUserLockedMultiplied = Number(ownerLPBalanceString) + 5;
            let period = 0;

            await uniswapV2Pair.approve(miningInstance.address, web3.utils.toWei(ownerLPBalance.toString()), {from: owner});
            await expectRevert(miningInstance.lockLP(web3.utils.toWei(totalUserLockedMultiplied.toString()), period,
                {from: owner}), 'ds-math-sub-underflow.');
        });

        it('should allow to stake SLP-PL2 when the amount is valid integer number', async () => {
            let stakeAmount = '10';
            let period = 0;

            let startingBalance = '0';
            let newBalance = stakeAmount;

            expect(await miningInstance.totalUserLocked(owner)).to.be.bignumber.equal(web3.utils.toWei(startingBalance));

            await uniswapV2Pair.approve(miningInstance.address, web3.utils.toWei(stakeAmount), {from: owner});
            await miningInstance.lockLP(web3.utils.toWei(stakeAmount), period, {from: owner});

            expect(await miningInstance.totalUserLocked(owner)).to.be.bignumber.equal(web3.utils.toWei(newBalance));
        });

        it('should allow to stake SLP-PL2 when the amount is valid decimal number', async () => {
            let stakeAmount = '0.5';
            let period = '0';

            let startingBalance = '10';
            let newBalance = '10.5';

            expect(await miningInstance.totalUserLocked(owner)).to.be.bignumber.equal(web3.utils.toWei(startingBalance));

            await uniswapV2Pair.approve(miningInstance.address, web3.utils.toWei(stakeAmount), {from: owner});
            await miningInstance.lockLP(web3.utils.toWei(stakeAmount), period, {from: owner});

            expect(await miningInstance.totalUserLocked(owner)).to.be.bignumber.equal(web3.utils.toWei(newBalance));
        });

        it(`should stake/transfer exact amount of tokens, as the user specified as a parameter`, async () => {
            let ownerPlennyBalance = await uniswapV2Pair.balanceOf(owner);
            let ownerPlennyBalanceString = web3.utils.fromWei(ownerPlennyBalance).toString();
            let stakeAmount = '100';
            let period = '0';

            await uniswapV2Pair.approve(miningInstance.address, web3.utils.toWei(stakeAmount), {from: owner});
            await miningInstance.lockLP(web3.utils.toWei(stakeAmount), period, {from: owner});

            let ownerPlennyBalanceAfterLock = await uniswapV2Pair.balanceOf(owner);

            expect(await uniswapV2Pair.balanceOf(owner)).to.be.bignumber.equal(ownerPlennyBalanceAfterLock.toString());
        });
    })

    describe("PlennyLiqMining - withdrawPlenny", async () => {

        it('should not allow to withdraw SLP-PL2 when the index is not set', async () => {
            let unstakeAmount = null;
            let stakedBalance = await miningInstance.totalUserLocked(owner);

            expect(await miningInstance.totalUserLocked(owner)).to.be.bignumber.equal(stakedBalance);
            await expectRevert(miningInstance.withdrawLP(), 'Invalid number of parameters for "withdrawLP". Got 0 expected 1!');
            expect(await miningInstance.totalUserLocked(owner)).to.be.bignumber.equal(stakedBalance);
        });

        it('should not allow to withdraw SLP-PL2 when the amount is negative decimal number', async () => {
            let index = '0.5';
            let startingBalance = await miningInstance.totalUserLocked(owner);

            await expectRevert(miningInstance.withdrawLP(index, {from: owner}), 'invalid BigNumber string');
            expect(await miningInstance.totalUserLocked(owner)).to.be.bignumber.equal(startingBalance);
        });

        it('should allow to withdraw SLP-PL2 when the index is valid integer number', async () => {
            let firstIndex = '0';
            let secondIndex = '1';
            let thirdIndex = '2';
            let newBalance = '0';
            let startingBalance = await miningInstance.totalUserLocked(owner);

            expect(await miningInstance.totalUserLocked(owner)).to.be.bignumber.equal(startingBalance.toString());
            await miningInstance.withdrawLP(thirdIndex);
            await miningInstance.withdrawLP(secondIndex);
            await miningInstance.withdrawLP(firstIndex);
            expect(await miningInstance.totalUserLocked(owner)).to.be.bignumber.equal(web3.utils.toWei(newBalance));
        });

        it('should not allow to withdraw SLP-PL2 when the index is negative integer number', async () => {
            let index = '-1';
            let newBalance = '0';
            let startingBalance = Number(await miningInstance.totalUserLocked(owner));

            expect(await miningInstance.totalUserLocked(owner)).to.be.bignumber.equal(startingBalance.toString());
            await expectRevert(miningInstance.withdrawLP(index, {from: owner}), 'value out-of-bounds');
            expect(await miningInstance.totalUserLocked(owner)).to.be.bignumber.equal(web3.utils.toWei(newBalance));
        });

        it('should allow to lock/withdraw plenny multiple times', async () => {
            let stakeAmount = '100';
            let period = '0';
            let firstIndex = '0';
            let secondIndex = '1';
            let newBalance = '0';

            // first stake
            await uniswapV2Pair.approve(miningInstance.address, web3.utils.toWei(stakeAmount), {from: owner});
            await miningInstance.lockLP(web3.utils.toWei(stakeAmount), period, {from: owner});

            // second stake
            await uniswapV2Pair.approve(miningInstance.address, web3.utils.toWei(stakeAmount), {from: owner});
            await miningInstance.lockLP(web3.utils.toWei(stakeAmount), period, {from: owner});

            // withdraw second staking record
            await miningInstance.withdrawLP(secondIndex);

            // withdraw first staking record
            await miningInstance.withdrawLP(firstIndex);
            expect(await miningInstance.totalUserLocked(owner)).to.be.bignumber.equal(web3.utils.toWei(newBalance));
        });

        it('should not allow to withdraw SLP-PL2 before the end block of the locked record', async () => {
            let stakeAmount = '100';
            let period = '1';
            let index = '0';

            await uniswapV2Pair.approve(miningInstance.address, web3.utils.toWei(stakeAmount), {from: owner});
            await miningInstance.lockLP(web3.utils.toWei(stakeAmount), period, {from: owner});

            await expectRevert(miningInstance.withdrawLP(index, {from: owner}), 'ERR_LOCKED');
        });

        it('should allow to withdraw SLP-PL2 after the end block of the locked record', async () => {
            let stakeAmount = '100';
            let period = '1';
            let index = '0';

            await miningInstance.withdrawLP(index);
        });
    });

    describe("PlennyLiqMining - relockLP", async () => {

        it('should not allow to relock plenny before the end block of the locked record', async () => {
            let stakeAmount = '100';
            let period = '1';
            let index = '0';
            let relockPeriod = '2';

            await uniswapV2Pair.approve(miningInstance.address, web3.utils.toWei(stakeAmount), {from: owner});
            await miningInstance.lockLP(web3.utils.toWei(stakeAmount), period, {from: owner});

            await expectRevert(miningInstance.relockLP(index, relockPeriod, {from: owner}), 'ERR_LOCKED');
        });

        it('should allow to relock plenny after the end block of the locked record', async () => {
            let stakeAmount = '100';
            let period = '1';
            let index = '0';
            let relockPeriod = '2';

            await miningInstance.relockLP(index, relockPeriod, {from: owner});
        });
    });

    describe("PlennyLiqMining - collectReward", async () => {

        it('should not allow to collect reward before the locked period', async () => {
            await expectRevert(miningInstance.collectReward(), 'ERR_LOCKED_PERIOD');
        });

        it('should allow to collect reward after the locked period', async () => {
            // transfer 150m PL2 to the Reward HODL
            await plennyToken.transfer(rewardHodlInstance.address, web3.utils.toWei(balanceToTransferToRH));

            let balanceBeforeCollection = '0';
            const ownerPlennyBalance = await uniswapV2Pair.balanceOf(owner);
            // transfer total balance from owner to account_two
            await uniswapV2Pair.transfer(account_two, ownerPlennyBalance);

            expect(await uniswapV2Pair.balanceOf(owner)).to.be.bignumber.equal(balanceBeforeCollection);
            // mine 20 blocks
            await mineBlocks();

            await miningInstance.collectReward();

            const ownerPlennyBalanceAfterCollection = await plennyToken.balanceOf(owner);

            assert.isAbove(Number(ownerPlennyBalanceAfterCollection), 0, 'Plenny balance of the owner should be greater than 0');
        });
    });
});