---
title: PlennyERC20.sol Spec
id: PlennyERC20
---

PlennyERC20 representation on mainnet L1.


Plenny (PL2) is an ERC20 utility token.


### `arbGateway()`
### `arbRouter()`

### `initialize(address owner, bytes _data)` (external)

Initializes the token instead of a constructor. Called once during contract creation.




- `owner`: Owner of this contract

- `_data`: Parsable init data



### `mint(address addr, uint256 amount)` (external)

Mints additional token amount to the given address. If whitelisting is enabled,
        the provided address needs to be whitelisted.




- `addr`: address to mint to

- `amount`: amount to mint



### `registerTokenOnL2(address l2CustomTokenAddress, uint256 maxSubmissionCost, uint256 maxGas, uint256 gasPriceBid)` (external)

Registers this token contract to L2, thus creating a bridge between this token contract and
        the PlennyArbERC20 contract that is deployed on Arbitrum L2.




- `l2CustomTokenAddress`: address of the PlennyArbERC20 on L2.

- `maxSubmissionCost`: arbitrum submission cost

- `maxGas`: arbitrum gas limit

- `gasPriceBid`: arbitrum gas price



### `setArbGateway(address _gateway)` (external)

Changes the Arbitrum Gateway address. Managed by the owner.




- `_gateway`: arbitrum gateway



### `setArbRouter(address _router)` (external)

Changes the Arbitrum Router address. Managed by the owner.




- `_router`: arbitrum router




