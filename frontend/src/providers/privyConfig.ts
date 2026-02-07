"use client";

import type { PrivyClientConfig } from "@privy-io/react-auth";
import { arcTestnet, baseSepolia } from "viem/chains";

export const privyConfig: PrivyClientConfig = {
  embeddedWallets: {
    ethereum: {
      createOnLogin: "all-users",
    },
    showWalletUIs: true,
    priceDisplay: {
      primary: "fiat-currency",
      secondary: "native-token",
    },
  },
  defaultChain: baseSepolia,
  supportedChains: [baseSepolia, arcTestnet],

  loginMethods: ["email", "google"],
  appearance: {
    showWalletLoginFirst: true,
    theme: "#0c0c0c",
    accentColor: "#d2e823",
    logo: undefined,
  },
};
