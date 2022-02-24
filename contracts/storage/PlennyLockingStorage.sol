// SPDX-License-Identifier: MIT

pragma solidity >=0.6.0 <0.8.0;

import "../interfaces/IPlennyLocking.sol";

/// @title  PlennyLockingStorage
/// @notice Storage contract for PlennyLocking
abstract contract PlennyLockingStorage is IPlennyLocking {

    /// @notice weight multiplier
    uint256 public constant WEIGHT_MULTIPLIER = 100;

    /// @notice total plenny amount locked
    uint256 public totalValueLocked;
    /// @notice total votes locked
    uint256 public override totalVotesLocked;
    /// @notice total votes already collected
    uint256 public totalVotesCollected;

    /// @notice reward percentage
    uint256 public override govLockReward; // 0.01%
    /// @notice distribution period, in blocks
    uint256 public nextDistributionSeconds; // 1 day
    /// @notice blocks per week
    uint256 public averageBlockCountPerWeek; // 1 week

    /// @notice Withdrawal fee in % * 100
    uint256 public withdrawFee;
    /// @notice exit fee, charged when the user withdraws its locked plenny
    uint256 public lockingFee;
    /// @notice number of total votes checkpoints
    uint public totalVoteNumCheckpoints;

    /// @notice arrays of locked record
    LockedRecord[] public lockedRecords;
    /// @notice indexes per address
    mapping (address => uint256[]) public recordIndexesPerAddress;
    /// @notice A record of votes checkpoints for each account, by index
    mapping (address => mapping (uint => Checkpoint)) public checkpoints;

    /// @notice The number of checkpoints for each account
    mapping (address => uint) public numCheckpoints;

    /// @notice value locked per user
    mapping(address => uint256) public userValueLocked;
    /// @notice votes per user
    mapping(address => uint256) public userVoteCount;

    /// @notice total votes
    mapping (uint => Checkpoint) public totalVoteCount;

    /// @notice earned balance per user
    mapping(address => uint256) public totalUserEarned;
    /// @notice locked period per user
    mapping(address => uint256) public userLockedPeriod;
    /// @notice collected period per user
    mapping(address => uint256) public userLastCollectedPeriod;

    struct LockedRecord {
        address owner;
        uint256 amount;
        uint256 addedDate;
        uint256 endDate;
        uint256 multiplier;
        bool deleted;
    }

    struct Checkpoint {
        uint fromBlock;
        uint voteCount;
    }
}
