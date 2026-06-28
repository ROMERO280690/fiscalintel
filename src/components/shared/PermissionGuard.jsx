import React from "react";
import { usePermissions } from "@/hooks/usePermissions";
import { Shield } from "lucide-react";

/**
 * PermissionGuard — bloquea acceso si el usuario no tiene permisos.
 *
 * Props:
 *   module   — clave del módulo (string, requerido)
 *   action   — acción requerida (default "view")
 *   fallback — nodo alternativo (default: pantalla "Sin acceso")
 *   silent   — si true, devuelve null en lugar de la pantalla de error
 *
 * Uso:
 *   <PermissionGuard module="payroll" action="approve">
 *     <Button>Aprobar</Button>
 *   </PermissionGuard>
 *
 *   <PermissionGuard module="audit">
 *     <AuditPage />
 *   </PermissionGuard>
 */
export default function PermissionGuard({ module, action = "view", children, fallback, silent = false }) {
  const { can } = usePermissions();

  if (can(module, action)) return <>{children}</>;

  if (silent) return null;

  if (fallback) return <>{fallback}</>;

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] px-6">
      <div className="w-20 h-20 rounded-2xl bg-slate-100 flex items-center justify-center mb-5">
        <Shield className="w-9 h-9 text-slate-300" />
      </div>
      <h2 className="text-lg font-bold text-[#1A1A2E] mb-2">Acceso restringido</h2>
      <p className="text-[13px] text-slate-500 text-center max-w-sm">
        No tenés permisos para acceder a este módulo. Contactá al administrador del sistema.
      </p>
    </div>
  );
}