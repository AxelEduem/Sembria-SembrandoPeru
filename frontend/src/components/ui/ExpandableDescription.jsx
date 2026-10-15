import { useEffect, useMemo, useRef, useState } from "react";

import { ChevronRight } from "lucide-react";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

import { Button } from "@/components/ui/button";

function ExpandableDescription({
  description,
  recordName,
  lines = 2,
  className = "",
  emptyLabel = "Sin descripción",
}) {
  const [open, setOpen] = useState(false);
  const [measurement, setMeasurement] = useState({ text: "", truncated: false });

  const previewRef = useRef(null);

  const text = String(description || "").trim();

  const clampStyle = useMemo(
    () => ({
      display: "-webkit-box",
      WebkitBoxOrient: "vertical",
      WebkitLineClamp: lines,
      overflow: "hidden",
    }),
    [lines],
  );

  useEffect(() => {
    if (!text) {
      return undefined;
    }

    let frameId = 0;
    let resizeObserver = null;

    function measure() {
      const element = previewRef.current;

      if (!element) {
        return;
      }

      const truncated =
        element.scrollHeight > element.clientHeight + 1;

      setMeasurement({ text, truncated });
    }

    frameId = window.requestAnimationFrame(measure);

    if (
      typeof ResizeObserver !== "undefined" &&
      previewRef.current
    ) {
      resizeObserver = new ResizeObserver(() => {
        window.requestAnimationFrame(measure);
      });

      resizeObserver.observe(previewRef.current);
    }

    window.addEventListener("resize", measure);

    return () => {
      window.cancelAnimationFrame(frameId);
      window.removeEventListener("resize", measure);

      if (resizeObserver) {
        resizeObserver.disconnect();
      }
    };
  }, [text, lines]);

  const isTruncated = measurement.text === text && measurement.truncated;

  if (!text) {
    return (
      <span className="text-sm text-slate-300">
        {emptyLabel}
      </span>
    );
  }

  const preview = (
    <p
      ref={previewRef}
      style={clampStyle}
      className={`min-w-0 max-w-full overflow-hidden text-sm leading-5 break-words text-slate-500 ${className}`}
    >
      {text}
    </p>
  );

  if (!isTruncated) {
    return preview;
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="group block w-full min-w-0 max-w-full rounded-lg px-2 py-1.5 -mx-2 -my-1.5 text-left outline-none transition-colors hover:bg-emerald-50/60 focus-visible:bg-emerald-50/60 focus-visible:ring-2 focus-visible:ring-emerald-500/30 active:bg-emerald-50"
        title={`Ver descripción completa de ${
          recordName || "este registro"
        }`}
        aria-label={`Ver descripción completa de ${
          recordName || "este registro"
        }`}
      >
        {preview}

        <span className="mt-1.5 inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 transition-opacity sm:opacity-0 sm:group-hover:opacity-100">
          Ver más
          <ChevronRight
            className="h-3 w-3 transition-transform group-hover:translate-x-0.5"
            strokeWidth={2}
          />
        </span>
      </button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent
          className="
            w-[calc(100%-1.5rem)]
            max-w-[calc(100%-1.5rem)]
            overflow-hidden
            rounded-2xl
            border
            border-slate-200
            bg-white
            p-0
            shadow-2xl
            sm:w-[calc(100%-2rem)]
            sm:max-w-[640px]
            md:max-w-[700px]
            lg:max-w-[760px]
          "
        >
          <DialogHeader className="border-b border-slate-100 px-4 py-5 sm:px-6 sm:py-6">
            <DialogTitle className="pr-6 text-base font-semibold tracking-tight text-slate-900 sm:text-lg">
              Descripción
            </DialogTitle>

            {recordName && (
              <DialogDescription className="mt-1.5 max-w-full break-words text-xs leading-5 text-slate-500 sm:text-sm">
                {recordName}
              </DialogDescription>
            )}
          </DialogHeader>

          <div className="min-w-0 px-4 py-4 sm:px-6 sm:py-5">
            <div
              className="
                max-h-[55vh]
                min-h-[120px]
                overflow-y-auto
                overflow-x-hidden
                rounded-xl
                border
                border-slate-200
                bg-slate-50/70
                px-4
                py-4
                sm:max-h-[60vh]
                sm:px-5
                sm:py-4
              "
            >
              <p className="whitespace-pre-wrap break-words text-sm leading-6 text-slate-700 sm:text-[15px] sm:leading-7">
                {text}
              </p>
            </div>
          </div>

          <DialogFooter className="border-t border-slate-100 px-4 py-4 sm:px-6 sm:py-5">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              className="h-10 w-full rounded-xl px-5 text-sm font-medium sm:w-auto"
            >
              Cerrar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

export default ExpandableDescription;
