import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Plus, Search, Calculator, Bot, Loader2, X, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import PageHeader from "@/components/shared/PageHeader";
import StatusBadge from "@/components/shared/StatusBadge";
import EmptyState from "@/components/shared/EmptyState";

const provinces = [
  "Buenos Aires","CABA","Catamarca","Chaco","Chubut","Córdoba","Corrientes",
  "Entre Ríos","Formosa","Jujuy","La Pampa","La Rioja","Mendoza","Misiones",
  "Neuquén","Río Negro","Salta","San Juan","San Luis","Santa Cruz","Santa Fe",
  "Santiago del Estero","Tierra del Fuego","Tucumán"
];

function CoeffForm({ clients, coeff, onSave, onClose }) {
  const [form, setForm] = useState(coeff || {
    client_id: "", period: "", regime: "convenio_multilateral_cm03",
    province: "Buenos Aires", income_coefficient: 0, expense_coefficient: 0,
    unified_coefficient: 0, taxable_base: 0, aliquot: 0, tax_amount: 0, status: "draft"
  });
  const [calculating, setCalculating] = useState(false);
  const [saving, setSaving] = useState(false);
  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));

  const calcAI = async () => {
    if (!form.client_id || !form.period || !form.province) return;
    setCalculating(true);
    const client = clients.find(c => c.id === form.client_id);
    const result = await base44.integrations.Core.InvokeLLM({
      prompt: `Calculá los coeficientes de Ingresos Brutos para ${client?.business_name} en la provincia de ${form.province}.
Régimen: ${form.regime}. Período: ${form.period}.
Actividad: ${client?.activity || "comercio general"}.

Determiná: coeficiente de ingresos, coeficiente de gastos, coeficiente unificado y la alícuota vigente para esta provincia y actividad.
Respondé en JSON.`,
      response_json_schema: {
        type: "object",
        properties: {
          income_coefficient: { type: "number" },
          expense_coefficient: { type: "number" },
          unified_coefficient: { type: "number" },
          aliquot: { type: "number" },
          notes: { type: "string" }
        }
      }
    });
    setForm(p => ({
      ...p,
      income_coefficient: result.income_coefficient || 0,
      expense_coefficient: result.expense_coefficient || 0,
      unified_coefficient: result.unified_coefficient || 0,
      aliquot: result.aliquot || 0,
      tax_amount: (p.taxable_base || 0) * (result.unified_coefficient || 0) * (result.aliquot || 0) / 100
    }));
    setCalculating(false);
  };

  const recalcTax = (base, coef, aliq) => {
    return base * coef * aliq / 100;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-5 border-b border-slate-100">
          <h2 className="text-[15px] font-bold text-[#1A1A2E]">Liquidación IIBB / Convenio Multilateral</h2>
          <button onClick={onClose}><X className="w-5 h-5 text-slate-400" /></button>
        </div>
        <div className="p-5 space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[11px] text-slate-500 font-semibold uppercase mb-1 block">Cliente *</label>
              <select value={form.client_id} onChange={e => set("client_id", e.target.value)}
                className="w-full h-9 px-3 rounded-lg border border-slate-200 text-[13px] focus:outline-none focus:ring-2 focus:ring-[#00C7D9]/20">
                <option value="">Seleccioná cliente</option>
                {clients.map(c => <option key={c.id} value={c.id}>{c.business_name}</option>)}
              </select>
            </div>
            <div>
              <label className="text-[11px] text-slate-500 font-semibold uppercase mb-1 block">Período</label>
              <Input value={form.period} onChange={e => set("period", e.target.value)} className="h-9 text-[13px]" placeholder="06/2026" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[11px] text-slate-500 font-semibold uppercase mb-1 block">Régimen</label>
              <select value={form.regime} onChange={e => set("regime", e.target.value)}
                className="w-full h-9 px-3 rounded-lg border border-slate-200 text-[13px] focus:outline-none focus:ring-2 focus:ring-[#00C7D9]/20">
                <option value="local">Local</option>
                <option value="convenio_multilateral_cm03">Convenio Multilateral CM03</option>
                <option value="convenio_multilateral_cm05">Convenio Multilateral CM05</option>
              </select>
            </div>
            <div>
              <label className="text-[11px] text-slate-500 font-semibold uppercase mb-1 block">Provincia</label>
              <select value={form.province} onChange={e => set("province", e.target.value)}
                className="w-full h-9 px-3 rounded-lg border border-slate-200 text-[13px] focus:outline-none focus:ring-2 focus:ring-[#00C7D9]/20">
                {provinces.map(p => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>
          </div>

          <Button size="sm" variant="outline" onClick={calcAI} disabled={calculating || !form.client_id || !form.period}
            className="text-[#00C7D9] border-[#00C7D9]/30 hover:bg-[#E0F7FA]">
            {calculating ? <Loader2 className="w-3.5 h-3.5 animate-spin mr-1" /> : <Bot className="w-3.5 h-3.5 mr-1" />}
            {calculating ? "Calculando..." : "Calcular con IA"}
          </Button>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="text-[11px] text-slate-500 font-semibold uppercase mb-1 block">Coef. Ingresos</label>
              <Input type="number" step="0.0001" value={form.income_coefficient}
                onChange={e => set("income_coefficient", parseFloat(e.target.value) || 0)} className="h-9 text-[13px]" />
            </div>
            <div>
              <label className="text-[11px] text-slate-500 font-semibold uppercase mb-1 block">Coef. Gastos</label>
              <Input type="number" step="0.0001" value={form.expense_coefficient}
                onChange={e => set("expense_coefficient", parseFloat(e.target.value) || 0)} className="h-9 text-[13px]" />
            </div>
            <div>
              <label className="text-[11px] text-slate-500 font-semibold uppercase mb-1 block">Coef. Unificado</label>
              <Input type="number" step="0.0001" value={form.unified_coefficient}
                onChange={e => set("unified_coefficient", parseFloat(e.target.value) || 0)} className="h-9 text-[13px]" />
            </div>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="text-[11px] text-slate-500 font-semibold uppercase mb-1 block">Base Imponible $</label>
              <Input type="number" value={form.taxable_base}
                onChange={e => { const v = parseFloat(e.target.value) || 0; set("taxable_base", v); set("tax_amount", recalcTax(v, form.unified_coefficient, form.aliquot)); }} className="h-9 text-[13px]" />
            </div>
            <div>
              <label className="text-[11px] text-slate-500 font-semibold uppercase mb-1 block">Alícuota %</label>
              <Input type="number" step="0.01" value={form.aliquot}
                onChange={e => { const v = parseFloat(e.target.value) || 0; set("aliquot", v); set("tax_amount", recalcTax(form.taxable_base, form.unified_coefficient, v)); }} className="h-9 text-[13px]" />
            </div>
            <div>
              <label className="text-[11px] text-slate-500 font-semibold uppercase mb-1 block">Impuesto $</label>
              <div className="h-9 px-3 bg-[#E0F7FA] rounded-lg flex items-center text-[13px] font-bold text-[#00A8BD] font-mono">
                ${(form.tax_amount || 0).toLocaleString("es-AR")}
              </div>
            </div>
          </div>
        </div>
        <div className="flex justify-end gap-2 p-5 border-t border-slate-100">
          <Button variant="outline" size="sm" onClick={onClose}>Cancelar</Button>
          <Button size="sm" disabled={saving || !form.client_id}
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

export default function IIBBConvenio() {
  const [coefficients, setCoefficients] = useState([]);
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [search, setSearch] = useState("");

  const load = async () => {
    const [c, cls] = await Promise.all([
      base44.entities.IIBBCoefficient.list("-created_date", 200),
      base44.entities.Client.list("-created_date", 200),
    ]);
    setCoefficients(c); setClients(cls); setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const handleSave = async (data) => {
    const client = clients.find(c => c.id === data.client_id);
    const payload = { ...data, client_name: client?.business_name };
    if (editing) { await base44.entities.IIBBCoefficient.update(editing.id, payload); }
    else { await base44.entities.IIBBCoefficient.create(payload); }
    setShowForm(false); setEditing(null); load();
  };

  const filtered = coefficients.filter(c =>
    !search || c.client_name?.toLowerCase().includes(search.toLowerCase()) || c.province?.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-8 h-8 border-4 border-slate-200 border-t-[#00C7D9] rounded-full animate-spin" />
    </div>
  );

  return (
    <div>
      <PageHeader title="IIBB & Convenio Multilateral" subtitle="CM03 / CM05 — Coeficientes y liquidaciones provinciales">
        <Button onClick={() => { setEditing(null); setShowForm(true); }} className="bg-[#00C7D9] hover:bg-[#00A8BD] text-white text-xs">
          <Plus className="w-3.5 h-3.5 mr-1" /> Nueva Liquidación
        </Button>
      </PageHeader>

      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <Input placeholder="Buscar por cliente o provincia..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9 h-9 text-[13px]" />
      </div>

      {filtered.length === 0 ? (
        <EmptyState icon={Calculator} title="Sin liquidaciones IIBB" description="Liquidá Ingresos Brutos locales y Convenio Multilateral con cálculo automático IA.">
          <Button onClick={() => setShowForm(true)} className="bg-[#00C7D9] hover:bg-[#00A8BD] text-white text-xs">
            <Plus className="w-3.5 h-3.5 mr-1" /> Nueva Liquidación
          </Button>
        </EmptyState>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-100">
                  <th className="text-left px-4 py-3 text-[11px] font-semibold text-slate-500 uppercase">Cliente / Período</th>
                  <th className="text-left px-4 py-3 text-[11px] font-semibold text-slate-500 uppercase hidden sm:table-cell">Provincia</th>
                  <th className="text-left px-4 py-3 text-[11px] font-semibold text-slate-500 uppercase hidden md:table-cell">Coef. Unificado</th>
                  <th className="text-right px-4 py-3 text-[11px] font-semibold text-slate-500 uppercase">Impuesto</th>
                  <th className="text-left px-4 py-3 text-[11px] font-semibold text-slate-500 uppercase">Estado</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(c => (
                  <tr key={c.id} onClick={() => { setEditing(c); setShowForm(true); }}
                    className="border-b border-slate-50 hover:bg-[#E0F7FA]/30 cursor-pointer transition-colors">
                    <td className="px-4 py-3">
                      <p className="text-[13px] font-medium text-[#1A1A2E]">{c.client_name}</p>
                      <p className="text-[11px] text-slate-400">{c.period} · {c.regime === "local" ? "Local" : "Conv. Multilateral"}</p>
                    </td>
                    <td className="px-4 py-3 text-[13px] text-slate-600 hidden sm:table-cell">{c.province}</td>
                    <td className="px-4 py-3 text-[13px] text-slate-600 hidden md:table-cell font-mono">{(c.unified_coefficient || 0).toFixed(4)}</td>
                    <td className="px-4 py-3 text-right text-[13px] font-bold text-[#1A1A2E] font-mono">
                      ${(c.tax_amount || 0).toLocaleString("es-AR")}
                    </td>
                    <td className="px-4 py-3"><StatusBadge status={c.status} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {showForm && <CoeffForm clients={clients} coeff={editing} onSave={handleSave} onClose={() => { setShowForm(false); setEditing(null); }} />}
    </div>
  );
}