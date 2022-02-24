// SPDX-License-Identifier: MIT

pragma solidity >=0.6.0 <0.8.0;

import "./IPlennyERC20.sol";

interface IArbPlennyERC20 is IBasePlennyERC20 {

    /**
     * @notice should increase token supply by amount, and should (probably) only be callable by the L1 bridge.
     */
    function bridgeMint(address account, uint256 amount) external;

    /**
     * @notice should decrease token supply by amount, and should (probably) only be callable by the L1 bridge.
     */
    function bridgeBurn(address account, uint256 amount) external;

    /**
     * @return address of layer 1 token
     */
    function l1Address() external view returns (address);

}