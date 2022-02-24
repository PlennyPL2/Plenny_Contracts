---
title: PlennyRePLENishmentV3.sol Spec
id: PlennyRePLENishmentV3
---

 Plenny rePLENishment version 3

This contract collects all the fees from the Dapp, mints new tokens for inflation, manages the rePLENishment
		of the treasury, and performs automatic buybacks over the DEX.




### `receive()` (external)

Receives payment






### `rePLENishmentJob()` (external)

Runs the re-distribution of the fees by sending all the fees directly to the Treasury HODL.






### `setBuyBackPercentagePl2(uint256 percentage)` (external)

Changes the buyback percentage PL2. Called by the owner.




- `percentage`: percentage for buyback of PL2



### `setLpBurningPercentage(uint256 percentage)` (external)

Changes the lp Burning Percentage. Called by the owner.




- `percentage`: percentage for burning the collected LP fees



### `setReplenishRewardPercentage(uint256 percentage)` (external)

Changes the rePLENishment Reward Percentage. Called by the owner.




- `percentage`: percentage for replenishment of the fees collected



### `setDailyInflationRewardPercentage(uint256 percentage)` (external)

Changes the daily inflation reward in percentage. Called by the owner.




- `percentage`: percentage for the daily inflation



### `setLpThresholdForBurning(uint256 amount)` (external)

Changes the lp threshold for burning. Called by the owner.




- `amount`: threshold amount of LP tokens for burning



### `setPlennyThresholdForBuyback(uint256 amount)` (external)

Changes the plenny Threshold for buyback. Called by the owner.




- `amount`: threshold amount of PL2 tokens for buyback



### `setMaintenanceBlockLimit(uint256 blocks)` (external)

Changes the rePLENishment Block Limit. Called by the owner.




- `blocks`: blocks between 2 consecutive rePLENishment jobs



### `setInflationAmountPerBlock(uint256 amount)` (external)

Changes the inflation amount per block. Called by the owner.




- `amount`: inflation amount of PL2 tokens per block




### `LogCall(bytes4 sig, address caller, bytes data)`

An event emitted when logging function calls.



### `LiquidityProvided(uint256 jobId, uint256 plennyAdded, uint256 ethAdded, uint256 liquidity, uint256 blockNumber)`

An event emitted when liquidity is provided over the DEX.



### `SoldPlennyForEth(uint256 jobId, uint256 plennySold, uint256 ethBought, uint256 blockNumber)`

An event emitted when PL2 are sold for ETH over the DEX.



### `LiquidityRemoved(uint256 jobId, uint256 plennyReceived, uint256 ethReceived, uint256 liquidityAmount, uint256 blockNumber)`

An event emitted when liquidity is removed from the DEX.



### `SoldEthForPlenny(uint256 jobId, uint256 ethSold, uint256 plennyBought, uint256 blockNumber)`

An event that is emitted when ETH is sold for Pl2 over the DEX.



### `BuybackAndLpProvided(uint256 jobId, uint256 plennySpent, uint256 ethSpent, uint256 liquidityProvided, uint256 blockNumber)`

An event that is emitted when the buyback and lp providing mechanism is completed.



### `RemoveLpAndBuyBackPlenny(uint256 jobId, uint256 lpBurned, uint256 plennyReceived, uint256 blockNumber)`

An event emitted when the remove lp and buyback mechanism is completed.



