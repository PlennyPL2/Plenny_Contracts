// SPDX-License-Identifier: MIT

pragma solidity >=0.6.0 <0.8.0;

import "./IBasePlennyERC20.sol";

interface IPlennyERC20V2 is IBasePlennyERC20 {

    function registerTokenOnL2(address l2CustomTokenAddress, uint256 maxSubmissionCost, uint256 maxGas, uint256 gasPriceBid,
        uint256 routerGasFee, uint256 gatewayGasFee) external payable returns (uint256, uint256);

}