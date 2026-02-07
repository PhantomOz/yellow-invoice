"use client";

import React, { useState, useEffect } from 'react';
import { useInjectedWallet } from '@/hooks/useInjectedWallet';
import { useLifi } from '@/hooks/useLifi';
import { useYellowEns } from '@/hooks/useEns';
import { useNitrolite } from '@/hooks/useNitrolite';
import { createWalletClient, custom } from 'viem';
import { base, optimism, arbitrum, polygon, mainnet, sepolia, baseSepolia } from 'viem/chains';
import { IconWallet, IconArrowRight, IconLoader, IconCheck, IconAlertCircle, IconArrowDownLeft } from '@tabler/icons-react';
import { useParams } from 'next/navigation';

export default function PaymentPage() {
    const { invoiceId } = useParams();

    // Vendor Wallet Connection (No Privy)
    const { connect, disconnect, address, isConnected, walletClient } = useInjectedWallet();

    const { getQuote, executeRoute, getTokens } = useLifi();

    // Pass vendor wallet to useNitrolite
    const { fundChannel } = useNitrolite(walletClient || undefined, address || undefined);

    // Mock Invoice Data (In real app, fetch from ID)
    const invoice = {
        id: invoiceId,
        amount: '10', // 10 USDC
        currency: 'USDC',
        recipient: '0x1192ebae3138f066c3914e428c0a29a8e39668e7', // Demo Merchant
        details: 'Web Design Services',
        targetChainId: baseSepolia.id, // For Testing
        targetToken: '0x036CbD53842c5426634e7929541eC2318f3dCF7e', // Base Sepolia USDC (Mock)
    };

    // State
    const [sourceChain, setSourceChain] = useState<number>(sepolia.id);
    const [sourceToken, setSourceToken] = useState<string>(''); // ETH by default usually
    const [tokenList, setTokenList] = useState<any[]>([]);
    const [quote, setQuote] = useState<any>(null);
    const [status, setStatus] = useState<'idle' | 'quoting' | 'paying' | 'success' | 'error'>('idle');
    const [errorMsg, setErrorMsg] = useState('');

    // Supported Source Chains
    const chains = [
        { id: sepolia.id, name: 'Sepolia', icon: '🔷' },
        { id: baseSepolia.id, name: 'Base Sepolia', icon: '🔵' },
        { id: optimism.id, name: 'Optimism', icon: '🔴' },
        { id: arbitrum.id, name: 'Arbitrum', icon: '🔵' },
        { id: polygon.id, name: 'Polygon', icon: '🟣' },
    ];

    // Load Tokens when Chain Changes
    useEffect(() => {
        const loadTokens = async () => {
            try {
                const tokens = await getTokens(sourceChain);
                setTokenList(tokens);
                if (tokens.length > 0) setSourceToken(tokens[0].address);
            } catch (e) {
                console.error("Failed to load tokens", e);
            }
        };
        loadTokens();
    }, [sourceChain, getTokens]);

    // Fetch Quote
    const handleGetQuote = async () => {
        if (!sourceToken || !address) return;
        setStatus('quoting');
        setErrorMsg('');
        try {
            // Amount Handling: In real app, convert 10 USDC to Source Token Amount
            // For MVP: We assume user inputs amount OR we just quote for "10 USDC worth"
            // Li.Fi requires amount in WEI of source token.
            // Simplified: User inputs/pays 0.01 ETH to see what happens.
            // Ideally: We request a "To Amount" quote. Li.Fi supports `toAmount`. (Not implemented in hook yet, but getQuote supports it)
            // Let's assume we want to PAY exact invoice amount.

            // NOTE: The hook getQuote we wrote is `fromAmount`. Let's hack it for demo.
            const amountInWei = '10000000000000000'; // 0.01 ETH Mock

            const quoteResult = await getQuote(
                sourceChain,
                sourceToken,
                invoice.targetChainId,
                invoice.targetToken,
                amountInWei,
                address, // fromAddress
                invoice.recipient
            );
            setQuote(quoteResult);
            setStatus('idle');
        } catch (e: any) {
            console.error(e);
            setErrorMsg(e.message || 'Failed to get quote');
            setStatus('error');
        }
    };

    // Execute Payment
    const handlePay = async () => {
        if (!quote || !walletClient) return;
        setStatus('paying');
        try {
            const route = quote; // Quote result is a Route in Li.Fi SDK
            await executeRoute(route, walletClient);

            setStatus('success');

            // Optional: Trigger Yellow Settlement
            // await fundChannel(...)

        } catch (e: any) {
            console.error(e);
            setErrorMsg(e.message || 'Payment Failed');
            setStatus('error');
        }
    };

    return (
        <div className="min-h-screen bg-[var(--background)] flex items-center justify-center p-4">
            <div className="w-full max-w-md bg-[var(--card)] border border-white/10 rounded-2xl p-6 shadow-xl">

                {/* Header */}
                <div className="flex justify-between items-start mb-6">
                    <div>
                        <h1 className="text-xl font-bold">Invoice #{invoice.id}</h1>
                        <p className="text-[var(--muted-foreground)] text-sm">{invoice.details}</p>
                    </div>
                    <div className="text-right">
                        <div className="text-2xl font-bold">${invoice.amount}</div>
                        <div className="text-xs text-[var(--muted-foreground)] uppercase">{invoice.currency}</div>
                    </div>
                </div>

                <hr className="border-white/10 mb-6" />

                {/* Wallet Connection */}
                {!isConnected ? (
                    <button
                        onClick={connect}
                        className="w-full py-3 px-4 bg-[var(--primary)] text-black rounded-lg font-medium hover:opacity-90 transition-opacity flex items-center justify-center gap-2"
                    >
                        <IconWallet size={20} /> Connect Wallet to Pay
                    </button>
                ) : (
                    <div className="space-y-4">
                        <div className="text-center">
                            <span className="text-xs text-green-400 border border-green-400/20 bg-green-400/10 px-2 py-1 rounded-full">{address?.slice(0, 6)}...{address?.slice(-4)}</span>
                            <button onClick={disconnect} className="ml-2 text-xs text-[var(--muted-foreground)] hover:text-white">Disconnect</button>
                        </div>

                        {/* Source Chain Selector */}
                        <div>
                            <label className="text-xs text-[var(--muted-foreground)] mb-1 block">Pay From Network</label>
                            <select
                                value={sourceChain}
                                onChange={(e) => setSourceChain(Number(e.target.value))}
                                className="w-full bg-white/5 border border-white/10 rounded-lg p-3 text-sm focus:outline-none focus:border-[var(--primary)]"
                            >
                                {chains.map(c => (
                                    <option key={c.id} value={c.id}>{c.icon} {c.name}</option>
                                ))}
                            </select>
                        </div>

                        {/* Token Selector */}
                        <div>
                            <label className="text-xs text-[var(--muted-foreground)] mb-1 block">Pay With Token</label>
                            <select
                                value={sourceToken}
                                onChange={(e) => setSourceToken(e.target.value)}
                                className="w-full bg-white/5 border border-white/10 rounded-lg p-3 text-sm focus:outline-none focus:border-[var(--primary)]"
                            >
                                {tokenList.length === 0 && <option>Loading tokens...</option>}
                                {tokenList.map(t => (
                                    <option key={t.address} value={t.address}>{t.symbol} ({Number(t.priceUSD).toFixed(2)})</option>
                                ))}
                            </select>
                        </div>

                        {/* Quote Button */}
                        {!quote && (
                            <button
                                onClick={handleGetQuote}
                                disabled={status === 'quoting'}
                                className="w-full py-3 bg-[var(--primary-cta-40)] text-[var(--primary-cta-fg)] rounded-lg font-medium hover:bg-[var(--primary-cta-60)] disabled:opacity-50"
                            >
                                {status === 'quoting' ? <IconLoader className="animate-spin mx-auto" /> : 'Get Best Rate'}
                            </button>
                        )}

                        {/* Quote Preview */}
                        {quote && (
                            <div className="bg-white/5 rounded-lg p-4 border border-white/10">
                                <div className="flex justify-between items-center text-sm mb-2">
                                    <span className="text-[var(--muted-foreground)]">You Pay</span>
                                    <span className="font-mono">0.01 {tokenList.find(t => t.address === sourceToken)?.symbol || 'ETH'}</span>
                                </div>
                                <div className="flex justify-center my-2 text-[var(--muted-foreground)]">
                                    <IconArrowDownLeft size={16} />{/* Using ArrowDown for flow */}
                                </div>
                                <div className="flex justify-between items-center text-sm">
                                    <span className="text-[var(--muted-foreground)]">Merchant Receives</span>
                                    <span className="font-mono font-bold text-green-400">
                                        ~{quote.estimate?.toAmount ? (Number(quote.estimate.toAmount) / 1000000).toFixed(2) : '...'} USDC
                                    </span>
                                </div>
                                <div className="mt-3 text-xs text-[var(--muted-foreground)] flex justify-between">
                                    <span>Gas Cost: ~${quote.estimate?.gasCosts?.[0]?.amountUSD || '0.00'}</span>
                                    <span>Time: ~{Math.ceil(quote.estimate?.executionDuration / 60)} min</span>
                                </div>
                            </div>
                        )}

                        {/* Pay Button */}
                        {quote && (
                            <button
                                onClick={handlePay}
                                disabled={status === 'paying'}
                                className="w-full py-3 bg-green-500 text-black rounded-lg font-bold hover:bg-green-400 disabled:opacity-50 flex items-center justify-center gap-2"
                            >
                                {status === 'paying' ? <IconLoader className="animate-spin" /> : 'Confirm Payment'}
                            </button>
                        )}

                        {/* Payment Status Display */}
                        {status === 'success' && (
                            <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-4 text-center">
                                <div className="inline-flex p-2 bg-green-500/20 rounded-full mb-2">
                                    <IconCheck size={24} className="text-green-500" />
                                </div>
                                <h3 className="font-bold text-green-500">Payment Successful!</h3>
                                <p className="text-xs text-[var(--muted-foreground)] mt-1">Funds are settling in the Merchant's account.</p>
                            </div>
                        )}

                        {/* Error Display */}
                        {status === 'error' && (
                            <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4 text-center">
                                <div className="inline-flex p-2 bg-red-500/20 rounded-full mb-2">
                                    <IconAlertCircle size={24} className="text-red-500" />
                                </div>
                                <h3 className="font-bold text-red-500">Payment Failed</h3>
                                <p className="text-xs text-red-400 mt-1">{errorMsg}</p>
                                <button onClick={() => setStatus('idle')} className="text-xs underline mt-2">Try Again</button>
                            </div>
                        )}

                    </div>
                )}
            </div>
        </div>
    );
}

// Icon helper imported at top
