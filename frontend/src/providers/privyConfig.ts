"use client";

import type { PrivyClientConfig } from "@privy-io/react-auth";
import { sepolia, base, baseSepolia } from "viem/chains";

export const privyConfig: PrivyClientConfig = {
  embeddedWallets: {
    ethereum: {
      createOnLogin: "all-users",
    },
    // Disable wallet UIs to allow signing without confirmation popups
    showWalletUIs: false,
    priceDisplay: {
      primary: "fiat-currency",
      secondary: "native-token",
    },
  },
  defaultChain: baseSepolia,
  supportedChains: [baseSepolia, sepolia, base],

  loginMethods: ["email", "google"],
  appearance: {
    showWalletLoginFirst: true,
    theme: "#0c0c0c",
    accentColor: "#d2e823",
    logo: undefined,
  },
};
