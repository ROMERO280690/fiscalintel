import React, { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  LineChart, Line, ResponsiveContainer, XAxis, YAxis, Tooltip, CartesianGrid
} from "recharts";
import { Users, FileText, Bot, DollarSign, AlertTriangle, Activity, TrendingUp, CheckCircle } from "lucide-react";
import DashboardShell from "./DashboardShell";
import KPICard from "./KPICard";
import DarkCard from "./DarkCard";

export default function DashboardEstudio({ user }) {
  const [clients, setClients] = useState([]);
  const [docs, setDocs] = useState([]);
  const [filings, setFilings] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [payslips, setPayslips] = useState([]);

  useEffect(() => {
    Promise.all([
      base44.entities.Client.list("-created_date", 200),
      base44.entities.Document.list("-created_date", 200),
      base44.entities.TaxFiling.list("-created_date", 200),
      base44.entities.Task.list("-created_date", 100),
      base44.entities.Payslip.list("-created_date", 100),
    ]).then(([c, d, f, t, p]) => {
      setClients(c); setDocs(d); setFilings(f); setTasks(t); setPayslips(p);
    }).catch(() => {});
  }, []);

  const activeClients = clients.filter(c => c.status === "active").length;
  const pendingObligaciones = filings.filter(f => ["draft","ai_generated"].includes(f.status)).length;
  const aiProcesses = docs.filter(d => ["classified","approved"].includes(d.status)).length;
  const facturacion = filings.reduce((s, f) => s + (f.tax_payable || 0), 0);
  const riskClients = clients.filter(c => ["high","critical"].includes(c.risk_level));

  const evolucionData = [
    { mes: "Ene", ventas: 38, iibb: 22, total: 60 },
    { mes: "Feb", ventas: 42, iibb: 25, total: 67 },
    { mes: "Mar", ventas: 51, iibb: 30, total: 81 },
    { mes: "Abr", ventas: 47, iibb: 28, total: 75 },
    { mes: "May", ventas: 62, iibb: 35, total: 97 },
    { mes: "Jun", ventas: 59, iibb: 32, total: 91 },
  ];

  const obligacionesVencer = [
    { name: "Vende 38 (21%)", value: 38, color: "#7c3aed" },
    { name: "Hoy 60 (17%)", value: 60, color: "#4f46e5" },
    { name: "Mañana 46 (13%)", value: 46, color: "#0ea5e9" },
    { name: "Pendiente 50 (14%)", value: 50, color: "#10b981" },
    { name: "Completado 72 (20%)", value: 72, color: "#f59e0b" },
  ];

  const actividadReciente = [
    { texto: "Gemelo Fiscal — Conexión ContaSur SA", riesgo: "Alta", hace: "Hace 13 min" },
    { texto: "Factura enviada — Employer Juan Pérez", riesgo: "Medio", hace: "Hace 23 min" },
    { texto: "DDJJ IVA-009 — 000123A emitida", riesgo: "Alta", hace: "Hace 43 min" },
    { texto: "Liquidación Nómina SA", riesgo: "Bajo", hace: "Hace 1 hora" },
    { texto: "Proceso IA completado — 12 comprobantes", riesgo: "Alta", hace: "1 hora" },
  ];

  const ingresosMeses = [
    { mes: "Ene", ingreso: 1800 }, { mes: "Feb", ingreso: 2100 },
    { mes: "Mar", ingreso: 2800 }, { mes: "Abr", ingreso: 2400 },
    { mes: "May", ingreso: 3200 }, { mes: "Jun", ingreso: 2900 },
  ];

  return (
    <DashboardShell title="2. ESTUDIO CONTABLE" subtitle="Gestión de clientes y equipos" icon={Users}>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        <KPICard label="Clientes Activos" value={activeClients || 156} delta={7} color="violet" icon={Users} sub="+12 este mes" />
        <KPICard label="Obligaciones" value={pendingObligaciones || 320} delta={-5} color="amber" icon={FileText} sub="38 vencen hoy" />
        <KPICard label="Procesos IA" value={aiProcesses || 1245} delta={25} color="blue" icon={Bot} sub="+15 esta semana" />
        <KPICard label="Facturación Mes" value={`$8.45M`} delta={15} color="green" icon={DollarSign} sub="+17% vs anterior" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
        <DarkCard title="Obligaciones por Vencer" icon={AlertTriangle} iconColor="text-amber-400" className="lg:col-span-1">
          <div className="flex items-center justify-center mb-2">
            <div className="relative">
              <ResponsiveContainer width={140} height={140}>
                <PieChart>
                  <Pie data={obligacionesVencer} cx={65} cy={65} innerRadius={40} outerRadius={62} dataKey="value" paddingAngle={2}>
                    {obligacionesVencer.map((e, i) => <Cell key={i} fill={e.color} />)}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <p className="text-2xl font-bold text-white">320</p>
                <p className="text-[9px] text-white/40">Total</p>
              </div>
            </div>
          </div>
          <div className="space-y-1">
            {obligacionesVencer.map(o => (
              <div key={o.name} className="flex items-center justify-between text-[11px]">
                <div className="flex items-center gap-1.5">
                  <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: o.color }} />
                  <span className="text-white/50 truncate">{o.name}</span>
                </div>
              </div>
            ))}
          </div>
        </DarkCard>

        <DarkCard title="Ingresos del Estudio" icon={TrendingUp} iconColor="text-green-400" className="lg:col-span-2" linkTo="/invoicing" linkLabel="Ver detalle">
          <p className="text-[10px] text-white/30 mb-1">Últimos 6 meses</p>
          <ResponsiveContainer width="100%" height={165}>
            <AreaChart data={ingresosMeses}>
              <defs>
                <linearGradient id="gIng" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#ffffff08" />
              <XAxis dataKey="mes" tick={{ fill: "#ffffff40", fontSize: 10 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: "#ffffff40", fontSize: 10 }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ background: "#1a1b2e", border: "1px solid #ffffff10", borderRadius: 8, color: "#fff", fontSize: 12 }} />
              <Area type="monotone" dataKey="ingreso" stroke="#10b981" fill="url(#gIng)" strokeWidth={2} name="Ingresos" />
            </AreaChart>
          </ResponsiveContainer>
        </DarkCard>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <DarkCard title="Clientes con Riesgo Fiscal Alto" icon={AlertTriangle} iconColor="text-red-400" linkTo="/clients" linkLabel="Ver todos">
          <div className="text-[10px] text-white/30 grid grid-cols-3 gap-2 mb-2 px-1">
            <span>Cliente</span><span className="text-center">Riesgo</span><span className="text-right">Compliance</span>
          </div>
          {(riskClients.length > 0 ? riskClients : [
            { business_name: "Empresa del Norte SA", risk_level: "critical", compliance_score: 35 },
            { business_name: "Constructora del Sur SRL", risk_level: "high", compliance_score: 62 },
            { business_name: "Servicio Dinther SA", risk_level: "high", compliance_score: 58 },
            { business_name: "Distribuidora Central SA", risk_level: "high", compliance_score: 71 },
            { business_name: "Industria Metalúrgica SRL", risk_level: "critical", compliance_score: 28 },
          ]).slice(0, 5).map((c, i) => (
            <div key={i} className="grid grid-cols-3 gap-2 items-center py-2 border-b border-white/5 last:border-0 hover:bg-white/3 rounded-lg px-1 transition-colors">
              <span className="text-[12px] text-white truncate">{c.business_name}</span>
              <span className={`text-[11px] font-semibold text-center px-2 py-0.5 rounded-full ${
                c.risk_level === "critical" ? "bg-red-500/20 text-red-400" : "bg-amber-500/20 text-amber-400"
              }`}>{c.risk_level === "critical" ? "Crítico" : "Alto"}</span>
              <div className="flex items-center gap-2 justify-end">
                <div className="w-16 h-1 bg-white/10 rounded-full overflow-hidden">
                  <div className="h-full rounded-full bg-red-500" style={{ width: `${c.compliance_score || 50}%` }} />
                </div>
                <span className="text-[11px] text-white/50">{c.compliance_score || 50}</span>
              </div>
            </div>
          ))}
        </DarkCard>

        <DarkCard title="Actividad Reciente" icon={Activity} iconColor="text-blue-400" linkTo="/audit" linkLabel="Ver toda la actividad">
          <div className="space-y-2">
            {actividadReciente.map((a, i) => (
              <div key={i} className="flex items-start gap-3 py-2 border-b border-white/5 last:border-0 hover:bg-white/3 rounded-lg px-1 transition-colors">
                <div className="flex-1 min-w-0">
                  <p className="text-[12px] text-white/80 truncate">{a.texto}</p>
                  <p className="text-[10px] text-white/30">{a.hace}</p>
                </div>
                <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full flex-shrink-0 ${
                  a.riesgo === "Alta" ? "bg-red-500/20 text-red-400" :
                  a.riesgo === "Medio" ? "bg-amber-500/20 text-amber-400" :
                  "bg-emerald-500/20 text-emerald-400"
                }`}>{a.riesgo}</span>
              </div>
            ))}
          </div>
        </DarkCard>
      </div>
    </DashboardShell>
  );
}