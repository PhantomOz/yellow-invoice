import { usePrivy, useWallets } from '@privy-io/react-auth';
import { useNitrolite } from './useNitrolite';
import { createWalletClient, custom, Address } from 'viem';
import { sepolia } from 'viem/chains';
import { useState, useEffect } from 'react';

// Wrapper hook for Dashboard (Privy Authenticated)
export function useYellow() {
    const { wallets } = useWallets();
    const [privyClient, setPrivyClient] = useState<any>(null);
    const [privyAddress, setPrivyAddress] = useState<Address | null>(null);

    useEffect(() => {
        const initPrivyClient = async () => {
            const wallet = wallets[0];
            if (!wallet) {
                setPrivyClient(null);
                setPrivyAddress(null);
                return;
            }

            const provider = await wallet.getEthereumProvider();
            const client = createWalletClient({
                account: wallet.address as `0x${string}`,
                chain: sepolia,
                transport: custom(provider)
            });

            setPrivyClient(client);
            setPrivyAddress(wallet.address as Address);
        };
        initPrivyClient();
    }, [wallets]);

    // Use the generic hook with derived Privy client
    return useNitrolite(privyClient, privyAddress);
}
