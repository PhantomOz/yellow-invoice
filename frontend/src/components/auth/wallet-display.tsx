"use client";

import { useEffect, useState } from "react";
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card";
import { Button } from "@/components/ui/button";
import {
  IconWallet,
  IconHome,
  IconLogout,
  IconSparkles,
} from "@tabler/icons-react";
import { usePrivy } from "@privy-io/react-auth";
import { UserPill } from "@privy-io/react-auth/ui";
import { useBalance } from "wagmi";
import Link from "next/link";
import { useYellowEns } from "@/hooks/useEns";
import EnsRegistrationModal from "./ens-registration-modal";

export default function WalletDisplay() {
  const { user, logout } = usePrivy();
  const { getRegisteredName, checkHasSubname } = useYellowEns();
  const [ensName, setEnsName] = useState<string | null>(null);
  const [hasSubname, setHasSubname] = useState(false);
  const [showRegistrationModal, setShowRegistrationModal] = useState(false);

  const walletAddress = user?.wallet?.address;
  const email = user?.email?.address || user?.google?.email;
  const truncatedAddress = `${walletAddress?.slice(
    0,
    6,
  )}...${walletAddress?.slice(-4)}`;

  // Fetch ENS name for the wallet
  useEffect(() => {
    async function fetchEnsName() {
      if (!walletAddress) return;

      const hasName = await checkHasSubname(walletAddress);
      setHasSubname(hasName);

      if (hasName) {
        const name = await getRegisteredName(walletAddress);
        if (name) {
          setEnsName(`${name}.yellow.eth`);
        }
      }
    }

    fetchEnsName();
  }, [walletAddress, checkHasSubname, getRegisteredName]);

  // Display name: ENS name if available, otherwise truncated address
  const displayName = ensName || truncatedAddress;

  // Fetch ETH balance
  const { data: balanceData, isLoading } = useBalance({
    address: walletAddress as `0x${string}`,
  });

  // Format the balance
  const formattedBalance = balanceData
    ? `${parseFloat(balanceData.formatted).toFixed(5)} ${balanceData.symbol}`
    : "0.00000 ETH";

  const handleRegistrationSuccess = (name: string) => {
    setEnsName(name);
    setHasSubname(true);
  };

  return (
    <>
      <style jsx global>{`
        [data-radix-popper-content-wrapper],
        [role="dialog"],
        .privy-modal,
        [data-privy-modal] {
          z-index: 100 !important;
        }

        /* Remove UserPill background */
        [data-privy-user-pill] button {
          background: transparent !important;
        }
      `}</style>

      <HoverCard>
        <HoverCardTrigger asChild>
          <Button
            variant="ghost"
            className="bg-neutral-900 py-5 px-2 pr-5 flex items-center gap-2 text-white hover:bg-white/10 cursor-pointer rounded-full border border-white/10"
          >
            <div className="w-8 h-8 rounded-full bg-cta-60 flex items-center justify-center"></div>
            <span className="font-mono text-sm">{displayName}</span>
          </Button>
        </HoverCardTrigger>
        <HoverCardContent className="w-80 p-0 bg-black border-neutral-800 text-white rounded-2xl">
          <div className="p-6 space-y-4">
            {/* Email Section */}
            <div className="text-neutral-300 text-sm pb-4 border-b border-neutral-800">
              {email || "No email connected"}
            </div>

            {/* Wallet Balance Card */}
            <div className="flex items-center gap-3 p-4 bg-neutral-900 rounded-2xl border border-neutral-800">
              <div className="w-12 h-12 rounded-full bg-cta-60 flex items-center justify-center shrink-0"></div>
              <div className="flex-1 min-w-0">
                <div className="font-semibold text-white text-base truncate">
                  {displayName}
                </div>
                <div className="text-sm text-neutral-400">
                  {isLoading ? "Loading..." : formattedBalance}
                </div>
                {ensName && (
                  <div className="text-xs text-cta-60 mt-1">
                    {truncatedAddress}
                  </div>
                )}
              </div>
            </div>

            {/* Claim Name CTA - show when user has no subdomain */}
            {!hasSubname && (
              <Button
                variant="primary"
                className="w-full"
                onClick={() => setShowRegistrationModal(true)}
              >
                <IconSparkles className="w-4 h-4 mr-2" />
                Claim Your Yellow Name
              </Button>
            )}

            {/* Menu Items */}
            <div className="space-y-1 pt-2">
              {/* My Wallet - Using Privy UserPill */}
              <div className="cursor-pointer hover:bg-neutral-900 rounded-lg transition-colors [&_.privy-modal]:z-100 [&_[role='dialog']]:z-100 [&_[data-radix-popper-content-wrapper]]:z-100 [&_button]:px-0! [&_button]:bg-transparent! [&_button]:hover:bg-transparent!">
                <UserPill
                  expanded={true}
                  ui={{
                    minimal: false,
                    background: undefined,
                  }}
                  label={
                    <span className="w-full flex items-center gap-3 px-3 py-3 text-left transition-colors duration-150 text-neutral-300">
                      <IconWallet className="w-5 h-5" />
                      <span className="text-[15px] font-medium">My Wallet</span>
                    </span>
                  }
                />
              </div>

              <MenuItem
                icon={<IconHome className="w-5 h-5" />}
                text="Home Page"
                href="/"
              />
            </div>

            {/* Log Out Button */}
            <div className="pt-2 border-t border-neutral-800">
              <Button
                variant="ghost"
                className="w-full text-neutral-300 hover:text-white hover:bg-neutral-900 justify-between px-3 py-3 h-auto rounded-lg cursor-pointer group"
                onClick={() => {
                  logout();
                }}
              >
                <span className="text-[15px]">Log Out</span>
                <IconLogout className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Button>
            </div>
          </div>
        </HoverCardContent>
      </HoverCard>

      {/* ENS Registration Modal */}
      <EnsRegistrationModal
        open={showRegistrationModal}
        onOpenChange={setShowRegistrationModal}
        onSuccess={handleRegistrationSuccess}
      />
    </>
  );
}

function MenuItem({
  icon,
  text,
  href,
}: {
  icon: React.ReactNode;
  text: string;
  href: string;
}) {
  return (
    <Link href={href}>
      <Button
        variant="ghost"
        className="w-full justify-start text-neutral-300 hover:text-white hover:bg-neutral-900 rounded-lg px-3 py-3 h-auto cursor-pointer"
      >
        {icon}
        <span className="ml-3 text-[15px]">{text}</span>
      </Button>
    </Link>
  );
}
