// SPDX-License-Identifier: MIT

pragma solidity >=0.6.0 <0.8.0;

import "@openzeppelin/contracts-upgradeable/token/ERC20/ERC20Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC20/ERC20CappedUpgradeable.sol";
import "./PlennyBasePausable.sol";

/// @title  Base contract for the Plenny-token (ERC20) on L1 and L2.
/// @notice Contains common logic that are applied for both Plenny contracts on L1 and L2.
/// @dev    Abstract contract that is extended by PlennyERC20 for L1 and PlennyArbERC20 for L2.
abstract contract PlennyBaseERC20 is ERC20Upgradeable, ERC20CappedUpgradeable, PlennyBasePausable {

    /// @notice whitelisted addresses, allowed to mint new tokens to
    mapping(address => bool) public mintWhitelist;
    /// @notice length of the whitelisted addresses
    uint256 public mintWhitelistLength;
    /// @notice is whitelisting minting enabled
    bool public whitelistingActive;

    /// @notice MINTER ROLE constant
    bytes32 public constant MINTER_ROLE = keccak256("MINTER_ROLE");

    /// @notice Method used for initializing the contract. Can be called only once.
    /// @dev    Configures common features of the token (name, symbol, roles).
    /// @param  name Name of the token
    /// @param  symbol Token symbol
    /// @param  owner token owner
    function init(string memory name, string memory symbol, address owner) internal initializer {

        ERC20Upgradeable.__ERC20_init(name, symbol);
        ERC20CappedUpgradeable.__ERC20Capped_init(2100000000 * (10 ** uint256(18)));
        PlennyBasePausable.__plennyBasePausableInit();
        mintWhitelistLength = 0;
        whitelistingActive = false;
        _setupRole(MINTER_ROLE, _msgSender());
        _setupRole(PAUSER_ROLE, owner);
        transferOwnership(owner);
    }

    /// @notice Burns a given amount from the sender's balance.
    /// @dev    Called when the contract is not paused.
    /// @param  amount Amount of tokens to burn
    function burn(uint256 amount) external whenNotPaused {
        _burn(msg.sender, amount);
    }

    /// @notice Adds address, which is allowed to initiate minting of new tokens.
    /// @dev    Called by the contract owner, when the contract is not paused.
    /// @param  _address Address of minters to add
    function addMinter(address _address) external onlyOwner whenNotPaused {
        _setupRole(MINTER_ROLE, _address);
    }

    /// @notice Adds address, which is allowed to mint new tokens to the whitelist.
    /// @dev    Fails if address is already whitelisted. Called by the owner, when not paused.
    /// @param  _address Address to be whitelisted
    function addMintAddress(address _address) external onlyOwner whenNotPaused {
        require(_address != address(0), "Address ZERO");
        require(!isMintAddressWhitelisted(_address), "Address is already whitelisted");
        mintWhitelist[_address] = true;
        mintWhitelistLength = mintWhitelistLength.add(1);
    }

    /// @notice Removes address from the whitelist.
    /// @dev    Fails if address is NOT whitelisted. Called by the owner, when not paused.
    /// @param  _address Address to remove from whitelisted addresses
    function removeMintAddress(address _address) external onlyOwner whenNotPaused {
        require(_address != address(0), "Address ZERO");
        require(isMintAddressWhitelisted(_address), "Address is not whitelisted");
        mintWhitelist[_address] = false;
        mintWhitelistLength = mintWhitelistLength.sub(1);
    }

    /// @notice Checks if a given address is whitelisted.
    /// @param  _address Address to check for whitelisting
    /// @return bool true if address is whitelisted, false otherwise
    function isMintAddressWhitelisted(address _address) public view returns (bool) {
        return mintWhitelist[_address];
    }

    /// @notice Enable the whitelisting option. If whitelisting is enabled,
    ///         every mint operation checks for whitelisted address
    /// @dev    Called by the owner, when not paused
    /// @param  boolean enabled/disabled
    function toggleWhitelisting(bool boolean) external onlyOwner whenNotPaused {
        whitelistingActive = boolean;
    }

    /// @notice Used for minting new tokens with whitelisting check, if enabled.
    /// @param  addr Address to mint new tokens to
    /// @param  amount Amount of tokens to mint
    function _mintWhitelisted(address addr, uint256 amount) internal {
        require(hasRole(MINTER_ROLE, _msgSender()), "must have minter role to mint");
        if (whitelistingActive) {
            require(isMintAddressWhitelisted(addr), "Address is not whitelisted for minting");
            _mint(addr, amount);
        } else {
            _mint(addr, amount);
        }
    }

    /// @notice Called before every token transfer
    /// @param  from Token sender
    /// @param  to Token receiver
    /// @param  amount Token amount
    function _beforeTokenTransfer(address from, address to, uint256 amount) internal virtual override(ERC20Upgradeable, ERC20CappedUpgradeable) {
        super._beforeTokenTransfer(from, to, amount);
    }

}
