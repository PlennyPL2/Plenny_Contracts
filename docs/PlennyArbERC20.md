---
title: PlennyArbERC20.sol Spec
id: PlennyArbERC20
---

 PlennyArbERC20

PlennyERC20 token on Arbitrum ORU. Representation of the PlennyERC20 token on L2 mapped to L1 token.


### `onlyBridge()`



   Modifier for the bridge address


### `bridgeAddress()`
### `l1Address()`

### `initialize(address owner, bytes _data)` (external)

Method used for initializing the contract. Can be called only once.


   Used in combination with the beacon proxy contract to initialize the token on Arbitrum L2.


- `owner`: Owner of this contract

- `_data`: Parsable init data



### `mint(address addr, uint256 amount)` (external)

Mints new tokens


   Allows only whitelisted users to mint new tokens.


- `addr`: Address to mint the token to

- `amount`: Amount of tokens to mint



### `bridgeMint(address account, uint256 amount)` (external)

Used for bridging the tokens from L1 to Arbitrum.


   Allows only the bridge address to mint new token.


- `account`: Address to mint the token to

- `amount`: Amount of tokens to mint



### `bridgeBurn(address account, uint256 amount)` (external)

Used for bridging the tokens from Arbitrum to L1.


   Burns the tokens on Arbitrum in order to mint them on L1 later on.


- `account`: Address to burn the token from

- `amount`: Amount of tokens to burn




