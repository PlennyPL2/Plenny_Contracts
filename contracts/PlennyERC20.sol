// SPDX-License-Identifier: MIT

pragma solidity >=0.6.0 <0.8.0;

import "./interfaces/IPlennyERC20.sol";
import "./interfaces/IArbGateway.sol";
import "./interfaces/IArbRouter.sol";
import "./PlennyBaseERC20.sol";

/**
 * @title PlennyERC20 representation on mainnet L1.
 * @dev Plenny (PL2) is an ERC20 utility token.
 */
contract PlennyERC20 is PlennyBaseERC20, IPlennyERC20 {

    /// @dev arbitum L1 gateway
    address internal arbGateway;
    /// @dev arbitrum L1 router
    address internal arbRouter;

    /// @notice Initializes the token instead of a constructor. Called once during contract creation.
    /// @param  owner Owner of this contract
    /// @param  _data Parsable init data
    function initialize(
        address owner,
        bytes memory _data
    ) external override initializer {

        (string memory name, string memory symbol, address gateway, address router) = abi.decode(
            _data, (string, string, address, address));

        arbGateway = gateway;
        arbRouter = router;

        PlennyBaseERC20.init(name, symbol, owner);
    }

    /// @notice Mints additional token amount to the given address. If whitelisting is enabled,
    ///         the provided address needs to be whitelisted.
    /// @param  addr address to mint to
    /// @param  amount amount to mint
    function mint(address addr, uint256 amount) external override whenNotPaused {
        _mintWhitelisted(addr, amount);
    }

    /// @notice Registers this token contract to L2, thus creating a bridge between this token contract and
    ///         the PlennyArbERC20 contract that is deployed on Arbitrum L2.
    /// @param  l2CustomTokenAddress address of the PlennyArbERC20 on L2.
    /// @param  maxSubmissionCost arbitrum submission cost
    /// @param  maxGas arbitrum gas limit
    /// @param  gasPriceBid arbitrum gas price
    function registerTokenOnL2(address l2CustomTokenAddress, uint256 maxSubmissionCost, uint256 maxGas, uint256 gasPriceBid) external override {

        require(address(arbRouter) != address(0), "NO_ROUTER");
        require(address(arbGateway) != address(0), "NO_GATEWAY");
        IArbRouter(arbRouter).setGateway(arbGateway, maxGas, gasPriceBid, maxSubmissionCost);
        IArbGateway(arbGateway).registerTokenToL2(l2CustomTokenAddress, maxGas, gasPriceBid, maxSubmissionCost);
    }

    /// @notice Changes the Arbitrum Gateway address. Managed by the owner.
    /// @param  _gateway arbitrum gateway
    function setArbGateway(address _gateway) external onlyOwner {
        arbGateway = _gateway;
    }

    /// @notice Changes the Arbitrum Router address. Managed by the owner.
    /// @param  _router arbitrum router
    function setArbRouter(address _router) external onlyOwner {
        arbRouter = _router;
    }
}
