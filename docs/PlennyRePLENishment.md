---
title: PlennyRePLENishment.sol Spec
id: PlennyRePLENishment
---

 PlennyRePLENishment

Collects all the fees from the Dapp and manages the rePLENishment of the treasury.
        All the fees are distributed to PlennyTreasury.




### `initialize(address _registry)` (external)

Initializes the contract instead of constructor. Called once during contract deployment.




- `_registry`: plenny contract registry



### `rePLENishmentJob() → bool` (external)

Runs the rePLENishment of the fees by sending all the fees directly to the Treasury HODL.





**Returns**: bool: true if the job has distributed the fees


### `receive()` (external)

Logs the receiving of funds







### `LogCall(bytes4 sig, address caller, bytes data)`

An event emitted when logging function calls.



### `ReplenishedTreasury(uint256 rewardAmount, uint256 treasuryAmount)`

An event emitted when the Treasury rePLENishment triggered.



