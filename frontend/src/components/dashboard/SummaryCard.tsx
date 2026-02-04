"use client";

import React from "react";
import { Card } from "@/components/shared/Card";

export interface SummaryCardProps {
  label: string;
  value: string;
  icon?: React.ElementType;
}

export const SummaryCard = ({ label, value, icon: Icon }: SummaryCardProps) => (
  <Card className="h-40 flex flex-col justify-between" noHover>
    <div className="flex justify-between items-start">
      {Icon && (
        <div className="p-2 rounded-lg bg-[var(--primary-cta-40)]/10 text-[var(--primary-cta-40)]">
          <Icon size={24} />
        </div>
      )}
    </div>
    <div>
      <h3 className="text-4xl font-semibold mb-2 text-[var(--foreground)] font-sans">
        {value}
      </h3>
      <p className="text-sm text-[var(--muted-foreground)]">{label}</p>
    </div>
  </Card>
);
