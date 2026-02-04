"use client";

import React from "react";
import { SectionHeader } from "@/components/shared/SectionHeader";
import { InvoiceTable } from "@/components/invoicing/InvoiceTable";
import { Button } from "@/components/ui/button";
import { IconPlus, IconFileInvoice } from "@tabler/icons-react";
import { useInvoiceModal } from "@/components/invoicing/InvoiceModalContext";

export default function InvoicingPage() {
  const { openModal } = useInvoiceModal();

  return (
    <>
      <header className="mb-10 flex items-center justify-between">
        <div className="flex items-center gap-2 text-2xl font-semibold">
          <div className="p-2 rounded-lg bg-[var(--primary-cta-40)]/10 text-[var(--primary-cta-40)]">
            <IconFileInvoice size={24} />
          </div>
          <h1>Invoices</h1>
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

      <SectionHeader
        title="Recent Invoices"
        description="Manage your invoices and track payments."
        action={
          <Button
            className="bg-[var(--primary-cta-60)] hover:bg-[var(--primary-cta-40)] text-black font-semibold rounded-2xl shadow-[0_0_15px_rgba(253,224,87,0.15)] hover:shadow-[0_0_20px_rgba(253,224,87,0.3)] border-0 cursor-pointer"
            size="default"
            onClick={openModal}
          >
            <IconPlus size={16} className="mr-2" /> Create Invoice
          </Button>
        }
      />

      <div className="mt-8">
        <InvoiceTable />
      </div>
    </>
  );
}
