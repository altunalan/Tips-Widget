// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

contract TipsVault is ReentrancyGuard {
    mapping(address => uint256) public balances;

    event TipSent(address indexed from, address indexed to, uint256 amount, string memo);

    error InvalidAmount();
    error InsufficientBalance();

    function tip(address to, string calldata memo) external payable nonReentrant {
        if (msg.value == 0) {
            revert InvalidAmount();
        }

        balances[to] += msg.value;
        emit TipSent(msg.sender, to, msg.value, memo);
    }

    function withdraw(uint256 amount) external nonReentrant {
        if (amount == 0) {
            revert InvalidAmount();
        }

        uint256 balance = balances[msg.sender];
        if (balance < amount) {
            revert InsufficientBalance();
        }

        unchecked {
            balances[msg.sender] = balance - amount;
        }

        (bool success, ) = msg.sender.call{value: amount}("");
        require(success, "Transfer failed");
    }
}
