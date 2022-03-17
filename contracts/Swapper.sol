//SPDX-License-Identifier: MIT
pragma solidity 0.8.11;

import "hardhat/console.sol";
import "@openzeppelin/contracts-upgradeable/access/AccessControlUpgradeable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

contract Swapper is AccessControlUpgradeable {
	using SafeERC20 for IERC20;

	address public constant AUGUSTUS_SWAPPER =
		0xDEF171Fe48CF0115B1d80b88dc8eAB59176FEe57;

	uint256 public adminFee;
	address public feeRecipient;

	function initialize(uint256 _adminFee) external initializer {
		__AccessControl_init();

		_setupRole(DEFAULT_ADMIN_ROLE, _msgSender());

		adminFee = _adminFee;
		feeRecipient = _msgSender();
	}

	/**
		@notice main function to make multiple swaps
		@dev use paraswap to encode a low level tx call to augustus swapper
	 */
	function swap(bytes[] calldata datas, IERC20[] calldata tokens)
		public
		payable
	{
		require(datas.length == tokens.length);

		console.log("Total Txs:", datas.length);

		for (uint256 i = 0; i < datas.length; i++) {
			// Execute tx on paraswap Swapper
			(bool success, bytes memory returnData) = AUGUSTUS_SWAPPER.call{
				value: msg.value
			}(datas[i]);

			// Fetch error message if tx not successful
			if (!success) {
				// Next 5 lines from https://ethereum.stackexchange.com/a/83577
				if (returnData.length < 68) revert();
				assembly {
					returnData := add(returnData, 0x04)
				}
				revert(abi.decode(returnData, (string)));
			}

			uint256 received = abi.decode(returnData, (uint256));
			assert(received > 0);

			console.log("Tokens received", received);
			console.log("Balance", tokens[i].balanceOf(address(this)));

			uint256 fee = (received * adminFee) / 10000;
			console.log("Fees", fee);

			// Charge fees
			if (fee > 0) {
				tokens[i].safeTransfer(feeRecipient, fee);
			}

			// Send back tokens to user
			tokens[i].safeTransfer(msg.sender, received - fee);
		}
	}
}
