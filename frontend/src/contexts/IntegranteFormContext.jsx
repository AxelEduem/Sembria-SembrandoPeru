/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext } from "react";

import { useIntegranteForm } from "@/hooks/integrantes/useIntegranteForm";

const IntegranteFormContext = createContext(null);

export function IntegranteFormProvider({ mode, children }) {
  const form = useIntegranteForm({ mode });

  return <IntegranteFormContext.Provider value={form}>{children}</IntegranteFormContext.Provider>;
}

export function useIntegranteFormContext(required = true) {
  const context = useContext(IntegranteFormContext);

  if (!context && required) {
    throw new Error("useIntegranteFormContext debe utilizarse dentro de IntegranteFormProvider.");
  }

  return context;
}
