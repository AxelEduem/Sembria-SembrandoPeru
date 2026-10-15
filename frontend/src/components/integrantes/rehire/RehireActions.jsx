import { Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useRehireFormContext } from "@/contexts/RehireFormContext";

export default function RehireActions() {
  const { saving, canManage, navigate } = useRehireFormContext();

  return (
    <div className="flex flex-col gap-3 border-t border-slate-200/80 pt-5 sm:flex-row sm:items-center sm:justify-end">
      <Button
        type="button"
        variant="outline"
        onClick={() => navigate("/integrantes")}
        disabled={saving}
        className="h-11 rounded-xl px-5 text-sm font-semibold"
      >
        Cancelar
      </Button>
      <Button
        type="submit"
        disabled={saving || !canManage}
        className="h-11 min-w-[190px] rounded-xl bg-[#2D5A3D] px-5 text-sm font-semibold text-white shadow-md shadow-[#2D5A3D]/15 hover:bg-[#234B32] disabled:cursor-not-allowed disabled:opacity-60"
      >
        {saving ? (
          <>
            <span className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
            Recontratando...
          </>
        ) : (
          <>
            <Check className="mr-2 h-4 w-4" strokeWidth={2.2} />
            Recontratar integrante
          </>
        )}
      </Button>
    </div>
  );
}