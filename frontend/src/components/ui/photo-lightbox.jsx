import { X } from "lucide-react";

import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog";

export default function PhotoLightbox({ src, alt, open, onOpenChange, onImageError }) {
  if (!src) return null;

  const accessibleAlt = alt || "Foto de perfil";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        aria-describedby={undefined}
        showCloseButton={false}
        overlayClassName="bg-slate-950/80 backdrop-blur-sm"
        className="w-fit max-w-[calc(100vw-1.5rem)] border-0 bg-transparent p-0 shadow-none sm:max-w-[calc(100vw-3rem)]"
      >
        <DialogTitle className="sr-only">{accessibleAlt}</DialogTitle>
        <div className="relative overflow-hidden rounded-3xl bg-slate-950 shadow-2xl ring-1 ring-white/20">
          <img
            src={src}
            alt={accessibleAlt}
            className="max-h-[calc(100vh-2rem)] max-w-[calc(100vw-1.5rem)] object-contain sm:max-h-[88vh] sm:max-w-[90vw]"
            onError={onImageError}
          />
          <DialogClose
            aria-label="Cerrar foto ampliada"
            className="absolute top-3 left-3 z-10 inline-flex h-11 items-center justify-center gap-2 rounded-full border border-white/80 bg-white/95 px-3 text-slate-900 shadow-xl backdrop-blur-sm transition hover:scale-105 hover:bg-white focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950 focus-visible:outline-none"
          >
            <X className="h-5 w-5" strokeWidth={2.4} />
            <span className="hidden pr-1 text-xs font-bold sm:inline">Cerrar</span>
          </DialogClose>
        </div>
      </DialogContent>
    </Dialog>
  );
}
