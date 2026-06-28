import React, { useState, useEffect } from "react";
import PermissionGuard from "@/components/shared/PermissionGuard";
import { usePermissions } from "@/hooks/usePermissions";
import { useCompanyData } from "@/hooks/useCompanyData";
import { useCompany } from "@/lib/CompanyContext";
import { base44 } from "@/api/base44Client";
import { logAction } from "@/lib/audit";
import { Search, Upload, FileText, Bot, CheckCircle, XCircle, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import PageHeader from "@/components/shared/PageHeader";
import StatusBadge from "@/components/shared/StatusBadge";
import EmptyState from "@/components/shared/EmptyState";
import DocumentUpload from "@/components/documents/DocumentUpload";
import DocumentReview from "@/components/documents/DocumentReview";

const docTypeLabels = {
  factura_a: "Factura A", factura_b: "Factura B", factura_c: "Factura C",
  nota_credito: "Nota de Crédito", nota_debito: "Nota de Débito",
  recibo: "Recibo", ticket: "Ticket", contrato: "Contrato",
  ddjj: "DDJJ", certificado: "Certificado", otro: "Otro",
};

export default function Documents() {
  const { canViewModule } = usePermissions();
  const { activeCompany } = useCompany();
  const { data: documents, loading, reload: reloadDocs } = useCompanyData("Document");
  const { data: clients, reload: reloadClients } = useCompanyData("Client");
  const load = () => { reloadDocs(); reloadClients(); };
  const [search, setSearch] = useState("");
  const [showUpload, setShowUpload] = useState(false);
  const [selectedDoc, setSelectedDoc] = useState(null);
  const [statusFilter, setStatusFilter] = useState("");

  const getClientName = (id) => clients.find(c => c.id === id)?.business_name || "—";

  const filtered = documents.filter(d => {
    const matchSearch = !search || d.title?.toLowerCase().includes(search.toLowerCase()) || d.issuer_name?.toLowerCase().includes(search.toLowerCase());
    const matchStatus = !statusFilter || d.status === statusFilter ||
      (statusFilter === "processing" && d.status === "classified"); // backward compat
    return matchSearch && matchStatus;
  });

  const handleApprove = async (doc, correctedFields = {}) => {
    await base44.entities.Document.update(doc.id, {
      status: "approved",
      ...correctedFields,
    });
    logAction("approve", `Aprobó documento: ${doc.title}`, { entityType: "Document", entityId: doc.id, clientId: doc.client_id, oldData: { status: doc.status }, newData: { status: "approved" }, module: "Expediente Digital" });
    load();
    setSelectedDoc(null);
  };

  const handleReject = async (doc, notes) => {
    await base44.entities.Document.update(doc.id, { status: "rejected", review_notes: notes || "" });
    logAction("reject", `Rechazó documento: ${doc.title}`, { entityType: "Document", entityId: doc.id, clientId: doc.client_id, oldData: { status: doc.status }, newData: { status: "rejected" }, module: "Expediente Digital" });
    load();
    setSelectedDoc(null);
  };

  if (!canViewModule("documents")) return <PermissionGuard module="documents" />;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-white/10 border-t-[#00C7D9] rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div>
      <PageHeader title="Expediente Digital" subtitle={`${documents.length} documentos`}>
        <Button onClick={() => setShowUpload(true)} className="bg-[#00C7D9] hover:bg-[#00A8BD] text-white text-xs">
          <Upload className="w-3.5 h-3.5 mr-1" /> Cargar Documento
        </Button>
      </PageHeader>

      {/* Banner pendientes de revisión */}
      {documents.filter(d => d.status === "pending_review").length > 0 && (
        <div
          onClick={() => setStatusFilter("pending_review")}
          className="mb-4 flex items-center gap-3 bg-amber-50 border border-amber-300 rounded-xl px-4 py-3 cursor-pointer hover:bg-amber-100 transition-colors"
        >
          <Clock className="w-5 h-5 text-amber-500 flex-shrink-0" />
          <div className="flex-1">
            <p className="text-[13px] font-bold text-amber-800">
              {documents.filter(d => d.status === "pending_review").length} documento(s) esperando aprobación del contador
            </p>
            <p className="text-[11px] text-amber-600">La IA los procesó. Revisá y aprobá antes de usarlos en DDJJ.</p>
          </div>
          <span className="text-[12px] font-semibold text-amber-700 bg-amber-200 rounded-full px-3 py-1">
            Revisar →
          </span>
        </div>
      )}

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
      {[
        { label: "Pendiente Revisión", status: "pending_review", count: documents.filter(d => d.status === "pending_review").length },
        { label: "Procesando IA", status: "processing", count: documents.filter(d => d.status === "processing").length },
        { label: "Aprobados", status: "approved", count: documents.filter(d => d.status === "approved").length },
        { label: "Rechazados", status: "rejected", count: documents.filter(d => d.status === "rejected").length },
      ].map(s => (
        <button
          key={s.status}
          onClick={() => setStatusFilter(statusFilter === s.status ? "" : s.status)}
          className={`p-3 rounded-xl text-left transition-all ${statusFilter === s.status ? "bg-[#00C7D9]/10 border-[#00C7D9] border-2" : s.status === "pending_review" && s.count > 0 ? "bg-amber-500/10 border border-amber-500/30" : "bg-[#1A1A2E] border border-white/10 hover:border-white/20"}`}
        >
          <p className="text-lg font-bold text-white">{s.count}</p>
          <p className="text-[11px] text-slate-400">{s.label}</p>
        </button>
      ))}
      </div>

      <div className="flex gap-3 mb-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input placeholder="Buscar documentos..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9 text-[13px] h-9" />
        </div>
      </div>

      {filtered.length === 0 ? (
        <EmptyState icon={FileText} title="Sin documentos" description="Cargá documentos para que la IA los procese automáticamente.">
          <Button onClick={() => setShowUpload(true)} className="bg-[#00C7D9] hover:bg-[#00A8BD] text-white text-xs">
            <Upload className="w-3.5 h-3.5 mr-1" /> Cargar Documento
          </Button>
        </EmptyState>
      ) : (
        <div className="bg-[#1A1A2E] rounded-xl shadow-sm border border-white/10 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/10">
                  <th className="text-left px-4 py-3 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Documento</th>
                  <th className="text-left px-4 py-3 text-[11px] font-semibold text-slate-400 uppercase tracking-wider hidden sm:table-cell">Cliente</th>
                  <th className="text-left px-4 py-3 text-[11px] font-semibold text-slate-400 uppercase tracking-wider hidden md:table-cell">Tipo</th>
                  <th className="text-left px-4 py-3 text-[11px] font-semibold text-slate-400 uppercase tracking-wider hidden lg:table-cell">Monto</th>
                  <th className="text-left px-4 py-3 text-[11px] font-semibold text-slate-400 uppercase tracking-wider hidden lg:table-cell">IA</th>
                  <th className="text-left px-4 py-3 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Estado</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(doc => (
                  <tr key={doc.id} onClick={() => setSelectedDoc(doc)} className="border-b border-white/5 hover:bg-white/5 cursor-pointer transition-colors">
                    <td className="px-4 py-3">
                      <p className="text-[13px] font-medium text-white">{doc.title}</p>
                      <p className="text-[11px] text-slate-400">{doc.date || "Sin fecha"}</p>
                    </td>
                    <td className="px-4 py-3 text-[13px] text-slate-300 hidden sm:table-cell">{getClientName(doc.client_id)}</td>
                    <td className="px-4 py-3 text-[13px] text-slate-300 hidden md:table-cell">{docTypeLabels[doc.doc_type] || doc.doc_type || "—"}</td>
                    <td className="px-4 py-3 text-[13px] font-medium text-white hidden lg:table-cell font-mono">
                      {doc.amount ? `$${doc.amount.toLocaleString("es-AR")}` : "—"}
                    </td>
                    <td className="px-4 py-3 hidden lg:table-cell">
                      {doc.ai_confidence ? (
                        <div className="flex items-center gap-1">
                          <Bot className="w-3.5 h-3.5 text-[#00C7D9]" />
                          <span className="text-[11px] font-medium text-[#00A8BD]">{doc.ai_confidence}%</span>
                        </div>
                      ) : (
                        <span className="text-[11px] text-slate-400">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3"><StatusBadge status={doc.status} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {showUpload && (
        <DocumentUpload
          clients={clients}
          onClose={() => setShowUpload(false)}
          onComplete={() => { setShowUpload(false); load(); }}
        />
      )}

      {selectedDoc && (
        <DocumentReview
          document={selectedDoc}
          clientName={getClientName(selectedDoc.client_id)}
          onClose={() => setSelectedDoc(null)}
          onApprove={handleApprove}
          onReject={handleReject}
        />
      )}
    </div>
  );
}