import { useState } from "react";
import { Maximize2, UserRound } from "lucide-react";

import PhotoLightbox from "@/components/ui/photo-lightbox";
import { cn } from "@/lib/utils";

export default function EnlargeablePhoto({
  src,
  alt = "Foto de perfil",
  className,
  imageClassName,
  fallbackSrc,
  fallback,
  loading = "lazy",
  interactive = true,
}) {
  const [open, setOpen] = useState(false);
  const [failedSources, setFailedSources] = useState([]);
  const sources = [src, fallbackSrc].filter(
    (source, index, values) => source && values.indexOf(source) === index,
  );
  const resolvedSrc = sources.find((source) => !failedSources.includes(source));

  function handleImageError() {
    if (!resolvedSrc) return;
    setFailedSources((current) =>
      current.includes(resolvedSrc) ? current : [...current, resolvedSrc],
    );
  }

  if (!resolvedSrc) {
    return (
      <span
        role="img"
        aria-label={alt}
        className={cn(
          "flex shrink-0 items-center justify-center overflow-hidden bg-slate-100 text-slate-400",
          className,
        )}
      >
        {fallback ?? <UserRound className="h-1/2 w-1/2" strokeWidth={1.7} />}
      </span>
    );
  }

  if (!interactive) {
    return (
      <span className={cn("block shrink-0 overflow-hidden", className)}>
        <img
          src={resolvedSrc}
          alt={alt}
          className={cn("h-full w-full object-cover", imageClassName)}
          loading={loading}
          onError={handleImageError}
        />
      </span>
    );
  }

  return (
    <>
      <button
        type="button"
        aria-label={`Ampliar ${alt.toLowerCase()}`}
        title="Ver foto ampliada"
        onClick={(event) => {
          event.stopPropagation();
          setOpen(true);
        }}
        className={cn(
          "group/photo relative shrink-0 cursor-zoom-in overflow-hidden focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2 focus-visible:outline-none",
          className,
        )}
      >
        <img
          src={resolvedSrc}
          alt={alt}
          className={cn("h-full w-full object-cover", imageClassName)}
          loading={loading}
          onError={handleImageError}
        />
        <span
          aria-hidden="true"
          className="absolute inset-0 flex items-center justify-center bg-slate-950/35 text-white opacity-0 transition-opacity group-hover/photo:opacity-100 group-focus-visible/photo:opacity-100"
        >
          <Maximize2 className="h-3.5 w-3.5 drop-shadow" strokeWidth={2.25} />
        </span>
      </button>

      <PhotoLightbox
        src={resolvedSrc}
        alt={alt}
        open={open}
        onOpenChange={setOpen}
        onImageError={handleImageError}
      />
    </>
  );
}
