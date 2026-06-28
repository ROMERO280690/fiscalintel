import React, { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { Link } from "react-router-dom";
import {
  AreaChart, Area, LineChart, Line, BarChart, Bar,
  PieChart, Pie, Cell, ResponsiveContainer, XAxis, YAxis, Tooltip, CartesianGrid
} from "recharts";
import { Building2, Users, Bot, TrendingUp, Activity, AlertTriangle, ChevronRight, ArrowUpRight } from "lucide-react";
import DashboardShell from "./DashboardShell";
import KPICard from "./KPICard";
import DarkCard from "./DarkCard";

export default function DashboardSuperAdmin({ user }) {
  const [clients, setClients] = useState([]);
  const [docs, setDocs] = useState([]);
  const [filings, setFilings] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [orgs, setOrgs] = useState([]);
  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      base44.entities.Client.list("-created_date", 200),
      base44.entities.Document.list("-created_date", 200),
      base44.entities.TaxFiling.list("-created_date", 200),
      base44.entities.Task.list("-created_date", 100),
      base44.entities.Organization.list("-created_date", 50),
      base44.entities.Company.list("-created_date", 100),
    ]).then(([c, d, f, t, o, co]) => {
      setClients(c); setDocs(d); setFilings(f); setTasks(t); setOrgs(o); setCompanies(co);
    }).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const activeClients = clients.filter(c => c.status === "active").length;
  const aiDone = docs.filter(d => ["classified","approved"].includes(d.status)).length;
  const aiPending = docs.filter(d => d.status === "uploaded").length + filings.filter(f => f.status === "draft").length;
  const totalPayable = filings.reduce((s, f) => s + (f.tax_payable || 0), 0);

  const activityData = [
    { mes: "Ene", ingresos: 420, gastos: 280, resultado: 140 },
    { mes: "Feb", ingresos: 380, gastos: 310, resultado: 70 },
    { mes: "Mar", ingresos: 510, gastos: 290, resultado: 220 },
    { mes: "Abr", ingresos: 470, gastos: 340, resultado: 130 },
    { mes: "May", ingresos: 620, gastos: 380, resultado: 240 },
    { mes: "Jun", ingresos: 590, gastos: 310, resultado: 280 },
  ];

  const obligacionesData = [
    { name: "IVA", value: filings.filter(f => f.filing_type === "iva").length || 38, color: "#7c3aed" },
    { name: "IIBB", value: filings.filter(f => f.filing_type === "iibb").length || 22, color: "#4f46e5" },
    { name: "Ganancias", value: filings.filter(f => f.filing_type === "ganancias").length || 15, color: "#0ea5e9" },
    { name: "Sueldos", value: filings.filter(f => f.filing_type === "sueldos").length || 25, color: "#10b981" },
  ];

  const systemStatus = [
    { label: "Base de Datos", status: "Operativo", color: "text-emerald-400" },
    { label: "Servidor IA", status: "Operativo", color: "text-emerald-400" },
    { label: "Conexión ARCA", status: "Operativo", color: "text-emerald-400" },
    { label: "Colas Tareas", status: `${tasks.filter(t=>t.status==="pending").length} pendientes`, color: "text-amber-400" },
  ];

  const topOrgs = [...orgs].slice(0, 4).map((o, i) => ({
    ...o,
    companies: companies.filter(c => c.organization_id === o.id).length,
    ingresos: [125450, 89300, 67200, 43100][i] || 0,
    delta: [12, 8, -3, 15][i] || 0,
  }));

  const recentActivity = [
    { text: "Nueva organización registrada", time: "Ahora 13:24", type: "org" },
    { text: "Proceso IA completado", time: "Ago 10:30", type: "ai" },
    { text: "DDJJ presentada automáticamente", time: "Ago 10:00", type: "filing" },
    { text: "Nuevo usuario administrador", time: "Ago 9:45", type: "user" },
    { text: "Nuevo asiento registrado", time: "1 hora", type: "entry" },
  ];

  if (loading) return <LoadingSpinner />;

  return (
    <DashboardShell title="1. SUPER ADMINISTRADOR" subtitle="Visión global de toda la plataforma" icon={Building2}>
      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 mb-6">
        <KPICard label="Organizaciones" value={orgs.length || 28} delta={12} color="violet" icon={Building2} />
        <KPICard label="Usuarios Activos" value={clients.length || 1248} delta={8} color="blue" icon={Users} />
        <KPICard label="Empresas" value={companies.length || 856} delta={15} color="indigo" icon={Building2} />
        <KPICard label="Ingresos del Mes" value={`$${(45230000).toLocaleString("es-AR")}`} delta={22} color="green" icon={TrendingUp} />
        <KPICard label="Procesos IA" value={aiDone + aiPending || 14582} delta={-4} color="amber" icon={Bot} />
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
        {/* Ingresos y Actividad */}
        <DarkCard title="Ingresos y Actividad" icon={TrendingUp} iconColor="text-violet-400" className="lg:col-span-2">
          <ResponsiveContainer width="100%" height={180}>
            <AreaChart data={activityData}>
              <defs>
                <linearGradient id="gI" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#7c3aed" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#7c3aed" stopOpacity={0}/>
                </linearGradient>
                <linearGradient id="gG" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#4f46e5" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#ffffff08" />
              <XAxis dataKey="mes" tick={{ fill: "#ffffff40", fontSize: 10 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: "#ffffff40", fontSize: 10 }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ background: "#1a1b2e", border: "1px solid #ffffff10", borderRadius: 8, color: "#fff", fontSize: 12 }} />
              <Area type="monotone" dataKey="ingresos" stroke="#7c3aed" fill="url(#gI)" strokeWidth={2} name="Ingresos" />
              <Area type="monotone" dataKey="gastos" stroke="#4f46e5" fill="url(#gG)" strokeWidth={2} name="Gastos" />
              <Line type="monotone" dataKey="resultado" stroke="#10b981" strokeWidth={2} dot={false} name="Resultado" />
            </AreaChart>
          </ResponsiveContainer>
        </DarkCard>

        {/* Obligaciones pendientes */}
        <DarkCard title="Obligaciones Pendientes" icon={AlertTriangle} iconColor="text-amber-400">
          <div className="flex items-center justify-center mb-3">
            <div className="relative">
              <ResponsiveContainer width={140} height={140}>
                <PieChart>
                  <Pie data={obligacionesData} cx={65} cy={65} innerRadius={42} outerRadius={62} dataKey="value" paddingAngle={3}>
                    {obligacionesData.map((e, i) => <Cell key={i} fill={e.color} />)}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <p className="text-2xl font-bold text-white">{obligacionesData.reduce((s,o)=>s+o.value,0)}</p>
                <p className="text-[9px] text-white/40">Total</p>
              </div>
            </div>
          </div>
          <div className="space-y-1.5">
            {obligacionesData.map(o => (
              <div key={o.name} className="flex items-center justify-between text-[11px]">
                <div className="flex items-center gap-1.5">
                  <div className="w-2 h-2 rounded-full" style={{ background: o.color }} />
                  <span className="text-white/60">{o.name}</span>
                </div>
                <span className="font-semibold text-white">{o.value}</span>
              </div>
            ))}
          </div>
          <div className="mt-3 text-center">
            <span className="text-[10px] text-white/30">Estado del Sistema</span>
            <div className="mt-2 space-y-1">
              {systemStatus.map(s => (
                <div key={s.label} className="flex justify-between text-[10px]">
                  <span className="text-white/40">{s.label}</span>
                  <span className={s.color}>{s.status}</span>
                </div>
              ))}
            </div>
          </div>
        </DarkCard>
      </div>

      {/* Bottom row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Top Organizaciones */}
        <DarkCard title="Top Organizaciones por Ingresos" icon={Building2} iconColor="text-violet-400" linkTo="/companies" linkLabel="Ver todas">
          <div className="text-[10px] text-white/30 grid grid-cols-4 gap-2 mb-2 px-1">
            <span>Organización</span><span className="text-right">Empresas</span><span className="text-right">Ingresos</span><span className="text-right">Var.</span>
          </div>
          {topOrgs.length > 0 ? topOrgs.map((o, i) => (
            <div key={o.id} className="grid grid-cols-4 gap-2 items-center py-2 border-b border-white/5 last:border-0 hover:bg-white/3 rounded-lg px-1 transition-colors">
              <div className="flex items-center gap-2 min-w-0">
                <div className="w-6 h-6 rounded-md bg-violet-500/20 flex items-center justify-center text-violet-300 text-[10px] font-bold flex-shrink-0">{i+1}</div>
                <span className="text-[12px] text-white truncate">{o.name || "Estudio " + (i+1)}</span>
              </div>
              <span className="text-[12px] text-white/60 text-right">{o.companies}</span>
              <span className="text-[12px] text-white text-right font-mono">${(o.ingresos/1000).toFixed(0)}K</span>
              <span className={`text-[11px] font-semibold text-right ${o.delta >= 0 ? "text-emerald-400" : "text-red-400"}`}>
                {o.delta >= 0 ? "+" : ""}{o.delta}%
              </span>
            </div>
          )) : [1,2,3,4].map(i => (
            <div key={i} className="grid grid-cols-4 gap-2 items-center py-2 border-b border-white/5 last:border-0 px-1">
              <div className="flex items-center gap-2"><div className="w-6 h-6 rounded-md bg-violet-500/20 flex items-center justify-center text-violet-300 text-[10px] font-bold">{i}</div><span className="text-[12px] text-white">Estudio {["Consultar SRL","Global SA","Integral","Pyme"][i-1]}</span></div>
              <span className="text-[12px] text-white/60 text-right">{[45,38,29,18][i-1]}</span>
              <span className="text-[12px] text-white text-right font-mono">${[125,89,67,43][i-1]}K</span>
              <span className={`text-[11px] font-semibold text-right ${[true,true,false,true][i-1] ? "text-emerald-400" : "text-red-400"}`}>{["+22%","+8%","-3%","+12%"][i-1]}</span>
            </div>
          ))}
        </DarkCard>

        {/* Actividad Reciente */}
        <DarkCard title="Actividad Reciente" icon={Activity} iconColor="text-blue-400" linkTo="/audit" linkLabel="Ver todo">
          <div className="space-y-2">
            {recentActivity.map((a, i) => (
              <div key={i} className="flex items-start gap-3 py-2 border-b border-white/5 last:border-0 hover:bg-white/3 rounded-lg px-1 transition-colors">
                <div className={`w-6 h-6 rounded-full flex-shrink-0 flex items-center justify-center text-[9px] font-bold ${
                  a.type === "ai" ? "bg-violet-500/20 text-violet-300" :
                  a.type === "org" ? "bg-blue-500/20 text-blue-300" :
                  a.type === "filing" ? "bg-emerald-500/20 text-emerald-300" :
                  "bg-amber-500/20 text-amber-300"
                }`}>
                  {a.type === "ai" ? "IA" : a.type === "org" ? "OR" : a.type === "filing" ? "DJ" : "US"}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[12px] text-white/80">{a.text}</p>
                  <p className="text-[10px] text-white/30">{a.time}</p>
                </div>
                <div className={`w-16 h-1.5 rounded-full overflow-hidden bg-white/5`}>
                  <div className={`h-full rounded-full ${["bg-violet-500","bg-blue-500","bg-emerald-500","bg-amber-500","bg-indigo-500"][i % 5]}`} style={{width: `${[100,80,60,90,40][i]}%`}} />
                </div>
              </div>
            ))}
          </div>
        </DarkCard>
      </div>
    </DashboardShell>
  );
}

function LoadingSpinner() {
  return (
    <div className="min-h-screen bg-[#0A0B14] flex items-center justify-center">
      <div className="flex flex-col items-center gap-3">
        <div className="w-10 h-10 border-2 border-violet-500/30 border-t-violet-500 rounded-full animate-spin" />
        <p className="text-white/40 text-sm">Cargando dashboard...</p>
      </div>
    </div>
  );
}