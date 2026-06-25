import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { 
  FileText, Users, AlertTriangle, CheckCircle, Clock, 
  Bot, TrendingUp, ArrowRight, Plus
} from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import StatCard from "@/components/shared/StatCard";
import StatusBadge from "@/components/shared/StatusBadge";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

const mockChartData = [
  { month: "Ene", documentos: 45, aprobados: 38 },
  { month: "Feb", documentos: 62, aprobados: 55 },
  { month: "Mar", documentos: 78, aprobados: 70 },
  { month: "Abr", documentos: 91, aprobados: 82 },
  { month: "May", documentos: 105, aprobados: 95 },
  { month: "Jun", documentos: 142, aprobados: 128 },
];

export default function Dashboard() {
  const [clients, setClients] = useState([]);
  const [documents, setDocuments] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [filings, setFilings] = useState([]);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const [c, d, t, f, u] = await Promise.all([
          base44.entities.Client.list("-created_date", 50),
          base44.entities.Document.list("-created_date", 50),
          base44.entities.Task.list("-created_date", 50),
          base44.entities.TaxFiling.list("-created_date", 50),
          base44.auth.me(),
        ]);
        setClients(c);
        setDocuments(d);
        setTasks(t);
        setFilings(f);
        setUser(u);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-slate-200 border-t-[#00C7D9] rounded-full animate-spin" />
      </div>
    );
  }

  const pendingTasks = tasks.filter(t => t.status === "pending" || t.status === "overdue");
  const highRiskClients = clients.filter(c => c.risk_level === "high" || c.risk_level === "critical");
  const pendingDocs = documents.filter(d => d.status === "uploaded" || d.status === "processing" || d.status === "classified");
  const approvedDocs = documents.filter(d => d.status === "approved");

  const firstName = user?.full_name?.split(" ")[0] || "Contador";
  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Buenos días" : hour < 18 ? "Buenas tardes" : "Buenas noches";

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-[#1A1A2E] to-[#16213E] rounded-2xl p-6 text-white">
        <h2 className="text-lg font-bold">
          {greeting}, {firstName}
        </h2>
        <p className="text-[13px] text-slate-300 mt-1">
          Tu IA ha procesado {documents.length} documentos y tiene {pendingTasks.length} tareas pendientes.
          {highRiskClients.length > 0 && ` Se detectaron ${highRiskClients.length} alertas de riesgo fiscal.`}
        </p>
        <div className="flex gap-2 mt-4">
          <Link to="/documents">
            <Button size="sm" className="bg-[#00C7D9] hover:bg-[#00A8BD] text-white text-xs">
              <Plus className="w-3.5 h-3.5 mr-1" /> Cargar Documentos
            </Button>
          </Link>
          <Link to="/clients">
            <Button size="sm" variant="outline" className="border-white/20 text-white hover:bg-white/10 text-xs">
              Ver Clientes
            </Button>
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={Users} value={clients.length} label="Clientes Activos" color="cyan" />
        <StatCard icon={FileText} value={pendingDocs.length} label="Docs. Pendientes" subtitle="Por revisar" color="amber" />
        <StatCard icon={CheckCircle} value={approvedDocs.length} label="Docs. Aprobados" color="green" />
        <StatCard icon={AlertTriangle} value={highRiskClients.length} label="Alertas de Riesgo" color="coral" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 bg-white rounded-xl p-5 shadow-sm border border-slate-100">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-[#1A1A2E]">Documentos Procesados</h3>
            <div className="flex items-center gap-3 text-[11px]">
              <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-[#00C7D9]" /> Cargados</span>
              <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-[#00A8BD]" /> Aprobados</span>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={240}>
            <AreaChart data={mockChartData}>
              <defs>
                <linearGradient id="colorDocs" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#00C7D9" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="#00C7D9" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="colorApproved" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#00A8BD" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="#00A8BD" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="month" tick={{ fontSize: 11, fill: "#9CA3AF" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: "#9CA3AF" }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8, border: "1px solid #e5e7eb" }} />
              <Area type="monotone" dataKey="documentos" stroke="#00C7D9" fillOpacity={1} fill="url(#colorDocs)" strokeWidth={2} />
              <Area type="monotone" dataKey="aprobados" stroke="#00A8BD" fillOpacity={1} fill="url(#colorApproved)" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white rounded-xl p-5 shadow-sm border border-slate-100">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-[#1A1A2E]">Tareas Próximas</h3>
            <Link to="/tasks" className="text-[11px] font-medium text-[#00C7D9] hover:underline flex items-center gap-0.5">
              Ver todas <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
          {pendingTasks.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-slate-400">
              <Clock className="w-8 h-8 mb-2" />
              <p className="text-xs">Sin tareas pendientes</p>
            </div>
          ) : (
            <div className="space-y-2">
              {pendingTasks.slice(0, 5).map((task) => (
                <div key={task.id} className="flex items-center justify-between p-2.5 rounded-lg bg-slate-50 hover:bg-[#E0F7FA] transition-colors">
                  <div className="min-w-0">
                    <p className="text-[13px] font-medium text-[#1A1A2E] truncate">{task.title}</p>
                    <p className="text-[11px] text-slate-500">{task.client_name || "Sin cliente"}</p>
                  </div>
                  <StatusBadge status={task.priority} />
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {highRiskClients.length > 0 && (
        <div className="bg-white rounded-xl p-5 shadow-sm border border-rose-100">
          <div className="flex items-center gap-2 mb-4">
            <AlertTriangle className="w-4 h-4 text-rose-500" />
            <h3 className="text-sm font-semibold text-[#1A1A2E]">Alertas de Riesgo Tributario</h3>
          </div>
          <div className="space-y-2">
            {highRiskClients.map((client) => (
              <Link key={client.id} to={`/clients?id=${client.id}`} className="flex items-center justify-between p-3 rounded-lg bg-rose-50/50 hover:bg-rose-50 transition-colors">
                <div>
                  <p className="text-[13px] font-medium text-[#1A1A2E]">{client.business_name}</p>
                  <p className="text-[11px] text-slate-500">CUIT: {client.cuit}</p>
                </div>
                <StatusBadge status={client.risk_level} />
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}