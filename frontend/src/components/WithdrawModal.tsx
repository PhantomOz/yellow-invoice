
import React, { useState, useEffect } from "react";
import {
    IconArrowRight,
    IconLoader2,
    IconWallet,
    IconCoin,
} from "@tabler/icons-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";

import { SupportedChainId, SUPPORTED_CHAINS } from "@/hooks/useYellowChannel";

interface WithdrawModalProps {
    isOpen: boolean;
    onClose: () => void;
    onWithdraw: (amount: string, targetChainId: SupportedChainId) => Promise<string | null>;
    balances: { asset: string; amount: string }[];
    chainBalances: { chainId: number; amount: string }[];
    supportedChains: typeof SUPPORTED_CHAINS;
    channels: { channelId: string; status: string }[]; // Need channels to close
}

export function WithdrawModal({
    isOpen,
    onClose,
    onWithdraw,
    balances,
    chainBalances,
    supportedChains,
    channels,
}: WithdrawModalProps) {
    const [amount, setAmount] = useState("");
    const [selectedChainId, setSelectedChainId] = useState<SupportedChainId>(supportedChains[0].id);
    const [isWithdrawing, setIsWithdrawing] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Identify the channel on the selected chain (mock logic: assuming simplest case for now or we filter from props)
    // Actually, channel objects from useYellowChannel don't currently expose Chain ID directly in the list
    // We might need to fetch them or assume the user wants to close *any* open channel.
    // Let's rely on onWithdraw to find the right channel for the chain.

    // Get ytest.usd balance
    const ytestBalance = balances.find((b) => b.asset === "ytest.usd")?.amount || "0";

    // Reset state on open
    useEffect(() => {
        if (isOpen) {
            setAmount("");
            setError(null);
            setIsWithdrawing(false);
        }
    }, [isOpen]);

    const handleWithdraw = async () => {
        if (!selectedChainId) {
            setError("Please select a chain");
            return;
        }

        if (!amount || parseFloat(amount) <= 0) {
            setError("Please enter a valid amount");
            return;
        }

        // Validate against unified/channel balance
        if (parseFloat(amount) > parseFloat(ytestBalance)) {
            setError(`Insufficient balance (Available: ${ytestBalance})`);
            return;
        }

        // Find open channel on selected chain
        setIsWithdrawing(true);
        setError(null);

        try {
            const txHash = await onWithdraw(amount, selectedChainId);

            if (txHash) {
                onClose();
            } else {
                setError(txHash); // If txHash is returned as an error string/null, logic below handles it.
                // Wait, onWithdraw returns string | null. If success, it returns txHash/status string.
                // If failure, it currently returns null and sets hook error.

                // Let's rely on the HOOK's error state if onWithdraw return null.
                // But we can't see the hook's error state immediately here unless passed as prop.
                // Current prop `onWithdraw` returns `Promise<string | null>`.

                // Update: Let's assume onWithdraw throws or returns null.
                // If null, we set a generic error.
                setError("Withdrawal failed. Check console or try refreshing balances.");
            }
        } catch (err: any) {
            setError(err.message || "Withdrawal failed");
        } finally {
            setIsWithdrawing(false);
        }
    };

    if (!isOpen) return null;

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="sm:max-w-md bg-neutral-950 border-neutral-800 rounded-3xl">
                <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-800">
                    <DialogTitle className="text-lg font-semibold tracking-tight flex items-center gap-2">
                        <IconWallet size={20} className="text-[var(--primary-cta-40)]" />
                        Withdraw Funds (Partial)
                    </DialogTitle>
                </div>

                <div className="p-6 space-y-6">
                    {/* Information */}
                    <div className="bg-neutral-900 rounded-xl p-4 border border-neutral-800">
                        <div className="flex items-start gap-3">
                            <IconCoin size={24} className="text-yellow-400 mt-1 shrink-0" />
                            <div className="space-y-1">
                                <div className="space-y-1">
                                    <div className="text-sm font-medium text-white">Partial Withdrawal</div>
                                    <div className="text-xs text-muted-foreground leading-relaxed">
                                        Withdraw a specific amount from your channel. Remaining funds stay in the channel for future transactions.
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Chain Selection */}
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-muted-foreground">Target Chain</label>
                            <select
                                value={selectedChainId}
                                onChange={(e) => setSelectedChainId(Number(e.target.value) as SupportedChainId)}
                                className="flex h-10 w-full items-center justify-between rounded-md border border-neutral-800 bg-neutral-900 px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 appearance-none text-white"
                            >
                                {supportedChains.map((chain) => (
                                    <option key={chain.id} value={chain.id.toString()}>
                                        {chain.name}
                                    </option>
                                ))}
                            </select>
                            <div className="text-xs text-muted-foreground mt-2">
                                Funds will be withdrawn from your channel on {supportedChains.find(c => c.id === selectedChainId)?.name}.
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium text-muted-foreground">Amount</label>
                            <div className="relative">
                                <Input
                                    type="number"
                                    placeholder="0.00"
                                    value={amount}
                                    onChange={(e) => setAmount(e.target.value)}
                                    className="bg-neutral-900 border-neutral-800 pr-16 font-mono text-lg text-white placeholder:text-muted-foreground focus-visible:ring-offset-0 focus-visible:ring-1 focus-visible:ring-[var(--primary-cta-40)]"
                                    min="0"
                                    step="0.01"
                                />
                                <button
                                    onClick={() => setAmount(ytestBalance)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-[var(--primary-cta-40)] hover:underline font-medium"
                                >
                                    MAX
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Error Display */}
                    {error && (
                        <div className="text-red-500 text-sm text-center bg-red-500/10 p-3 rounded-lg border border-red-500/20">
                            {error}
                        </div>
                    )}

                    {/* Action Button */}
                    <Button
                        className="w-full bg-[var(--primary-cta-40)] text-black hover:bg-[var(--primary-cta-40)]/90 font-semibold rounded-full h-12"
                        onClick={handleWithdraw}
                        disabled={isWithdrawing}
                    >
                        {isWithdrawing ? (
                            <>
                                <IconLoader2 size={18} className="mr-2 animate-spin" />
                                Processing Withdrawal...
                            </>
                        ) : (
                            <>
                                Withdraw Funds <IconArrowRight size={18} className="ml-2" />
                            </>
                        )}
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}

