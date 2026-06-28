import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Plus, Search, BookOpen, Bot, Loader2, X, CheckCircle, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import PageHeader from "@/components/shared/PageHeader";
import EmptyState from "@/components/shared/EmptyState";

const typeColors = {
  activo: "bg-emerald-100 text-emerald-700",
  pasivo: "bg-rose-100 text-rose-700",
  patrimonio: "bg-blue-100 text-blue-700",
  ingreso: "bg-[#E0F7FA] text-[#00A8BD]",
  egreso: "bg-orange-100 text-orange-700",
  resultado: "bg-purple-100 text-purple-700",
};

const DEFAULT_PLAN = [
  { code: "1", name: "ACTIVO", type: "activo", level: 1, allows_entries: false },
  { code: "1.1", name: "Activo Corriente", type: "activo", level: 2, allows_entries: false },
  { code: "1.1.01", name: "Caja", type: "activo", level: 3, allows_entries: true },
  { code: "1.1.02", name: "Bancos", type: "activo", level: 3, allows_entries: true },
  { code: "1.1.03", name: "Cuentas a Cobrar", type: "activo", level: 3, allows_entries: true },
  { code: "1.1.04", name: "IVA Crédito Fiscal", type: "activo", level: 3, allows_entries: true },
  { code: "1.1.05", name: "Mercaderías", type: "activo", level: 3, allows_entries: true },
  { code: "1.2", name: "Activo No Corriente", type: "activo", level: 2, allows_entries: false },
  { code: "1.2.01", name: "Bienes de Uso", type: "activo", level: 3, allows_entries: true },
  { code: "1.2.02", name: "Amortizaciones Acumuladas", type: "activo", level: 3, allows_entries: true },
  { code: "2", name: "PASIVO", type: "pasivo", level: 1, allows_entries: false },
  { code: "2.1", name: "Pasivo Corriente", type: "pasivo", level: 2, allows_entries: false },
  { code: "2.1.01", name: "Proveedores", type: "pasivo", level: 3, allows_entries: true },
  { code: "2.1.02", name: "IVA Débito Fiscal", type: "pasivo", level: 3, allows_entries: true },
  { code: "2.1.03", name: "Sueldos a Pagar", type: "pasivo", level: 3, allows_entries: true },
  { code: "2.1.04", name: "Cargas Sociales a Pagar", type: "pasivo", level: 3, allows_entries: true },
  { code: "2.1.05", name: "Impuestos a Pagar", type: "pasivo", level: 3, allows_entries: true },
  { code: "2.1.06", name: "ARCA a Pagar", type: "pasivo", level: 3, allows_entries: true },
  { code: "3", name: "PATRIMONIO NETO", type: "patrimonio", level: 1, allows_entries: false },
  { code: "3.1.01", name: "Capital Social", type: "patrimonio", level: 3, allows_entries: true },
  { code: "3.1.02", name: "Resultados No Asignados", type: "patrimonio", level: 3, allows_entries: true },
  { code: "4", name: "INGRESOS", type: "ingreso", level: 1, allows_entries: false },
  { code: "4.1.01", name: "Ventas", type: "ingreso", level: 3, allows_entries: true },
  { code: "4.1.02", name: "Ingresos por Servicios", type: "ingreso", level: 3, allows_entries: true },
  { code: "4.1.03", name: "Otros Ingresos", type: "ingreso", level: 3, allows_entries: true },
  { code: "5", name: "EGRESOS", type: "egreso", level: 1, allows_entries: false },
  { code: "5.1.01", name: "Compras", type: "egreso", level: 3, allows_entries: true },
  { code: "5.1.02", name: "Sueldos y Jornales", type: "egreso", level: 3, allows_entries: true },
  { code: "5.1.03", name: "Cargas Sociales", type: "egreso", level: 3, allows_entries: true },
  { code: "5.1.04", name: "Alquileres", type: "egreso", level: 3, allows_entries: true },
  { code: "5.1.05", name: "Servicios Públicos", type: "egreso", level: 3, allows_entries: true },
  { code: "5.1.06", name: "Impuestos y Tasas", type: "egreso", level: 3, allows_entries: true },
  { code: "5.1.07", name: "Amortizaciones", type: "egreso", level: 3, allows_entries: true },
  { code: "5.1.08", name: "Gastos Bancarios", type: "egreso", level: 3, allows_entries: true },
];

