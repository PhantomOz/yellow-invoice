import { parseAbi } from "viem";

export const YELLOW_INVOICE_ABI = parseAbi([
  "function createInvoice(uint256 amount, string clientName, uint256 issuedDate, uint256 dueDate, string terms, string services) external returns (uint256)",
  "function markPaid(uint256 id) external",
  "function getInvoice(uint256 id) external view returns ((address merchant, uint256 amount, bool isPaid, string clientName, uint256 issuedDate, uint256 dueDate, string terms, string services))",
  "function nextInvoiceId() external view returns (uint256)",
  "event InvoiceCreated(uint256 indexed id, address indexed merchant, string clientName, uint256 amount)",
  "event InvoiceSettled(uint256 indexed id, address indexed merchant, uint256 amount)",
]);

export const ERC20_ABI = parseAbi([
  "function transfer(address to, uint256 amount) external returns (bool)",
  "function approve(address spender, uint256 amount) external returns (bool)",
  "function allowance(address owner, address spender) external view returns (uint256)",
  "function balanceOf(address account) external view returns (uint256)",
]);

export const YELLOW_REGISTRAR_ABI = [
  {
    name: "register",
    type: "function",
    inputs: [
      { name: "label", type: "string" },
      { name: "owner", type: "address" },
    ],
    outputs: [],
    stateMutability: "payable",
  },
  {
    name: "available",
    type: "function",
    inputs: [{ name: "label", type: "string" }],
    outputs: [{ type: "bool" }],
    stateMutability: "view",
  },
  {
    name: "registrationFee",
    type: "function",
    inputs: [],
    outputs: [{ type: "uint256" }],
    stateMutability: "view",
  },
  {
    name: "hasRegistered",
    type: "function",
    inputs: [{ name: "owner", type: "address" }],
    outputs: [{ type: "bool" }],
    stateMutability: "view",
  },
  {
    name: "registeredNames",
    type: "function",
    inputs: [{ name: "owner", type: "address" }],
    outputs: [{ type: "string" }],
    stateMutability: "view",
  },
  {
    name: "registry",
    type: "function",
    inputs: [],
    outputs: [{ type: "address" }],
    stateMutability: "view",
  },
] as const;

export const L2_REGISTRY_ABI = [
  {
    name: "setText",
    type: "function",
    inputs: [
      { name: "node", type: "bytes32" },
      { name: "key", type: "string" },
      { name: "value", type: "string" },
    ],
    outputs: [],
    stateMutability: "nonpayable",
  },
  {
    name: "text",
    type: "function",
    inputs: [
      { name: "node", type: "bytes32" },
      { name: "key", type: "string" },
    ],
    outputs: [{ type: "string" }],
    stateMutability: "view",
  },
  {
    name: "baseNode",
    type: "function",
    inputs: [],
    outputs: [{ type: "bytes32" }],
    stateMutability: "view",
  },
  {
    name: "makeNode",
    type: "function",
    inputs: [
      { name: "parentNode", type: "bytes32" },
      { name: "label", type: "string" },
    ],
    outputs: [{ type: "bytes32" }],
    stateMutability: "pure",
  },
] as const;
