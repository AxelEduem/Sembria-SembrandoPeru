import { memo } from "react";

import { ImagePlus } from "lucide-react";

function FotoPerfilPicker({ selectedFile, loading, onChange }) {
  return (
    <div>
      <input
        id="profile-photo"
        type="file"
        accept="image/jpeg,image/png,image/webp"
        onChange={onChange}
        disabled={loading}
        className="hidden"
      />

      <label
        htmlFor="profile-photo"
        className="flex h-11 w-full cursor-pointer items-center justify-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-4 text-sm font-medium text-slate-700 transition-colors duration-150 hover:border-emerald-300 hover:bg-emerald-50 hover:text-emerald-700"
      >
        <ImagePlus className="h-4 w-4" strokeWidth={1.8} />

        {selectedFile ? "Cambiar foto" : "Seleccionar foto"}
      </label>

      <p className="mt-2 text-center text-xs text-slate-400">JPG, PNG o WebP · maximo 2 MB</p>
    </div>
  );
}

export default memo(FotoPerfilPicker);
