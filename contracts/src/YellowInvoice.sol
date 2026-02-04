// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/utils/cryptography/MessageHashUtils.sol";
import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";

contract YellowInvoice {
    using ECDSA for bytes32;
    using MessageHashUtils for bytes32;

    address public constant USDC_ARC = 0x3600000000000000000000000000000000000000;
    address public owner;
    address public uniV4Hook; // For Track 3 (Uniswap v4)

    struct Invoice {
        address merchant;
        uint256 amount;
        bool isPaid;
        string ensMetadata; // For Track 5 (ENS)
    }

    mapping(uint256 => Invoice) public invoices;
    uint256 public nextInvoiceId;

    event InvoiceCreated(uint256 id, address merchant, uint256 amount);
    event InvoiceSettled(uint256 id, address merchant, uint256 amount);

    constructor() {
        owner = msg.sender;
    }

    function createInvoice(uint256 amount, string memory ensName) external returns (uint256) {
        uint256 id = nextInvoiceId++;
        invoices[id] = Invoice(msg.sender, amount, false, ensName);
        emit InvoiceCreated(id, msg.sender, amount);
        return id;
    }

    /**
     * @notice Security Guard (Track 1: Yellow Network)
     * Verifies the off-chain session signature before releasing funds.
     */
    function verifyAndSettle(uint256 id, bytes memory signature) external {
        Invoice storage inv = invoices[id];
        require(!inv.isPaid, "Already paid");

        // Verify the signature from the Yellow Nitrolite session
        bytes32 messageHash = keccak256(abi.encodePacked(id, inv.amount));
        address signer = messageHash.toEthSignedMessageHash().recover(signature);
        require(signer == inv.merchant, "Invalid Security Signature");

        // Logic for Track 4 (LI.FI / Circle Gateway)
        // In a real scenario, this would be triggered by the bridge landing
        inv.isPaid = true;
        
        // Track 3: Optional Yield Hook trigger
        if (uniV4Hook != address(0)) {
            // Trigger logic for Uni v4 after-settle yield
        }

        IERC20(USDC_ARC).transfer(inv.merchant, inv.amount);
        emit InvoiceSettled(id, inv.merchant, inv.amount);
    }
}