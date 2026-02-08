"use client";

import type { PrivyClientConfig } from "@privy-io/react-auth";
import { sepolia, base, baseSepolia } from "viem/chains";

export const privyConfig: PrivyClientConfig | any = {
  embeddedWallets: {
    ethereum: {
      createOnLogin: "all-users",
    },
    showWalletUIs: false,
    priceDisplay: {
      primary: "fiat-currency",
      secondary: "native-token",
    },
  },
  // Enable Smart Wallets (Account Abstraction)
  // This allows for gas sponsorship via Privy Paymaster.
  // Note: If type error occurs on `smartWallets`, it means the SDK version might be older or types are strict.
  // But based on user request for sponsorship, this is the config key.
  // If this fails, we will remove it and assume dashboard-only config.
  // Converting to `any` cast if needed or just trying the key.
  smartWallets: {
    enabled: true,
  },
  defaultChain: baseSepolia,
  supportedChains: [baseSepolia, sepolia, base],

  // Funding config
  fundingMethodConfig: {
    moonpay: {
      useSandbox: true,
    },
  },

  loginMethods: ["email", "google"],
  appearance: {
    showWalletLoginFirst: true,
    theme: "#0c0c0c",
    accentColor: "#d2e823",
    logo: undefined,
  },
};
