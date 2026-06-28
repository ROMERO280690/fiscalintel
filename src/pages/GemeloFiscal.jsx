import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import {
  Search, Shield, AlertTriangle, TrendingUp, TrendingDown,
  FileText, Calendar, Users, DollarSign, Bot, ChevronRight,
  BarChart3, Loader2, RefreshCw
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import PageHeader from "@/components/shared/PageHeader";
import StatusBadge from "@/components/shared/StatusBadge";
import ReactMarkdown from "react-markdown";

const clientTypeLabels = {
  monotributista: "Monotributista", responsable_inscripto: "Resp. Inscripto",
  autonomo: "Autónomo", sas: "SAS", srl: "SRL", sa: "SA", pyme: "PyME"
};

export default function GemeloFiscal() {
  const [clients, setClients] = useState([]);
  const [selected, setSelected] = useState(null);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [analyzing, setAnalyzing] = useState(false);
  const [analysis, setAnalysis] = useState(null);
  const [clientData, setClientData] = useState(null);

  useEffect(() => {
    base44.entities.Client.list("-created_date", 200).then(c => {
      setClients(c);
      setLoading(false);
    });
  }, []);

  const selectClient = async (client) => {
    setSelected(client);
    setAnalysis(null);
    setClientData(null);
    const [docs, filings, deadlines, payslips, entries] = await Promise.all([
      base44.entities.Document.filter({ client_id: client.id }),
      base44.entities.TaxFiling.filter({ client_id: client.id }),
      base44.entities.TaxDeadline.filter({ client_id: client.id }),
      base44.entities.Payslip.filter({ client_id: client.id }),
      base44.entities.AccountEntry.filter({ client_id: client.id }),
    ]);
    setClientData({ docs, filings, deadlines, payslips, entries });
  };

  const runAnalysis = async () => {
    if (!selected || !clientData) return;
    setAnalyzing(true);
    const { docs, filings, deadlines, payslips } = clientData;
    const overdueCount = deadlines.filter(d => new Date(d.due_date) < new Date() && d.status === "pending").length;
    const totalBilled = docs.reduce((s, d) => s + (d.amount || 0), 0);
    const totalTax = filings.reduce((s, f) => s + (f.tax_payable || 0), 0);

    const result = await base44.integrations.Core.InvokeLLM({
      prompt: `Sos el Gemelo Fiscal Digital de ${selected.business_name} (${selected.cuit}).
Tipo: ${selected.client_type}. Categoría: ${selected.tax_category || "N/D"}.
Actividad: ${selected.activity || "N/D"}.

Datos del período actual:
- Documentos registrados: ${docs.length}
- Declaraciones juradas: ${filings.length} (aprobadas: ${filings.filter(f=>f.status==="approved" || f.status==="submitted").length})
- Vencimientos pendientes: ${deadlines.filter(d=>d.status==="pending").length} (${overdueCount} vencidos)
- Facturación total: $${totalBilled.toLocaleString("es-AR")}
- Impuestos liquidados: $${totalTax.toLocaleString("es-AR")}
- Empleados con recibos: ${[...new Set(payslips.map(p=>p.employee_id))].length}
- Compliance score actual: ${selected.compliance_score || 100}%

Generá un análisis 360° del contribuyente incluyendo:
1. Estado fiscal actual (semáforo: VERDE/AMARILLO/ROJO con justificación)
2. Riesgos detectados y su impacto estimado
3. Obligaciones próximas críticas
4. Recomendaciones de optimización tributaria
5. Alertas de cumplimiento
6. Proyección del próximo trimestre

Sé específico y usa datos argentinos (ARCA, escalas vigentes 2025-2026).`,
      model: "gemini_3_flash",
      add_context_from_internet: true,
    });
    setAnalysis(result);
    setAnalyzing(false);
  };

  const filtered = clients.filter(c =>
    !search || c.business_name?.toLowerCase().includes(search.toLowerCase()) || c.cuit?.includes(search)
  );

  const riskColor = (level) => ({
    low: "text-emerald-600 bg-emerald-50",
    medium: "text-amber-600 bg-amber-50",
    high: "text-orange-600 bg-orange-50",
    critical: "text-rose-600 bg-rose-50"
  }[level] || "text-slate-600 bg-slate-50");

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-8 h-8 border-4 border-slate-200 border-t-[#00C7D9] rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="flex gap-4 h-[calc(100vh-6rem)]">
      {/* Client list */}
      <div className="w-72 flex-shrink-0 flex flex-col gap-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input placeholder="Buscar cliente..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9 h-9 text-[13px]" />
        </div>
        <div className="flex-1 overflow-y-auto space-y-1.5">
          {filtered.map(c => (
            <button key={c.id} onClick={() => selectClient(c)}
              className={`w-full text-left p-3 rounded-xl border transition-all ${selected?.id === c.id ? "border-[#00C7D9] bg-[#E0F7FA]/40" : "border-slate-100 bg-white hover:border-slate-200"}`}>
              <div className="flex items-center justify-between">
                <div className="min-w-0">
                  <p className="text-[13px] font-semibold text-[#1A1A2E] truncate">{c.business_name}</p>
                  <p className="text-[11px] text-slate-400 font-mono">{c.cuit}</p>
                </div>
                <div className="flex flex-col items-end gap-1 flex-shrink-0 ml-2">
                  <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${riskColor(c.risk_level)}`}>
                    {c.risk_level?.toUpperCase() || "OK"}
                  </span>
                  <span className="text-[10px] text-slate-400">{c.compliance_score || 100}%</span>
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Main panel */}
      <div className="flex-1 overflow-y-auto">
        {!selected ? (
          <div className="flex flex-col items-center justify-center h-full text-slate-400">
            <Shield className="w-16 h-16 mb-3 text-slate-200" />
            <p className="text-[14px] font-medium text-slate-500">Seleccioná un cliente</p>
            <p className="text-[12px]">Para ver su Gemelo Fiscal Digital</p>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Client header */}
            <div className="bg-gradient-to-r from-[#1A1A2E] to-[#16213E] rounded-2xl p-5 text-white">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-[11px] text-slate-400 uppercase tracking-widest">Gemelo Fiscal Digital</p>
                  <h2 className="text-lg font-bold mt-0.5">{selected.business_name}</h2>
                  <p className="text-[13px] text-slate-300 font-mono">{selected.cuit} · {clientTypeLabels[selected.client_type] || selected.client_type}</p>
                  {selected.activity && <p className="text-[12px] text-slate-400 mt-1">{selected.activity}</p>}
                </div>
                <div className="text-right">
                  <div className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[12px] font-bold ${riskColor(selected.risk_level)}`}>
                    <Shield className="w-3.5 h-3.5" />
                    Riesgo: {selected.risk_level?.toUpperCase() || "BAJO"}
                  </div>
                  <div className="mt-2">
                    <div className="w-24 h-2 rounded-full bg-white/20 overflow-hidden">
                      <div className="h-full rounded-full bg-[#00C7D9]" style={{ width: `${selected.compliance_score || 100}%` }} />
                    </div>
                    <p className="text-[10px] text-slate-400 mt-0.5">Cumplimiento: {selected.compliance_score || 100}%</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Stats */}
            {clientData && (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {[
                  { label: "Documentos", value: clientData.docs.length, icon: FileText, color: "text-blue-600 bg-blue-50" },
                  { label: "DDJJ", value: clientData.filings.length, icon: BarChart3, color: "text-purple-600 bg-purple-50" },
                  { label: "Vencimientos", value: clientData.deadlines.filter(d=>d.status==="pending").length, icon: Calendar, color: "text-amber-600 bg-amber-50" },
                  { label: "Empleados", value: [...new Set(clientData.payslips.map(p=>p.employee_id))].length, icon: Users, color: "text-emerald-600 bg-emerald-50" },
                ].map(s => (
                  <div key={s.label} className="bg-white rounded-xl p-4 shadow-sm border border-slate-100">
                    <div className={`w-7 h-7 rounded-lg ${s.color} flex items-center justify-center mb-2`}>
                      <s.icon className="w-3.5 h-3.5" />
                    </div>
                    <p className="text-xl font-bold text-[#1A1A2E]">{s.value}</p>
                    <p className="text-[11px] text-slate-500">{s.label}</p>
                  </div>
                ))}
              </div>
            )}

            {/* AI Analysis */}
            <div className="bg-white rounded-xl p-5 shadow-sm border border-slate-100">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-[#00C7D9]/15 flex items-center justify-center">
                    <Bot className="w-3.5 h-3.5 text-[#00C7D9]" />
                  </div>
                  <h3 className="text-[13px] font-semibold text-[#1A1A2E]">Análisis IA 360°</h3>
                </div>
                <Button size="sm" onClick={runAnalysis} disabled={analyzing || !clientData}
                  className="bg-[#00C7D9] hover:bg-[#00A8BD] text-white text-xs">
                  {analyzing ? <Loader2 className="w-3.5 h-3.5 mr-1 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5 mr-1" />}
                  {analyzing ? "Analizando..." : "Generar Análisis"}
                </Button>
              </div>
              {!analysis && !analyzing && (
                <div className="flex flex-col items-center py-10 text-slate-400">
                  <Shield className="w-10 h-10 mb-2 text-slate-200" />
                  <p className="text-[13px]">Hacé clic en "Generar Análisis" para obtener el diagnóstico fiscal completo</p>
                </div>
              )}
              {analyzing && (
                <div className="flex flex-col items-center py-10">
                  <Loader2 className="w-10 h-10 mb-3 text-[#00C7D9] animate-spin" />
                  <p className="text-[13px] text-slate-500">El Gemelo Fiscal está analizando el perfil completo...</p>
                </div>
              )}
              {analysis && (
                <div className="prose prose-sm max-w-none text-[13px]">
                  <ReactMarkdown>{analysis}</ReactMarkdown>
                </div>
              )}
            </div>

            {/* Pending deadlines */}
            {clientData && clientData.deadlines.filter(d => d.status === "pending").length > 0 && (
              <div className="bg-white rounded-xl p-5 shadow-sm border border-slate-100">
                <h3 className="text-[13px] font-semibold text-[#1A1A2E] mb-3 flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-amber-500" /> Obligaciones Pendientes
                </h3>
                <div className="space-y-2">
                  {clientData.deadlines.filter(d => d.status === "pending").slice(0, 8).map(dl => {
                    const isOd = new Date(dl.due_date) < new Date();
                    return (
                      <div key={dl.id} className={`flex items-center justify-between p-2.5 rounded-lg ${isOd ? "bg-rose-50" : "bg-slate-50"}`}>
                        <div>
                          <p className="text-[12px] font-medium text-[#1A1A2E]">{dl.obligation_type?.toUpperCase()} — {dl.period}</p>
                          <p className="text-[11px] text-slate-500">{dl.description}</p>
                        </div>
                        <span className={`text-[11px] font-bold font-mono ${isOd ? "text-rose-600" : "text-amber-600"}`}>{dl.due_date}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}