// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Script.sol";
import "../src/YellowInvoice.sol";

contract DeployYellowInvoice is Script {
    function run() external {
        vm.startBroadcast();

        YellowInvoice invoice = new YellowInvoice();
        
        vm.stopBroadcast();
        
        console.log("YellowInvoice deployed at:", address(invoice));
    }
}
