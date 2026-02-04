import React from "react";

type Status = "pending" | "paid" | "overdue" | "draft";

interface StatusTrackerProps {
  status: Status;
}

const statusStyles = {
  pending: {
    bg: "bg-[var(--primary-cta-40)]/20",
    text: "text-[var(--primary-cta-40)]",
    border: "border-[var(--primary-cta-40)]/30",
  },
  paid: {
    bg: "bg-emerald-500/20",
    text: "text-emerald-400",
    border: "border-emerald-500/30",
  },
  overdue: {
    bg: "bg-red-500/20",
    text: "text-red-400",
    border: "border-red-500/30",
  },
  draft: {
    bg: "bg-zinc-500/20",
    text: "text-zinc-500",
    border: "border-zinc-500/30",
  },
};

export function StatusTracker({ status }: StatusTrackerProps) {
  const styles = statusStyles[status] || statusStyles.draft;

  return (
    <span
      className={`
        inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border
        ${styles.bg} ${styles.text} ${styles.border}
        backdrop-blur-sm transition-colors duration-200
      `}
    >
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
  );
}
