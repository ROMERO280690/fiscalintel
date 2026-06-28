import React, { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { PieChart, Pie, Cell, ResponsiveContainer } from "recharts";
import { Shield, AlertTriangle, CheckCircle, Search } from "lucide-react";
import KPICard from "./KPICard";
import DarkCard from "./DarkCard";

export default function DashboardAuditor({ user }) {
  const [audits, setAudits] = useState([]);
  const [clients, setClients] = useState([]);

  useEffect(() => {
    Promise.all([
      base44.entities.AuditLog.list("-created_date", 200),
      base44.entities.Client.list("-created_date", 200),
    ]).then(([a, c]) => { setAudits(a); setClients(c); }).catch(() => {});
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
    { area: "Laboral", value: 80 }, { area: "Societaria", value: 70 }, { area: "Financiera", value: 54 },
  ];

  const ultimasAuditorias = [
    { titulo: "Auditoría Contable — Q1 2024", estado: "En Proceso" },
    { titulo: "Revisión Impositiva — Mayo 2024", estado: "Completada" },
    { titulo: "Auditoría Laboral — Mayo 2024", estado: "En Proceso" },
    { titulo: "Control Interno — Abril 2024", estado: "Completada" },
  ];

  const hallazgosRecientes = [
    { texto: "Documentación incompleta", nivel: "Alto" },
    { texto: "Diferencias en conciliación", nivel: "Medio" },
    { texto: "Control interno débil", nivel: "Bajo" },
    { texto: "Políticas desactualizadas", nivel: "Bajo" },
  ];

  return (
    <div>
      <div className="grid grid-cols-2 gap-2 mb-3">
        <KPICard label="Auditorías" value={totalAudits} delta={4} color="violet" icon={Shield} sub="+4 entre mes" />
        <KPICard label="Riesgos Detectados" value={highRisk} color="red" icon={AlertTriangle} sub="8 altos" />
        <KPICard label="Hallazgos" value={findings} delta={12} color="amber" icon={Search} sub="12 abiertos" />
        <KPICard label="Cumplimiento" value={`${compliance}%`} color="green" icon={CheckCircle} sub="Excelente" />
      </div>

      <div className="grid grid-cols-2 gap-2 mb-3">
        <DarkCard title="Riesgos por Nivel" icon={AlertTriangle} iconColor="text-red-400" linkTo="/audit" linkLabel="Ver todos">
          <div className="flex items-center gap-2">
            <div className="relative flex-shrink-0">
              <ResponsiveContainer width={80} height={80}>
                <PieChart>
                  <Pie data={riskData} cx={38} cy={38} innerRadius={24} outerRadius={36} dataKey="value" paddingAngle={2}>
                    {riskData.map((e, i) => <Cell key={i} fill={e.color} />)}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 flex items-center justify-center">
                <p className="text-[12px] font-bold text-white">{riskData.reduce((s,r)=>s+r.value,0)}</p>
              </div>
            </div>
            <div className="flex-1 space-y-1.5">
              {riskData.map(r => (
                <div key={r.name} className="flex items-center justify-between text-[10px]">
                  <div className="flex items-center gap-1">
                    <div className="w-1.5 h-1.5 rounded-full" style={{ background: r.color }} />
                    <span className="text-white/50">{r.name}</span>
                  </div>
                  <span className="font-semibold text-white">{r.value} ({r.pct})</span>
                </div>
              ))}
            </div>
          </div>
        </DarkCard>

        <DarkCard title="Cumplimiento por Área" icon={CheckCircle} iconColor="text-green-400" linkTo="/audit" linkLabel="Ver detalle">
          <div className="space-y-1.5">
            {complianceByArea.map(c => (
              <div key={c.area}>
                <div className="flex justify-between items-center mb-0.5">
                  <span className="text-[9px] text-white/60">{c.area}</span>
                  <span className="text-[9px] font-semibold text-white">{c.value}%</span>
                </div>
                <div className="h-1 bg-white/5 rounded-full overflow-hidden">
                  <div className={`h-full rounded-full ${c.value >= 85 ? "bg-emerald-500" : c.value >= 70 ? "bg-amber-500" : "bg-red-500"}`}
                    style={{ width: `${c.value}%` }} />
                </div>
              </div>
            ))}
          </div>
        </DarkCard>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <DarkCard title="Últimas Auditorías" icon={Shield} iconColor="text-violet-400" linkTo="/audit" linkLabel="Ver todas">
          <div className="space-y-1.5">
            {ultimasAuditorias.map((a, i) => (
              <div key={i} className="flex items-center justify-between py-1.5 border-b border-white/5 last:border-0">
                <span className="text-[10px] text-white/70 flex-1 truncate">{a.titulo}</span>
                <span className={`text-[9px] font-semibold px-1.5 py-0.5 rounded-full ml-1 flex-shrink-0 ${
                  a.estado === "Completada" ? "bg-emerald-500/20 text-emerald-400" : "bg-blue-500/20 text-blue-400"
                }`}>{a.estado}</span>
              </div>
            ))}
          </div>
        </DarkCard>

        <DarkCard title="Hallazgos Recientes" icon={Search} iconColor="text-amber-400" linkTo="/audit" linkLabel="Ver todos">
          <div className="space-y-1.5">
            {hallazgosRecientes.map((h, i) => (
              <div key={i} className="flex items-center justify-between py-1.5 border-b border-white/5 last:border-0">
                <span className="text-[10px] text-white/70 flex-1 truncate">{h.texto}</span>
                <span className={`text-[9px] font-semibold px-1.5 py-0.5 rounded-full ml-1 flex-shrink-0 ${
                  h.nivel === "Alto" ? "bg-red-500/20 text-red-400" :
                  h.nivel === "Medio" ? "bg-amber-500/20 text-amber-400" : "bg-emerald-500/20 text-emerald-400"
                }`}>{h.nivel}</span>
              </div>
            ))}
          </div>
        </DarkCard>
      </div>
    </div>
  );
}