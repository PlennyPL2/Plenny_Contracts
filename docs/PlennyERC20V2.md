---
title: PlennyERC20V2.sol Spec
id: PlennyERC20V2
---

PlennyERC20 representation on Ethereum Mainnet L1. Version 2 changes the registration of this token on Arbitrum L2.


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



### `registerTokenOnL2(address l2CustomTokenAddress, uint256 maxSubmissionCost, uint256 maxGas, uint256 gasPriceBid, uint256 routerGasFee, uint256 gatewayGasFee) → uint256, uint256` (external)

Registers this token contract to L2, thus creating a bridge between this token contract and
        the PlennyArbERC20 contract that is deployed on Arbitrum L2.


   This function has been changed in V2 to fix the issue of correct registration of the token
        on Arbitrum L2 by providing propagating the msg.value to the arbitrum gateway and router on L1.


- `l2CustomTokenAddress`: address of the PlennyArbERC20 on L2.

- `maxSubmissionCost`: arbitrum submission cost

- `maxGas`: arbitrum gas limit

- `gasPriceBid`: arbitrum gas price

- `routerGasFee`: gas propagated from msg.value to the arbitrum router on L1

- `gatewayGasFee`: gas propagated from msg.value to the arbitrum gateway on L1


**Returns**: uint256: router ticket id

**Returns**: uint256: gateway ticket id


### `setArbGateway(address _gateway)` (external)

Changes the Arbitrum Gateway address. Managed by the owner.




- `_gateway`: arbitrum gateway



### `setArbRouter(address _router)` (external)

Change the Arbitrum Router address. Managed by the owner.




- `_router`: arbitrum router




### `TokenRegisteredOnL2(uint256 routerSetTicketId, uint256 gatewayRegisterTicketId, address l1Token, address l2Token)`

An event emitted when the token is registered on L2.



