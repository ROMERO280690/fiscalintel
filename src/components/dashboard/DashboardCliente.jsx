import React, { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { FileText, Bot } from "lucide-react";
import DarkCard from "./DarkCard";

export default function DashboardCliente({ user }) {
  const [filings, setFilings] = useState([]);
  const [docs, setDocs] = useState([]);
  const [deadlines, setDeadlines] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [aiInput, setAiInput] = useState("");
  const [aiResponse, setAiResponse] = useState("");
  const [aiLoading, setAiLoading] = useState(false);

  useEffect(() => {
    Promise.all([
      base44.entities.TaxFiling.list("-created_date", 50),
      base44.entities.Document.list("-created_date", 50),
      base44.entities.TaxDeadline.list("-due_date", 50),
      base44.entities.Employee.list("-created_date", 50),
    ]).then(([f, d, dl, e]) => { setFilings(f); setDocs(d); setDeadlines(dl); setEmployees(e); }).catch(() => {});
  }, []);

  const askAI = async () => {
    if (!aiInput.trim()) return;
    setAiLoading(true);
    try {
      const res = await base44.integrations.Core.InvokeLLM({
        prompt: `Sos un contador argentino experto. El cliente pregunta: "${aiInput}". Respondé de forma clara y breve.`,
      });
      setAiResponse(res);
    } catch { setAiResponse("Error al consultar."); }
    finally { setAiLoading(false); }
  };

  const nextDeadline = deadlines.filter(d => new Date(d.due_date) >= new Date()).sort((a,b) => new Date(a.due_date)-new Date(b.due_date))[0];
  const totalDeuda = filings.filter(f => f.status !== "submitted").reduce((s,f) => s+(f.tax_payable||0), 0);
  const hasRisk = filings.some(f => f.ai_risk_flags && f.ai_risk_flags.length > 2);
  const totalActivos = employees.filter(e => e.status === "active").length;
  const totalFractures = filings.length;

  const misObligaciones = filings.slice(0, 4).map(f => ({
    label: `${f.filing_type?.toUpperCase()} Manual — ${f.period}`,
    fecha: f.due_date || "Por definir",
    status: f.status === "submitted" ? "Presentada" : f.status === "draft" ? "Pendiente" : "En proceso",
    urgente: f.status === "draft",
  }));

  const documentosRecientes = docs.slice(0, 4).map(d => ({
    nombre: d.title,
    fecha: d.date || d.created_date?.slice(0, 10) || "—",
  }));

  const ultimasRecibos = [
    { mes: "Mayo 2024" }, { mes: "Abril 2024" }, { mes: "Marzo 2024" },
  ];

  return (
    <div>
      {/* Estado fiscal banner */}
      <div className="bg-gradient-to-r from-violet-600/15 to-indigo-600/15 border border-violet-500/15 rounded-xl p-3 mb-3">
        <div className="grid grid-cols-3 gap-2">
          <div>
            <p className="text-[9px] text-white/35 uppercase">Estado Fiscal</p>
            <p className={`text-[12px] font-bold ${hasRisk ? "text-amber-400" : "text-emerald-400"}`}>{hasRisk ? "Atención" : "Regular"}</p>
          </div>
          <div>
            <p className="text-[9px] text-white/35">Próximo Vencimiento</p>
            <p className="text-[12px] font-bold text-red-400">{nextDeadline?.due_date || "12/06/2024"}</p>
          </div>
          <div>
            <p className="text-[9px] text-white/35">Deuda Total</p>
            <p className="text-[12px] font-bold text-white">${totalDeuda.toLocaleString("es-AR") || "0"}</p>
          </div>
          <div>
            <p className="text-[9px] text-white/35">Riesgo Fiscal</p>
            <p className={`text-[12px] font-bold ${hasRisk ? "text-amber-400" : "text-emerald-400"}`}>{hasRisk ? "Medio" : "Bajo"}</p>
          </div>
          <div>
            <p className="text-[9px] text-white/35">Mis Empleados</p>
            <p className="text-[12px] font-bold text-white">{totalActivos || 23}</p>
          </div>
          <div>
            <p className="text-[9px] text-white/35">Activos / Fractures</p>
            <p className="text-[12px] font-bold text-white">{totalActivos || 23} / {totalFractures || 2}</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2 mb-3">
        <DarkCard title="Mis Obligaciones" icon={FileText} iconColor="text-violet-400" linkTo="/tax-filings" linkLabel="Ver todas">
          <div className="space-y-1.5">
            {(misObligaciones.length > 0 ? misObligaciones : [
              { label: "IVA Manual — Mayo 2024", fecha: "Hoy", urgente: true, status: "Pendiente" },
              { label: "IIBB-885 — Abril 2024", fecha: "09/05/2024", urgente: true, status: "Pendiente" },
              { label: "Consulto IA", fecha: "—", urgente: false, status: "En proceso" },
            ]).map((o, i) => (
              <div key={i} className={`flex items-center justify-between p-1.5 rounded-lg border ${o.urgente ? "bg-red-500/5 border-red-500/15" : "bg-white/3 border-white/5"}`}>
                <div className="flex-1 min-w-0">
                  <p className="text-[9px] text-white/70 truncate">{o.label}</p>
                  <p className="text-[8px] text-white/25">{o.fecha}</p>
                </div>
                <span className={`text-[8px] font-semibold px-1 py-0.5 rounded-full ml-1 flex-shrink-0 ${
                  o.status === "Presentada" ? "bg-emerald-500/20 text-emerald-400" :
                  o.urgente ? "bg-red-500/20 text-red-400" : "bg-amber-500/20 text-amber-400"
                }`}>{o.status}</span>
              </div>
            ))}
          </div>
        </DarkCard>

        <DarkCard title="Mis Documentos Recientes" icon={FileText} iconColor="text-blue-400" linkTo="/documents" linkLabel="Ver todos">
          <div className="space-y-1.5">
            {(documentosRecientes.length > 0 ? documentosRecientes : [
              { nombre: "Balero 2023.pdf", fecha: "12/05/2024" },
              { nombre: "AzN Ambiental.pdf", fecha: "09/06/2024" },
              { nombre: "Contrato Social.pdf", fecha: "28/04/2024" },
              { nombre: "Ganancias P.J 2023", fecha: "01/05/2024" },
            ]).map((d, i) => (
              <div key={i} className="flex items-center justify-between py-1.5 border-b border-white/5 last:border-0">
                <span className="text-[9px] text-white/70 truncate flex-1">{d.nombre}</span>
                <span className="text-[8px] text-white/25 ml-1 flex-shrink-0">{d.fecha}</span>
              </div>
            ))}
          </div>
        </DarkCard>

        <DarkCard title="Consultas Rápidas" icon={Bot} iconColor="text-violet-400">
          <p className="text-[9px] text-white/30 mb-2">Consultar a la IA</p>
          <textarea
            value={aiInput}
            onChange={e => setAiInput(e.target.value)}
            placeholder="Ej: ¿Cuándo vence mi próximo IVA?"
            className="w-full bg-white/5 border border-white/10 rounded-lg px-2 py-1.5 text-[9px] text-white placeholder-white/15 resize-none focus:outline-none focus:border-violet-500/40"
            rows={3}
          />
          <button onClick={askAI} disabled={aiLoading}
            className="w-full mt-2 bg-violet-600 hover:bg-violet-700 disabled:opacity-50 text-white text-[9px] font-semibold rounded-lg py-1.5 transition-colors flex items-center justify-center gap-1">
            {aiLoading ? <div className="w-2.5 h-2.5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Bot className="w-2.5 h-2.5" />}
            {aiLoading ? "Consultando..." : "Consultar"}
          </button>
          {aiResponse && (
            <div className="mt-2 bg-violet-500/10 border border-violet-500/20 rounded-lg p-2">
              <p className="text-[9px] text-white/70 leading-relaxed">{aiResponse}</p>
            </div>
          )}
        </DarkCard>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div className="bg-white/5 border border-white/8 rounded-xl p-3">
          <p className="text-[10px] font-semibold text-white/60 mb-2">Mis Empleados</p>
          <div className="flex items-end gap-3">
            <div><p className="text-[18px] font-bold text-white">{totalActivos || 23}</p><p className="text-[9px] text-white/30">Total Activos</p></div>
            <div><p className="text-[14px] font-bold text-emerald-400">2</p><p className="text-[9px] text-white/30">Activos</p></div>
          </div>
          <p className="text-[9px] text-white/20 mt-2 underline cursor-pointer">Ver todos los empleados</p>
        </div>
        <div className="bg-white/5 border border-white/8 rounded-xl p-3">
          <p className="text-[10px] font-semibold text-white/60 mb-2">Últimas Recibos</p>
          <div className="space-y-1.5">
            {ultimasRecibos.map((r, i) => (
              <div key={i} className="flex items-center justify-between py-1 border-b border-white/5 last:border-0">
                <span className="text-[9px] text-white/60">{r.mes}</span>
                <span className="text-[8px] text-violet-400 cursor-pointer hover:text-violet-300">Ver</span>
              </div>
            ))}
          </div>
          <p className="text-[9px] text-white/20 mt-2 underline cursor-pointer">Ver todos los recibos</p>
        </div>
      </div>
    </div>
  );
}