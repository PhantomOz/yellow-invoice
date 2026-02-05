// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Script, console} from "forge-std/Script.sol";
import {YellowL2Registrar} from "../src/YellowL2Registrar.sol";

contract RegisterSubname is Script {
    function run() external {
        // Configuration
        address registrarAddress = vm.envOr("REGISTRAR_ADDRESS", address(0xdFC763Eb175822b60B98e92dFC2D6ba638f68fb7));
        string memory label = vm.envOr("SUBNAME_LABEL", string("testname"));
        address owner = vm.envOr("SUBNAME_OWNER", msg.sender);
        
        YellowL2Registrar registrar = YellowL2Registrar(registrarAddress);

        vm.startBroadcast();

        // Check availability
        bool available = registrar.available(label);
        if (!available) {
            console.log("Subname '%s' is NOT available", label);
            return;
        }

        console.log("Registering subname '%s' for owner %s...", label, owner);
        
        // Register (assuming 0 fee based on current contract)
        registrar.register(label, owner);
        
        console.log("Successfully registered!");
        
        vm.stopBroadcast();
    }
}
