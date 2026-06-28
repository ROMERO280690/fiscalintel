/**
 * useCompanyData — wrapper de queries que aplica automáticamente el filtro
 * de empresa activa para aislamiento de datos.
 *
 * Uso:
 *   const { data: clients, loading, reload } = useCompanyData("Client");
 *   const { data: docs } = useCompanyData("Document", { status: "uploaded" });
 */
import { useState, useEffect, useCallback } from "react";
import { base44 } from "@/api/base44Client";
import { useCompany } from "@/lib/CompanyContext";

// Entidades que NO se filtran por company_id (son globales)
const GLOBAL_ENTITIES = ["Organization", "Company", "Branch", "UserCompanyAccess", "NormativaUpdate", "AuditLog"];

export function useCompanyData(entityName, extraFilter = {}, sort = "-created_date", limit = 200) {
  const { activeCompany } = useCompany();
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const isGlobal = GLOBAL_ENTITIES.includes(entityName);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const entity = base44.entities[entityName];
      if (!entity) throw new Error(`Entity ${entityName} not found`);

      let filter = { ...extraFilter };

      // Apply company isolation for non-global entities
      if (!isGlobal && activeCompany) {
        filter = { company_id: activeCompany.id, ...extraFilter };
      }

      const hasFilters = Object.keys(filter).length > 0;
      const result = hasFilters
        ? await entity.filter(filter, sort, limit)
        : await entity.list(sort, limit);

      setData(result);
      setError(null);
    } catch (e) {
      console.error(`useCompanyData(${entityName}) error:`, e);
      setError(e);
      setData([]);
    } finally {
      setLoading(false);
    }
  }, [entityName, activeCompany?.id, JSON.stringify(extraFilter), sort, limit]);

  useEffect(() => { load(); }, [load]);

  return { data, loading, error, reload: load };
}

/**
 * Versión para queries únicas (get by id o filter complejo)
 */
export function useCompanyFilter() {
  const { activeCompany } = useCompany();

  /**
   * Aplica el filtro de empresa al objeto de filtros dado.
   * Si la entidad es global, devuelve el filtro sin modificar.
   */
  const applyCompanyFilter = (baseFilter = {}, entityName = "") => {
    const isGlobal = GLOBAL_ENTITIES.includes(entityName);
    if (isGlobal || !activeCompany) return baseFilter;
    return { company_id: activeCompany.id, ...baseFilter };
  };

  return { applyCompanyFilter, activeCompany };
}