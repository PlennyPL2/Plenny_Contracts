require("@babel/polyfill");

const {assert} = require("chai");
const {expectRevert} = require("@openzeppelin/test-helpers");
const {web3} = require("@openzeppelin/test-environment");

// Load compiled artifacts
const PlennyERC20 = artifacts.require("PlennyERC20");
const PlennyDistribution = artifacts.require('PlennyDistribution');
const PlennyTreasury = artifacts.require('PlennyTreasury');
const UniswapV2Pair = artifacts.require('IUniswapV2Pair');
const IUniswapV2Router02 = artifacts.require("IUniswapV2Router02");
const PlennyContractRegistry = artifacts.require('PlennyContractRegistry');

contract("PlennyTreasury", (accounts) => {
    let [owner] = accounts;
    let plennyDistribution;
    let plennyTokenAddress;
    let plennyToken;
    let plennyTreasury;
    let plennyContractRegistry;
    let uniswapRouter;
    let uniswapV2Pair;
    let wethAddress;

    before(async () => {
        plennyDistribution = await PlennyDistribution.deployed();
        plennyTokenAddress = await plennyDistribution.getPlennyTokenAddress();
        plennyToken = await PlennyERC20.at(plennyTokenAddress);
        plennyTreasury = await PlennyTreasury.deployed();
        plennyContractRegistry = await PlennyContractRegistry.deployed();

        const balanceToTransferToTH = '250000000';
        await plennyToken.transfer(plennyTreasury.address, web3.utils.toWei(balanceToTransferToTH));

        uniswapRouter = await IUniswapV2Router02.at(await plennyContractRegistry.uniswapRouterV2());
        uniswapV2Pair = await UniswapV2Pair.at(await plennyContractRegistry.lpContract());
        wethAddress = await uniswapRouter.WETH();
        await plennyToken.approve(uniswapRouter.address, web3.utils.toWei('1000000000'), {from: owner});
        await uniswapRouter.addLiquidityETH(
            plennyTokenAddress,
            web3.utils.toWei('1000000'),
            web3.utils.toWei('1000000'),
            web3.utils.toWei('0.1'),
            owner, "1000000000000000000000",
            {from: owner, value: web3.utils.toWei('0.1')}
        );

        await uniswapV2Pair.balanceOf(owner);
        await uniswapV2Pair.transfer(plennyTreasury.address, web3.utils.toWei('300'), {from: owner});
    });

    after(async () => {
        plennyDistribution = null;
        plennyTokenAddress = null;
        plennyToken = null;
        plennyTreasury = null;
        plennyContractRegistry = null;
    });

    describe("approve", async () => {
        it("should return true when approve can be made, false otherwise", async () => {
            const miningAddr = await plennyContractRegistry.getAddressByString("PlennyLiqMining");
            const validatorAddr = await plennyContractRegistry.getAddressByString("PlennyOracleValidator");
            const coordinatorAddr = await plennyContractRegistry.getAddressByString("PlennyCoordinator");
            const electionAddr = await plennyContractRegistry.getAddressByString("PlennyValidatorElection");

            assert.isTrue(await plennyTreasury.approve.call(owner, web3.utils.toWei("1"), {from: miningAddr}));
            assert.isTrue(await plennyTreasury.approve.call(owner, web3.utils.toWei("1"), {from: validatorAddr}));
            assert.isTrue(await plennyTreasury.approve.call(owner, web3.utils.toWei("1"), {from: coordinatorAddr}));
            assert.isTrue(await plennyTreasury.approve.call(owner, web3.utils.toWei("1"), {from: electionAddr}));
            await expectRevert(plennyTreasury.approve.call(owner, web3.utils.toWei("1"), {from: owner}), "revert ERR_NOT_AUTH");
        });
    });

    describe("transfer", async () => {
        it("should pass when transfer of a supported token can be made, fail otherwise", async () => {
            const slpAddress = await plennyContractRegistry.getAddressByString("UNIETH-PL2");
            await plennyTreasury.transfer.call(owner, plennyTokenAddress, web3.utils.toWei("1"), {from: owner});
            await plennyTreasury.transfer.call(owner, slpAddress, web3.utils.toWei("1"), {from: owner});
            await expectRevert(plennyTreasury.transfer.call(owner, wethAddress, web3.utils.toWei("1"), {from: owner}), "revert ERR_NOT_SUPPORTED");
        });

        it("should pass when transfer is called by the contract owner, fail otherwise", async () => {
            await plennyTreasury.transfer.call(owner, plennyTokenAddress, web3.utils.toWei("1"), {from: owner});
            await expectRevert(plennyTreasury.transfer.call(owner, wethAddress, web3.utils.toWei("1"), {from: wethAddress}), "Ownable: caller is not the owner");
        });
    });
});
