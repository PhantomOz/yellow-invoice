import { useState, useCallback } from 'react';
import { createPublicClient, http, parseAbi } from 'viem';
import { sepolia } from 'viem/chains';
import type { WalletClient, Address } from 'viem';

// Yellow Network Sepolia Contracts (from ClearSync README)
const YELLOW_ADJUDICATOR = '0x47871f064d0b2ABf9190275C4D69f466C98fBD77' as const;
const ESCROW_APP = '0xcccb67333fEefb04e85521fF0c219Cdb12539b84' as const;

// USDC on Sepolia
const USDC_TOKEN = '0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238' as const;

// ABI for NitroAdjudicator deposit function
const ADJUDICATOR_ABI = parseAbi([
    'function deposit(address asset, bytes32 destination, uint256 expectedHeld, uint256 amount) external payable',
    'function holdings(address asset, bytes32 channelId) external view returns (uint256)',
]);

// USDC ERC20 ABI
const ERC20_ABI = parseAbi([
    'function approve(address spender, uint256 amount) external returns (bool)',
    'function balanceOf(address owner) external view returns (uint256)',
    'function allowance(address owner, address spender) external view returns (uint256)',
    'function transfer(address to, uint256 amount) external returns (bool)',
]);

const publicClient = createPublicClient({
    chain: sepolia,
    transport: http('https://eth-sepolia.g.alchemy.com/v2/6YuWj9vTHXT0uI4gZD3uSLil2uRL7Fjh'),
});

export type PaymentStatus =
    | 'idle'
    | 'checking_balance'
    | 'approving'
    | 'depositing'
    | 'transferring'
    | 'success'
    | 'error';

interface UseYellowPaymentResult {
    status: PaymentStatus;
    error: string | null;
    txHash: string | null;
    usdcBalance: bigint;
    payWithYellow: (params: {
        amount: bigint;
        merchantAddress: Address;
        invoiceId: string;
    }) => Promise<void>;
    refreshBalance: () => Promise<void>;
    CHAIN: typeof sepolia;
}

/**
 * useYellowPayment - On-chain Yellow Network payment using Adjudicator deposits
 * 
 * Since ClearNet WebSocket is unavailable, this hook uses direct on-chain operations:
 * 1. Approve USDC to Adjudicator
 * 2. Deposit USDC to a channel (creates escrow)
 * 3. OR simple transfer to merchant (fallback)
 */
export function useYellowPayment(
    walletClient: WalletClient | null | undefined,
    address: Address | null | undefined
): UseYellowPaymentResult {
    const [status, setStatus] = useState<PaymentStatus>('idle');
    const [error, setError] = useState<string | null>(null);
    const [txHash, setTxHash] = useState<string | null>(null);
    const [usdcBalance, setUsdcBalance] = useState<bigint>(BigInt(0));

    // Refresh USDC balance
    const refreshBalance = useCallback(async () => {
        if (!address) return;
        try {
            const balance = await publicClient.readContract({
                address: USDC_TOKEN,
                abi: ERC20_ABI,
                functionName: 'balanceOf',
                args: [address],
            });
            setUsdcBalance(balance);
        } catch (e) {
            console.error('[Yellow] Failed to fetch balance:', e);
        }
    }, [address]);

    // Pay with Yellow Network (on-chain deposit to Adjudicator)
    const payWithYellow = useCallback(async (params: {
        amount: bigint;
        merchantAddress: Address;
        invoiceId: string;
    }) => {
        if (!walletClient || !address) {
            setError('Wallet not connected');
            setStatus('error');
            return;
        }

        try {
            setStatus('checking_balance');
            setError(null);
            setTxHash(null);

            // Check balance
            const balance = await publicClient.readContract({
                address: USDC_TOKEN,
                abi: ERC20_ABI,
                functionName: 'balanceOf',
                args: [address],
            });

            if (balance < params.amount) {
                throw new Error(`Insufficient USDC balance. Have: ${balance}, Need: ${params.amount}`);
            }

            // Generate a channel ID from invoice ID (deterministic)
            const channelId = `0x${params.invoiceId.padStart(64, '0')}` as `0x${string}`;

            // Check current allowance
            setStatus('approving');
            const allowance = await publicClient.readContract({
                address: USDC_TOKEN,
                abi: ERC20_ABI,
                functionName: 'allowance',
                args: [address, YELLOW_ADJUDICATOR],
            });

            // Approve USDC if needed
            if (allowance < params.amount) {
                console.log('[Yellow] Approving USDC...');
                const approveHash = await walletClient.writeContract({
                    address: USDC_TOKEN,
                    abi: ERC20_ABI,
                    functionName: 'approve',
                    args: [YELLOW_ADJUDICATOR, params.amount],
                    account: address,
                    chain: sepolia,
                });
                await publicClient.waitForTransactionReceipt({ hash: approveHash });
                console.log('[Yellow] USDC approved:', approveHash);
            }

            // Deposit USDC to Yellow Adjudicator (on-chain escrow)
            setStatus('depositing');
            console.log('[Yellow] Depositing to Adjudicator...', {
                channelId,
                amount: params.amount.toString(),
            });

            // Get current holdings
            const currentHoldings = await publicClient.readContract({
                address: YELLOW_ADJUDICATOR,
                abi: ADJUDICATOR_ABI,
                functionName: 'holdings',
                args: [USDC_TOKEN, channelId],
            });

            // Deposit USDC
            const depositHash = await walletClient.writeContract({
                address: YELLOW_ADJUDICATOR,
                abi: ADJUDICATOR_ABI,
                functionName: 'deposit',
                args: [USDC_TOKEN, channelId, currentHoldings, params.amount],
                account: address,
                chain: sepolia,
            });

            console.log('[Yellow] Deposit tx sent:', depositHash);
            await publicClient.waitForTransactionReceipt({ hash: depositHash });

            // Now transfer to merchant (simplified - in real system would use conclude)
            setStatus('transferring');
            console.log('[Yellow] Transferring to merchant...');

            const transferHash = await walletClient.writeContract({
                address: USDC_TOKEN,
                abi: ERC20_ABI,
                functionName: 'transfer',
                args: [params.merchantAddress, params.amount],
                account: address,
                chain: sepolia,
            });

            console.log('[Yellow] Transfer tx sent:', transferHash);
            await publicClient.waitForTransactionReceipt({ hash: transferHash });

            setTxHash(transferHash);
            setStatus('success');
            console.log('[Yellow] Payment complete!');

        } catch (e: any) {
            console.error('[Yellow] Payment error:', e);
            setError(e.message || 'Payment failed');
            setStatus('error');
        }
    }, [walletClient, address]);

    return {
        status,
        error,
        txHash,
        usdcBalance,
        payWithYellow,
        refreshBalance,
        CHAIN: sepolia,
    };
}
