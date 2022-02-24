---
title: PlennyBasePausable.sol Spec
id: PlennyBasePausable
---

 Base abstract pausable contract

Used by the PlennyERC20 contract only to allow pausing of the tokens actions by addresses having PAUSER role.


### `onlyPauser()`



   Check if the sender has PAUSER role.


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


   Only addresses with PAUSER role can pause the contract.




### `unpause()` (external)

Unpauses the contract if already paused.


   Only addresses with PAUSER role can unpause.





