---
title: PlennyLockingPoSLT.sol Spec
id: PlennyLockingPoSLT
---

PlennyLockingPoSLT
(PlennyStaking in BETA release.)

Manages locking of oracle validator thresholds for Proof-of-Stake (PoS) and down payments by Liquidity Takers in the capacity market.
        Attn: The storage contract refers to locking token (not staking).




### `lockPlenny(uint256 amount)` (external)

Locks PL2 for the purpose of the Lightning marketplace, delegation and validation.




- `amount`: amount to lock



### `unlockPlenny(uint256 amount) → uint256` (external)

Releases PL2 from marketplace. If the user is an oracle, a minimum oracle amount needs to be kept locked.
        A fee is charged on unlocking.




- `amount`: amount to release


**Returns**: uint256: amount that was unstacked.


### `increasePlennyBalance(address userAddress, uint256 amount, address from)` (external)

Whenever a Plenny locking balance is increased.




- `userAddress`: address of the user

- `amount`: increasing amount



### `decreasePlennyBalance(address userAddress, uint256 amount, address to)` (external)

Whenever a Plenny locking balance is decreased.




- `userAddress`: address of the user

- `amount`: decreased amount

- `to`: sending to



### `setWithdrawFee(uint256 newWithdrawFee)` (external)

Changes the fee for withdrawing. Called by the owner.




- `newWithdrawFee`: new withdrawal fee in percentage



### `plennyOwnersCount() → uint256` (external)

Number of plenny owners.





**Returns**: uint256: count







### `LogCall(bytes4 sig, address caller, bytes data)`

An event emitted when logging function calls.



