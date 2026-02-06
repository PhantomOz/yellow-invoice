import React, { useState } from "react";
import {
  IconUser,
  IconCalendar,
  IconPlus,
  IconTrash,
  IconArrowRight,
  IconArrowLeft,
  IconCheck,
  IconX,
} from "@tabler/icons-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent } from "@/components/ui/dialog";

export function CreateInvoiceModal({
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose: () => void;
}) {
  const [step, setStep] = useState(1);
  const totalSteps = 3;

  // Invoice State
  const [items, setItems] = useState([{ id: 1, desc: "", qty: 1, price: 0 }]);

  if (!isOpen) return null;

  const nextStep = () => setStep((p) => Math.min(p + 1, totalSteps));
  const prevStep = () => setStep((p) => Math.max(p - 1, 1));

  return (
    <Dialog open={isOpen} onOpenChange={(open: boolean) => !open && onClose()}>
      <DialogContent className="w-full h-full sm:h-auto max-w-2xl gap-0 p-0 sm:rounded-[var(--radius)] border-[var(--border)] bg-[var(--card)] overflow-y-auto sm:overflow-visible my-0 sm:my-8 rounded-none">
        {/* HEADER: Stepper & Title */}
        <div className="flex items-center justify-between px-8 py-6 border-b border-[var(--border)]">
          <div>
            <h2 className="text-lg font-semibold tracking-tight">
              Create Invoice
            </h2>
            <div className="flex items-center gap-2 mt-2">
              {[1, 2, 3].map((s) => (
                <div key={s} className="flex items-center gap-2">
                  <div
                    className={`h-1.5 rounded-full transition-all duration-300 ${
                      s === step
                        ? "w-8 bg-[var(--primary-cta-60)] shadow-[0_0_10px_rgba(253,208,0,0.4)]"
                        : s < step
                          ? "w-2 bg-[var(--primary-cta-90)]"
                          : "w-2 bg-[var(--muted)]"
                    }`}
                  />
                </div>
              ))}
              <span className="text-[10px] text-[var(--muted-foreground)] ml-2 uppercase tracking-wider">
                {step === 1 ? "Details" : step === 2 ? "Items" : "Review"}
              </span>
            </div>
          </div>
          {/* Note: DialogContent has a built-in close button, but if we want this specific layout we can keep this or rely on the primitive. 
              The primitive one matches Shadcn. We'll use the one provided by DialogContent automatically.
          */}
        </div>

        {/* BODY: Dynamic Step Content */}
        <div className="px-8 py-8 min-h-[400px]">
          {/* STEP 1: CLIENT & DATES */}
          {step === 1 && (
            <div className="space-y-6 animate-in slide-in-from-right-4 fade-in duration-300">
              <div className="space-y-4">
                <label className="text-xs uppercase tracking-widest text-[var(--muted-foreground)] font-semibold">
                  Client Information
                </label>
                <div className="group relative">
                  <IconUser
                    className="absolute left-3 top-3 text-[var(--muted-foreground)] group-focus-within:text-[var(--primary-cta-60)] transition-colors"
                    size={18}
                  />
                  <input
                    autoFocus
                    type="text"
                    placeholder="Select Client..."
                    className="w-full bg-[var(--muted)]/30 border border-transparent focus:border-[var(--primary-cta-40)] rounded-lg py-3 pl-10 text-sm text-[var(--foreground)] outline-none transition-all placeholder:text-[var(--muted-foreground)]"
                  />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="relative group">
                    <IconCalendar
                      className="absolute left-3 top-3 text-[var(--muted-foreground)] group-focus-within:text-[var(--primary-cta-60)] transition-colors"
                      size={18}
                    />
                    <input
                      type="text"
                      placeholder="Issued Date"
                      className="w-full bg-[var(--muted)]/30 border border-transparent focus:border-[var(--primary-cta-40)] rounded-lg py-3 pl-10 text-sm text-[var(--foreground)] outline-none transition-all"
                      onFocus={(e) => (e.target.type = "date")}
                    />
                  </div>
                  <div className="relative group">
                    <IconCalendar
                      className="absolute left-3 top-3 text-[var(--muted-foreground)] group-focus-within:text-[var(--primary-cta-60)] transition-colors"
                      size={18}
                    />
                    <input
                      type="text"
                      placeholder="Due Date"
                      className="w-full bg-[var(--muted)]/30 border border-transparent focus:border-[var(--primary-cta-40)] rounded-lg py-3 pl-10 text-sm text-[var(--foreground)] outline-none transition-all"
                      onFocus={(e) => (e.target.type = "date")}
                    />
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t border-[var(--border)] border-dashed">
                <label className="text-xs uppercase tracking-widest text-[var(--muted-foreground)] font-semibold mb-3 block">
                  Terms & Notes
                </label>
                <textarea
                  className="w-full bg-[var(--muted)]/30 rounded-lg border border-transparent focus:border-[var(--primary-cta-40)] p-3 text-sm outline-none resize-none h-24"
                  placeholder="e.g. Net 30. Thank you for your business."
                />
              </div>
            </div>
          )}

          {/* STEP 2: LINE ITEMS */}
          {step === 2 && (
            <div className="space-y-6 animate-in slide-in-from-right-4 fade-in duration-300">
              <div className="flex justify-between items-center mb-2">
                <label className="text-xs uppercase tracking-widest text-[var(--muted-foreground)] font-semibold">
                  Services Rendered
                </label>
                <span className="text-[10px] text-[var(--muted-foreground)] bg-[var(--muted)] px-2 py-1 rounded">
                  USD
                </span>
              </div>

              <div className="space-y-3 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                {items.map((item, idx) => (
                  <div
                    key={item.id}
                    className="grid grid-cols-12 gap-3 items-start group"
                  >
                    <div className="col-span-7">
                      <input
                        autoFocus={idx === items.length - 1}
                        placeholder="Description"
                        className="w-full bg-transparent border-b border-[var(--border)] focus:border-[var(--primary-cta-60)] py-2 text-sm outline-none transition-colors"
                      />
                    </div>
                    <div className="col-span-2">
                      <input
                        type="number"
                        placeholder="Qty"
                        className="w-full bg-transparent border-b border-[var(--border)] focus:border-[var(--primary-cta-60)] py-2 text-sm text-right outline-none font-mono"
                      />
                    </div>
                    <div className="col-span-2">
                      <input
                        type="number"
                        placeholder="Price"
                        className="w-full bg-transparent border-b border-[var(--border)] focus:border-[var(--primary-cta-60)] py-2 text-sm text-right outline-none font-mono"
                      />
                    </div>
                    <div className="col-span-1 flex justify-center pt-2">
                      <button
                        onClick={() =>
                          setItems(items.filter((i) => i.id !== item.id))
                        }
                        className="text-[var(--muted-foreground)] hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <IconTrash size={14} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              <button
                onClick={() =>
                  setItems([
                    ...items,
                    { id: Date.now(), desc: "", qty: 1, price: 0 },
                  ])
                }
                className="text-xs font-semibold text-[var(--primary-cta-40)] flex items-center gap-1 hover:underline mt-2"
              >
                <IconPlus size={14} /> Add Item
              </button>

              <div className="flex justify-end pt-6">
                <div className="text-right">
                  <p className="text-xs text-[var(--muted-foreground)]">
                    Estimated Total
                  </p>
                  <p className="text-2xl font-mono font-bold text-[var(--foreground)]">
                    $0.00
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* STEP 3: REVIEW */}
          {step === 3 && (
            <div className="space-y-6 animate-in slide-in-from-right-4 fade-in duration-300 text-center py-8">
              <div className="w-16 h-16 bg-[var(--primary-cta-60)]/20 rounded-full flex items-center justify-center mx-auto mb-4 text-[var(--primary-cta-60)] border border-[var(--primary-cta-60)]">
                <IconCheck size={32} stroke={3} />
              </div>
              <h3 className="text-xl font-semibold">Ready to Send?</h3>
              <p className="text-[var(--muted-foreground)] text-sm max-w-xs mx-auto">
                You are about to send Invoice <strong>#004</strong> to{" "}
                <strong>Acme Corp</strong> for{" "}
                <strong className="text-[var(--primary-cta-40)]">
                  $12,450.00
                </strong>
                .
              </p>

              <div className="bg-[var(--muted)]/30 rounded-lg p-4 text-left text-xs text-[var(--muted-foreground)] max-w-sm mx-auto border border-[var(--border)]">
                <div className="flex justify-between mb-2">
                  <span>Issued</span> <span>Oct 24, 2023</span>
                </div>
                <div className="flex justify-between mb-2">
                  <span>Due</span> <span>Nov 24, 2023</span>
                </div>
                <div className="flex justify-between font-semibold text-[var(--foreground)] border-t border-[var(--border)] pt-2 mt-2">
                  <span>Total Due</span>
                  <span>$12,450.00</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* FOOTER: Navigation Actions */}
        <div className="flex items-center justify-between px-8 py-6 border-t border-[var(--border)] bg-[var(--muted)]/20">
          <Button
            variant="ghost"
            onClick={prevStep}
            disabled={step === 1}
            className={`text-[var(--muted-foreground)] hover:text-white ${step === 1 ? "opacity-0 pointer-events-none" : ""}`}
          >
            <IconArrowLeft size={16} className="mr-2" /> Back
          </Button>

          {step < totalSteps ? (
            <Button
              variant="primary"
              onClick={nextStep}
              className="shadow-none"
            >
              Next Step <IconArrowRight size={16} className="ml-2" />
            </Button>
          ) : (
            <Button
              variant="primary"
              className="shadow-[0_0_20px_rgba(253,224,87,0.3)] px-8"
            >
              Confirm & Send
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
