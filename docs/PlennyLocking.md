---
title: PlennyLocking.sol Spec
id: PlennyLocking
---

 PlennyLocking

Manages the locked balances in Plenny for DAO governance.


### `_logs_()`



   logs the function calls.



### `initialize(address _registry)` (external)

Initializes the contract. Called once during deployment.




- `_registry`: plenny contract registry



### `lockPlenny(uint256 amount, uint256 period)` (external)

Locks Plenny in the governance.




- `amount`: plenny amount

- `period`: period, in weeks



### `relockPlenny(uint256 index, uint256 period)` (external)

Relocks Plenny after the locking period expires.




- `index`: id of the previously locked record

- `period`: the new locking period, in weeks



### `withdrawPlenny(uint256 index)` (external)

Withdraws the Plenny tokens, once the locking period has expired.




- `index`: id of the locking record



### `collectReward()` (external)

Collects Plenny reward for the locked Plenny tokens.






### `setNextDistributionSeconds(uint256 amount)` (external)

Changes the next distribution in seconds. Managed by the contract owner




- `amount`: number of blocks.



### `setGovLockReward(uint256 amount)` (external)

Changes the governance lock reward multiplier. Managed by the contract owner.




- `amount`: multiplier of 100



### `setWithdrawFee(uint256 amount)` (external)

Changes the withdraw Fee. Managed by the contract owner.




- `amount`: multiplier of 100



### `setLockingFee(uint256 amount)` (external)

Changes the locking Fee multiplier. Managed by the contract owner.




- `amount`: multiplier of 100



### `setAverageBlockCountPerWeek(uint256 count)` (external)

Changes average block counts per week. Managed by the contract owner.




- `count`: blocks per week



### `getRecordIndexesPerAddressCount(address addr) → uint256` (external)

Gets number of locked records per address.




- `addr`: address to check


**Returns**: uint256: number


### `getRecordIndexesPerAddress(address addr) → uint256[]` (external)

Gets locked records per address.




- `addr`: address to check


**Returns**: arrays: of indexes


### `lockedBalanceCount() → uint256` (external)

Number of total locked records.





**Returns**: uint256: number of records


### `getPotentialRewardGov() → uint256` (external)

Shows potential reward for the given user.





**Returns**: uint256: token amount


### `getTotalVoteCountAtBlock(uint256 blockNumber) → uint256` (external)

Gets the total votes from all users at the given block number.




- `blockNumber`: block number


**Returns**: uint256: total votes


### `getUserVoteCountAtBlock(address account, uint256 blockNumber) → uint256` (external)

Gets the votes for the given user at the given block number.




- `account`: user address

- `blockNumber`: block number


**Returns**: uint256: vote per user


### `calculateReward(uint256 votes) → uint256` (public)

Calculates the reward of the user based on the user's participation (votes) in the the locking.




- `votes`: participation in the locking


**Returns**: uint256: plenny reward amount









### `LogCall(bytes4 sig, address caller, bytes data)`

An event emitted when logging function calls.



