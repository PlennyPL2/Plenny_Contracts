---
title: PlennyDappFactory.sol Spec
id: PlennyDappFactory
---

 PlennyDappFactory

Contract for storing information about the Lightning Oracles and Delegators.


### `_logs_()`



   Logs the method calls.



### `initialize(address _registry)` (external)

Initializes the smart contract instead of constructor.


   Called only once.


- `_registry`: Plenny contract registry



### `addValidator(string _name, uint256 nodeIndex, string nodeIP, string nodePort, string serviceUrl, uint256 _revenueShare)` (external)

Registers a Lightning Oracle. The oracle needs to stake Plenny as a prerequisite for the registration.
        The oracle needs to have a verified Lightning node registered in the PlennyCoordinator.




- `_name`: Name of the oracle

- `nodeIndex`: index/id of the Lightning as registered in the PlennyCoordinator.

- `nodeIP`: ip address of the verified Lightning node.

- `nodePort`: port of the verified Lightning node.

- `serviceUrl`: url(host:port) used for running the Plenny Oracle Service.

- `_revenueShare`: revenue share percentage



### `createDefaultValidator(string publicKey, string name, string nodeIP, string nodePort, string serviceUrl, uint256 revenueShare, address payable account)` (external)

Used for registering the initial(ZERO) oracle. Managed by the contract owner.




- `publicKey`: The public key of the Lightning node.

- `name`: Name of the oracle

- `nodeIP`: ip address of the initial Lightning node.

- `nodePort`: port of the initial Lightning node.

- `serviceUrl`: url(host:port) used for running the Plenny Oracle Service.

- `revenueShare`: revenue share percentage

- `account`: address of the initial lightning oracle.



### `removeValidator()` (external)

Unregisters a Lightning Oracle. In case the oracle is an active validator in the current validation cycle,
        it will fail in removing it.






### `delegateTo(address payable newOracle)` (external)

Delegates Plenny to the given oracle.




- `newOracle`: address of the oracle to delegate to



### `undelegate()` (external)

Removes a delegation.






### `increaseDelegatedBalance(address user, uint256 amount)` (external)

Called whenever a delegator user stakes more Plenny.


   Called by the PlennyStaking contract.


- `user`: address

- `amount`: Plenny amount that was staked



### `decreaseDelegatedBalance(address user, uint256 amount)` (external)

Called whenever a delegator user unstakes Plenny.


   Only called by the PlennyStaking contract.


- `user`: address

- `amount`: Plenny amount that was unstaked



### `updateReputation(address validator, uint256 reward)` (external)

Called whenever an oracle has participated in a validation cycle just before a new validator election
        is triggered. It will update the oracle reputation of that validation cycle.


   Only called by the PlennyValidatorElection contract.


- `validator`: oracle address

- `reward`: the validator reward to update reputation for



### `setDefaultLockingAmount(uint256 amount)` (external)

Changes the default Locking Amount. Managed by the contract owner.




- `amount`: Plenny amount



### `setUserChannelReward(uint256 amount)` (external)

Changes the user Channel Reward. Managed by the contract owner.




- `amount`: percentage multiplied by 100



### `setUserChannelRewardPeriod(uint256 amount)` (external)

Changes the user Channel Reward Period. Managed by the contract owner.




- `amount`: period, in blocks



### `setUserChannelRewardFee(uint256 amount)` (external)

Changes the user Channel Reward Fee. Managed by the contract owner.




- `amount`: percentage multiplied by 100



### `setStakedMultiplier(uint256 amount)` (external)

Changes the staked Multiplier. Managed by the contract owner.




- `amount`: multiplied by 100



### `setDelegatedMultiplier(uint256 amount)` (external)

Changes the delegated Multiplier. Managed by the contract owner.




- `amount`: multiplied by 100



### `setReputationMultiplier(uint256 amount)` (external)

Changes the reputation Multiplier. Managed by the contract owner.




- `amount`: multiplied by 100



### `setMinCapacity(uint256 value)` (external)

Changes the  minimum channel capacity amount. Managed by the contract owner.




- `value`: channel capacity, in satoshi



### `setMaxCapacity(uint256 value)` (external)

Changes the maximum channel capacity amount. Managed by the contract owner.




- `value`: channel capacity, in satoshi



### `setMakersFixedRewardAmount(uint256 value)` (external)

Changes the makers Fixed Reward Amount. Managed by the contract owner.




- `value`: plenny reward amount, in wei



### `setCapacityFixedRewardAmount(uint256 value)` (external)

Changes the capacity Fixed Reward Amount. Managed by the contract owner.




- `value`: plenny reward, in wei



### `setMakersRewardPercentage(uint256 value)` (external)

Changes the makers Reward Percentage. Managed by the contract owner.




- `value`: multiplied by 100



### `setCapacityRewardPercentage(uint256 value)` (external)

Changes the capacity Reward Percentage. Managed by the contract owner.




- `value`: multiplied by 100



### `getValidatorInfo(address validator) → string name, uint256 nodeIndex, string nodeIP, string nodePort, string validatorServiceUrl, uint256 revenueShareGlobal, address owner, uint256 reputation` (external)

Gets info for the given oracle.




- `validator`: oracle address


**Returns**: name: name

**Returns**: nodeIndex: index/id of the Lightning as registered in the PlennyCoordinator.

**Returns**: nodeIP: ip address of the verified Lightning node.

**Returns**: nodePort: port of the verified Lightning node.

**Returns**: validatorServiceUrl: url(host:port) used for running the Plenny Oracle Service.

**Returns**: revenueShareGlobal: revenue share percentage

**Returns**: owner: address of the validator

**Returns**: reputation: score/reputation


### `getMyDelegators() → address[]` (external)

Lists all delegator addresses for the given user.





**Returns**: array: of addresses


### `validatorsCount() → uint256` (external)

Number of oracles.





**Returns**: uint256: counter


### `random() → uint256` (external)

Calculates random numbers for a channel capacity used for verifying nodes in the PlennyCoordinator.





**Returns**: uint256: random number


### `pureRandom() → uint256` (external)

Calculates random numbers based on the block info.





**Returns**: uint256: random number


### `getValidatorsScore() → uint256[] scores, uint256 sum` (external)

Gets all the validator scores and the sum of all scores.





**Returns**: scores: arrays of validator scores

**Returns**: sum: score sum


### `getDelegators(address oracle) → address[]` (public)

Gets all delegators for the given oracle.




- `oracle`: address


**Returns**: array: of delegator addresses


### `getDelegatedBalance(address user) → uint256` (public)

Gets the Plenny balance from all the delegators of the given address.




- `user`: address to check


**Returns**: uint256: delegated balance


### `isOracleValidator(address oracle) → bool` (public)

Checks if the address is an oracle.




- `oracle`: address to check


**Returns**: bool: true/false






### `LogCall(bytes4 sig, address caller, bytes data)`

An event emitted when logging function calls.



### `ValidatorAdded(address account, bool created)`

An event emitted when a validator is added.



