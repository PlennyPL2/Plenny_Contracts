---
title: PlennyTreasury.sol Spec
id: PlennyTreasury
---

 PlennyTreasury

Stores Plenny reserved for rewards given within the capacity market and for oracle validations.


### `_logs_()`



   logs the function calls.

### `onlySupported(address tokenToTransfer)`



   If a token is supported in the treasury.



### `initialize(address _registry)` (external)

Initializes the smart contract instead of an constructor. Called once during deploy.




- `_registry`: Plenny contract registry



### `transfer(address to, address tokenToTransfer, uint256 value)` (external)

Transfers the amount of the given token to the given address. Called by the owner.




- `to`: address

- `tokenToTransfer`: token address

- `value`: reward amount



### `approve(address addr, uint256 amount) → bool` (external)

Approves a reward for the given address.




- `addr`: address to send reward to

- `amount`: reward amount


**Returns**: bool: true/false


### `isSupported(address tokenToTransfer) → bool` (public)

If token is supported by the treasury.




- `tokenToTransfer`: token address


**Returns**: bool: true/false




### `LogCall(bytes4 sig, address caller, bytes data)`

An event emitted when logging function calls.



