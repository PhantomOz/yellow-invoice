"use client";

import { useEffect, useState } from "react";
import { usePrivy } from "@privy-io/react-auth";
import { useYellowEns } from "@/hooks/useEns";
import { Card } from "@/components/shared/Card";
import { CopyButton } from "@/components/ui/copy-button";
import { RegistrationForm } from "@/components/settings/RegistrationForm";
import { ProfileEditor } from "@/components/settings/ProfileEditor";
import {
  IconCheck,
  IconLoader2,
  IconSparkles,
  IconUser,
  IconWallet,
  IconMail,
} from "@tabler/icons-react";

export default function SettingsPage() {
  const { user } = usePrivy();
  const { checkHasSubname, getRegisteredName } = useYellowEns();

  const [ensName, setEnsName] = useState<string | null>(null);
  const [ensLabel, setEnsLabel] = useState<string | null>(null);
  const [hasSubname, setHasSubname] = useState(false);
  const [isLoadingEns, setIsLoadingEns] = useState(true);

  const walletAddress = user?.wallet?.address;
  const email = user?.email?.address || user?.google?.email;

  useEffect(() => {
    async function fetchEnsName() {
      if (!walletAddress) {
        setIsLoadingEns(false);
        return;
      }

      setIsLoadingEns(true);
      try {
        const hasName = await checkHasSubname(walletAddress);
        setHasSubname(hasName);

        if (hasName) {
          const name = await getRegisteredName(walletAddress);
          if (name) {
            setEnsLabel(name as string);
            setEnsName(`${name}.yellow.eth`);
          }
        }
      } catch (e) {
        console.error("Error fetching ENS:", e);
      } finally {
        setIsLoadingEns(false);
      }
    }

    fetchEnsName();
  }, [walletAddress, checkHasSubname, getRegisteredName]);

  return (
    <div className="max-w-4xl space-y-8 p-6">
      <div>
        <h1 className="text-3xl font-bold text-white mb-2">Profile Settings</h1>
        <p className="text-neutral-400">
          Manage your identity and wallet connection.
        </p>
      </div>

      <div className="grid gap-6">
        {/* Account Details Card */}
        <Card noHover className="bg-neutral-900/50">
          <div className="space-y-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-neutral-800 rounded-lg text-white">
                <IconUser className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-white">
                  Account Details
                </h2>
                <p className="text-sm text-neutral-400">
                  Your connected wallet and contact info
                </p>
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div className="p-4 bg-neutral-950 rounded-2xl border border-neutral-800 space-y-2">
                <div className="flex items-center gap-2 text-neutral-400 text-sm">
                  <IconWallet className="w-4 h-4" />
                  <span>Wallet Address</span>
                </div>
                <div className="flex items-center justify-between gap-2">
                  <code className="text-white font-mono text-sm truncate">
                    {walletAddress || "Not connected"}
                  </code>
                  {walletAddress && (
                    <CopyButton
                      text={walletAddress}
                      className="p-2 hover:bg-neutral-800 text-neutral-400 hover:text-white"
                    />
                  )}
                </div>
              </div>

              <div className="p-4 bg-neutral-950 rounded-2xl border border-neutral-800 space-y-2">
                <div className="flex items-center gap-2 text-neutral-400 text-sm">
                  <IconMail className="w-4 h-4" />
                  <span>Email Address</span>
                </div>
                <div className="text-white font-medium truncate">
                  {email || "No email connected"}
                </div>
              </div>
            </div>
          </div>
        </Card>

        {/* ENS Registration/Display Card */}
        <Card noHover className="bg-neutral-900/50">
          <div className="space-y-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-cta-60/10 rounded-lg text-cta-60">
                <IconSparkles className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-white">
                  Yellow Identity
                </h2>
                <p className="text-sm text-neutral-400">
                  Your unique web3 username
                </p>
              </div>
            </div>

            {isLoadingEns ? (
              <div className="flex items-center gap-2 text-neutral-400 py-4">
                <IconLoader2 className="w-5 h-5 animate-spin" />
                <span>Loading identity...</span>
              </div>
            ) : hasSubname && ensName ? (
              <div className="bg-neutral-950 border border-neutral-800 rounded-2xl p-6 flex items-center justify-between">
                <div>
                  <p className="text-sm text-neutral-400 mb-1">
                    Your Yellow Name
                  </p>
                  <p className="text-2xl font-mono text-cta-60">{ensName}</p>
                </div>
                <div className="h-10 w-10 rounded-full bg-green-500/20 flex items-center justify-center">
                  <IconCheck className="w-6 h-6 text-green-500" />
                </div>
              </div>
            ) : (
              <RegistrationForm
                onSuccess={(name) => {
                  const label = name.replace(".yellow.eth", "");
                  setEnsLabel(label);
                  setEnsName(name);
                  setHasSubname(true);
                }}
              />
            )}
          </div>
        </Card>

        {hasSubname && ensLabel && <ProfileEditor label={ensLabel} />}
      </div>
    </div>
  );
}
