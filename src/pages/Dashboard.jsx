import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import DashboardSuperAdmin from "@/components/dashboard/DashboardSuperAdmin";
import DashboardEstudio from "@/components/dashboard/DashboardEstudio";
import DashboardContador from "@/components/dashboard/DashboardContador";
import DashboardLiquidador from "@/components/dashboard/DashboardLiquidador";
import DashboardCliente from "@/components/dashboard/DashboardCliente";
import DashboardAuditor from "@/components/dashboard/DashboardAuditor";
import { Activity, Shield, Clock, Cpu } from "lucide-react";

export default function Dashboard() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    base44.auth.me().then(u => { setUser(u); setLoading(false); }).catch(() => setLoading(false));
  }, []);

  if (loading) return (
    <div className="min-h-screen bg-[#0A0B14] flex items-center justify-center">
      <div className="flex flex-col items-center gap-3">
        <div className="w-10 h-10 border-2 border-violet-500/30 border-t-violet-500 rounded-full animate-spin" />
        <p className="text-white/40 text-sm">Cargando ContaIA...</p>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#0A0B14]">
      {/* Global Header */}
      <div className="border-b border-white/8 bg-[#0D0E1A] px-5 py-3 sticky top-0 z-10">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center flex-shrink-0">
              <span className="text-white font-bold text-sm">C</span>
            </div>
            <div>
              <p className="text-[13px] font-bold text-white leading-tight">Dashboards por Tipo de Usuario</p>
              <p className="text-[10px] text-white/35">Cada usuario accede a la información que realmente necesita para gestionar y tomar decisiones.</p>
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
          </div>
        </div>
      </div>

      {/* 6 Dashboards Grid — 3 cols top, 3 cols bottom */}
      <div className="p-4 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {/* Row 1 */}
        <DashboardPanel number="1" label="SUPER ADMINISTRADOR" sublabel="Visión global de toda la plataforma">
          <DashboardSuperAdmin user={user} />
        </DashboardPanel>
        <DashboardPanel number="2" label="ESTUDIO CONTABLE" sublabel="Gestión de clientes y equipos">
          <DashboardEstudio user={user} />
        </DashboardPanel>
        <DashboardPanel number="3" label="CONTADOR" sublabel="Gestión de tus clientes asignados">
          <DashboardContador user={user} />
        </DashboardPanel>
        {/* Row 2 */}
        <DashboardPanel number="4" label="LIQUIDADOR / RRHH" sublabel="Gestión de nómina y liquidaciones">
          <DashboardLiquidador user={user} />
        </DashboardPanel>
        <DashboardPanel number="5" label="CLIENTE" sublabel="Portal del cliente">
          <DashboardCliente user={user} />
        </DashboardPanel>
        <DashboardPanel number="6" label="AUDITOR" sublabel="Auditoría y control">
          <DashboardAuditor user={user} />
        </DashboardPanel>
      </div>

      {/* Bottom feature bar */}
      <div className="border-t border-white/8 bg-[#0D0E1A] px-5 py-4">
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
          {[
            { icon: Activity, color: "text-violet-400",  title: "Información en Tiempo Real",  desc: "Datos actualizados automáticamente" },
            { icon: Shield,   color: "text-blue-400",    title: "Seguridad Avanzada",           desc: "Encriptación y control de accesos" },
            { icon: Cpu,      color: "text-emerald-400", title: "IA Integrada",                 desc: "Asistencia inteligente en cada módulo" },
            { icon: Activity, color: "text-amber-400",   title: "Responsive Design",            desc: "Funciona en todos los dispositivos" },
            { icon: Shield,   color: "text-red-400",     title: "Auditoría Completa",           desc: "Trazabilidad de todas las acciones" },
            { icon: Clock,    color: "text-cyan-400",    title: "Cumplimiento Normativo",       desc: "Normativas argentinas actualizadas" },
          ].map((f, i) => (
            <div key={i} className="flex items-start gap-2.5">
              <div className="w-7 h-7 rounded-lg bg-white/5 flex items-center justify-center flex-shrink-0 mt-0.5">
                <f.icon className={`w-3.5 h-3.5 ${f.color}`} />
              </div>
              <div>
                <p className="text-[11px] font-semibold text-white/70">{f.title}</p>
                <p className="text-[10px] text-white/30">{f.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function DashboardPanel({ number, label, sublabel, children }) {
  return (
    <div className="bg-[#0F1020] border border-white/8 rounded-2xl overflow-hidden flex flex-col">
      {/* Panel header with mini sidebar mock */}
      <div className="flex flex-1 min-h-0">
        {/* Mini sidebar */}
        <div className="w-10 bg-[#0A0B14] border-r border-white/6 flex flex-col items-center py-3 gap-2 flex-shrink-0">
          <div className="w-6 h-6 rounded-md bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center mb-1">
            <span className="text-white font-bold text-[9px]">C</span>
          </div>
          {[...Array(6)].map((_, i) => (
            <div key={i} className={`w-5 h-1.5 rounded-full ${i === 0 ? "bg-violet-500" : "bg-white/10"}`} />
          ))}
        </div>
        {/* Content */}
        <div className="flex-1 min-w-0 overflow-hidden">
          {/* Panel inner header */}
          <div className="px-3 py-2.5 border-b border-white/6 flex items-center justify-between">
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] font-bold text-violet-400">{number}.</span>
                <span className="text-[11px] font-bold text-white/90 uppercase tracking-wide">{label}</span>
              </div>
              <p className="text-[9px] text-white/30 mt-0.5">{sublabel}</p>
            </div>
            <div className="text-[9px] text-white/25 font-mono">01/06/2024 — 12/06/2024</div>
          </div>
          {/* Dashboard content scrollable */}
          <div className="p-3 overflow-y-auto max-h-[520px] scrollbar-hide">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}