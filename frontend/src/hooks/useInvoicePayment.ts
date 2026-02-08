import { useState, useEffect, useMemo, useCallback } from "react";
import { useInjectedWallet } from "@/hooks/useInjectedWallet";
import { useInvoiceContract, type Invoice } from "@/hooks/useInvoiceContract";
import { useYellowChannel } from "@/hooks/useYellowChannel";
import { useYellowEns } from "@/hooks/useEns";
import { sepolia } from "viem/chains";
import { formatUnits, createPublicClient, http } from "viem";
import { useCopyToClipboard } from "@/hooks/useCopyToClipboard";

export type PaymentStatus = "idle" | "paying" | "success" | "error";

export function useInvoicePayment(id: number | null) {
  // Hooks
  const { connect, disconnect, address, isConnected, walletClient } =
    useInjectedWallet();
  const { getInvoice } = useInvoiceContract();
  const { copied, copy } = useCopyToClipboard();
  const { getRegisteredName } = useYellowEns();

  // State
  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [merchantEns, setMerchantEns] = useState<string | null>(null);
  const [loadingInvoice, setLoadingInvoice] = useState(true);
  const [invoiceError, setInvoiceError] = useState("");

  const [status, setStatus] = useState<PaymentStatus>("idle");
  const [errorMsg, setErrorMsg] = useState("");
  const [txHash, setTxHash] = useState("");

  // Yellow Network Channel Hook
  const {
    status: yellowStatus,
    error: yellowError,
    connect: connectYellow,
    sendPayment,
    selectedChainId,
    setSelectedChainId,
    supportedChains,
    ledgerBalances,
    getLedgerBalances,
    depositToLedger,
    disconnect: disconnectYellow,
    existingChannelId,
  } = useYellowChannel(
    walletClient,
    address,
    invoice ? formatUnits(invoice.amount, 6) : "0",
  );

  // Wallet balance state
  const [walletBalance, setWalletBalance] = useState<string>("0");
  const [isLoadingBalance, setIsLoadingBalance] = useState(false);
  const [isDepositing, setIsDepositing] = useState(false);

  // Constants
  const YTEST_USD_ADDRESS =
    "0xDB9F293e3898c9E5536A3be1b0C56c89d2b32DEb" as const;
  const YTEST_USD_SYMBOL = "ytest.usd";

  // Get ledger balance for ytest.usd (raw value from API is in 6 decimal units)
  const ledgerBalanceRaw = useMemo(() => {
    const balance = ledgerBalances.find(
      (b) => b.asset.toLowerCase() === YTEST_USD_SYMBOL.toLowerCase(),
    );
    return balance?.amount || "0";
  }, [ledgerBalances]);

  // Format ledger balance for display (ytest.usd has 6 decimals)
  const ledgerBalance = useMemo(() => {
    const raw = parseFloat(ledgerBalanceRaw);
    // If the value is very large, it's in raw units - divide by 10^6
    if (raw > 1000000) {
      return (raw / 1_000_000).toString();
    }
    return ledgerBalanceRaw;
  }, [ledgerBalanceRaw]);

  // Check if ledger balance is sufficient
  const hasEnoughLedgerBalance = useMemo(() => {
    if (!invoice) return false;
    return (
      parseFloat(ledgerBalance) >= parseFloat(formatUnits(invoice.amount, 6))
    ); // Invoice amount is BigInt wei/units
  }, [ledgerBalance, invoice]);

  // Fetch wallet balance for ytest.usd token
  const fetchWalletBalance = useCallback(async () => {
    if (!address) return;

    setIsLoadingBalance(true);
    try {
      // Get chain object for selected chain
      const chain =
        supportedChains.find((c) => c.id === selectedChainId)?.chain || sepolia;

      const publicClient = createPublicClient({
        chain,
        transport: http(),
      });

      // ERC20 balanceOf ABI
      const balance = await publicClient.readContract({
        address: YTEST_USD_ADDRESS,
        abi: [
          {
            name: "balanceOf",
            type: "function",
            stateMutability: "view",
            inputs: [{ name: "account", type: "address" }],
            outputs: [{ name: "", type: "uint256" }],
          },
        ],
        functionName: "balanceOf",
        args: [address],
      });

      // ytest.usd has 6 decimals
      setWalletBalance(formatUnits(balance as bigint, 6));
    } catch (err) {
      console.error("Error fetching wallet balance:", err);
      setWalletBalance("0");
    } finally {
      setIsLoadingBalance(false);
    }
  }, [address, selectedChainId, supportedChains]);

  // Fetch ledger balance when authenticated
  useEffect(() => {
    if (
      yellowStatus === "authenticated" ||
      yellowStatus === "session_created" ||
      yellowStatus === "channel_created"
    ) {
      getLedgerBalances();
    }
  }, [yellowStatus, getLedgerBalances]);

  // Fetch wallet balance when address or chain changes
  useEffect(() => {
    if (address) {
      fetchWalletBalance();
    }
  }, [address, selectedChainId, fetchWalletBalance]);

  // Effect: Auto-connect to Yellow Network when wallet is connected
  useEffect(() => {
    if (isConnected && walletClient && address && yellowStatus === "idle") {
      console.log(
        "[Pay] Wallet connected, auto-connecting to Yellow Network...",
      );
      connectYellow();
    }
  }, [isConnected, walletClient, address, yellowStatus, connectYellow]);

  // Handle deposit from wallet to ledger
  const handleDeposit = async () => {
    if (!invoice) return;
    setIsDepositing(true);
    try {
      const amountToDeposit = formatUnits(invoice.amount, 6);

      const txHash = await depositToLedger(amountToDeposit);
      if (txHash) {
        console.log("[Pay] Deposit successful:", txHash);
        // Refresh balances after deposit
        await fetchWalletBalance();
      }
    } catch (err) {
      console.error("[Pay] Deposit failed:", err);
    } finally {
      setIsDepositing(false);
    }
  };

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
          // Try to resolve ENS name for merchant
          try {
              console.log("Resolving ENS for:", data.merchant);
              const name = await getRegisteredName(data.merchant);
              console.log("ENS Result:", name);
              if (name) {
                setMerchantEns(name as string);
              }
          } catch (err) {
              console.error("ENS Resolution failed", err);
          }
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
  }, [id, getInvoice, getRegisteredName]);

  // Execute Pay
  const handlePay = async () => {
    if (!invoice || !address) return;
    setStatus("paying");
    setErrorMsg("");
    setTxHash("");

    try {
      // Use Yellow Network Payment
      console.log("[Pay] Sending payment via Yellow Network...");
      const amountDecimal = formatUnits(invoice.amount, 6);
      await sendPayment(invoice.merchant, amountDecimal);

      // We rely on the hook's status updates, but we can set local success state if needed
      // The hook updates 'yellowStatus' to 'payment_complete'
    } catch (e: any) {
      console.error(e);
      setErrorMsg(e.message || "Payment Failed");
      setStatus("error");
    }
  };

  // Sync Yellow Status with Local Status
  useEffect(() => {
    if (yellowStatus === "payment_complete") {
      setStatus("success");
    } else if (yellowStatus === "error") {
      setStatus("error");
      setErrorMsg(yellowError || "Payment failed");
    } else if (["sending_payment", "creating_session"].includes(yellowStatus)) {
      setStatus("paying");
    }
  }, [yellowStatus, yellowError]);

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

  const isPaid = invoice?.isPaid || status === "success";

  return {
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
  };
}
