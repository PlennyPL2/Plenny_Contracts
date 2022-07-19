require("@babel/polyfill");

const {assert, expect} = require('chai');
const {expectRevert} = require('@openzeppelin/test-helpers');

// Load compiled artifacts
const PlennyERC20 = artifacts.require("PlennyERC20");
const PlennyDistribution = artifacts.require('PlennyDistribution');
const PlennyLockingPoSLT = artifacts.require('PlennyLockingPoSLT')

contract('PlennyLockingPoSLT', (accounts) => {

    let owner = accounts[0];
    let account_two = accounts[1];

    beforeEach(async () => {
        plennyDistributionInstance = await PlennyDistribution.deployed();
        plennyAddress = await plennyDistributionInstance.getPlennyTokenAddress();
        plennyToken = await PlennyERC20.at(plennyAddress);
        lockingInstance = await PlennyLockingPoSLT.deployed();
    });

    afterEach(async () => {
        plennyDistributionInstance = null;
        plennyAddress = null;
        plennyToken = null;
        lockingInstance = null;
    });

    describe("PlennyLockingPoSLT - lockPlenny", async () => {
        it('should not allow to lock plenny when the spending of plenny is not approved', async () => {
            let lockAmount = '1';
            let lockedBalance = '0';

            expect(await lockingInstance.plennyBalance(owner)).to.be.bignumber.equal(web3.utils.toWei(lockedBalance));
            await expectRevert(lockingInstance.lockPlenny(web3.utils.toWei(lockAmount), {from: owner}), 'revert');
            expect(await lockingInstance.plennyBalance(owner)).to.be.bignumber.equal(web3.utils.toWei(lockedBalance));
        });

        it('should not allow to lock plenny when the amount is not set', async () => {
            let lockedBalance = '0';

            expect(await lockingInstance.plennyBalance(owner)).to.be.bignumber.equal(web3.utils.toWei(lockedBalance));
            await expectRevert(lockingInstance.lockPlenny(), 'Invalid number of parameters for "lockPlenny". Got 0 expected 1!');
            expect(await lockingInstance.plennyBalance(owner)).to.be.bignumber.equal(web3.utils.toWei(lockedBalance));
        });

        it('should not allow to lock plenny when the amount is negative integer number', async () => {
            let lockAmount = '-10';
            let lockedBalance = '0';

            expect(await lockingInstance.plennyBalance(owner)).to.be.bignumber.equal(web3.utils.toWei(lockedBalance));
            await expectRevert(lockingInstance.lockPlenny(web3.utils.toWei(lockAmount), {from: owner}), 'value out-of-bounds');
            expect(await lockingInstance.plennyBalance(owner)).to.be.bignumber.equal(web3.utils.toWei(lockedBalance));
        });

        it('should not allow to lock plenny when the amount is negative decimal number', async () => {
            let lockAmount = '-10.5';
            let lockedBalance = '0';

            expect(await lockingInstance.plennyBalance(owner)).to.be.bignumber.equal(web3.utils.toWei(lockedBalance));
            await expectRevert(lockingInstance.lockPlenny(web3.utils.toWei(lockAmount), {from: owner}), 'value out-of-bounds');
            expect(await lockingInstance.plennyBalance(owner)).to.be.bignumber.equal(web3.utils.toWei(lockedBalance));
        });

        it(`should not allow to lock plenny when the amount is greater than user's wallet balance`, async () => {
            let ownerPlennyBalance = await plennyToken.balanceOf(owner);
            let ownerPlennyBalanceString = web3.utils.fromWei(ownerPlennyBalance).toString();
            let plennyBalanceMultiplied = Number(ownerPlennyBalanceString) + 5;

            await plennyToken.approve(lockingInstance.address, web3.utils.toWei(ownerPlennyBalance.toString()), {from: owner});
            await expectRevert(lockingInstance.lockPlenny(web3.utils.toWei(plennyBalanceMultiplied.toString()), {from: owner}), 'ERC20: transfer amount exceeds balance.');
        });

        it('should allow to lock plenny when the amount is valid integer number', async () => {
            let lockAmount = '150000';

            let startingBalance = '0';
            let newBalance = lockAmount;

            expect(await lockingInstance.plennyBalance(owner)).to.be.bignumber.equal(web3.utils.toWei(startingBalance));

            await plennyToken.approve(lockingInstance.address, web3.utils.toWei(lockAmount), {from: owner});
            await lockingInstance.lockPlenny(web3.utils.toWei(lockAmount), {from: owner});

            expect(await lockingInstance.plennyBalance(owner)).to.be.bignumber.equal(web3.utils.toWei(newBalance));
        });

        it('should allow to lock plenny when the amount is valid integer number', async () => {
            let lockAmount = '10.5';

            let startingBalance = '150000';
            let newBalance = '150010.5';

            expect(await lockingInstance.plennyBalance(owner)).to.be.bignumber.equal(web3.utils.toWei(startingBalance));

            await plennyToken.approve(lockingInstance.address, web3.utils.toWei(lockAmount), {from: owner});
            await lockingInstance.lockPlenny(web3.utils.toWei(lockAmount), {from: owner});

            expect(await lockingInstance.plennyBalance(owner)).to.be.bignumber.equal(web3.utils.toWei(newBalance));
        });

        it(`should lock/transfer exact amount of tokens, as the user specified as a parameter`, async () => {
            let ownerPlennyBalance = await plennyToken.balanceOf(owner);
            let ownerPlennyBalanceString = web3.utils.fromWei(ownerPlennyBalance).toString();
            let lockAmount = '100';

            let newBalance = Number(ownerPlennyBalanceString) - Number(lockAmount)

            await plennyToken.approve(lockingInstance.address, web3.utils.toWei(lockAmount), {from: owner});
            await lockingInstance.lockPlenny(web3.utils.toWei(lockAmount), {from: owner});

            expect(await plennyToken.balanceOf(owner)).to.be.bignumber.equal(web3.utils.toWei(newBalance.toString()));
        });
    });

    describe("PlennyLockingPoSLT - unlockPlenny", async () => {
        it('should not allow to unlock plenny when the amount is not set', async () => {
            let unlockAmount = null;
            let lockedBalance = await lockingInstance.plennyBalance(owner);

            expect(await lockingInstance.plennyBalance(owner)).to.be.bignumber.equal(lockedBalance);
            await expectRevert(lockingInstance.unlockPlenny(), 'Invalid number of parameters for "unlockPlenny". Got 0 expected 1!');
            expect(await lockingInstance.plennyBalance(owner)).to.be.bignumber.equal(lockedBalance);
        });

        it('should not allow to unlock plenny when the amount is negative integer number', async () => {
            let unlockAmount = '-10';
            let lockedBalance = '150110.5';

            expect(await lockingInstance.plennyBalance(owner)).to.be.bignumber.equal(web3.utils.toWei(lockedBalance));
            await expectRevert(lockingInstance.unlockPlenny(web3.utils.toWei(unlockAmount), {from: owner}), 'value out-of-bounds');
            expect(await lockingInstance.plennyBalance(owner)).to.be.bignumber.equal(web3.utils.toWei(lockedBalance));
        });

        it('should not allow to unlock plenny when the amount is negative decimal number', async () => {
            let unlockAmount = '-10.5';
            let lockedBalance = '150110.5';

            expect(await lockingInstance.plennyBalance(owner)).to.be.bignumber.equal(web3.utils.toWei(lockedBalance));
            await expectRevert(lockingInstance.unlockPlenny(web3.utils.toWei(unlockAmount), {from: owner}), 'value out-of-bounds');
            expect(await lockingInstance.plennyBalance(owner)).to.be.bignumber.equal(web3.utils.toWei(lockedBalance));
        });

        it('should allow to unlock plenny when the amount is valid integer number', async () => {
            let unlockAmount = '10000';

            let startingBalance = '150110.5';
            let newBalance = '140110.5';

            expect(await lockingInstance.plennyBalance(owner)).to.be.bignumber.equal(web3.utils.toWei(startingBalance));

            await lockingInstance.unlockPlenny(web3.utils.toWei(unlockAmount), {from: owner});

            expect(await lockingInstance.plennyBalance(owner)).to.be.bignumber.equal(web3.utils.toWei(newBalance));
        });

        it('should allow to unlock plenny when the amount is valid decimal number', async () => {
            let unlockAmount = '110.5';

            let startingBalance = '140110.5';
            let newBalance = '140000'

            expect(await lockingInstance.plennyBalance(owner)).to.be.bignumber.equal(web3.utils.toWei(startingBalance));

            await lockingInstance.unlockPlenny(web3.utils.toWei(unlockAmount), {from: owner});

            expect(await lockingInstance.plennyBalance(owner)).to.be.bignumber.equal(web3.utils.toWei(newBalance));
        });

        it(`should allow to unlock plenny when the amount is equal to user's total balance`, async () => {
            let unlockAmount = '40000';

            let startingBalance = '140000';
            let newBalance = '100000'

            expect(await lockingInstance.plennyBalance(owner)).to.be.bignumber.equal(web3.utils.toWei(startingBalance));

            await lockingInstance.unlockPlenny(web3.utils.toWei(unlockAmount), {from: owner});

            expect(await lockingInstance.plennyBalance(owner)).to.be.bignumber.equal(web3.utils.toWei(newBalance));
        });
    })

    describe("PlennyLockingPoSLT - Updating balances, charging fees", async () => {

        it(`should update balances accordingly - decrease user's wallet balance but increase locked balance when locking`, async () => {
            let lockAmount = '10000';

            let walletBalance = web3.utils.fromWei(await plennyToken.balanceOf(owner));
            let lockedBalance = web3.utils.fromWei(await lockingInstance.plennyBalance(owner));

            await plennyToken.approve(lockingInstance.address, web3.utils.toWei(lockAmount), {from: owner});
            await lockingInstance.lockPlenny(web3.utils.toWei(lockAmount), {from: owner});

            walletBalance = +walletBalance - +lockAmount;
            lockedBalance = +lockedBalance + +lockAmount;

            expect(await plennyToken.balanceOf(owner)).to.be.bignumber.equal(web3.utils.toWei(walletBalance.toString()));
            expect(await lockingInstance.plennyBalance(owner)).to.be.bignumber.equal(web3.utils.toWei(lockedBalance.toString()));
        });

        it(`should update balances accordingly - increase user's wallet balance but decrease locked balance when unlocking`, async () => {
            let unlockAmount = '10000';
            let feePercentage = 1;
            let withdrawFee = +unlockAmount * feePercentage / 100;

            let walletBalance = web3.utils.fromWei(await plennyToken.balanceOf(owner));
            let lockedBalance = web3.utils.fromWei(await lockingInstance.plennyBalance(owner));

            await lockingInstance.unlockPlenny(web3.utils.toWei(unlockAmount), {from: owner});

            walletBalance = +walletBalance + +unlockAmount - withdrawFee;
            lockedBalance = +lockedBalance - +unlockAmount;

            expect(await plennyToken.balanceOf(owner)).to.be.bignumber.equal(web3.utils.toWei(walletBalance.toString()));
            expect(await lockingInstance.plennyBalance(owner)).to.be.bignumber.equal(web3.utils.toWei(lockedBalance.toString()));
        });

        it('should charge withdraw fee whenever plenny are unlocked', async () => {
            let amount = '10000';
            let feePercentage = 1;
            let withdrawFee = +amount * feePercentage / 100;

            let walletBalance = web3.utils.fromWei(await plennyToken.balanceOf(owner));

            await plennyToken.approve(lockingInstance.address, web3.utils.toWei(amount), {from: owner});
            await lockingInstance.lockPlenny(web3.utils.toWei(amount), {from: owner});
            await lockingInstance.unlockPlenny(web3.utils.toWei(amount), {from: owner});

            walletBalance = +walletBalance - withdrawFee;

            expect(await plennyToken.balanceOf(owner)).to.be.bignumber.equal(web3.utils.toWei(walletBalance.toString()));
        });
    });

    describe("PlennyLockingPoSLT - increasePlennyBalance()", async () => {
        it('should revert when calling increasePlennyBalance() and caller !== owner', async () => {
            let from = accounts[5];
            let to = account_two;
            let amount = '10000';

            await expectRevert(lockingInstance.increasePlennyBalance(to, amount, from), 'ERR_NOT_AUTH');
        });
    });

    describe("PlennyLockingPoSLT - decreasePlennyBalance()", async () => {
        it('should revert when calling decreasePlennyBalance() and caller !== owner', async () => {
            let from = accounts[5];
            let to = account_two;
            let amount = '10000';

            await expectRevert(lockingInstance.decreasePlennyBalance(to, amount, from), 'ERR_NOT_AUTH');
        });
    });

    describe("PlennyLockingPoSLT - Plenny lockers count", async () => {
        it('should return the plenny lockers count', async () => {
            let count = Number(await lockingInstance.plennyOwnersCount());

            assert.isAbove(count, 0, 'plenny lockers count should be greater than 0')
        });

        it('should update the plenny lockers count', async () => {
            let alice = accounts[8];
            let charles = accounts[9];
            let amount = '1';

            let count = await lockingInstance.plennyOwnersCount();

            assert.isAbove(Number(count), 0, 'plenny lockers count should be greater than 0');

            await plennyToken.transfer(alice, web3.utils.toWei(`${amount}`));
            await plennyToken.approve(lockingInstance.address, web3.utils.toWei(`${amount}`), {from: alice});
            await lockingInstance.lockPlenny(web3.utils.toWei(`${amount}`), {from: alice});
            count++;
            assert.equal(await lockingInstance.plennyOwnersCount(), count, `plenny lockers count should be equal to ${count}`);

            await plennyToken.transfer(charles, web3.utils.toWei(`${amount}`));
            await plennyToken.approve(lockingInstance.address, web3.utils.toWei(`${amount}`), {from: charles});
            await lockingInstance.lockPlenny(web3.utils.toWei(`${amount}`), {from: charles});
            count++;
            assert.equal(await lockingInstance.plennyOwnersCount(), count, `plenny lockers count should be equal to ${count}`);
        });
    });

    describe("PlennyLockingPoSLT - setWithdrawFee", async () => {
        it('should revert when calling setWithdrawFee() and caller !== owner', async () => {
            let withdrawFee = 100; // 100 = 1%
            let newWithdrawFeePercentage = 3;
            let newWithdrawFee = withdrawFee * newWithdrawFeePercentage; // 300 = 3%

            await expectRevert(lockingInstance.setWithdrawFee(newWithdrawFee.toString(), {from: account_two}), 'Ownable: caller is not the owner');
        });

        it('should allow calling setWithdrawFee() if caller === owner', async () => {
            let withdrawFee = 100; // 100 = 1%
            let newWithdrawFeePercentage = 3;
            let newWithdrawFee = withdrawFee * newWithdrawFeePercentage; // 300 = 3%

            await lockingInstance.setWithdrawFee(newWithdrawFee.toString(), {from: owner});
            expect(await lockingInstance.withdrawFee()).to.be.bignumber.equal(newWithdrawFee.toString());
        });

        it('should set the withdraw fee to 5%', async () => {
            let withdrawFee = 100; // 100 = 1%
            let newWithdrawFeePercentage = 5;
            let newWithdrawFee = withdrawFee * newWithdrawFeePercentage; // 500 = 5%

            await lockingInstance.setWithdrawFee(newWithdrawFee.toString());

            expect(await lockingInstance.withdrawFee()).to.be.bignumber.equal(newWithdrawFee.toString());
            assert.isAbove(newWithdrawFee, withdrawFee, 'new withdraw fee should be greater than the current withdraw fee');
        });
    });
});