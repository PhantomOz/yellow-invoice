// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {StringUtils} from "@ensdomains/ens-contracts/utils/StringUtils.sol";
import {IL2Registry} from "durin/interfaces/IL2Registry.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";

/// @title YellowL2Registrar
/// @notice Registers ENS subnames on L2 for Yellow Invoice platform users
contract YellowL2Registrar is Ownable {
    using StringUtils for string;

    IL2Registry public immutable registry;
    uint256 public immutable coinType;
    uint256 public chainId;
    
    // Registration fee
    uint256 public registrationFee;
    
    // Minimum name length
    uint256 public constant MIN_NAME_LENGTH = 3;
    
    // Mapping to track registered user's names
    mapping(address => string) public registeredNames;
    mapping(address => bool) public hasRegistered;
    
    event NameRegistered(string indexed label, address indexed owner);
    event FeeUpdated(uint256 oldFee, uint256 newFee);

    constructor(address _registry) Ownable(msg.sender) {
        assembly {
            sstore(chainId.slot, chainid())
        }
        coinType = (0x80000000 | chainId) >> 0;
        registry = IL2Registry(_registry);
    }

    /// @notice Register a subname for a user
    /// @param label The subname label (e.g., "alice" for alice.yellow.eth)
    /// @param owner The address that will own the subname
    function register(string calldata label, address owner) external payable {
        require(msg.value >= registrationFee, "Insufficient fee");
        require(label.strlen() >= MIN_NAME_LENGTH, "Name too short");
        require(!hasRegistered[owner], "Already registered");
        
        bytes32 node = _labelToNode(label);
        bytes memory addr = abi.encodePacked(owner);

        // Set addresses for resolution
        registry.setAddr(node, coinType, addr);
        registry.setAddr(node, 60, addr); // Mainnet ETH

        // Create the subname
        registry.createSubnode(
            registry.baseNode(),
            label,
            owner,
            new bytes[](0)
        );
        
        hasRegistered[owner] = true;
        registeredNames[owner] = label;
        emit NameRegistered(label, owner);
    }

    /// @notice Check if a name is available
    function available(string calldata label) external view returns (bool) {
        if (label.strlen() < MIN_NAME_LENGTH) return false;
        
        bytes32 node = _labelToNode(label);
        uint256 tokenId = uint256(node);

        try registry.ownerOf(tokenId) {
            return false;
        } catch {
            return true;
        }
    }

    /// @notice Owner can update registration fee
    function setRegistrationFee(uint256 _fee) external onlyOwner {
        emit FeeUpdated(registrationFee, _fee);
        registrationFee = _fee;
    }

    /// @notice Withdraw collected fees
    function withdraw() external onlyOwner {
        payable(owner()).transfer(address(this).balance);
    }

    function _labelToNode(string calldata label) private view returns (bytes32) {
        return registry.makeNode(registry.baseNode(), label);
    }
}
