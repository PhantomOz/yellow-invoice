import { useState, useCallback, useEffect } from 'react';
import { createWalletClient, custom, type WalletClient, type Address } from 'viem';
import { mainnet, sepolia, baseSepolia } from 'viem/chains';

export function useInjectedWallet() {
    const [walletClient, setWalletClient] = useState<WalletClient | null>(null);
    const [address, setAddress] = useState<Address | null>(null);
    const [isConnected, setIsConnected] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const connect = useCallback(async () => {
        if (typeof window === 'undefined' || !window.ethereum) {
            setError("No crypto wallet found. Please install MetaMask or similar.");
            return;
        }

        try {
            // Request accounts
            await window.ethereum.request({ method: 'eth_requestAccounts' });

            // Create Client
            // Note: In a real multi-chain app, we'd handle chain switching here too.
            // For now, default to current chain of provider or Sepolia.
            const client = createWalletClient({
                transport: custom(window.ethereum)
            });

            const [account] = await client.getAddresses();

            setWalletClient(client);
            setAddress(account);
            setIsConnected(true);
            setError(null);

        } catch (e: any) {
            console.error("Connection Failed", e);
            setError(e.message || "Failed to connect wallet");
        }
    }, []);

    const disconnect = useCallback(() => {
        setWalletClient(null);
        setAddress(null);
        setIsConnected(false);
    }, []);

    // Listen for account changes
    useEffect(() => {
        if (typeof window !== 'undefined' && window.ethereum) {
            window.ethereum.on('accountsChanged', (accounts: string[]) => {
                if (accounts.length > 0) {
                    setAddress(accounts[0] as Address);
                } else {
                    disconnect();
                }
            });
        }
        return () => {
            if (typeof window !== 'undefined' && window.ethereum) {
                // cleanup if needed (some providers don't support off properly via standard API easily)
            }
        };
    }, [disconnect]);

    return {
        connect,
        disconnect,
        walletClient,
        address,
        isConnected,
        error
    };
}
