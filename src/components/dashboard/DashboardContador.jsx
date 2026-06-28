import React, { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import {
  LineChart, Line, BarChart, Bar, ResponsiveContainer, XAxis, YAxis, Tooltip, CartesianGrid
} from "recharts";
import { Users, FileText, Clock, CheckSquare, AlertTriangle, Activity, Calendar, Zap } from "lucide-react";
import DashboardShell from "./DashboardShell";
import KPICard from "./KPICard";
import DarkCard from "./DarkCard";

export default function DashboardContador({ user }) {
  const [clients, setClients] = useState([]);
  const [filings, setFilings] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [deadlines, setDeadlines] = useState([]);

  useEffect(() => {
    Promise.all([
      base44.entities.Client.list("-created_date", 200),
      base44.entities.TaxFiling.list("-created_date", 200),
      base44.entities.Task.list("-created_date", 100),
      base44.entities.TaxDeadline.list("-due_date", 100),
    ]).then(([c, f, t, d]) => {
      setClients(c); setFilings(f); setTasks(t); setDeadlines(d);
    }).catch(() => {});
  }, []);

  const myClients = clients.filter(c => c.status === "active").length;
  const pendingDDJJ = filings.filter(f => ["draft","ai_generated","review"].includes(f.status)).length;
  const urgentDeadlines = deadlines.filter(d => {
    const diff = (new Date(d.due_date) - new Date()) / (1000 * 60 * 60 * 24);
    return diff >= 0 && diff <= 7;
  }).length;
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
    <DashboardShell title="3. CONTADOR" subtitle="Gestión de tus clientes asignados" icon={Users}>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        <KPICard label="Clientes Asignados" value={myClients || 48} delta={3} color="violet" icon={Users} sub="+4 este mes" />
        <KPICard label="Obligaciones" value={pendingDDJJ || 98} delta={-8} color="amber" icon={FileText} sub="15 vencimientos próximos" />
        <KPICard label="DDJJ Pendientes" value={filings.filter(f=>f.status==="draft").length || 24} delta={0} color="red" icon={Clock} sub="8 urgentes" />
        <KPICard label="Tareas" value={pendingTasks || 32} delta={5} color="blue" icon={CheckSquare} sub="12 pendientes" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
        <DarkCard title="Obligaciones Próximas" icon={Calendar} iconColor="text-amber-400" linkTo="/tax-calendar" linkLabel="Ver todas" className="lg:col-span-1">
          <div className="space-y-2">
            {proximasObligaciones.map((o, i) => (
              <div key={i} className={`flex items-center justify-between p-2.5 rounded-lg border ${o.urgente ? "bg-red-500/5 border-red-500/20" : "bg-white/3 border-white/5"} hover:bg-white/5 transition-colors`}>
                <div className="flex-1 min-w-0">
                  <p className="text-[12px] text-white/80 truncate">{o.label}</p>
                </div>
                <span className={`text-[11px] font-semibold ml-2 px-2 py-0.5 rounded-full flex-shrink-0 ${o.urgente ? "bg-red-500/20 text-red-400" : "bg-white/10 text-white/50"}`}>{o.fecha}</span>
              </div>
            ))}
          </div>
        </DarkCard>

        <DarkCard title="Resumen de Actividad" icon={Activity} iconColor="text-violet-400" className="lg:col-span-2">
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={actividadData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#ffffff08" />
              <XAxis dataKey="mes" tick={{ fill: "#ffffff40", fontSize: 10 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: "#ffffff40", fontSize: 10 }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ background: "#1a1b2e", border: "1px solid #ffffff10", borderRadius: 8, color: "#fff", fontSize: 12 }} />
              <Bar dataKey="ddjj" fill="#7c3aed" radius={[4,4,0,0]} name="DDJJ" />
              <Bar dataKey="tareas" fill="#4f46e5" radius={[4,4,0,0]} name="Tareas" />
            </BarChart>
          </ResponsiveContainer>
        </DarkCard>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <DarkCard title="Clientes que Requieren Atención" icon={AlertTriangle} iconColor="text-red-400" linkTo="/clients" linkLabel="Ver todos mis clientes">
          <div className="space-y-2">
            {(criticalClients.length > 0 ? criticalClients : [
              { business_name: "Empresa del Norte SA", risk_level: "high" },
              { business_name: "Comercio Mayorista SRL", risk_level: "critical" },
              { business_name: "Servicios Profesionales SA", risk_level: "high" },
              { business_name: "Distribuidora Central SRL", risk_level: "high" },
            ]).map((c, i) => (
              <div key={i} className="flex items-center justify-between py-2 border-b border-white/5 last:border-0 hover:bg-white/3 rounded-lg px-1 transition-colors">
                <span className="text-[12px] text-white/80 truncate flex-1">{c.business_name || c.fantasy_name}</span>
                <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ml-2 flex-shrink-0 ${
                  c.risk_level === "critical" ? "bg-red-500/20 text-red-400" : "bg-amber-500/20 text-amber-400"
                }`}>{c.risk_level === "critical" ? "Crítico" : "Alto"}</span>
              </div>
            ))}
          </div>
        </DarkCard>

        <DarkCard title="Tareas Pendientes" icon={CheckSquare} iconColor="text-blue-400" linkTo="/tasks" linkLabel="Ver todas las tareas">
          <div className="space-y-2">
            {(urgentTasks.length > 0 ? urgentTasks : [
              { title: "Revisar comprobantes — Empresa ABC", priority: "urgent" },
              { title: "Generar DDJJ — Comercio Norte", priority: "high" },
              { title: "Factura bancaria — 3 pendientes", priority: "urgent" },
              { title: "Revisar liquidaciones — 5 empleados", priority: "high" },
            ]).map((t, i) => (
              <div key={i} className="flex items-center justify-between py-2 border-b border-white/5 last:border-0 hover:bg-white/3 rounded-lg px-1 transition-colors">
                <span className="text-[12px] text-white/80 truncate flex-1">{t.title}</span>
                <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ml-2 flex-shrink-0 ${
                  t.priority === "urgent" ? "bg-red-500/20 text-red-400" : "bg-amber-500/20 text-amber-400"
                }`}>{t.priority === "urgent" ? "Urgente" : "Alta"}</span>
              </div>
            ))}
          </div>
        </DarkCard>
      </div>
    </DashboardShell>
  );
}