import React from "react";
import { normalizeRole, ROLE_LABELS } from "@/lib/permissions";
import { useAuth } from "@/lib/AuthContext";
import { useCompany } from "@/lib/CompanyContext";
import DashboardSuperAdmin from "@/components/dashboard/DashboardSuperAdmin";
import DashboardEstudio from "@/components/dashboard/DashboardEstudio";
import DashboardContador from "@/components/dashboard/DashboardContador";
import DashboardLiquidador from "@/components/dashboard/DashboardLiquidador";
import DashboardCliente from "@/components/dashboard/DashboardCliente";
import DashboardAuditor from "@/components/dashboard/DashboardAuditor";
import { Shield, Cpu, Activity } from "lucide-react";
import HelpGuide from "@/components/HelpGuide";

// Mapa rol → componente de dashboard
const DASHBOARD_BY_ROLE = {
  super_admin:      DashboardSuperAdmin,
  estudio_contable: DashboardEstudio,
  contador:         DashboardContador,
  liquidador:       DashboardLiquidador,
  rrhh:             DashboardLiquidador,      // RRHH comparte vista con Liquidador
  administrativo:   DashboardContador,         // Administrativo usa vista Contador (reducida por sidebar)
  auditor:          DashboardAuditor,
  empresa:          DashboardCliente,
  cliente:          DashboardCliente,
};

export default function Dashboard() {
  const { user, isLoadingAuth } = useAuth();
  const { activeCompany, loading: loadingCompany } = useCompany();

  if (isLoadingAuth || loadingCompany) return (
    <div className="min-h-screen bg-[#0A0B14] flex items-center justify-center">
      <div className="flex flex-col items-center gap-3">
        <div className="w-10 h-10 border-2 border-violet-500/30 border-t-violet-500 rounded-full animate-spin" />
        <p className="text-white/40 text-sm">Cargando ContaIA...</p>
      </div>
    </div>
  );

  const role = normalizeRole(user?.role);

  // Redirect to onboarding ONLY for non-super-admin users without a company
  // SuperAdmin has access to everything without needing a company
  if (!activeCompany && user && role !== "super_admin") {
    window.location.href = "/onboarding";
    return null;
  }
  const roleLabel = ROLE_LABELS[role] || "Usuario";
  const DashboardComponent = DASHBOARD_BY_ROLE[role] || DashboardCliente;

  return (
    <div className="min-h-screen bg-[#0A0B14]">
      {/* Header */}
      <div className="border-b border-white/8 bg-[#0D0E1A] px-5 py-3 sticky top-0 z-10">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center flex-shrink-0">
              <span className="text-white font-bold text-sm">C</span>
            </div>
            <div>
              <p className="text-[13px] font-bold text-white leading-tight">
                Dashboard — <span className="text-violet-400">{roleLabel}</span>
              </p>
              <p className="text-[10px] text-white/35">Bienvenido, {user?.full_name || "usuario"}. Aquí está tu resumen del día.</p>
            </div>
          </div>
          <div className="hidden sm:flex items-center gap-4">
            <div className="flex items-center gap-1.5">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-[11px] text-white/50">Tiempo Real</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Shield className="w-3 h-3 text-blue-400" />
              <span className="text-[11px] text-white/50">Datos Seguros</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Cpu className="w-3 h-3 text-violet-400" />
              <span className="text-[11px] text-white/50">IA Activa</span>
            </div>
            <HelpGuide />
          </div>
        </div>
      </div>

      {/* Dashboard del rol */}
      <div className="p-4 lg:p-6">
        <DashboardComponent user={user} activeCompanyId={activeCompany?.id} />
      </div>
    </div>
  );
}