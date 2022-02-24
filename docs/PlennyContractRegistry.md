---
title: PlennyContractRegistry.sol Spec
id: PlennyContractRegistry
---

 PlennyContractRegistry

Contract address registry for all Plenny-related contract addresses.

   Addresses are registered as a mapping name --> address.


### `registry()`

### `initialize()` (public)

Initializes the contract instead of constructor.


   Can be called only once during contract deployment.




### `importAddresses(bytes32[] _names, address[] _destinations)` (external)

Batch register of pairs (name, address) in the contract registry.


   Called by the owner. The names and addresses must be the same length.


- `_names`: Array of names

- `_destinations`: Array of addresses for the contracts



### `getAddress(bytes32 _bytes) → address` (external)

Gets a contract address by a given name.




- `_bytes`: name in bytes


**Returns**: address: contract address, or address(0) if not found


### `plennyTokenContract() → contract IPlennyERC20` (external)

Gets the interface of the Plenny token contract.





**Returns**: Plenny: token


### `factoryContract() → contract IPlennyDappFactory` (external)

Gets the interface of the Plenny factory contract.





**Returns**: Plenny: factory


### `oceanContract() → contract IPlennyOcean` (external)

Gets the interface of Plenny Ocean contract.





**Returns**: Plenny: Ocean


### `lpContract() → contract IUniswapV2Pair` (external)

Gets the interface of UniswapV2 liquidity pair corresponding to a Plenny-WETH pool.





**Returns**: Uniswap: pair


### `uniswapRouterV2() → contract IUniswapV2Router02` (external)

Gets the interface of the UniswapV2 Router contract.





**Returns**: Uniswap: router


### `treasuryContract() → contract IPlennyTreasury` (external)

Gets the interface of the Plenny Treasury contract.





**Returns**: Plenny: treasury


### `stakingContract() → contract IPlennyStaking` (external)

Gets the interface of the Plenny staking contract.





**Returns**: Plenny: staking


### `coordinatorContract() → contract IPlennyCoordinator` (external)

Gets the interface of the Plenny coordinator contract.





**Returns**: Plenny: coordinator


### `validatorElectionContract() → contract IPlennyValidatorElection` (external)

Gets the interface of the Plenny election contract.





**Returns**: Plenny: validator election


### `oracleValidatorContract() → contract IPlennyOracleValidator` (external)

Gets the interface of the Plenny oracle validation contract.





**Returns**: Plenny: oracle validator


### `wrappedETHContract() → contract IWETH` (external)

Gets the interface of the WETH.





**Returns**: Wrapped: ETH


### `rewardContract() → contract IPlennyReward` (external)

Gets the interface of the Plenny Reward contract.





**Returns**: Plenny: reward


### `liquidityMiningContract() → contract IPlennyLiqMining` (external)

Gets the interface of the Plenny Liquidity mining contract.





**Returns**: Plenny: liquidity mining


### `lockingContract() → contract IPlennyLocking` (external)

Gets the interface of the Plenny governance locking contract.





**Returns**: Plenny: governanace locking


### `requireAndGetAddress(bytes32 name) → address` (public)

Gets a contract address by a given name.




- `name`: name in bytes


**Returns**: address: contract address, fails if not found


### `getAddressByString(string _name) → address` (public)

Gets a contract address by a given name as string.




- `_name`: contract name


**Returns**: address: contract address, or address(0) if not found


### `stringToBytes32(string _string) → bytes32 result` (public)

Converts string to bytes32.




- `_string`: String to convert


**Returns**: result: bytes32



### `LogRegistered(address destination, bytes32 name)`

An event emitted when a contract is added in the registry



