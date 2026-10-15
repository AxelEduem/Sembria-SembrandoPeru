import { AppWindow } from "lucide-react";
import { useState } from "react";

function AplicacionLogo({ aplicacion, compact = false }) {
  const [failedImageUrl, setFailedImageUrl] = useState("");
  const imageUrl = aplicacion?.imagen_url?.trim() || "";

  const sizeClass = compact ? "h-8 w-8 rounded-lg" : "h-10 w-10 rounded-xl";

  if (imageUrl && failedImageUrl !== imageUrl) {
    return (
      <img
        src={imageUrl}
        alt={aplicacion?.nombre || "Aplicación"}
        className={`${sizeClass} shrink-0 border border-slate-200 bg-white object-contain p-1`}
        loading="lazy"
        decoding="async"
        onError={() => setFailedImageUrl(imageUrl)}
      />
    );
  }

  return (
    <div
      className={`flex ${sizeClass} shrink-0 items-center justify-center border border-emerald-100 bg-emerald-50`}
      aria-label={aplicacion?.nombre || "Aplicación"}
    >
      <AppWindow
        className={compact ? "h-4 w-4 text-emerald-700" : "h-5 w-5 text-emerald-700"}
        strokeWidth={1.8}
      />
    </div>
  );
}

export default AplicacionLogo;
