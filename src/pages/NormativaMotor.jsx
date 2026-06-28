import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Plus, Search, BookOpen, Bot, Loader2, AlertTriangle, RefreshCw, X, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import PageHeader from "@/components/shared/PageHeader";
import EmptyState from "@/components/shared/EmptyState";
import ReactMarkdown from "react-markdown";

const typeLabels = {
  resolucion_general: "RG", decreto: "Decreto", ley: "Ley",
  circular: "Circular", nota: "Nota Ext.", jurisprudencia: "Jurisprudencia", otro: "Otro"
};

const impactColors = {
  low: "bg-slate-100 text-slate-600",
  medium: "bg-amber-100 text-amber-700",
  high: "bg-orange-100 text-orange-700",
  critical: "bg-rose-100 text-rose-700"
};

const organismLabels = {
  arca: "ARCA", ministerio_economia: "Min. Economía",
  poder_ejecutivo: "P. Ejecutivo", tribunal_fiscal: "T. Fiscal",
  csjn: "CSJN", otro: "Otro"
};

function NormForm({ norm, onSave, onClose }) {
  const [form, setForm] = useState(norm || {
    title: "", type: "resolucion_general", number: "", organism: "arca",
    date: new Date().toISOString().split("T")[0], summary: "",
    impact_level: "medium", url: ""
  });
  const [analyzing, setAnalyzing] = useState(false);
  const [saving, setSaving] = useState(false);
  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));

  const analyzeWithAI = async () => {
    if (!form.title) return;
    setAnalyzing(true);
    const result = await base44.integrations.Core.InvokeLLM({
      prompt: `Analizá la siguiente normativa tributaria argentina y determiná su impacto en contribuyentes:
Tipo: ${typeLabels[form.type] || form.type}
Número: ${form.number || "S/N"}
Organismo: ${organism_Labels?.[form.organism] || form.organism}
Título: ${form.title}
Resumen: ${form.summary || "(sin resumen disponible)"}

Generá:
1. Resumen ejecutivo claro (2-3 párrafos)
2. Áreas impositivas afectadas (IVA, IIBB, Ganancias, Monotributo, Laboral, etc.)
3. Impacto en contribuyentes tipo (Monotributistas, Responsables Inscriptos, Sociedades)
4. Fecha de vigencia y plazos si mencionados
5. Acciones recomendadas para el contador

Sé preciso y técnico.`,
      model: "gemini_3_flash",
      add_context_from_internet: true,
    });
    set("ai_analysis", result);
    setAnalyzing(false);
  };

  // fix typo
  const organism_Labels = organismLabels;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-5 border-b border-slate-100">
          <h2 className="text-[15px] font-bold text-[#1A1A2E]">{norm ? "Editar Normativa" : "Registrar Normativa"}</h2>
          <button onClick={onClose}><X className="w-5 h-5 text-slate-400" /></button>
        </div>
        <div className="p-5 space-y-4">
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="text-[11px] text-slate-500 font-semibold uppercase mb-1 block">Tipo</label>
              <select value={form.type} onChange={e => set("type", e.target.value)}
                className="w-full h-9 px-3 rounded-lg border border-slate-200 text-[13px] focus:outline-none focus:ring-2 focus:ring-[#00C7D9]/20">
                {Object.entries(typeLabels).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
              </select>
            </div>
            <div>
              <label className="text-[11px] text-slate-500 font-semibold uppercase mb-1 block">Número</label>
              <Input value={form.number} onChange={e => set("number", e.target.value)} className="h-9 text-[13px]" placeholder="5524/2026" />
            </div>
            <div>
              <label className="text-[11px] text-slate-500 font-semibold uppercase mb-1 block">Organismo</label>
              <select value={form.organism} onChange={e => set("organism", e.target.value)}
                className="w-full h-9 px-3 rounded-lg border border-slate-200 text-[13px] focus:outline-none focus:ring-2 focus:ring-[#00C7D9]/20">
                {Object.entries(organismLabels).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label className="text-[11px] text-slate-500 font-semibold uppercase mb-1 block">Título *</label>
            <Input value={form.title} onChange={e => set("title", e.target.value)} className="h-9 text-[13px]" placeholder="Título de la normativa" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[11px] text-slate-500 font-semibold uppercase mb-1 block">Fecha</label>
              <Input type="date" value={form.date} onChange={e => set("date", e.target.value)} className="h-9 text-[13px]" />
            </div>
            <div>
              <label className="text-[11px] text-slate-500 font-semibold uppercase mb-1 block">Impacto</label>
              <select value={form.impact_level} onChange={e => set("impact_level", e.target.value)}
                className="w-full h-9 px-3 rounded-lg border border-slate-200 text-[13px] focus:outline-none focus:ring-2 focus:ring-[#00C7D9]/20">
                <option value="low">Bajo</option>
                <option value="medium">Medio</option>
                <option value="high">Alto</option>
                <option value="critical">Crítico</option>
              </select>
            </div>
          </div>
          <div>
            <label className="text-[11px] text-slate-500 font-semibold uppercase mb-1 block">Resumen</label>
            <textarea value={form.summary} onChange={e => set("summary", e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-slate-200 text-[13px] resize-none focus:outline-none focus:ring-2 focus:ring-[#00C7D9]/20"
              rows={3} placeholder="Descripción breve de la normativa..." />
          </div>
          <div>
            <label className="text-[11px] text-slate-500 font-semibold uppercase mb-1 block">URL oficial</label>
            <Input value={form.url} onChange={e => set("url", e.target.value)} className="h-9 text-[13px]" placeholder="https://www.arca.gob.ar/..." />
          </div>
          <Button size="sm" variant="outline" onClick={analyzeWithAI} disabled={analyzing || !form.title}
            className="text-[#00C7D9] border-[#00C7D9]/30 hover:bg-[#E0F7FA]">
            {analyzing ? <Loader2 className="w-3.5 h-3.5 animate-spin mr-1" /> : <Bot className="w-3.5 h-3.5 mr-1" />}
            {analyzing ? "Analizando con IA..." : "Analizar con IA"}
          </Button>
          {form.ai_analysis && (
            <div className="bg-[#E0F7FA] rounded-xl p-4">
              <p className="text-[11px] font-semibold text-[#00A8BD] mb-2 flex items-center gap-1.5">
                <Bot className="w-3.5 h-3.5" />Análisis IA
              </p>
              <div className="prose prose-sm max-w-none text-[12px] max-h-48 overflow-y-auto">
                <ReactMarkdown>{form.ai_analysis}</ReactMarkdown>
              </div>
            </div>
          )}
        </div>
        <div className="flex justify-end gap-2 p-5 border-t border-slate-100">
          <Button variant="outline" size="sm" onClick={onClose}>Cancelar</Button>
          <Button size="sm" disabled={saving || !form.title}
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

export default function NormativaMotor() {
  const [norms, setNorms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [selected, setSelected] = useState(null);
  const [scanning, setScanning] = useState(false);

  const load = async () => {
    const data = await base44.entities.NormativaUpdate.list("-date", 200);
    setNorms(data); setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const handleSave = async (data) => {
    if (editing) { await base44.entities.NormativaUpdate.update(editing.id, data); }
    else { await base44.entities.NormativaUpdate.create(data); }
    setShowForm(false); setEditing(null); load();
  };

  const scanNormativa = async () => {
    setScanning(true);
    const result = await base44.integrations.Core.InvokeLLM({
      prompt: `Buscá las últimas resoluciones generales y normativas tributarias de ARCA (ex AFIP) de Argentina de los últimos 30 días.
Lista las 5 más importantes con: número, título, organismo, fecha, resumen de 2 líneas, e impacto (low/medium/high/critical).
Respondé en JSON.`,
      model: "gemini_3_flash",
      add_context_from_internet: true,
      response_json_schema: {
        type: "object",
        properties: {
          normativas: {
            type: "array",
            items: {
              type: "object",
              properties: {
                title: { type: "string" },
                number: { type: "string" },
                type: { type: "string" },
                organism: { type: "string" },
                date: { type: "string" },
                summary: { type: "string" },
                impact_level: { type: "string" }
              }
            }
          }
        }
      }
    });
    if (result.normativas?.length) {
      for (const n of result.normativas) {
        await base44.entities.NormativaUpdate.create({
          ...n, organism: "arca"
        });
      }
      load();
    }
    setScanning(false);
  };

  const filtered = norms.filter(n => {
    const matchSearch = !search || n.title?.toLowerCase().includes(search.toLowerCase()) || n.number?.includes(search);
    const matchType = !typeFilter || n.type === typeFilter;
    return matchSearch && matchType;
  });

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-8 h-8 border-4 border-slate-200 border-t-[#00C7D9] rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="flex gap-4 h-[calc(100vh-6rem)]">
      {/* List */}
      <div className="flex-1 overflow-y-auto">
        <PageHeader title="Motor Normativo" subtitle="Análisis de resoluciones ARCA, leyes y normativa tributaria">
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={scanNormativa} disabled={scanning}
              className="text-[#00C7D9] border-[#00C7D9]/30 text-xs">
              {scanning ? <Loader2 className="w-3.5 h-3.5 animate-spin mr-1" /> : <RefreshCw className="w-3.5 h-3.5 mr-1" />}
              {scanning ? "Escaneando..." : "Escanear ARCA"}
            </Button>
            <Button onClick={() => { setEditing(null); setShowForm(true); }} className="bg-[#00C7D9] hover:bg-[#00A8BD] text-white text-xs">
              <Plus className="w-3.5 h-3.5 mr-1" /> Registrar Normativa
            </Button>
          </div>
        </PageHeader>

        <div className="flex gap-3 mb-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input placeholder="Buscar por título o número..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9 h-9 text-[13px]" />
          </div>
          <select value={typeFilter} onChange={e => setTypeFilter(e.target.value)}
            className="h-9 px-3 rounded-lg border border-slate-200 text-[13px] bg-white focus:outline-none">
            <option value="">Todos los tipos</option>
            {Object.entries(typeLabels).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </select>
        </div>

        {filtered.length === 0 ? (
          <EmptyState icon={BookOpen} title="Sin normativa registrada" description="Registrá manualmente o usá 'Escanear ARCA' para obtener las últimas novedades.">
            <Button onClick={scanNormativa} disabled={scanning} className="bg-[#00C7D9] hover:bg-[#00A8BD] text-white text-xs">
              {scanning ? <Loader2 className="w-3.5 h-3.5 animate-spin mr-1" /> : <RefreshCw className="w-3.5 h-3.5 mr-1" />}
              Escanear ARCA
            </Button>
          </EmptyState>
        ) : (
          <div className="space-y-2">
            {filtered.map(n => (
              <div key={n.id}
                onClick={() => setSelected(selected?.id === n.id ? null : n)}
                className={`bg-white rounded-xl p-4 shadow-sm border cursor-pointer transition-all hover:border-[#00C7D9]/30 ${selected?.id === n.id ? "border-[#00C7D9]" : "border-slate-100"}`}>
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3 min-w-0">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border flex-shrink-0 ${impactColors[n.impact_level] || impactColors.medium}`}>
                      {n.impact_level?.toUpperCase()}
                    </span>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-[10px] font-bold text-slate-500 uppercase">{typeLabels[n.type]} {n.number}</span>
                        <span className="text-[10px] text-slate-400">{organismLabels[n.organism]}</span>
                        {n.date && <span className="text-[10px] text-slate-400 font-mono">{n.date}</span>}
                      </div>
                      <p className="text-[13px] font-semibold text-[#1A1A2E] mt-0.5">{n.title}</p>
                      {n.summary && <p className="text-[12px] text-slate-500 mt-1 line-clamp-2">{n.summary}</p>}
                    </div>
                  </div>
                  <button onClick={e => { e.stopPropagation(); setEditing(n); setShowForm(true); }}
                    className="text-[11px] text-[#00C7D9] hover:underline flex-shrink-0">Editar</button>
                </div>
                {selected?.id === n.id && n.ai_analysis && (
                  <div className="mt-4 bg-[#E0F7FA] rounded-xl p-4">
                    <p className="text-[11px] font-semibold text-[#00A8BD] mb-2 flex items-center gap-1.5">
                      <Bot className="w-3.5 h-3.5" />Análisis IA
                    </p>
                    <div className="prose prose-sm max-w-none text-[12px]">
                      <ReactMarkdown>{n.ai_analysis}</ReactMarkdown>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {showForm && <NormForm norm={editing} onSave={handleSave} onClose={() => { setShowForm(false); setEditing(null); }} />}
    </div>
  );
}