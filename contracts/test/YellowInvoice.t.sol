// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Test.sol";
import "../src/YellowInvoice.sol";

contract YellowInvoiceTest is Test {
    YellowInvoice public invoiceContract;
    address public merchant = address(0x123);
    address public client = address(0x456);

    function setUp() public {
        invoiceContract = new YellowInvoice();
    }

    function testCreateInvoice() public {
        vm.startPrank(merchant);
        
        string memory clientName = "Acme Corp";
        uint256 issuedDate = block.timestamp;
        uint256 dueDate = block.timestamp + 30 days;
        string memory terms = "Net 30";
        string memory services = "Web Development";
        uint256 amount = 1000 * 1e6; // 1000 USDC

        uint256 id = invoiceContract.createInvoice(
            amount,
            clientName,
            issuedDate,
            dueDate,
            terms,
            services
        );

        assertEq(id, 0);

        YellowInvoice.Invoice memory inv = invoiceContract.getInvoice(id);
        
        assertEq(inv.merchant, merchant);
        assertEq(inv.amount, amount);
        assertEq(inv.clientName, clientName);
        assertEq(inv.services, services);
        assertEq(inv.isPaid, false);
        
        vm.stopPrank();
    }
}
