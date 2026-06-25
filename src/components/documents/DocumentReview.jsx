import React from "react";
import { X, CheckCircle, XCircle, ExternalLink, Bot, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import StatusBadge from "@/components/shared/StatusBadge";

const docTypeLabels = {
  factura_a: "Factura A", factura_b: "Factura B", factura_c: "Factura C",
  nota_credito: "Nota de Crédito", nota_debito: "Nota de Débito",
  recibo: "Recibo", ticket: "Ticket", contrato: "Contrato",
  ddjj: "DDJJ", certificado: "Certificado", otro: "Otro",
};

export default function DocumentReview({ document: doc, clientName, onClose, onApprove, onReject }) {
  const canReview = doc.status === "classified" || doc.status === "reviewed";

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="absolute inset-0 bg-black/30" onClick={onClose} />
      <div className="relative bg-white w-full max-w-lg h-full overflow-y-auto shadow-xl">
        <div className="sticky top-0 bg-white z-10 flex items-center justify-between p-5 border-b border-slate-100">
          <h2 className="text-base font-bold text-[#1A1A2E]">Revisión de Documento</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600"><X className="w-5 h-5" /></button>
        </div>

        <div className="p-5 space-y-5">
          <div className="flex items-start justify-between">
            <div>
              <h3 className="text-base font-bold text-[#1A1A2E]">{doc.title}</h3>
              <p className="text-[13px] text-slate-500 mt-0.5">{clientName}</p>
            </div>
            <StatusBadge status={doc.status} />
          </div>

          {doc.file_url && (
            <a href={doc.file_url} target="_blank" rel="noopener noreferrer"
              className="flex items-center gap-2 text-[13px] text-[#00C7D9] font-medium hover:underline">
              <ExternalLink className="w-3.5 h-3.5" /> Ver documento original
            </a>
          )}

          {doc.ai_confidence > 0 && (
            <div className="bg-[#E0F7FA] rounded-xl p-4">
              <div className="flex items-center gap-2 mb-2">
                <Bot className="w-4 h-4 text-[#00A8BD]" />
                <span className="text-[12px] font-semibold text-[#00A8BD]">Análisis de IA — Confianza: {doc.ai_confidence}%</span>
              </div>
              {doc.ai_classification && (
                <p className="text-[12px] text-slate-600">{doc.ai_classification}</p>
              )}
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <DataField label="Tipo de Comprobante" value={docTypeLabels[doc.doc_type] || doc.doc_type} />
            <DataField label="Fecha" value={doc.date} />
            <DataField label="Monto Total" value={doc.amount ? `$${doc.amount.toLocaleString("es-AR")}` : null} mono />
            <DataField label="Monto Neto" value={doc.net_amount ? `$${doc.net_amount.toLocaleString("es-AR")}` : null} mono />
            <DataField label="IVA" value={doc.tax_amount ? `$${doc.tax_amount.toLocaleString("es-AR")}` : null} mono />
            <DataField label="CAE" value={doc.cae_number} mono />
            <DataField label="Punto de Venta" value={doc.point_of_sale} />
            <DataField label="Nº Comprobante" value={doc.invoice_number} mono />
            <DataField label="CUIT Emisor" value={doc.issuer_cuit} mono />
            <DataField label="Emisor" value={doc.issuer_name} />
            <DataField label="Categoría" value={doc.category} />
            <DataField label="Período" value={doc.period} />
          </div>

          {canReview && (
            <div className="flex gap-2 pt-2">
              <Button onClick={() => onApprove(doc)} className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white text-xs">
                <CheckCircle className="w-3.5 h-3.5 mr-1" /> Aprobar
              </Button>
              <Button onClick={() => onReject(doc)} variant="outline" className="flex-1 text-xs text-rose-600 border-rose-200 hover:bg-rose-50">
                <XCircle className="w-3.5 h-3.5 mr-1" /> Rechazar
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function DataField({ label, value, mono }) {
  return (
    <div>
      <p className="text-[11px] font-semibold text-slate-500 uppercase">{label}</p>
      <p className={`text-[13px] font-medium text-[#1A1A2E] ${mono ? "font-mono" : ""}`}>{value || "—"}</p>
    </div>
  );
}