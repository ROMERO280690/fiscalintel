import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Shield, Search, Activity, User, Clock } from "lucide-react";
import { Input } from "@/components/ui/input";
import PageHeader from "@/components/shared/PageHeader";

const actionColors = {
  create: "bg-emerald-100 text-emerald-700",
  update: "bg-blue-100 text-blue-700",
  delete: "bg-rose-100 text-rose-700",
  approve: "bg-[#E0F7FA] text-[#00A8BD]",
  reject: "bg-orange-100 text-orange-700",
  login: "bg-slate-100 text-slate-600",
  logout: "bg-slate-100 text-slate-500",
  export: "bg-purple-100 text-purple-700",
  ai_run: "bg-amber-100 text-amber-700",
};

export default function AuditPage() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [actionFilter, setActionFilter] = useState("");

  useEffect(() => {
    base44.entities.AuditLog.list("-created_date", 200).then(data => {
      setLogs(data); setLoading(false);
    });
  }, []);

  const filtered = logs.filter(l => {
    const matchSearch = !search || l.description?.toLowerCase().includes(search.toLowerCase()) || l.user_email?.toLowerCase().includes(search.toLowerCase());
    const matchAction = !actionFilter || l.action === actionFilter;
    return matchSearch && matchAction;
  });

  const actions = [...new Set(logs.map(l => l.action))];

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-8 h-8 border-4 border-slate-200 border-t-[#00C7D9] rounded-full animate-spin" />
    </div>
  );

  return (
    <div>
      <PageHeader title="Auditoría y Trazabilidad" subtitle={`${logs.length} registros de actividad del sistema`} />

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
        {[
          { label: "Total registros", value: logs.length },
          { label: "Aprobaciones IA", value: logs.filter(l => l.action === "approve").length },
          { label: "Ejecuciones IA", value: logs.filter(l => l.action === "ai_run").length },
          { label: "Eliminaciones", value: logs.filter(l => l.action === "delete").length },
        ].map(s => (
          <div key={s.label} className="bg-white rounded-xl p-4 shadow-sm border border-slate-100">
            <p className="text-xl font-bold text-[#1A1A2E]">{s.value}</p>
            <p className="text-[11px] text-slate-500 mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      <div className="flex gap-3 mb-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input placeholder="Buscar por descripción o usuario..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9 h-9 text-[13px]" />
        </div>
        <select value={actionFilter} onChange={e => setActionFilter(e.target.value)}
          className="h-9 px-3 rounded-lg border border-slate-200 text-[13px] bg-white focus:outline-none">
          <option value="">Todas las acciones</option>
          {actions.map(a => <option key={a} value={a}>{a}</option>)}
        </select>
      </div>

      {filtered.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 text-center shadow-sm border border-slate-100">
          <Shield className="w-12 h-12 text-slate-200 mx-auto mb-3" />
          <p className="text-[13px] text-slate-500">Sin registros de auditoría. Se registrarán automáticamente las acciones del sistema.</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-100">
                  <th className="text-left px-4 py-3 text-[11px] font-semibold text-slate-500 uppercase">Acción</th>
                  <th className="text-left px-4 py-3 text-[11px] font-semibold text-slate-500 uppercase">Descripción</th>
                  <th className="text-left px-4 py-3 text-[11px] font-semibold text-slate-500 uppercase hidden sm:table-cell">Usuario</th>
                  <th className="text-left px-4 py-3 text-[11px] font-semibold text-slate-500 uppercase hidden md:table-cell">Entidad</th>
                  <th className="text-left px-4 py-3 text-[11px] font-semibold text-slate-500 uppercase hidden lg:table-cell">Fecha</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(log => (
                  <tr key={log.id} className="border-b border-slate-50 hover:bg-slate-50 transition-colors">
                    <td className="px-4 py-3">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${actionColors[log.action] || "bg-slate-100 text-slate-600"}`}>
                        {log.action}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <p className="text-[13px] text-[#1A1A2E]">{log.description}</p>
                      {log.client_name && <p className="text-[11px] text-slate-400">{log.client_name}</p>}
                    </td>
                    <td className="px-4 py-3 text-[12px] text-slate-500 hidden sm:table-cell">
                      <div className="flex items-center gap-1.5">
                        <User className="w-3 h-3 flex-shrink-0" />
                        {log.user_email || "Sistema"}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-[12px] text-slate-500 hidden md:table-cell">
                      {log.entity_type || "—"}
                    </td>
                    <td className="px-4 py-3 text-[11px] text-slate-400 font-mono hidden lg:table-cell">
                      {new Date(log.created_date).toLocaleString("es-AR")}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}