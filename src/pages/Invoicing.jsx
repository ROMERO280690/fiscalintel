import React, { useState, useEffect } from "react";
import PermissionGuard from "@/components/shared/PermissionGuard";
import { usePermissions } from "@/hooks/usePermissions";
import { base44 } from "@/api/base44Client";
import { Plus, Search, FileText, Bot, Loader2, Download, X, CheckCircle, Zap, Printer, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import PageHeader from "@/components/shared/PageHeader";
import StatusBadge from "@/components/shared/StatusBadge";
import EmptyState from "@/components/shared/EmptyState";
import QRCodeAFIP from "@/components/arca/QRCodeAFIP";

const invoiceTypeLabels = {
  factura_a: "Factura A", factura_b: "Factura B", factura_c: "Factura C",
  factura_m: "Factura M", factura_e: "Factura E",
  nota_credito_a: "NC A", nota_credito_b: "NC B",
  nota_debito_a: "ND A", nota_debito_b: "ND B",
};

const ivaRates = [0, 10.5, 21, 27];

// Regla ARCA: tipo de comprobante según categoría del emisor
const COMPROBANTE_RULES = {
  factura_a: "Solo puede emitir Factura A un Responsable Inscripto a otro RI. Discrimina IVA.",
  factura_b: "Factura B: RI a Consumidor Final, Monotributista o Exento. IVA incluido en el precio.",
  factura_c: "Factura C: emitida por Monotributistas, Autónomos o Exentos. Sin discriminación de IVA.",
  factura_m: "Factura M: RI con limitación de crédito fiscal. Sujeta a retención del 100% de IVA (RG ARCA 1575).",
  factura_e: "Factura E: exportaciones de bienes o servicios. Alícuota IVA 0% (operación exenta por Ley 23.349 art. 8).",
  nota_credito_a: "NC A: ajuste sobre Factura A. Solo entre RI.",
  nota_credito_b: "NC B: ajuste sobre Factura B.",
  nota_debito_a: "ND A: cargo adicional sobre Factura A.",
  nota_debito_b: "ND B: cargo adicional sobre Factura B.",
};

function InvoiceForm({ clients, invoice, onSave, onClose, company, getNextInvoiceNumber }) {
  const [form, setForm] = useState(invoice || {
    client_id: "", invoice_type: "factura_b", date: new Date().toISOString().split("T")[0],
    concept: "servicios", net_amount: 0, iva_rate: 21, other_taxes: 0, description: "",
    receiver_cuit: "", receiver_name: "", point_of_sale: "0001"
  });
  const [saving, setSaving] = useState(false);

  const iva = (form.net_amount || 0) * (form.iva_rate || 0) / 100;
  const total = (form.net_amount || 0) + iva + (form.other_taxes || 0);

  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));

  const clientSelected = clients.find(c => c.id === form.client_id);
  const autoFillClient = (id) => {
    const c = clients.find(x => x.id === id);
    if (c) {
      set("client_id", id);
      set("client_name", c.business_name);
      set("receiver_name", c.business_name);
      set("receiver_cuit", c.cuit);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    await onSave({ ...form, iva_amount: iva, total_amount: total, client_name: clientSelected?.business_name || form.client_name });
    setSaving(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-5 border-b border-slate-100">
          <h2 className="text-[15px] font-bold text-[#1A1A2E]">{invoice ? "Editar Comprobante" : "Nuevo Comprobante"}</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600"><X className="w-5 h-5" /></button>
        </div>
        <div className="p-5 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[11px] text-slate-500 font-semibold uppercase mb-1 block">Cliente *</label>
              <select 
                value={form.client_id} 
                onChange={async e => {
                  const clientId = e.target.value;
                  autoFillClient(clientId);
                  // Auto-asignar próximo número correlativo al seleccionar cliente
                  if (!invoice?.id && form.point_of_sale && form.invoice_type) {
                    const nextNum = await getNextInvoiceNumber(form.point_of_sale, form.invoice_type);
                    set("invoice_number", nextNum);
                  }
                }}
                className="w-full h-9 px-3 rounded-lg border border-slate-200 text-[13px] focus:outline-none focus:ring-2 focus:ring-[#00C7D9]/20">
                <option value="">Seleccioná cliente</option>
                {clients.map(c => <option key={c.id} value={c.id}>{c.business_name}</option>)}
              </select>
            </div>
            <div>
              <label className="text-[11px] text-slate-500 font-semibold uppercase mb-1 block">Tipo</label>
              <select 
                value={form.invoice_type} 
                onChange={async e => {
                  const newType = e.target.value;
                  set("invoice_type", newType);
                  // Auto-asignar próximo número correlativo por tipo
                  if (!invoice?.id && form.point_of_sale) {
                    const nextNum = await getNextInvoiceNumber(form.point_of_sale, newType);
                    set("invoice_number", nextNum);
                  }
                }}
                className="w-full h-9 px-3 rounded-lg border border-slate-200 text-[13px] focus:outline-none focus:ring-2 focus:ring-[#00C7D9]/20">
                {Object.entries(invoiceTypeLabels).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
              </select>
            </div>
          </div>

          {COMPROBANTE_RULES[form.invoice_type] && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg px-3 py-2">
              <p className="text-[11px] text-blue-700">📋 {COMPROBANTE_RULES[form.invoice_type]}</p>
            </div>
          )}

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="text-[11px] text-slate-500 font-semibold uppercase mb-1 block">Punto de Venta</label>
              <Input 
                value={form.point_of_sale} 
                onChange={async e => {
                  const newPoS = e.target.value;
                  set("point_of_sale", newPoS);
                  // Auto-asignar próximo número correlativo
                  if (!invoice?.id && newPoS.length === 4) {
                    const nextNum = await getNextInvoiceNumber(newPoS, form.invoice_type);
                    set("invoice_number", nextNum);
                  }
                }} 
                className="h-9 text-[13px]" 
                placeholder="0001" 
                maxLength={4}
              />
            </div>
            <div>
              <label className="text-[11px] text-slate-500 font-semibold uppercase mb-1 block">Fecha</label>
              <Input type="date" value={form.date} onChange={e => set("date", e.target.value)} className="h-9 text-[13px]" />
            </div>
            <div>
              <label className="text-[11px] text-slate-500 font-semibold uppercase mb-1 block">Concepto</label>
              <select value={form.concept} onChange={e => set("concept", e.target.value)}
                className="w-full h-9 px-3 rounded-lg border border-slate-200 text-[13px] focus:outline-none focus:ring-2 focus:ring-[#00C7D9]/20">
                <option value="productos">Productos</option>
                <option value="servicios">Servicios</option>
                <option value="productos_y_servicios">Ambos</option>
              </select>
            </div>
          </div>

          <div>
            <label className="text-[11px] text-slate-500 font-semibold uppercase mb-1 block">Receptor (CUIT)</label>
            <div className="grid grid-cols-2 gap-3">
              <Input value={form.receiver_cuit} onChange={e => set("receiver_cuit", e.target.value)} placeholder="20-12345678-9" className="h-9 text-[13px]" />
              <Input value={form.receiver_name} onChange={e => set("receiver_name", e.target.value)} placeholder="Razón social receptor" className="h-9 text-[13px]" />
            </div>
          </div>

          <div>
            <label className="text-[11px] text-slate-500 font-semibold uppercase mb-1 block">Descripción</label>
            <Input value={form.description} onChange={e => set("description", e.target.value)} placeholder="Descripción del servicio o producto" className="h-9 text-[13px]" />
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="text-[11px] text-slate-500 font-semibold uppercase mb-1 block">Neto $</label>
              <Input type="number" value={form.net_amount} onChange={e => set("net_amount", parseFloat(e.target.value) || 0)} className="h-9 text-[13px]" />
            </div>
            <div>
              <label className="text-[11px] text-slate-500 font-semibold uppercase mb-1 block">IVA %</label>
              <select value={form.iva_rate} onChange={e => set("iva_rate", parseFloat(e.target.value))}
                className="w-full h-9 px-3 rounded-lg border border-slate-200 text-[13px] focus:outline-none focus:ring-2 focus:ring-[#00C7D9]/20">
                {ivaRates.map(r => <option key={r} value={r}>{r}%</option>)}
              </select>
            </div>
            <div>
              <label className="text-[11px] text-slate-500 font-semibold uppercase mb-1 block">Otras percepciones $</label>
              <Input type="number" value={form.other_taxes} onChange={e => set("other_taxes", parseFloat(e.target.value) || 0)} className="h-9 text-[13px]" />
            </div>
          </div>

          {/* Totals */}
          <div className="bg-[#E0F7FA] rounded-xl p-4 space-y-1.5">
            <div className="flex justify-between text-[12px] text-slate-600">
              <span>Neto</span><span className="font-mono">${(form.net_amount || 0).toLocaleString("es-AR")}</span>
            </div>
            <div className="flex justify-between text-[12px] text-slate-600">
              <span>IVA ({form.iva_rate}%)</span><span className="font-mono">${iva.toLocaleString("es-AR")}</span>
            </div>
            {(form.other_taxes || 0) > 0 && (
              <div className="flex justify-between text-[12px] text-slate-600">
                <span>Otras percepciones</span><span className="font-mono">${(form.other_taxes || 0).toLocaleString("es-AR")}</span>
              </div>
            )}
            <div className="flex justify-between text-[14px] font-bold text-[#1A1A2E] pt-1 border-t border-[#00C7D9]/30">
              <span>TOTAL</span><span className="font-mono">${total.toLocaleString("es-AR")}</span>
            </div>
          </div>
        </div>
        <div className="flex justify-end gap-2 p-5 border-t border-slate-100">
          <Button variant="outline" size="sm" onClick={onClose}>Cancelar</Button>
          <Button size="sm" disabled={saving || !form.client_id} onClick={handleSave}
            className="bg-[#00C7D9] hover:bg-[#00A8BD] text-white">
            {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin mr-1" /> : <CheckCircle className="w-3.5 h-3.5 mr-1" />}
            Guardar
          </Button>
        </div>
      </div>
    </div>
  );
}

export default function Invoicing() {
  const { canViewModule } = usePermissions();
  const [invoices, setInvoices] = useState([]);
  const [clients, setClients] = useState([]);
  const [company, setCompany] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [generandoCAE, setGenerandoCAE] = useState(null);
  const [arcoStatus, setArcoStatus] = useState(null);
  const [viewingInvoice, setViewingInvoice] = useState(null);

  // Cargar empresa/emisor por defecto
  useEffect(() => {
    base44.entities.Company.list({ status: "active" }, "-created_date", 1)
      .then(companies => {
        if (companies && companies.length > 0) {
          setCompany(companies[0]);
        }
      })
      .catch(() => {});
  }, []);

  const checkARCAStatus = async () => {
    try {
      const res = await base44.functions.invoke('arcaInvoicing', { action: 'test_connection' });
      setArcoStatus(res.data);
    } catch (e) {
      setArcoStatus({ success: false, message: 'No disponible' });
    }
  };

  const load = async () => {
    const [inv, cls] = await Promise.all([
      base44.entities.Invoice.list("-created_date", 200),
      base44.entities.Client.list("-created_date", 200),
    ]);
    setInvoices(inv); setClients(cls); setLoading(false);
    checkARCAStatus();
  };

  // Obtener próximo número de comprobante correlativo (RG ARCA 4868/2020)
  const getNextInvoiceNumber = async (pointOfSale, invoiceType) => {
    const ptoVta = pointOfSale || "0001";
    const sameTypeInvoices = invoices.filter(inv => 
      inv.point_of_sale === ptoVta && 
      inv.invoice_type === invoiceType &&
      inv.invoice_number
    );
    
    if (sameTypeInvoices.length === 0) return "00000001";
    
    const maxNumber = Math.max(...sameTypeInvoices.map(inv => parseInt(inv.invoice_number) || 0));
    return String(maxNumber + 1).padStart(8, "0");
  };

  useEffect(() => { load(); }, []);

  const generarCAE = async (invoiceId) => {
    setGenerandoCAE(invoiceId);
    try {
      const res = await base44.functions.invoke('arcaInvoicing', { invoice_id: invoiceId, action: 'generate_cae' });
      if (res.data.success) {
        alert(`CAE generado: ${res.data.cae}\nVencimiento: ${res.data.vencimiento}\nModo: ${res.data.modo}`);
        load();
      } else {
        alert('Error: ' + (res.data.error || 'No se pudo generar el CAE'));
      }
    } catch (error) {
      alert('Error generando CAE: ' + error.message);
    }
    setGenerandoCAE(null);
  };

  const handleSave = async (data) => {
    if (editing) {
      await base44.entities.Invoice.update(editing.id, data);
    } else {
      await base44.entities.Invoice.create(data);
    }
    setShowForm(false); setEditing(null); load();
  };

  const filtered = invoices.filter(inv => {
    const matchSearch = !search || inv.client_name?.toLowerCase().includes(search.toLowerCase()) || inv.receiver_name?.toLowerCase().includes(search.toLowerCase());
    const matchType = !typeFilter || inv.invoice_type === typeFilter;
    return matchSearch && matchType;
  });

  const totalIssued = invoices.filter(i => i.status === "issued").reduce((s, i) => s + (i.total_amount || 0), 0);
  const totalPending = invoices.filter(i => i.status === "draft" || i.status === "cae_pending").length;

  if (!canViewModule("invoicing")) return <PermissionGuard module="invoicing" />;

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-8 h-8 border-4 border-white/10 border-t-[#00C7D9] rounded-full animate-spin" />
    </div>
  );

  return (
    <div>
      <PageHeader title="Facturación Electrónica" subtitle={arcoStatus?.success ? "ARCA: conectado" : "ARCA: modo offline (CAE manual)"}>
        <div className="flex gap-2">
          {arcoStatus && (
            <span className={`text-[11px] px-2 py-1 rounded-full ${arcoStatus.success ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'}`}>
              {arcoStatus.success ? '● Online' : '● Offline'}
            </span>
          )}
          <Button onClick={() => { setEditing(null); setShowForm(true); }} className="bg-[#00C7D9] hover:bg-[#00A8BD] text-white text-xs">
            <Plus className="w-3.5 h-3.5 mr-1" /> Nuevo Comprobante
          </Button>
        </div>
      </PageHeader>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
      {[
        { label: "Borradores", value: invoices.filter(i => i.status === "draft").length, color: "text-slate-300" },
        { label: "Pendiente CAE", value: totalPending, color: "text-amber-400" },
        { label: "Emitidas", value: invoices.filter(i => i.status === "issued").length, color: "text-emerald-400" },
        { label: "Total facturado", value: `$${totalIssued.toLocaleString("es-AR")}`, color: "text-[#00C7D9]" },
      ].map(s => (
        <div key={s.label} className="bg-[#1A1A2E] rounded-xl p-4 shadow-sm border border-white/10">
          <p className={`text-xl font-bold ${s.color}`}>{s.value}</p>
          <p className="text-[11px] text-slate-400 mt-0.5">{s.label}</p>
        </div>
      ))}
      </div>

      <div className="flex gap-3 mb-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input placeholder="Buscar por cliente o receptor..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9 h-9 text-[13px]" />
        </div>
        <select value={typeFilter} onChange={e => setTypeFilter(e.target.value)}
          className="h-9 px-3 rounded-lg border border-white/10 text-[13px] bg-[#1A1A2E] text-white focus:outline-none">
          <option value="">Todos los tipos</option>
          {Object.entries(invoiceTypeLabels).map(([k, v]) => <option key={k} value={k} className="bg-[#1A1A2E] text-white">{v}</option>)}
        </select>
      </div>

      {filtered.length === 0 ? (
        <EmptyState icon={FileText} title="Sin comprobantes" description="Emitir facturas y notas de crédito/débito.">
          <Button onClick={() => setShowForm(true)} className="bg-[#00C7D9] hover:bg-[#00A8BD] text-white text-xs">
            <Plus className="w-3.5 h-3.5 mr-1" /> Nuevo Comprobante
          </Button>
        </EmptyState>
      ) : (
        <div className="bg-[#1A1A2E] rounded-xl shadow-sm border border-white/10 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/10">
                  <th className="text-left px-4 py-3 text-[11px] font-semibold text-slate-400 uppercase">Comprobante</th>
                  <th className="text-left px-4 py-3 text-[11px] font-semibold text-slate-400 uppercase hidden sm:table-cell">Receptor</th>
                  <th className="text-left px-4 py-3 text-[11px] font-semibold text-slate-400 uppercase hidden md:table-cell">Fecha</th>
                  <th className="text-right px-4 py-3 text-[11px] font-semibold text-slate-400 uppercase">Total</th>
                  <th className="text-left px-4 py-3 text-[11px] font-semibold text-slate-400 uppercase">CAE</th>
                  <th className="text-left px-4 py-3 text-[11px] font-semibold text-slate-400 uppercase">Estado</th>
                  <th className="text-left px-4 py-3 text-[11px] font-semibold text-slate-400 uppercase">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(inv => (
                  <tr key={inv.id} onClick={() => { setEditing(inv); setShowForm(true); }}
                    className="border-b border-white/5 hover:bg-white/5 cursor-pointer transition-colors">
                    <td className="px-4 py-3">
                      <p className="text-[13px] font-medium text-white">{invoiceTypeLabels[inv.invoice_type]} {inv.point_of_sale && inv.invoice_number ? `${inv.point_of_sale}-${inv.invoice_number}` : ""}</p>
                      <p className="text-[11px] text-slate-400">{inv.client_name}</p>
                    </td>
                    <td className="px-4 py-3 text-[13px] text-slate-300 hidden sm:table-cell">{inv.receiver_name || "—"}</td>
                    <td className="px-4 py-3 text-[13px] text-slate-300 hidden md:table-cell font-mono">{inv.date || "—"}</td>
                    <td className="px-4 py-3 text-right text-[13px] font-bold text-white font-mono">
                      ${(inv.total_amount || 0).toLocaleString("es-AR")}
                    </td>
                    <td className="px-4 py-3">
                      {inv.cae_number ? (
                        <span className="text-[10px] font-mono text-emerald-400">{inv.cae_number}</span>
                      ) : inv.status === 'issued' || inv.status === 'draft' ? (
                        <button
                          onClick={(e) => { e.stopPropagation(); generarCAE(inv.id); }}
                          disabled={generandoCAE === inv.id}
                          className="text-[10px] flex items-center gap-1 bg-[#00C7D9] hover:bg-[#00A8BD] text-white px-2 py-1 rounded"
                        >
                          {generandoCAE === inv.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <Zap className="w-3 h-3" />}
                          Generar CAE
                        </button>
                      ) : (
                        <span className="text-[10px] text-slate-500">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3"><StatusBadge status={inv.status} /></td>
                    <td className="px-4 py-3">
                      <div className="flex gap-1">
                        {inv.status === 'issued' && (
                          <>
                            <button
                              onClick={(e) => { e.stopPropagation(); setViewingInvoice(inv); }}
                              className="text-[10px] flex items-center gap-1 bg-blue-600 hover:bg-blue-700 text-white px-2 py-1 rounded"
                            >
                              <Eye className="w-3 h-3" /> Ver
                            </button>
                            <button
                              onClick={(e) => { e.stopPropagation(); window.print(); }}
                              className="text-[10px] flex items-center gap-1 bg-emerald-600 hover:bg-emerald-700 text-white px-2 py-1 rounded"
                            >
                              <Printer className="w-3 h-3" /> Imprimir
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {showForm && (
        <InvoiceForm
          clients={clients}
          invoice={editing}
          onSave={handleSave}
          onClose={() => { setShowForm(false); setEditing(null); }}
          getNextInvoiceNumber={getNextInvoiceNumber}
        />
      )}

      {viewingInvoice && (
        <InvoiceViewer 
          invoice={viewingInvoice} 
          client={clients.find(c => c.id === viewingInvoice.client_id)} 
          company={company}
          onClose={() => setViewingInvoice(null)} 
        />
      )}
    </div>
  );
}

function InvoiceViewer({ invoice, client, company, onClose }) {
  const getConditionIVA = (type) => {
    const conditions = {
      'responsable_inscripto': 'Responsable Inscripto',
      'monotributista': 'Monotributista',
      'autonomo': 'Monotributista',
      'sas': 'Responsable Inscripto',
      'srl': 'Responsable Inscripto',
      'sa': 'Responsable Inscripto',
      'cooperativa': 'Exento',
      'agro': 'Monotributista',
      'pyme': 'Responsable Inscripto'
    };
    return conditions[type] || 'Consumidor Final';
  };

  const emitterCondition = getConditionIVA(company?.company_type);
  const receiverCondition = getConditionIVA(client?.client_type);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-5 border-b border-slate-100">
          <h2 className="text-[15px] font-bold text-[#1A1A2E]">Comprobante {invoice.invoice_type.replace('_', ' ').toUpperCase()}</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600"><X className="w-5 h-5" /></button>
        </div>
        <div className="p-6 space-y-4">
          {/* Header - Emisor */}
          <div className="bg-slate-50 rounded-lg p-4 border border-slate-200">
            <p className="text-[10px] text-slate-500 uppercase font-semibold mb-2">EMISOR</p>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <p className="text-sm font-bold text-[#1A1A2E]">{company?.business_name || client?.business_name || invoice.client_name}</p>
                <p className="text-xs text-slate-600 mt-0.5">CUIT: {company?.cuit || client?.cuit || invoice.receiver_cuit}</p>
                <p className="text-xs text-slate-600">Condición IVA: <span className="font-semibold">{emitterCondition}</span></p>
              </div>
              <div className="text-right">
                <p className="text-xs text-slate-600">Domicilio: {company?.address || client?.address || 'S/D'}</p>
                <p className="text-xs text-slate-600">Localidad: {company?.city || client?.city || 'S/D'}</p>
                <p className="text-xs text-slate-600">Provincia: {company?.province || client?.province || 'S/D'}</p>
              </div>
            </div>
          </div>

          {/* Receptor */}
          <div className="bg-slate-50 rounded-lg p-4 border border-slate-200">
            <p className="text-[10px] text-slate-500 uppercase font-semibold mb-2">RECEPTOR</p>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <p className="text-sm font-bold text-[#1A1A2E]">{invoice.receiver_name || 'Consumidor Final'}</p>
                <p className="text-xs text-slate-600 mt-0.5">CUIT: {invoice.receiver_cuit || '00-00000000-0'}</p>
                <p className="text-xs text-slate-600">Condición IVA: <span className="font-semibold">{receiverCondition}</span></p>
              </div>
              <div className="text-right">
                <p className="text-xs text-slate-600">Domicilio: {invoice.receiver_address || client?.address || 'S/D'}</p>
                <p className="text-xs text-slate-600">Localidad: {client?.city || 'S/D'}</p>
                <p className="text-xs text-slate-600">Provincia: {client?.province || 'S/D'}</p>
              </div>
            </div>
          </div>

          {/* Comprobante Info */}
          <div className="grid grid-cols-3 gap-3 text-center">
            <div className="bg-[#E0F7FA] rounded-lg p-3">
              <p className="text-[9px] text-slate-500 uppercase">Comprobante</p>
              <p className="text-sm font-bold font-mono text-[#1A1A2E]">
                {invoice.point_of_sale}-{String(invoice.invoice_number || '0').padStart(8, '0')}
              </p>
            </div>
            <div className="bg-[#E0F7FA] rounded-lg p-3">
              <p className="text-[9px] text-slate-500 uppercase">Fecha</p>
              <p className="text-sm font-bold text-[#1A1A2E]">{invoice.date}</p>
            </div>
            <div className="bg-[#E0F7FA] rounded-lg p-3">
              <p className="text-[9px] text-slate-500 uppercase">Concepto</p>
              <p className="text-sm font-bold text-[#1A1A2E] capitalize">{invoice.concept}</p>
            </div>
          </div>

          {/* Detalle */}
          <div className="bg-white border border-slate-200 rounded-lg p-4">
            <p className="text-sm text-slate-700 mb-3 font-medium">{invoice.description || 'Servicios profesionales'}</p>
            <div className="space-y-1.5 text-right">
              <div className="flex justify-between text-xs py-1 border-b border-slate-100">
                <span className="text-slate-600">Neto Gravado</span>
                <span className="font-mono">${(invoice.net_amount || 0).toLocaleString('es-AR')}</span>
              </div>
              <div className="flex justify-between text-xs py-1 border-b border-slate-100">
                <span className="text-slate-600">IVA ({invoice.iva_rate}%)</span>
                <span className="font-mono">${(invoice.iva_amount || 0).toLocaleString('es-AR')}</span>
              </div>
              {invoice.other_taxes > 0 && (
                <div className="flex justify-between text-xs py-1 border-b border-slate-100">
                  <span className="text-slate-600">Otras percepciones</span>
                  <span className="font-mono">${invoice.other_taxes.toLocaleString('es-AR')}</span>
                </div>
              )}
              <div className="flex justify-between text-base font-bold pt-2">
                <span className="text-[#1A1A2E]">TOTAL</span>
                <span className="font-mono text-[#1A1A2E]">${(invoice.total_amount || 0).toLocaleString('es-AR')}</span>
              </div>
            </div>
          </div>

          {/* CAE */}
          {invoice.cae_number && (
            <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-3">
              <p className="text-[9px] text-emerald-700 font-bold uppercase mb-1">Código de Autorización Electrónico (CAE)</p>
              <p className="text-sm font-mono text-emerald-800 font-bold">{invoice.cae_number}</p>
              <p className="text-[10px] text-emerald-600">Vencimiento: {invoice.cae_expiry}</p>
            </div>
          )}

          {/* QR Code AFIP - RG 5616/2024 */}
          {invoice.cae_number && (
            <div className="border-2 border-slate-200 rounded-lg p-4">
              <QRCodeAFIP invoice={invoice} client={client} />
            </div>
          )}

          {/* Leyenda ARCA */}
          <div className="text-center pt-2">
            <p className="text-[9px] text-slate-400">
              Comprobante electrónico autorizado por ARCA - RG 4868/2020 y RG 5616/2024
            </p>
          </div>
        </div>
        <div className="flex justify-end gap-2 p-5 border-t border-slate-100">
          <Button variant="outline" size="sm" onClick={onClose} className="text-xs">Cerrar</Button>
          <Button size="sm" onClick={() => window.print()} className="bg-[#00C7D9] hover:bg-[#00A8BD] text-white text-xs">
            <Printer className="w-3.5 h-3.5 mr-1" /> Imprimir
          </Button>
        </div>
      </div>
    </div>
  );
}