import { useState, useCallback } from 'react';
import { useWallets, useSendTransaction } from '@privy-io/react-auth';
import { createPublicClient, http, encodeFunctionData, type Address } from 'viem';
import { baseSepolia } from 'viem/chains';

import { YELLOW_INVOICE_ADDRESS } from '../constants/address';
import { YELLOW_INVOICE_ABI } from '../constants/abi';

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
    const { sendTransaction } = useSendTransaction();
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Create Invoice with gas sponsorship
    const createInvoice = useCallback(
        async (data: {
            amount: bigint;
            clientName: string;
            issuedDate: number; // Unix timestamp
            dueDate: number; // Unix timestamp
            terms: string;
            services: string;
        }) => {
            const wallet = wallets[0];
            if (!wallet) {
                setError('Wallet not connected. Please connect via Privy first.');
                return null;
            }

            setIsLoading(true);
            setError(null);

            try {
                // Encode the createInvoice function call
                const callData = encodeFunctionData({
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
                });

                // Send transaction with gas sponsorship
                const txReceipt = await sendTransaction(
                    {
                        to: YELLOW_INVOICE_ADDRESS,
                        data: callData,
                        chainId: baseSepolia.id,
                    },
                    {
                        sponsor: true, // Enable gas sponsorship
                    },
                );

                setIsLoading(false);
                return {
                    hash: txReceipt.hash,
                    receipt: txReceipt,
                };
            } catch (e: any) {
                console.error('Create Invoice Error:', e);
                setError(e.message || 'Failed to create invoice');
                setIsLoading(false);
                return null;
            }
        },
        [wallets, sendTransaction]
    );

    // Mark Invoice as Paid with gas sponsorship
    const markAsPaid = useCallback(
        async (id: number) => {
            const wallet = wallets[0];
            if (!wallet) {
                setError('Wallet not connected');
                return null;
            }

            setIsLoading(true);
            setError(null);

            try {
                // Encode the markPaid function call
                const callData = encodeFunctionData({
                    abi: YELLOW_INVOICE_ABI,
                    functionName: 'markPaid',
                    args: [BigInt(id)],
                });

                // Send transaction with gas sponsorship
                const txReceipt = await sendTransaction(
                    {
                        to: YELLOW_INVOICE_ADDRESS,
                        data: callData,
                        chainId: baseSepolia.id,
                    },
                    {
                        sponsor: true, // Enable gas sponsorship
                    },
                );

                setIsLoading(false);
                return {
                    hash: txReceipt.hash,
                    receipt: txReceipt,
                };
            } catch (e: any) {
                console.error('Mark Paid Error:', e);
                setError(e.message || 'Failed to mark as paid');
                setIsLoading(false);
                return null;
            }
        },
        [wallets, sendTransaction]
    );

    // Get Invoice by ID (read-only, no wallet needed)
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
    }, []);

    // Get Total Invoice Count (read-only, no wallet needed)
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
    }, []);

    // Get Invoices by Merchant Address
    const getInvoicesByMerchant = useCallback(async (merchant: Address): Promise<Invoice[]> => {
        setIsLoading(true);
        setError(null);

        try {
            // Get total count first
            const count = await getInvoiceCount();
            const invoices: Invoice[] = [];

            // Fetch all invoices and filter by merchant
            for (let i = 1; i < count; i++) {
                const invoice = await getInvoice(i);
                if (invoice && invoice.merchant.toLowerCase() === merchant.toLowerCase()) {
                    invoices.push(invoice);
                }
            }

            setIsLoading(false);
            return invoices;
        } catch (e: any) {
            console.error('Get Invoices by Merchant Error:', e);
            setError(e.message || 'Failed to fetch invoices');
            setIsLoading(false);
            return [];
        }
    }, [getInvoiceCount, getInvoice]);

    return {
        createInvoice,
        markAsPaid,
        getInvoice,
        getInvoiceCount,
        getInvoicesByMerchant,
        isLoading,
        error,
        isConnected: wallets.length > 0,
        contractAddress: YELLOW_INVOICE_ADDRESS,
        chain: baseSepolia,
    };
}
