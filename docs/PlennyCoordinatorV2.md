---
title: PlennyCoordinatorV2.sol Spec
id: PlennyCoordinatorV2
---

 PlennyCoordinator

Coordinator contract between the Lightning Network and the Ethereum blockchain. Coordination and storing of
        the data from the LN on-chain. Allows the users to provide info about their lightning nodes/channels,
        and manages the channel rewards (i.e. NCCR) due for some actions.




### `addLightningNode(string nodePublicKey, address validatorAddress) → uint256` (external)

Allows the user to add provisional information about their own lightning node.


   The lightning node is considered as "pending" in the system until the user verifies it by opening a channel
        with a given capacity on the lightning network and submitting info (channel point) about that channel
        in this contract.


- `nodePublicKey`: Public key of the lightning node.

- `validatorAddress`: An oracle validator address is responsible for validating the lightning node.


**Returns**: uint256: The capacity of the channel that the user needs to open on the lightning network.


### `openChannel(string _channelPoint, address payable _oracleAddress, bool capacityRequest)` (external)

Submits a claim/info that a certain channel has been opened on the lightning network.


   The information can be submitted either by the end-user directly or by the maker that has opened
        the channel via the lightning ocean/marketplace.


- `_channelPoint`: Channel point of the lightning channel.

- `_oracleAddress`: an address of the lightning oracle that is the counter-party of the lightning channel.

- `capacityRequest`: if this channel is opened via the lightning ocean/marketplace.



### `verifyDefaultNode(string publicKey, address payable account) → uint256` (external)

Instant verification of the initial(ZERO) lightning node. Managed by the contract owner.




- `publicKey`: The public key of the initial lightning node.

- `account`: address of the initial lightning oracle.


**Returns**: uint256: node index


### `confirmChannelOpening(uint256 channelIndex, uint256 _channelCapacitySat, uint256 channelId, string node1PublicKey, string node2PublicKey)` (external)

Confirms that a lightning channel with the provided information was indeed opened on the lightning network.
        Once a channel is confirmed, the submitter of the channel info becomes eligible for collecting rewards as long
        as the channel is kept open on the lightning network. In case this channel is opened as a result of
        verification of a lightning node, the node gets also marked as "verified".


   This is only called by the validation mechanism once the validators have reached the consensus on the
        information provided below.


- `channelIndex`: index/id of the channel submission as registered in this contract.

- `_channelCapacitySat`: The capacity of the channel expressed in satoshi.

- `channelId`: Id of the channel as registered on the lightning network.

- `node1PublicKey`: The public key of the first node in the channel.

- `node2PublicKey`: The public key of the second node in the channel.



### `closeChannel(uint256 channelIndex)` (external)

Marks that a previously opened channel on the lightning network has been closed.


   This is only called by the validation mechanism once the validators have reached the consensus that
        the channel has been indeed closed on the lightning network.


- `channelIndex`: index/id of the channel submission as registered in this contract.



### `claimAllChannelsReward(uint256[] channelIndex)` (external)

Batch collect of all pending rewards for all the channels opened by the sender.




- `channelIndex`: indexes/ids of the channel submissions as registered in this contract.



### `collectChannelReward(uint256 channelIndex)` (external)

Collects pending rewards only for the provided channel opened by the sender.




- `channelIndex`: index/id of the channel submission as registered in this contract.



### `getChannelsCount() → uint256` (external)

Gets the number of opened channels as registered in this contract.





**Returns**: uint256: opened channels count


### `getNodesPerAddress(address addr) → uint256[]` (external)

Gets all the submitted nodes for the given address.




- `addr`: Address to check for


**Returns**: array: indexes of all the nodes that belong to the address


### `getChannelsPerAddress(address addr) → uint256[]` (external)

Gets all the submitted channels for the given address.




- `addr`: Address to check for


**Returns**: array: indexes of all the channels that belong to the address


### `_calculatePotentialReward(uint256 capacity, bool marketplace) → uint256 potentialReward` (public)

Calculates the potential reward for the given channel capacity. If the channel is opened through the
        ocean/marketplace the reward is increased.




- `capacity`: capacity of the channel

- `marketplace`: if the reward comes as a result of marketplace action.


**Returns**: potentialReward: channel reward







### `setMaximumChannelCapacity(uint256 newMaximum)` (external)

Set the maximum channel capacity (in satoshi).


   Only the owner of the contract can set this.


- `newMaximum`: maximum channel capacity (in satoshi)



### `setMinimumChannelCapacity(uint256 newMinimum)` (external)

Set the minimum channel capacity (in satoshi).


   Only the owner of the contract can set this.


- `newMinimum`: channel threshold (in satoshi)



### `setChannelRewardThreshold(uint256 threshold)` (external)

Set the channel threshold (in satoshi) for which a reward is given.


   Only the owner of the contract can set this.


- `threshold`: minimum channel capacity (in satoshi)



### `setRewardBaseline(uint256 value)` (external)

Changes the reward baseline. Managed by the contract owner.




- `value`: reward baseline




### `LightningNodePending(address by, uint256 verificationCapacity, string publicKey, address validatorAddress, uint256 nodeIndex)`

An event emitted when a lightning node is added, but not yet verified.



### `LightningNodeVerified(address to, string publicKey, uint256 nodeIndex)`

An event emitted when a lightning node is verified.



### `LightningChannelOpeningPending(address by, string channelPoint, uint256 channelIndex)`

An event emitted when a lightning channel is added, but not yet confirmed.



### `LightningChannelOpeningConfirmed(address to, uint256 amount, string node1, string node2, uint256 channelIndex, uint256 blockNumber)`

An event emitted when a lightning channel is confirmed.



### `LightningChannelClosed(uint256 channelIndex)`

An event emitted when a lightning channel is closed.



### `RewardReleased(address to, uint256 amount)`

An event emitted when a reward is collected.



### `LogCall(bytes4 sig, address caller, bytes data)`

An event emitted when logging function calls.



