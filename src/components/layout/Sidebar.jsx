import React, { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import {
  LayoutDashboard, Users, FileText, FolderOpen, Receipt,
  Building2, Calculator, ClipboardList, Shield, AlertTriangle,
  CheckSquare, BarChart3, ChevronLeft, ChevronRight, LogOut,
  Bot, Menu, X
} from "lucide-react";
import { base44 } from "@/api/base44Client";

const navSections = [
  {
    label: "Principal",
    items: [
      { icon: LayoutDashboard, label: "Dashboard", path: "/" },
      { icon: Users, label: "Clientes", path: "/clients" },
      { icon: CheckSquare, label: "Tareas", path: "/tasks" },
    ]
  },
  {
    label: "Documentos",
    items: [
      { icon: FolderOpen, label: "Expediente Digital", path: "/documents" },
    ]
  },
  {
    label: "Impuestos",
    items: [
      { icon: Receipt, label: "DDJJ / IVA", path: "/tax-filings" },
      { icon: Calculator, label: "Vencimientos", path: "/tax-calendar" },
    ]
  },
  {
    label: "Laboral",
    items: [
      { icon: Building2, label: "Sueldos & F931", path: "/payroll" },
    ]
  },
  {
    label: "Contabilidad",
    items: [
      { icon: ClipboardList, label: "Diario & Mayor", path: "/accounting" },
    ]
  },
  {
    label: "IA",
    items: [
      { icon: Bot, label: "Asistente IA", path: "/ai-assistant" },
      { icon: Shield, label: "Auditoría Fiscal", path: "/tax-filings" },
    ]
  }
];

export default function Sidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();

  const isActive = (path) => {
    if (path === "/") return location.pathname === "/";
    return location.pathname.startsWith(path.split("?")[0]);
  };

  const sidebarContent = (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between p-4 border-b border-white/10">
        {!collapsed && (
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#00C7D9] flex items-center justify-center">
              <BarChart3 className="w-4.5 h-4.5 text-white" />
            </div>
            <div>
              <h1 className="text-sm font-bold text-white tracking-tight">ContaIA</h1>
              <p className="text-[10px] text-slate-400">ERP Contable Inteligente</p>
            </div>
          </div>
        )}
        {collapsed && (
          <div className="w-8 h-8 rounded-lg bg-[#00C7D9] flex items-center justify-center mx-auto">
            <BarChart3 className="w-4.5 h-4.5 text-white" />
          </div>
        )}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="hidden lg:flex w-6 h-6 items-center justify-center rounded text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
        >
          {collapsed ? <ChevronRight className="w-3.5 h-3.5" /> : <ChevronLeft className="w-3.5 h-3.5" />}
        </button>
      </div>

      <nav className="flex-1 overflow-y-auto py-3 px-2.5 space-y-4">
        {navSections.map((section) => (
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
                        ? "bg-[#00C7D9]/15 text-[#00C7D9]"
                        : "text-slate-400 hover:text-white hover:bg-white/5"
                    }`}
                    title={collapsed ? item.label : undefined}
                  >
                    <item.icon className={`w-4 h-4 flex-shrink-0 ${active ? "text-[#00C7D9]" : ""}`} />
                    {!collapsed && <span>{item.label}</span>}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      <div className="p-3 border-t border-white/10">
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