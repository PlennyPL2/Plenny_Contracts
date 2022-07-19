require("@babel/polyfill");

const {BN, constants, expectEvent, expectRevert,} = require("@openzeppelin/test-helpers");
const {assert, expect} = require("chai");

const {ZERO_ADDRESS} = constants;
const bridgeAddress = process.env.ETHERC20_BRIDGE_ADDRESS;
const routerAddress = process.env.L1_ROUTER_ADDRESS;

// Load compiled artifacts
const PlennyERC20 = artifacts.require("PlennyERC20");

contract("PlennyERC20", (accounts) => {
    const name = "Plenny";
    const symbol = "PL2";
    const decimals = "18";
    const capacity = new BN("2100000000");
    const initialSupply = "0";

    let instance;
    let [owner, spender, recipient, user, alice, bob, charles] = accounts;
    let data = web3.eth.abi.encodeParameters(
        ["string", "string", "address", "address"],
        [name, symbol, bridgeAddress, routerAddress]
    );

    const DEFAULT_ADMIN_ROLE = "0x0000000000000000000000000000000000000000000000000000000000000000";
    const MINTER_ROLE = web3.utils.soliditySha3("MINTER_ROLE");
    const PAUSER_ROLE = web3.utils.soliditySha3("PAUSER_ROLE");

    beforeEach(async () => {
        instance = await PlennyERC20.new();
        instance.initialize(owner, data);
        await instance.name();
    });

    afterEach(async () => {
        instance = null;
    });

    describe("ERC-20", async () => {
        it("should be called Plenny", async () => {
            expect(await instance.name()).to.equal(name);
        });

        it("should have PL2 symbol", async () => {
            expect(await instance.symbol()).to.equal(symbol);
        });

        it("should have 18 decimals", async () => {
            expect(await instance.decimals()).to.be.bignumber.equal(decimals);
        });
    });

    describe("totalSupply", async () => {
        it("should have initial supply of " + initialSupply, async () => {
            expect(await instance.totalSupply()).to.be.bignumber.equal(initialSupply);
        });

        it("should have total cap of 2.1 billions", async () => {
            expect(await instance.cap()).to.be.bignumber.equal(web3.utils.toWei(capacity));
        });

        it("should be capped at 2.1 billions and not allow new tokens to be minted", async () => {
            await expectRevert(instance.mint(owner, web3.utils.toWei("2100000001")), "ERC20Capped: cap exceeded.");
        });

        it("should be capped at 2.1 billions and not allow new tokens to be minted when aggregating mints", async () => {
            await instance.mint(owner, web3.utils.toWei("2000000000"));
            await instance.mint(owner, web3.utils.toWei("100000000"));
            await expectRevert(instance.mint(owner, web3.utils.toWei("1")), "ERC20Capped: cap exceeded.");
        });

        it("mints when amount is less or equal than cap", async () => {
            await instance.mint(owner, web3.utils.toWei(capacity));
            expect(await instance.totalSupply()).to.be.bignumber.equal(web3.utils.toWei(capacity));
        });

        it("fails to mint if the amount exceeds the cap", async () => {
            await expectRevert(instance.mint(owner, web3.utils.toWei(capacity + "1")), "ERC20Capped: cap exceeded");
        });

        it("fails to mint after cap is reached", async () => {
            await instance.mint(owner, web3.utils.toWei(capacity));
            await expectRevert(instance.mint(owner, 1), "ERC20Capped: cap exceeded");
        });
    });

    describe("balanceOf", async () => {
        it("should have correct initial balances", async () => {
            for (let i = 0; i < accounts.length; i++) {
                let address = accounts[i];

                expect(await instance.balanceOf(address)).to.be.bignumber.equal("0");
            }
        });

        it("should return the correct balances", async () => {
            await instance.mint(owner, web3.utils.toWei("1"));
            expect(await instance.balanceOf(owner)).to.be.bignumber.equal(web3.utils.toWei("1"));

            await instance.mint(alice, web3.utils.toWei("2"));
            expect(await instance.balanceOf(alice)).to.be.bignumber.equal(web3.utils.toWei("2"));

            await instance.mint(bob, web3.utils.toWei("3"));
            expect(await instance.balanceOf(bob)).to.be.bignumber.equal(web3.utils.toWei("3"));

            await instance.mint(charles, web3.utils.toWei("4"));
            expect(await instance.balanceOf(charles)).to.be.bignumber.equal(web3.utils.toWei("4"));
        });

        describe("when the requested account has no token", async () => {
            it("returns zero", async () => {
                expect(await instance.balanceOf(user)).to.be.bignumber.equal("0");
            });
        });

        describe("when the requested account has some tokens", function () {
            it("returns the total amount of tokens", async () => {
                await instance.mint(owner, web3.utils.toWei("1"));
                expect(await instance.balanceOf(owner)).to.be.bignumber.equal(web3.utils.toWei("1"));
            });
        });
    });

    describe("allowance", async () => {
        it("should have correct initial allowance", async () => {
            for (let i = 0; i < accounts.length; i++) {

                let j = 1;
                let ownerAddress = accounts[i];
                let spenderAddress = accounts[j];
                let expectedAllowance = "0";

                j++;
                expect(await instance.allowance(ownerAddress, spenderAddress)).to.be.bignumber.equal(expectedAllowance);
            }
        });

        it("should return the correct allowance", async () => {
            await instance.approve(bob, web3.utils.toWei("1"), {from: alice});
            await instance.approve(charles, web3.utils.toWei("2"), {from: alice});
            await instance.approve(charles, web3.utils.toWei("3"), {from: bob});
            await instance.approve(alice, web3.utils.toWei("4"), {from: bob});
            await instance.approve(alice, web3.utils.toWei("5"), {from: charles});
            await instance.approve(bob, web3.utils.toWei("6"), {from: charles});

            expect(await instance.allowance(alice, bob)).to.be.bignumber.equal(web3.utils.toWei("1"));
            expect(await instance.allowance(alice, charles)).to.be.bignumber.equal(web3.utils.toWei("2"));
            expect(await instance.allowance(bob, charles)).to.be.bignumber.equal(web3.utils.toWei("3"));
            expect(await instance.allowance(bob, alice)).to.be.bignumber.equal(web3.utils.toWei("4"));
            expect(await instance.allowance(charles, alice)).to.be.bignumber.equal(web3.utils.toWei("5"));
            expect(await instance.allowance(charles, bob)).to.be.bignumber.equal(web3.utils.toWei("6"));
        });

        it("should return the correct allowance when owner != owner", async () => {
            await instance.approve(spender, web3.utils.toWei("1"), {from: owner});
            expect(await instance.allowance(owner, spender)).to.be.bignumber.equal(web3.utils.toWei("1"));
        });

        it("should return the correct allowance when owner == spender", async () => {
            await instance.approve(owner, web3.utils.toWei("2"), {from: owner});
            expect(await instance.allowance(owner, owner)).to.be.bignumber.equal(web3.utils.toWei("2"));
        });
    });

    describe("approve", async () => {
        it("should return true when approving 0", async () => {
            assert.isTrue(await instance.approve.call(spender, 0, {from: owner}));
        });

        it("should return true when approving", async () => {
            assert.isTrue(await instance.approve.call(spender, web3.utils.toWei("1"), {from: owner}));
        });

        it("should return true when updating approval", async () => {
            assert.isTrue(await instance.approve.call(spender, web3.utils.toWei("2"), {from: owner}));
            await instance.approve(spender, web3.utils.toWei("2"), {from: owner});
            expect(await instance.allowance(owner, spender)).to.be.bignumber.equal(web3.utils.toWei("2"));

            // test decreasing approval
            await instance.approve(spender, web3.utils.toWei("1"), {from: owner});
            expect(await instance.allowance(owner, spender)).to.be.bignumber.equal(web3.utils.toWei("1"));

            // test not-updating approval
            await instance.approve(spender, web3.utils.toWei("2"), {from: owner});
            expect(await instance.allowance(owner, spender)).to.be.bignumber.equal(web3.utils.toWei("2"));

            // test increasing approval
            await instance.approve(spender, web3.utils.toWei("3"), {from: owner});
            expect(await instance.allowance(owner, spender)).to.be.bignumber.equal(web3.utils.toWei("3"));
        });

        it("should be able to revoke approval", async () => {
            await instance.approve(spender, web3.utils.toWei("3"), {from: owner});
            expect(await instance.allowance(owner, spender)).to.be.bignumber.equal(web3.utils.toWei("3"));

            await instance.approve(spender, web3.utils.toWei("0"), {from: owner});
            expect(await instance.allowance(owner, spender)).to.be.bignumber.equal(web3.utils.toWei("0"));
        });

        it("should update allowance accordingly", async () => {
            await instance.approve(spender, web3.utils.toWei("1"), {from: owner});
            expect(await instance.allowance(owner, spender)).to.be.bignumber.equal(web3.utils.toWei("1"));

            await instance.approve(spender, web3.utils.toWei("3"), {from: owner});
            expect(await instance.allowance(owner, spender)).to.be.bignumber.equal(web3.utils.toWei("3"));

            await instance.approve(spender, 0, {from: owner});
            expect(await instance.allowance(owner, spender)).to.be.bignumber.equal("0");
        });

        it("should fire Approval event", async () => {
            await instance.approve(spender, web3.utils.toWei("1"), {from: owner});

            if (owner !== spender) {
                await testApprovalEvent(spender, owner, web3.utils.toWei("2"));
            } else {
                throw new Error("same address");
            }
        });

        it("should fire Approval when allowance was set to 0", async () => {
            await instance.approve(spender, web3.utils.toWei("3"), {from: owner});
            await testApprovalEvent(owner, spender, 0);
        });

        it("should fire Approval even when allowance did not change", async () => {
            // even 0 -> 0 should fire Approval event
            await testApprovalEvent(owner, spender, 0);
            await instance.approve(spender, web3.utils.toWei("3"), {from: owner});
            await testApprovalEvent(owner, spender, web3.utils.toWei("3"));
        });
    });

    const testApprovalEvent = async (_owner, _spender, amount) => {
        let result = await instance.approve(_spender, amount, {from: _owner});
        let log = result.logs[0];
        assert.equal(log.event, "Approval");
        assert.equal(log.args.owner, _owner);
        assert.equal(log.args.spender, _spender);
        expect(log.args.value).to.be.bignumber.equal(amount.toString());
    };

    describe("transfer", async () => {
        it("should return true when called with amount of 0", async () => {
            assert.isTrue(await instance.transfer.call(recipient, web3.utils.toWei("0"), {from: owner}));
        });

        it("should return true when transfer can be made, false otherwise", async () => {
            await instance.mint(owner, web3.utils.toWei("2"));
            assert.isTrue(await instance.transfer.call(recipient, web3.utils.toWei("1"), {from: owner}));
            assert.isTrue(await instance.transfer.call(recipient, web3.utils.toWei("2"), {from: owner}));
            await expectRevert(instance.transfer(recipient, web3.utils.toWei("3"), {from: owner}), "ERC20: transfer amount exceeds balance.");

            await instance.transfer(recipient, web3.utils.toWei("1"), {from: owner});
            assert.isTrue(await instance.transfer.call(recipient, web3.utils.toWei("1"), {from: owner}));
            await expectRevert(instance.transfer(recipient, web3.utils.toWei("2"), {from: owner}), "ERC20: transfer amount exceeds balance.");
        });

        it("should revert when trying to transfer while having 0 balance", async () => {
            expect(await instance.balanceOf(recipient)).to.be.bignumber.equal(web3.utils.toWei("0"));
            await expectRevert(instance.transfer(recipient, web3.utils.toWei("1")), "ERC20: transfer amount exceeds balance.");
        });

        it("should revert when trying to transfer more than balance", async () => {
            await instance.mint(owner, web3.utils.toWei("1"));
            expect(await instance.balanceOf(owner)).to.be.bignumber.equal(web3.utils.toWei("1"));

            await instance.transfer(recipient, web3.utils.toWei("1"), {from: owner});
            await expectRevert(instance.transfer(recipient, web3.utils.toWei("1"), {from: owner}), "ERC20: transfer amount exceeds balance.");
        });

        it("should not affect the totalSupply", async () => {
            await instance.mint(owner, web3.utils.toWei("5"));
            let totalSupply1 = await instance.totalSupply();

            await instance.transfer(recipient, web3.utils.toWei("5"), {from: owner});
            let totalSupply2 = await instance.totalSupply();

            expect(totalSupply1).to.be.bignumber.equal(totalSupply2);
        });

        it("should update the balances accordingly", async () => {
            await instance.mint(owner, web3.utils.toWei("5"));

            await instance.transfer(alice, web3.utils.toWei("2"), {from: owner});
            await instance.transfer(bob, web3.utils.toWei("2"), {from: owner});
            await instance.transfer(bob, web3.utils.toWei("1"), {from: alice});
            await instance.transfer(owner, web3.utils.toWei("1"), {from: bob});

            expect(await instance.balanceOf(owner)).to.be.bignumber.equal(web3.utils.toWei("2"));
            expect(await instance.balanceOf(alice)).to.be.bignumber.equal(web3.utils.toWei("1"));
            expect(await instance.balanceOf(bob)).to.be.bignumber.equal(web3.utils.toWei("2"));
        });

        it("should fire Transfer event when transferring amount of 0", async () => {
            await testTransferEvent(owner, recipient, web3.utils.toWei("1"));
        });

        it("should fire Transfer event", async () => {
            await testTransferEvent(owner, recipient, web3.utils.toWei("0"));
        });

        const testTransferEvent = async (from, to, amount) => {
            if (amount > 0) {
                await instance.mint(from, amount);
            }

            let receipt = await instance.transfer(to, amount, {from: from});
            let log = receipt.logs[0];
            assert.equal(log.event, "Transfer");
            assert.equal(log.args.from, from);
            assert.equal(log.args.to, to);
        };
    });

    describe("transferFrom", async () => {
        it("should revert when trying to transfer while not allowed at all", async () => {
            await instance.mint(alice, web3.utils.toWei("2"));
            await expectRevert(instance.transferFrom(alice, bob, web3.utils.toWei("2"), {from: bob}), "ERC20: transfer amount exceeds allowance.");
        });

        it("should fire Transfer event when transferring amount of 0 and sender is not approved", async () => {
            let receipt = await instance.transferFrom(owner, recipient, web3.utils.toWei("0"), {from: owner});
            let log = receipt.logs[0];
            assert.equal(log.event, "Transfer");
            assert.equal(log.args.from, owner);
            assert.equal(log.args.to, recipient);
        });

        it("should return true when called with amount of 0 and sender is approved", async () => {
            await instance.approve(recipient, web3.utils.toWei("0"), {from: owner});
            assert.isTrue(await instance.transferFrom.call(owner, recipient, web3.utils.toWei("0"), {from: recipient}));
        });

        it("should return true when called with amount of 0 and sender is not approved", async () => {
            assert.isTrue(await instance.transferFrom.call(owner, recipient, web3.utils.toWei("0"), {from: recipient}));
        });

        it("should return true when transfer can be made, false otherwise", async () => {
            await instance.mint(owner, web3.utils.toWei("1"));
            await instance.approve(recipient, web3.utils.toWei("1"), {from: owner});
            await instance.transferFrom(owner, recipient, web3.utils.toWei("1"), {from: recipient});

            await expectRevert(instance.transferFrom(alice, bob, web3.utils.toWei("1"), {from: bob}), "ERC20: transfer amount exceeds balance.");

            await instance.mint(alice, web3.utils.toWei("1"));
            await instance.approve(bob, web3.utils.toWei("1"));
            await expectRevert(instance.transferFrom(alice, bob, web3.utils.toWei("2"), {from: bob}), "ERC20: transfer amount exceeds balance.");
        });

        it("should revert when trying to transfer something while _from having nothing", async () => {
            await instance.approve(bob, web3.utils.toWei("1"));
            await expectRevert(instance.transferFrom(alice, bob, web3.utils.toWei("1"), {from: bob}), "ERC20: transfer amount exceeds balance.");
        });

        it("should revert when trying to transfer more than balance of _from", async () => {
            await instance.mint(alice, web3.utils.toWei("1"));
            await instance.approve(bob, web3.utils.toWei("1"), {from: alice});
            await expectRevert(instance.transferFrom(alice, bob, web3.utils.toWei("2"), {from: bob}), "ERC20: transfer amount exceeds balance.");
        });

        it("should revert when trying to transfer more than allowed", async () => {
            await instance.mint(alice, web3.utils.toWei("2"));
            await instance.approve(bob, web3.utils.toWei("1"), {from: alice});
            await expectRevert(instance.transferFrom(alice, bob, web3.utils.toWei("2"), {from: bob}), "ERC20: transfer amount exceeds allowance.");
        });

        it("should not affect totalSupply", async () => {
            await instance.mint(alice, web3.utils.toWei("2"));
            await instance.approve(bob, web3.utils.toWei("2"), {from: alice});
            let totalSupply1 = await instance.totalSupply();

            await instance.transferFrom(alice, bob, web3.utils.toWei("2"), {from: bob});
            let totalSupply2 = await instance.totalSupply();

            expect(totalSupply1).to.be.bignumber.equal(totalSupply2);
        });

        it("should update allowances accordingly", async () => {
            await instance.mint(owner, web3.utils.toWei("2"));
            await instance.approve(recipient, web3.utils.toWei("1"), {from: owner});

            let initRecipientAllowance = await instance.allowance(owner, recipient);
            expect(initRecipientAllowance).to.be.bignumber.equal(web3.utils.toWei("1"));

            await instance.transferFrom(owner, recipient, web3.utils.toWei("1"), {from: recipient});

            let newRecipientAllowance = await instance.allowance(owner, recipient);
            expect(newRecipientAllowance).to.be.bignumber.equal(web3.utils.toWei("0"));
        });

        it("should fire Transfer event", async () => {
            await instance.mint(alice, web3.utils.toWei("1"));
            await instance.approve(bob, web3.utils.toWei("1"), {from: alice});
            let receipt = await instance.transferFrom(alice, bob, web3.utils.toWei("1"), {from: bob});
            let log = receipt.logs[0];
            assert.equal(log.event, "Transfer");
            assert.equal(log.args.from, alice);
            assert.equal(log.args.to, bob);
        });
    });

    describe("increaseApproval", async () => {
        it("should be able to increase the approval amount", async () => {
            await instance.mint(alice, web3.utils.toWei("15"));
            await instance.approve(bob, web3.utils.toWei("1"), {from: alice});
            await instance.transferFrom(alice, bob, web3.utils.toWei("1"), {from: bob});
            expect(await instance.allowance(alice, bob)).to.be.bignumber.equal(web3.utils.toWei("0"));

            await instance.approve(bob, web3.utils.toWei("10"), {from: alice});
            await instance.transferFrom(alice, bob, web3.utils.toWei("5"), {from: bob});
            expect(await instance.allowance(alice, bob)).to.be.bignumber.equal(web3.utils.toWei("5"));
        });
    });

    describe("decreaseApproval", async () => {
        it("should be able to decrease the approval amount", async () => {
            await instance.mint(alice, web3.utils.toWei("15"));
            await instance.approve(bob, web3.utils.toWei("10"), {from: alice});
            await instance.transferFrom(alice, bob, web3.utils.toWei("1"), {from: bob});
            expect(await instance.allowance(alice, bob)).to.be.bignumber.equal(web3.utils.toWei("9"));

            await instance.approve(bob, web3.utils.toWei("3"), {from: alice});
            await instance.transferFrom(alice, bob, web3.utils.toWei("1"), {from: bob});
            expect(await instance.allowance(alice, bob)).to.be.bignumber.equal(web3.utils.toWei("2"));
        });
    });

    describe("whitelisting when not paused", async () => {
        const whitelistedArr = [];
        let currentBalance = "0";
        let newBalance = "1";

        it("should have whitelisting disabled by default", async () => {
            expect(await instance.whitelistingActive()).to.equal(false);
        });

        it("should not have any whitelisted address by default - array is empty", async () => {
            expect(await instance.mintWhitelistLength()).to.be.bignumber.equal(whitelistedArr.length.toString());
        });

        it("should add minter address", async () => {
            await instance.addMintAddress(user);
            expect(await instance.mintWhitelist(user)).to.equal(true);
        });

        it("should verify that the mint address is whitelisted", async () => {
            await instance.addMintAddress(user);
            expect(await instance.isMintAddressWhitelisted(user)).to.equal(true);
        });

        it("should not allow duplicate minter addresses", async () => {
            await instance.addMintAddress(user);
            await expectRevert(instance.addMintAddress(user), "Address is already whitelisted");
        });

        it("should mint tokens to whitelisted address when white-listing is active", async () => {
            await instance.toggleWhitelisting(true);
            await instance.addMintAddress(user);

            expect(await instance.isMintAddressWhitelisted(user)).to.equal(true);
            expect(await instance.balanceOf(user)).to.be.bignumber.equal(web3.utils.toWei(currentBalance));

            const receipt = await instance.mint(user, web3.utils.toWei("1"));

            expectEvent(receipt, "Transfer", {from: ZERO_ADDRESS, to: user, value: web3.utils.toWei(newBalance)});
            expect(await instance.balanceOf(user)).to.be.bignumber.equal(web3.utils.toWei(newBalance));
        });

        it("should not mint tokens to non-whitelisted address when white-listing is active", async () => {
            await instance.toggleWhitelisting(true);
            // await instance.addMintAddress(user);

            expect(await instance.isMintAddressWhitelisted(user)).to.equal(false);
            expect(await instance.balanceOf(user)).to.be.bignumber.equal(web3.utils.toWei(currentBalance));
            await expectRevert(instance.mint(user, web3.utils.toWei("1")), "Address is not whitelisted for minting");
        });

        it("should mint tokens to non-whitelisted address when white-listing is not active", async () => {
            // await instance.toggleWhitelisting(true);
            await instance.addMintAddress(user);

            expect(await instance.isMintAddressWhitelisted(user)).to.equal(true);
            expect(await instance.balanceOf(user)).to.be.bignumber.equal(web3.utils.toWei(currentBalance));

            const receipt = await instance.mint(user, web3.utils.toWei("1"));

            expectEvent(receipt, "Transfer", {from: ZERO_ADDRESS, to: user, value: web3.utils.toWei(newBalance)});
            expect(await instance.balanceOf(user)).to.be.bignumber.equal(web3.utils.toWei(newBalance));
        });

        it("should not allow a non-minter role to mint new tokens to whitelisted addresses when whitelisting is active", async () => {
            await instance.toggleWhitelisting(true);
            await instance.addMintAddress(user);

            expect(await instance.isMintAddressWhitelisted(user)).to.equal(true);
            expect(await instance.balanceOf(user)).to.be.bignumber.equal(web3.utils.toWei(currentBalance));
            await expectRevert(instance.mint(user, web3.utils.toWei("1"), {from: spender}), "must have minter role to mint.");
            expect(await instance.balanceOf(user)).to.be.bignumber.equal(web3.utils.toWei(currentBalance));
        });

        it("should be able to remove a whitelisted address", async () => {
            await instance.addMintAddress(user);
            expect(await instance.isMintAddressWhitelisted(user)).to.equal(true);

            await instance.removeMintAddress(user);
            expect(await instance.isMintAddressWhitelisted(user)).to.equal(false);
        });

        it("should be able to toggle on & off the option to whitelist mint addresses", async () => {
            await instance.toggleWhitelisting(true);
            expect(await instance.whitelistingActive()).to.equal(true);

            await instance.toggleWhitelisting(false);
            expect(await instance.whitelistingActive()).to.equal(false);
        });
    });

    describe("check roles", async () => {
        let deployer = accounts[0];
        let other = accounts[1];

        const amount = new BN("5000");

        it("deployer has the default admin role", async () => {
            expect(await instance.getRoleMemberCount(DEFAULT_ADMIN_ROLE)).to.be.bignumber.equal("1");
            expect(await instance.getRoleMember(DEFAULT_ADMIN_ROLE, 0)).to.equal(deployer);
        });

        it("deployer has the minter role", async () => {
            expect(await instance.getRoleMemberCount(MINTER_ROLE)).to.be.bignumber.equal("1");
            expect(await instance.getRoleMember(MINTER_ROLE, 0)).to.equal(deployer);
        });

        it("deployer has the pauser role", async () => {
            expect(await instance.getRoleMemberCount(PAUSER_ROLE)).to.be.bignumber.equal("1");
            expect(await instance.getRoleMember(PAUSER_ROLE, 0)).to.equal(deployer);
        });

        it("minter and pauser role admin is the default admin", async () => {
            expect(await instance.getRoleAdmin(MINTER_ROLE)).to.equal(DEFAULT_ADMIN_ROLE);
            expect(await instance.getRoleAdmin(PAUSER_ROLE)).to.equal(DEFAULT_ADMIN_ROLE);
        });

        describe("minting", function () {
            it("deployer can mint tokens", async () => {
                const receipt = await instance.mint(other, amount, {from: deployer});
                expectEvent(receipt, "Transfer", {from: ZERO_ADDRESS, to: other, value: amount});

                expect(await instance.balanceOf(other)).to.be.bignumber.equal(amount);
            });

            it("other accounts cannot mint tokens", async () => {
                await expectRevert(instance.mint(other, amount, {from: other}), "Reason given: must have minter role to mint",);
            });
        });

        describe("pausing", function () {
            it("deployer can pause", async () => {
                const receipt = await instance.pause({from: deployer});
                expectEvent(receipt, "Paused", {account: deployer});

                expect(await instance.paused()).to.equal(true);
            });

            it("deployer can unpause", async () => {
                await instance.pause({from: deployer});

                const receipt = await instance.unpause({from: deployer});
                expectEvent(receipt, "Unpaused", {account: deployer});

                expect(await instance.paused()).to.equal(false);
            });

            it("cannot mint while paused", async () => {
                await instance.pause({from: deployer});

                await expectRevert(instance.mint(other, amount, {from: deployer}), "Pausable: paused");
            });

            it("other accounts cannot pause", async () => {
                await expectRevert(instance.pause({from: other}), "ERR_NOT_PAUSER");
            });

            it("allows to mint when paused and then unpaused", async () => {
                await instance.pause();
                await instance.unpause();

                await instance.mint(recipient, amount);

                expect(await instance.balanceOf(recipient)).to.be.bignumber.equal(amount);
            });
        });
    });

    describe("pause contract", async () => {
        let deployer = accounts[0];
        let other = accounts[1];

        it("addPauserRole", async () => {
            expect(await instance.hasRole(PAUSER_ROLE, other)).to.be.false;

            await instance.addPauser(other);

            expect(await instance.hasRole(PAUSER_ROLE, other)).to.be.true;
        });

        it("revokePauserRole", async () => {
            expect(await instance.hasRole(PAUSER_ROLE, deployer)).to.be.true;

            await instance.renouncePauser();

            expect(await instance.hasRole(PAUSER_ROLE, deployer)).to.be.false;
        });

        it("should allow owner to able to pause the Plenny ERC-20", async () => {
            await instance.pause();
            expect(await instance.paused()).to.equal(true);
        });

        it("should allow owner to be able to unpause the Plenny ERC-20", async () => {
            await instance.pause();
            expect(await instance.paused()).to.equal(true);

            await instance.unpause();
            expect(await instance.paused()).to.equal(false);
        });

        it("should not allow others to able to pause the Plenny ERC-20", async () => {
            await expectRevert(instance.pause({from: user}), "ERR_NOT_PAUSER");
            expect(await instance.paused()).to.equal(false);
        });

        it("should not allow others to be able to unpause the Plenny ERC-20", async () => {
            await instance.pause();
            expect(await instance.paused()).to.equal(true);

            await expectRevert(instance.unpause({from: user}), "ERR_NOT_PAUSER");
            expect(await instance.paused()).to.equal(true);
        });
    });

    describe("plenny interaction when paused", async () => {
        it("should not allow interaction when paused", async () => {
            expect(await instance.paused()).to.equal(false);

            await instance.pause();
            expect(await instance.paused({from: owner})).to.equal(true);

            await expectRevert(instance.addMintAddress(user), "Pausable: paused");
            await expectRevert(instance.mint(user, web3.utils.toWei("1")), "Pausable: paused");
            await expectRevert(instance.removeMintAddress(user), "Pausable: paused");
            await expectRevert(instance.toggleWhitelisting(true), "Pausable: paused");
            await expectRevert(instance.toggleWhitelisting(false), "Pausable: paused");
        });
    });
});
