import React, { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import {
  AreaChart, Area, PieChart, Pie, Cell, ResponsiveContainer, XAxis, Tooltip
} from "recharts";
import { Users, FileText, Bot, DollarSign, AlertTriangle, Activity } from "lucide-react";
import KPICard from "./KPICard";
import DarkCard from "./DarkCard";

export default function DashboardEstudio({ user }) {
  const [clients, setClients] = useState([]);
  const [docs, setDocs] = useState([]);
  const [filings, setFilings] = useState([]);

  useEffect(() => {
    Promise.all([
      base44.entities.Client.list("-created_date", 200),
      base44.entities.Document.list("-created_date", 200),
      base44.entities.TaxFiling.list("-created_date", 200),
    ]).then(([c, d, f]) => { setClients(c); setDocs(d); setFilings(f); }).catch(() => {});
  }, []);

  const activeClients = clients.filter(c => c.status === "active").length;
  const pendingObligaciones = filings.filter(f => ["draft","ai_generated"].includes(f.status)).length;
  const aiProcesses = docs.filter(d => ["classified","approved"].includes(d.status)).length;
  const riskClients = clients.filter(c => ["high","critical"].includes(c.risk_level));

  const obligacionesData = [
    { name: "Vende 38 (21%)", value: 38, color: "#7c3aed" },
    { name: "Hoy 60 (17%)", value: 60, color: "#4f46e5" },
    { name: "Mañana 46 (13%)", value: 46, color: "#0ea5e9" },
    { name: "Pendiente 50 (14%)", value: 50, color: "#10b981" },
    { name: "Completado 72 (20%)", value: 72, color: "#f59e0b" },
  ];

  const ingresosMeses = [
    { mes: "Ene", ingreso: 1800 }, { mes: "Feb", ingreso: 2100 },
    { mes: "Mar", ingreso: 2800 }, { mes: "Abr", ingreso: 2400 },
    { mes: "May", ingreso: 3200 }, { mes: "Jun", ingreso: 2900 },
  ];

  const actividadReciente = [
    { texto: "Gemelo Fiscal — Conexión ContaSur SA", riesgo: "Alta", hace: "Hace 13 min" },
    { texto: "Factura enviada — Employer Juan Pérez", riesgo: "Medio", hace: "Hace 23 min" },
    { texto: "DDJJ IVA-009 — 000123A emitida", riesgo: "Alta", hace: "Hace 43 min" },
    { texto: "Liquidación Nómina SA", riesgo: "Bajo", hace: "Hace 1 hora" },
    { texto: "Proceso IA completado — 12 comprobantes", riesgo: "Alta", hace: "1 hora" },
  ];

  return (
    <div>
      <div className="grid grid-cols-2 gap-2 mb-3">
        <KPICard label="Clientes Activos" value={activeClients || 156} delta={7} color="violet" icon={Users} sub="+12 este mes" />
        <KPICard label="Obligaciones" value={pendingObligaciones || 320} delta={-5} color="amber" icon={FileText} sub="38 vencen hoy" />
        <KPICard label="Procesos IA" value={aiProcesses || 1245} delta={25} color="blue" icon={Bot} sub="+15 esta semana" />
        <KPICard label="Facturación Mes" value={`$8.45M`} delta={15} color="green" icon={DollarSign} sub="+17% vs anterior" />
      </div>

      <div className="grid grid-cols-2 gap-2 mb-3">
        <DarkCard title="Obligaciones por Vencer" icon={AlertTriangle} iconColor="text-amber-400">
          <div className="flex items-center gap-2">
            <div className="relative flex-shrink-0">
              <ResponsiveContainer width={80} height={80}>
                <PieChart>
                  <Pie data={obligacionesData} cx={38} cy={38} innerRadius={24} outerRadius={36} dataKey="value" paddingAngle={2}>
                    {obligacionesData.map((e, i) => <Cell key={i} fill={e.color} />)}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <p className="text-[13px] font-bold text-white">320</p>
                <p className="text-[8px] text-white/30">Total</p>
              </div>
            </div>
            <div className="flex-1 space-y-1">
              {obligacionesData.map(o => (
                <div key={o.name} className="flex items-center gap-1 text-[9px]">
                  <div className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: o.color }} />
                  <span className="text-white/40 truncate">{o.name}</span>
                </div>
              ))}
            </div>
          </div>
        </DarkCard>

        <DarkCard title="Ingresos del Estudio" icon={Activity} iconColor="text-green-400" linkTo="/invoicing" linkLabel="Ver detalle">
          <p className="text-[9px] text-white/25 mb-1">Últimos 6 meses</p>
          <ResponsiveContainer width="100%" height={80}>
            <AreaChart data={ingresosMeses}>
              <defs>
                <linearGradient id="estGIng" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <XAxis dataKey="mes" tick={{ fill: "#ffffff25", fontSize: 8 }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ background: "#1a1b2e", border: "none", borderRadius: 6, color: "#fff", fontSize: 10 }} />
              <Area type="monotone" dataKey="ingreso" stroke="#10b981" fill="url(#estGIng)" strokeWidth={1.5} />
            </AreaChart>
          </ResponsiveContainer>
        </DarkCard>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <DarkCard title="Clientes Riesgo Fiscal Alto" icon={AlertTriangle} iconColor="text-red-400" linkTo="/clients" linkLabel="Ver todos">
          {(riskClients.length > 0 ? riskClients : [
            { business_name: "Empresa del Norte SA", risk_level: "critical" },
            { business_name: "Constructora del Sur SRL", risk_level: "high" },
            { business_name: "Servicio Dinther SA", risk_level: "high" },
            { business_name: "Distribuidora Central SA", risk_level: "high" },
            { business_name: "Industria Metalúrgica SRL", risk_level: "critical" },
          ]).slice(0, 5).map((c, i) => (
            <div key={i} className="flex items-center justify-between py-1.5 border-b border-white/5 last:border-0">
              <span className="text-[10px] text-white/70 truncate flex-1">{c.business_name}</span>
              <span className={`text-[9px] font-semibold px-1.5 py-0.5 rounded-full ml-1 flex-shrink-0 ${
                c.risk_level === "critical" ? "bg-red-500/20 text-red-400" : "bg-amber-500/20 text-amber-400"
              }`}>{c.risk_level === "critical" ? "Crítico" : "Alto"}</span>
            </div>
          ))}
        </DarkCard>

        <DarkCard title="Actividad Reciente" icon={Activity} iconColor="text-blue-400" linkTo="/audit" linkLabel="Ver toda">
          <div className="space-y-1.5">
            {actividadReciente.map((a, i) => (
              <div key={i} className="flex items-start justify-between gap-1 py-1 border-b border-white/5 last:border-0">
                <div className="flex-1 min-w-0">
                  <p className="text-[10px] text-white/70 truncate">{a.texto}</p>
                  <p className="text-[9px] text-white/25">{a.hace}</p>
                </div>
                <span className={`text-[8px] font-semibold px-1.5 py-0.5 rounded-full flex-shrink-0 ${
                  a.riesgo === "Alta" ? "bg-red-500/20 text-red-400" :
                  a.riesgo === "Medio" ? "bg-amber-500/20 text-amber-400" : "bg-emerald-500/20 text-emerald-400"
                }`}>{a.riesgo}</span>
              </div>
            ))}
          </div>
        </DarkCard>
      </div>
    </div>
  );
}