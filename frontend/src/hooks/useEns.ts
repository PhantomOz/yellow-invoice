import { useCallback, useState } from 'react';
import {
    createPublicClient,
    createWalletClient,
    http,
    custom,
    encodeFunctionData,
    parseEther
} from 'viem';
import { base, baseSepolia, mainnet, sepolia } from 'viem/chains';
import { normalize } from 'viem/ens';

// L2 Registrar ABI (key functions)
const YELLOW_REGISTRAR_ABI = [
    {
        name: 'register',
        type: 'function',
        inputs: [
            { name: 'label', type: 'string' },
            { name: 'owner', type: 'address' }
        ],
        outputs: [],
        stateMutability: 'payable'
    },
    {
        name: 'available',
        type: 'function',
        inputs: [{ name: 'label', type: 'string' }],
        outputs: [{ type: 'bool' }],
        stateMutability: 'view'
    },
    {
        name: 'registrationFee',
        type: 'function',
        inputs: [],
        outputs: [{ type: 'uint256' }],
        stateMutability: 'view'
    },
    {
        name: 'hasRegistered',
        type: 'function',
        inputs: [{ name: 'owner', type: 'address' }],
        outputs: [{ type: 'bool' }],
        stateMutability: 'view'
    },
    {
        name: 'registeredNames',
        type: 'function',
        inputs: [{ name: 'owner', type: 'address' }],
        outputs: [{ type: 'string' }],
        stateMutability: 'view'
    }
] as const;

const YELLOW_REGISTRAR_ADDRESS = '0x2F1f83A5802e24Cae6cb835406Fc71946231D97E';

export function useYellowEns() {
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Check if a subname is available
    const checkAvailability = useCallback(async (label: string) => {
        const client = createPublicClient({
            chain: baseSepolia, // or your chosen L2
            transport: http()
        });

        try {
            const available = await client.readContract({
                address: YELLOW_REGISTRAR_ADDRESS,
                abi: YELLOW_REGISTRAR_ABI,
                functionName: 'available',
                args: [label]
            });
            return available;
        } catch (err) {
            console.error('Error checking availability:', err);
            return false;
        }
    }, []);

    // Register a subname
    const registerSubname = useCallback(async (label: string) => {
        if (!window.ethereum) throw new Error('No wallet found');

        setIsLoading(true);
        setError(null);

        try {
            const walletClient = createWalletClient({
                chain: baseSepolia,
                transport: custom(window.ethereum as any)
            });

            const [address] = await walletClient.getAddresses();

            // Get registration fee
            const publicClient = createPublicClient({
                chain: baseSepolia,
                transport: http()
            });

            const fee = await publicClient.readContract({
                address: YELLOW_REGISTRAR_ADDRESS,
                abi: YELLOW_REGISTRAR_ABI,
                functionName: 'registrationFee'
            });

            // Register the subname
            const hash = await walletClient.writeContract({
                address: YELLOW_REGISTRAR_ADDRESS,
                abi: YELLOW_REGISTRAR_ABI,
                functionName: 'register',
                args: [label, address],
                value: fee,
                account: address
            });

            return hash;
        } catch (err: any) {
            setError(err.message);
            throw err;
        } finally {
            setIsLoading(false);
        }
    }, []);

    // Resolve a yellow.eth subname
    const resolveSubname = useCallback(async (label: string) => {
        const client = createPublicClient({
            chain: sepolia, // ENS Resolution starts on L1
            transport: http()
        });

        try {
            const name = normalize(`${label}.yellow.eth`);
            const address = await client.getEnsAddress({ name });
            console.log(address);
            return address;
        } catch (err) {
            console.error('Error resolving name:', err);
            return null;
        }
    }, []);

    const checkHasSubname = useCallback(async (address: string) => {
        const client = createPublicClient({
            chain: baseSepolia,
            transport: http()
        });

        try {
            const hasRegistered = await client.readContract({
                address: YELLOW_REGISTRAR_ADDRESS,
                abi: YELLOW_REGISTRAR_ABI,
                functionName: 'hasRegistered',
                args: [address as `0x${string}`]
            });
            return hasRegistered;
        } catch (err) {
            console.error('Error checking registration status:', err);
            return false;
        }
    }, []);

    const getRegisteredName = useCallback(async (address: string) => {
        const client = createPublicClient({
            chain: baseSepolia,
            transport: http()
        });

        try {
            const name = await client.readContract({
                address: YELLOW_REGISTRAR_ADDRESS,
                abi: YELLOW_REGISTRAR_ABI,
                functionName: 'registeredNames',
                args: [address as `0x${string}`]
            });
            console.log(name);
            return name;
        } catch (err) {
            console.error('Error fetching registered name:', err);
            return null;
        }
    }, []);

    return {
        checkAvailability,
        registerSubname,
        resolveSubname,
        checkHasSubname,
        getRegisteredName,
        isLoading,
        error
    };
}
