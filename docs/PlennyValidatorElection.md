---
title: PlennyValidatorElection.sol Spec
id: PlennyValidatorElection
---

 PlennyValidatorElection

Contains the logic for the election cycle and the process of electing validators based on
        Delegated Proof of Stake (DPoS), and reserves rewards.




### `initialize(address _registry)` (external)

Initializes the smart contract instead of a constructor. Called once during deploy.




- `_registry`: Plenny contract registry



### `newElection()` (external)

Triggers a new election. Fails if not enough time has passed from the previous election.






### `reserveReward(address validator, uint256 oracleChannelReward)` (external)

Reserves a reward for a given validator as a result of a oracle validation done on-chain.




- `validator`: to reserve reward for

- `oracleChannelReward`: the reward amount



### `setNewElectionPeriod(uint256 amount)` (external)

Changes the new election period (measured in blocks). Called by the owner.




- `amount`: election period, in blocks



### `setMaxValidators(uint256 amount)` (external)

Changes the maximum number of validators. Called by the owner.




- `amount`: validators



### `setUserRewardPercent(uint256 amount)` (external)

Changes the user reward in percentage. Called by the owner.




- `amount`: amount percentage for the user



### `getElectedValidatorsCount(uint256 electionBlock) → uint256` (external)

Gets elected validator count per election.




- `electionBlock`: block of the election


**Returns**: uint256: count







### `LogCall(bytes4 sig, address caller, bytes data)`

An event emitted when logging function calls.



### `OracleReward(address to, uint256 amount)`

An event emitted when the rewards are distributed.



