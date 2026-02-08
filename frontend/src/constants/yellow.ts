import { YTEST_USD_TOKEN } from "./address";

// Yellow ClearNode Sandbox
export const WS_URL = "wss://clearnet-sandbox.yellow.com/ws";

// Supported assets on Yellow Network testnet
export const SUPPORTED_ASSETS = [
  {
    address: YTEST_USD_TOKEN,
    symbol: "ytest.usd",
    name: "Yellow Test USD",
  },
  {
    address: "0x0000000000000000000000000000000000000000" as `0x${string}`,
    symbol: "ETH",
    name: "Ethereum",
  },
] as const;
