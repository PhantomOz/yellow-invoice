import { useState, useCallback, useEffect } from 'react';
import { useWallets } from '@privy-io/react-auth';
import { createPublicClient, createWalletClient, custom, http, parseAbi, type WalletClient, type Address } from 'viem';
import { baseSepolia } from 'viem/chains';

// Contract Address (Deployed on Base Sepolia)
const YELLOW_INVOICE_ADDRESS = '0x4d04160633223533db789aab6610f54028295956' as const;

// Contract ABI (Minimal for read/write)
const YELLOW_INVOICE_ABI = parseAbi([
    'function createInvoice(uint256 amount, string clientName, uint256 issuedDate, uint256 dueDate, string terms, string services) external returns (uint256)',
    'function markPaid(uint256 id) external',
    'function getInvoice(uint256 id) external view returns ((address merchant, uint256 amount, bool isPaid, string clientName, uint256 issuedDate, uint256 dueDate, string terms, string services))',
    'function nextInvoiceId() external view returns (uint256)',
    'event InvoiceCreated(uint256 indexed id, address indexed merchant, string clientName, uint256 amount)',
    'event InvoiceSettled(uint256 indexed id, address indexed merchant, uint256 amount)',
]);

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
    chain: baseSepolia,
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
                    chain: baseSepolia,
                    transport: custom(provider),
                });
                setWalletClient(client);
            } catch (e) {
                console.error('Failed to init wallet client:', e);
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
                setError('Wallet not connected. Please connect via Privy first.');
                return null;
            }

            setIsLoading(true);
            setError(null);

            try {
                const [account] = await walletClient.getAddresses();

                // Switch chain if needed (though Privy/Wallet usually handles this or prompts)
                try {
                    await walletClient.switchChain({ id: baseSepolia.id });
                } catch (e) {
                    console.warn('Failed to switch chain, user might be on wrong chain', e);
                }

                const hash = await walletClient.writeContract({
                    address: YELLOW_INVOICE_ADDRESS,
                    abi: YELLOW_INVOICE_ABI,
                    functionName: 'createInvoice',
                    args: [
                        data.amount,
                        data.clientName,
                        BigInt(data.issuedDate),
                        BigInt(data.dueDate),
                        data.terms,
                        data.services,
                    ],
                    account,
                    chain: baseSepolia,
                });

                // Wait for confirmation
                const receipt = await publicClient.waitForTransactionReceipt({ hash });

                setIsLoading(false);
                return { hash, receipt };
            } catch (e: any) {
                console.error('Create Invoice Error:', e);
                setError(e.message || 'Failed to create invoice');
                setIsLoading(false);
                return null;
            }
        }, [walletClient, publicClient]);

    // Mark Invoice as Paid
    const markAsPaid = useCallback(
        async (id: number) => {
            if (!walletClient) {
                setError('Wallet not connected');
                return null;
            }

            setIsLoading(true);
            setError(null);

            try {
                const [account] = await walletClient.getAddresses();

                // Switch chain if needed
                try {
                    await walletClient.switchChain({ id: baseSepolia.id });
                } catch (e) {
                    console.warn('Failed to switch chain', e);
                }

                const hash = await walletClient.writeContract({
                    address: YELLOW_INVOICE_ADDRESS,
                    abi: YELLOW_INVOICE_ABI,
                    functionName: 'markPaid',
                    args: [BigInt(id)],
                    account,
                    chain: baseSepolia,
                });

                const receipt = await publicClient.waitForTransactionReceipt({ hash });
                setIsLoading(false);
                return { hash, receipt };
            } catch (e: any) {
                console.error('Mark Paid Error:', e);
                setError(e.message || 'Failed to mark as paid');
                setIsLoading(false);
                return null;
            }
        },
        [walletClient, publicClient]
    );

    // Get Invoice by ID
    const getInvoice = useCallback(async (id: number): Promise<Invoice | null> => {
        setIsLoading(true);
        setError(null);

        try {
            const data = await publicClient.readContract({
                address: YELLOW_INVOICE_ADDRESS,
                abi: YELLOW_INVOICE_ABI,
                functionName: 'getInvoice',
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
            console.error('Get Invoice Error:', e);
            setError(e.message || 'Failed to fetch invoice');
            setIsLoading(false);
            return null;
        }
    }, [publicClient]);

    // Get Total Invoice Count
    const getInvoiceCount = useCallback(async (): Promise<number> => {
        try {
            const count = await publicClient.readContract({
                address: YELLOW_INVOICE_ADDRESS,
                abi: YELLOW_INVOICE_ABI,
                functionName: 'nextInvoiceId',
            });
            return Number(count);
        } catch (e: any) {
            console.error('Get Invoice Count Error:', e);
            return 0;
        }
    }, [publicClient]);

    return {
        createInvoice,
        markAsPaid,
        getInvoice,
        getInvoiceCount,
        isLoading,
        error,
        isConnected: !!walletClient,
        contractAddress: YELLOW_INVOICE_ADDRESS,
        chain: baseSepolia,
    };
}
