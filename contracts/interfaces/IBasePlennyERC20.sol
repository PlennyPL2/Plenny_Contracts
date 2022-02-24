// SPDX-License-Identifier: MIT

pragma solidity >=0.6.0 <0.8.0;

import "@openzeppelin/contracts-upgradeable/token/ERC20/IERC20Upgradeable.sol";

interface IBasePlennyERC20 is IERC20Upgradeable {

    function initialize(address owner, bytes memory _data) external;

    function mint(address addr, uint256 amount) external;

}