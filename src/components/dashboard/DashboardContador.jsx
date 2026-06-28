import React, { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { BarChart, Bar, ResponsiveContainer, XAxis, Tooltip, CartesianGrid } from "recharts";
import { Users, FileText, Clock, CheckSquare, AlertTriangle, Activity, Calendar } from "lucide-react";
import KPICard from "./KPICard";
import DarkCard from "./DarkCard";

export default function DashboardContador({ user }) {
  const [clients, setClients] = useState([]);
  const [filings, setFilings] = useState([]);
  const [tasks, setTasks] = useState([]);

  useEffect(() => {
    Promise.all([
      base44.entities.Client.list("-created_date", 200),
      base44.entities.TaxFiling.list("-created_date", 200),
      base44.entities.Task.list("-created_date", 100),
    ]).then(([c, f, t]) => { setClients(c); setFilings(f); setTasks(t); }).catch(() => {});
  }, []);

  const myClients = clients.filter(c => c.status === "active").length;
  const pendingDDJJ = filings.filter(f => ["draft","ai_generated","review"].includes(f.status)).length;
  const pendingTasks = tasks.filter(t => t.status === "pending").length;

  const actividadData = [
    { mes: "Ene", ddjj: 12, tareas: 8 }, { mes: "Feb", ddjj: 18, tareas: 11 },
    { mes: "Mar", ddjj: 22, tareas: 15 }, { mes: "Abr", ddjj: 16, tareas: 9 },
    { mes: "May", ddjj: 25, tareas: 18 }, { mes: "Jun", ddjj: 20, tareas: 14 },
  ];

  const criticalClients = [...clients].filter(c => ["high","critical"].includes(c.risk_level)).slice(0, 4);
  const urgentTasks = [...tasks].filter(t => ["urgent","high"].includes(t.priority) && t.status !== "completed").slice(0, 4);

  const proximasObligaciones = [
    { label: "IVA Manual — Mayo 2024", fecha: "Hoy", urgente: true },
    { label: "Proceso IA — DDJJ generada", fecha: "En 1 día", urgente: true },
    { label: "SCORE — Abril 2024", fecha: "En 2 días", urgente: false },
    { label: "Ganancias Personas Jurídicas", fecha: "En 5 días", urgente: false },
  ];

  return (
    <div>
      <div className="grid grid-cols-2 gap-2 mb-3">
        <KPICard label="Clientes Asignados" value={myClients || 48} delta={3} color="violet" icon={Users} sub="+4 este mes" />
        <KPICard label="Obligaciones" value={pendingDDJJ || 98} delta={-8} color="amber" icon={FileText} sub="15 próximos" />
        <KPICard label="DDJJ Pendientes" value={filings.filter(f=>f.status==="draft").length || 24} delta={0} color="red" icon={Clock} sub="8 urgentes" />
        <KPICard label="Tareas" value={pendingTasks || 32} delta={5} color="blue" icon={CheckSquare} sub="12 pendientes" />
      </div>

      <div className="grid grid-cols-2 gap-2 mb-3">
        <DarkCard title="Obligaciones Próximas" icon={Calendar} iconColor="text-amber-400" linkTo="/tax-calendar" linkLabel="Ver todas">
          <div className="space-y-1.5">
            {proximasObligaciones.map((o, i) => (
              <div key={i} className={`flex items-center justify-between p-1.5 rounded-lg border ${o.urgente ? "bg-red-500/5 border-red-500/20" : "bg-white/3 border-white/5"}`}>
                <p className="text-[10px] text-white/70 truncate flex-1">{o.label}</p>
                <span className={`text-[9px] font-semibold ml-1 px-1.5 py-0.5 rounded-full flex-shrink-0 ${o.urgente ? "bg-red-500/20 text-red-400" : "bg-white/10 text-white/40"}`}>{o.fecha}</span>
              </div>
            ))}
          </div>
        </DarkCard>

        <DarkCard title="Resumen de Actividad" icon={Activity} iconColor="text-violet-400">
          <ResponsiveContainer width="100%" height={100}>
            <BarChart data={actividadData}>
              <XAxis dataKey="mes" tick={{ fill: "#ffffff25", fontSize: 8 }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ background: "#1a1b2e", border: "none", borderRadius: 6, color: "#fff", fontSize: 10 }} />
              <Bar dataKey="ddjj" fill="#7c3aed" radius={[3,3,0,0]} name="DDJJ" />
              <Bar dataKey="tareas" fill="#4f46e5" radius={[3,3,0,0]} name="Tareas" />
            </BarChart>
          </ResponsiveContainer>
        </DarkCard>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <DarkCard title="Clientes que Requieren Atención" icon={AlertTriangle} iconColor="text-red-400" linkTo="/clients" linkLabel="Ver todos">
          {(criticalClients.length > 0 ? criticalClients : [
            { business_name: "Empresa del Norte SA", risk_level: "high" },
            { business_name: "Comercio Mayorista SRL", risk_level: "critical" },
            { business_name: "Servicios Profesionales SA", risk_level: "high" },
            { business_name: "Distribuidora Central SRL", risk_level: "high" },
          ]).map((c, i) => (
            <div key={i} className="flex items-center justify-between py-1.5 border-b border-white/5 last:border-0">
              <span className="text-[10px] text-white/70 truncate flex-1">{c.business_name}</span>
              <span className={`text-[9px] font-semibold px-1.5 py-0.5 rounded-full ml-1 flex-shrink-0 ${
                c.risk_level === "critical" ? "bg-red-500/20 text-red-400" : "bg-amber-500/20 text-amber-400"
              }`}>{c.risk_level === "critical" ? "Crítico" : "Alto"}</span>
            </div>
          ))}
        </DarkCard>

        <DarkCard title="Tareas Pendientes" icon={CheckSquare} iconColor="text-blue-400" linkTo="/tasks" linkLabel="Ver todas">
          {(urgentTasks.length > 0 ? urgentTasks : [
            { title: "Revisar comprobantes — Empresa ABC", priority: "urgent" },
            { title: "Generar DDJJ — Comercio Norte", priority: "high" },
            { title: "Factura bancaria — 3 pendientes", priority: "urgent" },
            { title: "Revisar liquidaciones — 5 empleados", priority: "high" },
          ]).map((t, i) => (
            <div key={i} className="flex items-center justify-between py-1.5 border-b border-white/5 last:border-0">
              <span className="text-[10px] text-white/70 truncate flex-1">{t.title}</span>
              <span className={`text-[9px] font-semibold px-1.5 py-0.5 rounded-full ml-1 flex-shrink-0 ${
                t.priority === "urgent" ? "bg-red-500/20 text-red-400" : "bg-amber-500/20 text-amber-400"
              }`}>{t.priority === "urgent" ? "Urgente" : "Alta"}</span>
            </div>
          ))}
        </DarkCard>
      </div>
    </div>
  );
}