import { useAuth } from "@/lib/AuthContext";
import { canView, canDo, getDataScope, getAccessibleModules, normalizeRole, ROLE_LABELS } from "@/lib/permissions";

/**
 * Hook de permisos — uso en cualquier componente/página.
 *
 * const { can, canViewModule, dataScope, role, roleLabel } = usePermissions();
 *
 * can("payroll", "approve")    → boolean
 * canViewModule("payroll")     → boolean
 * dataScope("clients")         → "all" | "own" | "none"
 * accessibleModules            → string[]
 */
export function usePermissions() {
  const { user } = useAuth();
  const userRole = user?.role || "cliente";

  return {
    role: normalizeRole(userRole),
    roleLabel: ROLE_LABELS[normalizeRole(userRole)] || userRole,
    can: (module, action) => canDo(userRole, module, action),
    canViewModule: (module) => canView(userRole, module),
    dataScope: (module) => getDataScope(userRole, module),
    accessibleModules: getAccessibleModules(userRole),
  };
}