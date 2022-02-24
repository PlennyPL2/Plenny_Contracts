---
title: PlennyStaking.sol Spec
id: PlennyStaking
---

 PlennyStaking

Manages staking of PL2 for the capacity market, delegation and for oracle validators.




### `initialize(address _registry)` (external)

Initializes the smart contract instead of a constructor. Called once during deploy.




- `_registry`: Plenny contract registry



### `stakePlenny(uint256 amount)` (external)

Stakes PL2 for the purpose of the Lightning marketplace, delegation and validation.




- `amount`: amount to stake



### `unstakePlenny(uint256 amount) → uint256` (external)

Unstakes PL2 from marketplace. If the user is an oracle, a minimum oracle amount needs to be kept staked.
        A fee is charged on unstaking.




- `amount`: amount to unstake


**Returns**: uint256: amount that was unstacked.


### `increasePlennyBalance(address userAddress, uint256 amount, address from)` (external)

Whenever a Plenny staking balance is increased.




- `userAddress`: address of the user

- `amount`: increasing amount



### `decreasePlennyBalance(address userAddress, uint256 amount, address to)` (external)

Whenever a Plenny staking balance is decreased.




- `userAddress`: address of the user

- `amount`: decreased amount

- `to`: sending to



### `setWithdrawFee(uint256 newWithdrawFee)` (external)

Changes the fee for withdrawing. Called by the owner.




- `newWithdrawFee`: new withdrawal fee in percentage



### `plennyOwnersCount() → uint256` (external)

Number of plenny stakers.





**Returns**: uint256: count







### `LogCall(bytes4 sig, address caller, bytes data)`

An event emitted when logging function calls.



