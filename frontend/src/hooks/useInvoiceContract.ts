import { useState, useCallback, useEffect } from 'react';
import { useWallets } from '@privy-io/react-auth';
import { createPublicClient, createWalletClient, custom, http, parseAbi, type WalletClient, type Address } from 'viem';

// Circle Arc Testnet
const arcTestnet = {
    id: 5042002,
    name: 'Arc Testnet',
    network: 'arc-testnet',
    nativeCurrency: { name: 'USDC', symbol: 'USDC', decimals: 6 },
    rpcUrls: {
        default: { http: ['https://rpc.testnet.arc.network'] },
        public: { http: ['https://rpc.testnet.arc.network'] },
    },
};

// Contract Address (Deployed)
const YELLOW_INVOICE_ADDRESS = '0xb2FD819e68B58D2509FDC3393fCFd5860dD28c52' as const;

// Contract ABI (Minimal for read/write)
const YELLOW_INVOICE_ABI = parseAbi([
    'function createInvoice(uint256 amount, string clientName, uint256 issuedDate, uint256 dueDate, string terms, string services) external returns (uint256)',
    'function getInvoice(uint256 id) external view returns ((address merchant, uint256 amount, bool isPaid, string clientName, uint256 issuedDate, uint256 dueDate, string terms, string services))',
    'function nextInvoiceId() external view returns (uint256)',
    'event InvoiceCreated(uint256 indexed id, address indexed merchant, string clientName, uint256 amount)',
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

export function useInvoiceContract() {
    const { wallets } = useWallets();
    const [walletClient, setWalletClient] = useState<WalletClient | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const publicClient = createPublicClient({
        chain: arcTestnet,
        transport: http(),
    });

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
                console.error('Failed to init wallet client:', e);
                setWalletClient(null);
            }
        };

        initWallet();
    }, [wallets]);

    // Create Invoice
    const createInvoice = useCallback(async (data: {
        amount: bigint;
        clientName: string;
        issuedDate: number; // Unix timestamp
        dueDate: number;    // Unix timestamp
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
                chain: arcTestnet,
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
        getInvoice,
        getInvoiceCount,
        isLoading,
        error,
        isConnected: !!walletClient,
        contractAddress: YELLOW_INVOICE_ADDRESS,
    };
}
