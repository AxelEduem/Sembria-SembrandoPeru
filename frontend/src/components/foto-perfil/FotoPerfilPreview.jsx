import { memo } from "react";

import { UserRound, X } from "lucide-react";

import EnlargeablePhoto from "@/components/ui/enlargeable-photo";

function FotoPerfilPreview({ previewUrl, selectedFile, loading, onRemove }) {
  return (
    <div className="flex flex-col items-center">
      <div className="relative flex h-36 w-36 items-center justify-center overflow-hidden rounded-full border border-slate-200 bg-slate-50 shadow-sm">
        {previewUrl ? (
          <EnlargeablePhoto
            src={previewUrl}
            alt="Vista previa de la foto de perfil"
            className="h-full w-full rounded-full"
            loading="eager"
          />
        ) : (
          <UserRound className="h-16 w-16 text-slate-300" strokeWidth={1.4} />
        )}

        {previewUrl && !loading && (
          <button
            type="button"
            onClick={onRemove}
            className="absolute top-2 right-2 flex h-8 w-8 items-center justify-center rounded-full border border-white bg-slate-900/75 text-white shadow-sm transition-colors duration-150 hover:bg-slate-900"
            aria-label="Quitar foto"
          >
            <X className="h-4 w-4" strokeWidth={2} />
          </button>
        )}
      </div>

      {selectedFile && (
        <div className="mt-3 text-center">
          <p className="max-w-[280px] truncate text-sm font-medium text-slate-700">
            {selectedFile.name}
          </p>

          <p className="mt-1 text-xs text-slate-400">
            {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
          </p>
        </div>
      )}
    </div>
  );
}

export default memo(FotoPerfilPreview);
