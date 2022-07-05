---
title: PlennyOceanV2.sol Spec
id: PlennyOceanV2
---

 PlennyOcean

Managing the capacity market. This smart contract refers to the non-custodial peer-to-peer marketplace for payment
        channels to license liquidity of lightning nodes (i.e. inbound capacity). PlennyOcean enables lightning nodes
        to publish offers in PL2/sat, and select counterparties. The Liquidity Maker is responsible for opening the
        payment channel, and for providing the channel capacity to the Liquidity Taker over the Lightning Network,
        and for giving the information on the smart contract that contains the payment channel data (from the PlennyCoordinator).


### `onlyCoordinator()`



   Only PlennyCoordinator contract checks.



### `addMaker(string name, string serviceUrl, uint256 nodeIndex, uint256 providingAmount, uint256 priceInPl2)` (external)

Adds/registers a new maker in the ocean. A maker needs to have a previously verified Lightning node
        (in the PlennyCoordinator).




- `name`: Maker's name

- `serviceUrl`: url of the Lightning oracle service

- `nodeIndex`: index/id of the verified Lightning node

- `providingAmount`: the amount of liquidity provided

- `priceInPl2`: price PL2/sat



### `removeMaker()` (external)

Removes an existing maker from the ocean.






### `requestLightningCapacity(string nodeUrl, uint256 capacity, address payable makerAddress, address payable owner, uint256 nonce, bytes signature)` (external)

Called by the maker whenever there is a new request for channel capacity signed by the taker.




- `nodeUrl`: Lightning node to provide liquidity for

- `capacity`: channel capacity in satoshi

- `makerAddress`: maker's address

- `owner`: taker's address

- `nonce`: nonce

- `signature`: this request signature as signed by the taker



### `cancelRequestLightningCapacity(uint256 capacityRequestIndex)` (external)

Cancels previously requested capacity. Can be cancelled by the taker when it is expired.
        The request is considered expired if not processed within canceling request period
        (measured in blocks) of its creation.




- `capacityRequestIndex`: id of the request



### `openChannelRequested(string _channelPoint, uint256 capacityRequestIndex)` (external)

Submits a claim/info that a certain channel has been opened as a result of a liquidity request.
        Delegates to PlennyCoordinator for the channel verification.




- `_channelPoint`: channel info

- `capacityRequestIndex`: request id



### `processCapacityRequest(uint256 capacityRequestIndex)` (external)

Called by the PlennyCoordinator whenever the channel opened as a result of a liquidity request becomes verified.
        There can be only one channel opened per liquidity request.




- `capacityRequestIndex`: capacity request



### `collectCapacityRequestReward(uint256 capacityRequestIndex, uint256 channelId, uint256 confirmedDate)` (external)

Collects reward for a channel opened as a result of a liquidity request.




- `capacityRequestIndex`: liquidity request id

- `channelId`: channel id

- `confirmedDate`: date of opening



### `closeCapacityRequest(uint256 capacityRequestIndex, uint256 channelId, uint256 confirmedDate)` (external)

Closes a given capacity request whenever its channel has been closed.




- `capacityRequestIndex`: liquidity request id

- `channelId`: channel id

- `confirmedDate`: date of opening



### `setCancelingRequestPeriod(uint256 amount)` (external)

Changes the cancelling request period in blocks. Called by the owner.




- `amount`: period in blocks



### `setTakerFee(uint256 value)` (external)

Changes the taker Fee. Called by the owner




- `value`: fee



### `setMakerCapacityOneTimeReward(uint256 value)` (external)

Changes the Maker Fixed Royalty. Called by the owner




- `value`: fee



### `setMakerRewardFee(uint256 value)` (external)

Changes the Maker Reward Fee. Called by the owner




- `value`: fee



### `getCapacityRequestPerMaker(address addr) → uint256[]` (external)

Gets the ids of liquidity requests for the given maker address.




- `addr`: maker's address


**Returns**: array: of ids


### `getCapacityRequestPerTaker(address addr) → uint256[]` (external)

Gets the ids of liquidity requests for the given taker address.




- `addr`: taker's address


**Returns**: array: of ids








### `CapacityRequestPending(address by, uint256 capacity, address makerAddress, uint256 capacityRequestIndex, uint256 paid)`

An event emitted when the capacity request is submitted.



### `LogCall(bytes4 sig, address caller, bytes data)`

An event emitted when logging function calls.



### `MakerAdded(address account, bool created)`

An event emitted when Liquidity Maker is added.



### `MakerRemoved(address account)`

An event emitted when Liquidity Maker is removed.



