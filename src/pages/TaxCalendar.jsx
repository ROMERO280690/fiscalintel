import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Plus, Calendar, AlertTriangle, CheckCircle, Bot, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import PageHeader from "@/components/shared/PageHeader";
import StatusBadge from "@/components/shared/StatusBadge";
import EmptyState from "@/components/shared/EmptyState";

const obligationLabels = {
  iva: "IVA", iibb: "Ingresos Brutos", monotributo: "Monotributo",
  autonomos: "Autónomos", ganancias: "Ganancias", bienes_personales: "Bienes Personales",
  sueldos: "Sueldos", f931: "F931", sociedades: "Sociedades",
  municipal: "Municipal", otro: "Otro"
};

const CURRENT_MONTH = new Date().toLocaleDateString("es-AR", { month: "2-digit", year: "numeric" });

export default function TaxCalendar() {
  const [deadlines, setDeadlines] = useState([]);
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [filter, setFilter] = useState("all");

  const load = async () => {
    try {
      const [d, c] = await Promise.all([
        base44.entities.TaxDeadline.list("-due_date", 300),
        base44.entities.Client.list("-created_date", 200),
      ]);
      setDeadlines(d);
      setClients(c);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const today = new Date();
  const isOverdue = (d) => new Date(d.due_date) < today && d.status === "pending";
  const isUrgent = (d) => {
    const diff = (new Date(d.due_date) - today) / (1000 * 60 * 60 * 24);
    return diff >= 0 && diff <= 7 && d.status === "pending";
  };

  const filtered = deadlines.filter(d => {
    if (filter === "overdue") return isOverdue(d);
    if (filter === "urgent") return isUrgent(d);
    if (filter === "pending") return d.status === "pending";
    if (filter === "completed") return d.status === "completed";
    return true;
  });

  const generateForAllClients = async () => {
    setGenerating(true);
    try {
      const result = await base44.integrations.Core.InvokeLLM({
        prompt: `Sos un especialista tributario argentino. Generá los vencimientos impositivos para el mes de Julio 2026 según el calendario fiscal de ARCA.

Para cada tipo de contribuyente, indicá las obligaciones y sus fechas de vencimiento aproximadas en Julio 2026:
- IVA mensual (responsables inscriptos): según terminación de CUIT
- Monotributo: día 20 del mes siguiente
- Autónomos: día 3 del mes siguiente  
- F931 (sueldos): día 7 del mes siguiente
- Ganancias (anticipos): según calendario
- IIBB: según jurisdicción, aproximadamente día 15-25

Respondé con un array de obligaciones genéricas para el mes.`,
        response_json_schema: {
          type: "object",
          properties: {
            obligations: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  obligation_type: { type: "string" },
                  description: { type: "string" },
                  due_date: { type: "string" },
                  period: { type: "string" }
                }
              }
            }
          }
        }
      });

      if (result.obligations?.length && clients.length > 0) {
        const toCreate = [];
        clients.slice(0, 10).forEach(client => {
          result.obligations.forEach(ob => {
            toCreate.push({
              client_id: client.id,
              client_name: client.business_name,
              obligation_type: ob.obligation_type || "otro",
              description: ob.description,
              due_date: ob.due_date,
              period: ob.period || CURRENT_MONTH,
              status: "pending",
            });
          });
        });
        if (toCreate.length > 0) {
          await base44.entities.TaxDeadline.bulkCreate(toCreate.slice(0, 50));
        }
        load();
      }
    } catch (e) { console.error(e); }
    finally { setGenerating(false); }
  };

  const overdue = deadlines.filter(isOverdue).length;
  const urgent = deadlines.filter(isUrgent).length;
  const pending = deadlines.filter(d => d.status === "pending" && !isOverdue(d)).length;
  const completed = deadlines.filter(d => d.status === "completed").length;

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-8 h-8 border-4 border-slate-200 border-t-[#00C7D9] rounded-full animate-spin" />
    </div>
  );

  return (
    <div>
      <PageHeader title="Motor de Vencimientos" subtitle="Calendario fiscal por cliente">
        <div className="flex gap-2">
          <Button onClick={generateForAllClients} disabled={generating} variant="outline" className="text-xs">
            {generating ? <Loader2 className="w-3.5 h-3.5 mr-1 animate-spin" /> : <Bot className="w-3.5 h-3.5 mr-1" />}
            IA: Generar Julio
          </Button>
          <Button onClick={() => setShowForm(true)} className="bg-[#00C7D9] hover:bg-[#00A8BD] text-white text-xs">
            <Plus className="w-3.5 h-3.5 mr-1" /> Nuevo Vencimiento
          </Button>
        </div>
      </PageHeader>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
        {[
          { label: "Vencidos", count: overdue, filter: "overdue", color: "bg-rose-50 border-rose-200", text: "text-rose-600" },
          { label: "Urgentes (7 días)", count: urgent, filter: "urgent", color: "bg-amber-50 border-amber-200", text: "text-amber-600" },
          { label: "Pendientes", count: pending, filter: "pending", color: "bg-slate-50 border-slate-200", text: "text-slate-600" },
          { label: "Completados", count: completed, filter: "completed", color: "bg-emerald-50 border-emerald-200", text: "text-emerald-600" },
        ].map(s => (
          <button key={s.filter} onClick={() => setFilter(filter === s.filter ? "all" : s.filter)}
            className={`p-3 rounded-xl text-left border transition-all ${s.color} ${filter === s.filter ? "ring-2 ring-[#00C7D9]" : ""}`}>
            <p className={`text-xl font-bold ${s.text}`}>{s.count}</p>
            <p className="text-[11px] text-slate-500">{s.label}</p>
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <EmptyState icon={Calendar} title="Sin vencimientos" description="Generá el calendario fiscal con IA o cargá vencimientos manualmente.">
          <Button onClick={generateForAllClients} disabled={generating} className="bg-[#00C7D9] hover:bg-[#00A8BD] text-white text-xs">
            {generating ? <Loader2 className="w-3.5 h-3.5 mr-1 animate-spin" /> : <Bot className="w-3.5 h-3.5 mr-1" />}
            Generar con IA
          </Button>
        </EmptyState>
      ) : (
        <div className="space-y-2">
          {filtered.sort((a, b) => new Date(a.due_date) - new Date(b.due_date)).map(dl => {
            const od = isOverdue(dl);
            const ug = isUrgent(dl);
            return (
              <div key={dl.id} className={`bg-white rounded-xl p-4 shadow-sm border transition-all ${od ? "border-rose-200 bg-rose-50/30" : ug ? "border-amber-200 bg-amber-50/30" : "border-slate-100"}`}>
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${od ? "bg-rose-100" : ug ? "bg-amber-100" : "bg-slate-100"}`}>
                      {od ? <AlertTriangle className="w-4 h-4 text-rose-500" /> : <Calendar className="w-4 h-4 text-slate-500" />}
                    </div>
                    <div className="min-w-0">
                      <p className="text-[13px] font-semibold text-[#1A1A2E] truncate">
                        {obligationLabels[dl.obligation_type]} — {dl.client_name}
                      </p>
                      <p className="text-[11px] text-slate-500">{dl.description} · Período: {dl.period}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <div className="text-right">
                      <p className={`text-[13px] font-bold ${od ? "text-rose-600" : ug ? "text-amber-600" : "text-[#1A1A2E]"}`}>{dl.due_date}</p>
                      {dl.amount_estimated > 0 && <p className="text-[11px] text-slate-500 font-mono">${dl.amount_estimated.toLocaleString("es-AR")}</p>}
                    </div>
                    <StatusBadge status={dl.status} />
                    {dl.status === "pending" && (
                      <button onClick={async () => { await base44.entities.TaxDeadline.update(dl.id, { status: "completed" }); load(); }}
                        className="w-7 h-7 rounded-lg bg-emerald-50 hover:bg-emerald-100 flex items-center justify-center transition-colors">
                        <CheckCircle className="w-4 h-4 text-emerald-600" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {showForm && <DeadlineForm clients={clients} onSave={async (data) => { await base44.entities.TaxDeadline.create(data); setShowForm(false); load(); }} onClose={() => setShowForm(false)} />}
    </div>
  );
}

function DeadlineForm({ clients, onSave, onClose }) {
  const [form, setForm] = useState({ client_id: "", obligation_type: "iva", description: "", period: "", due_date: "", amount_estimated: "" });
  const [saving, setSaving] = useState(false);
  const update = (f, v) => setForm(p => ({ ...p, [f]: v }));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-sm m-4 p-5">
        <h2 className="text-base font-bold text-[#1A1A2E] mb-4">Nuevo Vencimiento</h2>
        <form onSubmit={async e => { e.preventDefault(); setSaving(true); await onSave(form); setSaving(false); }} className="space-y-3">
          <div>
            <Label className="text-[12px] font-medium text-slate-600">Cliente *</Label>
            <select value={form.client_id} onChange={e => update("client_id", e.target.value)} required className="mt-1 w-full h-9 px-3 rounded-md border border-slate-200 text-[13px] bg-white">
              <option value="">Seleccionar</option>
              {clients.map(c => <option key={c.id} value={c.id}>{c.business_name}</option>)}
            </select>
          </div>
          <div>
            <Label className="text-[12px] font-medium text-slate-600">Tipo de Obligación *</Label>
            <select value={form.obligation_type} onChange={e => update("obligation_type", e.target.value)} className="mt-1 w-full h-9 px-3 rounded-md border border-slate-200 text-[13px] bg-white">
              {Object.entries(obligationLabels).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
            </select>
          </div>
          <div>
            <Label className="text-[12px] font-medium text-slate-600">Descripción</Label>
            <Input value={form.description} onChange={e => update("description", e.target.value)} className="mt-1 text-[13px] h-9" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-[12px] font-medium text-slate-600">Período</Label>
              <Input value={form.period} onChange={e => update("period", e.target.value)} placeholder="MM/YYYY" className="mt-1 text-[13px] h-9" />
            </div>
            <div>
              <Label className="text-[12px] font-medium text-slate-600">Fecha Vencimiento *</Label>
              <Input type="date" value={form.due_date} onChange={e => update("due_date", e.target.value)} required className="mt-1 text-[13px] h-9" />
            </div>
          </div>
          <div>
            <Label className="text-[12px] font-medium text-slate-600">Monto Estimado</Label>
            <Input type="number" value={form.amount_estimated} onChange={e => update("amount_estimated", e.target.value)} className="mt-1 text-[13px] h-9" />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={onClose} className="text-xs">Cancelar</Button>
            <Button type="submit" disabled={saving} className="bg-[#00C7D9] hover:bg-[#00A8BD] text-white text-xs">
              {saving ? "Guardando..." : "Crear"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}