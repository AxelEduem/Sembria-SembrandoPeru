/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext } from "react";
import { useIntegranteDetail } from "@/hooks/integrantes/useIntegranteDetail";

const IntegranteDetailContext = createContext(null);

export function IntegranteDetailProvider({ children }) {
  const detail = useIntegranteDetail();
  return <IntegranteDetailDataProvider value={detail}>{children}</IntegranteDetailDataProvider>;
}

export function IntegranteDetailDataProvider({ children, value }) {
  return (
    <IntegranteDetailContext.Provider value={value}>{children}</IntegranteDetailContext.Provider>
  );
}

export function useIntegranteDetailContext() {
  const context = useContext(IntegranteDetailContext);
  if (!context) {
    throw new Error(
      "useIntegranteDetailContext debe utilizarse dentro de IntegranteDetailProvider.",
    );
  }
  return context;
}
