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
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  return (
    <div className="min-h-screen bg-[var(--background)] flex flex-col md:flex-row font-sans overflow-hidden">
      {/* Mobile Header */}
      <div className="md:hidden h-16 border-b border-[var(--border)] bg-[var(--card)] px-4 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsMobileOpen(true)}
            className="p-2 -ml-2 text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="icon icon-tabler icons-tabler-outline icon-tabler-menu-2"
            >
              <path stroke="none" d="M0 0h24v24H0z" fill="none" />
              <path d="M4 6l16 0" />
              <path d="M4 12l16 0" />
              <path d="M4 18l16 0" />
            </svg>
          </button>
          <span className="font-bold text-lg tracking-tight text-[var(--foreground)]">
            YELLOW INVOICE
          </span>
        </div>
      </div>

      <Sidebar
        isCollapsed={isSidebarCollapsed}
        onToggle={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
        isMobileOpen={isMobileOpen}
        onMobileClose={() => setIsMobileOpen(false)}
      />

      <main className="flex-1 overflow-y-auto h-[calc(100vh-64px)] md:h-screen transition-all duration-300">
        <InvoiceModalProvider>
          <div className="max-w-7xl mx-auto p-4 md:p-8">{children}</div>
        </InvoiceModalProvider>
      </main>
    </div>
  );
}
