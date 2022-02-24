---
title: PlennyOracleValidator.sol Spec
id: PlennyOracleValidator
---

 PlennyOracleValidator

Runs channel validations (for opening and closing) and contains the logic for reaching consensus among the
        oracle validators participating in the  Decentralized Oracle Network (DON).


### `_logs_()`



   log function call.

### `onlyValidators()`



   only oracle validator check.



### `initialize(address _registry)` (external)

Initializes the smart contract instead of a constructor. Called once during deploy.




- `_registry`: Plenny contract registry



### `execChannelOpening(uint256 channelIndex, uint256 _channelCapacitySat, uint256 channelId, string nodePublicKey, string node2PublicKey, bytes[] signatures)` (external)

Called whenever an oracle has gathered enough signatures from other oracle validators offline,
        containing the channel information on the Lightning Network.
        The sender oracle validator (i.e leader) claims the biggest reward for posting the data on-chain.
        Other off-chain validators also receive a smaller reward for their off-chain validation.


   All oracle validators are running the Plenny oracle service. When a new channel opening needs to be
        verified on the Lightning Network, the validators are competing with each other to obtain the data from
        the Lightning Network and get enough signatures for that data from other validators.
        Whoever validator gets enough signatures first is entitled to call this function for posting the data on-chain.


- `channelIndex`: index/id of the channel submission as registered in this contract.

- `_channelCapacitySat`: capacity of the channel expressed in satoshi.

- `channelId`: Id of the channel as registered on the lightning network.

- `nodePublicKey`: Public key of the first node in the channel.

- `node2PublicKey`: Public key of the second node in the channel.

- `signatures`: array of validators signatures gathered offline. They are verified against the channel data.



### `execCloseChannel(uint256 channelIndex, string closingTransactionId, bytes[] signatures)` (external)

Called whenever an oracle has gathered enough signatures from other oracle validators offline,
        containing the information of the channel closing on the Lightning Network.
        The sender oracle validator (i.e leader) claims the biggest reward for posting the data on-chain.
        Other off-chain validators also receive a smaller reward for their off-chain validation.


   All oracle validators are running the Plenny oracle service. When a channel is closed on the Lightning Network,
        the validators are competing with each other's to obtain the closing transaction data from the lightning Network
        and get enough signature for that data from other validators off-chain.
        Whoever validator gets enough signatures first is entitled to call this function for posting the data on-chain.


- `channelIndex`: channel index/id of an already opened channel

- `closingTransactionId`: bitcoin closing transaction id of the closing lightning channel

- `signatures`: signatures array of validators signatures gathered via validator's REST API. They are verified against the channel data.



### `setOracleRewardPercentage(uint256 value)` (external)

Changes the oracle reward percentage. Called by the contract owner.




- `value`: oracle validator reward



### `setOracleFixedRewardAmount(uint256 value)` (external)

Changes the oracle fixed reward amount. Called by the contract owner.




- `value`: oracle validator fixed reward



### `setLeaderRewardPercent(uint256 amount)` (external)

Changes the leader reward percentage. Called by the contract owner.




- `amount`: leader percentage



### `oracleOpenChannelConsensusLength(uint256 channelIndex) → uint256` (external)

Consensus length for the given channel (opening).




- `channelIndex`: channel id


**Returns**: uint256: how many validators has reached consensus for this channel


### `oracleCloseChannelConsensusLength(uint256 channelIndex) → uint256` (external)

Consensus length for the given channel (closing).




- `channelIndex`: channel id


**Returns**: uint256: how many validators has reached consensus for this channel


### `minQuorum() → uint256` (public)

Minimum quorum for reaching the oracle validator consensus.





**Returns**: uint256: consensus quorum




### `LogCall(bytes4 sig, address caller, bytes data)`

An event emitted when logging function calls.



### `ChannelOpeningCommit(address leader, uint256 channelIndex)`

An event emitted when channel opening info is committed.



### `ChannelOpeningVerify(address validator, uint256 channelIndex)`

An event emitted when channel opening is verified.



### `ChannelOpeningReveal(address leader, uint256 channelIndex)`

An event emitted when channel opening info is revealed and checked.



### `ChannelClosingCommit(address leader, uint256 channelIndex)`

An event emitted when channel closing info committed.



### `ChannelClosingVerify(address validator, uint256 channelIndex)`

An event emitted when channel closing is verified.



### `ChannelCloseReveal(address leader, uint256 channelIndex)`

An event emitted when channel closing info is revealed and checked.



