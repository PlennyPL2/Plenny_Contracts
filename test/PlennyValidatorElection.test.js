require('@babel/polyfill');

const {expectRevert,} = require('@openzeppelin/test-helpers');
const {expect} = require('chai');

// Load compiled artifacts
const PlennyERC20 = artifacts.require('PlennyERC20');
const PlennyDistribution = artifacts.require('PlennyDistribution');
const PlennyValidatorElectionV2 = artifacts.require('PlennyValidatorElectionV2');
const PlennyTreasury = artifacts.require('PlennyTreasury');
const PlennyDappFactoryV2 = artifacts.require('PlennyDappFactoryV2');
const PlennyContractRegistry = artifacts.require('PlennyContractRegistry');
const PlennyLockingPoSLT = artifacts.require('PlennyLockingPoSLT');

contract('PlennyValidatorElection', (accounts) => {

    let owner = accounts[0];
    let account_two = accounts[1];

    let electionInstance;
    let factoryInstance;
    let registryInstance;
    let plennyDistributionInstance;
    let plennyAddress;
    let plennyToken;
    let treasuryHodlInstance;

    const balanceToTransferToRH = '250000000';

    beforeEach(async () => {
        electionInstance = await PlennyValidatorElectionV2.deployed();
        factoryInstance = await PlennyDappFactoryV2.deployed();
        registryInstance = await PlennyContractRegistry.deployed();
        plennyDistributionInstance = await PlennyDistribution.deployed();
        plennyAddress = await plennyDistributionInstance.getPlennyTokenAddress();
        plennyToken = await PlennyERC20.at(plennyAddress);
        treasuryHodlInstance = await PlennyTreasury.deployed();
        lockingInstance = await PlennyLockingPoSLT.deployed();

        // set electionTriggerUserReward = 1000
        await electionInstance.setElectionTriggerUserReward(web3.utils.toWei('1000'));
    });

    afterEach(async () => {
        electionInstance = null;
        factoryInstance = null
        registryInstance = null;
        plennyDistributionInstance = null;
        plennyAddress = null;
        plennyToken = null;
        treasuryHodlInstance = null;
        lockingInstance = null;
    });

    describe('PlennyValidatorElectionV2 - newElection', async () => {

        it('should not allow election of new validators when the TH is empty', async () => {

            await expectRevert(electionInstance.newElection(), 'revert');
        });

        it('should not allow election of new validators when there are not validators', async () => {
            await plennyToken.transfer(treasuryHodlInstance.address, web3.utils.toWei(balanceToTransferToRH));

            await expectRevert(electionInstance.newElection(), 'ERR_NO_VALIDATORS');
        });

        it('should allow election of new validators', async () => {
            let lockAmount = '100000';

            // transfer 250m PL2 to the Treasury HODL
            await plennyToken.transfer(treasuryHodlInstance.address, web3.utils.toWei(balanceToTransferToRH));

            // Lock the Validator threshold
            await plennyToken.approve(lockingInstance.address, web3.utils.toWei(lockAmount), {from: owner});
            await lockingInstance.lockPlenny(web3.utils.toWei(lockAmount), {from: owner});

            let startingBalance = await plennyToken.balanceOf(owner);
            let startingBalanceString = web3.utils.fromWei(startingBalance).toString();
            let electionTriggerReward = await electionInstance.electionTriggerUserReward();
            let electionTriggerRewardString = web3.utils.fromWei(electionTriggerReward).toString();

            let newBalance = Number(startingBalanceString) + Number(electionTriggerRewardString);

            await electionInstance.newElection();

            expect(await plennyToken.balanceOf(owner)).to.be.bignumber.equal(web3.utils.toWei(newBalance.toString()));
        });

        it('should not allow election of new validators before the next election block', async () => {
            let lockAmount = '100000';

            // transfer 250m PL2 to the Treasury HODL
            await plennyToken.transfer(treasuryHodlInstance.address, web3.utils.toWei(balanceToTransferToRH));

            let startingBalance = await plennyToken.balanceOf(owner);
            let startingBalanceString = web3.utils.fromWei(startingBalance).toString();
            let electionTriggerReward = await electionInstance.electionTriggerUserReward();
            let electionTriggerRewardString = electionTriggerReward.toString();

            let newBalance = Number(startingBalanceString) + Number(electionTriggerRewardString);

            // Lock the Validator threshold
            await plennyToken.approve(lockingInstance.address, web3.utils.toWei(lockAmount), {from: owner});
            await lockingInstance.lockPlenny(web3.utils.toWei(lockAmount), {from: owner});

            await expectRevert(electionInstance.newElection(), 'ERR_LOCKED');

            // expect(await plennyToken.balanceOf(owner)).to.be.bignumber.equal(web3.utils.toWei(newBalance.toString()));
        });
    });

    describe("PlennyLockingPoSLT - setNewElectionPeriod", async () => {
        it('should revert when calling setNewElectionPeriod() and caller !== owner', async () => {
            let newElectionPeriod = '5';

            await expectRevert(electionInstance.setNewElectionPeriod(newElectionPeriod,
                {from: account_two}), 'Ownable: caller is not the owner');
        });

        it('should allow calling setNewElectionPeriod() if caller === owner', async () => {
            let newElectionPeriod = '5';

            await electionInstance.setNewElectionPeriod(newElectionPeriod, {from: owner});
            expect(await electionInstance.newElectionPeriod()).to.be.bignumber.equal(newElectionPeriod);
        });
    });

    describe("PlennyLockingPoSLT - setMaxValidators", async () => {
        it('should revert when calling setMaxValidators() and caller !== owner', async () => {
            let newMaxValidators = '3';

            await expectRevert(electionInstance.setMaxValidators(newMaxValidators,
                {from: account_two}), 'Ownable: caller is not the owner');
        });

        it('should allow calling setMaxValidators() if caller === owner', async () => {
            let newMaxValidators = '3';

            await electionInstance.setMaxValidators(newMaxValidators, {from: owner});
            expect(await electionInstance.maxValidators()).to.be.bignumber.equal(newMaxValidators);
        });
    });

    describe("PlennyLockingPoSLT - setUserRewardPercent", async () => {
        it('should revert when calling setUserRewardPercent() and caller !== owner', async () => {
            let userRewardPercent = '100';

            await expectRevert(electionInstance.setUserRewardPercent(userRewardPercent,
                {from: account_two}), 'Ownable: caller is not the owner');
        });

        it('should allow calling setUserRewardPercent() if caller === owner', async () => {
            let userRewardPercent = '5';

            await electionInstance.setUserRewardPercent(userRewardPercent, {from: owner});
            expect(await electionInstance.userRewardPercent()).to.be.bignumber.equal(userRewardPercent);
        });
    });

    describe("PlennyLockingPoSLT - setElectionTriggerUserReward", async () => {
        it('should revert when calling setElectionTriggerUserReward() and caller !== owner', async () => {
            let electionTriggerUserReward = '100';

            await expectRevert(electionInstance.setElectionTriggerUserReward(electionTriggerUserReward,
                {from: account_two}), 'Ownable: caller is not the owner');
        });

        it('should allow calling setElectionTriggerUserReward() if caller === owner', async () => {
            let electionTriggerUserReward = '5';

            await electionInstance.setElectionTriggerUserReward(electionTriggerUserReward, {from: owner});
            expect(await electionInstance.electionTriggerUserReward()).to.be.bignumber.equal(electionTriggerUserReward);
        });
    });

    describe("PlennyLockingPoSLT - setLatestElectionBlock", async () => {
        it('should revert when calling setLatestElectionBlock() and caller !== owner', async () => {
            let latestElectionBlock = '100';

            await expectRevert(electionInstance.setLatestElectionBlock(latestElectionBlock,
                {from: account_two}), 'Ownable: caller is not the owner');
        });

        it('should allow calling setLatestElectionBlock() if caller === owner', async () => {
            let latestElectionBlock = '5';

            await electionInstance.setLatestElectionBlock(latestElectionBlock, {from: owner});
            expect(await electionInstance.latestElectionBlock()).to.be.bignumber.equal(latestElectionBlock);
        });
    });
});