import { Button } from "@/components/ui/button";

import FotoPerfilPicker from "./FotoPerfilPicker";
import FotoPerfilPreview from "./FotoPerfilPreview";

import useFotoPerfil from "@/hooks/useFotoPerfil";

function FotoPerfilForm({ user, refreshProfile, onSuccess }) {
  const {
    selectedFile,
    previewUrl,
    loading,
    error,
    handleFileChange,
    handleRemovePhoto,
    handleSubmit,
  } = useFotoPerfil({
    user,
    refreshProfile,
    onSuccess,
  });

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <FotoPerfilPreview
        previewUrl={previewUrl}
        selectedFile={selectedFile}
        loading={loading}
        onRemove={handleRemovePhoto}
      />

      <FotoPerfilPicker selectedFile={selectedFile} loading={loading} onChange={handleFileChange} />

      {error && (
        <div
          role="alert"
          className="rounded-xl border border-red-100 bg-red-50 px-3.5 py-3 text-sm leading-5 text-red-700"
        >
          {error}
        </div>
      )}

      <Button
        type="submit"
        disabled={loading || !selectedFile}
        className="h-11 w-full rounded-xl bg-emerald-600 text-white shadow-sm transition-all duration-200 hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {loading ? "Guardando foto..." : "Continuar"}
      </Button>
    </form>
  );
}

export default FotoPerfilForm;
