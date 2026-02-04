"use client";

import React, { createContext, useContext, useState, ReactNode } from "react";
import { CreateInvoiceModal } from "@/components/invoicing/CreateInvoiceModal";

interface InvoiceModalContextType {
  isOpen: boolean;
  openModal: () => void;
  closeModal: () => void;
}

const InvoiceModalContext = createContext<InvoiceModalContextType | undefined>(
  undefined,
);

export function InvoiceModalProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);

  const openModal = () => setIsOpen(true);
  const closeModal = () => setIsOpen(false);

  return (
    <InvoiceModalContext.Provider value={{ isOpen, openModal, closeModal }}>
      {children}
      <CreateInvoiceModal isOpen={isOpen} onClose={closeModal} />
    </InvoiceModalContext.Provider>
  );
}

export function useInvoiceModal() {
  const context = useContext(InvoiceModalContext);
  if (context === undefined) {
    throw new Error(
      "useInvoiceModal must be used within an InvoiceModalProvider",
    );
  }
  return context;
}
