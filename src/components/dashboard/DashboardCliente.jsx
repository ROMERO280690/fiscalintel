import React, { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { Link } from "react-router-dom";
import { FileText, Calendar, DollarSign, AlertTriangle, Bot, CheckCircle, Clock } from "lucide-react";
import DashboardShell from "./DashboardShell";
import DarkCard from "./DarkCard";

export default function DashboardCliente({ user }) {
  const [filings, setFilings] = useState([]);
  const [docs, setDocs] = useState([]);
  const [deadlines, setDeadlines] = useState([]);

  useEffect(() => {
    Promise.all([
      base44.entities.TaxFiling.list("-created_date", 50),
      base44.entities.Document.list("-created_date", 50),
      base44.entities.TaxDeadline.list("-due_date", 50),
    ]).then(([f, d, dl]) => {
      setFilings(f); setDocs(d); setDeadlines(dl);
    }).catch(() => {});
  }, []);

  const [aiInput, setAiInput] = useState("");
  const [aiResponse, setAiResponse] = useState("");
  const [aiLoading, setAiLoading] = useState(false);

  const askAI = async () => {
    if (!aiInput.trim()) return;
    setAiLoading(true);
    try {
      const res = await base44.integrations.Core.InvokeLLM({
        prompt: `Sos un contador argentino experto. El cliente pregunta: "${aiInput}". Respondé de forma clara, en español, y con términos simples.`,
      });
      setAiResponse(res);
    } catch (e) {
      setAiResponse("No se pudo obtener respuesta. Por favor intentá nuevamente.");
    } finally {
      setAiLoading(false);
    }
  };

  const nextDeadline = deadlines.filter(d => new Date(d.due_date) >= new Date()).sort((a, b) => new Date(a.due_date) - new Date(b.due_date))[0];
  const totalDeuda = filings.filter(f => f.status !== "submitted").reduce((s, f) => s + (f.tax_payable || 0), 0);
  const hasRisk = filings.some(f => f.ai_risk_flags && f.ai_risk_flags.length > 2);

  const misObligaciones = filings.slice(0, 5).map(f => ({
    label: `${f.filing_type?.toUpperCase()} Manual — ${f.period}`,
    fecha: f.due_date || "Por definir",
    status: f.status === "submitted" ? "Presentada" : f.status === "draft" ? "Pendiente" : "En proceso",
    urgente: f.status === "draft",
  }));

  const documentosRecientes = docs.slice(0, 5).map(d => ({
    nombre: d.title,
    fecha: d.date || d.created_date?.slice(0, 10) || "—",
    tipo: d.doc_type || "otro",
  }));

  return (
    <DashboardShell title="5. CLIENTE" subtitle="Portal del cliente" icon={FileText}>
      {/* Estado fiscal header */}
      <div className="bg-gradient-to-r from-violet-600/20 to-indigo-600/20 border border-violet-500/20 rounded-xl p-5 mb-6">
        <div className="flex flex-wrap items-center gap-6">
          <div>
            <p className="text-[11px] text-white/40 uppercase tracking-wider">Inicio</p>
            <p className="text-lg font-bold text-white mt-1">{user?.full_name?.split(" ")[0] || "Bienvenido"}</p>
            <p className="text-[12px] text-white/50">Bienvenido al Portal del Cliente</p>
          </div>
          <div className="h-12 w-px bg-white/10" />
          <div>
            <p className="text-[11px] text-white/40">Estado Fiscal</p>
            <p className={`text-[14px] font-bold mt-1 ${hasRisk ? "text-amber-400" : "text-emerald-400"}`}>{hasRisk ? "Atención" : "Regular"}</p>
          </div>
          <div className="h-12 w-px bg-white/10" />
          <div>
            <p className="text-[11px] text-white/40">Próximo Vencimiento</p>
            <p className="text-[14px] font-bold mt-1 text-red-400">{nextDeadline?.due_date || "12/06/2024"}</p>
            <p className="text-[10px] text-white/30">{nextDeadline?.description || "Sin detalles"}</p>
          </div>
          <div className="h-12 w-px bg-white/10" />
          <div>
            <p className="text-[11px] text-white/40">Deuda Total</p>
            <p className="text-[14px] font-bold mt-1 text-white">${totalDeuda.toLocaleString("es-AR") || "0"}</p>
          </div>
          <div className="h-12 w-px bg-white/10" />
          <div>
            <p className="text-[11px] text-white/40">Riesgo Fiscal</p>
            <p className={`text-[14px] font-bold mt-1 ${hasRisk ? "text-amber-400" : "text-emerald-400"}`}>{hasRisk ? "Medio" : "Bajo"}</p>
            <p className="text-[10px] text-white/30">{hasRisk ? "Hay alertas" : "May Solo"}</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
        {/* Mis Obligaciones */}
        <DarkCard title="Mis Obligaciones" icon={FileText} iconColor="text-violet-400" linkTo="/tax-filings" linkLabel="Ver todas mis obligaciones" className="lg:col-span-1">
          <div className="space-y-2">
            {(misObligaciones.length > 0 ? misObligaciones : [
              { label: "IVA Manual — Mayo 2024", fecha: "Hoy", urgente: true, status: "Pendiente" },
              { label: "IIBB-885 — Abril 2024", fecha: "09/05/2024", urgente: true, status: "Pendiente" },
              { label: "Consulto IA", fecha: "—", urgente: false, status: "En proceso" },
              { label: "Perh", fecha: "—", urgente: false, status: "Presentada" },
            ]).map((o, i) => (
              <div key={i} className={`flex items-center justify-between p-2 rounded-lg border ${o.urgente ? "bg-red-500/5 border-red-500/15" : "bg-white/3 border-white/5"} hover:bg-white/5 transition-colors`}>
                <div className="flex-1 min-w-0">
                  <p className="text-[11px] text-white/80 truncate">{o.label}</p>
                  <p className="text-[10px] text-white/30">{o.fecha}</p>
                </div>
                <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full ml-2 flex-shrink-0 ${
                  o.status === "Presentada" ? "bg-emerald-500/20 text-emerald-400" :
                  o.urgente ? "bg-red-500/20 text-red-400" : "bg-amber-500/20 text-amber-400"
                }`}>{o.status}</span>
              </div>
            ))}
          </div>
        </DarkCard>

        {/* Mis Documentos Recientes */}
        <DarkCard title="Mis Documentos Recientes" icon={FileText} iconColor="text-blue-400" linkTo="/documents" linkLabel="Ver todos mis documentos" className="lg:col-span-1">
          <div className="space-y-2">
            {(documentosRecientes.length > 0 ? documentosRecientes : [
              { nombre: "Balero 2023.pdf", fecha: "12/05/2024", tipo: "ddjj" },
              { nombre: "AzN Ambiental.pdf", fecha: "09/06/2024", tipo: "factura_a" },
              { nombre: "Contrato Social.pdf", fecha: "28/04/2024", tipo: "contrato" },
              { nombre: "Ganancias P.J 2023", fecha: "01/05/2024", tipo: "ddjj" },
            ]).map((d, i) => (
              <div key={i} className="flex items-center justify-between py-2 border-b border-white/5 last:border-0 hover:bg-white/3 rounded-lg px-1 transition-colors">
                <div className="flex items-center gap-2 min-w-0">
                  <div className="w-6 h-6 rounded bg-blue-500/20 flex items-center justify-center flex-shrink-0">
                    <FileText className="w-3 h-3 text-blue-400" />
                  </div>
                  <span className="text-[12px] text-white/80 truncate">{d.nombre}</span>
                </div>
                <span className="text-[10px] text-white/30 ml-2 flex-shrink-0">{d.fecha}</span>
              </div>
            ))}
          </div>
        </DarkCard>

        {/* Consultar IA */}
        <DarkCard title="Consultas Rápidas" icon={Bot} iconColor="text-violet-400" className="lg:col-span-1">
          <div className="space-y-3">
            <p className="text-[11px] text-white/40">Consultar a la IA</p>
            <p className="text-[11px] text-white/30 italic">Haz una pregunta sobre tu situación fiscal...</p>
            <textarea
              value={aiInput}
              onChange={e => setAiInput(e.target.value)}
              placeholder="Ej: ¿Cuándo vence mi próximo IVA?"
              className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-[12px] text-white placeholder-white/20 resize-none focus:outline-none focus:border-violet-500/50"
              rows={3}
            />
            <button
              onClick={askAI}
              disabled={aiLoading}
              className="w-full bg-violet-600 hover:bg-violet-700 disabled:opacity-50 text-white text-[12px] font-semibold rounded-lg py-2 transition-colors flex items-center justify-center gap-2"
            >
              {aiLoading ? <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Bot className="w-3 h-3" />}
              {aiLoading ? "Consultando..." : "Consultar"}
            </button>
            {aiResponse && (
              <div className="bg-violet-500/10 border border-violet-500/20 rounded-lg p-3">
                <p className="text-[11px] text-white/80 leading-relaxed">{aiResponse}</p>
              </div>
            )}
          </div>
        </DarkCard>
      </div>
    </DashboardShell>
  );
}