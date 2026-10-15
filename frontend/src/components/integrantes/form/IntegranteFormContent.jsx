import { useIntegranteFormContext } from "@/contexts/IntegranteFormContext";

import IntegranteFormTypeSelector from "./IntegranteFormTypeSelector";
import IntegranteFormPersonalSection from "./IntegranteFormPersonalSection";
import IntegranteFormAreaSection from "./IntegranteFormAreaSection";
import IntegranteFormPracticeFields from "./IntegranteFormPracticeFields";
import IntegranteFormPeriodSection from "./IntegranteFormPeriodSection";

function SectionCard({ children }) {
  return (
    <section className="overflow-visible rounded-2xl border border-slate-200 bg-white shadow-sm">
      {children}
    </section>
  );
}

function SectionHeader({ icon, title, description }) {
  return (
    <div className="border-b border-slate-100 px-6 py-5">
      <div className="flex items-center gap-3">
        {icon}

        <div className="min-w-0">
          <h2 className="text-base font-semibold text-slate-900">{title}</h2>

          {description && <p className="mt-1 text-sm leading-5 text-slate-500">{description}</p>}
        </div>
      </div>
    </div>
  );
}

export default function IntegranteFormContent() {
  const { mode, selectedType } = useIntegranteFormContext();
  const showFormFields = mode === "edit" || Boolean(selectedType);

  return (
    <div className="space-y-5">
      {/* =========================================================
          TIPO DE INTEGRANTE (solo en creación)
      ========================================================= */}
      {mode === "create" && (
        <SectionCard>
          <div className="px-6 py-6">
            <IntegranteFormTypeSelector />
          </div>
        </SectionCard>
      )}

      {showFormFields && (
        <div
          key={selectedType || "edit"}
          className="integrante-form-fields-enter space-y-5"
          data-integrante-type={selectedType || undefined}
        >
          {/* =========================================================
          DATOS PERSONALES
      ========================================================= */}
          <IntegranteFormPersonalSection />

          {/* =========================================================
          ÁREA Y CARGO
      ========================================================= */}
          <SectionCard>
            <SectionHeader
              icon={
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-blue-100 bg-blue-50">
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    className="h-5 w-5 text-blue-600"
                    stroke="currentColor"
                    strokeWidth="1.8"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M3 21h18M5 21V9l7-4 7 4v12M9 21v-6h6v6M8 10h.01M12 10h.01M16 10h.01"
                    />
                  </svg>
                </div>
              }
              title="Área y cargo"
              description="Define el área y el cargo que ocupará el integrante."
            />

            <div className="grid gap-5 p-6 sm:grid-cols-2">
              <IntegranteFormAreaSection />
            </div>
          </SectionCard>

          {/* =========================================================
          ACCESOS
      ========================================================= */}
          {/* =========================================================
          DATOS DE PRÁCTICAS
      ========================================================= */}
          <IntegranteFormPracticeFields />

          {/* =========================================================
          PERIODO
      ========================================================= */}
          {
            <SectionCard>
              <SectionHeader
                icon={
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-indigo-100 bg-indigo-50">
                    <svg
                      viewBox="0 0 24 24"
                      fill="none"
                      className="h-5 w-5 text-indigo-600"
                      stroke="currentColor"
                      strokeWidth="1.8"
                    >
                      <rect x="3" y="4" width="18" height="17" rx="2" />

                      <path strokeLinecap="round" d="M16 2v4M8 2v4M3 10h18" />
                    </svg>
                  </div>
                }
                title="Periodo de participación"
                description="Establece las fechas correspondientes al periodo del integrante."
              />

              <div className="grid gap-5 p-6">
                <IntegranteFormPeriodSection />
              </div>
            </SectionCard>
          }
        </div>
      )}
    </div>
  );
}
