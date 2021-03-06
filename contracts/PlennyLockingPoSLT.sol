// SPDX-License-Identifier: MIT

pragma solidity >=0.6.0 <0.8.0;

import "@openzeppelin/contracts-upgradeable/math/SafeMathUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC20/SafeERC20Upgradeable.sol";
import "./PlennyBasePausableV2.sol";
import "./interfaces/IPlennyERC20.sol";
import "./interfaces/IPlennyStaking.sol";
import "./storage/PlennyLiqMiningStorage.sol";
import "./storage/PlennyStakingStorage.sol";

/// @title PlennyLockingPoSLT
/// (PlennyStaking in BETA release.)
/// @notice Manages locking of oracle validator thresholds for Proof-of-Stake (PoS) and down payments by Liquidity Takers in the capacity market.
///         Attn: The storage contract refers to locking token (not staking).
contract PlennyLockingPoSLT is PlennyBasePausableV2, PlennyStakingStorage {

    using SafeMathUpgradeable for uint256;
    using AddressUpgradeable for address payable;
    using SafeERC20Upgradeable for IPlennyERC20;

    /// An event emitted when logging function calls.
    event LogCall(bytes4  indexed sig, address indexed caller, bytes data) anonymous;

    /// @notice Locks PL2 for the purpose of the Lightning marketplace, delegation and validation.
    /// @param  amount amount to lock
    function lockPlenny(uint256 amount) external whenNotPaused nonReentrant {
        _logs_();
        _setPlennyBalanceInternal(msg.sender, plennyBalance[msg.sender] + amount);
        contractRegistry.factoryContract().increaseDelegatedBalance(msg.sender, amount);
        contractRegistry.plennyTokenContract().safeTransferFrom(msg.sender, address(this), amount);
    }

    /// @notice Releases PL2 from marketplace. If the user is an oracle, a minimum oracle amount needs to be kept locked.
    ///         A fee is charged on unlocking.
    /// @param  amount amount to release
    /// @return uint256 amount that was unstacked.
    function unlockPlenny(uint256 amount) external whenNotPaused nonReentrant returns (uint256) {
        _logs_();
        require(plennyBalance[msg.sender] >= amount, "ERR_NO_FUNDS");

        IPlennyDappFactory factory = contractRegistry.factoryContract();
        // check if the user is oracle
        if (factory.isOracleValidator(msg.sender)) {
            uint256 defaultLockingAmount = factory.defaultLockingAmount();
            require(plennyBalance[msg.sender] >= defaultLockingAmount, "ERR_NO_FUNDS");
            require(plennyBalance[msg.sender] - defaultLockingAmount >= amount, "ERR_NO_FUNDS");
        }

        _setPlennyBalanceInternal(msg.sender, plennyBalance[msg.sender] - amount);
        factory.decreaseDelegatedBalance(msg.sender, amount);

        uint256 fee = amount.mul(withdrawFee).div(100);

        uint256 actualAmount = amount - fee.div(100);

        IPlennyERC20 token = contractRegistry.plennyTokenContract();
        token.safeTransfer(contractRegistry.requireAndGetAddress("PlennyRePLENishment"), fee.div(100));
        token.safeTransfer(msg.sender, actualAmount);
        return actualAmount;
    }

    /// @notice Whenever a Plenny locking balance is increased.
    /// @param  userAddress address of the user
    /// @param  amount increasing amount
    function increasePlennyBalance(address userAddress, uint256 amount, address from) external override {
        _onlyAuth();
        _logs_();

        _setPlennyBalanceInternal(userAddress, plennyBalance[userAddress] += amount);
        contractRegistry.factoryContract().increaseDelegatedBalance(userAddress, amount);
        contractRegistry.plennyTokenContract().safeTransferFrom(from, address(this), amount);
    }

    /// @notice Whenever a Plenny locking balance is decreased.
    /// @param  userAddress address of the user
    /// @param  amount decreased amount
    /// @param  to sending to
    function decreasePlennyBalance(address userAddress, uint256 amount, address to) external override {
        _onlyAuth();
        _logs_();

        require(plennyBalance[userAddress] >= amount, "ERR_NO_FUNDS");
        _setPlennyBalanceInternal(userAddress, plennyBalance[userAddress] -= amount);
        contractRegistry.factoryContract().decreaseDelegatedBalance(userAddress, amount);
        contractRegistry.plennyTokenContract().safeTransfer(to, amount);
    }

    /// @notice Changes the fee for withdrawing. Called by the owner.
    /// @param  newWithdrawFee new withdrawal fee in percentage
    function setWithdrawFee(uint256 newWithdrawFee) external onlyOwner {
        require(newWithdrawFee < 10001, "ERR_WRONG_STATE");
        withdrawFee = newWithdrawFee;
    }

    /// @notice Number of plenny owners.
    /// @return uint256 count
    function plennyOwnersCount() external view returns (uint256) {
        return plennyOwners.length;
    }

    /// @notice Manage the plenny locking balance.
    /// @param  dapp address
    /// @param  amount setting amount
    function _setPlennyBalanceInternal(address dapp, uint256 amount) internal {
        plennyBalance[dapp] = amount;
        _pushPlennyOwnerInternal(dapp);
    }

    /// @notice Manage the plenny owners count.
    /// @param  plennyOwner add owner
    function _pushPlennyOwnerInternal(address plennyOwner) internal {
        if (!plennyOwnerExists[plennyOwner]) {
            plennyOwners.push(plennyOwner);
            plennyOwnerExists[plennyOwner] = true;
        }
    }

    /// @dev    logs the function calls.
    function _logs_() internal {
        emit LogCall(msg.sig, msg.sender, msg.data);
    }

    /// @dev    Only the authorized contracts can make requests.
    function _onlyAuth() internal view {
        require(contractRegistry.getAddress("PlennyLiqMining") == msg.sender || contractRegistry.requireAndGetAddress("PlennyOracleValidator") == msg.sender ||
        contractRegistry.requireAndGetAddress("PlennyCoordinator") == msg.sender || contractRegistry.requireAndGetAddress("PlennyOcean") == msg.sender, "ERR_NOT_AUTH");
    }
}
