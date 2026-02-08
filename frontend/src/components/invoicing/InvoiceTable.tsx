import { StatusTracker } from "@/components/shared/StatusTracker";
import { useUserInvoices } from "@/hooks/useUserInvoices";
import { usePrivy } from "@privy-io/react-auth";
import { type Address } from "viem";
import Link from "next/link";
import { CopyButton } from "@/components/ui/copy-button";

export function InvoiceTable() {
  const { user } = usePrivy();
  const { invoices, isLoading } = useUserInvoices(
    (user?.wallet?.address as Address) || null,
  );

  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xl font-semibold">Recent Invoices</h3>
        <button className="text-sm text-[var(--muted-foreground)] hover:text-white transition-colors">
          View All
        </button>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[var(--primary-cta-40)]"></div>
        </div>
      ) : invoices.length === 0 ? (
        <div className="text-center py-12 border border-dashed border-[var(--border)] rounded-xl">
          <p className="text-[var(--muted-foreground)]">No invoices found</p>
        </div>
      ) : (
        <>
          {/* Desktop Table View */}
          <div className="hidden md:block border border-[var(--border)] rounded-[var(--radius)] overflow-hidden bg-[var(--card)]">
            <table className="w-full text-left text-sm">
                  <thead className="bg-[var(--muted)] text-[var(--muted-foreground)]">
                    <tr>
                      <th className="px-6 py-4 font-medium">Invoice ID</th>
                      <th className="px-6 py-4 font-medium">Created</th>
                      <th className="px-6 py-4 font-medium">Client</th>
                      <th className="px-6 py-4 font-medium">Amount</th>
                      <th className="px-6 py-4 font-medium">Status</th>
                      <th className="px-6 py-4 font-medium">Link</th>
                    </tr>
                  </thead>
              <tbody className="divide-y divide-[var(--border)]">
                {invoices.map((invoice) => {
                  let status: "pending" | "paid" | "overdue" | "draft" =
                    "pending";
                  if (invoice.status === "1") status = "paid";
                  if (invoice.status === "2") status = "overdue";

                  // Format Amount (Assuming USDC 6 decimals)
                  const formattedAmount = (
                    Number(invoice.amount) / 1_000_000
                  ).toLocaleString("en-US", {
                    style: "currency",
                    currency: "USD",
                  });

                  // Format Date
                  const date = new Date(
                    Number(invoice.createdAt) * 1000,
                  ).toLocaleDateString();

                  return (
                    <tr
                      key={invoice.id}
                      className="group hover:bg-white/[0.02] transition-colors"
                    >
                      <td className="px-6 py-4 font-mono text-[var(--muted-foreground)] group-hover:text-[var(--primary-cta-60)] transition-colors">
                        #{invoice.internal_id || invoice.id.slice(0, 8)}
                      </td>
                      <td className="px-6 py-4 text-[var(--muted-foreground)] font-mono text-xs">
                        {date}
                      </td>
                      <td className="px-6 py-4 font-medium">
                        {invoice.clientName}
                      </td>
                      <td className="px-6 py-4 font-mono">{formattedAmount}</td>
                      <td className="px-6 py-4">
                        <StatusTracker status={status} />
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <Link
                            href={`/settle/${invoice.internal_id || invoice.id}`}
                            className="hover:underline"
                          >
                            <code className="text-xs bg-black/20 px-2 py-1 rounded text-muted-foreground max-w-[150px] truncate block">
                              {typeof window !== "undefined"
                                ? `${window.location.origin}/settle/${invoice.internal_id || invoice.id}`
                                : `/settle/${invoice.internal_id || invoice.id}`}
                            </code>
                          </Link>
                          <CopyButton
                            text={
                              typeof window !== "undefined"
                                ? `${window.location.origin}/settle/${invoice.internal_id || invoice.id}`
                                : ""
                            }
                            className="hover:bg-white/10 text-[var(--muted-foreground)] hover:text-white"
                          />
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Mobile Card View */}
          <div className="md:hidden space-y-4">
            {invoices.map((invoice) => {
              let status: "pending" | "paid" | "overdue" | "draft" = "pending";
              if (invoice.status === "1") status = "paid";
              if (invoice.status === "2") status = "overdue";

              const formattedAmount = (
                Number(invoice.amount) / 1_000_000
              ).toLocaleString("en-US", {
                style: "currency",
                currency: "USD",
              });

              const date = new Date(
                Number(invoice.createdAt) * 1000,
              ).toLocaleDateString();

              return (
                <div
                  key={invoice.id}
                  className="bg-[var(--card)] border border-[var(--border)] rounded-xl p-4 flex flex-col gap-3"
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <span className="font-mono text-xs text-[var(--muted-foreground)] mb-1 block">
                       
                          #{invoice.internal_id || invoice.id.slice(0, 8)}
                      
                      </span>
                      <div className="flex items-center gap-2 mb-2">
                      <Link
                          href={`/settle/${invoice.internal_id || invoice.id}`}
                          className="hover:underline hover:text-[var(--primary-cta-60)]"
                        >
                        <code className="text-[10px] bg-black/20 px-2 py-1 rounded text-[var(--muted-foreground)] max-w-[150px] truncate block">
                          {typeof window !== "undefined"
                            ? `${window.location.origin}/settle/${invoice.internal_id || invoice.id}`
                            : `/settle/${invoice.internal_id || invoice.id}`}
                        </code>
                        </Link>
                        <CopyButton
                          text={
                            typeof window !== "undefined"
                              ? `${window.location.origin}/settle/${invoice.internal_id || invoice.id}`
                              : ""
                          }
                          className="hover:bg-white/10 text-[var(--muted-foreground)] hover:text-white"
                        />
                      </div>
                      <span className="font-medium text-base block">
                        {invoice.clientName}
                      </span>
                    </div>
                    <StatusTracker status={status} />
                  </div>

                  <div className="flex justify-between items-end border-t border-[var(--border)] pt-3 mt-1">
                    <div className="text-xs text-[var(--muted-foreground)]">
                      Created: <span className="font-mono ml-1">{date}</span>
                    </div>
                    <div className="font-mono font-medium text-lg">
                      {formattedAmount}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
