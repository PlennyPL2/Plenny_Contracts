---
title: PlennyLiqStaking.sol Spec
id: PlennyLiqStaking
---

PlennyLiqStaking
(PlennyLiqMining in BETA release.)

This liquidity staking contract allows LPs (a.k.a. “Plenny Whaler”) to stake LP-token (i.e. SLP-PL2)
        from the liquidity mining contract on the Sushi V2 DEX using Arbitrum One (Ethereum L2) for “Fish Farming”
        on the Dapp and earn periodic rewards (i.e. PL2).
        Attn: The storage contract refers to liquidity staking ("Fish Farming") on the Dapp (based on Liquidity Mining via Sushi V2 Arbitrum).
contract




### `lockLP(uint256 amount, uint256 period)` (external)

ice Locks LP token in this contract for the given period.




- `amount`: lp amount to lock

- `period`: period, in weeks
    fun



### `relockLP(uint256 index, uint256 period)` (external)

ice Relocks the LP tokens once the locking period has expired.




- `index`: id of the previously locked record

- `period`: the new locking period, in weeks
    fun



### `withdrawLP(uint256 index)` (external)

ice Withdraws the LP tokens, once the locking period has expired.




- `index`: id of the locking record
    fun



### `collectReward()` (external)

ice Collects plenny reward for the locked LP tokens
    fun






### `setLiquidityMiningFee(uint256 newLiquidityMiningFee)` (external)

ice Changes the liquidity Mining Fee. Managed by the contract owner.




- `newLiquidityMiningFee`: mining fee. Multiplied by 10000
    fun



### `setFishingFee(uint256 newFishingFee)` (external)

ice Changes the fishing Fee. Managed by the contract owner




- `newFishingFee`: fishing(exit) fee. Multiplied by 10000
    fun



### `setNextDistributionSeconds(uint256 value)` (external)

ice Changes the next Distribution in seconds. Managed by the contract owner




- `value`: number of blocks.
    fun



### `setMaxPeriodWeek(uint256 value)` (external)

ice Changes the max Period in week. Managed by the contract owner




- `value`: max locking period, in blocks
    fun



### `setAverageBlockCountPerWeek(uint256 count)` (external)

ice Changes average block counts per week. Managed by the contract owner




- `count`: blocks per week
    fun



### `setLiqMiningReward(uint256 value)` (external)

ice Percentage reward for liquidity mining. Managed by the contract owner.




- `value`: multiplied by 100
    fun



### `lockedBalanceCount() → uint256` (external)

ice Number of total locked records.





**Returns**: uint256: number of records
    fun


### `getPotentialRewardLiqMining() → uint256` (external)

ice Shows potential reward for the given user.





**Returns**: uint256: token amount
    fun


### `getBalanceIndexesPerAddressCount(address addr) → uint256` (external)

ice Gets number of locked records per address.




- `addr`: address to check


**Returns**: uint256: number
    fun


### `getBalanceIndexesPerAddress(address addr) → uint256[]` (external)

ice Gets locked records per address.




- `addr`: address to check


**Returns**: arrays: of indexes
    fun


### `getUniswapRate() → uint256 rate` (external)

ice Gets the LP token rate.







### `calculateReward(uint256 weight) → uint256` (public)

ice Calculates the reward of the user based on the user's participation (weight) in the LP locking.




- `weight`: participation in the LP mining


**Returns**: uint256: plenny reward amount
    fun






### `LogCall(bytes4 sig, address caller, bytes data)`

vent emitted when logging function calls
    eve



