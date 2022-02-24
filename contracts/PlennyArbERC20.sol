// SPDX-License-Identifier: MIT

pragma solidity >=0.6.0 <0.8.0;

import "./interfaces/IArbPlennyERC20.sol";
import "./PlennyBaseERC20.sol";

/// @title  PlennyArbERC20
/// @notice PlennyERC20 token on Arbitrum ORU. Representation of the PlennyERC20 token on L2 mapped to L1 token.
contract PlennyArbERC20 is PlennyBaseERC20, IArbPlennyERC20  {

    /// @notice Arbitrum L2 bridge address
    address public bridgeAddress;
    /// @notice Address of the PlennyERC20 token on L1
    address public override l1Address;

    /// @dev    Modifier for the bridge address
    modifier onlyBridge {
        require(msg.sender == address(bridgeAddress), "ONLY_BRIDGE");
        _;
    }

    /// @notice Method used for initializing the contract. Can be called only once.
    /// @dev    Used in combination with the beacon proxy contract to initialize the token on Arbitrum L2.
    /// @param  owner Owner of this contract
    /// @param  _data Parsable init data
    function initialize(
        address owner,
        bytes memory _data
    ) external override initializer {

        require(address(bridgeAddress) == address(0), "ALREADY_INIT");
        (string memory name, string memory symbol, address _l1Address, address _bridge) = abi.decode(
            _data, (string, string, address, address));

        bridgeAddress = _bridge;
        l1Address = _l1Address;

        PlennyBaseERC20.init(name, symbol, owner);
    }

    /// @notice Mints new tokens
    /// @dev    Allows only whitelisted users to mint new tokens.
    /// @param  addr Address to mint the token to
    /// @param  amount Amount of tokens to mint
    function mint(address addr, uint256 amount) external override whenNotPaused {
        _mintWhitelisted(addr, amount);
    }

    /// @notice Used for bridging the tokens from L1 to Arbitrum.
    /// @dev    Allows only the bridge address to mint new token.
    /// @param  account Address to mint the token to
    /// @param  amount Amount of tokens to mint
    function bridgeMint(address account, uint256 amount) external override onlyBridge {
        _mint(account, amount);
    }

    /// @notice Used for bridging the tokens from Arbitrum to L1.
    /// @dev    Burns the tokens on Arbitrum in order to mint them on L1 later on.
    /// @param  account Address to burn the token from
    /// @param  amount Amount of tokens to burn
    function bridgeBurn(address account, uint256 amount) external override onlyBridge {
        _burn(account, amount);
    }
}
