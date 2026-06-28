import React, { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import {
  AreaChart, Area, LineChart, Line,
  PieChart, Pie, Cell, ResponsiveContainer, XAxis, YAxis, Tooltip, CartesianGrid
} from "recharts";
import { Building2, Users, Bot, TrendingUp, Activity, AlertTriangle, Pencil, Trash2, Ban, CheckCircle, Eye } from "lucide-react";
import KPICard from "./KPICard";
import DarkCard from "./DarkCard";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export default function DashboardSuperAdmin({ user }) {
  const [clients, setClients] = useState([]);
  const [docs, setDocs] = useState([]);
  const [filings, setFilings] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [orgs, setOrgs] = useState([]);
  const [companies, setCompanies] = useState([]);
  const [users, setUsers] = useState([]);
  const [editingOrg, setEditingOrg] = useState(null);
  const [editingCompany, setEditingCompany] = useState(null);

  useEffect(() => {
    Promise.all([
      base44.entities.Client.list("-created_date", 200),
      base44.entities.Document.list("-created_date", 200),
      base44.entities.TaxFiling.list("-created_date", 200),
      base44.entities.Task.list("-created_date", 100),
      base44.entities.Organization.list("-created_date", 50),
      base44.entities.Company.list("-created_date", 100),
      base44.entities.User.list("-created_date", 100),
    ]).then(([c, d, f, t, o, co, u]) => {
      setClients(c); setDocs(d); setFilings(f); setTasks(t); setOrgs(o); setCompanies(co); setUsers(u);
    }).catch(() => {});
  }, []);

  const handleToggleOrgStatus = async (org) => {
    const newStatus = org.status === "active" ? "suspended" : "active";
    try {
      await base44.entities.Organization.update(org.id, { status: newStatus });
      setOrgs(orgs.map(o => o.id === org.id ? { ...o, status: newStatus } : o));
      toast.success(`Organización ${newStatus === "active" ? "activada" : "suspendida"}`);
    } catch (err) {
      toast.error(err.message);
    }
  };

  const handleDeleteOrg = async (orgId) => {
    if (!confirm("¿Eliminar esta organización? Se borrarán todas sus empresas asociadas.")) return;
    try {
      await base44.entities.Organization.delete(orgId);
      setOrgs(orgs.filter(o => o.id !== orgId));
      toast.success("Organización eliminada");
    } catch (err) {
      toast.error(err.message);
    }
  };

  const handleToggleCompanyStatus = async (company) => {
    const newStatus = company.status === "active" ? "suspended" : "active";
    try {
      await base44.entities.Company.update(company.id, { status: newStatus });
      setCompanies(companies.map(c => c.id === company.id ? { ...c, status: newStatus } : c));
      toast.success(`Empresa ${newStatus === "active" ? "activada" : "suspendida"}`);
    } catch (err) {
      toast.error(err.message);
    }
  };

  const handleDeleteCompany = async (companyId) => {
    if (!confirm("¿Eliminar esta empresa? Se borrarán todos sus datos asociados.")) return;
    try {
      await base44.entities.Company.delete(companyId);
      setCompanies(companies.filter(c => c.id !== companyId));
      toast.success("Empresa eliminada");
    } catch (err) {
      toast.error(err.message);
    }
  };

  const handleToggleUserStatus = async (userId) => {
    if (!confirm("¿Suspender/activar este usuario?")) return;
    try {
      const targetUser = users.find(u => u.id === userId);
      const newRole = targetUser.role === "user" ? "suspended" : "user";
      await base44.auth.updateMe({ role: newRole });
      setUsers(users.map(u => u.id === userId ? { ...u, role: newRole } : u));
      toast.success(`Usuario ${newRole === "user" ? "activado" : "suspendido"}`);
    } catch (err) {
      toast.error(err.message);
    }
  };

  const aiDone = docs.filter(d => ["classified","approved"].includes(d.status)).length;
  const aiPending = docs.filter(d => d.status === "uploaded").length + filings.filter(f => f.status === "draft").length;

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

  return (
    <div>
      {/* KPIs */}
      <div className="grid grid-cols-3 gap-2 mb-3">
        <KPICard label="Organizaciones" value={orgs.length || 28} delta={12} color="violet" icon={Building2} />
        <KPICard label="Usuarios Activos" value={users.filter(u=>u.role!=="suspended").length || 1248} delta={8} color="blue" icon={Users} />
        <KPICard label="Empresas" value={companies.length || 856} delta={15} color="indigo" icon={Building2} />
        <KPICard label="Ingresos del Mes" value={`$45.23M`} delta={22} color="green" icon={TrendingUp} />
        <KPICard label="Procesos IA" value={aiDone + aiPending || 14582} delta={-4} color="amber" icon={Bot} />
      </div>

      {/* Administración de Organizaciones */}
      <DarkCard title="Gestionar Organizaciones" icon={Building2} iconColor="text-violet-400" className="mb-3">
        <div className="space-y-2 max-h-64 overflow-y-auto">
          {orgs.map(org => (
            <div key={org.id} className="flex items-center justify-between p-2 bg-white/5 rounded-lg border border-white/5">
              <div className="flex items-center gap-2 flex-1">
                <div className={`w-2 h-2 rounded-full ${org.status === "active" ? "bg-emerald-400" : "bg-amber-400"}`} />
                <div className="flex-1">
                  <p className="text-[11px] font-semibold text-white">{org.name}</p>
                  <p className="text-[9px] text-slate-400">{org.org_type} • {org.email}</p>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <Button size="icon" variant="ghost" className="w-6 h-6 text-slate-400 hover:text-white" onClick={() => setEditingOrg(org)}>
                  <Pencil className="w-3 h-3" />
                </Button>
                <Button size="icon" variant="ghost" className={`w-6 h-6 ${org.status === "active" ? "text-amber-400 hover:text-amber-300" : "text-emerald-400 hover:text-emerald-300"}`} onClick={() => handleToggleOrgStatus(org)}>
                  {org.status === "active" ? <Ban className="w-3 h-3" /> : <CheckCircle className="w-3 h-3" />}
                </Button>
                <Button size="icon" variant="ghost" className="w-6 h-6 text-rose-400 hover:text-rose-300" onClick={() => handleDeleteOrg(org.id)}>
                  <Trash2 className="w-3 h-3" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      </DarkCard>

      {/* Administración de Empresas */}
      <DarkCard title="Gestionar Empresas" icon={Building2} iconColor="text-blue-400" className="mb-3">
        <div className="space-y-2 max-h-64 overflow-y-auto">
          {companies.slice(0, 10).map(company => (
            <div key={company.id} className="flex items-center justify-between p-2 bg-white/5 rounded-lg border border-white/5">
              <div className="flex items-center gap-2 flex-1">
                <div className={`w-6 h-6 rounded flex items-center justify-center text-[10px] font-bold text-white`} style={{ backgroundColor: company.color || "#00C7D9" }}>
                  {(company.fantasy_name || company.business_name)[0]}
                </div>
                <div className="flex-1">
                  <p className="text-[11px] font-semibold text-white">{company.business_name}</p>
                  <p className="text-[9px] text-slate-400">{company.cuit} • {company.company_type}</p>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <Button size="icon" variant="ghost" className={`w-6 h-6 ${company.status === "active" ? "text-amber-400 hover:text-amber-300" : "text-emerald-400 hover:text-emerald-300"}`} onClick={() => handleToggleCompanyStatus(company)}>
                  {company.status === "active" ? <Ban className="w-3 h-3" /> : <CheckCircle className="w-3 h-3" />}
                </Button>
                <Button size="icon" variant="ghost" className="w-6 h-6 text-rose-400 hover:text-rose-300" onClick={() => handleDeleteCompany(company.id)}>
                  <Trash2 className="w-3 h-3" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      </DarkCard>

      {/* Administración de Usuarios */}
      <DarkCard title="Gestionar Usuarios" icon={Users} iconColor="text-emerald-400" className="mb-3">
        <div className="space-y-2 max-h-64 overflow-y-auto">
          {users.slice(0, 10).map(u => (
            <div key={u.id} className="flex items-center justify-between p-2 bg-white/5 rounded-lg border border-white/5">
              <div className="flex items-center gap-2 flex-1">
                <div className="w-6 h-6 rounded-full bg-violet-500/20 flex items-center justify-center text-[10px] font-bold text-violet-300">
                  {(u.full_name || u.email)[0].toUpperCase()}
                </div>
                <div className="flex-1">
                  <p className="text-[11px] font-semibold text-white">{u.full_name || "Sin nombre"}</p>
                  <p className="text-[9px] text-slate-400">{u.email} • <span className="text-white/50">{u.role}</span></p>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <Button size="icon" variant="ghost" className="w-6 h-6 text-blue-400 hover:text-blue-300">
                  <Eye className="w-3 h-3" />
                </Button>
                <Button size="icon" variant="ghost" className="w-6 h-6 text-rose-400 hover:text-rose-300" onClick={() => handleToggleUserStatus(u.id)}>
                  <Ban className="w-3 h-3" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      </DarkCard>

      <div className="grid grid-cols-2 gap-2 mb-3">
        <DarkCard title="Ingresos y Actividad" icon={TrendingUp} iconColor="text-violet-400">
          <ResponsiveContainer width="100%" height={100}>
            <AreaChart data={activityData}>
              <defs>
                <linearGradient id="saGI" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#7c3aed" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#7c3aed" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <XAxis dataKey="mes" tick={{ fill: "#ffffff30", fontSize: 8 }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ background: "#1a1b2e", border: "none", borderRadius: 6, color: "#fff", fontSize: 10 }} />
              <Area type="monotone" dataKey="ingresos" stroke="#7c3aed" fill="url(#saGI)" strokeWidth={1.5} name="Ingresos" />
              <Area type="monotone" dataKey="gastos" stroke="#4f46e5" fill="none" strokeWidth={1.5} name="Gastos" />
              <Line type="monotone" dataKey="resultado" stroke="#10b981" strokeWidth={1.5} dot={false} name="Resultado" />
            </AreaChart>
          </ResponsiveContainer>
        </DarkCard>

        <DarkCard title="Obligaciones Pendientes" icon={AlertTriangle} iconColor="text-amber-400">
          <div className="flex items-center gap-3">
            <div className="relative flex-shrink-0">
              <ResponsiveContainer width={80} height={80}>
                <PieChart>
                  <Pie data={obligacionesData} cx={38} cy={38} innerRadius={24} outerRadius={36} dataKey="value" paddingAngle={2}>
                    {obligacionesData.map((e, i) => <Cell key={i} fill={e.color} />)}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <p className="text-[13px] font-bold text-white">{obligacionesData.reduce((s,o)=>s+o.value,0)}</p>
              </div>
            </div>
            <div className="flex-1 space-y-1">
              {obligacionesData.map(o => (
                <div key={o.name} className="flex items-center justify-between text-[10px]">
                  <div className="flex items-center gap-1">
                    <div className="w-1.5 h-1.5 rounded-full" style={{ background: o.color }} />
                    <span className="text-white/50">{o.name}</span>
                  </div>
                  <span className="font-semibold text-white">{o.value}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="mt-2 space-y-1 border-t border-white/5 pt-2">
            {systemStatus.map(s => (
              <div key={s.label} className="flex justify-between text-[9px]">
                <span className="text-white/35">{s.label}</span>
                <span className={s.color}>{s.status}</span>
              </div>
            ))}
          </div>
        </DarkCard>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <DarkCard title="Top Organizaciones" icon={Building2} iconColor="text-violet-400" linkTo="/companies" linkLabel="Ver todas">
          <div className="text-[9px] text-white/25 grid grid-cols-4 gap-1 mb-1 px-1">
            <span>Organización</span><span className="text-right">Emp.</span><span className="text-right">Ingresos</span><span className="text-right">Var.</span>
          </div>
          {(topOrgs.length > 0 ? topOrgs : [
            { name: "Estudio Consultar SRL", companies: 45, ingresos: 125450, delta: 22 },
            { name: "Estudio Global SA", companies: 38, ingresos: 89300, delta: 8 },
            { name: "Estudio Integral", companies: 29, ingresos: 67200, delta: -3 },
            { name: "Estudio Pyme", companies: 18, ingresos: 43100, delta: 15 },
          ]).map((o, i) => (
            <div key={i} className="grid grid-cols-4 gap-1 items-center py-1.5 border-b border-white/5 last:border-0 px-1">
              <div className="flex items-center gap-1 min-w-0">
                <div className="w-4 h-4 rounded bg-violet-500/20 flex items-center justify-center text-violet-300 text-[8px] font-bold flex-shrink-0">{i+1}</div>
                <span className="text-[10px] text-white truncate">{o.name}</span>
              </div>
              <span className="text-[10px] text-white/50 text-right">{o.companies}</span>
              <span className="text-[10px] text-white text-right font-mono">${((o.ingresos||0)/1000).toFixed(0)}K</span>
              <span className={`text-[9px] font-semibold text-right ${o.delta >= 0 ? "text-emerald-400" : "text-red-400"}`}>{o.delta >= 0 ? "+" : ""}{o.delta}%</span>
            </div>
          ))}
        </DarkCard>

        <DarkCard title="Actividad Reciente" icon={Activity} iconColor="text-blue-400" linkTo="/audit" linkLabel="Ver todo">
          <div className="space-y-1.5">
            {recentActivity.map((a, i) => (
              <div key={i} className="flex items-start gap-2 py-1 border-b border-white/5 last:border-0">
                <div className={`w-5 h-5 rounded-full flex-shrink-0 flex items-center justify-center text-[8px] font-bold ${
                  a.type === "ai" ? "bg-violet-500/20 text-violet-300" :
                  a.type === "org" ? "bg-blue-500/20 text-blue-300" :
                  a.type === "filing" ? "bg-emerald-500/20 text-emerald-300" : "bg-amber-500/20 text-amber-300"
                }`}>{a.type === "ai" ? "IA" : a.type === "org" ? "OR" : a.type === "filing" ? "DJ" : "US"}</div>
                <div className="flex-1 min-w-0">
                  <p className="text-[10px] text-white/70 truncate">{a.text}</p>
                  <p className="text-[9px] text-white/25">{a.time}</p>
                </div>
              </div>
            ))}
          </div>
        </DarkCard>
      </div>
    </div>
  );
}