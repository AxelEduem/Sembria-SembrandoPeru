import { getIntegranteById, getIntegranteHistory } from "./queries";
import { getIntegranteAccesses } from "./access";

export async function getIntegranteDetail(id, profile = null, { force = false } = {}) {
  const cacheScope = profile?.cuenta_acceso_id || profile?.id || "default";
  const integrante = await getIntegranteById(id, { force, cacheScope });

  const [accesses, history] = await Promise.all([
    getIntegranteAccesses(id, profile, integrante, { force, cacheScope }),
    getIntegranteHistory(integrante, { force, cacheScope }),
  ]);

  return { integrante, accesses, history };
}
