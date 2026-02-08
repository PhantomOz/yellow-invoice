import { useState } from "react";
import {
  IconUser,
  IconPlus,
  IconTrash,
  IconArrowRight,
  IconArrowLeft,
  IconCheck,
  IconLoader2,
} from "@tabler/icons-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { DatePicker } from "@/components/ui/date-picker";
import { useInvoiceContract } from "@/hooks/useInvoiceContract";
import { useWallets } from "@privy-io/react-auth";
import { baseSepolia } from "viem/chains";

const BASE_SEPOLIA_CHAIN_ID = baseSepolia.id;

export function CreateInvoiceModal({
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose: () => void;
}) {
  const [step, setStep] = useState(1);
  const totalSteps = 3;

  // Form State
  const [clientName, setClientName] = useState("");
  const [issuedDate, setIssuedDate] = useState<Date | undefined>(undefined);
  const [dueDate, setDueDate] = useState<Date | undefined>(undefined);
  const [terms, setTerms] = useState("");
  const [items, setItems] = useState([{ id: 1, desc: "", qty: 1, price: 0 }]);

  // Contract Hook
  const { createInvoice, isLoading, error, isConnected } = useInvoiceContract();
  const { wallets } = useWallets();
  const [txHash, setTxHash] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isSwitchingChain, setIsSwitchingChain] = useState(false);

  // Calculate total from items
  const total = items.reduce((sum, item) => sum + item.qty * item.price, 0);

  // Format services as comma-separated list
  const servicesDescription = items
    .filter((item) => item.desc.trim())
    .map((item) => `${item.desc} (x${item.qty})`)
    .join(", ");

  // Handle form submission to blockchain
  const handleSubmit = async () => {
    if (!isConnected) {
      setSubmitError("Please connect your wallet first");
      return;
    }

    if (!clientName.trim()) {
      setSubmitError("Client name is required");
      return;
    }

    setSubmitError(null);

    // Get the active wallet and check/switch chain
    const wallet = wallets[0];
    if (wallet) {
      try {
        const currentChainId = parseInt(
          wallet.chainId.split(":")[1] || "0",
          10,
        );

        if (currentChainId !== BASE_SEPOLIA_CHAIN_ID) {
          setIsSwitchingChain(true);
          setSubmitError(null);

          await wallet.switchChain(BASE_SEPOLIA_CHAIN_ID);
          setIsSwitchingChain(false);
        }
      } catch (switchError: any) {
        setIsSwitchingChain(false);
        setSubmitError(
          `Failed to switch to: ${switchError.message || "Unknown error"}`,
        );
        return;
      }
    }

    const issuedTimestamp = issuedDate
      ? Math.floor(issuedDate.getTime() / 1000)
      : Math.floor(Date.now() / 1000);
    const dueTimestamp = dueDate
      ? Math.floor(dueDate.getTime() / 1000)
      : issuedTimestamp + 30 * 24 * 60 * 60; // Default: 30 days from issued

    const amountInSmallestUnit = BigInt(Math.round(total * 1_000_000));

    const result = await createInvoice({
      amount: amountInSmallestUnit,
      clientName: clientName.trim(),
      issuedDate: issuedTimestamp,
      dueDate: dueTimestamp,
      terms: terms.trim() || "Net 30",
      services: servicesDescription || "Services",
    });

    if (result) {
      setTxHash(result.hash);
      setTimeout(() => {
        onClose();
        // Reset state
        setStep(1);
        setClientName("");
        setIssuedDate(undefined);
        setDueDate(undefined);
        setTerms("");
        setItems([{ id: 1, desc: "", qty: 1, price: 0 }]);
        setTxHash(null);
      }, 2000);
    }
  };

  if (!isOpen) return null;

  const nextStep = () => setStep((p) => Math.min(p + 1, totalSteps));
  const prevStep = () => setStep((p) => Math.max(p - 1, 1));

  return (
    <Dialog open={isOpen} onOpenChange={(open: boolean) => !open && onClose()}>
      <DialogContent className="sm:max-w-2xl bg-neutral-950 border-neutral-800 rounded-3xl">
        {/* HEADER: Stepper & Title */}
        <div className="flex items-center justify-between px-8 py-6 border-b border-[var(--border)]">
          <div>
            <DialogTitle className="text-lg font-semibold tracking-tight">
              Create Invoice
            </DialogTitle>
            <div className="flex items-center gap-2 mt-2">
              {[1, 2, 3].map((s) => (
                <div key={s} className="flex items-center gap-2">
                  <div
                    className={`h-1.5 rounded-full transition-all duration-300 ${s === step
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
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--muted-foreground)] group-focus-within:text-[var(--primary-cta-60)] transition-colors z-10"
                    size={18}
                  />
                  <Input
                    autoFocus
                    type="text"
                    placeholder="Client Name..."
                    value={clientName}
                    onChange={(e) => setClientName(e.target.value)}
                    className="pl-10 h-11 bg-neutral-900 border-neutral-800"
                  />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-xs text-muted-foreground">
                      Issued Date
                    </label>
                    <DatePicker
                      date={issuedDate}
                      onDateChange={setIssuedDate}
                      placeholder="Select issued date"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs text-muted-foreground">
                      Due Date
                    </label>
                    <DatePicker
                      date={dueDate}
                      onDateChange={setDueDate}
                      placeholder="Select due date"
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
                  value={terms}
                  onChange={(e) => setTerms(e.target.value)}
                />
              </div>
            </div>
          )}

          {/* STEP 2: LINE ITEMS */}
          {step === 2 && (
            <div className="space-y-5 animate-in slide-in-from-right-4 fade-in duration-300">
              <div className="flex justify-between items-center">
                <label className="text-xs uppercase tracking-widest text-[var(--muted-foreground)] font-semibold">
                  Services Rendered
                </label>
                <span className="text-[10px] text-[var(--muted-foreground)] bg-neutral-800 px-2 py-1 rounded">
                  USD
                </span>
              </div>

              {/* Column Headers */}
              <div className="grid grid-cols-12 gap-4 text-xs text-muted-foreground font-medium border-b border-neutral-800 pb-2">
                <div className="col-span-5">Description</div>
                <div className="col-span-2 text-center">Qty</div>
                <div className="col-span-2 text-center">Price</div>
                <div className="col-span-1"></div>
              </div>

              {/* Line Items */}
              <div className="space-y-4 max-h-[280px] overflow-y-auto pr-1 custom-scrollbar">
                {items.map((item, idx) => {
                  const lineTotal = item.qty * item.price;
                  return (
                    <div
                      key={item.id}
                      className="grid grid-cols-12 gap-4 items-center group"
                    >
                      <div className="col-span-5">
                        <Input
                          autoFocus={idx === items.length - 1}
                          placeholder="Service description..."
                          value={item.desc}
                          onChange={(e) =>
                            setItems(
                              items.map((i) =>
                                i.id === item.id
                                  ? { ...i, desc: e.target.value }
                                  : i,
                              ),
                            )
                          }
                          className="bg-neutral-900 border-neutral-800"
                        />
                      </div>
                      <div className="col-span-2">
                        <Input
                          type="number"
                          min="1"
                          placeholder="1"
                          value={item.qty || ""}
                          onChange={(e) =>
                            setItems(
                              items.map((i) =>
                                i.id === item.id
                                  ? { ...i, qty: parseInt(e.target.value) || 1 }
                                  : i,
                              ),
                            )
                          }
                          className="bg-neutral-900 border-neutral-800 text-center font-mono"
                        />
                      </div>
                      <div className="col-span-4 relative">
                        <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">
                          $
                        </span>
                        <Input
                          type="number"
                          min="0"
                          step="0.01"
                          placeholder="0.00"
                          value={item.price || ""}
                          onChange={(e) =>
                            setItems(
                              items.map((i) =>
                                i.id === item.id
                                  ? {
                                    ...i,
                                    price: parseFloat(e.target.value) || 0,
                                  }
                                  : i,
                              ),
                            )
                          }
                          className="bg-neutral-900 border-neutral-800 text-right font-mono pl-6"
                        />
                      </div>
                      <div className="col-span-1 flex justify-center">
                        <button
                          onClick={() => {
                            if (items.length > 1) {
                              setItems(items.filter((i) => i.id !== item.id));
                            }
                          }}
                          disabled={items.length === 1}
                          className="text-muted-foreground hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity disabled:opacity-20 disabled:cursor-not-allowed"
                          aria-label="Remove item"
                        >
                          <IconTrash size={14} />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Add Item Button */}
              <button
                onClick={() =>
                  setItems([
                    ...items,
                    { id: Date.now(), desc: "", qty: 1, price: 0 },
                  ])
                }
                className="text-xs font-semibold text-[var(--primary-cta-40)] flex items-center gap-1.5 hover:underline"
              >
                <IconPlus size={14} /> Add Line Item
              </button>

              {/* Total Section */}
              <div className="flex justify-end pt-4 border-t border-neutral-800">
                <div className="text-right space-y-1">
                  <p className="text-xs text-muted-foreground uppercase tracking-wider">
                    Invoice Total
                  </p>
                  <p className="text-3xl font-mono font-bold text-foreground">
                    $
                    {total.toLocaleString("en-US", {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* STEP 3: REVIEW */}
          {step === 3 && (
            <div className="space-y-6 animate-in slide-in-from-right-4 fade-in duration-300">
              {txHash ? (
                <div className="text-center py-8">
                  <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4 text-green-500 border border-green-500">
                    <IconCheck size={32} stroke={3} />
                  </div>
                  <h3 className="text-xl font-semibold">Invoice Created!</h3>
                  <p className="text-muted-foreground text-sm mt-2 break-all max-w-xs mx-auto">
                    Transaction: {txHash.slice(0, 10)}...{txHash.slice(-8)}
                  </p>
                </div>
              ) : (
                <>
                  {/* Header */}
                  <div className="text-center">
                    <div className="w-14 h-14 bg-[var(--primary-cta-60)]/20 rounded-full flex items-center justify-center mx-auto mb-3 text-[var(--primary-cta-60)] border border-[var(--primary-cta-60)]">
                      <IconCheck size={28} stroke={3} />
                    </div>
                    <h3 className="text-lg font-semibold">Review Invoice</h3>
                    <p className="text-muted-foreground text-sm mt-1">
                      Please review the details before submitting
                    </p>
                  </div>

                  {/* Invoice Details Card */}
                  <div className="bg-neutral-900 rounded-xl border border-neutral-800 overflow-hidden">
                    {/* Client & Dates Section */}
                    <div className="p-4 border-b border-neutral-800">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">
                            Bill To
                          </p>
                          <p className="font-medium">
                            {clientName || "Client Name"}
                          </p>
                        </div>
                        <button
                          onClick={() => setStep(1)}
                          className="text-xs text-[var(--primary-cta-40)] hover:underline"
                        >
                          Edit
                        </button>
                      </div>
                      <div className="grid grid-cols-2 gap-4 mt-3 text-sm">
                        <div>
                          <p className="text-xs text-muted-foreground">
                            Issued
                          </p>
                          <p>
                            {issuedDate
                              ? issuedDate.toLocaleDateString()
                              : "Today"}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">Due</p>
                          <p>
                            {dueDate
                              ? dueDate.toLocaleDateString()
                              : "+30 days"}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Line Items Section */}
                    <div className="p-4 border-b border-neutral-800">
                      <div className="flex justify-between items-center mb-3">
                        <p className="text-xs text-muted-foreground uppercase tracking-wider">
                          Line Items
                        </p>
                        <button
                          onClick={() => setStep(2)}
                          className="text-xs text-[var(--primary-cta-40)] hover:underline"
                        >
                          Edit
                        </button>
                      </div>
                      <div className="space-y-2">
                        {items
                          .filter((i) => i.desc.trim())
                          .map((item) => (
                            <div
                              key={item.id}
                              className="flex justify-between text-sm"
                            >
                              <span className="text-muted-foreground">
                                {item.desc}{" "}
                                <span className="text-xs">(×{item.qty})</span>
                              </span>
                              <span className="font-mono">
                                $
                                {(item.qty * item.price).toLocaleString(
                                  "en-US",
                                  {
                                    minimumFractionDigits: 2,
                                    maximumFractionDigits: 2,
                                  },
                                )}
                              </span>
                            </div>
                          ))}
                        {items.filter((i) => i.desc.trim()).length === 0 && (
                          <p className="text-sm text-muted-foreground italic">
                            No items added
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Total Section */}
                    <div className="p-4 bg-neutral-800/50">
                      <div className="flex justify-between items-center">
                        <span className="font-medium">Total Due</span>
                        <span className="text-xl font-mono font-bold text-[var(--primary-cta-40)]">
                          $
                          {total.toLocaleString("en-US", {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          })}
                        </span>
                      </div>
                    </div>
                  </div>


                  {/* Error Display */}
                  {(submitError || error) && (
                    <p className="text-red-500 text-sm text-center">
                      {submitError || error}
                    </p>
                  )}
                </>
              )}
            </div>
          )}
        </div>

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
              className="shadow-none rounded-full"
            >
              Next Step <IconArrowRight size={16} className="ml-2" />
            </Button>
          ) : (
            <Button
              variant="primary"
              onClick={handleSubmit}
              disabled={isLoading || !!txHash || isSwitchingChain}
              className="shadow-[0_0_20px_rgba(253,224,87,0.3)] px-8 rounded-full"
            >
              {isLoading ? (
                <>
                  <IconLoader2 size={16} className="mr-2 animate-spin" />
                  Creating...
                </>
              ) : isSwitchingChain ? (
                <>
                  <IconLoader2 size={16} className="mr-2 animate-spin" />
                  Switching Network...
                </>
              ) : txHash ? (
                "Done!"
              ) : (
                "Confirm & Send"
              )}
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
