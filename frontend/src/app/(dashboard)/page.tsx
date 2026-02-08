"use client";

import { useEffect, useState, useMemo, useCallback } from "react";
import { SectionHeader } from "@/components/shared/SectionHeader";
import { StatCard } from "@/components/dashboard/StatCard";
import { SummaryCard } from "@/components/dashboard/SummaryCard";
import { ActionButton } from "@/components/dashboard/ActionButton";
import {
  IconHandStop,
  IconChartBar,
  IconPlus,
  IconArrowDownLeft,
  IconClock,
  IconFileInvoice,
  IconArrowUpRight,
  IconReceipt,
  IconWallet,
  IconRefresh,
} from "@tabler/icons-react";
import { useInvoiceModal } from "@/components/invoicing/InvoiceModalContext";
import { useYellowEns } from "@/hooks/useEns";
import { usePrivy, useWallets } from "@privy-io/react-auth";
import LoginButton from "@/components/auth/login-button";
import { useYellowChannel } from "@/hooks/useYellowChannel";

import { useUserInvoices } from "@/hooks/useUserInvoices";
import { useInvoiceContract } from "@/hooks/useInvoiceContract";
import { type Address, createPublicClient, http, formatUnits } from "viem";
import { createWalletClient, custom } from "viem";
import { sepolia, baseSepolia } from "viem/chains";

// ytest.usd token address and ABI for balance check
const YTEST_USD_TOKEN = "0xDB9F293e3898c9E5536A3be1b0C56c89d2b32DEb" as const;
const ERC20_ABI = [
  {
    name: "balanceOf",
    type: "function",
    stateMutability: "view",
    inputs: [{ name: "account", type: "address" }],
    outputs: [{ name: "", type: "uint256" }],
  },
] as const;

