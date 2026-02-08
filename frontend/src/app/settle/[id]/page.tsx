"use client";

import { useParams } from "next/navigation";
import { IconLoader, IconAlertCircle, IconFileInvoice } from "@tabler/icons-react";
import { motion } from "framer-motion";

import { useInvoicePayment } from "@/hooks/useInvoicePayment";
import { InvoiceDetailsCard } from "@/components/settle/InvoiceDetailsCard";
import { PaymentWidget } from "@/components/settle/PaymentWidget";

export default function InvoicePaymentPage() {
  const params = useParams();
  const id = params?.id ? Number(params.id) : null;

  const {
    invoice,
    loadingInvoice,
    invoiceError,
    status,
    errorMsg,
    txHash,
    yellowStatus,
    connect,
    disconnect,
    address,
    isConnected,
    connectYellow,
    disconnectYellow,
    handlePay,
    handleDeposit,
    fetchWalletBalance,
    getLedgerBalances,
    walletBalance,
    ledgerBalance,
    hasEnoughLedgerBalance,
    isLoadingBalance,
    isDepositing,
    selectedChainId,
    setSelectedChainId,
    supportedChains,
    formattedDate,
    formattedAmount,
    isPaid,
    copied,
    copy,
    existingChannelId,
    merchantEns,
  } = useInvoicePayment(id);

  // Helper: Display status
  const getStatusText = () => {
    switch (yellowStatus) {
      case "connecting":
        return "Connecting to Yellow...";
      case "authenticating":
        return "Signing auth...";
      case "authenticated":
        return "Authenticated";
      case "fetching_channels":
        return "Fetching channels...";
      case "creating_channel":
        return "Creating channel...";
      case "channel_created":
        return "Channel created";
      case "creating_session":
        return "Creating session...";
      case "session_created":
        return "Session ready";
      case "sending_payment":
        return "Processing...";
      case "payment_complete":
        return "Complete!";
      case "depositing":
        return "Depositing...";
      case "error":
        return "Error";
      default:
        return "Not connected";
    }
  };

  const isProcessing = [
    "connecting",
    "authenticating",
    "creating_channel",
    "sending_payment",
    "depositing",
  ].includes(yellowStatus);
  const isReady =
    yellowStatus === "channel_created" ||
    yellowStatus === "authenticated" ||
    existingChannelId !== null ||
    yellowStatus === "session_created";

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
        <p className="mt-4 text-neutral-400 text-sm tracking-wider uppercase">
          Loading Invoice...
        </p>
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
          <span className="text-lg font-bold tracking-tight text-white/90">
            Yellow Invoice
          </span>
        </motion.div>

        <div className="w-full grid lg:grid-cols-12 gap-8 lg:gap-12">
          {/* Main Invoice Card (Left) */}
          <InvoiceDetailsCard
            invoice={invoice}
            isPaid={isPaid}
            formattedAmount={formattedAmount}
            formattedDate={formattedDate}
            onCopyAddress={copy}
            copied={copied}
            merchantEns={merchantEns}
          />

          {/* Payment Widget (Right) */}
          <PaymentWidget
            invoice={invoice}
            formattedAmount={formattedAmount}
            isConnected={isConnected}
            address={address}
            connect={connect}
            disconnect={disconnect}
            disconnectYellow={disconnectYellow}
            yellowStatus={yellowStatus}
            selectedChainId={selectedChainId}
            setSelectedChainId={setSelectedChainId}
            supportedChains={supportedChains}
            isProcessing={isProcessing}
            isReady={isReady}
            hasEnoughLedgerBalance={hasEnoughLedgerBalance}
            ledgerBalance={ledgerBalance}
            walletBalance={walletBalance}
            fetchWalletBalance={fetchWalletBalance}
            getLedgerBalances={getLedgerBalances}
            isLoadingBalance={isLoadingBalance}
            handleDeposit={handleDeposit}
            isDepositing={isDepositing}
            handlePay={handlePay}
            status={status}
            isPaid={isPaid}
            txHash={txHash}
            errorMsg={errorMsg}
            connectYellow={connectYellow}
            getStatusText={getStatusText}
          />
        </div>
      </div>
    </div>
  );
}
