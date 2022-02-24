---
title: PlennyDistribution.sol Spec
id: PlennyDistribution
---

 PlennyDistribution

Contains the logic for the initial token generation and distribution.

   Uses an upgradable beacon pattern for managing the upgradability of the PlennyERC20 token


### `plennyToken()`

### `constructor(address implementation_)` (public)

Constructs the smart contract by providing the beacon address.




- `implementation_`: proxy implementation



### `createToken(bytes32 userSalt)` (external)

Creates the PlennyERC20 token contract using beacon proxy. Called only once by the owner.




- `userSalt`: random salt



### `tokenInit(bytes _data)` (external)

Initializes the data of the plenny token. Called only once by the owner.




- `_data`: token data



### `tokenMint(uint256 _plennyTotalSupply)` (external)

Mints the initial token supply to the sender's address. Called only once by the owner.




- `_plennyTotalSupply`: initial token supply



### `getPlennyTokenAddress() → address` (external)

Gets the plenny token address, created by this contact.





**Returns**: address: plenny token address


### `plennyTotalSupply() → uint256` (public)

Gets the plenny total supply.





**Returns**: uint256: token supply



### `PlennyERC20Deployed(address token)`

An event emitted when the Plenny token is created



