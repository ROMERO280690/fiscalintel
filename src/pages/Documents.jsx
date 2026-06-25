import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Plus, Search, Upload, FileText, Bot, CheckCircle, XCircle } from "lucide-react";
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
  const [documents, setDocuments] = useState([]);
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [showUpload, setShowUpload] = useState(false);
  const [selectedDoc, setSelectedDoc] = useState(null);
  const [statusFilter, setStatusFilter] = useState("");

  const load = async () => {
    try {
      const [docs, cls] = await Promise.all([
        base44.entities.Document.list("-created_date", 200),
        base44.entities.Client.list("-created_date", 200),
      ]);
      setDocuments(docs);
      setClients(cls);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const getClientName = (id) => clients.find(c => c.id === id)?.business_name || "—";

  const filtered = documents.filter(d => {
    const matchSearch = !search || d.title?.toLowerCase().includes(search.toLowerCase()) || d.issuer_name?.toLowerCase().includes(search.toLowerCase());
    const matchStatus = !statusFilter || d.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const handleApprove = async (doc) => {
    await base44.entities.Document.update(doc.id, { status: "approved" });
    load();
    setSelectedDoc(null);
  };

  const handleReject = async (doc) => {
    await base44.entities.Document.update(doc.id, { status: "rejected" });
    load();
    setSelectedDoc(null);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-slate-200 border-t-[#00C7D9] rounded-full animate-spin" />
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

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
        {[
          { label: "Cargados", status: "uploaded", count: documents.filter(d => d.status === "uploaded").length },
          { label: "Procesando IA", status: "processing", count: documents.filter(d => d.status === "processing" || d.status === "classified").length },
          { label: "Aprobados", status: "approved", count: documents.filter(d => d.status === "approved").length },
          { label: "Rechazados", status: "rejected", count: documents.filter(d => d.status === "rejected").length },
        ].map(s => (
          <button
            key={s.status}
            onClick={() => setStatusFilter(statusFilter === s.status ? "" : s.status)}
            className={`p-3 rounded-xl text-left transition-all ${statusFilter === s.status ? "bg-[#00C7D9]/10 border-[#00C7D9] border-2" : "bg-white border border-slate-100 hover:border-slate-200"}`}
          >
            <p className="text-lg font-bold text-[#1A1A2E]">{s.count}</p>
            <p className="text-[11px] text-slate-500">{s.label}</p>
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
        <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-100">
                  <th className="text-left px-4 py-3 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Documento</th>
                  <th className="text-left px-4 py-3 text-[11px] font-semibold text-slate-500 uppercase tracking-wider hidden sm:table-cell">Cliente</th>
                  <th className="text-left px-4 py-3 text-[11px] font-semibold text-slate-500 uppercase tracking-wider hidden md:table-cell">Tipo</th>
                  <th className="text-left px-4 py-3 text-[11px] font-semibold text-slate-500 uppercase tracking-wider hidden lg:table-cell">Monto</th>
                  <th className="text-left px-4 py-3 text-[11px] font-semibold text-slate-500 uppercase tracking-wider hidden lg:table-cell">IA</th>
                  <th className="text-left px-4 py-3 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Estado</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(doc => (
                  <tr key={doc.id} onClick={() => setSelectedDoc(doc)} className="border-b border-slate-50 hover:bg-[#E0F7FA]/30 cursor-pointer transition-colors">
                    <td className="px-4 py-3">
                      <p className="text-[13px] font-medium text-[#1A1A2E]">{doc.title}</p>
                      <p className="text-[11px] text-slate-400">{doc.date || "Sin fecha"}</p>
                    </td>
                    <td className="px-4 py-3 text-[13px] text-slate-600 hidden sm:table-cell">{getClientName(doc.client_id)}</td>
                    <td className="px-4 py-3 text-[13px] text-slate-600 hidden md:table-cell">{docTypeLabels[doc.doc_type] || doc.doc_type || "—"}</td>
                    <td className="px-4 py-3 text-[13px] font-medium text-[#1A1A2E] hidden lg:table-cell font-mono">
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