import {
  CheckCircle2,
  KeyRound,
  LoaderCircle,
  Plus,
  Power,
  RefreshCw,
  Save,
  Send,
  Square,
  Trash2,
  X,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const ACTION_ICONS = {
  activate: CheckCircle2,
  cancel: X,
  confirm: CheckCircle2,
  create: Plus,
  deactivate: Power,
  delete: Trash2,
  finish: Square,
  credentials: KeyRound,
  refresh: RefreshCw,
  save: Save,
  send: Send,
};

const TONE_CLASSES = {
  primary: "bg-[#2D5A3D] text-white hover:bg-[#234B32] focus-visible:ring-emerald-700/20",
  danger: "bg-red-600 text-white hover:bg-red-700 focus-visible:ring-red-600/20",
  warning: "bg-amber-600 text-white hover:bg-amber-700 focus-visible:ring-amber-600/20",
};

function ActionButton({
  action = "confirm",
  tone = "primary",
  loading = false,
  loadingText = "Procesando...",
  icon: Icon = ACTION_ICONS[action],
  className,
  disabled,
  children,
  ...props
}) {
  const isSecondary = action === "cancel";

  return (
    <Button
      variant={isSecondary ? "outline" : "default"}
      className={cn(
        "h-10 min-w-28 gap-2 rounded-xl px-5 text-sm font-semibold shadow-sm",
        isSecondary ? "border-slate-200 bg-white text-slate-700 hover:bg-slate-50" : TONE_CLASSES[tone],
        className,
      )}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      {...props}
    >
      {loading ? (
        <LoaderCircle className="h-4 w-4 animate-spin" aria-hidden="true" />
      ) : Icon ? (
        <Icon className="h-4 w-4" strokeWidth={2} aria-hidden="true" />
      ) : null}
      <span>{loading ? loadingText : children}</span>
    </Button>
  );
}

export { ActionButton };
