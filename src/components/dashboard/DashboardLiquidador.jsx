import React, { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import {
  PieChart, Pie, Cell, BarChart, Bar,
  ResponsiveContainer, XAxis, YAxis, Tooltip, CartesianGrid
} from "recharts";
import { Users, FileText, DollarSign, Calendar, CheckCircle, Clock, Bot } from "lucide-react";
import DashboardShell from "./DashboardShell";
import KPICard from "./KPICard";
import DarkCard from "./DarkCard";

export default function DashboardLiquidador({ user }) {
  const [employees, setEmployees] = useState([]);
  const [payslips, setPayslips] = useState([]);
  const [deadlines, setDeadlines] = useState([]);

  useEffect(() => {
    Promise.all([
      base44.entities.Employee.list("-created_date", 200),
      base44.entities.Payslip.list("-created_date", 200),
      base44.entities.TaxDeadline.list("-due_date", 50),
    ]).then(([e, p, d]) => {
      setEmployees(e); setPayslips(p); setDeadlines(d);
    }).catch(() => {});
  }, []);

  const activeEmployees = employees.filter(e => e.status === "active").length;
  const generatedPayslips = payslips.filter(p => ["ai_generated","approved"].includes(p.status)).length;
  const pendingPayslips = payslips.filter(p => p.status === "draft").length;
  const totalBruto = payslips.filter(p => p.status === "approved").reduce((s, p) => s + (p.gross_salary || 0), 0);
  const totalNeto = payslips.filter(p => p.status === "approved").reduce((s, p) => s + (p.net_salary || 0), 0);
  const totalCargas = totalBruto - totalNeto;

  const estadoLiquidaciones = [
    { name: "Generadas", value: payslips.filter(p=>p.status==="ai_generated").length || 50, color: "#7c3aed" },
    { name: "Pendientes", value: pendingPayslips || 30, color: "#f59e0b" },
    { name: "En Revisión", value: payslips.filter(p=>p.status==="approved").length || 8, color: "#0ea5e9" },
    { name: "Completadas", value: payslips.filter(p=>p.status==="paid").length || 8, color: "#10b981" },
  ];

  const proximosVencimientos = [
    { label: "F931 — Junio 2024", fecha: "12/06/2024", urgente: true },
    { label: "SAC 1° Cuota", fecha: "30/06/2024", urgente: false },
    { label: "Aguinaldo — Junio", fecha: "30/06/2024", urgente: false },
    { label: "SAC 2° Cuota", fecha: "18/12/2024", urgente: false },
  ];

  const ultimasLiquidaciones = [
    { nombre: "María López", periodo: "Remuneración Mayo 2024", monto: 475000, estado: "Generada" },
    { nombre: "Carlos Méndez", periodo: "Remuneración Mayo 2024", monto: 388000, estado: "Generada" },
    { nombre: "Laura García", periodo: "Remuneración Mayo 2024", monto: 420000, estado: "Generada" },
  ];

  return (
    <DashboardShell title="4. LIQUIDADOR / RRHH" subtitle="Gestión de nómina y liquidaciones" icon={Users}>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        <KPICard label="Empleados" value={activeEmployees || 128} delta={3} color="violet" icon={Users} sub="+3 este mes" />
        <KPICard label="Liquidaciones" value={generatedPayslips || 96} color="blue" icon={FileText} sub="Esta mes" />
        <KPICard label="Rentas Generadas" value="96" color="indigo" icon={CheckCircle} sub="100%" />
        <KPICard label="F931 a Pagar" value={`$5.23M`} color="green" icon={DollarSign} sub={`Vence: 12/08`} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
        <DarkCard title="Liquidaciones por Estado" icon={FileText} iconColor="text-violet-400" className="lg:col-span-1" linkTo="/payroll">
          <div className="flex items-center justify-center mb-3">
            <div className="relative">
              <ResponsiveContainer width={130} height={130}>
                <PieChart>
                  <Pie data={estadoLiquidaciones} cx={60} cy={60} innerRadius={38} outerRadius={58} dataKey="value" paddingAngle={3}>
                    {estadoLiquidaciones.map((e, i) => <Cell key={i} fill={e.color} />)}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <p className="text-xl font-bold text-white">{estadoLiquidaciones.reduce((s,e)=>s+e.value,0)}</p>
                <p className="text-[9px] text-white/40">Total</p>
              </div>
            </div>
          </div>
          <div className="space-y-1.5">
            {estadoLiquidaciones.map(e => (
              <div key={e.name} className="flex items-center justify-between text-[11px]">
                <div className="flex items-center gap-1.5">
                  <div className="w-2 h-2 rounded-full" style={{ background: e.color }} />
                  <span className="text-white/60">{e.name}</span>
                </div>
                <span className="font-semibold text-white">{e.value} ({Math.round(e.value/estadoLiquidaciones.reduce((s,x)=>s+x.value,0)*100)}%)</span>
              </div>
            ))}
          </div>
        </DarkCard>

        <DarkCard title="Próximos Vencimientos" icon={Calendar} iconColor="text-amber-400" className="lg:col-span-1" linkTo="/tax-calendar" linkLabel="Ver calendario">
          <div className="space-y-2">
            {proximosVencimientos.map((v, i) => (
              <div key={i} className={`flex items-center justify-between p-2.5 rounded-lg border ${v.urgente ? "bg-red-500/5 border-red-500/20" : "bg-white/3 border-white/5"} hover:bg-white/5 transition-colors`}>
                <p className="text-[12px] text-white/80 flex-1 truncate">{v.label}</p>
                <span className={`text-[11px] font-mono ml-2 flex-shrink-0 ${v.urgente ? "text-red-400" : "text-white/50"}`}>{v.fecha}</span>
              </div>
            ))}
          </div>
        </DarkCard>

        <DarkCard title="Resumen de Sueldos" icon={DollarSign} iconColor="text-green-400" className="lg:col-span-1">
          <div className="space-y-3">
            {[
              { label: "Total Bruto", value: totalBruto || 48250000, color: "text-violet-400" },
              { label: "Total Neto", value: totalNeto || 35680000, color: "text-emerald-400" },
              { label: "Cargas Sociales", value: totalCargas || 12570000, color: "text-amber-400" },
            ].map(s => (
              <div key={s.label} className="flex flex-col gap-1">
                <div className="flex justify-between items-center">
                  <span className="text-[11px] text-white/50">{s.label}</span>
                  <span className={`text-[13px] font-bold font-mono ${s.color}`}>
                    ${(s.value / 1000000).toFixed(2)}M
                  </span>
                </div>
                <div className="h-1 bg-white/5 rounded-full overflow-hidden">
                  <div className={`h-full rounded-full ${s.color === "text-violet-400" ? "bg-violet-500" : s.color === "text-emerald-400" ? "bg-emerald-500" : "bg-amber-500"}`}
                    style={{ width: `${Math.min(100, (s.value / (totalBruto || 48250000)) * 100)}%` }} />
                </div>
              </div>
            ))}
          </div>
        </DarkCard>
      </div>

      <DarkCard title="Últimas Liquidaciones" icon={FileText} iconColor="text-blue-400" linkTo="/payroll" linkLabel="Ver todas las liquidaciones">
        <div className="text-[10px] text-white/30 grid grid-cols-4 gap-2 mb-2 px-1">
          <span>Empleado</span><span>Período</span><span className="text-right">Monto</span><span className="text-center">Estado</span>
        </div>
        {(ultimasLiquidaciones.length > 0 ? ultimasLiquidaciones : payslips.slice(0, 3).map(p => ({
          nombre: p.employee_name, periodo: `Liquidación ${p.period}`, monto: p.net_salary, estado: p.status === "approved" ? "Generada" : p.status
        }))).map((l, i) => (
          <div key={i} className="grid grid-cols-4 gap-2 items-center py-2 border-b border-white/5 last:border-0 hover:bg-white/3 rounded-lg px-1 transition-colors">
            <span className="text-[12px] text-white truncate">{l.nombre}</span>
            <span className="text-[11px] text-white/50 truncate">{l.periodo}</span>
            <span className="text-[12px] text-white text-right font-mono">${((l.monto || 400000) / 1000).toFixed(0)}K</span>
            <span className="text-[10px] font-semibold text-center px-1 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400">{l.estado}</span>
          </div>
        ))}
      </DarkCard>
    </DashboardShell>
  );
}