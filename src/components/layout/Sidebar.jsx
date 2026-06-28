import React, { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import {
  LayoutDashboard, Users, FolderOpen, Receipt,
  Building2, Calculator, ClipboardList, Shield,
  CheckSquare, BarChart3, ChevronLeft, ChevronRight, LogOut,
  Bot, Menu, X, Inbox, FileCheck, Landmark, TrendingUp, Sparkles,
  BookOpen, Globe, Activity, FileText, CheckCircle
} from "lucide-react";
import { base44 } from "@/api/base44Client";
import { usePermissions } from "@/hooks/usePermissions";
import { ROLE_LABELS, normalizeRole } from "@/lib/permissions";
import { useAuth } from "@/lib/AuthContext";
import CompanySelector from "@/components/layout/CompanySelector";

// path → module key para el sistema de permisos
const PATH_MODULE = {
  "/":              "dashboard",
  "/review":        "review",
  "/gemelo-fiscal": "gemelo_fiscal",
  "/clients":       "clients",
  "/tasks":         "tasks",
  "/documents":     "documents",
  "/invoicing":     "invoicing",
  "/tax-filings":   "tax_filings",
  "/iibb-convenio": "iibb",
  "/tax-calendar":  "tax_calendar",
  "/payroll":       "payroll",
  "/tax-automation": "automation",
  "/accounting":    "accounting",
  "/treasury":      "treasury",
  "/financial-reports": "financial_reports",
  "/bank-reconciliation": "bank_reconciliation",
  "/corporate":     "corporate",
  "/agents":        "agents",
  "/ai-assistant":  "ai_assistant",
  "/normativa":     "normativa",
  "/account-plan":  "account_plan",
  "/audit":         "audit",
  "/portal":        "portal",
  "/settings/arca": "arca_settings",
};

const navSections = [
  {
    label: "Principal",
    items: [
      { icon: LayoutDashboard, label: "Dashboard",           path: "/" },
      { icon: Inbox,           label: "Bandeja de Revisión", path: "/review" },
      { icon: Shield,          label: "Gemelo Fiscal",       path: "/gemelo-fiscal" },
      { icon: Users,           label: "Clientes",            path: "/clients" },
      { icon: CheckSquare,     label: "Tareas",              path: "/tasks" },
    ]
  },
  {
    label: "Documentos & Facturación",
    items: [
      { icon: FolderOpen, label: "Expediente Digital",      path: "/documents" },
      { icon: FileCheck,  label: "Facturación Electrónica", path: "/invoicing" },
    ]
  },
  {
    label: "Impuestos",
    items: [
      { icon: Receipt,    label: "DDJJ / IVA / Ganancias",   path: "/tax-filings" },
      { icon: Calculator, label: "IIBB & Conv. Multilateral", path: "/iibb-convenio" },
      { icon: BarChart3,  label: "Vencimientos",              path: "/tax-calendar" },
    ]
  },
  {
    label: "Laboral",
    items: [
      { icon: Building2, label: "Sueldos & F931", path: "/payroll" },
    ]
  },
  {
    label: "Contabilidad & Tesorería",
    items: [
      { icon: ClipboardList, label: "Diario & Mayor", path: "/accounting" },
      { icon: TrendingUp,    label: "Tesorería",      path: "/treasury" },
      { icon: FileText,      label: "Reportes Financieros", path: "/financial-reports" },
      { icon: CheckCircle,   label: "Conciliación Bancaria", path: "/bank-reconciliation" },
    ]
  },
  {
    label: "Societario",
    items: [
      { icon: Landmark, label: "Actas & Libros", path: "/corporate" },
    ]
  },
  {
    label: "IA & Automatización",
    items: [
      { icon: Sparkles, label: "Agentes Especializados", path: "/agents" },
      { icon: Bot,      label: "Asistente IA",           path: "/ai-assistant" },
      { icon: Bot,      label: "Automatización Fiscal",  path: "/tax-automation", noPermissionCheck: true },
      { icon: Globe,    label: "Motor Normativo",        path: "/normativa" },
    ]
  },
  {
    label: "Sistema",
    items: [
      { icon: Building2, label: "Empresas & Sucursales", path: "/companies" },
      { icon: Users,     label: "Equipo y Permisos",     path: "/team" },
      { icon: BookOpen,  label: "Plan de Cuentas",       path: "/account-plan" },
      { icon: Activity,  label: "Auditoría & Logs",      path: "/audit" },
      { icon: Shield,    label: "Portal del Cliente",    path: "/portal" },
      { icon: Shield,    label: "Config. ARCA",          path: "/settings/arca" },
    ]
  }
];

export default function Sidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();
  const { user } = useAuth();
  const { canViewModule, role } = usePermissions();

  const isActive = (path) => {
    if (path === "/") return location.pathname === "/";
    return location.pathname.startsWith(path.split("?")[0]);
  };

  // Filtra secciones según permisos del rol
  const visibleSections = navSections.map(section => ({
    ...section,
    items: section.items.filter(item => {
      const mod = PATH_MODULE[item.path];
      if (item.noPermissionCheck) return true;
      return mod ? canViewModule(mod) : true;
    })
  })).filter(section => section.items.length > 0);

  const roleLabel = ROLE_LABELS[normalizeRole(user?.role || "cliente")] || "Usuario";

  const sidebarContent = (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between p-4 border-b border-white/10">
        {!collapsed && (
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center">
              <span className="text-white font-bold text-sm">C</span>
            </div>
            <div>
              <h1 className="text-sm font-bold text-white tracking-tight">ContaIA</h1>
              <p className="text-[10px] text-slate-400">ERP Contable Inteligente</p>
            </div>
          </div>
        )}
        {collapsed && (
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center mx-auto">
            <span className="text-white font-bold text-sm">C</span>
          </div>
        )}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="hidden lg:flex w-6 h-6 items-center justify-center rounded text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
        >
          {collapsed ? <ChevronRight className="w-3.5 h-3.5" /> : <ChevronLeft className="w-3.5 h-3.5" />}
        </button>
      </div>

      {/* Company Selector */}
      <div className="px-2.5 py-2 border-b border-white/10">
        <CompanySelector collapsed={collapsed} />
      </div>

      <nav className="flex-1 overflow-y-auto py-3 px-2.5 space-y-4">
        {visibleSections.map((section) => (
          <div key={section.label}>
            {!collapsed && (
              <p className="px-2.5 mb-1.5 text-[10px] font-semibold uppercase tracking-widest text-slate-500">
                {section.label}
              </p>
            )}
            <div className="space-y-0.5">
              {section.items.map((item) => {
                const active = isActive(item.path);
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    onClick={() => setMobileOpen(false)}
                    className={`flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-[13px] font-medium transition-all duration-200 ${
                      active
                        ? "bg-violet-500/15 text-violet-400 border border-violet-500/20"
                        : "text-slate-400 hover:text-white hover:bg-white/5"
                    }`}
                    title={collapsed ? item.label : undefined}
                  >
                    <item.icon className={`w-4 h-4 flex-shrink-0 ${active ? "text-violet-400" : ""}`} />
                    {!collapsed && <span>{item.label}</span>}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      <div className="p-3 border-t border-white/10 space-y-1">
        {!collapsed && user && (
          <div className="px-2.5 py-1.5 mb-1">
            <p className="text-[11px] text-white font-medium truncate">{user.full_name || user.email}</p>
            <span className="inline-flex items-center text-[10px] font-semibold px-1.5 py-0.5 rounded bg-violet-500/20 text-violet-400 mt-0.5">
              {roleLabel}
            </span>
          </div>
        )}
        <button
          onClick={() => base44.auth.logout("/")}
          className="flex items-center gap-2.5 w-full px-2.5 py-2 rounded-lg text-[13px] font-medium text-slate-400 hover:text-white hover:bg-white/5 transition-colors"
        >
          <LogOut className="w-4 h-4" />
          {!collapsed && <span>Cerrar Sesión</span>}
        </button>
      </div>
    </div>
  );

  return (
    <>
      <button
        onClick={() => setMobileOpen(true)}
        className="lg:hidden fixed top-3 left-3 z-50 w-10 h-10 rounded-lg bg-[#1A1A2E] text-white flex items-center justify-center shadow-lg"
      >
        <Menu className="w-5 h-5" />
      </button>

      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-50">
          <div className="absolute inset-0 bg-black/50" onClick={() => setMobileOpen(false)} />
          <div className="absolute left-0 top-0 bottom-0 w-64 bg-[#1A1A2E]">
            <button
              onClick={() => setMobileOpen(false)}
              className="absolute top-3 right-3 text-slate-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>
            {sidebarContent}
          </div>
        </div>
      )}

      <aside
        className={`hidden lg:flex flex-col bg-[#1A1A2E] h-screen sticky top-0 transition-all duration-300 ${
          collapsed ? "w-16" : "w-60"
        }`}
      >
        {sidebarContent}
      </aside>
    </>
  );
}