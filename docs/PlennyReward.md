---
title: PlennyReward.sol Spec
id: PlennyReward
---

 PlennyReward

Stores token reserved for rewards given for locking Plenny into the DAO Governance module as well as for
        locking LP-token into the liquidity mining contract.




### `initialize(address _registry)` (external)

Initializes the smart contract instead of a constructor. Called once during deployment.




- `_registry`: Plenny contract registry



### `transfer(address to, uint256 amount) → bool` (external)

Transfers the reward to the given address.




- `to`: address

- `amount`: reward amount


**Returns**: bool: action





### `LogCall(bytes4 sig, address caller, bytes data)`

An event emitted when logging function calls.



