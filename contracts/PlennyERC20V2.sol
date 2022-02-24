// SPDX-License-Identifier: MIT

pragma solidity >=0.6.0 <0.8.0;

import "./interfaces/IPlennyERC20V2.sol";
import "./interfaces/IArbGateway.sol";
import "./interfaces/IArbRouter.sol";
import "./PlennyBaseERC20.sol";

/**
 * @title PlennyERC20 representation on Ethereum Mainnet L1. Version 2 changes the registration of this token on Arbitrum L2.
 * @dev Plenny (PL2) is an ERC20 utility token.
 */
contract PlennyERC20V2 is PlennyBaseERC20, IPlennyERC20V2 {

    /// @dev arbitum L1 gateway
    address internal arbGateway;
    /// @dev arbitrum L1 router
    address internal arbRouter;

    /// An event emitted when the token is registered on L2.
    event TokenRegisteredOnL2(uint256 routerSetTicketId, uint256 gatewayRegisterTicketId,
        address l1Token, address l2Token);

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
    /// @dev    This function has been changed in V2 to fix the issue of correct registration of the token
    ///         on Arbitrum L2 by providing propagating the msg.value to the arbitrum gateway and router on L1.
    /// @param  l2CustomTokenAddress address of the PlennyArbERC20 on L2.
    /// @param  maxSubmissionCost arbitrum submission cost
    /// @param  maxGas arbitrum gas limit
    /// @param  gasPriceBid arbitrum gas price
    /// @param  routerGasFee gas propagated from msg.value to the arbitrum router on L1
    /// @param  gatewayGasFee gas propagated from msg.value to the arbitrum gateway on L1
    /// @return uint256 router ticket id
    /// @return uint256 gateway ticket id
    function registerTokenOnL2(address l2CustomTokenAddress,
        uint256 maxSubmissionCost, uint256 maxGas, uint256 gasPriceBid,
        uint256 routerGasFee, uint256 gatewayGasFee) external payable override returns (uint256, uint256) {

        require (msg.value == routerGasFee + gatewayGasFee, "GAS_FEE_ERROR");
        require(address(arbRouter) != address(0), "NO_ROUTER");
        require(address(arbGateway) != address(0), "NO_GATEWAY");

        uint256 routerSetTicketId = IArbRouter(arbRouter).setGateway{ value: routerGasFee }
            (arbGateway, maxGas, gasPriceBid, maxSubmissionCost);
        uint256 gatewayRegisterTicketId = IArbGateway(arbGateway).registerTokenToL2{ value: gatewayGasFee }
            (l2CustomTokenAddress, maxGas, gasPriceBid, maxSubmissionCost);

        emit TokenRegisteredOnL2(routerSetTicketId, gatewayRegisterTicketId, address(this), l2CustomTokenAddress);
        return (routerSetTicketId, gatewayRegisterTicketId);
    }

    /// @notice Changes the Arbitrum Gateway address. Managed by the owner.
    /// @param  _gateway arbitrum gateway
    function setArbGateway(address _gateway) external onlyOwner {
        arbGateway = _gateway;
    }

    /// @notice Change the Arbitrum Router address. Managed by the owner.
    /// @param  _router arbitrum router
    function setArbRouter(address _router) external onlyOwner {
        arbRouter = _router;
    }
}
