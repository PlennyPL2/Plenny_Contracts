// SPDX-License-Identifier: MIT

pragma solidity >=0.6.0 <0.8.0;

interface IArbGateway {

    function registerTokenToL2(address l2CustomTokenAddress, uint256 maxGas, uint256 gasPriceBid, uint256 maxSubmissionCost) external payable returns (uint256);
}