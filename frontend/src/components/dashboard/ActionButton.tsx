"use client";

import React from "react";
import { Button } from "@/components/ui/button";

export const ActionButton = ({ children }: { children: React.ReactNode }) => (
  <Button
    className="bg-[var(--primary-cta-60)] hover:bg-[var(--primary-cta-40)] text-black font-semibold rounded-2xl shadow-[0_0_15px_rgba(253,224,87,0.15)] hover:shadow-[0_0_20px_rgba(253,224,87,0.3)] border-0"
    size="default"
  >
    {children}
  </Button>
);