export default function Home() {
  const { openModal } = useInvoiceModal();
  const { getRegisteredName, checkHasSubname } = useYellowEns();
  const { user, authenticated } = usePrivy();
  const { wallets } = useWallets();
  const [ensName, setEnsName] = useState<string | null>(null);
  const [walletClient, setWalletClient] = useState<any>(null);

  const walletAddress = user?.wallet?.address as Address | undefined;
  // Fetch invoices where user is the merchant (to get paid)
  const { invoices: merchantInvoices, isLoading: isLoadingMerchant } =
    useUserInvoices(walletAddress || null, "merchant");
  // Fetch invoices where user is the payer (to pay)
  const { invoices: payerInvoices, isLoading: isLoadingPayer } =
    useUserInvoices(walletAddress || null, "payer");

  // Create wallet client when wallet is available
  useEffect(() => {
    async function initWalletClient() {
      const embeddedWallet = wallets.find(
        (w) => w.walletClientType === "privy",
      );
      if (embeddedWallet && walletAddress) {
        try {
          const provider = await embeddedWallet.getEthereumProvider();
          const client = createWalletClient({
            account: walletAddress,
            chain: sepolia,
            transport: custom(provider),
          });
          setWalletClient(client);
        } catch (err) {
          console.error("Error creating wallet client:", err);
        }
      }
    }
    if (authenticated && wallets.length > 0 && walletAddress) {
      initWalletClient();
    }
  }, [authenticated, wallets, walletAddress]);

  // Use Yellow Network hook with 0 allowance for dashboard (view-only mode)
  const {
    status: yellowStatus,
    connect: connectYellow,
    ledgerBalances,
    getLedgerBalances,
    lastPaidInvoiceId,
  } = useYellowChannel(walletClient, walletAddress, "0");

  // Auto-connect to Yellow Network when wallet client is ready
  useEffect(() => {
    if (walletClient && walletAddress && yellowStatus === "idle") {
      console.log(
        "[Dashboard] Auto-connecting to Yellow Network with 0 allowance...",
      );
      connectYellow();
    }
  }, [walletClient, walletAddress, yellowStatus, connectYellow]);

  // Fetch and log ledger balances when authenticated
  useEffect(() => {
    if (yellowStatus === "authenticated") {
      console.log("[Dashboard] Fetching ledger balances...");
      getLedgerBalances();
    }
  }, [yellowStatus, getLedgerBalances]);

  useEffect(() => {
    if (ledgerBalances.length > 0) {
      console.log("[Dashboard] Ledger Balances:", ledgerBalances);
    }
  }, [ledgerBalances]);

  // Hook for contract interaction
  const { markAsPaid } = useInvoiceContract();

  // Auto-mark invoice as paid when Yellow Network detects payment
  useEffect(() => {
    if (lastPaidInvoiceId) {
      console.log(
        "[Dashboard] Auto-marking invoice as paid:",
        lastPaidInvoiceId,
      );
      // Prompt user to sign the transaction to update status on-chain
      markAsPaid(Number(lastPaidInvoiceId)).then((res) => {
        if (res) {
          console.log(
            "[Dashboard] Invoice marked as paid automatically!",
            res.hash,
          );
          // Ideally refresh invoices list here
          window.location.reload(); // Simple refresh to show new status
        }
      });
    }
  }, [lastPaidInvoiceId, markAsPaid]);

  // Wallet balance state
  const [walletBalance, setWalletBalance] = useState<string>("0");
  const [isLoadingBalance, setIsLoadingBalance] = useState(false);

  // Fetch wallet balance for ytest.usd token
  const fetchWalletBalance = useCallback(async () => {
    if (!walletAddress) return;

    setIsLoadingBalance(true);
    try {
      const publicClient = createPublicClient({
        chain: baseSepolia,
        transport: http(),
      });

      const balance = await publicClient.readContract({
        address: YTEST_USD_TOKEN,
        abi: ERC20_ABI,
        functionName: "balanceOf",
        args: [walletAddress],
      });

      // ytest.usd has 6 decimals
      const formatted = formatUnits(balance, 6);
      setWalletBalance(formatted);
    } catch (err) {
      console.error("[Dashboard] Error fetching wallet balance:", err);
    } finally {
      setIsLoadingBalance(false);
    }
  }, [walletAddress]);

  // Fetch wallet balance when wallet is connected
  useEffect(() => {
    if (walletAddress) {
      fetchWalletBalance();
    }
  }, [walletAddress, fetchWalletBalance]);

  // Format ledger balance (raw value is in 6 decimal units)
  const formattedLedgerBalance = useMemo(() => {
    const ytestBalance = ledgerBalances.find(
      (b) => b.asset.toLowerCase() === "ytest.usd",
    );
    if (!ytestBalance) return "0.00";
    const raw = parseFloat(ytestBalance.amount);
    // If value is very large, it's in raw units - divide by 10^6
    let value = raw;
    if (raw > 1000000) {
      value = raw / 1_000_000;
    }
    return value.toLocaleString("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  }, [ledgerBalances]);

  // Calculate top clients from real invoice data
  const topClients = useMemo(() => {
    // Group invoices by client name and sum amounts
    const clientMap = new Map<
      string,
      { name: string; total: number; count: number }
    >();

    merchantInvoices.forEach((invoice) => {
      // Count all clients from invoices
      if (invoice.clientName) {
        const clientKey = invoice.clientName.toLowerCase();
        const amount = Number(invoice.amount) / 1_000_000;

        if (clientMap.has(clientKey)) {
          const existing = clientMap.get(clientKey)!;
          existing.total += amount;
          existing.count += 1;
        } else {
          clientMap.set(clientKey, {
            name: invoice.clientName,
            total: amount,
            count: 1,
          });
        }
      }
    });

    // Convert to array and sort by total amount
    const sortedClients = Array.from(clientMap.values())
      .sort((a, b) => b.total - a.total)
      .slice(0, 4) // Top 4 clients
      .map((client) => ({
        name: client.name,
        amount: client.total.toLocaleString("en-US", {
          style: "currency",
          currency: "USD",
        }),
        initials: client.name.slice(0, 2).toUpperCase(),
        count: client.count,
      }));

    return sortedClients;
  }, [merchantInvoices]);

  // Calculate Merchant Stats (Get Paid)
  const merchantStats = useMemo(() => {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    let received = 0;
    let toReceive = 0;
    let unpaidCount = 0;

    merchantInvoices.forEach((invoice) => {
      const amount = Number(invoice.amount) / 1_000_000;
      const createdDate = new Date(Number(invoice.createdAt) * 1000);
      const isCurrentMonth =
        createdDate.getMonth() === currentMonth &&
        createdDate.getFullYear() === currentYear;

      // Status 1 is Paid, or if settled is true
      if (invoice.status === "1" || invoice.settled) {
        const settledDate = invoice.settledAt
          ? new Date(Number(invoice.settledAt) * 1000)
          : createdDate;

        if (
          settledDate.getMonth() === currentMonth &&
          settledDate.getFullYear() === currentYear
        ) {
          received += amount;
        }
      } else {
        // Status != 1 is Pending/Overdue
        if (isCurrentMonth) {
          toReceive += amount;
        }
        unpaidCount++;
      }
    });

    return {
      received: received.toLocaleString("en-US", {
        style: "currency",
        currency: "USD",
      }),
      toReceive: toReceive.toLocaleString("en-US", {
        style: "currency",
        currency: "USD",
      }),
      unpaidCount,
    };
  }, [merchantInvoices]);

  // Calculate Payer Stats (Pay)
  const payerStats = useMemo(() => {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    let paid = 0;
    let toPay = 0;
    let billsToPayCount = 0;

    payerInvoices.forEach((invoice) => {
      const amount = Number(invoice.amount) / 1_000_000;
      const createdDate = new Date(Number(invoice.createdAt) * 1000);
      const isCurrentMonth =
        createdDate.getMonth() === currentMonth &&
        createdDate.getFullYear() === currentYear;

      // Status 1 is Paid, or if settled is true
      if (invoice.status === "1" || invoice.settled) {
        const settledDate = invoice.settledAt
          ? new Date(Number(invoice.settledAt) * 1000)
          : createdDate;

        if (
          settledDate.getMonth() === currentMonth &&
          settledDate.getFullYear() === currentYear
        ) {
          paid += amount;
        }
      } else {
        // Status != 1 is Pending/Overdue
        if (isCurrentMonth) {
          toPay += amount;
        }
        billsToPayCount++;
      }
    });

    return {
      paid: paid.toLocaleString("en-US", {
        style: "currency",
        currency: "USD",
      }),
      toPay: toPay.toLocaleString("en-US", {
        style: "currency",
        currency: "USD",
      }),
      billsToPayCount,
    };
  }, [payerInvoices]);

  // Calculate Monthly Bar Chart Data
  const getMonthlyData = (invoices: any[], type: "inflows" | "outflows") => {
    const monthlyTotals = new Array(7).fill(0);
    const labels = [];
    const now = new Date();

    // Generate last 7 months labels
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      labels.push(d.toLocaleString("en-US", { month: "short" }));
    }

    invoices.forEach((invoice) => {
      // Only count paid invoices for charts
      if (invoice.status === "1" || invoice.settled) {
        const amount = Number(invoice.amount) / 1_000_000;
        const date = invoice.settledAt
          ? new Date(Number(invoice.settledAt) * 1000)
          : new Date(Number(invoice.createdAt) * 1000);

        // Calculate months difference from now
        const monthsDiff =
          (now.getFullYear() - date.getFullYear()) * 12 +
          (now.getMonth() - date.getMonth());

        if (monthsDiff >= 0 && monthsDiff <= 6) {
          // Index 6 is current month, 0 is 6 months ago
          const index = 6 - monthsDiff;
          monthlyTotals[index] += amount;
        }
      }
    });

    const maxVal = Math.max(...monthlyTotals, 100); // Minimum scale of 100

    return {
      totals: monthlyTotals,
      labels,
      maxVal,
    };
  };

  const inflowsData = useMemo(
    () => getMonthlyData(merchantInvoices, "inflows"),
    [merchantInvoices],
  );
  const outflowsData = useMemo(
    () => getMonthlyData(payerInvoices, "outflows"),
    [payerInvoices],
  );

  // Fetch ENS name for the wallet
  useEffect(() => {
    async function fetchEnsName() {
      if (!walletAddress) return;

      const hasName = await checkHasSubname(walletAddress);
      if (hasName) {
        const name = await getRegisteredName(walletAddress);
        if (name) {
          setEnsName(name);
        }
      }
    }

    fetchEnsName();
  }, [walletAddress, checkHasSubname, getRegisteredName]);

  const displayName = useMemo(() => {
    if (ensName) return ensName;
    if (user?.google?.name) return user.google.name.split(" ")[0];
    if (user?.email?.address) return user.email.address.split("@")[0];
    if (walletAddress)
      return `${walletAddress.slice(0, 6)}...${walletAddress.slice(-4)}`;
    return "there";
  }, [ensName, user?.google?.name, user?.email?.address, walletAddress]);

  return (
    <>
      <header className="mb-6 md:mb-10 flex flex-col md:flex-row md:items-center justify-between gap-4 md:gap-0">
        <div className="flex items-center gap-2 text-xl md:text-2xl font-semibold">
          <span className="text-[var(--primary-cta-40)]">👋</span>
          <h1>Hey {displayName}</h1>
        </div>
        <div className="flex items-center gap-3">
          <LoginButton />
        </div>
      </header>

      {/* BALANCE CARD */}
      {walletAddress && (
        <div className="mb-8 p-6 bg-[var(--card)] border border-white/5 rounded-2xl">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <IconWallet size={20} className="text-[var(--primary-cta-40)]" />
              <span className="text-sm font-medium">Your Balance</span>
            </div>
            <button
              onClick={() => getLedgerBalances()}
              className="flex items-center gap-1 text-xs text-[var(--muted-foreground)] hover:text-white transition-colors"
            >
              <IconRefresh size={14} />
              Refresh
            </button>
          </div>
          <div className="p-4 bg-white/5 rounded-xl">
            <div className="text-xs text-[var(--muted-foreground)] mb-1">
              Ledger Balance
            </div>
            <div className="text-2xl font-bold text-[var(--primary-cta-40)]">
              {formattedLedgerBalance}
              <span className="text-sm font-normal text-[var(--muted-foreground)] ml-1">
                ytest.usd
              </span>
            </div>
            <div className="text-[10px] text-[var(--muted-foreground)] mt-1">
              Yellow Network ledger
            </div>
          </div>
        </div>
      )}

      <section className="mb-16">
        <SectionHeader
          title="Get Paid"
          description="Create invoices and get paid in crypto by your clients."
          action={
            <div onClick={openModal}>
              <ActionButton>
                <IconPlus size={16} /> Create Invoice
              </ActionButton>
            </div>
          }
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 w-full">
            <SummaryCard
              label="Received this month"
              value={merchantStats.received}
              icon={IconArrowDownLeft}
            />
            <SummaryCard
              label="To receive this month"
              value={merchantStats.toReceive}
              icon={IconClock}
            />
            <SummaryCard
              label="Invoices to get paid"
              value={merchantStats.unpaidCount.toString()}
              icon={IconFileInvoice}
            />
          </div>
        </SectionHeader>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <StatCard
            title="Monthly Pay-ins"
            subtitle="Cash Inflows"
            className="col-span-1 lg:col-span-2"
          >
            {merchantInvoices.some((i) => i.status === "1" || i.settled) ? (
              <div className="h-48 flex items-end justify-between gap-2 px-4 py-4">
                {inflowsData.totals.map((total, i) => (
                  <div
                    key={i}
                    className="flex flex-col items-center gap-2 group w-full"
                  >
                    <div className="relative w-full flex justify-center h-32 items-end">
                      <div
                        className="w-full max-w-[40px] bg-[var(--primary-cta-40)] rounded-t-sm transition-all duration-300 group-hover:bg-[var(--primary-cta-60)]"
                        style={{
                          height: `${(total / inflowsData.maxVal) * 100}%`,
                          minHeight: total > 0 ? "4px" : "0",
                        }}
                      >
                        <div className="absolute -top-8 left-1/2 -translate-x-1/2 px-2 py-1 bg-black/80 rounded text-[10px] opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10">
                          $
                          {total.toLocaleString("en-US", {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          })}
                        </div>
                      </div>
                    </div>
                    <span className="text-[10px] text-[var(--muted-foreground)] uppercase">
                      {inflowsData.labels[i]}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="h-32 flex flex-col items-center justify-center text-[var(--muted-foreground)] text-xs rounded-xl bg-white/5 m-4 border border-transparent">
                <IconChartBar className="mb-2 opacity-20" size={32} />
                <p className="opacity-50">No data available</p>
              </div>
            )}
            {!merchantInvoices.some((i) => i.status === "1" || i.settled) && (
              <div className="text-center text-xs text-[var(--muted-foreground)] mt-4">
                <p className="mb-2">Start using the platform for activity.</p>
                <button
                  className="text-[var(--primary-cta-40)] hover:text-[var(--primary-cta-60)] hover:underline font-medium"
                  onClick={openModal}
                >
                  Create a New Invoice
                </button>
              </div>
            )}
          </StatCard>

          <StatCard
            title="Your Top Clients"
            subtitle="By total volume"
            icon={<IconHandStop size={20} />}
          >
            <div className="space-y-1">
              {topClients.length > 0 ? (
                topClients.map((client) => (
                  <div
                    key={client.name}
                    className="flex items-center justify-between py-3 border-b border-white/5 last:border-0 hover:bg-white/5 px-2 rounded-lg transition-colors -mx-2"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-[var(--muted)] flex items-center justify-center text-[10px] font-medium text-[var(--muted-foreground)]">
                        {client.initials}
                      </div>
                      <div className="flex flex-col">
                        <span className="text-sm font-medium">
                          {client.name}
                        </span>
                        <span className="text-xs text-[var(--muted-foreground)]">
                          {client.count} invoice{client.count > 1 ? "s" : ""}
                        </span>
                      </div>
                    </div>
                    <span className="text-sm font-mono text-[var(--muted-foreground)]">
                      {client.amount}
                    </span>
                  </div>
                ))
              ) : (
                <div className="h-24 flex flex-col items-center justify-center text-[var(--muted-foreground)] text-xs">
                  <IconHandStop className="mb-2 opacity-20" size={24} />
                  <p className="opacity-50">No invoice has been created</p>
                </div>
              )}
            </div>
          </StatCard>
        </div>
      </section>
    </>
  );
}
