import React, { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { PieChart, Pie, Cell, ResponsiveContainer } from "recharts";
import { Users, FileText, DollarSign, Calendar, CheckCircle } from "lucide-react";
import KPICard from "./KPICard";
import DarkCard from "./DarkCard";

export default function DashboardLiquidador({ user }) {
  const [employees, setEmployees] = useState([]);
  const [payslips, setPayslips] = useState([]);

  useEffect(() => {
    Promise.all([
      base44.entities.Employee.list("-created_date", 200),
      base44.entities.Payslip.list("-created_date", 200),
    ]).then(([e, p]) => { setEmployees(e); setPayslips(p); }).catch(() => {});
  }, []);

  const activeEmployees = employees.filter(e => e.status === "active").length;
  const generatedPayslips = payslips.filter(p => ["ai_generated","approved"].includes(p.status)).length;
  const totalBruto = payslips.filter(p => p.status === "approved").reduce((s, p) => s + (p.gross_salary || 0), 0);
  const totalNeto = payslips.filter(p => p.status === "approved").reduce((s, p) => s + (p.net_salary || 0), 0);
  const totalCargas = totalBruto - totalNeto;

  const estadoLiquidaciones = [
    { name: "Generadas", value: payslips.filter(p=>p.status==="ai_generated").length || 50, color: "#7c3aed" },
    { name: "Pendientes", value: payslips.filter(p=>p.status==="draft").length || 30, color: "#f59e0b" },
    { name: "En Revisión", value: payslips.filter(p=>p.status==="approved").length || 8, color: "#0ea5e9" },
    { name: "Completadas", value: payslips.filter(p=>p.status==="paid").length || 8, color: "#10b981" },
  ];
  const total = estadoLiquidaciones.reduce((s,e)=>s+e.value,0);

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
    <div>
      <div className="grid grid-cols-2 gap-2 mb-3">
        <KPICard label="Empleados" value={activeEmployees || 128} delta={3} color="violet" icon={Users} sub="+3 este mes" />
        <KPICard label="Liquidaciones" value={generatedPayslips || 96} color="blue" icon={FileText} sub="Este mes" />
        <KPICard label="Rentas Generadas" value="96" color="indigo" icon={CheckCircle} sub="100%" />
        <KPICard label="F931 a Pagar" value={`$5.23M`} color="green" icon={DollarSign} sub="Vence: 12/08" />
      </div>

      <div className="grid grid-cols-3 gap-2 mb-3">
        <DarkCard title="Estado Liquidaciones" icon={FileText} iconColor="text-violet-400">
          <div className="flex items-center gap-2">
            <div className="relative flex-shrink-0">
              <ResponsiveContainer width={70} height={70}>
                <PieChart>
                  <Pie data={estadoLiquidaciones} cx={33} cy={33} innerRadius={20} outerRadius={32} dataKey="value" paddingAngle={2}>
                    {estadoLiquidaciones.map((e, i) => <Cell key={i} fill={e.color} />)}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 flex items-center justify-center">
                <p className="text-[11px] font-bold text-white">{total}</p>
              </div>
            </div>
            <div className="flex-1 space-y-1">
              {estadoLiquidaciones.map(e => (
                <div key={e.name} className="flex items-center justify-between text-[9px]">
                  <div className="flex items-center gap-1">
                    <div className="w-1.5 h-1.5 rounded-full" style={{ background: e.color }} />
                    <span className="text-white/50">{e.name}</span>
                  </div>
                  <span className="text-white font-semibold">{e.value} ({Math.round(e.value/total*100)}%)</span>
                </div>
              ))}
            </div>
          </div>
        </DarkCard>

        <DarkCard title="Próximos Vencimientos" icon={Calendar} iconColor="text-amber-400" linkTo="/tax-calendar" linkLabel="Ver calendario">
          <div className="space-y-1.5">
            {proximosVencimientos.map((v, i) => (
              <div key={i} className={`flex items-center justify-between p-1.5 rounded-lg border ${v.urgente ? "bg-red-500/5 border-red-500/20" : "bg-white/3 border-white/5"}`}>
                <p className="text-[9px] text-white/70 flex-1 truncate">{v.label}</p>
                <span className={`text-[9px] font-mono ml-1 flex-shrink-0 ${v.urgente ? "text-red-400" : "text-white/40"}`}>{v.fecha}</span>
              </div>
            ))}
          </div>
        </DarkCard>

        <DarkCard title="Resumen de Sueldos" icon={DollarSign} iconColor="text-green-400">
          <div className="space-y-2">
            {[
              { label: "Total Bruto", value: totalBruto || 48250000, color: "text-violet-400" },
              { label: "Total Neto", value: totalNeto || 35680000, color: "text-emerald-400" },
              { label: "Cargas Sociales", value: totalCargas || 12570000, color: "text-amber-400" },
            ].map(s => (
              <div key={s.label}>
                <div className="flex justify-between items-center mb-0.5">
                  <span className="text-[9px] text-white/40">{s.label}</span>
                  <span className={`text-[10px] font-bold font-mono ${s.color}`}>${(s.value/1000000).toFixed(2)}M</span>
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
        <div className="text-[9px] text-white/25 grid grid-cols-4 gap-2 mb-1 px-1">
          <span>Empleado</span><span>Período</span><span className="text-right">Monto</span><span className="text-center">Estado</span>
        </div>
        {ultimasLiquidaciones.map((l, i) => (
          <div key={i} className="grid grid-cols-4 gap-2 items-center py-1.5 border-b border-white/5 last:border-0 px-1">
            <span className="text-[10px] text-white truncate">{l.nombre}</span>
            <span className="text-[9px] text-white/40 truncate">{l.periodo}</span>
            <span className="text-[10px] text-white text-right font-mono">${((l.monto||0)/1000).toFixed(0)}K</span>
            <span className="text-[9px] font-semibold text-center px-1 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400">{l.estado}</span>
          </div>
        ))}
      </DarkCard>
    </div>
  );
}