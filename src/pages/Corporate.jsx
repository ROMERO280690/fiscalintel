import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Plus, Search, Building2, Bot, Loader2, X, FileText, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import PageHeader from "@/components/shared/PageHeader";
import StatusBadge from "@/components/shared/StatusBadge";
import EmptyState from "@/components/shared/EmptyState";
import ReactMarkdown from "react-markdown";

const recordTypeLabels = {
  acta_directorio: "Acta Directorio", acta_asamblea: "Acta Asamblea",
  acta_socios: "Acta Socios", poder: "Poder", estatuto: "Estatuto",
  constitucion: "Constitución", modificacion: "Modificación",
  disolucion: "Disolución", libro_diario: "Libro Diario",
  libro_inventario: "Libro Inventario", otro: "Otro"
};

function RecordForm({ clients, record, onSave, onClose }) {
  const [form, setForm] = useState(record || {
    client_id: "", record_type: "acta_directorio", title: "",
    date: new Date().toISOString().split("T")[0], number: "", description: "",
    participants: "", resolutions: "", status: "draft"
  });
  const [generating, setGenerating] = useState(false);
  const [saving, setSaving] = useState(false);
  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));

  const generateDraft = async () => {
    if (!form.client_id || !form.record_type) return;
    setGenerating(true);
    const client = clients.find(c => c.id === form.client_id);
    const result = await base44.integrations.Core.InvokeLLM({
      prompt: `Generá un borrador de ${recordTypeLabels[form.record_type]} para la empresa ${client?.business_name} (${client?.cuit}).
Tipo de sociedad: ${client?.client_type}.
Descripción/Tema: ${form.description || "Reunión ordinaria"}.
Participantes: ${form.participants || "A determinar"}.

Generá el texto completo del acta con formato legal argentino, incluyendo encabezado, orden del día, desarrollo, resoluciones y cierre.`,
    });
    set("ai_draft", result);
    setGenerating(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-5 border-b border-slate-100">
          <h2 className="text-[15px] font-bold text-[#1A1A2E]">{record ? "Editar Registro" : "Nuevo Registro Societario"}</h2>
          <button onClick={onClose}><X className="w-5 h-5 text-slate-400" /></button>
        </div>
        <div className="p-5 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[11px] text-slate-500 font-semibold uppercase mb-1 block">Cliente *</label>
              <select value={form.client_id} onChange={e => set("client_id", e.target.value)}
                className="w-full h-9 px-3 rounded-lg border border-slate-200 text-[13px] focus:outline-none focus:ring-2 focus:ring-[#00C7D9]/20">
                <option value="">Seleccioná cliente</option>
                {clients.filter(c => ["sas","srl","sa","cooperativa"].includes(c.client_type)).map(c => (
                  <option key={c.id} value={c.id}>{c.business_name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-[11px] text-slate-500 font-semibold uppercase mb-1 block">Tipo de Acto</label>
              <select value={form.record_type} onChange={e => set("record_type", e.target.value)}
                className="w-full h-9 px-3 rounded-lg border border-slate-200 text-[13px] focus:outline-none focus:ring-2 focus:ring-[#00C7D9]/20">
                {Object.entries(recordTypeLabels).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div className="col-span-2">
              <label className="text-[11px] text-slate-500 font-semibold uppercase mb-1 block">Título *</label>
              <Input value={form.title} onChange={e => set("title", e.target.value)} className="h-9 text-[13px]" placeholder="Título del acto" />
            </div>
            <div>
              <label className="text-[11px] text-slate-500 font-semibold uppercase mb-1 block">Fecha</label>
              <Input type="date" value={form.date} onChange={e => set("date", e.target.value)} className="h-9 text-[13px]" />
            </div>
          </div>
          <div>
            <label className="text-[11px] text-slate-500 font-semibold uppercase mb-1 block">Participantes (nombre y cargo)</label>
            <Input value={form.participants} onChange={e => set("participants", e.target.value)} className="h-9 text-[13px]" placeholder="Ej: Juan Pérez (Presidente), María García (Directora)" />
          </div>
          <div>
            <label className="text-[11px] text-slate-500 font-semibold uppercase mb-1 block">Descripción / Orden del día</label>
            <textarea value={form.description} onChange={e => set("description", e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-slate-200 text-[13px] resize-none focus:outline-none focus:ring-2 focus:ring-[#00C7D9]/20"
              rows={3} placeholder="Temas a tratar..." />
          </div>
          <div className="flex gap-2">
            <Button size="sm" variant="outline" onClick={generateDraft} disabled={generating || !form.client_id}
              className="text-[#00C7D9] border-[#00C7D9]/30 hover:bg-[#E0F7FA]">
              {generating ? <Loader2 className="w-3.5 h-3.5 animate-spin mr-1" /> : <Bot className="w-3.5 h-3.5 mr-1" />}
              {generating ? "Generando..." : "Generar Borrador IA"}
            </Button>
          </div>
          {form.ai_draft && (
            <div className="bg-[#E0F7FA] rounded-xl p-4">
              <p className="text-[11px] font-semibold text-[#00A8BD] mb-2 flex items-center gap-1.5"><Bot className="w-3.5 h-3.5" />Borrador generado por IA</p>
              <div className="prose prose-sm max-w-none text-[12px] max-h-60 overflow-y-auto">
                <ReactMarkdown>{form.ai_draft}</ReactMarkdown>
              </div>
            </div>
          )}
          <div>
            <label className="text-[11px] text-slate-500 font-semibold uppercase mb-1 block">Resoluciones adoptadas</label>
            <textarea value={form.resolutions} onChange={e => set("resolutions", e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-slate-200 text-[13px] resize-none focus:outline-none focus:ring-2 focus:ring-[#00C7D9]/20"
              rows={2} placeholder="Resoluciones..." />
          </div>
          <div>
            <label className="text-[11px] text-slate-500 font-semibold uppercase mb-1 block">Estado</label>
            <select value={form.status} onChange={e => set("status", e.target.value)}
              className="w-full h-9 px-3 rounded-lg border border-slate-200 text-[13px] focus:outline-none focus:ring-2 focus:ring-[#00C7D9]/20">
              <option value="draft">Borrador</option>
              <option value="signed">Firmado</option>
              <option value="filed">Inscripto</option>
            </select>
          </div>
        </div>
        <div className="flex justify-end gap-2 p-5 border-t border-slate-100">
          <Button variant="outline" size="sm" onClick={onClose}>Cancelar</Button>
          <Button size="sm" disabled={saving || !form.client_id || !form.title}
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

export default function Corporate() {
  const [records, setRecords] = useState([]);
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("");

  const load = async () => {
    const [r, c] = await Promise.all([
      base44.entities.CorporateRecord.list("-date", 200),
      base44.entities.Client.list("-created_date", 200),
    ]);
    setRecords(r); setClients(c); setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const handleSave = async (data) => {
    const client = clients.find(c => c.id === data.client_id);
    const payload = { ...data, client_name: client?.business_name };
    if (editing) { await base44.entities.CorporateRecord.update(editing.id, payload); }
    else { await base44.entities.CorporateRecord.create(payload); }
    setShowForm(false); setEditing(null); load();
  };

  const filtered = records.filter(r => {
    const matchSearch = !search || r.title?.toLowerCase().includes(search.toLowerCase()) || r.client_name?.toLowerCase().includes(search.toLowerCase());
    const matchType = !typeFilter || r.record_type === typeFilter;
    return matchSearch && matchType;
  });

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-8 h-8 border-4 border-slate-200 border-t-[#00C7D9] rounded-full animate-spin" />
    </div>
  );

  return (
    <div>
      <PageHeader title="Societario" subtitle="Actas, libros y registros societarios">
        <Button onClick={() => { setEditing(null); setShowForm(true); }} className="bg-[#00C7D9] hover:bg-[#00A8BD] text-white text-xs">
          <Plus className="w-3.5 h-3.5 mr-1" /> Nuevo Registro
        </Button>
      </PageHeader>

      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input placeholder="Buscar registros..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9 h-9 text-[13px]" />
        </div>
        <select value={typeFilter} onChange={e => setTypeFilter(e.target.value)}
          className="h-9 px-3 rounded-lg border border-slate-200 text-[13px] bg-white focus:outline-none">
          <option value="">Todos los tipos</option>
          {Object.entries(recordTypeLabels).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
        </select>
      </div>

      {filtered.length === 0 ? (
        <EmptyState icon={Building2} title="Sin registros societarios" description="Gestioná actas, estatutos y libros de tus clientes societarios.">
          <Button onClick={() => setShowForm(true)} className="bg-[#00C7D9] hover:bg-[#00A8BD] text-white text-xs">
            <Plus className="w-3.5 h-3.5 mr-1" /> Nuevo Registro
          </Button>
        </EmptyState>
      ) : (
        <div className="space-y-2">
          {filtered.map(r => (
            <div key={r.id} onClick={() => { setEditing(r); setShowForm(true); }}
              className="bg-white rounded-xl p-4 shadow-sm border border-slate-100 hover:border-[#00C7D9]/30 cursor-pointer transition-all">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3 min-w-0">
                  <div className="w-8 h-8 rounded-lg bg-purple-50 flex items-center justify-center flex-shrink-0">
                    <FileText className="w-4 h-4 text-purple-600" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[13px] font-semibold text-[#1A1A2E] truncate">{r.title}</p>
                    <p className="text-[11px] text-slate-500">{r.client_name} · {recordTypeLabels[r.record_type]}</p>
                    {r.date && <p className="text-[11px] text-slate-400 font-mono">{r.date}</p>}
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  {r.ai_draft && <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-[#E0F7FA] text-[#00A8BD]">IA</span>}
                  <StatusBadge status={r.status} />
                </div>
              </div>
              {r.resolutions && <p className="text-[11px] text-slate-500 mt-2 line-clamp-2">{r.resolutions}</p>}
            </div>
          ))}
        </div>
      )}

      {showForm && <RecordForm clients={clients} record={editing} onSave={handleSave} onClose={() => { setShowForm(false); setEditing(null); }} />}
    </div>
  );
}