// SPDX-License-Identifier: MIT

pragma solidity >=0.6.0 <0.8.0;

interface IArbRouter {

    function setGateway(
        address _gateway,
        uint256 _maxGas,
        uint256 _gasPriceBid,
        uint256 _maxSubmissionCost
    ) external payable returns (uint256);
}