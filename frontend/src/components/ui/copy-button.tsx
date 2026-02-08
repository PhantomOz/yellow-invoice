"use client";

import { IconCheck, IconCopy } from "@tabler/icons-react";
import { useCopyToClipboard } from "@/hooks/useCopyToClipboard";
import { cn } from "@/lib/utils";

interface CopyButtonProps {
  text: string;
  className?: string;
  iconSize?: number;
}

export function CopyButton({
  text,
  className,
  iconSize = 16,
}: CopyButtonProps) {
  const { copied, copy } = useCopyToClipboard();

  return (
    <button
      onClick={() => copy(text)}
      className={cn(
        "p-1.5 rounded-md transition-colors",
        className,
      )}
      title="Copy"
    >
      {copied ? (
        <IconCheck size={iconSize} className="text-green-500" />
      ) : (
        <IconCopy size={iconSize} />
      )}
    </button>
  );
}
