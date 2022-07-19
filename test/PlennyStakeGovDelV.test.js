require("@babel/polyfill");

const {assert, expect} = require('chai');
const {expectRevert} = require('@openzeppelin/test-helpers');
const {mineBlocks} = require('./helpers/helper');

// Load compiled artifacts
const PlennyERC20 = artifacts.require("PlennyERC20");
const PlennyDistribution = artifacts.require('PlennyDistribution');
const PlennyStakeGovDelV = artifacts.require('PlennyStakeGovDelV');
const PlennyReward = artifacts.require('PlennyReward');

contract('PlennyStakeGovDelV', (accounts) => {

    let owner = accounts[0];
    let account_two = accounts[1];

    let stakingInstance;
    let plennyToken;

    const balanceToTransferToRH = '150000000';

    beforeEach(async () => {
        let plennyDistributionInstance = await PlennyDistribution.deployed();
        let plennyAddress = await plennyDistributionInstance.getPlennyTokenAddress();
        plennyToken = await PlennyERC20.at(plennyAddress);
        stakingInstance = await PlennyStakeGovDelV.deployed();
        rewardHodlInstance = await PlennyReward.deployed();
        // set nextDistributionBlocks = 15
        await stakingInstance.setNextDistributionBlocks('15');
        // set averageBlocksPerWeek = 1
        await stakingInstance.setAverageBlocksPerWeek('1');
    });

    afterEach(async () => {
        plennyDistributionInstance = null;
        plennyAddress = null;
        plennyToken = null;
        stakingInstance = null;
        rewardHodlInstance = null;
    });

    describe("PlennyStakeGovDelV - lockPlenny", async () => {

        it('should not allow to stake plenny when the spending of plenny is not approved', async () => {
            let stakeAmount = '1';
            let stakedBalance = '0';
            let period = '0';

            expect(await stakingInstance.userValueLocked(owner)).to.be.bignumber.equal(web3.utils.toWei(stakedBalance));
            await expectRevert(stakingInstance.lockPlenny(web3.utils.toWei(stakeAmount), period, {from: owner}), 'revert');
            expect(await stakingInstance.userValueLocked(owner)).to.be.bignumber.equal(web3.utils.toWei(stakedBalance));
        });

        it('should not allow to stake plenny when the amount is not set', async () => {
            let stakeAmount = '1';
            let stakedBalance = '0';
            let period = '0';

            expect(await stakingInstance.userValueLocked(owner)).to.be.bignumber.equal(web3.utils.toWei(stakedBalance));
            await expectRevert(stakingInstance.lockPlenny(period), 'Invalid number of parameters for "lockPlenny". Got 1 expected 2!');
            expect(await stakingInstance.userValueLocked(owner)).to.be.bignumber.equal(web3.utils.toWei(stakedBalance));
        });

        it('should not allow to stake plenny when the period is not set', async () => {
            let stakeAmount = '1';
            let stakedBalance = '0';
            let period = '0';

            expect(await stakingInstance.userValueLocked(owner)).to.be.bignumber.equal(web3.utils.toWei(stakedBalance));
            await expectRevert(stakingInstance.lockPlenny(web3.utils.toWei(stakeAmount)), 'Invalid number of parameters for "lockPlenny". Got 1 expected 2!');
            expect(await stakingInstance.userValueLocked(owner)).to.be.bignumber.equal(web3.utils.toWei(stakedBalance));
        });

        it('should not allow to stake plenny when the amount & period are not set', async () => {
            let stakedBalance = '0';

            expect(await stakingInstance.userValueLocked(owner)).to.be.bignumber.equal(web3.utils.toWei(stakedBalance));
            await expectRevert(stakingInstance.lockPlenny(), 'Invalid number of parameters for "lockPlenny". Got 0 expected 2!');
            expect(await stakingInstance.userValueLocked(owner)).to.be.bignumber.equal(web3.utils.toWei(stakedBalance));
        });

        it('should not allow to stake plenny when the amount is negative integer number', async () => {
            let stakeAmount = '-10';
            let stakedBalance = '0';

            expect(await stakingInstance.userValueLocked(owner)).to.be.bignumber.equal(web3.utils.toWei(stakedBalance));
            await expectRevert(stakingInstance.lockPlenny(web3.utils.toWei(stakeAmount), {from: owner}), 'value out-of-bounds');
            expect(await stakingInstance.userValueLocked(owner)).to.be.bignumber.equal(web3.utils.toWei(stakedBalance));
        });

        it('should not allow to stake plenny when the amount is negative decimal number', async () => {
            let stakeAmount = '-10.5';
            let stakedBalance = '0';

            expect(await stakingInstance.userValueLocked(owner)).to.be.bignumber.equal(web3.utils.toWei(stakedBalance));
            await expectRevert(stakingInstance.lockPlenny(web3.utils.toWei(stakeAmount), {from: owner}), 'value out-of-bounds');
            expect(await stakingInstance.userValueLocked(owner)).to.be.bignumber.equal(web3.utils.toWei(stakedBalance));
        });

        it(`should not allow to stake plenny when the amount is greater than user's wallet balance`, async () => {
            let ownerPlennyBalance = await plennyToken.balanceOf(owner);
            let ownerPlennyBalanceString = web3.utils.fromWei(ownerPlennyBalance).toString();
            let userValueLockedMultiplied = Number(ownerPlennyBalanceString) + 5;
            let period = 0;

            await plennyToken.approve(stakingInstance.address, web3.utils.toWei(ownerPlennyBalance.toString()), {from: owner});
            await expectRevert(stakingInstance.lockPlenny(web3.utils.toWei(userValueLockedMultiplied.toString()), period,
                {from: owner}), 'ERC20: transfer amount exceeds balance.');
        });

        it('should allow to stake plenny when the amount is valid integer number', async () => {
            let stakeAmount = '50000';
            let period = 0;

            let startingBalance = '0';
            let newBalance = stakeAmount;

            expect(await stakingInstance.userValueLocked(owner)).to.be.bignumber.equal(web3.utils.toWei(startingBalance));

            await plennyToken.approve(stakingInstance.address, web3.utils.toWei(stakeAmount), {from: owner});
            await stakingInstance.lockPlenny(web3.utils.toWei(stakeAmount), period, {from: owner});

            expect(await stakingInstance.userValueLocked(owner)).to.be.bignumber.equal(web3.utils.toWei(newBalance));
        });

        it('should allow to stake plenny when the amount is valid decimal number', async () => {
            let stakeAmount = '10.5';
            let period = '0';

            let startingBalance = '50000';
            let newBalance = '50010.5';

            expect(await stakingInstance.userValueLocked(owner)).to.be.bignumber.equal(web3.utils.toWei(startingBalance));

            await plennyToken.approve(stakingInstance.address, web3.utils.toWei(stakeAmount), {from: owner});
            await stakingInstance.lockPlenny(web3.utils.toWei(stakeAmount), period, {from: owner});

            expect(await stakingInstance.userValueLocked(owner)).to.be.bignumber.equal(web3.utils.toWei(newBalance));
        });

        it(`should stake/transfer exact amount of tokens, as the user specified as a parameter`, async () => {
            let ownerPlennyBalance = await plennyToken.balanceOf(owner);
            let ownerPlennyBalanceString = web3.utils.fromWei(ownerPlennyBalance).toString();
            let stakeAmount = '100';
            let period = '0';

            let newBalance = Number(ownerPlennyBalanceString) - Number(stakeAmount)

            await plennyToken.approve(stakingInstance.address, web3.utils.toWei(stakeAmount), {from: owner});
            await stakingInstance.lockPlenny(web3.utils.toWei(stakeAmount), period, {from: owner});

            expect(await plennyToken.balanceOf(owner)).to.be.bignumber.equal(web3.utils.toWei(newBalance.toString()));
        });
    })

    describe("PlennyStakeGovDelV - withdrawPlenny", async () => {

        it('should not allow to withdraw plenny when the index is not set', async () => {
            let unstakeAmount = null;
            let stakedBalance = await stakingInstance.userValueLocked(owner);

            expect(await stakingInstance.userValueLocked(owner)).to.be.bignumber.equal(stakedBalance);
            await expectRevert(stakingInstance.withdrawPlenny(), 'Invalid number of parameters for "withdrawPlenny". Got 0 expected 1!');
            expect(await stakingInstance.userValueLocked(owner)).to.be.bignumber.equal(stakedBalance);
        });

        it('should not allow to withdraw plenny when the amount is negative decimal number', async () => {
            let index = '0.5';
            let startingBalance = await stakingInstance.userValueLocked(owner);

            await expectRevert(stakingInstance.withdrawPlenny(index, {from: owner}), 'invalid BigNumber string');
            expect(await stakingInstance.userValueLocked(owner)).to.be.bignumber.equal(startingBalance);
        });

        it('should allow to withdraw plenny when the index is valid integer number', async () => {
            let firstIndex = '0';
            let secondIndex = '1';
            let thirdIndex = '2';
            let newBalance = '0';
            let startingBalance = await stakingInstance.userValueLocked(owner);

            expect(await stakingInstance.userValueLocked(owner)).to.be.bignumber.equal(startingBalance.toString());
            await stakingInstance.withdrawPlenny(thirdIndex);
            await stakingInstance.withdrawPlenny(secondIndex);
            await stakingInstance.withdrawPlenny(firstIndex);
            expect(await stakingInstance.userValueLocked(owner)).to.be.bignumber.equal(web3.utils.toWei(newBalance));
        });

        it('should not allow to withdraw plenny when the index is negative integer number', async () => {
            let index = '-1';
            let newBalance = '0';
            let startingBalance = Number(await stakingInstance.userValueLocked(owner));

            expect(await stakingInstance.userValueLocked(owner)).to.be.bignumber.equal(startingBalance.toString());
            await expectRevert(stakingInstance.withdrawPlenny(index, {from: owner}), 'value out-of-bounds');
            expect(await stakingInstance.userValueLocked(owner)).to.be.bignumber.equal(web3.utils.toWei(newBalance));
        });

        it('should allow to lock/withdraw plenny multiple times', async () => {
            let stakeAmount = '100';
            let period = '0';
            let firstIndex = '0';
            let secondIndex = '1';
            let newBalance = '0';

            // first stake
            await plennyToken.approve(stakingInstance.address, web3.utils.toWei(stakeAmount), {from: owner});
            await stakingInstance.lockPlenny(web3.utils.toWei(stakeAmount), period, {from: owner});

            // second stake
            await plennyToken.approve(stakingInstance.address, web3.utils.toWei(stakeAmount), {from: owner});
            await stakingInstance.lockPlenny(web3.utils.toWei(stakeAmount), period, {from: owner});

            // withdraw second staking record
            await stakingInstance.withdrawPlenny(secondIndex);

            // withdraw first staking record
            await stakingInstance.withdrawPlenny(firstIndex);
            expect(await stakingInstance.userValueLocked(owner)).to.be.bignumber.equal(web3.utils.toWei(newBalance));
        });

        it('should not allow to withdraw plenny before the end block of the locked record', async () => {
            let stakeAmount = '100';
            let period = '1';
            let index = '0';

            await plennyToken.approve(stakingInstance.address, web3.utils.toWei(stakeAmount), {from: owner});
            await stakingInstance.lockPlenny(web3.utils.toWei(stakeAmount), period, {from: owner});

            await expectRevert(stakingInstance.withdrawPlenny(index, {from: owner}), 'ERR_LOCKED');
        });

        it('should allow to withdraw plenny after the end block of the locked record', async () => {
            let stakeAmount = '100';
            let period = '1';
            let index = '0';

            await stakingInstance.withdrawPlenny(index);
        });
    })

    describe("PlennyStakeGovDelV - relockPlenny", async () => {

        it('should not allow to relock plenny before the end block of the locked record', async () => {
            let stakeAmount = '100';
            let period = '1';
            let index = '0';
            let relockPeriod = '2';

            await plennyToken.approve(stakingInstance.address, web3.utils.toWei(stakeAmount), {from: owner});
            await stakingInstance.lockPlenny(web3.utils.toWei(stakeAmount), period, {from: owner});

            await expectRevert(stakingInstance.relockPlenny(index, relockPeriod, {from: owner}), 'ERR_LOCKED');
        });

        it('should allow to relock plenny after the end block of the locked record', async () => {
            let stakeAmount = '100';
            let period = '1';
            let index = '0';
            let relockPeriod = '2';

            await stakingInstance.relockPlenny(index, relockPeriod, {from: owner});
        });
    });

    describe("PlennyStakeGovDelV - collectReward", async () => {

        it('should not allow to collect reward before the locked period', async () => {
            await expectRevert(stakingInstance.collectReward(), 'ERR_LOCKED_PERIOD');
        });

        it('should allow to collect reward after the locked period', async () => {
            // transfer 150m PL2 to the Reward HODL
            await plennyToken.transfer(rewardHodlInstance.address, web3.utils.toWei(balanceToTransferToRH));

            let balanceBeforeCollection = '0';
            const ownerPlennyBalance = await plennyToken.balanceOf(owner);
            // transfer total balance from owner to account_two
            await plennyToken.transfer(account_two, ownerPlennyBalance);

            expect(await plennyToken.balanceOf(owner)).to.be.bignumber.equal(balanceBeforeCollection);
            // mine 20 blocks
            await mineBlocks();

            await stakingInstance.collectReward();

            const ownerPlennyBalanceAfterCollection = await plennyToken.balanceOf(owner);

            assert.isAbove(Number(ownerPlennyBalanceAfterCollection), 0, 'Plenny balance of the owner should be greater than 0');
        });
    });
});