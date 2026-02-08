"use client";

import { useEffect, useState } from "react";
import { useYellowEns } from "@/hooks/useEns";
import { Card } from "@/components/shared/Card";
import { Button } from "@/components/ui/button";
import {
  IconLoader2,
  IconWorld,
  IconDeviceFloppy,
  IconPencil,
  IconBrandTwitter,
  IconBrandGithub,
  IconBrandDiscord,
  IconCoin,
  IconLink,
} from "@tabler/icons-react";
import { YTEST_USD_TOKEN } from "@/constants/address";
import { SUPPORTED_CHAINS } from "@/hooks/useYellowChannel";

interface ProfileEditorProps {
  label: string;
}

export function ProfileEditor({ label }: ProfileEditorProps) {
  const { getTextRecord, setTextRecord } = useYellowEns();
  const [loadingFields, setLoadingFields] = useState<Record<string, boolean>>(
    {}
  );
  const [savingField, setSavingField] = useState<string | null>(null);

  const [fields, setFields] = useState({
    url: "",
    "com.twitter": "",
    "com.github": "",
    "com.discord": "",
    settlement_chain: "",
    settlement_token: YTEST_USD_TOKEN,
  });

  const [initialLoaded, setInitialLoaded] = useState(false);

  useEffect(() => {
    async function loadRecords() {
      setLoadingFields((prev) => ({ ...prev, all: true }));
      try {
        const [url, twitter, github, discord, chain] = await Promise.all([
          getTextRecord(label, "url"),
          getTextRecord(label, "com.twitter"),
          getTextRecord(label, "com.github"),
          getTextRecord(label, "com.discord"),
          getTextRecord(label, "settlement_chain"),
        ]);

        setFields({
          url: (url as string) || "",
          "com.twitter": (twitter as string) || "",
          "com.github": (github as string) || "",
          "com.discord": (discord as string) || "",
          settlement_chain: (chain as string) || "",
          settlement_token: YTEST_USD_TOKEN,
        });
      } catch (error) {
        console.error("Failed to load records", error);
      } finally {
        setLoadingFields((prev) => ({ ...prev, all: false }));
        setInitialLoaded(true);
      }
    }
    loadRecords();
  }, [label, getTextRecord]);

  const handleSave = async (key: string, value: string) => {
    setSavingField(key);
    try {
      await setTextRecord(label, key, value);
    } catch (error) {
      console.error(`Failed to save ${key}`, error);
    } finally {
      setSavingField(null);
    }
  };

  const handleChange = (key: keyof typeof fields, value: string) => {
    setFields((prev) => ({ ...prev, [key]: value }));
  };

  if (!initialLoaded && loadingFields.all) {
    return (
      <Card noHover className="bg-neutral-900/50">
        <div className="flex items-center justify-center py-8 text-neutral-400 gap-2">
          <IconLoader2 className="w-5 h-5 animate-spin" />
          <span>Loading profile details...</span>
        </div>
      </Card>
    );
  }

  return (
    <Card noHover className="bg-neutral-900/50">
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-neutral-800 rounded-lg text-white">
            <IconPencil className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-semibold text-white">Public Profile</h2>
            <p className="text-sm text-neutral-400">
              Update your public profile details
            </p>
          </div>
        </div>

        <div className="grid gap-4">
          <div className="space-y-2">
            <h3 className="text-sm font-medium text-white pt-2">Settlement Details</h3>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <label className="text-sm text-neutral-400 flex items-center gap-2">
                  <IconCoin className="w-4 h-4" /> Settlement Token
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={fields.settlement_token}
                    readOnly
                    className="flex-1 bg-neutral-900 border border-neutral-800 rounded-xl px-4 py-3 text-neutral-500 cursor-not-allowed"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm text-neutral-400 flex items-center gap-2">
                  <IconLink className="w-4 h-4" /> Settlement Chain
                </label>
                <div className="flex gap-2">
                  <select
                    value={fields.settlement_chain}
                    onChange={(e) => handleChange("settlement_chain", e.target.value)}
                    className="flex-1 bg-neutral-950 border border-neutral-800 rounded-xl px-4 py-3 text-white placeholder:text-neutral-600 focus:outline-none focus:border-cta-60 focus:ring-1 focus:ring-cta-60 transition-all appearance-none"
                  >
                    <option value="" disabled>Select a chain</option>
                    {SUPPORTED_CHAINS.map((chain) => (
                      <option key={chain.id} value={chain.name}>
                        {chain.name}
                      </option>
                    ))}
                  </select>
                  <Button
                    variant="ghost"
                    className="h-auto aspect-square p-3 border border-neutral-800 hover:bg-neutral-800 hover:text-white text-neutral-400"
                    onClick={() => handleSave("settlement_chain", fields.settlement_chain)}
                    disabled={!!savingField || !fields.settlement_chain}
                  >
                    {savingField === "settlement_chain" ? (
                      <IconLoader2 className="w-5 h-5 animate-spin" />
                    ) : (
                      <IconDeviceFloppy className="w-5 h-5" />
                    )}
                  </Button>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <h3 className="text-sm font-medium text-white pt-2">Social Media</h3>
            <div className="grid gap-4">
              <div className="space-y-2">
                <label className="text-sm text-neutral-400 flex items-center gap-2">
                  <IconWorld className="w-4 h-4" /> Website
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={fields.url}
                    onChange={(e) => handleChange("url", e.target.value)}
                    placeholder="https://your-site.com"
                    className="flex-1 bg-neutral-950 border border-neutral-800 rounded-xl px-4 py-3 text-white placeholder:text-neutral-600 focus:outline-none focus:border-cta-60 focus:ring-1 focus:ring-cta-60 transition-all"
                  />
                  <Button
                    variant="ghost"
                    className="h-auto aspect-square p-3 border border-neutral-800 hover:bg-neutral-800 hover:text-white text-neutral-400"
                    onClick={() => handleSave("url", fields.url)}
                    disabled={!!savingField}
                  >
                    {savingField === "url" ? (
                      <IconLoader2 className="w-5 h-5 animate-spin" />
                    ) : (
                      <IconDeviceFloppy className="w-5 h-5" />
                    )}
                  </Button>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm text-neutral-400 flex items-center gap-2">
                  <IconBrandTwitter className="w-4 h-4" /> Twitter
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={fields["com.twitter"]}
                    onChange={(e) => handleChange("com.twitter", e.target.value)}
                    placeholder="@username"
                    className="flex-1 bg-neutral-950 border border-neutral-800 rounded-xl px-4 py-3 text-white placeholder:text-neutral-600 focus:outline-none focus:border-cta-60 focus:ring-1 focus:ring-cta-60 transition-all"
                  />
                  <Button
                    variant="ghost"
                    className="h-auto aspect-square p-3 border border-neutral-800 hover:bg-neutral-800 hover:text-white text-neutral-400"
                    onClick={() => handleSave("com.twitter", fields["com.twitter"])}
                    disabled={!!savingField}
                  >
                    {savingField === "com.twitter" ? (
                      <IconLoader2 className="w-5 h-5 animate-spin" />
                    ) : (
                      <IconDeviceFloppy className="w-5 h-5" />
                    )}
                  </Button>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm text-neutral-400 flex items-center gap-2">
                  <IconBrandGithub className="w-4 h-4" /> GitHub
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={fields["com.github"]}
                    onChange={(e) => handleChange("com.github", e.target.value)}
                    placeholder="username"
                    className="flex-1 bg-neutral-950 border border-neutral-800 rounded-xl px-4 py-3 text-white placeholder:text-neutral-600 focus:outline-none focus:border-cta-60 focus:ring-1 focus:ring-cta-60 transition-all"
                  />
                  <Button
                    variant="ghost"
                    className="h-auto aspect-square p-3 border border-neutral-800 hover:bg-neutral-800 hover:text-white text-neutral-400"
                    onClick={() => handleSave("com.github", fields["com.github"])}
                    disabled={!!savingField}
                  >
                    {savingField === "com.github" ? (
                      <IconLoader2 className="w-5 h-5 animate-spin" />
                    ) : (
                      <IconDeviceFloppy className="w-5 h-5" />
                    )}
                  </Button>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm text-neutral-400 flex items-center gap-2">
                  <IconBrandDiscord className="w-4 h-4" /> Discord
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={fields["com.discord"]}
                    onChange={(e) => handleChange("com.discord", e.target.value)}
                    placeholder="username"
                    className="flex-1 bg-neutral-950 border border-neutral-800 rounded-xl px-4 py-3 text-white placeholder:text-neutral-600 focus:outline-none focus:border-cta-60 focus:ring-1 focus:ring-cta-60 transition-all"
                  />
                  <Button
                    variant="ghost"
                    className="h-auto aspect-square p-3 border border-neutral-800 hover:bg-neutral-800 hover:text-white text-neutral-400"
                    onClick={() => handleSave("com.discord", fields["com.discord"])}
                    disabled={!!savingField}
                  >
                    {savingField === "com.discord" ? (
                      <IconLoader2 className="w-5 h-5 animate-spin" />
                    ) : (
                      <IconDeviceFloppy className="w-5 h-5" />
                    )}
                  </Button>
                </div>
              </div>
            </div>
          </div>
      </div>
      </div>
    </Card>
  );
}