function AccountForm({ clients, account, onSave, onClose }) {
  const [form, setForm] = useState(account || {
    client_id: "", code: "", name: "", type: "activo", subtype: "",
    level: 3, allows_entries: true, is_active: true, notes: ""
  });
  const [saving, setSaving] = useState(false);
  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
        <div className="flex items-center justify-between p-5 border-b border-slate-100">
          <h2 className="text-[15px] font-bold text-[#1A1A2E]">{account ? "Editar Cuenta" : "Nueva Cuenta"}</h2>
          <button onClick={onClose}><X className="w-5 h-5 text-slate-400" /></button>
        </div>
        <div className="p-5 space-y-3">
          <div>
            <label className="text-[11px] text-slate-500 font-semibold uppercase mb-1 block">Cliente (opcional)</label>
            <select value={form.client_id} onChange={e => set("client_id", e.target.value)}
              className="w-full h-9 px-3 rounded-lg border border-slate-200 text-[13px] focus:outline-none focus:ring-2 focus:ring-[#00C7D9]/20">
              <option value="">Plan general (todos los clientes)</option>
              {clients.map(c => <option key={c.id} value={c.id}>{c.business_name}</option>)}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[11px] text-slate-500 font-semibold uppercase mb-1 block">Código *</label>
              <Input value={form.code} onChange={e => set("code", e.target.value)} className="h-9 text-[13px] font-mono" placeholder="1.1.01" />
            </div>
            <div>
              <label className="text-[11px] text-slate-500 font-semibold uppercase mb-1 block">Nivel</label>
              <select value={form.level} onChange={e => set("level", parseInt(e.target.value))}
                className="w-full h-9 px-3 rounded-lg border border-slate-200 text-[13px] focus:outline-none">
                <option value={1}>1 — Rubro</option>
                <option value={2}>2 — Grupo</option>
                <option value={3}>3 — Cuenta</option>
                <option value={4}>4 — Subcuenta</option>
              </select>
            </div>
          </div>
          <div>
            <label className="text-[11px] text-slate-500 font-semibold uppercase mb-1 block">Nombre *</label>
            <Input value={form.name} onChange={e => set("name", e.target.value)} className="h-9 text-[13px]" placeholder="Ej: IVA Crédito Fiscal" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[11px] text-slate-500 font-semibold uppercase mb-1 block">Tipo</label>
              <select value={form.type} onChange={e => set("type", e.target.value)}
                className="w-full h-9 px-3 rounded-lg border border-slate-200 text-[13px] focus:outline-none">
                {Object.keys(typeColors).map(t => <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>)}
              </select>
            </div>
            <div className="flex items-end gap-3">
              <label className="flex items-center gap-2 text-[13px] text-slate-600 cursor-pointer mb-1.5">
                <input type="checkbox" checked={form.allows_entries} onChange={e => set("allows_entries", e.target.checked)} className="w-4 h-4 rounded" />
                Acepta asientos
              </label>
            </div>
          </div>
        </div>
        <div className="flex justify-end gap-2 p-5 border-t border-slate-100">
          <Button variant="outline" size="sm" onClick={onClose}>Cancelar</Button>
          <Button size="sm" disabled={saving || !form.code || !form.name}
            onClick={async () => { setSaving(true); await onSave(form); setSaving(false); }}
            className="bg-[#00C7D9] hover:bg-[#00A8BD] text-white">
            {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin mr-1" /> : <CheckCircle className="w-3.5 h-3.5 mr-1" />}
            Guardar
          </Button>
        </div>
      </div>
    </div>
  );
}

