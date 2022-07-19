require("@babel/polyfill");

const {assert, expect} = require('chai');
const {expectRevert,} = require('@openzeppelin/test-helpers');
const {mineBlocks, encodeParameters} = require('./helpers/helper');

// Load compiled artifacts
const PlennyERC20 = artifacts.require("PlennyERC20");
const PlennyDistribution = artifacts.require('PlennyDistribution');
const PlennyStakeGovDelV = artifacts.require('PlennyStakeGovDelV');
const PlennyReward = artifacts.require('PlennyReward');
const PlennyDao = artifacts.require('PlennyDao');

contract('PlennyDao', (accounts) => {

    let owner = accounts[0];
    let account_two = accounts[1];

    let stakingInstance;
    let plennyToken;
    let daoInstance;

    const newDistributionBlocks = "25";
    const newLockingFee = "100";
    const description = 'Set next distribution blocks & set locking fee';
    const voteYes = true;
    const voteNo = false;

    beforeEach(async () => {
        let plennyDistributionInstance = await PlennyDistribution.deployed();
        let plennyAddress = await plennyDistributionInstance.getPlennyTokenAddress();
        plennyToken = await PlennyERC20.at(plennyAddress);
        stakingInstance = await PlennyStakeGovDelV.deployed();
        rewardHodlInstance = await PlennyReward.deployed();
        daoInstance = await PlennyDao.deployed();
        // set delay = 15
        await daoInstance.setDelay('15');
        // set votingDuration = 30
        await daoInstance.setVotingDuration('30');
        // set votingDelay = 10
        await daoInstance.setVotingDelay('10');
    });

    afterEach(async () => {
        plennyDistributionInstance = null;
        plennyAddress = null;
        plennyToken = null;
        stakingInstance = null;
        rewardHodlInstance = null;
        daoInstance = null;
    });

    describe("PlennyDao - propose", async () => {
        it('should not allow to add a proposal when the user has not staked enough tokens', async () => {

            const target = [stakingInstance.address, stakingInstance.address];
            const transactionData = [encodeParameters(newDistributionBlocks), encodeParameters(newLockingFee)];

            const signature = ["setNextDistributionBlocks(uint256)", "setLockingFee(uint256)"];

            await expectRevert(daoInstance.propose(target, ["0", "0"], signature, transactionData, description),
                "Not enough staked tokens");
        });

        it('should allow to add a proposal when the user has staked enough tokens', async () => {
            const stakeAmount = '50000';
            const period = 0;

            const target = [stakingInstance.address, stakingInstance.address];
            const transactionData = [encodeParameters(newDistributionBlocks), encodeParameters(newLockingFee)];

            const signature = ["setNextDistributionBlocks(uint256)", "setLockingFee(uint256)"];

            await plennyToken.approve(stakingInstance.address, web3.utils.toWei(stakeAmount), {from: owner});
            await stakingInstance.lockPlenny(web3.utils.toWei(stakeAmount), period, {from: owner});

            await daoInstance.propose(target, ["0", "0"], signature, transactionData, description, {from: owner});

            const proposalCount = await daoInstance.proposalCount({from: owner});
            console.log("New proposal created. Proposal ID: " + proposalCount);

            assert.isAbove(Number(proposalCount), 0, 'Number of proposals should be greater than 0');
        });

        it('should not allow to add a proposal when there is a proposal that is already pending', async () => {

            const target = [stakingInstance.address, stakingInstance.address];
            const transactionData = [encodeParameters(newDistributionBlocks), encodeParameters(newLockingFee)];

            const signature = ["setNextDistributionBlocks(uint256)", "setLockingFee(uint256)"];

            await expectRevert(daoInstance.propose(target, ["0", "0"], signature, transactionData, description),
                "ERR_ALREADY_PENDING");
        });

        it('should not allow to add a proposal when there is a proposal that is already active', async () => {

            const target = [stakingInstance.address, stakingInstance.address];
            const transactionData = [encodeParameters(newDistributionBlocks), encodeParameters(newLockingFee)];

            const signature = ["setNextDistributionBlocks(uint256)", "setLockingFee(uint256)"];
            // mine 10 blocks, to move the proposal from pending to active
            await mineBlocks();

            await expectRevert(daoInstance.propose(target, ["0", "0"], signature, transactionData, description),
                "ERR_ALREADY_ACTIVE");
        });
    });

    describe("PlennyDao - castVote", async () => {
        it('should allow to vote for a proposal', async () => {
            await daoInstance.castVote('1', voteYes);
        });

        it('should not allow to vote for a proposal, if the user has already voted.\
    Should not allow to queue a proposal for execution, if it has not been voted successfully',
            async () => {
                await expectRevert(daoInstance.castVote('1', voteYes), "ERR_DUPLICATE_VOTE");

                await expectRevert(daoInstance.queue('1'), 'ERR_NOT_SUCCESS');
            });

        it('should not allow to vote for a proposal, if the voting has been closed', async () => {
            // mine 10 blocks, so that voting is closed
            await mineBlocks();

            await expectRevert(daoInstance.castVote('1', voteYes),
                "ERR_VOTING_CLOSED");
        });
    });

    describe("PlennyDao - queue", async () => {
        it('should allow to queue a proposal into the timelock for execution, if it has been voted successfully', async () => {
            await daoInstance.queue('1');
        });

        it('should not allow to queue a proposal into the timelock for execution, if it has been previously queued in a timelock',
            async () => {
                await expectRevert(daoInstance.queue('1'), 'ERR_NOT_SUCCESS');
            });
    });

    describe("PlennyDao - execute", async () => {
        it('should not allow to execute a proposal, that has not been previously queued in a timelock', async () => {
            await expectRevert(daoInstance.execute('1'), 'ERR_ETA_NOT_REACHED');
        });

        it('should allow to queue a proposal into the timelock for execution, if it has been voted successfully', async () => {
            await mineBlocks();
            await mineBlocks();

            // transfer stakingInstance ownership to PlennyDao, so that proposal can be executed
            await stakingInstance.transferOwnership(daoInstance.address);

            await daoInstance.execute('1');

            expect(await stakingInstance.nextDistributionBlocks()).to.be.bignumber.equal(newDistributionBlocks.toString());
            expect(await stakingInstance.lockingFee()).to.be.bignumber.equal(newLockingFee.toString());
        });
    });

    describe('PlennyDao - cancel', async () => {
        it('should revert when calling cancel() proposal, but that proposal was already executed.', async () => {
            await expectRevert(daoInstance.cancel('1'), 'ERR_ALREADY_EXEC');
        })

        it('should allow to cancel() a proposal, when the caller === guardian', async () => {
            const target = [stakingInstance.address, stakingInstance.address];
            const transactionData = [encodeParameters(newDistributionBlocks), encodeParameters(newLockingFee)];
            const signature = ["setNextDistributionBlocks(uint256)", "setLockingFee(uint256)"];

            // add second proposal
            await daoInstance.propose(target, ["0", "0"], signature, transactionData, description, {from: owner});
            const proposalCount = await daoInstance.proposalCount();
            console.log("New proposal created. Proposal ID: " + proposalCount);

            await mineBlocks();

            await daoInstance.castVote('2', voteYes);

            await mineBlocks();

            assert.isAbove(Number(proposalCount), 1, 'Number of proposals should be greater than 1');

            await daoInstance.cancel('2', {from: owner});
        });
    })

    describe("PlennyDao - setDelay", async () => {
        it('should revert when calling setDelay() and caller !== owner', async () => {
            let newDelay = '25';

            await expectRevert(daoInstance.setDelay(newDelay,
                {from: account_two}), 'Ownable: caller is not the owner');
        });

        it('should allow calling setDelay() if caller === owner', async () => {
            let newDelay = '25';

            await daoInstance.setDelay(newDelay, {from: owner});
            expect(await daoInstance.delay()).to.be.bignumber.equal(newDelay);
        });
    });

    describe("PlennyDao - setMinQuorum", async () => {
        it('should revert when calling setMinQuorum() and caller !== owner', async () => {
            let newMinQuorum = '3';

            await expectRevert(daoInstance.setMinQuorum(newMinQuorum,
                {from: account_two}), 'Ownable: caller is not the owner');
        });

        it('should allow calling setMinQuorum() if caller === owner', async () => {
            let newMinQuorum = '3';

            await daoInstance.setMinQuorum(newMinQuorum, {from: owner});
            expect(await daoInstance.minQuorum()).to.be.bignumber.equal(newMinQuorum);
        });
    });

    describe("PlennyDao - setProposalThreshold", async () => {
        it('should revert when calling setProposalThreshold() and caller !== owner', async () => {
            let proposalThreshold = '100';

            await expectRevert(daoInstance.setProposalThreshold(proposalThreshold,
                {from: account_two}), 'Ownable: caller is not the owner');
        });

        it('should allow calling setProposalThreshold() if caller === owner', async () => {
            let proposalThreshold = '5';

            await daoInstance.setProposalThreshold(proposalThreshold, {from: owner});
            expect(await daoInstance.proposalThreshold()).to.be.bignumber.equal(proposalThreshold);
        });
    });

    describe("PlennyDao - setVotingDuration", async () => {
        it('should revert when calling setVotingDuration() and caller !== owner', async () => {
            let votingDuration = '100';

            await expectRevert(daoInstance.setVotingDuration(votingDuration,
                {from: account_two}), 'Ownable: caller is not the owner');
        });

        it('should allow calling setVotingDuration() if caller === owner', async () => {
            let votingDuration = '5';

            await daoInstance.setVotingDuration(votingDuration, {from: owner});
            expect(await daoInstance.votingDuration()).to.be.bignumber.equal(votingDuration);
        });
    });

    describe("PlennyDao - setVotingDelay", async () => {
        it('should revert when calling setVotingDelay() and caller !== owner', async () => {
            let votingDelay = '100';

            await expectRevert(daoInstance.setVotingDelay(votingDelay,
                {from: account_two}), 'Ownable: caller is not the owner');
        });

        it('should allow calling setVotingDelay() if caller === owner', async () => {
            let votingDelay = '5';

            await daoInstance.setVotingDelay(votingDelay, {from: owner});
            expect(await daoInstance.votingDelay()).to.be.bignumber.equal(votingDelay);
        });
    });

    describe("PlennyDao - setGovernorThreshold", async () => {
        it('should revert when calling setGovernorThreshold() and caller !== owner', async () => {
            let governorThreshold = '100';

            await expectRevert(daoInstance.setGovernorThreshold(governorThreshold,
                {from: account_two}), 'Ownable: caller is not the owner');
        });

        it('should allow calling setGovernorThreshold() if caller === owner', async () => {
            let governorThreshold = '5';

            await daoInstance.setGovernorThreshold(governorThreshold, {from: owner});
            expect(await daoInstance.governorThreshold()).to.be.bignumber.equal(governorThreshold);
        });
    });

    describe("PlennyDao - setGuardian", async () => {
        it('should revert when calling setGuardian() and caller !== PlennyDao', async () => {
            let newGuardian = '0x70C143928eCfFaf9F5b406f7f4fC28Dc43d68380';

            await expectRevert(daoInstance.setGuardian(newGuardian,
                {from: account_two}), 'ERR_NOT_AUTH');
        });

        it('should revert when calling setGuardian() and caller !== PlennyDao', async () => {
            let newGuardian = '0x70C143928eCfFaf9F5b406f7f4fC28Dc43d68380';

            await expectRevert(daoInstance.setGuardian(newGuardian,
                {from: owner}), 'ERR_NOT_AUTH');
        });
    });
});