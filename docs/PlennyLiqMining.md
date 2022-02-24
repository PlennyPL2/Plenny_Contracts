---
title: PlennyLiqMining.sol Spec
id: PlennyLiqMining
---

 PlennyLiqMining

Staking for liquidity mining integrated with the DEX, allows users to stake LP-token and earn periodic rewards.




### `initialize(address _registry)` (external)

Initializes the contract instead of the constructor. Called once during contract deployment.




- `_registry`: plenny contract registry



### `lockLP(uint256 amount, uint256 period)` (external)

Locks LP token in this contract for the given period.




- `amount`: lp amount to lock

- `period`: period, in weeks



### `relockLP(uint256 index, uint256 period)` (external)

Relocks the LP tokens once the locking period has expired.




- `index`: id of the previously locked record

- `period`: the new locking period, in weeks



### `withdrawLP(uint256 index)` (external)

Withdraws the LP tokens, once the locking period has expired.




- `index`: id of the locking record



### `collectReward()` (external)

Collects plenny reward for the locked LP tokens






### `setLiquidityMiningFee(uint256 newLiquidityMiningFee)` (external)

Changes the liquidity Mining Fee. Managed by the contract owner.




- `newLiquidityMiningFee`: mining fee. Multiplied by 10000



### `setFishingFee(uint256 newFishingFee)` (external)

Changes the fishing Fee. Managed by the contract owner




- `newFishingFee`: fishing(exit) fee. Multiplied by 10000



### `setNextDistributionSeconds(uint256 value)` (external)

Changes the next Distribution in seconds. Managed by the contract owner




- `value`: number of blocks.



### `setMaxPeriodWeek(uint256 value)` (external)

Changes the max Period in week. Managed by the contract owner




- `value`: max locking period, in blocks



### `setAverageBlockCountPerWeek(uint256 count)` (external)

Changes average block counts per week. Managed by the contract owner




- `count`: blocks per week



### `setLiqMiningReward(uint256 value)` (external)

Percentage reward for liquidity mining. Managed by the contract owner.




- `value`: multiplied by 100



### `lockedBalanceCount() → uint256` (external)

Number of total locked records.





**Returns**: uint256: number of records


### `getPotentialRewardLiqMining() → uint256` (external)

Shows potential reward for the given user.





**Returns**: uint256: token amount


### `getBalanceIndexesPerAddressCount(address addr) → uint256` (external)

Gets number of locked records per address.




- `addr`: address to check


**Returns**: uint256: number


### `getBalanceIndexesPerAddress(address addr) → uint256[]` (external)

Gets locked records per address.




- `addr`: address to check


**Returns**: arrays: of indexes


### `getUniswapRate() → uint256 rate` (external)

Gets the LP token rate.







### `calculateReward(uint256 weight) → uint256` (public)

Calculates the reward of the user based on the user's participation (weight) in the LP locking.




- `weight`: participation in the LP mining


**Returns**: uint256: plenny reward amount






### `LogCall(bytes4 sig, address caller, bytes data)`

An event emitted when logging function calls



