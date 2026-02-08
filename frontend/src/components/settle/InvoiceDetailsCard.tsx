import React from "react";
import { motion } from "framer-motion";
import {
  IconBuilding,
  IconCalendar,
  IconReceipt,
  IconCheck,
  IconCopy,
  IconExternalLink,
} from "@tabler/icons-react";
import type { Invoice } from "@/hooks/useInvoiceContract";

interface InvoiceDetailsCardProps {
  invoice: Invoice;
  isPaid: boolean;
  formattedAmount: string;
  formattedDate: string;
  onCopyAddress: (text: string) => void;
  copied: boolean;
  merchantEns?: string | null;
}

export function InvoiceDetailsCard({
  invoice,
  isPaid,
  formattedAmount,
  formattedDate,
  onCopyAddress,
  copied,
  merchantEns,
}: InvoiceDetailsCardProps) {
  return (
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
              #{invoice.id.toString().padStart(6, "0")}
            </p>
          </div>
          <div
            className={`
            px-4 py-1.5 rounded-full text-xs font-bold tracking-wider uppercase border self-start
            ${
              isPaid
                ? "bg-green-500/10 text-green-400 border-green-500/20 shadow-[0_0_15px_-3px_rgba(74,222,128,0.2)]"
                : "bg-yellow-500/10 text-yellow-400 border-yellow-500/20 shadow-[0_0_15px_-3px_rgba(250,204,21,0.2)]"
            }
          `}
          >
            {isPaid ? "Paid in Full" : "Payment Pending"}
          </div>
        </div>

        <div className="mb-10">
          <p className="text-white/50 text-sm mb-2 font-medium">Amount Due</p>
          <div className="flex items-baseline gap-2 text-6xl sm:text-7xl font-bold text-white tracking-tighter">
            <span className="text-white/40 text-4xl sm:text-5xl">$</span>
            {formattedAmount}
            <span className="text-lg sm:text-xl tracking-wide font-medium text-white/40 ml-2">
              ytest.usd
            </span>
          </div>
        </div>

        <div className="grid sm:grid-cols-2 gap-8 pt-8 border-t border-white/5">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2 text-white/40 text-xs uppercase tracking-wider font-semibold">
              <IconBuilding size={14} />
              <span>Bill To</span>
            </div>
            <p className="text-lg font-medium text-white/90">
              {invoice.clientName}
            </p>
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center gap-2 text-white/40 text-xs uppercase tracking-wider font-semibold">
              <IconCalendar size={14} />
              <span>Due Date</span>
            </div>
            <p className="text-lg font-medium text-white/90">
              {formattedDate}
            </p>
          </div>

          <div className="sm:col-span-2 space-y-2">
            <div className="flex items-center gap-2 text-white/40 text-xs uppercase tracking-wider font-semibold">
              <IconReceipt size={14} />
              <span>Merchant Address</span>
            </div>
            <div className="flex items-center gap-3 group/address">
              <div className="font-mono text-sm text-white/70 bg-black/20 px-3 py-2 rounded-lg border border-white/5 truncate max-w-[300px] sm:max-w-full">
                {merchantEns ? (
                  <span className="text-yellow-400 font-bold">{merchantEns}.yellow.eth</span>
                ) : (
                  invoice.merchant
                )}
              </div>
              <button
                onClick={() => onCopyAddress(invoice.merchant)}
                className="p-2 hover:bg-white/10 rounded-lg transition-colors text-white/40 hover:text-white"
                title="Copy Address"
              >
                {copied ? (
                  <IconCheck size={18} className="text-green-400" />
                ) : (
                  <IconCopy size={18} />
                )}
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
  );
}
