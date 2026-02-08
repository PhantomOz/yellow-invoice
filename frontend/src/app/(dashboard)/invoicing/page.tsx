"use client";

import { SectionHeader } from "@/components/shared/SectionHeader";
import { InvoiceTable } from "@/components/invoicing/InvoiceTable";
import { Button } from "@/components/ui/button";
import { IconPlus, IconFileInvoice } from "@tabler/icons-react";
import { useInvoiceModal } from "@/components/invoicing/InvoiceModalContext";
import LoginButton from "@/components/auth/login-button";
import { usePrivy } from "@privy-io/react-auth";

export default function InvoicingPage() {
  const { openModal } = useInvoiceModal();
  const { authenticated } = usePrivy();

  return (
    <>
      <header className="mb-6 md:mb-10 flex flex-col md:flex-row md:items-center justify-between gap-4 md:gap-0">
        <div className="flex items-center gap-2 text-xl md:text-2xl font-semibold">
          <div className="p-2 rounded-lg bg-[var(--primary-cta-40)]/10 text-[var(--primary-cta-40)]">
            <IconFileInvoice size={24} />
          </div>
          <h1>Invoices</h1>
        </div>
        <LoginButton />
      </header>

      <SectionHeader
        title="Recent Invoices"
        description="Manage your invoices and track payments."
        action={
          authenticated ? (
            <Button
              className="bg-[var(--primary-cta-60)] hover:bg-[var(--primary-cta-40)] text-black font-semibold rounded-2xl shadow-[0_0_15px_rgba(253,224,87,0.15)] hover:shadow-[0_0_20px_rgba(253,224,87,0.3)] border-0 cursor-pointer"
              size="default"
              onClick={openModal}
            >
              <IconPlus size={16} className="mr-2" /> Create Invoice
            </Button>
          ) : null
        }
      />

      <div className="mt-8">
        {authenticated ? (
          <InvoiceTable />
        ) : (
          <div className="flex flex-col items-center justify-center py-16 px-4 border border-dashed border-border rounded-xl bg-(--card)/50 text-center">
            <div className="w-16 h-16 rounded-full bg-(--primary-cta-40)/10 flex items-center justify-center mb-4">
              <IconFileInvoice className="w-8 h-8 text-cta-40" />
            </div>
            <h3 className="text-xl font-semibold mb-2">Connect Your Wallet</h3>
            <p className="text-muted-foreground max-w-md mb-6">
              Please connect your wallet to view your invoices and create new ones.
            </p>
          </div>
        )}
      </div>
    </>
  );
}
