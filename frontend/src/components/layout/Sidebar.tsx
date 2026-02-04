"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  IconHome,
  IconFileInvoice,
  IconArrowsLeftRight,
  IconBuildingBank,
  IconCreditCard,
  IconReceipt2,
  IconBolt,
  IconSettings,
  IconActivity,
  IconLogout,
  IconChevronLeft,
  IconChevronRight,
} from "@tabler/icons-react";
import { cn } from "@/lib/utils";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
  TooltipProvider,
} from "@/components/ui/tooltip";

const navigation = [
  {
    name: "Dashboard",
    href: "/",
    icon: IconHome,
    className: "sidebar-dashboard",
  },
  {
    name: "Invoicing",
    href: "/invoicing",
    icon: IconFileInvoice,
    className: "sidebar-invoicing",
  },
  // {
  //   name: "Payments",
  //   href: "/payments",
  //   icon: IconArrowsLeftRight,
  //   className: "sidebar-payments",
  // },
  {
    name: "Payroll & Expenses",
    href: "/payroll",
    icon: IconBuildingBank,
    className: "sidebar-payroll",
    comingSoon: true,
  },
  {
    name: "Settings",
    href: "/settings",
    icon: IconSettings,
    className: "sidebar-settings",
  },
];

interface SidebarProps {
  isCollapsed: boolean;
  onToggle: () => void;
}

export function Sidebar({ isCollapsed, onToggle }: SidebarProps) {
  const pathname = usePathname();

  const handleLogout = () => {
    console.log("Logout clicked");
    // Placeholder for actual logout logic
  };

  return (
    <TooltipProvider>
      <div
        className={cn(
          "relative flex flex-col bg-[var(--card)] border border-[var(--border)] transition-all duration-300 ease-in-out shadow-2xl",
          "m-3 rounded-[2rem] h-[calc(100vh-24px)]",
          isCollapsed ? "w-[80px]" : "w-72",
        )}
      >
        {/* Header */}
        <div className="flex h-20 items-center justify-between px-6">
          <div
            className={cn(
              "flex items-center gap-3 overflow-hidden transition-all duration-300",
              isCollapsed ? "w-0 opacity-0" : "w-full opacity-100",
            )}
          >
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[var(--primary-cta-60)] shadow-[0_0_15px_rgba(253,224,87,0.3)]">
              <IconActivity className="h-6 w-6 text-black" />
            </div>
            <span className="font-bold text-lg tracking-tight text-[var(--foreground)] whitespace-nowrap">
              YELLOW INVOICE
            </span>
          </div>
          {isCollapsed && (
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--primary-cta-60)] mx-auto shadow-[0_0_15px_rgba(253,224,87,0.3)]">
              <IconActivity className="h-6 w-6 text-black" />
            </div>
          )}
        </div>

        {/* Navigation */}
        <div className="flex-1 flex flex-col gap-2 px-4 py-4">
          {navigation.map((item) => {
            const isActive = pathname === item.href;
            const linkContent = (
              <Link
                key={item.name}
                href={item.href}
                className={cn(
                  "group flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-medium transition-all duration-200",
                  item.className,
                  isActive
                    ? "bg-[var(--primary-cta-40)]/10 text-[var(--primary-cta-40)] shadow-[inset_0_0_10px_rgba(253,224,87,0.05)] border border-[var(--primary-cta-40)]/20"
                    : "text-[var(--muted-foreground)] hover:bg-white/5 hover:text-[var(--foreground)] border border-transparent",
                  isCollapsed && "justify-center px-0",
                )}
              >
                <item.icon
                  className={cn(
                    "h-5 w-5 shrink-0 transition-colors",
                    isActive
                      ? "text-[var(--primary-cta-40)]"
                      : "text-[var(--muted-foreground)] group-hover:text-[var(--foreground)]",
                  )}
                />
                <span
                  className={cn(
                    "transition-all duration-300 whitespace-nowrap",
                    isCollapsed ? "w-0 opacity-0 hidden" : "w-auto opacity-100",
                  )}
                >
                  {item.name}
                </span>
                {/* Check for comingSoon property which we added to navigation items but TS might complain if not typed. 
                    Actually the array is inferred. But let's check if 'comingSoon' exists.
                    We need to cast item as any or define type. 
                    Let's just use (item as any).comingSoon for simplicity in this artifact.
                */}
                {(item as any).comingSoon && !isCollapsed && (
                  <span className="ml-2 text-[10px] bg-black px-1.5 py-0.5 rounded border border-[var(--border)] text-[var(--muted-foreground)]">
                    Soon
                  </span>
                )}
                {isActive && !isCollapsed && (
                  <div className="ml-auto h-1.5 w-1.5 rounded-full bg-[var(--primary-cta-60)] shadow-[0_0_5px_rgba(253,224,87,0.5)]" />
                )}
              </Link>
            );

            if (isCollapsed) {
              return (
                <Tooltip key={item.name} delayDuration={0}>
                  <TooltipTrigger asChild>{linkContent}</TooltipTrigger>
                  <TooltipContent
                    side="right"
                    className="font-medium bg-[var(--card)] text-[var(--foreground)] border-[var(--border)]"
                  >
                    {item.name}
                  </TooltipContent>
                </Tooltip>
              );
            }

            return linkContent;
          })}
        </div>

        {/* Footer */}
        <div className="px-3 py-4 border-t border-[var(--border)]">
          {isCollapsed ? (
            <Tooltip delayDuration={0}>
              <TooltipTrigger asChild>
                <button
                  onClick={handleLogout}
                  className="flex w-full items-center justify-center rounded-xl px-3 py-2.5 text-sm font-medium text-[var(--muted-foreground)] transition-colors hover:bg-white/5 hover:text-[var(--foreground)]"
                >
                  <IconLogout className="h-5 w-5" />
                </button>
              </TooltipTrigger>
              <TooltipContent
                side="right"
                className="font-medium bg-[var(--card)] text-[var(--foreground)] border-[var(--border)]"
              >
                Logout
              </TooltipContent>
            </Tooltip>
          ) : (
            <button
              onClick={handleLogout}
              className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-[var(--muted-foreground)] transition-colors hover:bg-white/5 hover:text-[var(--foreground)]"
            >
              <IconLogout className="h-5 w-5" />
              <span>Logout</span>
            </button>
          )}
        </div>

        {/* Collapse Toggle */}
        <button
          onClick={onToggle}
          className="absolute -right-3 top-20 flex h-6 w-6 items-center justify-center rounded-full border border-[var(--border)] bg-[var(--card)] text-[var(--muted-foreground)] shadow-md transition-colors hover:bg-[var(--primary-cta-40)] hover:text-black hover:border-[var(--primary-cta-40)]"
        >
          {isCollapsed ? (
            <IconChevronRight className="h-3.5 w-3.5" />
          ) : (
            <IconChevronLeft className="h-3.5 w-3.5" />
          )}
        </button>
      </div>
    </TooltipProvider>
  );
}
