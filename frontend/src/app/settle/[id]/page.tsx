"use client";

import React, { useState, useEffect, useMemo } from "react";
import { useParams } from "next/navigation";
import { useInjectedWallet } from "@/hooks/useInjectedWallet";
import { useInvoiceContract, type Invoice } from "@/hooks/useInvoiceContract";
import { baseSepolia } from "viem/chains";
import {
  IconWallet,
  IconLoader,
  IconCheck,
  IconAlertCircle,
  IconArrowRight,
  IconBuilding,
  IconCalendar,
  IconFileInvoice,
  IconReceipt,
  IconCopy,
  IconExternalLink,
  IconCreditCard,
} from "@tabler/icons-react";
import { MOCK_USDC_TOKEN } from "@/constants/address";
import { ERC20_ABI } from "@/constants/abi";
import { formatUnits, createPublicClient, http } from "viem";
import { motion, AnimatePresence } from "framer-motion";

import { useCopyToClipboard } from "@/hooks/useCopyToClipboard";

// Types
type PaymentStatus = "idle" | "paying" | "success" | "error";

export default function InvoicePaymentPage() {
  const params = useParams();
  const id = params?.id ? Number(params.id) : null;

  // Hooks
  const { connect, disconnect, address, isConnected, walletClient } =
    useInjectedWallet();
  const { getInvoice } = useInvoiceContract();
  const { copied, copy } = useCopyToClipboard();

  // State
  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [loadingInvoice, setLoadingInvoice] = useState(true);
  const [invoiceError, setInvoiceError] = useState("");

  const [status, setStatus] = useState<PaymentStatus>("idle");
  const [errorMsg, setErrorMsg] = useState("");
  const [txHash, setTxHash] = useState("");

  // Constants
  const TARGET_CHAIN_ID = baseSepolia.id;
  const TARGET_TOKEN = MOCK_USDC_TOKEN;

  // Fetch Invoice
  useEffect(() => {
    async function fetchInvoice() {
      if (id === null || isNaN(id)) {
        setInvoiceError("Invalid invoice ID");
        setLoadingInvoice(false);
        return;
      }

      try {
        const data = await getInvoice(id);
        if (data) {
          setInvoice(data);
        } else {
          setInvoiceError("Invoice not found");
        }
      } catch (err) {
        setInvoiceError("Failed to load invoice details");
        console.error(err);
      } finally {
        setLoadingInvoice(false);
      }
    }
    fetchInvoice();
  }, [id, getInvoice]);

  // Execute Pay
  const handlePay = async () => {
    if (!walletClient || !invoice || !address) return;
    setStatus("paying");
    setErrorMsg("");
    setTxHash("");

    try {
      try {
        await walletClient.switchChain({ id: TARGET_CHAIN_ID });
      } catch (switchError: any) {
        console.warn("Failed to switch chain", switchError);
      }

      // Send USDC
      const hash = await walletClient.writeContract({
        address: TARGET_TOKEN,
        abi: ERC20_ABI,
        functionName: "transfer",
        args: [invoice.merchant, invoice.amount],
        chain: baseSepolia,
        account: address,
      });

      setTxHash(hash);

      const publicClient = createPublicClient({
        chain: baseSepolia,
        transport: http(),
      });

      await publicClient.waitForTransactionReceipt({ hash });

      setStatus("success");
    } catch (e: any) {
      console.error(e);
      setErrorMsg(e.message || "Payment Failed");
      setStatus("error");
    }
  };

  // Formatting
  const formattedDate = useMemo(() => {
    if (!invoice) return "-";
    const date = new Date(Number(invoice.dueDate) * 1000);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  }, [invoice]);

  const formattedAmount = useMemo(() => {
    if (!invoice) return "0.00";
    return formatUnits(invoice.amount, 6);
  }, [invoice]);

  // Loading State
  if (loadingInvoice) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-neutral-950 text-white">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
        >
          <IconLoader className="text-yellow-400" size={48} />
        </motion.div>
        <p className="mt-4 text-neutral-400 text-sm tracking-wider uppercase">Loading Invoice...</p>
      </div>
    );
  }

  // Error State
  if (invoiceError || !invoice) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-neutral-950 p-4">
        <div className="bg-red-500/5 border border-red-500/20 p-8 rounded-2xl max-w-md w-full text-center space-y-4">
          <div className="inline-flex p-4 bg-red-500/10 rounded-full text-red-500 mb-2">
            <IconAlertCircle size={48} />
          </div>
          <h1 className="text-2xl font-bold text-white">Invoice Unavailable</h1>
          <p className="text-red-300/80">{invoiceError}</p>
        </div>
      </div>
    );
  }

  const isPaid = invoice.isPaid || status === "success";

  return (
    <div className="min-h-screen bg-neutral-950 text-white selection:bg-yellow-500/30 font-sans">
      {/* Background Ambience */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-yellow-500/5 rounded-full blur-[120px]" />
        <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] bg-blue-600/5 rounded-full blur-[120px]" />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-20 flex flex-col items-center">
        
        {/* Header / Brand */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-12 flex items-center gap-3"
        >
          <div className="bg-yellow-400/10 p-2.5 rounded-xl border border-yellow-400/20">
             <IconFileInvoice className="text-yellow-400" size={24} />
          </div>
          <span className="text-lg font-bold tracking-tight text-white/90">Yellow Invoice</span>
        </motion.div>

        <div className="w-full grid lg:grid-cols-12 gap-8 lg:gap-12">
          
          {/* Main Invoice Card (Left) */}
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
            className="lg:col-span-7 space-y-6"
          >
            <div className="bg-card backdrop-blur-xl border border-white/8 rounded-4xl p-8 sm:p-10 relative overflow-hidden group">
              {/* Decorative top border */}
              <div className="absolute top-0 left-0 w-full h-1 bg-linear-to-r from-yellow-400/50 to-transparent opacity-50" />

              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-6 mb-10">
                <div>
                  <h1 className="text-3xl sm:text-4xl font-bold text-white mb-2 leading-tight">
                    {invoice.services}
                  </h1>
                  <p className="text-white/40 font-mono text-sm uppercase tracking-wider">
                    #{invoice.id.toString().padStart(6, '0')}
                  </p>
                </div>
                <div className={`
                  px-4 py-1.5 rounded-full text-xs font-bold tracking-wider uppercase border self-start
                  ${isPaid 
                    ? "bg-green-500/10 text-green-400 border-green-500/20 shadow-[0_0_15px_-3px_rgba(74,222,128,0.2)]" 
                    : "bg-yellow-500/10 text-yellow-400 border-yellow-500/20 shadow-[0_0_15px_-3px_rgba(250,204,21,0.2)]"
                  }
                `}>
                  {isPaid ? "Paid in Full" : "Payment Pending"}
                </div>
              </div>

              <div className="mb-10">
                <p className="text-white/50 text-sm mb-2 font-medium">Amount Due</p>
                <div className="flex items-baseline gap-2 text-6xl sm:text-7xl font-bold text-white tracking-tighter">
                  <span className="text-white/40 text-4xl sm:text-5xl">$</span>
                  {formattedAmount}
                  <span className="text-lg sm:text-xl font-medium text-white/40 ml-2">USDC</span>
                </div>
              </div>

              <div className="grid sm:grid-cols-2 gap-8 pt-8 border-t border-white/5">
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2 text-white/40 text-xs uppercase tracking-wider font-semibold">
                    <IconBuilding size={14} />
                    <span>Bill To</span>
                  </div>
                  <p className="text-lg font-medium text-white/90">{invoice.clientName}</p>
                </div>
                
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2 text-white/40 text-xs uppercase tracking-wider font-semibold">
                    <IconCalendar size={14} />
                    <span>Due Date</span>
                  </div>
                  <p className="text-lg font-medium text-white/90">{formattedDate}</p>
                </div>

                <div className="sm:col-span-2 space-y-2">
                  <div className="flex items-center gap-2 text-white/40 text-xs uppercase tracking-wider font-semibold">
                    <IconReceipt size={14} />
                    <span>Merchant Address</span>
                  </div>
                  <div className="flex items-center gap-3 group/address">
                    <div className="font-mono text-sm text-white/70 bg-black/20 px-3 py-2 rounded-lg border border-white/5 truncate max-w-[300px] sm:max-w-full">
                      {invoice.merchant}
                    </div>
                    <button 
                      onClick={() => copy(invoice.merchant)}
                      className="p-2 hover:bg-white/10 rounded-lg transition-colors text-white/40 hover:text-white"
                      title="Copy Address"
                    >
                      {copied ? <IconCheck size={18} className="text-green-400" /> : <IconCopy size={18} />}
                    </button>
                    <a 
                      href={`https://sepolia.basescan.org/address/${invoice.merchant}`}
                      target="_blank"
                      rel="noreferrer"
                      className="p-2 hover:bg-white/10 rounded-lg transition-colors text-white/40 hover:text-white"
                      title="View on Explorer"
                    >
                      <IconExternalLink size={18} />
                    </a>
                  </div>
                </div>
              </div>
            </div>

            {/* Trust Badge */}
            <div className="flex items-center justify-center gap-2 text-white/30 text-xs">
              <IconCheck size={12} />
              <span>Verified Merchant on Yellow Network</span>
            </div>
          </motion.div>

          {/* Payment Widget (Right) */}
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
                        <h3 className="text-lg font-medium text-white mb-2">Connect Wallet</h3>
                        <p className="text-sm text-white/40 max-w-[240px] mb-8 leading-relaxed">
                          Securely connect your wallet to settle this invoice on Base Sepolia.
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
                               <p className="text-[10px] uppercase tracking-wider font-bold text-white/40 mb-0.5">Paying From</p>
                               <p className="font-mono text-sm text-white/90">{address?.slice(0, 6)}...{address?.slice(-4)}</p>
                             </div>
                          </div>
                          <button 
                            onClick={disconnect}
                            className="text-xs text-red-400/80 hover:text-red-400 hover:bg-red-400/10 px-3 py-1.5 rounded-lg transition-colors"
                          >
                            Disconnect
                          </button>
                        </div>

                        {/* Payment Summary */}
                        <div className="space-y-3 mb-8">
                          <div className="flex justify-between text-sm">
                            <span className="text-white/40">Subtotal</span>
                            <span className="text-white/80 font-medium">${formattedAmount}</span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span className="text-white/40">Network Fee (Est.)</span>
                            <span className="text-white/80 font-medium">~$0.05</span>
                          </div>
                          <div className="h-px bg-white/10 my-2" />
                          <div className="flex justify-between items-baseline">
                            <span className="text-white/60 font-medium">Total</span>
                            <span className="text-2xl font-bold text-white">${formattedAmount} <span className="text-sm font-normal text-white/40">USDC</span></span>
                          </div>
                        </div>

                        <div className="mt-auto space-y-4">
                           {status !== "success" ? (
                             <button
                               onClick={handlePay}
                               disabled={status === "paying" || isPaid}
                               className={`
                                 w-full py-4 rounded-full font-bold text-lg flex items-center justify-center gap-3 transition-all transform active:scale-[0.98]
                                 ${isPaid 
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
                           ) : (
                              <motion.div 
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                className="bg-green-500/10 border border-green-500/20 rounded-xl p-6 text-center"
                              >
                                 <div className="w-12 h-12 bg-green-500/20 rounded-full flex items-center justify-center mx-auto text-green-500 mb-3">
                                    <IconCheck size={24} stroke={3} />
                                 </div>
                                 <h4 className="font-bold text-white mb-1">Payment Successful</h4>
                                 <p className="text-xs text-white/50 mb-4">Your transaction has been processed.</p>
                                 
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
        </div>
      </div>
    </div>
  );
}
