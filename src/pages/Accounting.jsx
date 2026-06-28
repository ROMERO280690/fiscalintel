import React, { useState, useEffect } from "react";
import PermissionGuard from "@/components/shared/PermissionGuard";
import { usePermissions } from "@/hooks/usePermissions";
import { useCompanyData } from "@/hooks/useCompanyData";
import { useCompany } from "@/lib/CompanyContext";
import { base44 } from "@/api/base44Client";
import { logAction } from "@/lib/audit";
import { Plus, BookOpen, Bot, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import PageHeader from "@/components/shared/PageHeader";
import StatusBadge from "@/components/shared/StatusBadge";
import EmptyState from "@/components/shared/EmptyState";

const tabs = ["Diario", "Mayor", "Resumen"];

const entryTypeLabels = {
  compra: "Compra", venta: "Venta", pago: "Pago", cobro: "Cobro",
  ajuste: "Ajuste", apertura: "Apertura", cierre: "Cierre",
  sueldo: "Sueldo", impuesto: "Impuesto", otro: "Otro"
};

export default function Accounting() {
  const { canViewModule, can } = usePermissions();
  const { activeCompany } = useCompany();
  const { data: entries, loading, reload: reloadEntries } = useCompanyData("AccountEntry", {}, "-date", 300);
  const { data: clients, reload: reloadClients } = useCompanyData("Client");
  const load = () => { reloadEntries(); reloadClients(); };
  const [activeTab, setActiveTab] = useState("Diario");
  const [showForm, setShowForm] = useState(false);
  const [selectedClient, setSelectedClient] = useState("");
  const [generating, setGenerating] = useState(false);

  const filteredEntries = selectedClient ? entries.filter(e => e.client_id === selectedClient) : entries;

  const generateFromDocs = async () => {
    if (!selectedClient) return;
    setGenerating(true);
    try {
      const docs = await base44.entities.Document.filter({ client_id: selectedClient, status: "approved" });
      const client = clients.find(c => c.id === selectedClient);

      const result = await base44.integrations.Core.InvokeLLM({
        prompt: `Sos un contador argentino. Generá asientos contables para los siguientes comprobantes aprobados del cliente ${client?.business_name}.
Documentos: ${JSON.stringify(docs.slice(0, 10).map(d => ({ tipo: d.doc_type, monto: d.amount, iva: d.tax_amount, emisor: d.issuer_name, fecha: d.date })))}

Generá los asientos en formato estándar argentino. Usá cuentas del plan de cuentas típico (Caja, Bancos, Proveedores, Clientes, IVA Crédito Fiscal, IVA Débito Fiscal, Compras, Ventas, etc.).
Respondé con un array de asientos.`,
        response_json_schema: {
          type: "object",
          properties: {
            entries: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  date: { type: "string" },
                  description: { type: "string" },
                  account_debit: { type: "string" },
                  account_credit: { type: "string" },
                  amount: { type: "number" },
                  entry_type: { type: "string" }
                }
              }
            }
          }
        }
      });

      if (result.entries?.length) {
        await base44.entities.AccountEntry.bulkCreate(
          result.entries.map(e => ({
            ...e,
            client_id: selectedClient,
            company_id: activeCompany?.id,
            status: "draft",
            ai_suggested: true,
            period: new Date().toLocaleDateString("es-AR", { month: "2-digit", year: "numeric" })
          }))
        );
        load();
      }
    } catch (e) { console.error(e); }
    finally { setGenerating(false); }
  };

  // Group entries by account for Mayor
  const mayorData = {};
  filteredEntries.filter(e => e.status === "posted").forEach(e => {
    if (!mayorData[e.account_debit]) mayorData[e.account_debit] = { debits: 0, credits: 0 };
    if (!mayorData[e.account_credit]) mayorData[e.account_credit] = { debits: 0, credits: 0 };
    mayorData[e.account_debit].debits += e.amount || 0;
    mayorData[e.account_credit].credits += e.amount || 0;
  });

  if (!canViewModule("accounting")) return <PermissionGuard module="accounting" />;

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-8 h-8 border-4 border-slate-200 border-t-[#00C7D9] rounded-full animate-spin" />
    </div>
  );

  return (
    <div>
      <PageHeader title="Contabilidad" subtitle="Diario, Mayor y Balances con IA">
        <div className="flex gap-2">
          {selectedClient && (
            <Button onClick={generateFromDocs} disabled={generating} variant="outline" className="text-xs">
              {generating ? <Loader2 className="w-3.5 h-3.5 mr-1 animate-spin" /> : <Bot className="w-3.5 h-3.5 mr-1" />}
              IA: Generar Asientos
            </Button>
          )}
          <Button onClick={() => setShowForm(true)} className="bg-[#00C7D9] hover:bg-[#00A8BD] text-white text-xs">
            <Plus className="w-3.5 h-3.5 mr-1" /> Nuevo Asiento
          </Button>
        </div>
      </PageHeader>

      <div className="flex items-center gap-3 mb-4">
        <select value={selectedClient} onChange={e => setSelectedClient(e.target.value)}
          className="h-9 px-3 rounded-lg border border-slate-200 text-[13px] bg-white focus:outline-none focus:ring-2 focus:ring-[#00C7D9]/20">
          <option value="">Todos los clientes</option>
          {clients.map(c => <option key={c.id} value={c.id}>{c.business_name}</option>)}
        </select>
        <div className="flex gap-1">
          {tabs.map(t => (
            <button key={t} onClick={() => setActiveTab(t)}
              className={`px-3 py-1.5 rounded-lg text-[12px] font-medium transition-colors ${activeTab === t ? "bg-[#00C7D9] text-white" : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50"}`}>
              {t}
            </button>
          ))}
        </div>
      </div>

      {activeTab === "Diario" && (
        filteredEntries.length === 0
          ? <EmptyState icon={BookOpen} title="Sin asientos" description="Creá asientos manualmente o generá con IA desde documentos aprobados." />
          : <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
              <table className="w-full">
                <thead><tr className="border-b border-slate-100">
                  <th className="text-left px-4 py-3 text-[11px] font-semibold text-slate-500 uppercase">Fecha</th>
                  <th className="text-left px-4 py-3 text-[11px] font-semibold text-slate-500 uppercase">Descripción</th>
                  <th className="text-left px-4 py-3 text-[11px] font-semibold text-slate-500 uppercase hidden md:table-cell">Debe</th>
                  <th className="text-left px-4 py-3 text-[11px] font-semibold text-slate-500 uppercase hidden md:table-cell">Haber</th>
                  <th className="text-right px-4 py-3 text-[11px] font-semibold text-slate-500 uppercase">Monto</th>
                  <th className="text-left px-4 py-3 text-[11px] font-semibold text-slate-500 uppercase">Estado</th>
                </tr></thead>
                <tbody>
                  {filteredEntries.map(entry => (
                    <tr key={entry.id} className="border-b border-slate-50 hover:bg-slate-50 transition-colors">
                      <td className="px-4 py-3 text-[13px] text-slate-600">{entry.date}</td>
                      <td className="px-4 py-3">
                        <p className="text-[13px] font-medium text-[#1A1A2E]">{entry.description}</p>
                        {entry.ai_suggested && <span className="text-[10px] text-[#00A8BD] font-medium">IA</span>}
                      </td>
                      <td className="px-4 py-3 text-[12px] text-slate-600 hidden md:table-cell">{entry.account_debit || "—"}</td>
                      <td className="px-4 py-3 text-[12px] text-slate-600 hidden md:table-cell">{entry.account_credit || "—"}</td>
                      <td className="px-4 py-3 text-right text-[13px] font-mono font-medium text-[#1A1A2E]">${(entry.amount || 0).toLocaleString("es-AR")}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1">
                          <StatusBadge status={entry.status} />
                          {entry.status === "draft" && (
                            <button onClick={async () => { await base44.entities.AccountEntry.update(entry.id, { status: "posted" }); logAction("approve", `Asentó asiento contable: ${entry.description}`, { entityType: "AccountEntry", entityId: entry.id, clientId: entry.client_id, oldData: { status: "draft" }, newData: { status: "posted" }, module: "Contabilidad" }); load(); }}
                              className="text-[10px] text-[#00C7D9] hover:underline ml-1">Asentar</button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
      )}

      {activeTab === "Mayor" && (
        Object.keys(mayorData).length === 0
          ? <EmptyState icon={BookOpen} title="Sin movimientos asentados" description="Asentá asientos del diario para ver el Mayor." />
          : <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
              <table className="w-full">
                <thead><tr className="border-b border-slate-100">
                  <th className="text-left px-4 py-3 text-[11px] font-semibold text-slate-500 uppercase">Cuenta</th>
                  <th className="text-right px-4 py-3 text-[11px] font-semibold text-slate-500 uppercase">Débitos</th>
                  <th className="text-right px-4 py-3 text-[11px] font-semibold text-slate-500 uppercase">Créditos</th>
                  <th className="text-right px-4 py-3 text-[11px] font-semibold text-slate-500 uppercase">Saldo</th>
                </tr></thead>
                <tbody>
                  {Object.entries(mayorData).map(([acct, data]) => (
                    <tr key={acct} className="border-b border-slate-50">
                      <td className="px-4 py-3 text-[13px] font-medium text-[#1A1A2E]">{acct}</td>
                      <td className="px-4 py-3 text-right text-[13px] font-mono">${data.debits.toLocaleString("es-AR")}</td>
                      <td className="px-4 py-3 text-right text-[13px] font-mono">${data.credits.toLocaleString("es-AR")}</td>
                      <td className={`px-4 py-3 text-right text-[13px] font-mono font-bold ${data.debits - data.credits >= 0 ? "text-[#1A1A2E]" : "text-rose-600"}`}>
                        ${(data.debits - data.credits).toLocaleString("es-AR")}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
      )}

      {activeTab === "Resumen" && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[
            { label: "Total Asientos", value: filteredEntries.length, sub: "registros" },
            { label: "Asentados", value: filteredEntries.filter(e => e.status === "posted").length, sub: "confirmados" },
            { label: "Borradores IA", value: filteredEntries.filter(e => e.ai_suggested && e.status === "draft").length, sub: "pendientes revisión" },
          ].map(s => (
            <div key={s.label} className="bg-white rounded-xl p-5 shadow-sm border border-slate-100 text-center">
              <p className="text-3xl font-bold text-[#1A1A2E]">{s.value}</p>
              <p className="text-[13px] font-medium text-slate-600 mt-1">{s.label}</p>
              <p className="text-[11px] text-slate-400">{s.sub}</p>
            </div>
          ))}
        </div>
      )}

      {showForm && <EntryForm clients={clients} onSave={async (data) => { const entry = await base44.entities.AccountEntry.create({ ...data, company_id: activeCompany?.id }); logAction("create", `Creó asiento: ${data.description} — $${data.amount}`, { entityType: "AccountEntry", entityId: entry?.id, clientId: data.client_id, newData: { description: data.description, account_debit: data.account_debit, account_credit: data.account_credit, amount: data.amount }, module: "Contabilidad" }); setShowForm(false); load(); }} onClose={() => setShowForm(false)} />}
    </div>
  );
}

function EntryForm({ clients, onSave, onClose }) {
  const [form, setForm] = useState({ client_id: "", date: new Date().toISOString().split("T")[0], description: "", account_debit: "", account_credit: "", amount: "", entry_type: "otro" });
  const [saving, setSaving] = useState(false);
  const update = (f, v) => setForm(p => ({ ...p, [f]: v }));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-md m-4 p-5">
        <h2 className="text-base font-bold text-[#1A1A2E] mb-4">Nuevo Asiento</h2>
        <form onSubmit={async e => { e.preventDefault(); setSaving(true); await onSave(form); setSaving(false); }} className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2">
              <Label className="text-[12px] font-medium text-slate-600">Cliente *</Label>
              <select value={form.client_id} onChange={e => update("client_id", e.target.value)} required className="mt-1 w-full h-9 px-3 rounded-md border border-slate-200 text-[13px] bg-white">
                <option value="">Seleccionar</option>
                {clients.map(c => <option key={c.id} value={c.id}>{c.business_name}</option>)}
              </select>
            </div>
            <div>
              <Label className="text-[12px] font-medium text-slate-600">Fecha *</Label>
              <Input type="date" value={form.date} onChange={e => update("date", e.target.value)} required className="mt-1 text-[13px] h-9" />
            </div>
            <div>
              <Label className="text-[12px] font-medium text-slate-600">Tipo</Label>
              <select value={form.entry_type} onChange={e => update("entry_type", e.target.value)} className="mt-1 w-full h-9 px-3 rounded-md border border-slate-200 text-[13px] bg-white">
                {Object.entries(entryTypeLabels).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
              </select>
            </div>
            <div className="col-span-2">
              <Label className="text-[12px] font-medium text-slate-600">Descripción *</Label>
              <Input value={form.description} onChange={e => update("description", e.target.value)} required className="mt-1 text-[13px] h-9" />
            </div>
            <div>
              <Label className="text-[12px] font-medium text-slate-600">Cuenta Debe</Label>
              <Input value={form.account_debit} onChange={e => update("account_debit", e.target.value)} placeholder="Ej: Caja" className="mt-1 text-[13px] h-9" />
            </div>
            <div>
              <Label className="text-[12px] font-medium text-slate-600">Cuenta Haber</Label>
              <Input value={form.account_credit} onChange={e => update("account_credit", e.target.value)} placeholder="Ej: Bancos" className="mt-1 text-[13px] h-9" />
            </div>
            <div className="col-span-2">
              <Label className="text-[12px] font-medium text-slate-600">Monto *</Label>
              <Input type="number" value={form.amount} onChange={e => update("amount", e.target.value)} required className="mt-1 text-[13px] h-9" />
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={onClose} className="text-xs">Cancelar</Button>
            <Button type="submit" disabled={saving} className="bg-[#00C7D9] hover:bg-[#00A8BD] text-white text-xs">
              {saving ? "Guardando..." : "Crear Asiento"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}