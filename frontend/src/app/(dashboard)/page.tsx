"use client";

import React from "react";
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
} from "@tabler/icons-react";
import { useInvoiceModal } from "@/components/invoicing/InvoiceModalContext";

export default function Home() {
  const { openModal } = useInvoiceModal();
  return (
    <>
      <header className="mb-10 flex items-center justify-between">
        <div className="flex items-center gap-2 text-2xl font-semibold">
          <span className="text-[var(--primary-cta-40)]">👋</span>
          <h1>Hey Jeffrey</h1>
          <span className="text-[var(--muted-foreground)] text-sm font-normal bg-[var(--muted)] px-1.5 rounded-full">
            ?
          </span>
        </div>
        <div className="flex items-center gap-3">
          <div className="text-right">
            <p className="text-xs font-semibold">Jeffrey Owoloko</p>
            <p className="text-[10px] text-[var(--muted-foreground)]">
              jeffowoloko@gmail.com
            </p>
          </div>
          <div className="w-8 h-8 rounded-full bg-[var(--muted)] flex items-center justify-center text-xs font-medium">
            JO
          </div>
        </div>
      </header>

      {/* GET PAID SECTION */}
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
          <div className="grid grid-cols-3 gap-4 w-full">
            <SummaryCard
              label="Received this month"
              value="$0.00"
              icon={IconArrowDownLeft}
            />
            <SummaryCard
              label="To receive this month"
              value="$0.00"
              icon={IconClock}
            />
            <SummaryCard
              label="Invoices to get paid"
              value="0"
              icon={IconFileInvoice}
            />
          </div>
        </SectionHeader>

        <div className="grid grid-cols-3 gap-6">
          <StatCard
            title="Monthly Pay-ins"
            subtitle="Cash Inflows"
            className="col-span-2"
          >
            <div className="h-32 flex flex-col items-center justify-center text-[var(--muted-foreground)] text-xs rounded-xl bg-white/5 m-4 border border-transparent">
              <IconChartBar className="mb-2 opacity-20" size={32} />
              <p className="opacity-50">No data available</p>
            </div>
            <div className="text-center text-xs text-[var(--muted-foreground)] mt-4">
              <p className="mb-2">Start using the platform for activity.</p>
              <button
                className="text-[var(--primary-cta-40)] hover:text-[var(--primary-cta-60)] hover:underline font-medium"
                onClick={openModal}
              >
                Create a New Invoice
              </button>
            </div>
          </StatCard>

          <StatCard
            title="Your Top Clients"
            subtitle="Last 3 months"
            icon={<IconHandStop size={20} />}
          >
            <div className="space-y-1">
              {[
                { name: "Acme Corp", amount: "$12,450.00", initials: "AC" },
                { name: "Globex Inc", amount: "$8,200.00", initials: "GI" },
                {
                  name: "Soylent Corp",
                  amount: "$5,100.00",
                  initials: "SC",
                },
                { name: "Initech", amount: "$3,300.00", initials: "IN" },
              ].map((client) => (
                <div
                  key={client.name}
                  className="flex items-center justify-between py-3 border-b border-white/5 last:border-0 hover:bg-white/5 px-2 rounded-lg transition-colors -mx-2"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-[var(--muted)] flex items-center justify-center text-[10px] font-medium text-[var(--muted-foreground)]">
                      {client.initials}
                    </div>
                    <span className="text-sm font-medium">{client.name}</span>
                  </div>
                  <span className="text-sm font-mono text-[var(--muted-foreground)]">
                    {client.amount}
                  </span>
                </div>
              ))}
            </div>
          </StatCard>
        </div>
      </section>

      {/* PAY SECTION */}
      <section className="bg-[var(--card)] border border-white/5 rounded-[2rem] p-8 mt-12">
        <SectionHeader
          title="Pay"
          description="Invite your partners to invoice you and save time when paying them in crypto."
          action={
            <ActionButton>
              <IconPlus size={16} /> Invite Your Vendors
            </ActionButton>
          }
        >
          <div className="grid grid-cols-3 gap-4 w-full">
            <SummaryCard
              label="Paid this month"
              value="$0.00"
              icon={IconArrowUpRight}
            />
            <SummaryCard
              label="To pay this month"
              value="$0.00"
              icon={IconClock}
            />
            <SummaryCard label="Bills to pay" value="0" icon={IconReceipt} />
          </div>
        </SectionHeader>

        <div className="grid grid-cols-3 gap-6">
          <StatCard
            title="Monthly Payouts"
            subtitle="Cash Outflows"
            className="col-span-2"
          >
            <div className="h-32 flex flex-col items-center justify-center text-[var(--muted-foreground)] text-xs rounded-xl bg-white/5 m-4 border border-transparent">
              <IconChartBar className="mb-2 opacity-20" size={32} />
              <p className="opacity-50">No data available</p>
            </div>
            <div className="text-center text-xs text-[var(--muted-foreground)] mt-4">
              <p className="mb-2">Start using the platform for activity.</p>
              <button className="text-[var(--primary-cta-40)] hover:text-[var(--primary-cta-60)] hover:underline font-medium">
                Invite Vendors
              </button>
            </div>
          </StatCard>

          <StatCard
            title="Your Top Vendors"
            subtitle="Last 3 months"
            icon={<IconHandStop size={20} />}
          >
            <div className="space-y-1">
              {[
                { name: "Acme Corp", amount: "$12,450.00", initials: "AC" },
                { name: "Globex Inc", amount: "$8,200.00", initials: "GI" },
                {
                  name: "Soylent Corp",
                  amount: "$5,100.00",
                  initials: "SC",
                },
                { name: "Initech", amount: "$3,300.00", initials: "IN" },
              ].map((client) => (
                <div
                  key={client.name}
                  className="flex items-center justify-between py-3 border-b border-white/5 last:border-0 hover:bg-white/5 px-2 rounded-lg transition-colors -mx-2"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-[var(--muted)] flex items-center justify-center text-[10px] font-medium text-[var(--muted-foreground)]">
                      {client.initials}
                    </div>
                    <span className="text-sm font-medium">{client.name}</span>
                  </div>
                  <span className="text-sm font-mono text-[var(--muted-foreground)]">
                    {client.amount}
                  </span>
                </div>
              ))}
            </div>
          </StatCard>
        </div>
      </section>
    </>
  );
}
