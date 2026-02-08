import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  IconCreditCard,
  IconWallet,
  IconLoader,
  IconBolt,
  IconCheck,
  IconRefresh,
  IconAlertCircle,
  IconPlugConnected,
  IconArrowRight,
  IconExternalLink,
} from "@tabler/icons-react";
import { formatUnits } from "viem";
import type { Invoice } from "@/hooks/useInvoiceContract";
import type { PaymentStatus } from "@/hooks/useInvoicePayment";
import type { SupportedChainId } from "@/hooks/useYellowChannel";

interface PaymentWidgetProps {
  invoice: Invoice;
  formattedAmount: string;
  isConnected: boolean;
  address: string | undefined | null;
  connect: () => void;
  disconnect: () => void;
  disconnectYellow: () => void;
  yellowStatus: string;
  selectedChainId: SupportedChainId;
  setSelectedChainId: (id: SupportedChainId) => void;
  supportedChains: readonly { id: number; name: string }[];
  isProcessing: boolean;
  isReady: boolean;
  hasEnoughLedgerBalance: boolean;
  ledgerBalance: string;
  walletBalance: string;
  fetchWalletBalance: () => void;
  getLedgerBalances: () => void;
  isLoadingBalance: boolean;
  handleDeposit: () => void;
  isDepositing: boolean;
  handlePay: () => void;
  status: PaymentStatus;
  isPaid: boolean;
  txHash: string;
  errorMsg: string;
  connectYellow: () => void;
  getStatusText: () => string;
}

