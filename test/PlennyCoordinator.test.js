require("@babel/polyfill");

const {expect} = require('chai');
const {expectRevert} = require('@openzeppelin/test-helpers');

// Load compiled artifacts
const PlennyERC20 = artifacts.require("PlennyERC20");
const PlennyDistribution = artifacts.require('PlennyDistribution');
const PlennyStakeGovDelV = artifacts.require('PlennyStakeGovDelV');
const PlennyCoordinatorV2 = artifacts.require('PlennyCoordinatorV2');

contract('PlennyCoordinator', (accounts) => {

    let owner = accounts[0];
    let account_two = accounts[1];

    let plennyDistributionInstance;
    let plennyAddress;
    let plennyToken;
    let stakingInstance;
    let coordinatorInstance;

    beforeEach(async () => {
        plennyDistributionInstance = await PlennyDistribution.deployed();
        plennyAddress = await plennyDistributionInstance.getPlennyTokenAddress();
        plennyToken = await PlennyERC20.at(plennyAddress);
        stakingInstance = await PlennyStakeGovDelV.deployed();
        coordinatorInstance = await PlennyCoordinatorV2.deployed();
    });

    afterEach(async () => {
        plennyDistributionInstance = null;
        plennyAddress = null;
        plennyToken = null;
        stakingInstance = null;
        coordinatorInstance = null;
    });

    describe("PlennyCoordinator - setMaximumChannelCapacity", async () => {
        it('should revert when calling setMaximumChannelCapacity() and caller !== owner', async () => {
            let newMaximum = '16000000';

            await expectRevert(coordinatorInstance.setMaximumChannelCapacity(newMaximum,
                {from: account_two}), 'Ownable: caller is not the owner');
        });

        it('should allow calling setMaximumChannelCapacity() if caller === owner', async () => {
            let newMaximum = '16000000';

            await coordinatorInstance.setMaximumChannelCapacity(newMaximum, {from: owner});
            expect(await coordinatorInstance.maximumChannelCapacity()).to.be.bignumber.equal(newMaximum);
        });
    });

    describe("PlennyCoordinator - setMinimumChannelCapacity", async () => {
        it('should revert when calling setMinimumChannelCapacity() and caller !== owner', async () => {
            let newMinimum = '20000';

            await expectRevert(coordinatorInstance.setMinimumChannelCapacity(newMinimum,
                {from: account_two}), 'Ownable: caller is not the owner');
        });

        it('should allow calling setMinimumChannelCapacity() if caller === owner', async () => {
            let newMinimum = '20000';

            await coordinatorInstance.setMinimumChannelCapacity(newMinimum, {from: owner});
            expect(await coordinatorInstance.minimumChannelCapacity()).to.be.bignumber.equal(newMinimum);
        });
    });

    describe("PlennyCoordinator - setChannelRewardThreshold", async () => {
        it('should revert when calling setChannelRewardThreshold() and caller !== owner', async () => {
            let newChannelRewardThreshold = '500000';

            await expectRevert(coordinatorInstance.setChannelRewardThreshold(newChannelRewardThreshold,
                {from: account_two}), 'Ownable: caller is not the owner');
        });

        it('should allow calling setChannelRewardThreshold() if caller === owner', async () => {
            let newChannelRewardThreshold = '500000';

            await coordinatorInstance.setChannelRewardThreshold(newChannelRewardThreshold, {from: owner});
            expect(await coordinatorInstance.channelRewardThreshold()).to.be.bignumber.equal(newChannelRewardThreshold);
        });
    });

    describe("PlennyCoordinator - setRewardBaseline", async () => {
        it('should revert when calling setRewardBaseline() and caller !== owner', async () => {
            let newRewardBaseline = '250';

            await expectRevert(coordinatorInstance.setRewardBaseline(newRewardBaseline,
                {from: account_two}), 'Ownable: caller is not the owner');
        });

        it('should allow calling setRewardBaseline() if caller === owner', async () => {
            let newRewardBaseline = '250';

            await coordinatorInstance.setRewardBaseline(newRewardBaseline, {from: owner});
            expect(await coordinatorInstance.rewardBaseline()).to.be.bignumber.equal(newRewardBaseline);
        });
    });
});