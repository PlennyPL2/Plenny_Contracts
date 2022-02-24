---
title: PlennyBaseERC20.sol Spec
id: PlennyBaseERC20
---

 Base contract for the Plenny-token (ERC20) on L1 and L2.

Contains common logic that are applied for both Plenny contracts on L1 and L2.

   Abstract contract that is extended by PlennyERC20 for L1 and PlennyArbERC20 for L2.


### `mintWhitelist()`
### `mintWhitelistLength()`
### `whitelistingActive()`
### `MINTER_ROLE()`


### `burn(uint256 amount)` (external)

Burns a given amount from the sender's balance.


   Called when the contract is not paused.


- `amount`: Amount of tokens to burn



### `addMinter(address _address)` (external)

Adds address, which is allowed to initiate minting of new tokens.


   Called by the contract owner, when the contract is not paused.


- `_address`: Address of minters to add



### `addMintAddress(address _address)` (external)

Adds address, which is allowed to mint new tokens to the whitelist.


   Fails if address is already whitelisted. Called by the owner, when not paused.


- `_address`: Address to be whitelisted



### `removeMintAddress(address _address)` (external)

Removes address from the whitelist.


   Fails if address is NOT whitelisted. Called by the owner, when not paused.


- `_address`: Address to remove from whitelisted addresses



### `isMintAddressWhitelisted(address _address) → bool` (public)

Checks if a given address is whitelisted.




- `_address`: Address to check for whitelisting


**Returns**: bool: true if address is whitelisted, false otherwise


### `toggleWhitelisting(bool boolean)` (external)

Enable the whitelisting option. If whitelisting is enabled,
        every mint operation checks for whitelisted address


   Called by the owner, when not paused


- `boolean`: enabled/disabled






