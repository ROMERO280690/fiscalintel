import React, { useState } from "react";
import { X, CheckCircle, XCircle, ExternalLink, Bot, AlertTriangle, Edit3, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import StatusBadge from "@/components/shared/StatusBadge";

const docTypeLabels = {
  factura_a: "Factura A", factura_b: "Factura B", factura_c: "Factura C",
  nota_credito: "Nota de Crédito", nota_debito: "Nota de Débito",
  recibo: "Recibo", ticket: "Ticket", contrato: "Contrato",
  ddjj: "DDJJ", certificado: "Certificado", otro: "Otro",
};

const DOC_TYPES = ["factura_a","factura_b","factura_c","nota_credito","nota_debito","recibo","ticket","contrato","ddjj","certificado","otro"];
const CATEGORIES = ["iva_compras","iva_ventas","iibb","monotributo","sueldos","sociedades","general"];

export default function DocumentReview({ document: doc, clientName, onClose, onApprove, onReject }) {
  const isPendingReview = doc.status === "pending_review";
  const canReview = isPendingReview || doc.status === "classified" || doc.status === "reviewed";

  const [editMode, setEditMode] = useState(isPendingReview);
  const [reviewNotes, setReviewNotes] = useState(doc.review_notes || "");
  const [fields, setFields] = useState({
    doc_type: doc.doc_type || "otro",
    category: doc.category || "general",
    amount: doc.amount ?? "",
    net_amount: doc.net_amount ?? "",
    tax_amount: doc.tax_amount ?? "",
    date: doc.date || "",
    cae_number: doc.cae_number || "",
    point_of_sale: doc.point_of_sale || "",
    invoice_number: doc.invoice_number || "",
    issuer_cuit: doc.issuer_cuit || "",
    issuer_name: doc.issuer_name || "",
    period: doc.period || "",
  });

  const set = (key, value) => setFields(prev => ({ ...prev, [key]: value }));

  const confidenceColor = doc.ai_confidence >= 80
    ? "text-emerald-700 bg-emerald-50 border-emerald-200"
    : doc.ai_confidence >= 50
    ? "text-amber-700 bg-amber-50 border-amber-200"
    : "text-rose-700 bg-rose-50 border-rose-200";

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="absolute inset-0 bg-black/30" onClick={onClose} />
      <div className="relative bg-white w-full max-w-lg h-full overflow-y-auto shadow-xl flex flex-col">

        {/* Header */}
        <div className="sticky top-0 bg-white z-10 flex items-center justify-between p-5 border-b border-slate-100">
          <div>
            <h2 className="text-base font-bold text-[#1A1A2E]">Revisión de Documento</h2>
            {isPendingReview && (
              <p className="text-[11px] text-amber-600 font-semibold mt-0.5">⚠ Requiere aprobación del contador</p>
            )}
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600"><X className="w-5 h-5" /></button>
        </div>

        <div className="p-5 space-y-5 flex-1">

          {/* Título y estado */}
          <div className="flex items-start justify-between gap-3">
            <div>
              <h3 className="text-base font-bold text-[#1A1A2E]">{doc.title}</h3>
              <p className="text-[13px] text-slate-500 mt-0.5">{clientName}</p>
            </div>
            <StatusBadge status={doc.status} />
          </div>

          {/* Banner estado pendiente */}
          {isPendingReview && (
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex gap-3">
              <AlertTriangle className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-[13px] font-semibold text-amber-800">Pendiente de revisión manual</p>
                <p className="text-[12px] text-amber-700 mt-0.5">
                  La IA procesó este documento. Verificá los datos extraídos, corregí lo necesario y aprobá o rechazá para finalizar.
                </p>
              </div>
            </div>
          )}

          {/* Resultado IA */}
          {doc.ai_confidence > 0 && (
            <div className={`rounded-xl p-4 border ${confidenceColor}`}>
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-2">
                  <Bot className="w-4 h-4" />
                  <span className="text-[12px] font-semibold">Análisis IA</span>
                </div>
                <span className="text-[12px] font-bold">Confianza: {doc.ai_confidence}%</span>
              </div>
              {doc.ai_confidence < 80 && (
                <p className="text-[11px] mt-1 font-medium">
                  {doc.ai_confidence < 50
                    ? "⚠ Baja confianza — revisión detallada obligatoria"
                    : "⚠ Confianza media — verificá los datos antes de aprobar"}
                </p>
              )}
              {doc.ai_classification && (
                <p className="text-[12px] mt-1 opacity-80">{doc.ai_classification}</p>
              )}
            </div>
          )}

          {/* Ver original */}
          {doc.file_url && (
            <a href={doc.file_url} target="_blank" rel="noopener noreferrer"
              className="flex items-center gap-2 text-[13px] text-[#00C7D9] font-medium hover:underline">
              <ExternalLink className="w-3.5 h-3.5" /> Ver documento original
            </a>
          )}

          {/* Toggle edición */}
          {canReview && !isPendingReview && (
            <button
              onClick={() => setEditMode(e => !e)}
              className="flex items-center gap-1.5 text-[12px] text-slate-500 hover:text-[#00C7D9] transition-colors"
            >
              <Edit3 className="w-3.5 h-3.5" />
              {editMode ? "Cancelar edición" : "Editar datos extraídos"}
            </button>
          )}

          {/* Campos de datos */}
          <div className="space-y-3">
            <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Datos del Comprobante</p>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] font-semibold text-slate-500 uppercase mb-1 block">Tipo</label>
                {editMode ? (
                  <select value={fields.doc_type} onChange={e => set("doc_type", e.target.value)}
                    className="w-full h-9 px-3 rounded-md border border-slate-200 text-[13px] bg-white focus:outline-none focus:ring-2 focus:ring-[#00C7D9]/20">
                    {DOC_TYPES.map(t => <option key={t} value={t}>{docTypeLabels[t]}</option>)}
                  </select>
                ) : (
                  <p className="text-[13px] font-medium text-[#1A1A2E]">{docTypeLabels[fields.doc_type] || "—"}</p>
                )}
              </div>

              <div>
                <label className="text-[11px] font-semibold text-slate-500 uppercase mb-1 block">Categoría</label>
                {editMode ? (
                  <select value={fields.category} onChange={e => set("category", e.target.value)}
                    className="w-full h-9 px-3 rounded-md border border-slate-200 text-[13px] bg-white focus:outline-none focus:ring-2 focus:ring-[#00C7D9]/20">
                    {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                ) : (
                  <p className="text-[13px] font-medium text-[#1A1A2E]">{fields.category || "—"}</p>
                )}
              </div>

              <EditableField label="Fecha" value={fields.date} onChange={v => set("date", v)} editMode={editMode} type="date" />
              <EditableField label="Período" value={fields.period} onChange={v => set("period", v)} editMode={editMode} placeholder="MM/YYYY" />
              <EditableField label="Monto Total" value={fields.amount} onChange={v => set("amount", v)} editMode={editMode} type="number" mono prefix="$" />
              <EditableField label="Monto Neto" value={fields.net_amount} onChange={v => set("net_amount", v)} editMode={editMode} type="number" mono prefix="$" />
              <EditableField label="IVA" value={fields.tax_amount} onChange={v => set("tax_amount", v)} editMode={editMode} type="number" mono prefix="$" />
              <EditableField label="CAE" value={fields.cae_number} onChange={v => set("cae_number", v)} editMode={editMode} mono />
              <EditableField label="Punto de Venta" value={fields.point_of_sale} onChange={v => set("point_of_sale", v)} editMode={editMode} />
              <EditableField label="Nº Comprobante" value={fields.invoice_number} onChange={v => set("invoice_number", v)} editMode={editMode} mono />
              <EditableField label="CUIT Emisor" value={fields.issuer_cuit} onChange={v => set("issuer_cuit", v)} editMode={editMode} mono />
              <EditableField label="Emisor" value={fields.issuer_name} onChange={v => set("issuer_name", v)} editMode={editMode} />
            </div>
          </div>

          {/* Notas del contador */}
          {canReview && (
            <div>
              <label className="text-[11px] font-semibold text-slate-500 uppercase mb-1 block">Notas del Contador</label>
              <textarea
                value={reviewNotes}
                onChange={e => setReviewNotes(e.target.value)}
                placeholder="Observaciones, correcciones o motivo de rechazo..."
                rows={3}
                className="w-full rounded-md border border-slate-200 text-[13px] px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#00C7D9]/20 resize-none"
              />
            </div>
          )}
        </div>

        {/* Botones acción — sticky al fondo */}
        {canReview && (
          <div className="sticky bottom-0 bg-white border-t border-slate-100 p-4 flex gap-2">
            <Button
              onClick={() => onApprove(doc, { ...fields, review_notes: reviewNotes })}
              className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white text-xs"
            >
              <CheckCircle className="w-3.5 h-3.5 mr-1" /> Aprobar y Finalizar
            </Button>
            <Button
              onClick={() => onReject(doc, reviewNotes)}
              variant="outline"
              className="flex-1 text-xs text-rose-600 border-rose-200 hover:bg-rose-50"
            >
              <XCircle className="w-3.5 h-3.5 mr-1" /> Rechazar
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}

function EditableField({ label, value, onChange, editMode, type = "text", mono, prefix, placeholder }) {
  const display = value !== "" && value !== null && value !== undefined
    ? (prefix ? `${prefix}${Number(value).toLocaleString("es-AR")}` : value)
    : "—";

  return (
    <div>
      <label className="text-[11px] font-semibold text-slate-500 uppercase mb-1 block">{label}</label>
      {editMode ? (
        <Input
          type={type}
          value={value}
          onChange={e => onChange(e.target.value)}
          placeholder={placeholder}
          className={`h-9 text-[13px] ${mono ? "font-mono" : ""}`}
        />
      ) : (
        <p className={`text-[13px] font-medium text-[#1A1A2E] ${mono ? "font-mono" : ""}`}>{display}</p>
      )}
    </div>
  );
}