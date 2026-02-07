import React from "react";
import { StatusTracker } from "@/components/shared/StatusTracker";

const invoices = [
  {
    id: "INV-001",
    client: "Acme Corp",
    amount: "$1,200.00",
    status: "paid",
    date: "2023-10-25",
  },
  {
    id: "INV-002",
    client: "Globex Inc",
    amount: "$4,500.00",
    status: "pending",
    date: "2023-10-28",
  },
  {
    id: "INV-003",
    client: "Soylent Corp",
    amount: "$850.00",
    status: "overdue",
    date: "2023-10-15",
  },
  {
    id: "INV-004",
    client: "Initech",
    amount: "$2,300.00",
    status: "draft",
    date: "2023-11-01",
  },
  {
    id: "INV-005",
    client: "Umbrella Corp",
    amount: "$12,000.00",
    status: "paid",
    date: "2023-10-20",
  },
] as const;

export function InvoiceTable() {
  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xl font-semibold">Recent Invoices</h3>
        <button className="text-sm text-[var(--muted-foreground)] hover:text-white transition-colors">
          View All
        </button>
      </div>

      {/* Desktop Table View */}
      <div className="hidden md:block border border-[var(--border)] rounded-[var(--radius)] overflow-hidden bg-[var(--card)]">
        <table className="w-full text-left text-sm">
          <thead className="bg-[var(--muted)] text-[var(--muted-foreground)]">
            <tr>
              <th className="px-6 py-4 font-medium">Invoice ID</th>
              <th className="px-6 py-4 font-medium">Client</th>
              <th className="px-6 py-4 font-medium">Amount</th>
              <th className="px-6 py-4 font-medium">Status</th>
              <th className="px-6 py-4 font-medium text-right">Created</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--border)]">
            {invoices.map((invoice) => (
              <tr
                key={invoice.id}
                className="group hover:bg-white/[0.02] transition-colors"
              >
                <td className="px-6 py-4 font-mono text-[var(--muted-foreground)] group-hover:text-[var(--primary-cta-60)] transition-colors">
                  {invoice.id}
                </td>
                <td className="px-6 py-4 font-medium">{invoice.client}</td>
                <td className="px-6 py-4 font-mono">{invoice.amount}</td>
                <td className="px-6 py-4">
                  <StatusTracker status={invoice.status} />
                </td>
                <td className="px-6 py-4 text-right text-[var(--muted-foreground)] font-mono text-xs">
                  {invoice.date}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile Card View */}
      <div className="md:hidden space-y-4">
        {invoices.map((invoice) => (
          <div
            key={invoice.id}
            className="bg-[var(--card)] border border-[var(--border)] rounded-xl p-4 flex flex-col gap-3"
          >
            <div className="flex justify-between items-start">
              <div>
                <span className="font-mono text-xs text-[var(--muted-foreground)] mb-1 block">
                  {invoice.id}
                </span>
                <span className="font-medium text-base block">
                  {invoice.client}
                </span>
              </div>
              <StatusTracker status={invoice.status} />
            </div>

            <div className="flex justify-between items-end border-t border-[var(--border)] pt-3 mt-1">
              <div className="text-xs text-[var(--muted-foreground)]">
                Created: <span className="font-mono ml-1">{invoice.date}</span>
              </div>
              <div className="font-mono font-medium text-lg">
                {invoice.amount}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
