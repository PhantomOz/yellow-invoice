"use client";

import React, { useState } from "react";
import { Sidebar } from "@/components/layout/Sidebar";

import { InvoiceModalProvider } from "@/components/invoicing/InvoiceModalContext";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  return (
    <div className="min-h-screen bg-[var(--background)] flex font-sans overflow-hidden">
      <Sidebar
        isCollapsed={isSidebarCollapsed}
        onToggle={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
      />

      <main className="flex-1 overflow-y-auto h-screen transition-all duration-300">
        <InvoiceModalProvider>
          <div className="max-w-7xl mx-auto p-8">{children}</div>
        </InvoiceModalProvider>
      </main>
    </div>
  );
}
