import CopyValueButton from "@/components/ui/CopyValueButton";

export default function InfoCard({ icon: Icon, label, value, copyValue, copyLabel }) {
  return (
    <div className="bg-white p-5">
      <div className="flex items-start gap-3">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-slate-50 text-slate-500">
          <Icon className="h-4 w-4" strokeWidth={1.8} />
        </div>
        <div className="min-w-0">
          <p className="text-[11px] font-semibold tracking-wide text-slate-400 uppercase">
            {label}
          </p>
          <div className="mt-1 flex items-start gap-1.5">
            <p className="line-clamp-2 text-sm font-semibold break-words text-slate-700">
              {value || "-"}
            </p>
            {copyValue && (
              <CopyValueButton
                value={copyValue}
                label={copyLabel || label.toLowerCase()}
                className="mt-0.5"
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}