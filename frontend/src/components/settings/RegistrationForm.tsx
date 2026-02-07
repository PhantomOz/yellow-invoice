"use client";

import { useEffect, useState } from "react";
import { useYellowEns } from "@/hooks/useEns";
import { Button } from "@/components/ui/button";
import { IconCheck, IconLoader2, IconX } from "@tabler/icons-react";

interface RegistrationFormProps {
  onSuccess: (name: string) => void;
}

export function RegistrationForm({ onSuccess }: RegistrationFormProps) {
  const [label, setLabel] = useState("");
  const [isAvailable, setIsAvailable] = useState<boolean | null>(null);
  const [isChecking, setIsChecking] = useState(false);
  const [isRegistering, setIsRegistering] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [txHash, setTxHash] = useState<string | null>(null);

  const { checkAvailability, registerSubname } = useYellowEns();

  useEffect(() => {
    if (!label || label.length < 3) {
      setIsAvailable(null);
      return;
    }

    const timer = setTimeout(async () => {
      setIsChecking(true);
      setError(null);
      try {
        const available = await checkAvailability(label);
        setIsAvailable(available);
      } catch (err) {
        setIsAvailable(null);
        setError("Failed to check availability");
      } finally {
        setIsChecking(false);
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [label, checkAvailability]);

  const handleRegister = async () => {
    if (!label || !isAvailable) return;

    setIsRegistering(true);
    setError(null);

    try {
      const hash = await registerSubname(label);
      setTxHash(hash);
      onSuccess(`${label}.yellow.eth`);
    } catch (err: any) {
      setError(err.message || "Registration failed");
    } finally {
      setIsRegistering(false);
    }
  };

  const isValidLabel = label.length >= 3 && /^[a-z0-9-]+$/i.test(label);

  if (txHash) {
    return (
      <div className="bg-neutral-950 border border-neutral-800 rounded-2xl p-8 text-center space-y-4">
        <div className="w-16 h-16 rounded-full bg-green-500/20 flex items-center justify-center mx-auto">
          <IconCheck className="w-8 h-8 text-green-500" />
        </div>
        <div>
          <p className="text-white font-semibold text-lg">
            {label}.yellow.eth
          </p>
          <p className="text-neutral-400 text-sm mt-1">
            Successfully registered!
          </p>
        </div>
        <a
          href={`https://sepolia.basescan.org/tx/${txHash}`}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-block text-cta-60 text-sm hover:underline"
        >
          View transaction →
        </a>
      </div>
    );
  }

  return (
    <div className="bg-neutral-950 border border-neutral-800 rounded-2xl p-6 space-y-6">
      <div className="space-y-4">
        <div className="space-y-2">
          <label className="text-sm text-neutral-400">Choose your name</label>
          <div className="relative">
            <input
              type="text"
              value={label}
              onChange={(e) =>
                setLabel(e.target.value.toLowerCase().replace(/\s/g, ""))
              }
              placeholder="yourname"
              className="w-full bg-neutral-900 border border-neutral-800 rounded-xl px-4 py-3 pr-32 text-white placeholder:text-neutral-600 focus:outline-none focus:border-cta-60 focus:ring-1 focus:ring-cta-60 transition-all"
              disabled={isRegistering}
            />
            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-neutral-500 text-sm">
              .yellow.eth
            </span>
          </div>
          {label && !isValidLabel && (
            <p className="text-red-400 text-xs">
              Name must be at least 3 characters and contain only letters,
              numbers, or hyphens.
            </p>
          )}
        </div>

        {/* Availability indicator */}
        {label && isValidLabel && (
          <div className="flex items-center gap-2 text-sm">
            {isChecking ? (
              <>
                <IconLoader2 className="w-4 h-4 animate-spin text-neutral-400" />
                <span className="text-neutral-400">
                  Checking availability...
                </span>
              </>
            ) : isAvailable === true ? (
              <>
                <IconCheck className="w-4 h-4 text-green-500" />
                <span className="text-green-500">Available!</span>
              </>
            ) : isAvailable === false ? (
              <>
                <IconX className="w-4 h-4 text-red-400" />
                <span className="text-red-400">Already taken</span>
              </>
            ) : null}
          </div>
        )}

        {error && (
          <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3">
            <p className="text-red-400 text-sm">{error}</p>
          </div>
        )}

        <div className="flex items-center justify-between pt-2">
           <div className="text-xs text-neutral-500">
                Registration requires a small fee paid in ETH on Base Sepolia.
           </div>
           <Button
            variant="primary"
            onClick={handleRegister}
            disabled={
                !isValidLabel || !isAvailable || isRegistering || isChecking
            }
            className="min-w-[120px]"
          >
            {isRegistering ? (
              <>
                <IconLoader2 className="w-4 h-4 animate-spin mr-2" />
                Registering...
              </>
            ) : (
              "Register"
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