export default function AccountPlanPage() {
  const [accounts, setAccounts] = useState([]);
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [importing, setImporting] = useState(false);

  const load = async () => {
    const [a, c] = await Promise.all([
      base44.entities.AccountPlan.list("code", 500),
      base44.entities.Client.list("-created_date", 200),
    ]);
    setAccounts(a); setClients(c); setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const handleSave = async (data) => {
    if (editing) { await base44.entities.AccountPlan.update(editing.id, data); }
    else { await base44.entities.AccountPlan.create(data); }
    setShowForm(false); setEditing(null); load();
  };

  const importDefaultPlan = async () => {
    setImporting(true);
    await base44.entities.AccountPlan.bulkCreate(DEFAULT_PLAN.map(a => ({ ...a, is_active: true })));
    load();
    setImporting(false);
  };

  const filtered = accounts.filter(a => {
    const matchSearch = !search || a.name?.toLowerCase().includes(search.toLowerCase()) || a.code?.includes(search);
    const matchType = !typeFilter || a.type === typeFilter;
    return matchSearch && matchType;
  });

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-8 h-8 border-4 border-slate-200 border-t-[#00C7D9] rounded-full animate-spin" />
    </div>
  );

  return (
    <div>
      <PageHeader title="Plan de Cuentas" subtitle="Estructura contable Argentina — Plan General de Cuentas">
        <div className="flex gap-2">
          {accounts.length === 0 && (
            <Button variant="outline" size="sm" onClick={importDefaultPlan} disabled={importing}
              className="text-xs text-[#00C7D9] border-[#00C7D9]/30">
              {importing ? <Loader2 className="w-3.5 h-3.5 animate-spin mr-1" /> : <Bot className="w-3.5 h-3.5 mr-1" />}
              Importar Plan Estándar
            </Button>
          )}
          <Button onClick={() => { setEditing(null); setShowForm(true); }} className="bg-[#00C7D9] hover:bg-[#00A8BD] text-white text-xs">
            <Plus className="w-3.5 h-3.5 mr-1" /> Nueva Cuenta
          </Button>
        </div>
      </PageHeader>

      <div className="flex gap-3 mb-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input placeholder="Buscar por código o nombre..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9 h-9 text-[13px]" />
        </div>
        <select value={typeFilter} onChange={e => setTypeFilter(e.target.value)}
          className="h-9 px-3 rounded-lg border border-slate-200 text-[13px] bg-white focus:outline-none">
          <option value="">Todos los tipos</option>
          {Object.keys(typeColors).map(t => <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>)}
        </select>
      </div>

      {filtered.length === 0 ? (
        <EmptyState icon={BookOpen} title="Sin plan de cuentas" description="Importá el plan estándar argentino o creá cuentas manualmente.">
          <Button onClick={importDefaultPlan} disabled={importing} className="bg-[#00C7D9] hover:bg-[#00A8BD] text-white text-xs">
            Importar Plan Estándar Argentina
          </Button>
        </EmptyState>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-100">
                <th className="text-left px-4 py-3 text-[11px] font-semibold text-slate-500 uppercase">Código</th>
                <th className="text-left px-4 py-3 text-[11px] font-semibold text-slate-500 uppercase">Nombre</th>
                <th className="text-left px-4 py-3 text-[11px] font-semibold text-slate-500 uppercase hidden sm:table-cell">Tipo</th>
                <th className="text-left px-4 py-3 text-[11px] font-semibold text-slate-500 uppercase hidden md:table-cell">Nivel</th>
                <th className="text-left px-4 py-3 text-[11px] font-semibold text-slate-500 uppercase hidden lg:table-cell">Asientos</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(a => (
                <tr key={a.id} onClick={() => { setEditing(a); setShowForm(true); }}
                  className="border-b border-slate-50 hover:bg-[#E0F7FA]/30 cursor-pointer transition-colors">
                  <td className="px-4 py-2.5 font-mono text-[13px] text-slate-600"
                    style={{ paddingLeft: `${(a.level || 1) * 12}px` }}>
                    {a.code}
                  </td>
                  <td className="px-4 py-2.5">
                    <span className={`text-[13px] ${a.level === 1 ? "font-bold text-[#1A1A2E]" : a.level === 2 ? "font-semibold text-slate-700" : "text-slate-600"}`}>
                      {a.name}
                    </span>
                  </td>
                  <td className="px-4 py-2.5 hidden sm:table-cell">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${typeColors[a.type] || "bg-slate-100 text-slate-600"}`}>
                      {a.type?.toUpperCase()}
                    </span>
                  </td>
                  <td className="px-4 py-2.5 text-[12px] text-slate-400 hidden md:table-cell">Nivel {a.level}</td>
                  <td className="px-4 py-2.5 hidden lg:table-cell">
                    <span className={`text-[11px] font-medium ${a.allows_entries ? "text-emerald-600" : "text-slate-400"}`}>
                      {a.allows_entries ? "✓ Sí" : "— No"}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showForm && <AccountForm clients={clients} account={editing} onSave={handleSave} onClose={() => { setShowForm(false); setEditing(null); }} />}
    </div>
  );
}