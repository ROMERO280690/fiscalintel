import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Shield, Search, User, Clock, ChevronDown, ChevronUp, Download } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import PageHeader from "@/components/shared/PageHeader";

const actionConfig = {
  create:  { label: "Creación",   color: "bg-emerald-100 text-emerald-700" },
  update:  { label: "Edición",    color: "bg-blue-100 text-blue-700" },
  delete:  { label: "Eliminación",color: "bg-rose-100 text-rose-700" },
  approve: { label: "Aprobación", color: "bg-[#E0F7FA] text-[#00A8BD]" },
  reject:  { label: "Rechazo",    color: "bg-orange-100 text-orange-700" },
  ai_run:  { label: "IA",         color: "bg-amber-100 text-amber-700" },
  export:  { label: "Exportación",color: "bg-purple-100 text-purple-700" },
  login:   { label: "Login",      color: "bg-slate-100 text-slate-600" },
  logout:  { label: "Logout",     color: "bg-slate-100 text-slate-500" },
};

function parseMetadata(raw) {
  try { return typeof raw === "string" ? JSON.parse(raw) : raw || {}; }
  catch { return {}; }
}

function DataDiff({ meta }) {
  const old = meta.old_data;
  const next = meta.new_data;
  if (!old && !next) return null;
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-3">
      {old && (
        <div className="bg-rose-50 border border-rose-100 rounded-lg p-3">
          <p className="text-[10px] font-bold text-rose-600 uppercase mb-2">Datos anteriores</p>
          <pre className="text-[11px] text-rose-800 whitespace-pre-wrap break-all font-mono">
            {JSON.stringify(old, null, 2)}
          </pre>
        </div>
      )}
      {next && (
        <div className="bg-emerald-50 border border-emerald-100 rounded-lg p-3">
          <p className="text-[10px] font-bold text-emerald-600 uppercase mb-2">Datos nuevos</p>
          <pre className="text-[11px] text-emerald-800 whitespace-pre-wrap break-all font-mono">
            {JSON.stringify(next, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
}

export default function AuditPage() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [actionFilter, setActionFilter] = useState("");
  const [moduleFilter, setModuleFilter] = useState("");
  const [expanded, setExpanded] = useState(null);
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  useEffect(() => {
    base44.entities.AuditLog.list("-created_date", 500).then(data => {
      setLogs(data);
      setLoading(false);
    });
  }, []);

  const modules = [...new Set(logs.map(l => parseMetadata(l.metadata)?.module).filter(Boolean))];
  const actions = [...new Set(logs.map(l => l.action).filter(Boolean))];

  const filtered = logs.filter(l => {
    const meta = parseMetadata(l.metadata);
    const matchSearch = !search ||
      l.description?.toLowerCase().includes(search.toLowerCase()) ||
      l.user_email?.toLowerCase().includes(search.toLowerCase()) ||
      meta.client_name?.toLowerCase().includes(search.toLowerCase());
    const matchAction = !actionFilter || l.action === actionFilter;
    const matchModule = !moduleFilter || meta.module === moduleFilter;
    const matchFrom = !dateFrom || new Date(l.created_date) >= new Date(dateFrom);
    const matchTo = !dateTo || new Date(l.created_date) <= new Date(dateTo + "T23:59:59");
    return matchSearch && matchAction && matchModule && matchFrom && matchTo;
  });

  const stats = {
    total: logs.length,
    creations: logs.filter(l => l.action === "create").length,
    approvals: logs.filter(l => l.action === "approve").length,
    deletions: logs.filter(l => l.action === "delete").length,
    aiRuns: logs.filter(l => l.action === "ai_run").length,
  };

  const exportCSV = () => {
    const rows = [["Fecha", "Usuario", "Acción", "Módulo", "Descripción", "Entidad", "Cliente"]];
    filtered.forEach(l => {
      const meta = parseMetadata(l.metadata);
      rows.push([
        new Date(l.created_date).toLocaleString("es-AR"),
        l.user_email || "sistema",
        l.action,
        meta.module || "",
        l.description,
        l.entity_type || "",
        meta.client_name || "",
      ]);
    });
    const csv = rows.map(r => r.map(c => `"${String(c).replace(/"/g, '""')}"`).join(",")).join("\n");
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = `auditoria_${new Date().toISOString().split("T")[0]}.csv`;
    a.click(); URL.revokeObjectURL(url);
  };

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-8 h-8 border-4 border-slate-200 border-t-[#00C7D9] rounded-full animate-spin" />
    </div>
  );

  return (
    <div>
      <PageHeader title="Auditoría y Trazabilidad" subtitle={`${logs.length} registros de actividad`}>
        <Button variant="outline" size="sm" onClick={exportCSV} className="text-xs">
          <Download className="w-3.5 h-3.5 mr-1" /> Exportar CSV
        </Button>
      </PageHeader>

      {/* KPIs */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mb-5">
        {[
          { label: "Total", value: stats.total, color: "text-[#1A1A2E]" },
          { label: "Creaciones", value: stats.creations, color: "text-emerald-600" },
          { label: "Aprobaciones", value: stats.approvals, color: "text-[#00A8BD]" },
          { label: "Eliminaciones", value: stats.deletions, color: "text-rose-600" },
          { label: "Ejecuciones IA", value: stats.aiRuns, color: "text-amber-600" },
        ].map(s => (
          <div key={s.label} className="bg-white rounded-xl p-4 shadow-sm border border-slate-100">
            <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
            <p className="text-[11px] text-slate-500 mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2 mb-4">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input placeholder="Buscar descripción, usuario, cliente..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9 h-9 text-[13px]" />
        </div>
        <select value={actionFilter} onChange={e => setActionFilter(e.target.value)}
          className="h-9 px-3 rounded-lg border border-slate-200 text-[13px] bg-white focus:outline-none">
          <option value="">Todas las acciones</option>
          {actions.map(a => <option key={a} value={a}>{actionConfig[a]?.label || a}</option>)}
        </select>
        <select value={moduleFilter} onChange={e => setModuleFilter(e.target.value)}
          className="h-9 px-3 rounded-lg border border-slate-200 text-[13px] bg-white focus:outline-none">
          <option value="">Todos los módulos</option>
          {modules.map(m => <option key={m} value={m}>{m}</option>)}
        </select>
        <Input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} className="h-9 text-[13px] w-36" />
        <Input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} className="h-9 text-[13px] w-36" />
        {(search || actionFilter || moduleFilter || dateFrom || dateTo) && (
          <Button variant="outline" size="sm" onClick={() => { setSearch(""); setActionFilter(""); setModuleFilter(""); setDateFrom(""); setDateTo(""); }} className="text-xs h-9">
            Limpiar
          </Button>
        )}
      </div>

      <p className="text-[12px] text-slate-500 mb-3">{filtered.length} registros encontrados</p>

      {filtered.length === 0 ? (
        <div className="bg-white rounded-2xl p-14 text-center shadow-sm border border-slate-100">
          <Shield className="w-14 h-14 text-slate-200 mx-auto mb-3" />
          <p className="text-[14px] font-semibold text-slate-500">Sin registros de auditoría</p>
          <p className="text-[12px] text-slate-400 mt-1">Las acciones del sistema se registrarán automáticamente.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map(log => {
            const meta = parseMetadata(log.metadata);
            const cfg = actionConfig[log.action] || { label: log.action, color: "bg-slate-100 text-slate-600" };
            const isExpanded = expanded === log.id;
            const hasDetail = meta.old_data || meta.new_data;

            return (
              <div key={log.id} className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
                <div className="flex items-center gap-3 p-4">
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase flex-shrink-0 ${cfg.color}`}>
                    {cfg.label}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-[13px] font-medium text-[#1A1A2E] truncate">{log.description}</p>
                    <div className="flex items-center gap-3 mt-0.5 flex-wrap">
                      {meta.module && (
                        <span className="text-[10px] font-semibold text-[#00A8BD] bg-[#E0F7FA] px-1.5 py-0.5 rounded">
                          {meta.module}
                        </span>
                      )}
                      {meta.client_name && (
                        <span className="text-[11px] text-slate-500">{meta.client_name}</span>
                      )}
                      <span className="text-[11px] text-slate-400 flex items-center gap-1">
                        <User className="w-3 h-3" />{log.user_email || "sistema"}
                      </span>
                      <span className="text-[11px] text-slate-400 flex items-center gap-1 font-mono">
                        <Clock className="w-3 h-3" />
                        {new Date(log.created_date).toLocaleString("es-AR", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit", second: "2-digit" })}
                      </span>
                    </div>
                  </div>
                  {hasDetail && (
                    <button onClick={() => setExpanded(isExpanded ? null : log.id)}
                      className="w-7 h-7 rounded-lg bg-slate-100 hover:bg-slate-200 flex items-center justify-center flex-shrink-0 transition-colors">
                      {isExpanded ? <ChevronUp className="w-3.5 h-3.5 text-slate-600" /> : <ChevronDown className="w-3.5 h-3.5 text-slate-600" />}
                    </button>
                  )}
                </div>
                {isExpanded && (
                  <div className="px-4 pb-4 border-t border-slate-50 pt-3">
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-2 text-[12px]">
                      {log.entity_type && <div><p className="text-[10px] text-slate-400 uppercase">Entidad</p><p className="font-medium">{log.entity_type}</p></div>}
                      {log.entity_id && <div><p className="text-[10px] text-slate-400 uppercase">ID</p><p className="font-mono text-[11px] truncate">{log.entity_id}</p></div>}
                      {meta.module && <div><p className="text-[10px] text-slate-400 uppercase">Módulo</p><p className="font-medium">{meta.module}</p></div>}
                      {meta.timestamp && <div><p className="text-[10px] text-slate-400 uppercase">Timestamp</p><p className="font-mono text-[11px]">{new Date(meta.timestamp).toLocaleString("es-AR")}</p></div>}
                    </div>
                    <DataDiff meta={meta} />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}