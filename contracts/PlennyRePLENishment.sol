// SPDX-License-Identifier: MIT

pragma solidity >=0.6.0 <0.8.0;

import "@openzeppelin/contracts-upgradeable/token/ERC20/SafeERC20Upgradeable.sol";
import "./PlennyBasePausableV2.sol";
import "./storage/PlennyFeeStorage.sol";
import "./interfaces/IPlennyERC20.sol";

/// @title  PlennyRePLENishment
/// @notice Collects all the fees from the Dapp and manages the rePLENishment of the treasury.
///         All the fees are distributed to PlennyTreasury.
contract PlennyRePLENishment is PlennyBasePausableV2, PlennyFeeStorage {

    using SafeMathUpgradeable for uint256;
    using AddressUpgradeable for address payable;
    using SafeERC20Upgradeable for IPlennyERC20;

    /// An event emitted when logging function calls.
    event LogCall(bytes4  indexed sig, address indexed caller, bytes data) anonymous;
    /// An event emitted when the Treasury rePLENishment triggered.
    event ReplenishedTreasury(uint256 rewardAmount, uint256 treasuryAmount);

    /// @notice Initializes the contract instead of constructor. Called once during contract deployment.
    /// @param  _registry plenny contract registry
    function initialize(address _registry) external initializer {

        //10%
        buyBackPercentagePl2 = 1000;
        //10%
        lpBurningPercentage = 1000;
        //0.1%
        replenishRewardPercentage = 10;
        //0.1%
        dailyInflationRewardPercentage = 10;
        //10 LP
        lpThresholdForBurning = uint256(10).mul(10 ** 18);
        //100 PL2
        plennyThresholdForBuyback = uint256(100).mul(10 ** 18);
        //1 PL2
        inflationAmountPerBlock = uint256(1).mul(10 ** 18);
        // 1 day;
        maintenanceBlockLimit = 6500;

        lastMaintenanceBlock = _blockNumber();

        PlennyBasePausableV2.__plennyBasePausableInit(_registry);
    }

    /// @notice Runs the rePLENishment of the fees by sending all the fees directly to the Treasury HODL.
    /// @return bool true if the job has distributed the fees
    function rePLENishmentJob() external nonReentrant returns (bool) {
        IPlennyERC20 token = contractRegistry.plennyTokenContract();

        address treasuryAddress = contractRegistry.requireAndGetAddress("PlennyTreasury");
        uint256 feeAmountCollected = token.balanceOf(address(this));
        require(feeAmountCollected > 0, "NO_FEES_COLLECTED_YET");

        uint256 userReward = feeAmountCollected.mul(replenishRewardPercentage).div(100).div(100);
        feeAmountCollected -= userReward;
        token.safeTransfer(msg.sender, userReward);

        token.safeTransfer(treasuryAddress, feeAmountCollected);

        emit ReplenishedTreasury(userReward, feeAmountCollected);
        return true;
    }

    /// @notice Logs the receiving of funds
    receive() external payable {
        emit LogCall(msg.sig, msg.sender, msg.data);
    }
}
