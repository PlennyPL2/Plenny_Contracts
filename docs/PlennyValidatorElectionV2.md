---
title: PlennyValidatorElectionV2.sol Spec
id: PlennyValidatorElectionV2
---

 PlennyValidatorElection

Contains the logic for the election cycle and the process of electing validators based on validators scores.




### `newElection()` (external)

Triggers a new election. Fails if not enough time has passed from the previous election.






### `reserveReward(address, uint256)` (external)

Reserves a reward for a given validator as a result of a oracle validation done on-chain.






### `setNewElectionPeriod(uint256 amount)` (external)

Changes the new election period (measured in blocks). Called by the owner.




- `amount`: election period, in blocks



### `setMaxValidators(uint256 amount)` (external)

Changes the maximum number of validators. Called by the owner.




- `amount`: validators



### `setUserRewardPercent(uint256 amount)` (external)

Changes the user reward in percentage. Called by the owner.




- `amount`: amount percentage for the user



### `setElectionTriggerUserReward(uint256 amount)` (external)

Changes the user reward. Called by the owner.




- `amount`: amount reward for the user



### `setLatestElectionBlock(uint256 value)` (external)

Sets the latest election block number. Only to be used in rare circumstances, like resetting the number.




- `value`: block number value



### `getElectedValidatorsCount(uint256 electionBlock) → uint256` (external)

Gets elected validator count per election.




- `electionBlock`: block of the election


**Returns**: uint256: count







### `LogCall(bytes4 sig, address caller, bytes data)`

An event emitted when logging function calls.



### `OracleReward(address to, uint256 amount)`

An event emitted when the rewards are distributed.



### `NewValidators(address[] newValidators)`

An event emitted when new validators are elected.



### `UserReward(uint256 userReward)`

An event emitted when user reward is distributed.



