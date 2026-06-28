import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import {
  FileText, Calendar, DollarSign, Shield, Download,
  CheckCircle, AlertTriangle, Clock, Bot, Send, Loader2, Eye
} from "lucide-react";
import { Button } from "@/components/ui/button";
import ReactMarkdown from "react-markdown";
import StatusBadge from "@/components/shared/StatusBadge";

export default function ClientPortal() {
  const [user, setUser] = useState(null);
  const [client, setClient] = useState(null);
  const [filings, setFilings] = useState([]);
  const [documents, setDocuments] = useState([]);
  const [deadlines, setDeadlines] = useState([]);
  const [payslips, setPayslips] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("resumen");
  const [chatInput, setChatInput] = useState("");
  const [chatMessages, setChatMessages] = useState([]);
  const [chatLoading, setChatLoading] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const u = await base44.auth.me();
        setUser(u);
        // Find client by email match
        const clients = await base44.entities.Client.filter({ email: u.email });
        const myClient = clients[0] || null;
        setClient(myClient);
        if (myClient) {
          const [f, d, dl, ps] = await Promise.all([
            base44.entities.TaxFiling.filter({ client_id: myClient.id }),
            base44.entities.Document.filter({ client_id: myClient.id }),
            base44.entities.TaxDeadline.filter({ client_id: myClient.id }),
            base44.entities.Payslip.filter({ client_id: myClient.id }),
          ]);
          setFilings(f); setDocuments(d); setDeadlines(dl); setPayslips(ps);
        }
      } catch (e) { console.error(e); }
      finally { setLoading(false); }
    })();
  }, []);

  const sendChat = async () => {
    if (!chatInput.trim() || chatLoading) return;
    const text = chatInput;
    setChatInput("");
    setChatMessages(prev => [...prev, { role: "user", content: text }]);
    setChatLoading(true);
    try {
      const response = await base44.integrations.Core.InvokeLLM({
        prompt: `Sos un asistente fiscal amigable para contribuyentes argentinos (no contadores). Respondé en lenguaje simple y claro.
${client ? `El contribuyente es ${client.business_name} (${client.client_type}, CUIT: ${client.cuit}).` : ""}
Consulta: ${text}`,
        model: "gemini_3_flash",
        add_context_from_internet: true,
      });
      setChatMessages(prev => [...prev, { role: "assistant", content: response }]);
    } catch (e) {
      setChatMessages(prev => [...prev, { role: "assistant", content: "Error al procesar tu consulta. Intentá de nuevo." }]);
    }
    setChatLoading(false);
  };

  const today = new Date();
  const overdueDeadlines = deadlines.filter(d => new Date(d.due_date) < today && d.status === "pending");
  const urgentDeadlines = deadlines.filter(d => {
    const diff = (new Date(d.due_date) - today) / (1000 * 60 * 60 * 24);
    return diff >= 0 && diff <= 10 && d.status === "pending";
  });
  const pendingFilings = filings.filter(f => ["draft","ai_generated","review"].includes(f.status));
  const approvedFilings = filings.filter(f => ["approved","submitted"].includes(f.status));

  const tabs = [
    { id: "resumen", label: "Mi Situación" },
    { id: "impuestos", label: "Impuestos" },
    { id: "documentos", label: "Documentos" },
    { id: "vencimientos", label: "Vencimientos" },
    { id: "recibos", label: "Recibos" },
    { id: "consultar", label: "Consultar IA" },
  ];

  if (loading) return (
    <div className="min-h-screen bg-gradient-to-br from-[#1A1A2E] to-[#16213E] flex items-center justify-center">
      <div className="w-8 h-8 border-4 border-white/20 border-t-[#00C7D9] rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="min-h-screen bg-[#F5F7FA]">
      {/* Header */}
      <div className="bg-gradient-to-r from-[#1A1A2E] to-[#16213E] px-6 py-5 text-white">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#00C7D9] flex items-center justify-center">
              <Shield className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-base font-bold">ContaIA — Portal del Cliente</h1>
              <p className="text-[12px] text-slate-400">{client?.business_name || user?.full_name}</p>
            </div>
          </div>
          {client && (
            <div className="text-right">
              <p className="text-[11px] text-slate-400">CUIT</p>
              <p className="text-[13px] font-mono font-bold text-[#00C7D9]">{client.cuit}</p>
            </div>
          )}
        </div>
      </div>

      {!client ? (
        <div className="max-w-4xl mx-auto py-20 text-center">
          <Shield className="w-16 h-16 text-slate-300 mx-auto mb-4" />
          <h2 className="text-lg font-bold text-slate-600 mb-2">Tu perfil aún no está vinculado</h2>
          <p className="text-[13px] text-slate-500">Contactá a tu contador para vincular tu cuenta al portal.</p>
        </div>
      ) : (
        <div className="max-w-4xl mx-auto py-6 px-4 space-y-5">
          {/* Status alerts */}
          {overdueDeadlines.length > 0 && (
            <div className="bg-rose-50 border border-rose-200 rounded-xl px-4 py-3 flex items-center gap-3">
              <AlertTriangle className="w-5 h-5 text-rose-600 flex-shrink-0" />
              <p className="text-[13px] text-rose-700 font-medium">Tenés {overdueDeadlines.length} obligación(es) fiscal(es) vencida(s). Contactá a tu contador.</p>
            </div>
          )}
          {urgentDeadlines.length > 0 && (
            <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 flex items-center gap-3">
              <Clock className="w-5 h-5 text-amber-600 flex-shrink-0" />
              <p className="text-[13px] text-amber-700 font-medium">{urgentDeadlines.length} vencimiento(s) próximo(s) en los próximos 10 días.</p>
            </div>
          )}

          {/* Tabs */}
          <div className="flex gap-1.5 overflow-x-auto pb-1">
            {tabs.map(t => (
              <button key={t.id} onClick={() => setActiveTab(t.id)}
                className={`px-3 py-1.5 rounded-lg text-[12px] font-medium whitespace-nowrap transition-colors ${activeTab === t.id ? "bg-[#00C7D9] text-white" : "bg-white text-slate-600 border border-slate-200 hover:border-[#00C7D9]/30"}`}>
                {t.label}
              </button>
            ))}
          </div>

          {/* Resumen */}
          {activeTab === "resumen" && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {[
                  { label: "Compliance", value: `${client.compliance_score || 100}%`, color: "text-emerald-600", bg: "bg-emerald-50 border-emerald-100" },
                  { label: "DDJJ Presentadas", value: approvedFilings.length, color: "text-[#00C7D9]", bg: "bg-white border-slate-100" },
                  { label: "Pendiente Firma", value: pendingFilings.length, color: "text-amber-600", bg: "bg-amber-50 border-amber-100" },
                  { label: "Documentos", value: documents.length, color: "text-slate-600", bg: "bg-white border-slate-100" },
                ].map(s => (
                  <div key={s.label} className={`${s.bg} border rounded-xl p-4 text-center`}>
                    <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
                    <p className="text-[11px] text-slate-500 mt-0.5">{s.label}</p>
                  </div>
                ))}
              </div>

              <div className="bg-white rounded-xl p-5 border border-slate-100 shadow-sm">
                <h3 className="text-[13px] font-bold text-[#1A1A2E] mb-3">Mis datos fiscales</h3>
                <div className="grid grid-cols-2 gap-3 text-[13px]">
                  <div><p className="text-slate-400 text-[11px]">Razón social</p><p className="font-medium">{client.business_name}</p></div>
                  <div><p className="text-slate-400 text-[11px]">CUIT</p><p className="font-mono font-medium">{client.cuit}</p></div>
                  <div><p className="text-slate-400 text-[11px]">Categoría</p><p className="font-medium capitalize">{client.client_type?.replace("_", " ")}</p></div>
                  <div><p className="text-slate-400 text-[11px]">Categoría IVA</p><p className="font-medium">{client.tax_category || "—"}</p></div>
                  <div><p className="text-slate-400 text-[11px]">Actividad</p><p className="font-medium">{client.activity || "—"}</p></div>
                  <div><p className="text-slate-400 text-[11px]">Riesgo fiscal</p><p className="font-medium capitalize">{client.risk_level || "Bajo"}</p></div>
                </div>
              </div>
            </div>
          )}

          {/* Impuestos */}
          {activeTab === "impuestos" && (
            <div className="space-y-3">
              <h3 className="text-[13px] font-bold text-[#1A1A2E]">Mis declaraciones juradas</h3>
              {filings.length === 0 ? (
                <div className="bg-white rounded-xl p-10 text-center border border-slate-100">
                  <FileText className="w-10 h-10 text-slate-200 mx-auto mb-2" />
                  <p className="text-[13px] text-slate-500">Sin declaraciones registradas aún.</p>
                </div>
              ) : filings.map(f => (
                <div key={f.id} className="bg-white rounded-xl p-4 border border-slate-100 shadow-sm flex items-center justify-between">
                  <div>
                    <p className="text-[13px] font-semibold text-[#1A1A2E]">{f.filing_type?.toUpperCase()} — {f.period}</p>
                    {f.tax_payable ? <p className="text-[12px] text-slate-500 font-mono">A pagar: ${f.tax_payable.toLocaleString("es-AR")}</p> : null}
                    {f.due_date && <p className="text-[11px] text-slate-400">Vence: {f.due_date}</p>}
                  </div>
                  <StatusBadge status={f.status} />
                </div>
              ))}
            </div>
          )}

          {/* Documentos */}
          {activeTab === "documentos" && (
            <div className="space-y-3">
              <h3 className="text-[13px] font-bold text-[#1A1A2E]">Mis documentos</h3>
              {documents.length === 0 ? (
                <div className="bg-white rounded-xl p-10 text-center border border-slate-100">
                  <FileText className="w-10 h-10 text-slate-200 mx-auto mb-2" />
                  <p className="text-[13px] text-slate-500">Sin documentos aún.</p>
                </div>
              ) : documents.map(doc => (
                <div key={doc.id} className="bg-white rounded-xl p-4 border border-slate-100 shadow-sm flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <FileText className="w-4 h-4 text-slate-400 flex-shrink-0" />
                    <div>
                      <p className="text-[13px] font-medium text-[#1A1A2E]">{doc.title}</p>
                      <p className="text-[11px] text-slate-400">{doc.date} · {doc.doc_type}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {doc.amount && <span className="text-[12px] font-mono font-medium">${doc.amount.toLocaleString("es-AR")}</span>}
                    <StatusBadge status={doc.status} />
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Vencimientos */}
          {activeTab === "vencimientos" && (
            <div className="space-y-3">
              <h3 className="text-[13px] font-bold text-[#1A1A2E]">Mis vencimientos fiscales</h3>
              {deadlines.length === 0 ? (
                <div className="bg-white rounded-xl p-10 text-center border border-slate-100">
                  <Calendar className="w-10 h-10 text-slate-200 mx-auto mb-2" />
                  <p className="text-[13px] text-slate-500">Sin vencimientos registrados.</p>
                </div>
              ) : deadlines.map(dl => {
                const isOd = new Date(dl.due_date) < today;
                return (
                  <div key={dl.id} className={`rounded-xl p-4 border flex items-center justify-between ${isOd ? "bg-rose-50 border-rose-200" : "bg-white border-slate-100"}`}>
                    <div>
                      <p className="text-[13px] font-semibold text-[#1A1A2E]">{dl.obligation_type?.toUpperCase()} — {dl.period}</p>
                      <p className="text-[11px] text-slate-500">{dl.description}</p>
                    </div>
                    <div className="text-right">
                      <p className={`text-[13px] font-bold font-mono ${isOd ? "text-rose-600" : "text-[#1A1A2E]"}`}>{dl.due_date}</p>
                      <StatusBadge status={dl.status} />
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Recibos */}
          {activeTab === "recibos" && (
            <div className="space-y-3">
              <h3 className="text-[13px] font-bold text-[#1A1A2E]">Mis recibos de sueldo</h3>
              {payslips.length === 0 ? (
                <div className="bg-white rounded-xl p-10 text-center border border-slate-100">
                  <DollarSign className="w-10 h-10 text-slate-200 mx-auto mb-2" />
                  <p className="text-[13px] text-slate-500">Sin recibos registrados.</p>
                </div>
              ) : payslips.map(ps => (
                <div key={ps.id} className="bg-white rounded-xl p-4 border border-slate-100 shadow-sm">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <p className="text-[13px] font-semibold text-[#1A1A2E]">{ps.employee_name}</p>
                      <p className="text-[11px] text-slate-500">Período: {ps.period}</p>
                    </div>
                    <StatusBadge status={ps.status} />
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-center">
                    <div className="bg-slate-50 rounded-lg p-2">
                      <p className="text-[10px] text-slate-400">Bruto</p>
                      <p className="text-[13px] font-bold font-mono">${(ps.gross_salary || 0).toLocaleString("es-AR")}</p>
                    </div>
                    <div className="bg-rose-50 rounded-lg p-2">
                      <p className="text-[10px] text-slate-400">Deducciones</p>
                      <p className="text-[13px] font-bold font-mono text-rose-600">${(ps.total_deductions || 0).toLocaleString("es-AR")}</p>
                    </div>
                    <div className="bg-[#E0F7FA] rounded-lg p-2">
                      <p className="text-[10px] text-slate-400">Neto</p>
                      <p className="text-[13px] font-bold font-mono text-[#00A8BD]">${(ps.net_salary || 0).toLocaleString("es-AR")}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Chat IA */}
          {activeTab === "consultar" && (
            <div className="bg-white rounded-xl border border-slate-100 shadow-sm flex flex-col" style={{ height: "500px" }}>
              <div className="p-4 border-b border-slate-100 flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-[#00C7D9]/15 flex items-center justify-center">
                  <Bot className="w-4 h-4 text-[#00C7D9]" />
                </div>
                <div>
                  <p className="text-[13px] font-semibold text-[#1A1A2E]">Consultor Fiscal IA</p>
                  <p className="text-[11px] text-slate-400">Respondemos tus dudas fiscales en lenguaje simple</p>
                </div>
              </div>
              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {chatMessages.length === 0 && (
                  <div className="flex flex-col items-center justify-center h-full text-slate-400">
                    <Bot className="w-10 h-10 mb-2 text-slate-200" />
                    <p className="text-[13px]">¿Tenés dudas sobre tus impuestos?</p>
                    <p className="text-[12px]">Preguntame lo que necesites</p>
                  </div>
                )}
                {chatMessages.map((msg, i) => (
                  <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                    <div className={`max-w-[80%] rounded-2xl px-4 py-3 ${msg.role === "user" ? "bg-[#1A1A2E] text-white" : "bg-slate-50 border border-slate-100"}`}>
                      {msg.role === "user" ? (
                        <p className="text-[13px]">{msg.content}</p>
                      ) : (
                        <ReactMarkdown className="text-[13px] prose prose-sm max-w-none">{msg.content}</ReactMarkdown>
                      )}
                    </div>
                  </div>
                ))}
                {chatLoading && (
                  <div className="flex justify-start">
                    <div className="bg-slate-50 border border-slate-100 rounded-2xl px-4 py-3 flex items-center gap-2">
                      <Loader2 className="w-4 h-4 animate-spin text-[#00C7D9]" />
                      <span className="text-[13px] text-slate-500">Analizando...</span>
                    </div>
                  </div>
                )}
              </div>
              <div className="p-3 border-t border-slate-100">
                <form onSubmit={e => { e.preventDefault(); sendChat(); }} className="flex gap-2">
                  <input
                    value={chatInput}
                    onChange={e => setChatInput(e.target.value)}
                    placeholder="¿Qué impuestos pago? ¿Cuándo vence el monotributo?..."
                    className="flex-1 px-4 py-2.5 text-[13px] rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#00C7D9]/20"
                    disabled={chatLoading}
                  />
                  <Button type="submit" disabled={chatLoading || !chatInput.trim()} className="bg-[#00C7D9] hover:bg-[#00A8BD] text-white rounded-xl px-4">
                    <Send className="w-4 h-4" />
                  </Button>
                </form>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}