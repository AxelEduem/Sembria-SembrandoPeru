import {
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";

import {
  uploadAvatar,
} from "@/services/avatarService";

const MAX_FILE_SIZE = 2 * 1024 * 1024;

const ALLOWED_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
];

function validateFile(file) {
  if (!file) {
    return "Selecciona una foto para continuar.";
  }

  if (!ALLOWED_TYPES.includes(file.type)) {
    return "Selecciona una imagen JPG, PNG o WebP.";
  }

  if (file.size > MAX_FILE_SIZE) {
    return "La imagen debe pesar como máximo 2 MB.";
  }

  return "";
}

function useFotoPerfil({
  user,
  refreshProfile,
  onSuccess,
}) {
  const [selectedFile, setSelectedFile] =
    useState(null);

  const [previewUrl, setPreviewUrl] =
    useState("");

  const [loading, setLoading] =
    useState(false);

  const [error, setError] =
    useState("");

  const previewUrlRef = useRef("");

  const revokePreview = useCallback(() => {
    if (previewUrlRef.current) {
      URL.revokeObjectURL(
        previewUrlRef.current
      );

      previewUrlRef.current = "";
    }
  }, []);

  const replacePreview = useCallback(
    (nextUrl) => {
      revokePreview();

      previewUrlRef.current = nextUrl;

      setPreviewUrl(nextUrl);
    },
    [revokePreview]
  );

  useEffect(() => {
    return () => {
      revokePreview();
    };
  }, [revokePreview]);

  const handleFileChange = useCallback(
    (event) => {
      const file =
        event.target.files?.[0];

      if (!file) {
        return;
      }

      setError("");

      const validationError =
        validateFile(file);

      if (validationError) {
        setSelectedFile(null);
        replacePreview("");
        setError(validationError);
        event.target.value = "";
        return;
      }

      const nextPreviewUrl =
        URL.createObjectURL(file);

      replacePreview(nextPreviewUrl);
      setSelectedFile(file);
    },
    [replacePreview]
  );

  const handleRemovePhoto = useCallback(() => {
    if (loading) {
      return;
    }

    setSelectedFile(null);
    replacePreview("");
    setError("");

    const input =
      document.getElementById(
        "profile-photo"
      );

    if (input) {
      input.value = "";
    }
  }, [loading, replacePreview]);

  const handleSubmit = useCallback(
    async (event) => {
      event.preventDefault();

      if (loading) {
        return;
      }

      setError("");

      if (!user?.id) {
        setError(
          "No se pudo identificar al usuario autenticado."
        );
        return;
      }

      const validationError =
        validateFile(selectedFile);

      if (validationError) {
        setError(validationError);
        return;
      }

      setLoading(true);

      try {
        await uploadAvatar(selectedFile);

        const updatedProfile =
          await refreshProfile();

        if (!updatedProfile) {
          throw new Error(
            "La foto se guardó, pero no se pudo actualizar tu perfil."
          );
        }

        if (!updatedProfile.avatar_path) {
          throw new Error(
            "No se pudo confirmar la foto de perfil."
          );
        }

        onSuccess?.();
      } catch (unexpectedError) {
        console.error(
          "Error completando foto de perfil:",
          unexpectedError
        );

        setError(
          unexpectedError?.message ||
            "No se pudo guardar la foto de perfil. Intenta nuevamente."
        );
      } finally {
        setLoading(false);
      }
    },
    [
      loading,
      onSuccess,
      refreshProfile,
      selectedFile,
      user,
    ]
  );

  return {
    selectedFile,
    previewUrl,
    loading,
    error,
    handleFileChange,
    handleRemovePhoto,
    handleSubmit,
  };
}

export default useFotoPerfil;