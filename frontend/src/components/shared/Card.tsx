import React from "react";

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  className?: string;
  noHover?: boolean;
}

export function Card({
  children,
  className = "",
  noHover = false,
  ...props
}: CardProps) {
  return (
    <div
      className={`
        bg-[var(--card)] border border-[var(--border)] rounded-[2rem] p-5 
        ${!noHover && "transition-all duration-300 hover:border-[var(--primary-cta-40)] hover:shadow-[0_0_20px_rgba(252,208,0,0.1)] group"}
        ${className}
      `}
      {...props}
    >
      {children}
    </div>
  );
}
