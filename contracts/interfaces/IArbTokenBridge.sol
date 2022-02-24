// SPDX-License-Identifier: MIT

pragma solidity >=0.6.0 <0.8.0;

interface IArbTokenBridge {

    function withdraw(address l1Address, address destination, uint256 amount) external;

    function l1ToL2Token(address l1Address) external view returns (address);

    function calculateL2TokenAddress(address l1ERC20) external view returns (address);
}