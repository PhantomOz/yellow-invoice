// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;


contract YellowInvoice {
    address public owner;

    struct Invoice {
        address merchant;
        uint256 amount;
        bool isPaid;
        string clientName;
        uint256 issuedDate;
        uint256 dueDate;
        string terms;
        string services;
    }

    mapping(uint256 => Invoice) public invoices;
    uint256 public nextInvoiceId;

    event InvoiceCreated(uint256 indexed id, address indexed merchant, string clientName, uint256 amount);
    event InvoiceSettled(uint256 indexed id, address indexed merchant, uint256 amount);

    constructor() {
        owner = msg.sender;
    }

    function createInvoice(
        uint256 amount,
        string memory clientName,
        uint256 issuedDate,
        uint256 dueDate,
        string memory terms,
        string memory services
    ) external returns (uint256) {
        uint256 id = nextInvoiceId++;
        invoices[id] = Invoice({
            merchant: msg.sender,
            amount: amount,
            isPaid: false,
            clientName: clientName,
            issuedDate: issuedDate,
            dueDate: dueDate,
            terms: terms,
            services: services
        });
        
        emit InvoiceCreated(id, msg.sender, clientName, amount);
        return id;
    }

    
    // Getter for frontend convenience to read full struct
    function getInvoice(uint256 id) external view returns (Invoice memory) {
        return invoices[id];
    }
}