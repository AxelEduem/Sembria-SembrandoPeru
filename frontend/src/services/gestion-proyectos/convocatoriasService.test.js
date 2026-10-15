import { describe, expect, it } from "vitest";

import {
  ELIGIBILITY_CRITERIA,
  canStartApproval,
  canStartPostulacion,
  formatConvocatoriaOption,
  getEligibilityResult,
  getEvaluacionesPorFiltro,
  validateConvocatoria,
} from "./convocatoriasService";

function completedEvaluations(tipoFiltro, estado = "cumple") {
  return ELIGIBILITY_CRITERIA.map((criterion) => ({
    criterio_codigo: criterion.codigo,
    tipo_filtro: tipoFiltro,
    estado_revision: estado,
  }));
}

function validForm(overrides = {}) {
  return {
    nombre: "Fondo",
    financiador_nombre: "Entidad",
    fuente_id: 1,
    lleva_cofinanciamiento: "1",
    tipo_organizacion_admitida: "ongs",
    tiempo_postulacion: "sin_limite",
    tipo_alianza: "alianza_comunitaria",
    monto_minimo: "",
    monto_maximo: "",
    ...overrides,
  };
}

describe("transformaciones de convocatorias", () => {
  it("calcula la elegibilidad con todos los criterios", () => {
    expect(getEligibilityResult(completedEvaluations("primer_filtro"))).toBe("elegible");
    expect(
      getEligibilityResult([
        ...completedEvaluations("primer_filtro").slice(0, -1),
        { estado_revision: "no_cumple" },
      ]),
    ).toBe("no_viable");
    expect(getEligibilityResult([])).toBe("pendiente_revision");
  });

  it("separa filtros y habilita aprobacion y postulacion solo al completar el flujo", () => {
    const first = completedEvaluations("primer_filtro");
    const second = completedEvaluations("segundo_filtro");
    const evaluations = [...first, ...second];

    expect(getEvaluacionesPorFiltro(evaluations, "segundo_filtro")).toHaveLength(
      ELIGIBILITY_CRITERIA.length,
    );
    expect(canStartApproval(evaluations)).toBe(true);
    expect(canStartPostulacion(evaluations, { decision: "aprobada" })).toBe(true);
    expect(canStartPostulacion(evaluations, { decision: "rechazada" })).toBe(false);
  });

  it("valida campos, fechas, enlaces y montos", () => {
    expect(validateConvocatoria({})).toMatch(/obligatorios/i);
    expect(
      validateConvocatoria(
        validForm({
          url_convocatoria: "no-es-url",
        }),
      ),
    ).toMatch(/URL válida/i);
    expect(
      validateConvocatoria(
        validForm({
          monto_minimo: "100",
          monto_maximo: "50",
        }),
      ),
    ).toMatch(/mínimo no puede superar/i);
    expect(
      validateConvocatoria(validForm({ tipo_alianza: "" })),
    ).toMatch(/tipo de alianza/i);
  });

  it("presenta las nuevas opciones de convocatoria con sus etiquetas", () => {
    expect(formatConvocatoriaOption("ongs")).toBe("ONGs");
    expect(formatConvocatoriaOption("mas_de_un_beneficiario")).toBe("Más de 1 beneficiario");
    expect(formatConvocatoriaOption("alianza_comunitaria")).toBe("Alianza comunitaria");
    expect(formatConvocatoriaOption("15_25")).toBe("USD 15K a 25K");
    expect(formatConvocatoriaOption("200_mas")).toBe("USD 200K o más");
  });
});
