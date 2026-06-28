import React, { useState, useEffect } from "react";
import PermissionGuard from "@/components/shared/PermissionGuard";
import { usePermissions } from "@/hooks/usePermissions";
import { useCompanyData } from "@/hooks/useCompanyData";
import { useCompany } from "@/lib/CompanyContext";
import { base44 } from "@/api/base44Client";
import { logAction } from "@/lib/audit";
import { Upload, CheckCircle, AlertTriangle, Search, Filter, Download, Bot } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import PageHeader from "@/components/shared/PageHeader";
import StatusBadge from "@/components/shared/StatusBadge";
import EmptyState from "@/components/shared/EmptyState";

export default function BankReconciliation() {
  const { canViewModule, can } = usePermissions();
  const { activeCompany } = useCompany();
  const { data: transactions, loading, reload: reloadTransactions } = useCompanyData("TreasuryTransaction", {}, "-date", 500);
  const { data: entries } = useCompanyData("AccountEntry");
  const { data: clients } = useCompanyData("Client");
  const { data: documents } = useCompanyData("Document");
  const [selectedClient, setSelectedClient] = useState("");
  const [showImport, setShowImport] = useState(false);
  const [reconciling, setReconciling] = useState(false);
  const [matches, setMatches] = useState([]);
  const [unmatched, setUnmatched] = useState([]);
  const [filter, setFilter] = useState("all"); // all | matched | unmatched

  const load = () => reloadTransactions();

  const runAIReconciliation = async () => {
    if (!selectedClient) return;
    setReconciling(true);
    try {
      const clientTransactions = transactions.filter(t => t.client_id === selectedClient && !t.reconciled);
      const clientEntries = entries.filter(e => e.client_id === selectedClient && e.status === "posted");
      const clientDocs = documents.filter(d => d.client_id === selectedClient && d.status === "approved");

      const result = await base44.integrations.Core.InvokeLLM({
        prompt: `Sos un contador argentino experto en conciliación bancaria. Analizá estos movimientos bancarios y confrontalos con comprobantes registrados.

MOVIMIENTOS BANCARIOS (extracto bancario):
${JSON.stringify(clientTransactions.map(t => ({
  fecha: t.date,
  tipo: t.type,
  descripcion: t.description,
  monto: t.amount,
  categoria: t.category,
  referencia: t.reference
})), null, 2)}

COMPROBANTES REGISTRADOS:
${JSON.stringify(clientDocs.map(d => ({
  fecha: d.date,
  tipo: d.doc_type,
  monto: d.amount,
  emisor: d.issuer_name,
  numero: d.invoice_number
})), null, 2)}

ASIENTOS CONTABLES:
${JSON.stringify(clientEntries.slice(0, 50).map(e => ({
  fecha: e.date,
  descripcion: e.description,
  monto: e.amount,
  tipo: e.entry_type
})), null, 2)}

IDENTIFICÁ:
1. MOVIMIENTOS CONCILIADOS: movimientos bancarios que coinciden con comprobantes/asientos (misma fecha ±3 días, mismo monto ±1%, misma descripción)
2. MOVIMIENTOS NO CONCILIADOS: movimientos sin comprobante asociado (posibles cobros/pagos no registrados)
3. DIFERENCIAS: discrepancias entre monto bancario y monto contable

Respondé en JSON con:
{
  "matches": [{bank_transaction_id, document_id, confidence, explanation}],
  "unmatched": [{bank_transaction_id, reason, suggested_action}],
  "discrepancies": [{bank_transaction_id, document_id, bank_amount, book_amount, difference}]
}`,
        response_json_schema: {
          type: "object",
          properties: {
            matches: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  bank_transaction_id: { type: "string" },
                  document_id: { type: "string" },
                  confidence: { type: "number" },
                  explanation: { type: "string" }
                }
              }
            },
            unmatched: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  bank_transaction_id: { type: "string" },
                  reason: { type: "string" },
                  suggested_action: { type: "string" }
                }
              }
            },
            discrepancies: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  bank_transaction_id: { type: "string" },
                  document_id: { type: "string" },
                  bank_amount: { type: "number" },
                  book_amount: { type: "number" },
                  difference: { type: "number" }
                }
              }
            }
          }
        }
      });

      setMatches(result.matches || []);
      setUnmatched(result.unmatched || []);

      // Marcar como conciliados los matches con alta confianza
      const highConfidenceMatches = (result.matches || []).filter(m => m.confidence > 0.8);
      for (const match of highConfidenceMatches) {
        await base44.entities.TreasuryTransaction.update(match.bank_transaction_id, { reconciled: true });
      }

      if (highConfidenceMatches.length > 0) {
        logAction("ai_run", `IA concilió ${highConfidenceMatches.length} movimientos bancarios`, {
          entityType: "TreasuryTransaction",
          clientId: selectedClient,
          newData: { reconciled_count: highConfidenceMatches.length }
        });
      }

      load();
    } catch (e) {
      console.error(e);
    } finally {
      setReconciling(false);
    }
  };

  const handleImportExtract = async (file) => {
    try {
      const text = await file.text();
      const lines = text.split('\n').filter(l => l.trim());
      
      // Parseo básico de CSV (fecha, descripción, monto)
      const parsed = lines.slice(1).map(line => {
        const [fecha, descripcion, monto] = line.split(',');
        return {
          date: fecha?.trim(),
          description: descripcion?.trim(),
          amount: parseFloat(monto?.replace('$', '').replace(',', '.')) || 0,
          type: monto?.includes('-') || monto?.includes('(') ? 'egreso' : 'ingreso',
          client_id: selectedClient,
          company_id: activeCompany?.id,
          category: 'otro',
          reconciled: false,
        };
      }).filter(t => t.date && t.amount !== 0);

      if (parsed.length > 0) {
        await base44.entities.TreasuryTransaction.bulkCreate(parsed);
        logAction("create", `Importó ${parsed.length} movimientos bancarios`, {
          entityType: "TreasuryTransaction",
          clientId: selectedClient,
          newData: { count: parsed.length }
        });
        load();
        setShowImport(false);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const filteredTransactions = transactions.filter(t => {
    if (selectedClient && t.client_id !== selectedClient) return false;
    if (filter === "matched") return t.reconciled;
    if (filter === "unmatched") return !t.reconciled;
    return true;
  });

  const stats = {
    total: filteredTransactions.length,
    reconciled: filteredTransactions.filter(t => t.reconciled).length,
    pending: filteredTransactions.filter(t => !t.reconciled).length,
    totalAmount: filteredTransactions.reduce((s, t) => s + (t.amount || 0), 0),
  };

  if (!canViewModule("treasury")) return <PermissionGuard module="treasury" />;

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-8 h-8 border-4 border-slate-200 border-t-[#00C7D9] rounded-full animate-spin" />
    </div>
  );

  return (
    <div>
      <PageHeader title="Conciliación Bancaria" subtitle="Confrontá extractos bancarios con comprobantes">
        <div className="flex gap-2">
          <Button onClick={() => setShowImport(true)} variant="outline" className="text-xs">
            <Upload className="w-3.5 h-3.5 mr-1" /> Importar Extracto
          </Button>
          <Button onClick={runAIReconciliation} disabled={!selectedClient || reconciling} className="bg-[#00C7D9] hover:bg-[#00A8BD] text-white text-xs">
            {reconciling ? <Bot className="w-3.5 h-3.5 mr-1 animate-spin" /> : <Bot className="w-3.5 h-3.5 mr-1" />}
            Conciliar con IA
          </Button>
        </div>
      </PageHeader>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
        <StatCard label="Total Movimientos" value={stats.total} sub={`${stats.reconciled} conciliados`} />
        <StatCard label="Pendientes" value={stats.pending} sub="por conciliar" color="amber" />
        <StatCard label="Conciliados" value={stats.reconciled} sub={`${stats.total > 0 ? Math.round((stats.reconciled / stats.total) * 100) : 0}% completado`} color="emerald" />
        <StatCard label="Monto Total" value={`$${stats.totalAmount.toLocaleString("es-AR")}`} sub="acumulado" />
      </div>

      <div className="bg-white rounded-xl p-4 shadow-sm border border-slate-100 mb-4">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <Label className="text-[11px] font-medium text-slate-500 uppercase">Cliente</Label>
            <select value={selectedClient} onChange={e => setSelectedClient(e.target.value)}
              className="mt-1 w-full h-9 px-3 rounded-lg border border-slate-200 text-[13px] bg-white">
              <option value="">Todos los clientes</option>
              {clients.map(c => <option key={c.id} value={c.id}>{c.business_name}</option>)}
            </select>
          </div>
          <div>
            <Label className="text-[11px] font-medium text-slate-500 uppercase">Filtrar</Label>
            <select value={filter} onChange={e => setFilter(e.target.value)}
              className="mt-1 w-full h-9 px-3 rounded-lg border border-slate-200 text-[13px] bg-white">
              <option value="all">Todos</option>
              <option value="matched">Conciliados</option>
              <option value="unmatched">No Conciliados</option>
            </select>
          </div>
        </div>
      </div>

      {matches.length > 0 && (
        <div className="bg-emerald-50 rounded-xl p-4 border border-emerald-200 mb-4">
          <h3 className="text-[13px] font-bold text-emerald-800 mb-2 flex items-center gap-2">
            <CheckCircle className="w-4 h-4" />
            Conciliaciones Sugeridas por IA ({matches.length})
          </h3>
          <div className="space-y-2">
            {matches.slice(0, 5).map((match, i) => {
              const trans = transactions.find(t => t.id === match.bank_transaction_id);
              const doc = documents.find(d => d.id === match.document_id);
              return (
                <div key={i} className="bg-white rounded-lg p-3 border border-emerald-100">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-[12px] font-medium text-[#1A1A2E]">
                        {trans?.description} → {doc?.doc_type || "Asiento"}
                      </p>
                      <p className="text-[11px] text-slate-500">
                        ${trans?.amount?.toLocaleString("es-AR")} | {match.explanation}
                      </p>
                    </div>
                    <StatusBadge status={match.confidence > 0.9 ? "approved" : "review"} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {unmatched.length > 0 && (
        <div className="bg-amber-50 rounded-xl p-4 border border-amber-200 mb-4">
          <h3 className="text-[13px] font-bold text-amber-800 mb-2 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4" />
            Movimientos Sin Conciliar ({unmatched.length})
          </h3>
          <div className="space-y-2">
            {unmatched.slice(0, 5).map((item, i) => {
              const trans = transactions.find(t => t.id === item.bank_transaction_id);
              return (
                <div key={i} className="bg-white rounded-lg p-3 border border-amber-100">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-[12px] font-medium text-[#1A1A2E]">{trans?.description}</p>
                      <p className="text-[11px] text-slate-500">
                        ${trans?.amount?.toLocaleString("es-AR")} | {item.reason}
                      </p>
                    </div>
                    <span className="text-[10px] text-amber-700 bg-amber-100 px-2 py-0.5 rounded-full">
                      {item.suggested_action}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-slate-100">
              <th className="text-left px-4 py-3 text-[11px] font-semibold text-slate-500 uppercase">Fecha</th>
              <th className="text-left px-4 py-3 text-[11px] font-semibold text-slate-500 uppercase">Descripción</th>
              <th className="text-left px-4 py-3 text-[11px] font-semibold text-slate-500 uppercase hidden md:table-cell">Categoría</th>
              <th className="text-right px-4 py-3 text-[11px] font-semibold text-slate-500 uppercase">Monto</th>
              <th className="text-left px-4 py-3 text-[11px] font-semibold text-slate-500 uppercase">Estado</th>
              <th className="text-left px-4 py-3 text-[11px] font-semibold text-slate-500 uppercase">Acción</th>
            </tr>
          </thead>
          <tbody>
            {filteredTransactions.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-12">
                  <EmptyState icon={Upload} title="Sin movimientos" description="Importá un extracto bancario o creá movimientos manualmente." />
                </td>
              </tr>
            ) : (
              filteredTransactions.map(t => (
                <tr key={t.id} className="border-b border-slate-50 hover:bg-slate-50 transition-colors">
                  <td className="px-4 py-3 text-[13px] text-slate-600">{t.date}</td>
                  <td className="px-4 py-3">
                    <p className="text-[13px] font-medium text-[#1A1A2E]">{t.description}</p>
                    {t.reference && <p className="text-[11px] text-slate-400 font-mono">{t.reference}</p>}
                  </td>
                  <td className="px-4 py-3 text-[13px] text-slate-600 hidden md:table-cell">
                    <StatusBadge status={t.category || "otro"} />
                  </td>
                  <td className={`px-4 py-3 text-right text-[13px] font-mono font-bold ${t.type === 'ingreso' ? 'text-emerald-600' : 'text-rose-600'}`}>
                    {t.type === 'ingreso' ? '+' : '-'}${(t.amount || 0).toLocaleString("es-AR")}
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge status={t.reconciled ? "approved" : "pending"} />
                  </td>
                  <td className="px-4 py-3">
                    {!t.reconciled && (
                      <Button
                        size="sm"
                        onClick={async () => {
                          await base44.entities.TreasuryTransaction.update(t.id, { reconciled: true });
                          logAction("approve", `Concilió movimiento bancario: ${t.description}`, {
                            entityType: "TreasuryTransaction",
                            entityId: t.id,
                            clientId: t.client_id
                          });
                          load();
                        }}
                        className="bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] h-7 px-2"
                      >
                        <CheckCircle className="w-3 h-3 mr-1" /> Conciliar
                      </Button>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {showImport && (
        <ImportModal
          onClose={() => setShowImport(false)}
          onImport={handleImportExtract}
          hasClient={!!selectedClient}
        />
      )}
    </div>
  );
}

function StatCard({ label, value, sub, color = "slate" }) {
  const colors = {
    slate: "bg-slate-50 text-slate-700",
    emerald: "bg-emerald-50 text-emerald-700",
    amber: "bg-amber-50 text-amber-700",
  };
  return (
    <div className={`rounded-xl p-4 ${colors[color] || colors.slate}`}>
      <p className="text-2xl font-bold">{value}</p>
      <p className="text-[11px] font-medium uppercase mt-1">{label}</p>
      <p className="text-[10px] opacity-70 mt-0.5">{sub}</p>
    </div>
  );
}

function ImportModal({ onClose, onImport, hasClient }) {
  const [file, setFile] = useState(null);
  const [importing, setImporting] = useState(false);

  const handleFileChange = (e) => {
    const selected = e.target.files?.[0];
    if (selected) setFile(selected);
  };

  const handleUpload = async () => {
    if (!file || !hasClient) return;
    setImporting(true);
    await onImport(file);
    setImporting(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-md m-4 p-5">
        <h2 className="text-base font-bold text-[#1A1A2E] mb-4">Importar Extracto Bancario</h2>
        
        {!hasClient ? (
          <div className="text-center py-6">
            <AlertTriangle className="w-8 h-8 text-amber-500 mx-auto mb-2" />
            <p className="text-[13px] text-slate-600">Seleccioná un cliente primero</p>
          </div>
        ) : (
          <>
            <div className="border-2 border-dashed border-slate-200 rounded-xl p-6 text-center mb-4">
              <Upload className="w-8 h-8 text-slate-400 mx-auto mb-2" />
              <p className="text-[12px] text-slate-500 mb-2">Arrastrá un archivo CSV o Excel</p>
              <input type="file" accept=".csv,.xlsx,.xls" onChange={handleFileChange} className="text-xs" />
              {file && <p className="text-[11px] text-emerald-600 mt-2">✓ {file.name}</p>}
            </div>

            <div className="bg-slate-50 rounded-lg p-3 mb-4">
              <p className="text-[11px] font-medium text-slate-600 mb-1">Formato esperado:</p>
              <p className="text-[10px] text-slate-500 font-mono">Fecha,Descripción,Monto</p>
              <p className="text-[10px] text-slate-400 mt-1">Ej: 2026-06-28,Pago Cliente XYZ,15000.00</p>
            </div>

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={onClose} className="text-xs">Cancelar</Button>
              <Button onClick={handleUpload} disabled={!file || importing} className="bg-[#00C7D9] hover:bg-[#00A8BD] text-white text-xs">
                {importing ? "Importando..." : "Importar"}
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}