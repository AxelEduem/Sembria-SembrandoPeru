import { useState } from "react";

import { ActionButton } from "@/components/ui/action-button";

import { changeTemporaryPassword } from "@/services/authService";
import { getPasswordUpdateErrorMessage } from "@/utils/authErrorMessages";

import CambiarPasswordField from "./CambiarPasswordField";

function CambiarPasswordForm({ refreshProfile }) {
  const [password, setPassword] = useState("");

  const [confirmPassword, setConfirmPassword] = useState("");

  const [showPassword, setShowPassword] = useState(false);

  const [loading, setLoading] = useState(false);

  const [error, setError] = useState("");

  function clearError() {
    if (error) {
      setError("");
    }
  }

  function handlePasswordChange(event) {
    setPassword(event.target.value);

    clearError();
  }

  function handleConfirmPasswordChange(event) {
    setConfirmPassword(event.target.value);

    clearError();
  }

  function handleToggleVisibility() {
    setShowPassword((current) => !current);
  }

  async function handleSubmit(event) {
    event.preventDefault();

    if (loading) {
      return;
    }

    setError("");

    if (password.length < 8) {
      setError("La contrasena debe tener al menos 8 caracteres.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Las contrasenas no coinciden.");
      return;
    }

    setLoading(true);

    try {
      await changeTemporaryPassword(password, confirmPassword);

      await refreshProfile();
    } catch (unexpectedError) {
      console.error("Error inesperado cambiando contraseña:", unexpectedError);

      setError(unexpectedError?.message || getPasswordUpdateErrorMessage(unexpectedError));
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <CambiarPasswordField
        id="new-password"
        label="Nueva contrasena"
        value={password}
        onChange={handlePasswordChange}
        showPassword={showPassword}
        onToggleVisibility={handleToggleVisibility}
      />

      <CambiarPasswordField
        id="confirm-password"
        label="Confirmar contrasena"
        value={confirmPassword}
        onChange={handleConfirmPasswordChange}
        showPassword={showPassword}
        onToggleVisibility={handleToggleVisibility}
        error={error === "Las contrasenas no coinciden." ? error : ""}
      />

      {error && error !== "Las contrasenas no coinciden." && (
        <div className="rounded-xl border border-red-100 bg-red-50 px-3.5 py-3 text-sm leading-5 text-red-700">
          {error}
        </div>
      )}

      <ActionButton
        action="save"
        type="submit"
        loading={loading}
        loadingText="Guardando..."
        className="h-11 w-full"
      >
        Guardar contraseña
      </ActionButton>
    </form>
  );
}

export default CambiarPasswordForm;
