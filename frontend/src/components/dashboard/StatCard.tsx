import React from "react";
import { Card } from "@/components/shared/Card";

interface StatCardProps {
  title: string;
  subtitle: string;
  children: React.ReactNode;
  icon?: React.ReactNode;
  className?: string;
}

export function StatCard({
  title,
  subtitle,
  children,
  icon,
  className,
}: StatCardProps) {
  return (
    <Card className={`h-full flex flex-col ${className || ""}`}>
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="font-medium text-sm text-[var(--foreground)]">
            {title}
          </h3>
          <p className="text-xs text-[var(--muted-foreground)] mt-1">
            {subtitle}
          </p>
        </div>
        {icon && <div className="text-[var(--primary-cta-60)]">{icon}</div>}
      </div>
      <div className="flex-1">{children}</div>
    </Card>
  );
}

export function StatRowSkeleton() {
  return (
    <div className="space-y-3">
      {[1, 2, 3, 4].map((i) => (
        <div key={i} className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-[var(--muted)]" />
            <div className="h-2 w-24 bg-[var(--muted)] rounded" />
          </div>
          <div className="h-2 w-12 bg-[var(--muted)] rounded" />
        </div>
      ))}
    </div>
  );
}
