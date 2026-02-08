"use client";

import React, { useState, useEffect } from 'react';
import { useInjectedWallet } from '@/hooks/useInjectedWallet';
import { useYellowChannel } from '@/hooks/useYellowChannel';
import {
    IconWallet,
    IconLoader,
    IconCheck,
    IconAlertCircle,
    IconBolt,
    IconExternalLink,
    IconPlugConnected,
    IconArrowRight,
    IconRefresh,
    IconX
} from '@tabler/icons-react';
import { useParams } from 'next/navigation';

export default function PaymentPage() {
    const { invoiceId } = useParams();

    // Wallet Connection (injected - MetaMask etc)
    const {
        connect: connectWallet,
        disconnect,
        address,
        isConnected,
        walletClient
    } = useInjectedWallet();

    // Mock Invoice Data (In real app, fetch from contract)
    // NOTE: recipient must be different from payer address
    const invoice = {
        id: invoiceId,
        amount: '10', // 10 ytest.usd
        currency: 'ytest.usd',
        // Using a different test address - replace with actual merchant in production
        recipient: '0x5EABE5F63D6fe34c96f3000A262d7862e17D30A9' as `0x${string}`,
        details: 'Web Design Services',
    };

    // Yellow Network Channel Hook - pass invoice amount as allowance
    const {
        status: yellowStatus,
        error: yellowError,
        jwtToken,
        channels,
        existingChannelId,
        connect: connectYellow,
        createChannel,
        closeChannel,
        getChannels,
        sendPayment,
        disconnect: disconnectYellow,
    } = useYellowChannel(walletClient, address, invoice.amount);

    // Payment state
    const [paymentComplete, setPaymentComplete] = useState(false);

    // Effect: Auto-connect to Yellow Network when wallet is connected
    useEffect(() => {
        if (isConnected && walletClient && address && yellowStatus === 'idle') {
            console.log('[Pay] Wallet connected, auto-connecting to Yellow Network...');
            connectYellow();
        }
    }, [isConnected, walletClient, address, yellowStatus, connectYellow]);

    // Helper: Display status
    const getStatusText = () => {
        switch (yellowStatus) {
            case 'connecting': return 'Connecting to Yellow ClearNode...';
            case 'authenticating': return 'Signing authentication...';
            case 'authenticated': return 'Authenticated! Ready to pay';
            case 'fetching_channels': return 'Fetching channels...';
            case 'creating_channel': return 'Creating payment channel...';
            case 'channel_created': return 'Channel created!';
            case 'creating_session': return 'Creating payment session...';
            case 'session_created': return 'Session ready! Click Pay to complete';
            case 'sending_payment': return 'Processing payment...';
            case 'payment_complete': return 'Payment complete! ⚡';
            case 'error': return yellowError || 'Error occurred';
            default: return 'Not connected';
        }
    };


    const isProcessing = ['connecting', 'authenticating', 'creating_channel', 'sending_payment'].includes(yellowStatus);
    const isReady = yellowStatus === 'channel_created' || yellowStatus === 'authenticated' || existingChannelId !== null;
    const hasChannel = channels.length > 0 || existingChannelId;
    const isPaid = yellowStatus === 'payment_complete' || paymentComplete;

    // Handle payment - direct transfer (no app session needed)
    const handlePay = async () => {
        try {
            console.log('[Pay] Sending direct transfer payment...');
            await sendPayment(invoice.recipient, invoice.amount);
        } catch (e) {
            console.error('[Pay] Error:', e);
        }
    };

    // Effect: Mark payment as complete
    useEffect(() => {
        if (yellowStatus === 'payment_complete') {
            setPaymentComplete(true);
        }
    }, [yellowStatus]);

    // Step 1: Connect Wallet
    // Step 2: Connect to Yellow Network (auth)
    // Step 3: Create or use existing channel
    // Step 4: Make payment



    return (
        <div className="min-h-screen bg-[var(--background)] flex items-center justify-center p-4">
            <div className="w-full max-w-md bg-[var(--card)] border border-white/10 rounded-2xl p-6 shadow-xl">
                {/* Header */}
                <div className="flex justify-between items-start mb-6">
                    <div>
                        <h1 className="text-xl font-bold">Invoice #{invoice.id}</h1>
                        <p className="text-[var(--muted-foreground)] text-sm">
                            {invoice.details}
                        </p>
                    </div>
                    <div className="text-right">
                        <div className="text-2xl font-bold">${invoice.amount}</div>
                        <div className="text-xs text-[var(--muted-foreground)] uppercase">
                            {invoice.currency}
                        </div>
                    </div>
                </div>

                {/* Yellow Network Badge */}
                <div className="flex items-center justify-center gap-2 mb-4 text-sm text-yellow-400">
                    <IconBolt size={16} />
                    <span>Yellow Network State Channels</span>
                </div>

                {/* Network Info */}
                <div className="bg-white/5 rounded-lg p-3 mb-4 text-center">
                    <div className="text-xs text-[var(--muted-foreground)]">Settlement</div>
                    <div className="font-medium">Sepolia (via Yellow ClearNode)</div>
                </div>

                {/* Status Badge */}
                <div className="mb-4 text-center">
                    <span className={`text-xs px-2 py-1 rounded-full border inline-flex items-center gap-1 ${isReady
                        ? 'text-green-400 border-green-400/20 bg-green-400/10'
                        : yellowStatus === 'error'
                            ? 'text-red-400 border-red-400/20 bg-red-400/10'
                            : 'text-yellow-400 border-yellow-400/20 bg-yellow-400/10'
                        }`}>
                        {isProcessing && <IconLoader size={12} className="animate-spin" />}
                        {getStatusText()}
                    </span>
                </div>

                {/* ===== STEP 1: Connect Wallet ===== */}
                {!isConnected ? (
                    <button
                        onClick={connectWallet}
                        className="w-full py-3 px-4 bg-[var(--primary)] text-black rounded-lg font-medium hover:opacity-90 transition-opacity flex items-center justify-center gap-2"
                    >
                        <IconWallet size={20} /> Connect Wallet
                    </button>
                ) : (
                    <div className="space-y-4">
                        {/* Connected Wallet Display */}
                        <div className="text-center">
                            <span className="text-xs text-green-400 border border-green-400/20 bg-green-400/10 px-2 py-1 rounded-full">
                                {address?.slice(0, 6)}...{address?.slice(-4)}
                            </span>
                            <button
                                onClick={() => { disconnect(); disconnectYellow(); }}
                                className="ml-2 text-xs text-[var(--muted-foreground)] hover:text-white"
                            >
                                Disconnect
                            </button>
                        </div>

                        {/* ===== STEP 2: Connect to Yellow ===== */}
                        {yellowStatus === 'idle' && (
                            <button
                                onClick={connectYellow}
                                className="w-full py-3 bg-yellow-500 text-black rounded-lg font-bold hover:bg-yellow-400 flex items-center justify-center gap-2"
                            >
                                <IconPlugConnected size={20} /> Connect to Yellow Network
                            </button>
                        )}

                        {/* Loading State */}
                        {isProcessing && (
                            <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-4 text-center">
                                <IconLoader size={28} className="animate-spin mx-auto text-yellow-500 mb-2" />
                                <p className="text-sm text-yellow-400">{getStatusText()}</p>
                            </div>
                        )}

                        {/* ===== STEP 3: Show Channel Info ===== */}
                        {isReady && (
                            <div className="space-y-3">
                                {/* JWT Token indicator */}
                                {jwtToken && (
                                    <div className="text-center text-xs text-green-400">
                                        ✓ Session authenticated
                                    </div>
                                )}

                                {/* Existing Channel */}
                                {existingChannelId && (
                                    <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-3">
                                        <div className="flex justify-between items-center mb-1">
                                            <div className="text-xs text-blue-400">Existing Channel Found</div>
                                            <button
                                                onClick={() => closeChannel(existingChannelId)}
                                                disabled={isProcessing}
                                                className="text-red-400 hover:text-red-300 disabled:opacity-50"
                                                title="Close Channel"
                                            >
                                                <IconX size={14} />
                                            </button>
                                        </div>
                                        <div className="font-mono text-xs text-white break-all">
                                            {existingChannelId.slice(0, 20)}...{existingChannelId.slice(-10)}
                                        </div>
                                    </div>
                                )}

                                {/* Created Channels */}
                                {channels.length > 0 && (
                                    <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-3">
                                        <div className="text-xs text-green-400 mb-1">Active Channels</div>
                                        {channels.map((ch, i) => (
                                            <div key={i} className="flex justify-between items-center font-mono text-xs text-white">
                                                <span className="break-all">
                                                    {ch.channelId.slice(0, 20)}...
                                                    {ch.txHash && (
                                                        <a
                                                            href={`https://sepolia.etherscan.io/tx/${ch.txHash}`}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            className="ml-1 text-blue-400"
                                                        >
                                                            <IconExternalLink size={10} className="inline" />
                                                        </a>
                                                    )}
                                                </span>
                                                <button
                                                    onClick={() => closeChannel(ch.channelId)}
                                                    disabled={isProcessing}
                                                    className="text-red-400 hover:text-red-300 disabled:opacity-50 ml-2"
                                                    title="Close Channel"
                                                >
                                                    <IconX size={14} />
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                )}

                                {/* Create Channel Button logic removed - showing payment UI directly below */}\n

                                {/* Payment Preview */}

                                {/* Payment Complete State */}
                                {isPaid ? (
                                    <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-6 text-center">
                                        <div className="inline-flex p-3 bg-green-500/20 rounded-full mb-3">
                                            <IconCheck size={32} className="text-green-500" />
                                        </div>
                                        <h3 className="font-bold text-green-400 text-lg">Payment Complete!</h3>
                                        <p className="text-sm text-green-400/80 mt-1">
                                            {invoice.amount} ytest.usd sent to merchant
                                        </p>
                                        <p className="text-xs text-[var(--muted-foreground)] mt-3">
                                            ⚡ Instant off-chain via Yellow Network
                                        </p>
                                    </div>
                                ) : (
                                    <>
                                        <div className="bg-white/5 rounded-lg p-4 border border-white/10">
                                            <div className="flex justify-between items-center text-sm mb-2">
                                                <span className="text-[var(--muted-foreground)]">You Pay</span>
                                                <span className="font-mono font-bold">{invoice.amount} ytest.usd</span>
                                            </div>
                                            <div className="flex justify-between items-center text-sm">
                                                <span className="text-[var(--muted-foreground)]">Merchant Receives</span>
                                                <span className="font-mono font-bold text-green-400">{invoice.amount} ytest.usd</span>
                                            </div>
                                            <div className="mt-3 text-xs text-[var(--muted-foreground)] text-center">
                                                ⚡ Off-chain via state channel (instant)
                                            </div>
                                        </div>

                                        <button
                                            onClick={handlePay}
                                            disabled={isProcessing}
                                            className="w-full py-3 bg-yellow-500 text-black rounded-lg font-bold hover:bg-yellow-400 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                                        >
                                            {isProcessing ? (
                                                <>
                                                    <IconLoader size={20} className="animate-spin" />
                                                    {yellowStatus === 'creating_session' ? 'Creating Session...' :
                                                        yellowStatus === 'sending_payment' ? 'Sending Payment...' : 'Processing...'}
                                                </>
                                            ) : (
                                                <>
                                                    <IconBolt size={20} /> Pay {invoice.amount} ytest.usd
                                                    <IconArrowRight size={16} />
                                                </>
                                            )}
                                        </button>
                                    </>
                                )}


                                {/* Refresh Channels */}
                                <button
                                    onClick={getChannels}
                                    disabled={isProcessing}
                                    className="w-full py-2 text-xs text-[var(--muted-foreground)] hover:text-white flex items-center justify-center gap-1"
                                >
                                    <IconRefresh size={14} /> Refresh Channels
                                </button>
                            </div>
                        )}

                        {/* ===== ERROR STATE ===== */}
                        {yellowStatus === 'error' && (
                            <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4 text-center">
                                <div className="inline-flex p-2 bg-red-500/20 rounded-full mb-2">
                                    <IconAlertCircle size={24} className="text-red-500" />
                                </div>
                                <h3 className="font-bold text-red-500">Connection Failed</h3>
                                <p className="text-xs text-red-400 mt-1">{yellowError}</p>
                                <button
                                    onClick={connectYellow}
                                    className="text-xs underline mt-2 hover:text-white"
                                >
                                    Try Again
                                </button>
                            </div>
                        )}
                    </div>
                )}

                {/* Footer */}
                <div className="mt-6 text-center text-xs text-[var(--muted-foreground)]">
                    <p>Merchant: {invoice.recipient.slice(0, 10)}...{invoice.recipient.slice(-6)}</p>
                    <p className="mt-1 text-yellow-400/60">Yellow Network • ERC-7824 • ytest.usd</p>
                </div>
            </div>
        </div>
    );
}
