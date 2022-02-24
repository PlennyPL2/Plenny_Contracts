---
title: PlennyBasePausableV2.sol Spec
id: PlennyBasePausableV2
---

 Base abstract pausable contract.

Used by all Plenny contracts, except PlennyERC20, to allow pausing of the contracts by addresses having PAUSER role.

   Abstract contract that any Plenny contract extends from for providing pausing features.

### `onlyPauser()`



   Checks if the sender has PAUSER role.


### `PAUSER_ROLE()`

### `addPauser(address account)` (external)

Assigns PAUSER role for the given address.


   Only a pauser can assign more PAUSER roles.


- `account`: Address to assign PAUSER role to



### `renouncePauser()` (external)

Renounces PAUSER role.


   The users renounce the PAUSER roles themselves.




### `pause()` (external)

Pauses the contract if not already paused.


   Only addresses with PAUSER role can pause the contract




### `unpause()` (external)

Unpauses the contract if already paused.


   Only addresses with PAUSER role can unpause






