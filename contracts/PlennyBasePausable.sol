// SPDX-License-Identifier: MIT

pragma solidity >=0.6.0 <0.8.0;

import "@openzeppelin/contracts-upgradeable/utils/ContextUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/access/AccessControlUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/utils/PausableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/utils/ReentrancyGuardUpgradeable.sol";
import "./PlennyBase.sol";

/// @title  Base abstract pausable contract
/// @notice Used by the PlennyERC20 contract only to allow pausing of the tokens actions by addresses having PAUSER role.
abstract contract PlennyBasePausable is PlennyBaseUpgradable, PausableUpgradeable {

    /// @notice PAUSER role constant
    bytes32 public constant PAUSER_ROLE = keccak256("PAUSER_ROLE");

    /// @notice Initializes the contract along with the PAUSER role
    function __plennyBasePausableInit() internal initializer {
        PlennyBaseUpgradable.__plennyBaseInit();
        PausableUpgradeable.__Pausable_init();
        _setupRole(PAUSER_ROLE, _msgSender());
    }

    /// @dev    Check if the sender has PAUSER role.
    modifier onlyPauser() {
        require(hasRole(PAUSER_ROLE, _msgSender()), "ERR_NOT_PAUSER");
        _;
    }

    /// @notice Assigns PAUSER role for the given address.
    /// @dev    Only a pauser can assign more PAUSER roles.
    /// @param  account Address to assign PAUSER role to
    function addPauser(address account) external onlyPauser {
        _setupRole(PAUSER_ROLE, account);
    }

    /// @notice Renounces PAUSER role.
    /// @dev    The users renounce the PAUSER roles themselves.
    function renouncePauser() external {
        revokeRole(PAUSER_ROLE, _msgSender());
    }

    /// @notice Pauses the contract if not already paused.
    /// @dev    Only addresses with PAUSER role can pause the contract.
    function pause() external onlyPauser whenNotPaused {
        _pause();
    }

    /// @notice Unpauses the contract if already paused.
    /// @dev    Only addresses with PAUSER role can unpause.
    function unpause() external onlyPauser whenPaused {
        _unpause();
    }
}
