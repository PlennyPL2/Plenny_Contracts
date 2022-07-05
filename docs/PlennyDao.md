---
title: PlennyDao.sol Spec
id: PlennyDao
---

 PlennyDao

Governs the Dapp via voting on community proposals.


### `_logs_()`



   Emits log event of the function calls.

### `onlyGovernanceStakers()`



Checks if a staked balance of a user is above threshold



### `initialize(address _registry)` (external)

Initializes the smart contract instead of a constructor.


   Can be called only once during deployment.


- `_registry`: PlennyContractRegistry



### `propose(address[] targets, uint256[] values, string[] signatures, bytes[] calldatas, string description) → uint256` (external)

Submits a governance proposal. The submitter needs to have enough votes at stake in order to submit a proposal


   A proposal is an executable code that consists of the address of the smart contract to call, the function
        (signature to call), and the value(s) provided to that function.


- `targets`: addresses of the smart contracts

- `values`: values provided to the relevant functions

- `signatures`: function signatures

- `calldatas`: function data

- `description`: the description of the proposal


**Returns**: uint: proposal id


### `castVote(uint256 _proposalID, bool support)` (external)

Casts a vote for the given proposal.




- `_proposalID`: proposal id

- `support`: for/against the proposal



### `castVoteBySig(uint256 _proposalID, bool support, uint8 v, bytes32 r, bytes32 s)` (external)

Casts a vote for the given proposal using signed signatures.




- `_proposalID`: proposal id

- `support`: for/against the proposal

- `v`: recover value + 27

- `r`: first 32 bytes of the signature

- `s`: next 32 bytes of the signature



### `queue(uint256 _proposalID)` (external)

Queues a proposal into the timelock for execution, if it has been voted successfully.




- `_proposalID`: proposal id



### `cancel(uint256 _proposalID)` (external)

Cancels a proposal.




- `_proposalID`: proposal id



### `execute(uint256 _proposalID)` (external)

Executes a proposal that has been previously queued in a timelock.




- `_proposalID`: proposal id



### `queueSetGuardian(address newGuardian, uint256 eta)` (external)

Queues proposal to change a guardian. Guardian can temporarily reject unwanted proposals.




- `newGuardian`: new guardian address

- `eta`: proposal ETA



### `executeSetGuardian(address newGuardian, uint256 eta)` (external)

Executes the guardian proposal. Guardian can temporarily reject unwanted proposals.




- `newGuardian`: new guardian address

- `eta`: proposal ETA for execution



### `setGuardian(address _guardian)` (external)

Changes the guardian. Only called by the DAO itself.




- `_guardian`: new guardian address



### `abdicate()` (external)

Abdicates as a guardian of the DAO.






### `setDelay(uint64 delay_)` (external)

Changes the proposal delay.




- `delay_`: delay



### `setMinQuorum(uint256 value)` (external)

Changes the proposal quorum.




- `value`: quorum



### `setProposalThreshold(uint256 value)` (external)

Changes the proposal token threshold.




- `value`: threshold



### `setVotingDuration(uint256 value)` (external)

Changes the proposal voting duration.




- `value`: voting duration, in blocks



### `setVotingDelay(uint256 value)` (external)

Changes the proposal voting delay.




- `value`: voting delay, in blocks



### `setGovernorThreshold(uint256 value)` (external)

Changes the governor threshold. Called by the owner.




- `value`: threshold value of plenny tokens



### `getActions(uint256 _proposalID) → address[] targets, uint256[] values, string[] signatures, bytes[] calldatas` (external)

Gets the proposal info.




- `_proposalID`: proposal id


**Returns**: targets: addresses of the smart contracts

**Returns**: values: values provided to the relevant functions

**Returns**: signatures: function signatures

**Returns**: calldatas: function data


### `getReceipt(uint256 _proposalID, address voter) → struct PlennyDaoStorage.Receipt` (external)

Gets the receipt of voting for a proposal.




- `_proposalID`: proposal id

- `voter`: voter address


**Returns**: Receipt: receipt info


### `minQuorumVoteCount(uint256 _blockNumber) → uint256 _minQuorum` (public)

Min vote quorum at the given block number.




- `_blockNumber`: block number


**Returns**: _minQuorum: The minimum quorum


### `minProposalVoteCount(uint256 _blockNumber) → uint256` (public)

Min proposal votes at the given block number.




- `_blockNumber`: block number


**Returns**: uint: votes min votes


### `state(uint256 _proposalID) → enum PlennyDaoStorage.ProposalState` (public)

State of the proposal.




- `_proposalID`: proposal id


**Returns**: ProposalState: The proposal state


### `proposalMaxOperations() → uint256` (public)

Maximum number of actions in a proposal.





**Returns**: uint: number of actions











### `NewDelay(uint256 newDelay)`

An event emitted when a new delay is set.



### `LogCall(bytes4 sig, address caller, bytes data)`

An event emitted when logging function calls.



### `ProposalCreated(uint256 id, address proposer, address[] targets, uint256[] values, string[] signatures, bytes[] calldatas, uint256 startBlock, uint256 endBlock, string description)`

An event emitted when a new proposal is created.



### `VoteCast(address voter, uint256 proposalId, bool support, uint256 votes)`

An event emitted when a vote has been cast on a proposal.



### `ProposalCanceled(uint256 id)`

An event emitted when a proposal has been canceled.



### `ProposalQueued(uint256 id, uint256 eta)`

An event emitted when a proposal has been queued in the Timelock.



### `ProposalExecuted(uint256 id)`

An event emitted when a proposal has been executed in the Timelock.



### `CancelTransaction(bytes32 txHash, address target, uint256 value, string signature, bytes data, uint256 eta)`

An event emitted when a proposal has been canceled.



### `ExecuteTransaction(bytes32 txHash, address target, uint256 value, string signature, bytes data, uint256 eta)`

An event emitted when a proposal has been executed.



### `QueueTransaction(bytes32 txHash, address target, uint256 value, string signature, bytes data, uint256 eta)`

An event emitted when a proposal has been queued.



### `NewGuardian(address guardian)`

An event emitted when a new guardian is set.