export function PaymentWidget({
  invoice,
  formattedAmount,
  isConnected,
  address,
  connect,
  disconnect,
  disconnectYellow,
  yellowStatus,
  selectedChainId,
  setSelectedChainId,
  supportedChains,
  isProcessing,
  isReady,
  hasEnoughLedgerBalance,
  ledgerBalance,
  walletBalance,
  fetchWalletBalance,
  getLedgerBalances,
  isLoadingBalance,
  handleDeposit,
  isDepositing,
  handlePay,
  status,
  isPaid,
  txHash,
  errorMsg,
  connectYellow,
  getStatusText,
}: PaymentWidgetProps) {
  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: 0.2 }}
      className="lg:col-span-5"
    >
      <div className="bg-card backdrop-blur-xl border border-white/8 rounded-4xl p-6 sm:p-8 shadow-2xl h-full flex flex-col relative overflow-hidden">
        {/* Background shine effect */}
        <div className="absolute inset-0 bg-linear-to-b from-white/2 to-transparent pointer-events-none" />

        <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-3 relative z-10">
          <div className="p-2 bg-blue-500/10 rounded-lg text-blue-400">
            <IconCreditCard size={20} />
          </div>
          Payment Details
        </h2>

        <div className="flex-1 flex flex-col relative z-10">
          <AnimatePresence mode="wait">
            {!isConnected ? (
              <motion.div
                key="connect"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="flex-1 flex flex-col items-center justify-center py-8 text-center"
              >
                <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center mb-6 ring-1 ring-white/10">
                  <IconWallet className="text-white/60" size={32} />
                </div>
                <h3 className="text-lg font-medium text-white mb-2">
                  Connect Wallet
                </h3>
                <p className="text-sm text-white/40 max-w-[240px] mb-8 leading-relaxed">
                  Securely connect your wallet to settle this invoice on Base
                  Sepolia.
                </p>
                <button
                  onClick={connect}
                  className="w-full py-4 bg-cta-60 text-black rounded-full font-bold hover:bg-cta-40 transition-all transform hover:scale-[1.02] active:scale-[0.98] shadow-[0_0_20px_rgba(252,208,0,0.3)] hover:shadow-[0_0_30px_rgba(253,224,87,0.5)]"
                >
                  Connect Wallet
                </button>
              </motion.div>
            ) : (
              <motion.div
                key="pay"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="flex-1 flex flex-col"
              >
                {/* Connected Wallet Card */}
                <div className="bg-black/20 rounded-xl p-4 border border-white/5 mb-6 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-linear-to-br from-blue-500 to-purple-500 shadow-inner" />
                    <div>
                      <p className="text-[10px] uppercase tracking-wider font-bold text-white/40 mb-0.5">
                        Paying From
                      </p>
                      <p className="font-mono text-sm text-white/90">
                        {address?.slice(0, 6)}...{address?.slice(-4)}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      disconnect();
                      disconnectYellow();
                    }}
                    className="text-xs text-red-400/80 hover:text-red-400 hover:bg-red-400/10 px-3 py-1.5 rounded-lg transition-colors"
                  >
                    Disconnect
                  </button>
                </div>

                {/* Yellow Network Controls */}
                <div className="space-y-4 mb-6">
                  {/* Status & Chain */}
                  <div className="flex items-center justify-between gap-2 bg-white/5 p-2 rounded-xl">
                    <div
                      className={`px-3 py-1.5 rounded-full text-xs font-bold border flex items-center gap-2 ${
                        yellowStatus === "error"
                          ? "bg-red-500/10 text-red-400 border-red-500/20"
                          : isReady
                            ? "bg-green-500/10 text-green-400 border-green-500/20"
                            : "bg-yellow-500/10 text-yellow-400 border-yellow-500/20"
                      }`}
                    >
                      {isProcessing ? (
                        <IconLoader size={12} className="animate-spin" />
                      ) : (
                        <IconBolt size={14} />
                      )}
                      <span>{getStatusText()}</span>
                    </div>

                    <select
                      value={selectedChainId}
                      onChange={(e) =>
                        setSelectedChainId(Number(e.target.value) as any)
                      }
                      disabled={isProcessing}
                      className="bg-transparent text-right text-xs text-white/70 focus:outline-none cursor-pointer hover:text-white"
                    >
                      {supportedChains.map((c) => (
                        <option
                          key={c.id}
                          value={c.id}
                          className="bg-neutral-900"
                        >
                          {c.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Balances (Only show if connected to Yellow) */}
                  {yellowStatus !== "idle" && (
                    <div className="grid gap-3">
                      {/* Ledger Balance */}
                      <div
                        className={`p-4 rounded-xl border transition-all ${
                          hasEnoughLedgerBalance
                            ? "border-green-500/20 bg-green-500/5 shadow-[0_0_15px_-3px_rgba(74,222,128,0.1)]"
                            : "border-white/5 bg-white/5"
                        }`}
                      >
                        <div className="flex justify-between items-center mb-1">
                          <span className="text-xs text-white/40 uppercase tracking-wider font-bold">
                            Ledger Balance
                          </span>
                          {hasEnoughLedgerBalance && (
                            <div className="flex items-center gap-1 text-green-400 text-xs font-bold">
                              <IconCheck size={12} /> Ready
                            </div>
                          )}
                        </div>
                        <div
                          className={`text-2xl font-mono font-bold ${hasEnoughLedgerBalance ? "text-white" : "text-white/40"}`}
                        >
                          {parseFloat(ledgerBalance).toFixed(2)}{" "}
                          <span className="text-sm font-normal text-white/30">
                            ytest.usd
                          </span>
                        </div>
                      </div>

                      {/* Wallet Balance (Only if deposit needed) */}
                      {!hasEnoughLedgerBalance && (
                        <div className="p-4 rounded-xl border border-white/5 bg-white/5">
                          <div className="flex justify-between items-center mb-1">
                            <span className="text-xs text-white/40 uppercase tracking-wider font-bold">
                              Wallet Balance
                            </span>
                            <button
                              onClick={() => {
                                fetchWalletBalance();
                                getLedgerBalances();
                              }}
                              className="text-white/20 hover:text-white transition-colors"
                              disabled={isLoadingBalance}
                            >
                              <IconRefresh
                                size={12}
                                className={isLoadingBalance ? "animate-spin" : ""}
                              />
                            </button>
                          </div>
                          <div className="text-xl font-mono font-bold text-white/60">
                            {parseFloat(walletBalance).toFixed(2)}{" "}
                            <span className="text-sm font-normal text-white/20">
                              ytest.usd
                            </span>
                          </div>
                          {parseFloat(walletBalance) <
                            parseFloat(formatUnits(invoice.amount, 6)) && (
                            <div className="mt-2 text-xs text-red-400 flex items-center gap-1">
                              <IconAlertCircle size={12} /> Insufficient funds
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Payment Summary */}
                <div className="space-y-3 mb-8">
                  <div className="flex justify-between text-sm">
                    <span className="text-white/40">Amount</span>
                    <span className="text-white/80 font-medium">
                      ${formattedAmount}
                    </span>
                  </div>
                  <div className="h-px bg-white/10 my-2" />
                  <div className="flex justify-between items-baseline">
                    <span className="text-white/60 font-medium">Total Due</span>
                    <span className="text-2xl font-bold text-white">
                      ${formattedAmount}{" "}
                      <span className="text-sm font-normal text-white/40">
                        ytest.usd
                      </span>
                    </span>
                  </div>
                </div>

                <div className="mt-auto space-y-4">
                  {/* Step 1: Connect Yellow */}
                  {yellowStatus === "idle" && (
                    <button
                      onClick={connectYellow}
                      className="w-full py-4 bg-yellow-500 text-black rounded-full font-bold hover:bg-yellow-400 transition-all flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(250,204,21,0.3)]"
                    >
                      <IconPlugConnected size={20} /> Connect to Yellow
                    </button>
                  )}

                  {/* Step 2: Deposit (if needed) */}
                  {isReady && !hasEnoughLedgerBalance && (
                    <button
                      onClick={handleDeposit}
                      disabled={
                        isDepositing ||
                        parseFloat(walletBalance) <
                          parseFloat(formatUnits(invoice.amount, 6))
                      }
                      className="w-full py-4 bg-white/10 text-white rounded-full font-bold hover:bg-white/20 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isDepositing ? (
                        <IconLoader className="animate-spin" />
                      ) : (
                        <IconArrowRight size={20} />
                      )}
                      {isDepositing ? "Depositing..." : "Deposit to Ledger"}
                    </button>
                  )}

                  {/* Step 3: Pay */}
                  {status !== "success" &&
                    isReady &&
                    hasEnoughLedgerBalance && (
                      <button
                        onClick={handlePay}
                        disabled={status === "paying" || isPaid}
                        className={`
                          w-full py-4 rounded-full font-bold text-lg flex items-center justify-center gap-3 transition-all transform active:scale-[0.98]
                          ${
                            isPaid
                              ? "bg-green-500/10 text-green-500 cursor-default border border-green-500/20"
                              : "bg-cta-60 text-black hover:bg-cta-40 shadow-[0_0_20px_rgba(252,208,0,0.3)] hover:shadow-[0_0_30px_rgba(253,224,87,0.5)]"
                          }
                          disabled:opacity-50 disabled:cursor-not-allowed
                        `}
                      >
                        {status === "paying" ? (
                          <>
                            <IconLoader className="animate-spin" /> Processing
                          </>
                        ) : isPaid ? (
                          <>
                            <IconCheck /> Paid
                          </>
                        ) : (
                          <>
                            Pay Now <IconArrowRight size={20} />
                          </>
                        )}
                      </button>
                    )}

                  {/* Success State */}
                  {status === "success" && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="bg-green-500/10 border border-green-500/20 rounded-xl p-6 text-center"
                    >
                      <div className="w-12 h-12 bg-green-500/20 rounded-full flex items-center justify-center mx-auto text-green-500 mb-3">
                        <IconCheck size={24} stroke={3} />
                      </div>
                      <h4 className="font-bold text-white mb-1">
                        Payment Successful
                      </h4>
                      <p className="text-xs text-white/50 mb-4">
                        Transfer completed via Yellow Network.
                      </p>
                      
                      {txHash && (
                        <a 
                            href={`https://sepolia.basescan.org/tx/${txHash}`}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1 text-xs text-green-400 hover:text-green-300 transition-colors"
                        >
                            View on Explorer <IconExternalLink size={12} />
                        </a>
                      )}
                    </motion.div>
                  )}

                  {status === "error" && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl flex items-start gap-3 text-red-400 text-xs"
                    >
                      <IconAlertCircle className="shrink-0 mt-0.5" size={16} />
                      <div>
                        <p className="font-bold mb-0.5">Payment Failed</p>
                        <p className="opacity-80 leading-relaxed">{errorMsg}</p>
                      </div>
                    </motion.div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </motion.div>
  );
}
