import React, { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import {
  PieChart, Pie, Cell, BarChart, Bar,
  ResponsiveContainer, XAxis, YAxis, Tooltip, CartesianGrid
} from "recharts";
import { Shield, AlertTriangle, CheckCircle, Search, TrendingDown, Activity } from "lucide-react";
import DashboardShell from "./DashboardShell";
import KPICard from "./KPICard";
import DarkCard from "./DarkCard";

export default function DashboardAuditor({ user }) {
  const [audits, setAudits] = useState([]);
  const [clients, setClients] = useState([]);
  const [filings, setFilings] = useState([]);
  const [docs, setDocs] = useState([]);

  useEffect(() => {
    Promise.all([
      base44.entities.AuditLog.list("-created_date", 200),
      base44.entities.Client.list("-created_date", 200),
      base44.entities.TaxFiling.list("-created_date", 200),
      base44.entities.Document.list("-created_date", 100),
    ]).then(([a, c, f, d]) => {
      setAudits(a); setClients(c); setFilings(f); setDocs(d);
    }).catch(() => {});
  }, []);

  const totalAudits = audits.length || 24;
  const highRisk = clients.filter(c => c.risk_level === "critical").length || 18;
  const findings = audits.filter(a => a.action === "reject" || a.action === "delete").length || 32;
  const compliance = clients.length > 0
    ? Math.round(clients.filter(c => c.compliance_score >= 80).length / clients.length * 100)
    : 92;

  const riskData = [
    { name: "Alto", value: clients.filter(c=>c.risk_level==="high").length || 8, color: "#ef4444", pct: "44%" },
    { name: "Medio", value: clients.filter(c=>c.risk_level==="medium").length || 6, color: "#f59e0b", pct: "33%" },
    { name: "Bajo", value: clients.filter(c=>c.risk_level==="low").length || 4, color: "#10b981", pct: "22%" },
  ];

  const complianceByArea = [
    { area: "Contable", value: 90 }, { area: "Impositiva", value: 83 },
    { area: "Laboral", value: 80 }, { area: "Societaria", value: 70 },
    { area: "Financiera", value: 54 },
  ];

  const ultimasAuditorias = [
    { titulo: "Auditoría Contable — Q1 2024", estado: "En Proceso", fecha: "" },
    { titulo: "Revisión Impositiva — Mayo 2024", estado: "Completada", fecha: "" },
    { titulo: "Auditoría Laboral — Mayo 2024", estado: "En Proceso", fecha: "" },
    { titulo: "Control Interno — Abril 2024", estado: "Completada", fecha: "" },
  ];

  const hallazgosRecientes = [
    { texto: "Documentación incompleta", nivel: "Alto" },
    { texto: "Diferencias en conciliación", nivel: "Medio" },
    { texto: "Control interno débil", nivel: "Bajo" },
    { texto: "Políticas desactualizadas", nivel: "Bajo" },
  ];

  return (
    <DashboardShell title="6. AUDITOR" subtitle="Auditoría y control" icon={Shield}>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        <KPICard label="Auditorías" value={totalAudits} delta={4} color="violet" icon={Shield} sub="+4 entre mes" />
        <KPICard label="Riesgos Detectados" value={highRisk} color="red" icon={AlertTriangle} sub="8 altos" />
        <KPICard label="Hallazgos" value={findings} delta={12} color="amber" icon={Search} sub="12 abiertos" />
        <KPICard label="Cumplimiento" value={`${compliance}%`} color="green" icon={CheckCircle} sub="Excelente" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
        {/* Riesgos por Nivel */}
        <DarkCard title="Riesgos por Nivel" icon={AlertTriangle} iconColor="text-red-400" linkTo="/audit" linkLabel="Ver todos los riesgos">
          <div className="flex items-center justify-center mb-3">
            <div className="relative">
              <ResponsiveContainer width={130} height={130}>
                <PieChart>
                  <Pie data={riskData} cx={60} cy={60} innerRadius={38} outerRadius={58} dataKey="value" paddingAngle={3}>
                    {riskData.map((e, i) => <Cell key={i} fill={e.color} />)}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <p className="text-xl font-bold text-white">{riskData.reduce((s,r)=>s+r.value,0)}</p>
                <p className="text-[9px] text-white/40">Total</p>
              </div>
            </div>
          </div>
          <div className="space-y-1.5">
            {riskData.map(r => (
              <div key={r.name} className="flex items-center justify-between text-[11px]">
                <div className="flex items-center gap-1.5">
                  <div className="w-2 h-2 rounded-full" style={{ background: r.color }} />
                  <span className="text-white/60">{r.name}</span>
                </div>
                <span className="font-semibold text-white">{r.value} ({r.pct})</span>
              </div>
            ))}
          </div>
        </DarkCard>

        {/* Cumplimiento por Área */}
        <DarkCard title="Cumplimiento por Área" icon={CheckCircle} iconColor="text-green-400" className="lg:col-span-2" linkTo="/audit" linkLabel="Ver detalle por área">
          <div className="space-y-3">
            {complianceByArea.map(c => (
              <div key={c.area}>
                <div className="flex justify-between items-center mb-1">
                  <span className="text-[12px] text-white/70">{c.area}</span>
                  <span className="text-[12px] font-semibold text-white">{c.value}%</span>
                </div>
                <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-700 ${
                      c.value >= 85 ? "bg-emerald-500" : c.value >= 70 ? "bg-amber-500" : "bg-red-500"
                    }`}
                    style={{ width: `${c.value}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </DarkCard>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <DarkCard title="Últimas Auditorías" icon={Shield} iconColor="text-violet-400" linkTo="/audit" linkLabel="Ver todas las auditorías">
          <div className="space-y-2">
            {ultimasAuditorias.map((a, i) => (
              <div key={i} className="flex items-center justify-between py-2 border-b border-white/5 last:border-0 hover:bg-white/3 rounded-lg px-1 transition-colors">
                <span className="text-[12px] text-white/80 flex-1 truncate">{a.titulo}</span>
                <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ml-2 flex-shrink-0 ${
                  a.estado === "Completada" ? "bg-emerald-500/20 text-emerald-400" : "bg-blue-500/20 text-blue-400"
                }`}>{a.estado}</span>
              </div>
            ))}
          </div>
        </DarkCard>

        <DarkCard title="Hallazgos Recientes" icon={Search} iconColor="text-amber-400" linkTo="/audit" linkLabel="Ver todos los hallazgos">
          <div className="space-y-2">
            {hallazgosRecientes.map((h, i) => (
              <div key={i} className="flex items-center justify-between py-2 border-b border-white/5 last:border-0 hover:bg-white/3 rounded-lg px-1 transition-colors">
                <span className="text-[12px] text-white/80 flex-1 truncate">{h.texto}</span>
                <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ml-2 flex-shrink-0 ${
                  h.nivel === "Alto" ? "bg-red-500/20 text-red-400" :
                  h.nivel === "Medio" ? "bg-amber-500/20 text-amber-400" :
                  "bg-emerald-500/20 text-emerald-400"
                }`}>{h.nivel}</span>
              </div>
            ))}
          </div>
        </DarkCard>
      </div>
    </DashboardShell>
  );
}