/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext } from "react";
import { useIntegranteRehireForm } from "@/hooks/integrantes/useIntegranteRehireForm";

const RehireFormContext = createContext(null);

export function RehireFormProvider({ children }) {
  const form = useIntegranteRehireForm();
  return <RehireFormContext.Provider value={form}>{children}</RehireFormContext.Provider>;
}

export function useRehireFormContext() {
  const context = useContext(RehireFormContext);
  if (!context) {
    throw new Error("useRehireFormContext debe utilizarse dentro de RehireFormProvider.");
  }
  return context;
}
