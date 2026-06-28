import React, { useState, useEffect } from "react";
import { usePermissions } from "@/hooks/usePermissions";
import PermissionGuard from "@/components/shared/PermissionGuard";
import { useCompanyData } from "@/hooks/useCompanyData";
import { useCompany } from "@/lib/CompanyContext";
import { base44 } from "@/api/base44Client";
import {
  Bot, CheckCircle, Clock, AlertTriangle, Zap, FileText,
  Users, ArrowRight, Loader2, Play, Eye, Building2
} from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import StatusBadge from "@/components/shared/StatusBadge";

export default function Dashboard() {
  const { canViewModule } = usePermissions();
  const { activeCompany } = useCompany();
  const { data: clients } = useCompanyData("Client", {}, "-created_date", 100);
  const { data: documents, reload: reloadDocs } = useCompanyData("Document", {}, "-created_date", 100);
  const { data: filings, reload: reloadFilings } = useCompanyData("TaxFiling", {}, "-created_date", 100);
  const { data: deadlines } = useCompanyData("TaxDeadline", {}, "-due_date", 100);
  const { data: payslips } = useCompanyData("Payslip", {}, "-created_date", 100);
  const { data: entries } = useCompanyData("AccountEntry", {}, "-created_date", 100);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [runningAI, setRunningAI] = useState(false);
  const [aiLog, setAiLog] = useState([]);

  const load = () => { reloadDocs(); reloadFilings(); };

  useEffect(() => {
    base44.auth.me().then(u => { setUser(u); setLoading(false); }).catch(() => setLoading(false));
  }, []);

  // Items pending professional review
  const pendingReview = [
    ...documents.filter(d => d.status === "classified").map(d => ({ type: "documento", label: d.title, id: d.id, path: "/review", status: d.status, client: d.client_id })),
    ...filings.filter(f => f.status === "ai_generated").map(f => ({ type: "ddjj", label: `DDJJ ${f.filing_type?.toUpperCase()} ${f.period}`, id: f.id, path: "/review", status: f.status, client: f.client_name })),
    ...payslips.filter(p => p.status === "ai_generated").map(p => ({ type: "recibo", label: `Recibo ${p.employee_name} ${p.period}`, id: p.id, path: "/review", status: p.status, client: p.employee_name })),
    ...entries.filter(e => e.ai_suggested && e.status === "draft").map(e => ({ type: "asiento", label: e.description, id: e.id, path: "/review", status: e.status, client: e.client_id })),
  ];

  const today = new Date();
  const overdueDeadlines = deadlines.filter(d => new Date(d.due_date) < today && d.status === "pending");
  const urgentDeadlines = deadlines.filter(d => {
    const diff = (new Date(d.due_date) - today) / (1000 * 60 * 60 * 24);
    return diff >= 0 && diff <= 7 && d.status === "pending";
  });

  const unprocessedDocs = documents.filter(d => d.status === "uploaded");
  const aiCompletedDocs = documents.filter(d => ["classified", "reviewed", "approved"].includes(d.status));
  const automation = documents.length > 0 ? Math.round((aiCompletedDocs.length / documents.length) * 100) : 0;

  const firstName = user?.full_name?.split(" ")[0] || "Contador";
  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Buenos días" : hour < 18 ? "Buenas tardes" : "Buenas noches";

  // Run full AI automation cycle
  const runAICycle = async () => {
    if (unprocessedDocs.length === 0 && filings.filter(f => f.status === "draft").length === 0) return;
    setRunningAI(true);
    setAiLog([]);

    const log = (msg) => setAiLog(prev => [...prev, { msg, time: new Date().toLocaleTimeString("es-AR", { hour: "2-digit", minute: "2-digit", second: "2-digit" }) }]);

    try {
      // Step 1: Classify uploaded docs
      const toClassify = documents.filter(d => d.status === "uploaded").slice(0, 5);
      if (toClassify.length > 0) {
        log(`Clasificando ${toClassify.length} documentos...`);
        for (const doc of toClassify) {
          const result = await base44.integrations.Core.InvokeLLM({
            prompt: `Clasificá este documento contable argentino. Título: "${doc.title}". Monto: ${doc.amount || "desconocido"}.
Determiná: tipo (factura_a/b/c, nota_credito, recibo, ddjj, contrato, otro), categoría (iva_compras/iva_ventas/sueldos/general), y extraé datos clave.
Respondé en JSON.`,
            response_json_schema: {
              type: "object",
              properties: {
                doc_type: { type: "string" },
                category: { type: "string" },
                ai_classification: { type: "string" },
                ai_confidence: { type: "number" },
                ai_notes: { type: "string" }
              }
            }
          });
          await base44.entities.Document.update(doc.id, {
            status: "classified",
            doc_type: result.doc_type || "otro",
            category: result.category || "general",
            ai_classification: result.ai_classification || "",
            ai_confidence: result.ai_confidence || 80,
          });
        }
        log(`✓ ${toClassify.length} documentos clasificados`);
      }

      // Step 2: Process draft tax filings
      const draftFilings = filings.filter(f => f.status === "draft").slice(0, 3);
      if (draftFilings.length > 0) {
        log(`Calculando ${draftFilings.length} declaraciones juradas...`);
        for (const filing of draftFilings) {
          const docs = await base44.entities.Document.filter({ client_id: filing.client_id });
          const totalAmount = docs.reduce((s, d) => s + (d.amount || 0), 0);
          const totalTax = docs.reduce((s, d) => s + (d.tax_amount || 0), 0);

          const result = await base44.integrations.Core.InvokeLLM({
            prompt: `Sos un contador argentino. Calculá la DDJJ de ${filing.filing_type?.toUpperCase()} período ${filing.period} para ${filing.client_name}.
Comprobantes disponibles: ${docs.length}. Total facturado: $${totalAmount.toLocaleString()}. IVA total: $${totalTax.toLocaleString()}.
Calculá débito fiscal, crédito fiscal, impuesto a pagar. Identificá riesgos. Respondé JSON.`,
            response_json_schema: {
              type: "object",
              properties: {
                total_debit: { type: "number" },
                total_credit: { type: "number" },
                tax_payable: { type: "number" },
                ai_notes: { type: "string" },
                risk_flags: { type: "string" }
              }
            }
          });
          await base44.entities.TaxFiling.update(filing.id, {
            status: "ai_generated",
            total_debit: result.total_debit || 0,
            total_credit: result.total_credit || 0,
            tax_payable: result.tax_payable || 0,
            ai_notes: result.ai_notes || "",
            ai_risk_flags: result.risk_flags || "",
          });
        }
        log(`✓ ${draftFilings.length} DDJJ calculadas`);
      }

      log("✓ Ciclo IA completado — Revisá la Bandeja de Aprobaciones");
      load();
    } catch (e) {
      log("⚠ Error en ciclo IA: " + e.message);
    } finally {
      setRunningAI(false);
    }
  };

  if (!canViewModule("dashboard")) return <PermissionGuard module="dashboard" />;

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-8 h-8 border-4 border-slate-200 border-t-[#00C7D9] rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="space-y-5">

      {/* Active Company Banner */}
      {activeCompany && (
        <div className="flex items-center gap-3 bg-white rounded-xl px-4 py-2.5 shadow-sm border border-slate-100">
          <div
            className="w-6 h-6 rounded-md flex items-center justify-center text-white text-[10px] font-bold flex-shrink-0"
            style={{ backgroundColor: activeCompany.color || "#00C7D9" }}
          >
            {activeCompany.fantasy_name?.[0] || activeCompany.business_name?.[0] || "E"}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[12px] font-semibold text-[#1A1A2E] truncate">
              {activeCompany.fantasy_name || activeCompany.business_name}
            </p>
            <p className="text-[10px] text-slate-400 font-mono">{activeCompany.cuit}</p>
          </div>
          <span className="text-[10px] text-slate-400">Empresa activa</span>
          <Link to="/companies" className="text-[11px] text-[#00C7D9] hover:underline flex items-center gap-0.5 flex-shrink-0">
            <Building2 className="w-3 h-3" /> Cambiar
          </Link>
        </div>
      )}
      {!activeCompany && (
        <Link to="/companies" className="flex items-center gap-3 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 hover:bg-amber-100 transition-colors">
          <AlertTriangle className="w-4 h-4 text-amber-500 flex-shrink-0" />
          <p className="text-[12px] font-medium text-amber-700 flex-1">No hay empresa activa. Los datos mostrados son globales.</p>
          <span className="text-[11px] text-amber-600 font-semibold">Crear empresa →</span>
        </Link>
      )}

      {/* Header */}
      <div className="bg-gradient-to-r from-[#1A1A2E] to-[#16213E] rounded-2xl p-5 text-white">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-[11px] text-slate-400 uppercase tracking-widest font-semibold">Sistema Operativo Tributario</p>
            <h2 className="text-lg font-bold mt-0.5">{greeting}, {firstName}</h2>
            <p className="text-[13px] text-slate-300 mt-1">
              La IA procesó <span className="text-[#00C7D9] font-semibold">{aiCompletedDocs.length}</span> de {documents.length} documentos.
              {pendingReview.length > 0 && <> Tenés <span className="text-amber-400 font-semibold">{pendingReview.length} ítems</span> esperando tu revisión.</>}
            </p>
          </div>
          <div className="flex-shrink-0 text-center">
            <div className="w-14 h-14 rounded-full border-4 border-[#00C7D9]/30 flex items-center justify-center bg-[#00C7D9]/10">
              <span className="text-[#00C7D9] text-lg font-bold">{automation}%</span>
            </div>
            <p className="text-[10px] text-slate-400 mt-1">Automatizado</p>
          </div>
        </div>

        <div className="flex gap-2 mt-4">
          <Button size="sm" onClick={runAICycle} disabled={runningAI}
            className="bg-[#00C7D9] hover:bg-[#00A8BD] text-white text-xs">
            {runningAI ? <Loader2 className="w-3.5 h-3.5 mr-1 animate-spin" /> : <Play className="w-3.5 h-3.5 mr-1" />}
            {runningAI ? "IA Procesando..." : "Ejecutar Ciclo IA"}
          </Button>
          <Link to="/review">
            <Button size="sm" className="bg-amber-500 hover:bg-amber-600 text-white text-xs">
              <Eye className="w-3.5 h-3.5 mr-1" />
              Bandeja de Revisión {pendingReview.length > 0 && `(${pendingReview.length})`}
            </Button>
          </Link>
        </div>

        {aiLog.length > 0 && (
          <div className="mt-4 bg-black/30 rounded-xl p-3 space-y-1 max-h-32 overflow-y-auto">
            {aiLog.map((l, i) => (
              <p key={i} className="text-[11px] font-mono text-slate-300">
                <span className="text-slate-500">[{l.time}]</span> {l.msg}
              </p>
            ))}
          </div>
        )}
      </div>

      {/* KPI row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: "Bandeja IA", value: pendingReview.length, sub: "esperan aprobación", icon: Bot, color: "bg-[#00C7D9]/10 text-[#00C7D9]", alert: pendingReview.length > 0 },
          { label: "Vencidos", value: overdueDeadlines.length, sub: "obligaciones vencidas", icon: AlertTriangle, color: "bg-rose-50 text-rose-600", alert: overdueDeadlines.length > 0 },
          { label: "Urgentes 7d", value: urgentDeadlines.length, sub: "próximos vencimientos", icon: Clock, color: "bg-amber-50 text-amber-600", alert: urgentDeadlines.length > 0 },
          { label: "Clientes Activos", value: clients.filter(c => c.status === "active").length, sub: "en el sistema", icon: Users, color: "bg-slate-100 text-slate-600", alert: false },
        ].map(k => (
          <div key={k.label} className={`bg-white rounded-xl p-4 shadow-sm border ${k.alert ? "border-amber-200" : "border-slate-100"}`}>
            <div className={`w-8 h-8 rounded-lg ${k.color} flex items-center justify-center mb-2`}>
              <k.icon className="w-4 h-4" />
            </div>
            <p className="text-2xl font-bold text-[#1A1A2E]">{k.value}</p>
            <p className="text-[12px] font-medium text-slate-600">{k.label}</p>
            <p className="text-[11px] text-slate-400">{k.sub}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

        {/* Pending Review Queue */}
        <div className="bg-white rounded-xl p-5 shadow-sm border border-slate-100">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-amber-100 flex items-center justify-center">
                <Eye className="w-3.5 h-3.5 text-amber-600" />
              </div>
              <h3 className="text-[13px] font-semibold text-[#1A1A2E]">Bandeja de Aprobaciones</h3>
            </div>
            <Link to="/review" className="text-[11px] text-[#00C7D9] hover:underline flex items-center gap-0.5">
              Ver todo <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
          {pendingReview.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-slate-400">
              <CheckCircle className="w-8 h-8 mb-2 text-emerald-400" />
              <p className="text-xs font-medium text-emerald-600">Todo al día</p>
              <p className="text-[11px] text-slate-400 mt-0.5">No hay ítems pendientes de revisión</p>
            </div>
          ) : (
            <div className="space-y-1.5">
              {pendingReview.slice(0, 6).map((item, i) => (
                <Link key={i} to="/review"
                  className="flex items-center justify-between p-2.5 rounded-lg bg-slate-50 hover:bg-[#E0F7FA] transition-colors group">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wide flex-shrink-0 ${
                      item.type === "ddjj" ? "bg-blue-100 text-blue-700" :
                      item.type === "recibo" ? "bg-purple-100 text-purple-700" :
                      item.type === "asiento" ? "bg-emerald-100 text-emerald-700" :
                      "bg-slate-200 text-slate-600"
                    }`}>{item.type}</span>
                    <p className="text-[12px] font-medium text-[#1A1A2E] truncate">{item.label}</p>
                  </div>
                  <Zap className="w-3.5 h-3.5 text-amber-400 flex-shrink-0 group-hover:text-[#00C7D9]" />
                </Link>
              ))}
              {pendingReview.length > 6 && (
                <Link to="/review" className="block text-center text-[11px] text-[#00C7D9] py-1 hover:underline">
                  +{pendingReview.length - 6} más
                </Link>
              )}
            </div>
          )}
        </div>

        {/* Urgent Deadlines */}
        <div className="bg-white rounded-xl p-5 shadow-sm border border-slate-100">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-rose-100 flex items-center justify-center">
                <Clock className="w-3.5 h-3.5 text-rose-600" />
              </div>
              <h3 className="text-[13px] font-semibold text-[#1A1A2E]">Vencimientos Urgentes</h3>
            </div>
            <Link to="/tax-calendar" className="text-[11px] text-[#00C7D9] hover:underline flex items-center gap-0.5">
              Calendario <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
          {[...overdueDeadlines, ...urgentDeadlines].length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-slate-400">
              <CheckCircle className="w-8 h-8 mb-2 text-emerald-400" />
              <p className="text-xs font-medium text-emerald-600">Sin vencimientos urgentes</p>
            </div>
          ) : (
            <div className="space-y-1.5">
              {[...overdueDeadlines, ...urgentDeadlines].slice(0, 6).map(dl => {
                const isOd = new Date(dl.due_date) < today;
                return (
                  <div key={dl.id} className={`flex items-center justify-between p-2.5 rounded-lg ${isOd ? "bg-rose-50" : "bg-amber-50"}`}>
                    <div className="min-w-0">
                      <p className="text-[12px] font-medium text-[#1A1A2E] truncate">{dl.client_name} — {dl.obligation_type?.toUpperCase()}</p>
                      <p className="text-[11px] text-slate-500">{dl.description}</p>
                    </div>
                    <span className={`text-[11px] font-bold font-mono flex-shrink-0 ml-2 ${isOd ? "text-rose-600" : "text-amber-600"}`}>{dl.due_date}</span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* AI Pipeline status */}
      <div className="bg-white rounded-xl p-5 shadow-sm border border-slate-100">
        <div className="flex items-center gap-2 mb-4">
          <Bot className="w-4 h-4 text-[#00C7D9]" />
          <h3 className="text-[13px] font-semibold text-[#1A1A2E]">Pipeline del Contador IA</h3>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          {[
            { label: "Documentos subidos", value: documents.filter(d => d.status === "uploaded").length, color: "bg-slate-100 text-slate-600" },
            { label: "Clasificados IA", value: documents.filter(d => d.status === "classified").length, color: "bg-blue-50 text-blue-600" },
            { label: "DDJJ generadas IA", value: filings.filter(f => f.status === "ai_generated").length, color: "bg-purple-50 text-purple-600" },
            { label: "Recibos generados", value: payslips.filter(p => p.status === "ai_generated").length, color: "bg-amber-50 text-amber-600" },
            { label: "Aprobados", value: documents.filter(d => d.status === "approved").length + filings.filter(f => f.status === "approved").length, color: "bg-emerald-50 text-emerald-600" },
          ].map(s => (
            <div key={s.label} className={`rounded-xl p-3 text-center ${s.color}`}>
              <p className="text-2xl font-bold">{s.value}</p>
              <p className="text-[10px] font-medium mt-0.5">{s.label}</p>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
}