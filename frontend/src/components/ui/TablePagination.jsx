import { ChevronLeft, ChevronRight } from "lucide-react";

import { Button } from "@/components/ui/button";

function TablePagination({
  appearance = "default",
  currentPage,
  endRow,
  itemLabel = "registros",
  onNext,
  onPrevious,
  startRow,
  totalItems,
  totalPages,
}) {
  if (totalItems === 0) return null;

  const isAgenda = appearance === "agenda";

  return (
    <div
      className={
        isAgenda
          ? "flex items-center justify-end"
          : "flex flex-col gap-3 border-t border-slate-100 px-5 py-4 sm:flex-row sm:items-center sm:justify-between"
      }
    >
      {!isAgenda && (
        <p className="text-xs font-medium text-slate-500">
          Mostrando {startRow}-{endRow} de {totalItems} {itemLabel}
        </p>
      )}

      <div
        className={`flex items-center ${
          isAgenda
            ? "justify-end gap-1 rounded-full bg-slate-100 p-1"
            : "justify-between gap-2 sm:justify-end"
        }`}
      >
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={onPrevious}
          disabled={currentPage === 1}
          className={
            isAgenda
              ? "h-8 rounded-full border-0 bg-transparent px-3 text-xs shadow-none hover:bg-white"
              : "h-8 rounded-lg px-3 text-xs"
          }
        >
          <ChevronLeft className="h-3.5 w-3.5" strokeWidth={1.8} />
          Anterior
        </Button>

        <span
          className={`inline-flex h-8 items-center justify-center px-3 text-xs font-semibold ${
            isAgenda
              ? "min-w-16 rounded-full bg-emerald-600 text-white shadow-sm"
              : "min-w-20 rounded-lg border border-slate-200 bg-slate-50 text-slate-600"
          }`}
        >
          {currentPage} / {totalPages}
        </span>

        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={onNext}
          disabled={currentPage === totalPages}
          className={
            isAgenda
              ? "h-8 rounded-full border-0 bg-transparent px-3 text-xs shadow-none hover:bg-white"
              : "h-8 rounded-lg px-3 text-xs"
          }
        >
          Siguiente
          <ChevronRight className="h-3.5 w-3.5" strokeWidth={1.8} />
        </Button>
      </div>
    </div>
  );
}

export default TablePagination;
