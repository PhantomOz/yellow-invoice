import React from "react";

interface SectionHeaderProps {
  title: string;
  description: string;
  action?: React.ReactNode;
  children?: React.ReactNode;
}

export function SectionHeader({
  title,
  description,
  action,
  children,
}: SectionHeaderProps) {
  return (
    <div className="mb-6">
      <div className="flex justify-between items-start mb-1">
        <h2 className="text-2xl font-semibold">{title}</h2>
        {action}
      </div>
      <p className="text-sm text-[var(--muted-foreground)] mb-6">
        {description}
      </p>

      {children && (
        <div className="flex items-center gap-4 w-full">{children}</div>
      )}
    </div>
  );
}
