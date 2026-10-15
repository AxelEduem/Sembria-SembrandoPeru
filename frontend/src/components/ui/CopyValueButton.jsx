import { useState } from "react";
import { Check, Copy } from "lucide-react";

import { cn } from "@/lib/utils";
import { copyToClipboard } from "@/utils/formHelpers";

export default function CopyValueButton({ value, label = "valor", className, ...props }) {
  const [copied, setCopied] = useState(false);

  if (!value) return null;

  async function handleCopy(event) {
    event?.stopPropagation();

    const wasCopied = await copyToClipboard(value);
    if (!wasCopied) return;

    setCopied(true);
    window.setTimeout(() => setCopied(false), 1500);
  }

  return (
    <button
      type="button"
      onClick={handleCopy}
      title={copied ? "Copiado" : `Copiar ${label}`}
      aria-label={`Copiar ${label}`}
      className={cn(
        "shrink-0 rounded-md p-1 transition-colors",
        copied
          ? "text-emerald-600"
          : "text-slate-400 hover:bg-slate-100 hover:text-slate-700",
        className,
      )}
      {...props}
    >
      {copied ? (
        <Check className="h-3.5 w-3.5" strokeWidth={2.2} />
      ) : (
        <Copy className="h-3.5 w-3.5" strokeWidth={1.8} />
      )}
    </button>
  );
}
