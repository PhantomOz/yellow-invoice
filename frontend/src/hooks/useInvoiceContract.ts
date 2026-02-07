import { useState, useCallback, useEffect } from "react";
import { useWallets } from "@privy-io/react-auth";
import {
  createPublicClient,
  createWalletClient,
  custom,
  http,
  type WalletClient,
  type Address,
} from "viem";

import { arcTestnet } from "viem/chains";

import { YELLOW_INVOICE_ADDRESS } from "../constants/address";
import { YELLOW_INVOICE_ABI } from "../constants/abi";

export interface Invoice {
  id: number;
  merchant: Address;
  amount: bigint;
  isPaid: boolean;
  clientName: string;
  issuedDate: bigint;
  dueDate: bigint;
  terms: string;
  services: string;
}

// Create client outside the hook to prevent recreation on every render
const publicClient = createPublicClient({
  chain: arcTestnet,
  transport: http(undefined, {
    retryCount: 5,
    retryDelay: 2000,
  }),
});

export function useInvoiceContract() {
  const { wallets } = useWallets();
  const [walletClient, setWalletClient] = useState<WalletClient | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);


  // Initialize wallet client from Privy
  useEffect(() => {
    const initWallet = async () => {
      const wallet = wallets[0];
      if (!wallet) {
        setWalletClient(null);
        return;
      }

      try {
        const provider = await wallet.getEthereumProvider();
        const client = createWalletClient({
          account: wallet.address as `0x${string}`,
          chain: arcTestnet,
          transport: custom(provider),
        });
        setWalletClient(client);
      } catch (e) {
        console.error("Failed to init wallet client:", e);
        setWalletClient(null);
      }
    };

    initWallet();
  }, [wallets]);

  // Create Invoice
  const createInvoice = useCallback(
    async (data: {
      amount: bigint;
      clientName: string;
      issuedDate: number; // Unix timestamp
      dueDate: number; // Unix timestamp
      terms: string;
      services: string;
    }) => {
      if (!walletClient) {
        setError("Wallet not connected. Please connect via Privy first.");
        return null;
      }

      setIsLoading(true);
      setError(null);

      try {
        const [account] = await walletClient.getAddresses();

        const hash = await walletClient.writeContract({
          address: YELLOW_INVOICE_ADDRESS,
          abi: YELLOW_INVOICE_ABI,
          functionName: "createInvoice",
          args: [
            data.amount,
            data.clientName,
            BigInt(data.issuedDate),
            BigInt(data.dueDate),
            data.terms,
            data.services,
          ],
          account,
          chain: arcTestnet,
        });

        // Wait for confirmation
        const receipt = await publicClient.waitForTransactionReceipt({ hash });

        setIsLoading(false);
        return { hash, receipt };
      } catch (e: any) {
        console.error("Create Invoice Error:", e);
        setError(e.message || "Failed to create invoice");
        setIsLoading(false);
        return null;
      }
    },
    [walletClient],
  );

  // Get Invoice by ID
  const getInvoice = useCallback(
    async (id: number): Promise<Invoice | null> => {
      setIsLoading(true);
      setError(null);

      try {
        const data = await publicClient.readContract({
          address: YELLOW_INVOICE_ADDRESS,
          abi: YELLOW_INVOICE_ABI,
          functionName: "getInvoice",
          args: [BigInt(id)],
        });

        setIsLoading(false);
        return {
          id,
          merchant: data.merchant,
          amount: data.amount,
          isPaid: data.isPaid,
          clientName: data.clientName,
          issuedDate: data.issuedDate,
          dueDate: data.dueDate,
          terms: data.terms,
          services: data.services,
        };
      } catch (e: any) {
        console.error("Get Invoice Error:", e);
        setError(e.message || "Failed to fetch invoice");
        setIsLoading(false);
        return null;
      }
    },
    [],
  );

  return {
    createInvoice,
    getInvoice,
    isLoading,
    error,
    isConnected: !!walletClient,
    contractAddress: YELLOW_INVOICE_ADDRESS,
  };
}
