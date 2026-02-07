import { useCallback, useState } from "react";
import { useWallets, useSendTransaction } from "@privy-io/react-auth";
import {
  createPublicClient,
  createWalletClient,
  http,
  custom,
  encodeFunctionData,
  parseEther,
  toHex,
} from "viem";
import { base, baseSepolia, mainnet, sepolia } from "viem/chains";
import { normalize } from "viem/ens";

import { YELLOW_REGISTRAR_ABI, L2_REGISTRY_ABI } from "../constants/abi";
import { YELLOW_REGISTRAR_ADDRESS } from "../constants/address";

export function useYellowEns() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { wallets } = useWallets();
  const { sendTransaction } = useSendTransaction();

  // Check if a subname is available
  const checkAvailability = useCallback(async (label: string) => {
    const client = createPublicClient({
      chain: baseSepolia, // or your chosen L2
      transport: http(),
    });

    try {
      const available = await client.readContract({
        address: YELLOW_REGISTRAR_ADDRESS,
        abi: YELLOW_REGISTRAR_ABI,
        functionName: "available",
        args: [label],
      });
      return available;
    } catch (err) {
      console.error("Error checking availability:", err);
      return false;
    }
  }, []);

  const registerSubname = useCallback(
    async (label: string) => {
      const wallet = wallets[0];
      if (!wallet) throw new Error("No wallet found");

      setIsLoading(true);
      setError(null);

      try {
        const address = wallet.address as `0x${string}`;

        // Get registration fee
        const publicClient = createPublicClient({
          chain: baseSepolia,
          transport: http(),
        });

        const fee = await publicClient.readContract({
          address: YELLOW_REGISTRAR_ADDRESS,
          abi: YELLOW_REGISTRAR_ABI,
          functionName: "registrationFee",
        });

        // Encode the register function call
        const data = encodeFunctionData({
          abi: YELLOW_REGISTRAR_ABI,
          functionName: "register",
          args: [label, address],
        });

        // Send transaction with gas sponsorship
        const txReceipt = await sendTransaction(
          {
            to: YELLOW_REGISTRAR_ADDRESS,
            data: data,
            value: fee,
            chainId: baseSepolia.id,
          },
          {
            sponsor: true, // Enable gas sponsorship
          },
        );

        return txReceipt.hash;
      } catch (err: any) {
        setError(err.message);
        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    [wallets, sendTransaction],
  );

  // Resolve a yellow.eth subname
  const resolveSubname = useCallback(async (label: string) => {
    const client = createPublicClient({
      chain: sepolia, // ENS Resolution starts on L1
      transport: http(),
    });

    try {
      const name = normalize(`${label}.yellow.eth`);
      const address = await client.getEnsAddress({ name });
      console.log(address);
      return address;
    } catch (err) {
      console.error("Error resolving name:", err);
      return null;
    }
  }, []);

  const checkHasSubname = useCallback(async (address: string) => {
    const client = createPublicClient({
      chain: baseSepolia,
      transport: http(),
    });

    try {
      const hasRegistered = await client.readContract({
        address: YELLOW_REGISTRAR_ADDRESS,
        abi: YELLOW_REGISTRAR_ABI,
        functionName: "hasRegistered",
        args: [address as `0x${string}`],
      });
      return hasRegistered;
    } catch (err) {
      console.error("Error checking registration status:", err);
      return false;
    }
  }, []);

  const getRegisteredName = useCallback(async (address: string) => {
    const client = createPublicClient({
      chain: baseSepolia,
      transport: http(),
    });

    try {
      const name = await client.readContract({
        address: YELLOW_REGISTRAR_ADDRESS,
        abi: YELLOW_REGISTRAR_ABI,
        functionName: "registeredNames",
        args: [address as `0x${string}`],
      });
      console.log(name);
      return name;
    } catch (err) {
      console.error("Error fetching registered name:", err);
      return null;
    }
  }, []);

  const setTextRecord = useCallback(
    async (label: string, key: string, value: string) => {
      const wallet = wallets[0];
      if (!wallet) throw new Error("No wallet found");

      setIsLoading(true);
      try {
        const publicClient = createPublicClient({
          chain: baseSepolia,
          transport: http(),
        });

        const registryAddress = await publicClient.readContract({
          address: YELLOW_REGISTRAR_ADDRESS,
          abi: YELLOW_REGISTRAR_ABI,
          functionName: "registry",
        });

        const baseNode = await publicClient.readContract({
          address: registryAddress,
          abi: L2_REGISTRY_ABI,
          functionName: "baseNode",
        });

        const node = await publicClient.readContract({
          address: registryAddress,
          abi: L2_REGISTRY_ABI,
          functionName: "makeNode",
          args: [baseNode, label],
        });

        const provider = await wallet.getEthereumProvider();
        const walletClient = createWalletClient({
          chain: baseSepolia,
          transport: custom(provider),
        });
        const [address] = await walletClient.getAddresses();

        const hash = await walletClient.writeContract({
          address: registryAddress,
          abi: L2_REGISTRY_ABI,
          functionName: "setText",
          args: [node, key, value],
          account: address,
        });
        return hash;
      } catch (err: any) {
        console.error("Error setting text record:", err);
        setError(err.message);
        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    [],
  );

  const getTextRecord = useCallback(async (label: string, key: string) => {
    const client = createPublicClient({
      chain: baseSepolia,
      transport: http(),
    });

    try {
      const registryAddress = await client.readContract({
        address: YELLOW_REGISTRAR_ADDRESS,
        abi: YELLOW_REGISTRAR_ABI,
        functionName: "registry",
      });

      const baseNode = await client.readContract({
        address: registryAddress,
        abi: L2_REGISTRY_ABI,
        functionName: "baseNode",
      });

      const node = await client.readContract({
        address: registryAddress,
        abi: L2_REGISTRY_ABI,
        functionName: "makeNode",
        args: [baseNode, label],
      });

      const value = await client.readContract({
        address: registryAddress,
        abi: L2_REGISTRY_ABI,
        functionName: "text",
        args: [node, key],
      });
      return value;
    } catch (err) {
      console.error("Error fetching text record:", err);
      return null;
    }
  }, []);

  return {
    checkAvailability,
    registerSubname,
    resolveSubname,
    checkHasSubname,
    getRegisteredName,
    setTextRecord,
    getTextRecord,
    isLoading,
    error,
  };
}
