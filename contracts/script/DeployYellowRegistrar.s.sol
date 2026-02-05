// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Script} from "forge-std/Script.sol";
import {YellowL2Registrar} from "../src/YellowL2Registrar.sol";

contract DeployYellowRegistrar is Script {
    function run() external {
        // Get L2Registry address from environment
        address l2Registry = vm.envAddress("L2_REGISTRY_ADDRESS");
        
        vm.startBroadcast();
        
        YellowL2Registrar registrar = new YellowL2Registrar(l2Registry);
        
        vm.stopBroadcast();
    }
}
