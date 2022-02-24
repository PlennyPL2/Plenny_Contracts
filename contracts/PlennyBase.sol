// SPDX-License-Identifier: MIT

pragma solidity >=0.6.0 <0.8.0;

import "@openzeppelin/contracts-upgradeable/utils/ContextUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/access/AccessControlUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/utils/PausableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/utils/ReentrancyGuardUpgradeable.sol";

/// @title  PlennyBase contract.
/// @notice Used as a base extendable contract for PlennyERC20.
/// @dev    Abstract contract which all other contracts extend from.
abstract contract PlennyBaseUpgradable is AccessControlUpgradeable, ReentrancyGuardUpgradeable, OwnableUpgradeable {

    /// @notice Initialize the Plenny contact. Can be called only once
    /// @dev    Configures common features like owners, roles
    function __plennyBaseInit() internal initializer {
        AccessControlUpgradeable.__AccessControl_init();
        OwnableUpgradeable.__Ownable_init();
        ReentrancyGuardUpgradeable.__ReentrancyGuard_init();
        _setupRole(DEFAULT_ADMIN_ROLE, _msgSender());
    }
}
