require("@babel/polyfill");

const {assert, expect} = require("chai");
const {expectRevert, constants} = require("@openzeppelin/test-helpers");
const {web3} = require("@openzeppelin/test-environment");
const {ZERO_ADDRESS} = constants;

// Load compiled artifacts
const PlennyERC20 = artifacts.require("PlennyERC20");
const PlennyDistribution = artifacts.require('PlennyDistribution');
const PlennyTreasury = artifacts.require('PlennyTreasury');
const PlennyLockingPoSLT = artifacts.require('PlennyLockingPoSLT');
const PlennyDappFactoryV2 = artifacts.require('PlennyDappFactoryV2');
const PlennyCoordinatorV2 = artifacts.require('PlennyCoordinatorV2');
const PlennyValidatorElectionV2 = artifacts.require('PlennyValidatorElectionV2');
const PlennyContractRegistry = artifacts.require('PlennyContractRegistry');
const PlennyOracleValidator = artifacts.require('PlennyOracleValidator');

contract("PlennyDappFactoryV2", (accounts) => {
    let [owner, alice] = accounts;
    let plennyDistribution;
    let plennyTokenAddress;
    let plennyToken;
    let plennyLockingPoSLT;
    let plennyDappFactoryV2;
    let plennyCoordinatorV2;
    let plennyValidatorElectionV2;
    let plennyContractRegistry;
    let plennyTreasury;
    let plennyOracleValidator;

    const defaultValidator = {
        account: owner,
        name: 'test-validator',
        publicKey: '03587ed7c39affa02be4958c647fb04d2a544c3f913ebeadc94f24e0dff08b7e7a',
        nodeIp: 'lnd',
        nodePort: '9735',
        serviceUrl: 'https://localhost:3001',
    }

    const lndTwo = {
        address: alice,
        publicKey: '033a7440c48a88ef0c884a1f5dccfb39ff205cdec7c8ace6680f99ec294c0955b5',
    }

    before(async () => {
        plennyDistribution = await PlennyDistribution.deployed();
        plennyTokenAddress = await plennyDistribution.getPlennyTokenAddress();
        plennyToken = await PlennyERC20.at(plennyTokenAddress);
        plennyLockingPoSLT = await PlennyLockingPoSLT.deployed();
        plennyCoordinatorV2 = await PlennyCoordinatorV2.deployed();
        plennyDappFactoryV2 = await PlennyDappFactoryV2.deployed();
        plennyValidatorElectionV2 = await PlennyValidatorElectionV2.deployed();
        plennyContractRegistry = await PlennyContractRegistry.deployed();
        plennyTreasury = await PlennyTreasury.deployed();
        plennyOracleValidator = await PlennyOracleValidator.deployed();

        await plennyToken.transfer(plennyTreasury.address, web3.utils.toWei("100000"), {from: owner});
        await plennyDappFactoryV2.removeValidator();
    });

    after(async () => {
        plennyDistribution = null;
        plennyTokenAddress = null;
        plennyToken = null;
        plennyDappFactoryV2 = null;
        plennyCoordinatorV2 = null;
        plennyValidatorElectionV2 = null;
        plennyContractRegistry = null;
    });

    describe("createDefaultValidator", async () => {
        it("should register the initial validator", async () => {
            expect(await plennyDappFactoryV2.validatorsCount()).to.be.bignumber.equal('0');

            await plennyDappFactoryV2.createDefaultValidator(
                defaultValidator.publicKey,
                defaultValidator.name,
                defaultValidator.nodeIp,
                defaultValidator.nodePort,
                defaultValidator.serviceUrl,
                defaultValidator.account,
            );

            expect(await plennyDappFactoryV2.validatorsCount()).to.be.bignumber.equal('1');
        });
    });

    describe("addValidator", async () => {
        it("should not register an oracle validator when validator threshold is not met", async () => {
            await expectRevert(plennyDappFactoryV2.addValidator(
                defaultValidator.name,
                2,
                defaultValidator.nodeIp,
                defaultValidator.nodePort,
                defaultValidator.serviceUrl,
            ), 'ERR_NO_FUNDS');
        });

        it("should not register an oracle validator when sender is not owner of the node", async () => {
            await plennyToken.transfer(alice, web3.utils.toWei("100000"), {from: owner});
            await plennyToken.approve(plennyLockingPoSLT.address, web3.utils.toWei('100000'), {from: alice});
            await plennyLockingPoSLT.lockPlenny(web3.utils.toWei('100000'), {from: alice});
            await expectRevert(plennyDappFactoryV2.addValidator(
                defaultValidator.name,
                2,
                defaultValidator.nodeIp,
                defaultValidator.nodePort,
                defaultValidator.serviceUrl,
                {from: alice}
            ), 'ERR_NOT_OWNER');
        });

        it("should not register an oracle validator when the node is not verified", async () => {
            await plennyToken.approve(plennyLockingPoSLT.address, web3.utils.toWei('100000'));
            await plennyLockingPoSLT.lockPlenny(web3.utils.toWei('100000'));
            await plennyCoordinatorV2.addLightningNode(lndTwo.publicKey, defaultValidator.account);
            await expectRevert(plennyDappFactoryV2.addValidator(
                defaultValidator.name,
                3,
                defaultValidator.nodeIp,
                defaultValidator.nodePort,
                defaultValidator.serviceUrl,
            ), 'ERR_NOT_VERIFIED');
        });

        it("should register a lightning validator and should fire a ValidatorAdded event", async () => {
            let receipt = await plennyDappFactoryV2.addValidator(
                defaultValidator.name,
                1,
                defaultValidator.nodeIp,
                defaultValidator.nodePort,
                defaultValidator.serviceUrl,
            );

            let log = receipt.logs[0];
            assert.equal(log.event, "ValidatorAdded");
            assert.equal(log.args.account, owner);
            assert.equal(log.args.created, true);
        });
    });

    describe("removeValidator", async () => {
        it("should not unregister a lightning validator when sender is not a validator", async () => {
            await expectRevert(plennyDappFactoryV2.removeValidator({from: alice}), 'ERR_NOT_ORACLE');
        });

        it("should unregister a lightning validator", async () => {
            await plennyDappFactoryV2.removeValidator();
        });

        it("should not unregister an active lightning validator from current election cycle ", async () => {
            await plennyDappFactoryV2.createDefaultValidator(
                defaultValidator.publicKey,
                defaultValidator.name,
                defaultValidator.nodeIp,
                defaultValidator.nodePort,
                defaultValidator.serviceUrl,
                defaultValidator.account,
            );
            await plennyValidatorElectionV2.newElection();
            await expectRevert(plennyDappFactoryV2.removeValidator(), 'ERR_ACTIVE_VALIDATOR');
        });
    });

    describe("getValidatorInfo", async () => {
        it("should return validator info when valid address is provided, fail otherwise", async () => {
            const validator = await plennyDappFactoryV2.getValidatorInfo(owner);
            assert.equal(validator.name, defaultValidator.name);
            assert.equal(validator.nodeIP, defaultValidator.nodeIp);
            assert.equal(validator.nodePort, defaultValidator.nodePort);
            assert.equal(validator.validatorServiceUrl, defaultValidator.serviceUrl);
            assert.equal(validator.owner, defaultValidator.account);
            assert.equal(validator.reputation.toString(), '0');

            const invalidValidator = await plennyDappFactoryV2.getValidatorInfo(alice);
            assert.equal(invalidValidator.name, 'ERR');
            assert.equal(invalidValidator.nodeIP, 'ERR');
            assert.equal(invalidValidator.nodePort, 'ERR');
            assert.equal(invalidValidator.validatorServiceUrl, 'ERR');
            assert.equal(invalidValidator.owner, ZERO_ADDRESS);
            assert.equal(invalidValidator.reputation.toString(), '0');
        });
    });

    describe("updateReputation", async () => {
        it("should return true when update reputation can be made, false otherwise", async () => {
            await plennyDappFactoryV2.updateReputation.call(owner, web3.utils.toWei('1000'), {from: plennyOracleValidator.address});
            await expectRevert(plennyDappFactoryV2.updateReputation.call(owner, web3.utils.toWei('1000')), 'ERR_NOT_AUTH');
            await expectRevert(plennyDappFactoryV2.updateReputation.call(alice, web3.utils.toWei('1000'), {from: plennyOracleValidator.address}), 'ERR_VALIDATOR_NOT_FOUND');
        });
    });

    describe("setDefaultLockingAmount", async () => {
        it("should change the validator threshold, fail otherwise", async () => {
            const threshold = await plennyDappFactoryV2.defaultLockingAmount();
            await plennyDappFactoryV2.setDefaultLockingAmount(web3.utils.toWei('10001'));
            const newThreshold = await plennyDappFactoryV2.defaultLockingAmount();

            assert.equal(newThreshold.toString(), web3.utils.toWei('10001'));
            assert.notEqual(threshold.toString(), newThreshold.toString());
            await expectRevert(plennyDappFactoryV2.setDefaultLockingAmount(web3.utils.toWei('10001'), {from: alice}), "Ownable: caller is not the owner.");
        });
    });

    describe("setUserChannelReward", async () => {
        it("should change the user channel reward, fail otherwise", async () => {
            const reward = await plennyDappFactoryV2.userChannelReward();
            await plennyDappFactoryV2.setUserChannelReward(web3.utils.toWei('10'));
            const newReward = await plennyDappFactoryV2.userChannelReward();

            assert.equal(newReward.toString(), web3.utils.toWei('10'));
            assert.notEqual(reward.toString(), newReward.toString());
            await expectRevert(plennyDappFactoryV2.setUserChannelReward(web3.utils.toWei('10'), {from: alice}), "Ownable: caller is not the owner.");
        });
    });

    describe("setUserChannelRewardPeriod", async () => {
        it("should change the user channel reward period, fail otherwise", async () => {
            const period = await plennyDappFactoryV2.userChannelRewardPeriod();
            await plennyDappFactoryV2.setUserChannelRewardPeriod(web3.utils.toWei('300'));
            const newPeriod = await plennyDappFactoryV2.userChannelRewardPeriod();

            assert.equal(newPeriod.toString(), web3.utils.toWei('300'));
            assert.notEqual(period.toString(), newPeriod.toString());
            await expectRevert(plennyDappFactoryV2.setUserChannelRewardPeriod(web3.utils.toWei('300'), {from: alice}), "Ownable: caller is not the owner.");
        });
    });

    describe("setUserChannelRewardFee", async () => {
        it("should change the user channel reward fee, fail otherwise", async () => {
            const fee = await plennyDappFactoryV2.userChannelRewardFee();
            await plennyDappFactoryV2.setUserChannelRewardFee(web3.utils.toWei('200'));
            const newFee = await plennyDappFactoryV2.userChannelRewardFee();

            assert.equal(newFee.toString(), web3.utils.toWei('200'));
            assert.notEqual(fee.toString(), newFee.toString());
            await expectRevert(plennyDappFactoryV2.setUserChannelRewardFee(web3.utils.toWei('200'), {from: alice}), "Ownable: caller is not the owner.");
        });
    });

    // internal function
    describe("setStakedMultiplier", async () => {
        it("should change the staking multiplier, fail otherwise", async () => {
            // const multiplier = await plennyDappFactoryV2.stakedMultiplier();
            // await plennyDappFactoryV2.setStakedMultiplier('90');
            // const newMultiplier = await plennyDappFactoryV2.stakedMultiplier();
            //
            // assert.equal(newMultiplier.toString(), '90');
            // assert.notEqual(multiplier.toString(), newMultiplier.toString());
            await plennyDappFactoryV2.setStakedMultiplier('90');
            await expectRevert(plennyDappFactoryV2.setStakedMultiplier(web3.utils.toWei('200'), {from: alice}), "Ownable: caller is not the owner.");
        });
    });

    // internal function
    describe("setDelegatedMultiplier", async () => {
        it("should change the delegated multiplier, fail otherwise", async () => {
            // const multiplier = await plennyDappFactoryV2.delegatedMultiplier();
            // await plennyDappFactoryV2.setDelegatedMultiplier('90');
            // const newMultiplier = await plennyDappFactoryV2.delegatedMultiplier();
            //
            // assert.equal(newMultiplier.toString(), '90');
            // assert.notEqual(multiplier.toString(), newMultiplier.toString());
            await plennyDappFactoryV2.setDelegatedMultiplier('90');
            await expectRevert(plennyDappFactoryV2.setDelegatedMultiplier(web3.utils.toWei('90'), {from: alice}), "Ownable: caller is not the owner.");
        });
    });

    // internal function
    describe("setReputationMultiplier", async () => {
        it("should change the reputation multiplier, fail otherwise", async () => {
            // const multiplier = await plennyDappFactoryV2.reputationMultiplier();
            // await plennyDappFactoryV2.setReputationMultiplier('200');
            // const newMultiplier = await plennyDappFactoryV2.reputationMultiplier();
            //
            // assert.equal(newMultiplier.toString(), '200');
            // assert.notEqual(multiplier.toString(), newMultiplier.toString());
            await plennyDappFactoryV2.setReputationMultiplier('200');
            await expectRevert(plennyDappFactoryV2.setReputationMultiplier(web3.utils.toWei('200'), {from: alice}), "Ownable: caller is not the owner.");
        });
    });

    describe("setMaxCapacity", async () => {
        it("should change the max capacity, fail otherwise", async () => {
            const capacity = await plennyDappFactoryV2.maxCapacity();
            const minCapacity = await plennyDappFactoryV2.minCapacity();
            await plennyDappFactoryV2.setMaxCapacity('150000');
            const newCapacity = await plennyDappFactoryV2.maxCapacity();

            assert.equal(newCapacity.toString(), '150000');
            assert.notEqual(capacity.toString(), newCapacity.toString());
            await expectRevert(plennyDappFactoryV2.setMaxCapacity(minCapacity.toString()), "ERR_VALUE_TOO_LOW");
            await expectRevert(plennyDappFactoryV2.setMaxCapacity('150000', {from: alice}), "Ownable: caller is not the owner.");
        });
    });

    describe("setMinCapacity", async () => {
        it("should change the min capacity, fail otherwise", async () => {
            const capacity = await plennyDappFactoryV2.minCapacity();
            const maxCapacity = await plennyDappFactoryV2.maxCapacity();
            await plennyDappFactoryV2.setMinCapacity('60000');
            const newCapacity = await plennyDappFactoryV2.minCapacity();

            assert.equal(newCapacity.toString(), '60000');
            assert.notEqual(capacity.toString(), newCapacity.toString());
            await expectRevert(plennyDappFactoryV2.setMinCapacity(maxCapacity.toString()), "ERR_VALUE_TOO_HIGH.");
            await expectRevert(plennyDappFactoryV2.setMinCapacity('60000', {from: alice}), "Ownable: caller is not the owner.");
        });
    });

    describe("setMakersFixedRewardAmount", async () => {
        it("should change the makers fixed reward, fail otherwise", async () => {
            const reward = await plennyDappFactoryV2.makersFixedRewardAmount();
            await plennyDappFactoryV2.setMakersFixedRewardAmount(web3.utils.toWei('100'));
            const newReward = await plennyDappFactoryV2.makersFixedRewardAmount();

            assert.equal(newReward.toString(), web3.utils.toWei('100'));
            assert.notEqual(reward.toString(), newReward.toString());
            await expectRevert(plennyDappFactoryV2.setMakersFixedRewardAmount(web3.utils.toWei('100'), {from: alice}), "Ownable: caller is not the owner.");
        });
    });

    describe("setCapacityFixedRewardAmount", async () => {
        it("should change the capacity fixed reward, fail otherwise", async () => {
            const reward = await plennyDappFactoryV2.capacityFixedRewardAmount();
            await plennyDappFactoryV2.setCapacityFixedRewardAmount(web3.utils.toWei('50'));
            const newReward = await plennyDappFactoryV2.capacityFixedRewardAmount();

            assert.equal(newReward.toString(), web3.utils.toWei('50'));
            assert.notEqual(reward.toString(), newReward.toString());
            await expectRevert(plennyDappFactoryV2.setCapacityFixedRewardAmount(web3.utils.toWei('50'), {from: alice}), "Ownable: caller is not the owner.");
        });
    });

    describe("setMakersRewardPercentage", async () => {
        it("should change the makers reward percentage, fail otherwise", async () => {
            const reward = await plennyDappFactoryV2.makersRewardPercentage();
            await plennyDappFactoryV2.setMakersRewardPercentage(web3.utils.toWei('3'));
            const newReward = await plennyDappFactoryV2.makersRewardPercentage();

            assert.equal(newReward.toString(), web3.utils.toWei('3'));
            assert.notEqual(reward.toString(), newReward.toString());
            await expectRevert(plennyDappFactoryV2.setMakersRewardPercentage(web3.utils.toWei('3'), {from: alice}), "Ownable: caller is not the owner.");
        });
    });

    describe("setCapacityRewardPercentage", async () => {
        it("should change the capacity reward percentage, fail otherwise", async () => {
            const reward = await plennyDappFactoryV2.capacityRewardPercentage();
            await plennyDappFactoryV2.setCapacityRewardPercentage(web3.utils.toWei('2'));
            const newReward = await plennyDappFactoryV2.capacityRewardPercentage();

            assert.equal(newReward.toString(), web3.utils.toWei('2'));
            assert.notEqual(reward.toString(), newReward.toString());
            await expectRevert(plennyDappFactoryV2.setCapacityRewardPercentage(web3.utils.toWei('2'), {from: alice}), "Ownable: caller is not the owner.");
        });
    });

    describe("validatorsCount", async () => {
        it("should fetch the validators count", async () => {
            const count = await plennyDappFactoryV2.validatorsCount();
            assert.equal(count.toString(), '1');
        });
    });

    describe("random", async () => {
        it("should return a random number in range between minCapacity and maxCapacity", async () => {
            const minCapacity = await plennyDappFactoryV2.minCapacity();
            const maxCapacity = await plennyDappFactoryV2.maxCapacity();
            const rng = await plennyDappFactoryV2.random();

            assert.isTrue(Number(rng) > Number(minCapacity));
            assert.isTrue(Number(rng) < Number(maxCapacity));
        });
    });

    describe("pureRandom", async () => {
        it("should return a pure random number", async () => {
            const rng = await plennyDappFactoryV2.pureRandom();
            assert.isFinite(Number(rng));
        });
    });

    describe("getValidatorsScore", async () => {
        it("should fetch the validators score and the sum", async () => {
            const results = await plennyDappFactoryV2.getValidatorsScore();
            assert.isFinite(Number(results.scores));
            assert.isFinite(Number(results.sum));
        });
    });

    describe("isOracleValidator", async () => {
        it("should return true if is oracle, false otherwise", async () => {
            const oracle = await plennyDappFactoryV2.isOracleValidator(owner);
            const notOracle = await plennyDappFactoryV2.isOracleValidator(alice);
            assert.isTrue(oracle);
            assert.isNotTrue(notOracle);
        });
    });
});

