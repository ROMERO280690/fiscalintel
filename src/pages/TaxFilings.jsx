import React, { useState, useEffect } from "react";
import PermissionGuard from "@/components/shared/PermissionGuard";
import { usePermissions } from "@/hooks/usePermissions";
import { useCompanyData } from "@/hooks/useCompanyData";
import { useCompany } from "@/lib/CompanyContext";
import { base44 } from "@/api/base44Client";
import { logAction } from "@/lib/audit";
import { Plus, Search, Receipt, Bot, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import PageHeader from "@/components/shared/PageHeader";
import StatusBadge from "@/components/shared/StatusBadge";
import EmptyState from "@/components/shared/EmptyState";

const filingTypeLabels = {
  iva: "IVA",
  iibb: "Ingresos Brutos",
  convenio_multilateral: "Conv. Multilateral",
  monotributo: "Monotributo",
  ganancias: "Ganancias",
  bienes_personales: "Bienes Personales",
  sueldos: "Sueldos",
};

export default function TaxFilings() {
  const { canViewModule, can } = usePermissions();
  const { activeCompany } = useCompany();
  const { data: filings, loading, reload: reloadFilings } = useCompanyData("TaxFiling");
  const { data: clients, reload: reloadClients } = useCompanyData("Client");
  const load = () => { reloadFilings(); reloadClients(); };
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [generating, setGenerating] = useState(null);

  const filtered = filings.filter(f => {
    const matchSearch = !search || f.client_name?.toLowerCase().includes(search.toLowerCase()) || f.period?.includes(search);
    const matchType = !typeFilter || f.filing_type === typeFilter;
    return matchSearch && matchType;
  });

  const handleCreate = async (data) => {
    const client = clients.find(c => c.id === data.client_id);
    const filing = await base44.entities.TaxFiling.create({
      ...data,
      client_name: client?.business_name || "",
      status: "draft",
      company_id: activeCompany?.id,
    });
    logAction("create", `Creó DDJJ ${filingTypeLabels[data.filing_type]} período ${data.period} — ${client?.business_name}`, { entityType: "TaxFiling", entityId: filing?.id, clientId: data.client_id, clientName: client?.business_name, newData: { filing_type: data.filing_type, period: data.period }, module: "DDJJ" });
    setShowForm(false);
    load();
  };

  const generateWithAI = async (filing) => {
    setGenerating(filing.id);
    try {
      const docs = await base44.entities.Document.filter({
        client_id: filing.client_id,
        category: filing.filing_type === "iva" ? "iva_compras" : filing.filing_type,
      });

      // Separar comprobantes de ventas (débito fiscal) y compras (crédito fiscal)
      const ventaDocs = docs.filter(d => d.category === "iva_ventas");
      const compraDocs = docs.filter(d => d.category === "iva_compras");
      const totalVentas = ventaDocs.reduce((s, d) => s + (d.net_amount || d.amount || 0), 0);
      const totalIVAVentas = ventaDocs.reduce((s, d) => s + (d.tax_amount || 0), 0);
      const totalCompras = compraDocs.reduce((s, d) => s + (d.net_amount || d.amount || 0), 0);
      const totalIVACompras = compraDocs.reduce((s, d) => s + (d.tax_amount || 0), 0);

      const result = await base44.integrations.Core.InvokeLLM({
        prompt: `Sos un contador público argentino matriculado, experto en ARCA (ex AFIP). Calculá la DDJJ de ${filingTypeLabels[filing.filing_type]} para el período ${filing.period}.

Cliente: ${filing.client_name}

Datos del período:
- Comprobantes de VENTAS: ${ventaDocs.length} documentos
  · Neto gravado ventas: $${totalVentas.toLocaleString("es-AR")}
  · IVA débito fiscal (ventas): $${totalIVAVentas.toLocaleString("es-AR")}
- Comprobantes de COMPRAS: ${compraDocs.length} documentos
  · Neto gravado compras: $${totalCompras.toLocaleString("es-AR")}
  · IVA crédito fiscal (compras): $${totalIVACompras.toLocaleString("es-AR")}
- Total de comprobantes procesados: ${docs.length}

Aplicá la mecánica correcta según Ley 23.349:
1. Débito fiscal = suma de IVA facturado en ventas del período
2. Crédito fiscal = IVA de compras vinculadas con la actividad gravada (considerar proporcionalidad si hay operaciones exentas)
3. Saldo técnico = Débito Fiscal - Crédito Fiscal
4. Si hay saldo a favor del período anterior, computarlo
5. Posición IVA = impuesto a pagar o saldo a favor (técnico o libre disponibilidad)
6. Identificar riesgos: facturas de proveedores sin CAE válido, diferencias entre débito declarado y percibido por ARCA, inconsistencias con padrones IVA (RG 2854)

Devolvé los cálculos exactos y un análisis profesional de la posición fiscal.`,
        response_json_schema: {
          type: "object",
          properties: {
            total_debit: { type: "number" },
            total_credit: { type: "number" },
            tax_payable: { type: "number" },
            ai_notes: { type: "string" },
            risk_flags: { type: "string" },
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
      logAction("ai_run", `IA calculó DDJJ ${filingTypeLabels[filing.filing_type]} ${filing.period} — ${filing.client_name} → $${result.tax_payable || 0}`, { entityType: "TaxFiling", entityId: filing.id, clientId: filing.client_id, clientName: filing.client_name, newData: { tax_payable: result.tax_payable, status: "ai_generated" }, module: "DDJJ" });
      load();
    } catch (e) {
      console.error(e);
    } finally {
      setGenerating(null);
    }
  };

  if (!canViewModule("tax_filings")) return <PermissionGuard module="tax_filings" />;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-slate-200 border-t-[#00C7D9] rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div>
      <PageHeader title="Declaraciones Juradas" subtitle={`${filings.length} declaraciones`}>
        <Button onClick={() => setShowForm(true)} className="bg-[#00C7D9] hover:bg-[#00A8BD] text-white text-xs">
          <Plus className="w-3.5 h-3.5 mr-1" /> Nueva DDJJ
        </Button>
      </PageHeader>

      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input placeholder="Buscar por cliente o período..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9 text-[13px] h-9" />
        </div>
        <select value={typeFilter} onChange={e => setTypeFilter(e.target.value)} className="h-9 px-3 rounded-lg border border-slate-200 text-[13px] bg-white focus:outline-none focus:ring-2 focus:ring-[#00C7D9]/20">
          <option value="">Todos los tipos</option>
          {Object.entries(filingTypeLabels).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
        </select>
      </div>

      {filtered.length === 0 ? (
        <EmptyState icon={Receipt} title="Sin declaraciones" description="Creá una declaración jurada para que la IA la procese.">
          <Button onClick={() => setShowForm(true)} className="bg-[#00C7D9] hover:bg-[#00A8BD] text-white text-xs">
            <Plus className="w-3.5 h-3.5 mr-1" /> Nueva DDJJ
          </Button>
        </EmptyState>
      ) : (
        <div className="space-y-2">
          {filtered.map(filing => (
            <div key={filing.id} className="bg-white rounded-xl p-4 shadow-sm border border-slate-100 hover:shadow-md transition-all">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="text-[13px] font-semibold text-[#1A1A2E]">
                      {filingTypeLabels[filing.filing_type]} — {filing.period}
                    </h3>
                    <StatusBadge status={filing.status} />
                  </div>
                  <p className="text-[11px] text-slate-500">{filing.client_name}</p>
                  {filing.tax_payable > 0 && (
                    <p className="text-[13px] font-bold text-[#1A1A2E] mt-1 font-mono">
                      Impuesto: ${filing.tax_payable.toLocaleString("es-AR")}
                    </p>
                  )}
                  {filing.ai_notes && (
                    <p className="text-[11px] text-slate-500 mt-1 bg-slate-50 rounded-lg px-2 py-1">{filing.ai_notes}</p>
                  )}
                  {filing.ai_risk_flags && (
                    <p className="text-[11px] text-amber-600 mt-1 bg-amber-50 rounded-lg px-2 py-1">⚠️ {filing.ai_risk_flags}</p>
                  )}
                </div>
                <div className="flex gap-1">
                  {(filing.status === "draft") && (
                    <Button
                      size="sm"
                      onClick={() => generateWithAI(filing)}
                      disabled={generating === filing.id}
                      className="bg-[#00C7D9] hover:bg-[#00A8BD] text-white text-[11px] h-7 px-2"
                    >
                      {generating === filing.id ? <Loader2 className="w-3 h-3 animate-spin mr-1" /> : <Bot className="w-3 h-3 mr-1" />}
                      IA
                    </Button>
                  )}
                  {(filing.status === "ai_generated" || filing.status === "review") && (
                    <Button
                      size="sm"
                      onClick={async () => { await base44.entities.TaxFiling.update(filing.id, { status: "approved" }); logAction("approve", `Aprobó DDJJ ${filingTypeLabels[filing.filing_type]} ${filing.period} — ${filing.client_name}`, { entityType: "TaxFiling", entityId: filing.id, clientId: filing.client_id, clientName: filing.client_name, oldData: { status: filing.status }, newData: { status: "approved" }, module: "DDJJ" }); load(); }}
                      className="bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] h-7 px-2"
                    >
                      Aprobar
                    </Button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {showForm && (
        <FilingForm clients={clients} onSave={handleCreate} onClose={() => setShowForm(false)} />
      )}
    </div>
  );
}

function FilingForm({ clients, onSave, onClose }) {
  const [form, setForm] = useState({ client_id: "", filing_type: "iva", period: "", due_date: "" });
  const update = (f, v) => setForm(p => ({ ...p, [f]: v }));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-sm m-4 p-5">
        <h2 className="text-base font-bold text-[#1A1A2E] mb-4">Nueva Declaración Jurada</h2>
        <form onSubmit={(e) => { e.preventDefault(); onSave(form); }} className="space-y-3">
          <div>
            <Label className="text-[12px] font-medium text-slate-600">Cliente *</Label>
            <select value={form.client_id} onChange={e => update("client_id", e.target.value)} required className="mt-1 w-full h-9 px-3 rounded-md border border-slate-200 text-[13px] bg-white">
              <option value="">Seleccionar</option>
              {clients.map(c => <option key={c.id} value={c.id}>{c.business_name}</option>)}
            </select>
          </div>
          <div>
            <Label className="text-[12px] font-medium text-slate-600">Tipo *</Label>
            <select value={form.filing_type} onChange={e => update("filing_type", e.target.value)} className="mt-1 w-full h-9 px-3 rounded-md border border-slate-200 text-[13px] bg-white">
              {Object.entries(filingTypeLabels).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
            </select>
          </div>
          <div>
            <Label className="text-[12px] font-medium text-slate-600">Período *</Label>
            <Input value={form.period} onChange={e => update("period", e.target.value)} placeholder="MM/YYYY" required className="mt-1 text-[13px] h-9" />
          </div>
          <div>
            <Label className="text-[12px] font-medium text-slate-600">Fecha Vencimiento</Label>
            <Input type="date" value={form.due_date} onChange={e => update("due_date", e.target.value)} className="mt-1 text-[13px] h-9" />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={onClose} className="text-xs">Cancelar</Button>
            <Button type="submit" className="bg-[#00C7D9] hover:bg-[#00A8BD] text-white text-xs">Crear</Button>
          </div>
        </form>
      </div>
    </div>
  );
}