require("@babel/polyfill");

const {assert} = require("chai");
const {expectRevert, constants} = require("@openzeppelin/test-helpers");
const {ZERO_ADDRESS} = constants;
const {web3} = require("@openzeppelin/test-environment");
const Web3 = require("web3");

// Load compiled artifacts
const PlennyERC20 = artifacts.require("PlennyERC20");
const PlennyDistribution = artifacts.require("PlennyDistribution");

contract("PlennyReplenishment", (accounts) => {
    let [owner, alice] = accounts;
    let plennyERC20;
    let plennyDistribution;

    before(async () => {
        plennyERC20 = await PlennyERC20.deployed();
        plennyDistribution = await PlennyDistribution.new(plennyERC20.address);
    });

    after(async () => {
        plennyDistribution = null;
    });

    describe("createToken", async () => {
        it("should create an instance of plenny token", async () => {
            const tokenCreatedInfo = await plennyDistribution.createToken('0x');
            const log = tokenCreatedInfo.logs[0];

            assert.equal(log.event, "PlennyERC20Deployed");
        });

        it("should fail if the token was already created", async () => {
            await expectRevert(plennyDistribution.createToken('0x'), 'ALREADY_CREATED.');
        });

        it("should fail if caller is not owner", async () => {
            await expectRevert(plennyDistribution.createToken('0x', {from: alice}), 'Ownable: caller is not the owner.');
        });
    });

    describe("tokenInit", async () => {
        it("should initialize the data of the plenny token", async () => {
            const data = web3.eth.abi.encodeParameters(
                ['string', 'string', 'address', 'address'],
                ['Plenny', 'PL2', process.env.ETHERC20_BRIDGE_ADDRESS, process.env.L1_ROUTER_ADDRESS]
            );

            await plennyDistribution.tokenInit(data);
        });

        it("should fail when token is not created", async () => {
            const distribution = await PlennyDistribution.new(plennyERC20.address);
            const data = web3.eth.abi.encodeParameters(
                ['string', 'string', 'address', 'address'],
                ['Plenny', 'PL2', process.env.ETHERC20_BRIDGE_ADDRESS, process.env.L1_ROUTER_ADDRESS]
            );

            await expectRevert(distribution.tokenInit(data), 'NOT_CREATED.');
        });

        it("should fail if caller is not owner", async () => {
            const data = web3.eth.abi.encodeParameters(
                ['string', 'string', 'address', 'address'],
                ['Plenny', 'PL2', process.env.ETHERC20_BRIDGE_ADDRESS, process.env.L1_ROUTER_ADDRESS]
            );

            await expectRevert(plennyDistribution.tokenInit(data, {from: alice}), 'Ownable: caller is not the owner.');
        });
    });

    describe("tokenMint", async () => {
        it("should not mint the initial token supply when token is not created", async () => {
            const distribution = await PlennyDistribution.new(plennyERC20.address);
            await expectRevert(distribution.tokenMint(web3.utils.toWei('21000000')), 'NOT_CREATED.');
        });

        it("should mint the initial token supply to the sender's address", async () => {
            await plennyDistribution.tokenMint(web3.utils.toWei('21000000'));
            const totalSupply = await plennyDistribution.plennyTotalSupply();
            assert.equal(totalSupply, web3.utils.toWei('21000000'));
        });

        it("should not mint the initial token supply twice", async () => {
            await expectRevert(plennyDistribution.tokenMint(web3.utils.toWei('21000000')), 'ALREADY_MINT.');
        });

        it("should fail if caller is not owner", async () => {
            await expectRevert(plennyDistribution.tokenMint(web3.utils.toWei('21000000'), {from: alice}), 'Ownable: caller is not the owner.');
        });
    });

    describe("getPlennyTokenAddress", async () => {
        it("should return the plenny token address", async () => {
            const address = await plennyDistribution.getPlennyTokenAddress();
            assert.notEqual(address, ZERO_ADDRESS);
        });
    });

    describe("plennyTotalSupply", async () => {
        it("should return the plenny total supply", async () => {
            const totalSupply = await plennyDistribution.plennyTotalSupply();
            assert.equal(totalSupply, web3.utils.toWei('21000000'));
        });
    });
});