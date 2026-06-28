import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import {
  CheckCircle, XCircle, Eye, FileText, Receipt, Users,
  BookOpen, ChevronDown, ChevronUp, Bot, Loader2, Edit2, Save
} from "lucide-react";
import { logAction } from "@/lib/audit";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import PageHeader from "@/components/shared/PageHeader";
import StatusBadge from "@/components/shared/StatusBadge";

const TYPE_CONFIG = {
  documento: { label: "Documento", color: "bg-slate-100 text-slate-600", icon: FileText },
  ddjj: { label: "DDJJ", color: "bg-blue-100 text-blue-700", icon: Receipt },
  recibo: { label: "Recibo de Sueldo", color: "bg-purple-100 text-purple-700", icon: Users },
  asiento: { label: "Asiento Contable", color: "bg-emerald-100 text-emerald-700", icon: BookOpen },
};

export default function Review() {
  const [documents, setDocuments] = useState([]);
  const [filings, setFilings] = useState([]);
  const [payslips, setPayslips] = useState([]);
  const [entries, setEntries] = useState([]);
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [expanded, setExpanded] = useState(null);
  const [approving, setApproving] = useState(null);
  const [editing, setEditing] = useState(null);

  const load = async () => {
    setLoading(true);
    try {
      const [d, f, p, e, c] = await Promise.all([
        base44.entities.Document.filter({ status: "classified" }),
        base44.entities.TaxFiling.filter({ status: "ai_generated" }),
        base44.entities.Payslip.filter({ status: "ai_generated" }),
        base44.entities.AccountEntry.list("-created_date", 200),
        base44.entities.Client.list("-created_date", 200),
      ]);
      setDocuments(d);
      setFilings(f);
      setPayslips(p);
      setEntries(e.filter(en => en.ai_suggested && en.status === "draft"));
      setClients(c);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const getClientName = (id) => clients.find(c => c.id === id)?.business_name || id || "—";

  // Build unified queue
  const allItems = [
    ...documents.map(d => ({
      id: d.id, type: "documento", entity: "Document",
      title: d.title || "Documento sin título",
      subtitle: getClientName(d.client_id),
      meta: [
        { label: "Tipo", value: d.doc_type || "—" },
        { label: "Categoría", value: d.category || "—" },
        { label: "Clasificación IA", value: d.ai_classification || "—" },
        { label: "Confianza IA", value: d.ai_confidence ? `${d.ai_confidence}%` : "—" },
        { label: "Monto", value: d.amount ? `$${d.amount.toLocaleString("es-AR")}` : "—" },
        { label: "IVA", value: d.tax_amount ? `$${d.tax_amount.toLocaleString("es-AR")}` : "—" },
      ],
      notes: d.ai_classification,
      risk: null,
      raw: d,
    })),
    ...filings.map(f => ({
      id: f.id, type: "ddjj", entity: "TaxFiling",
      title: `DDJJ ${f.filing_type?.toUpperCase()} — ${f.period}`,
      subtitle: f.client_name,
      meta: [
        { label: "Período", value: f.period },
        { label: "Débito Fiscal", value: f.total_debit ? `$${f.total_debit.toLocaleString("es-AR")}` : "—" },
        { label: "Crédito Fiscal", value: f.total_credit ? `$${f.total_credit.toLocaleString("es-AR")}` : "—" },
        { label: "Impuesto a Pagar", value: f.tax_payable ? `$${f.tax_payable.toLocaleString("es-AR")}` : "—" },
        { label: "Vencimiento", value: f.due_date || "—" },
      ],
      notes: f.ai_notes,
      risk: f.ai_risk_flags,
      raw: f,
      editFields: [
        { key: "total_debit", label: "Débito Fiscal", type: "number" },
        { key: "total_credit", label: "Crédito Fiscal", type: "number" },
        { key: "tax_payable", label: "Impuesto a Pagar", type: "number" },
      ]
    })),
    ...payslips.map(p => ({
      id: p.id, type: "recibo", entity: "Payslip",
      title: `Recibo — ${p.employee_name} (${p.period})`,
      subtitle: getClientName(p.client_id),
      meta: [
        { label: "Salario Bruto", value: p.gross_salary ? `$${p.gross_salary.toLocaleString("es-AR")}` : "—" },
        { label: "Jubilación", value: p.jubilacion ? `$${p.jubilacion.toLocaleString("es-AR")}` : "—" },
        { label: "Obra Social", value: p.obra_social_employee ? `$${p.obra_social_employee.toLocaleString("es-AR")}` : "—" },
        { label: "Deducciones Totales", value: p.total_deductions ? `$${p.total_deductions.toLocaleString("es-AR")}` : "—" },
        { label: "Salario Neto", value: p.net_salary ? `$${p.net_salary.toLocaleString("es-AR")}` : "—" },
        { label: "Contrib. Patronales", value: p.employer_contributions ? `$${p.employer_contributions.toLocaleString("es-AR")}` : "—" },
      ],
      notes: p.ai_notes,
      risk: null,
      raw: p,
      editFields: [
        { key: "gross_salary", label: "Bruto", type: "number" },
        { key: "net_salary", label: "Neto", type: "number" },
        { key: "total_deductions", label: "Deducciones", type: "number" },
      ]
    })),
    ...entries.map(e => ({
      id: e.id, type: "asiento", entity: "AccountEntry",
      title: e.description,
      subtitle: getClientName(e.client_id),
      meta: [
        { label: "Fecha", value: e.date || "—" },
        { label: "Debe", value: e.account_debit || "—" },
        { label: "Haber", value: e.account_credit || "—" },
        { label: "Monto", value: e.amount ? `$${e.amount.toLocaleString("es-AR")}` : "—" },
        { label: "Tipo", value: e.entry_type || "—" },
      ],
      notes: null,
      risk: null,
      raw: e,
      editFields: [
        { key: "account_debit", label: "Cuenta Debe", type: "text" },
        { key: "account_credit", label: "Cuenta Haber", type: "text" },
        { key: "amount", label: "Monto", type: "number" },
      ]
    })),
  ];

  const filtered = filter === "all" ? allItems : allItems.filter(i => i.type === filter);

  const approve = async (item) => {
    setApproving(item.id);
    try {
      const updates = { status: item.type === "asiento" ? "posted" : "approved" };
      await base44.entities[item.entity].update(item.id, updates);
      logAction("approve", `Aprobó ${item.type}: ${item.title}`, { entityType: item.entity, entityId: item.id, clientId: item.raw?.client_id, clientName: item.subtitle, oldData: { status: item.raw?.status }, newData: updates, module: "Bandeja de Revisión" });
      load();
    } catch (e) { console.error(e); }
    finally { setApproving(null); }
  };

  const reject = async (item) => {
    setApproving(item.id + "_reject");
    try {
      const updates = { status: item.type === "documento" ? "rejected" : "draft" };
      await base44.entities[item.entity].update(item.id, updates);
      logAction("reject", `Rechazó ${item.type}: ${item.title}`, { entityType: item.entity, entityId: item.id, clientId: item.raw?.client_id, clientName: item.subtitle, oldData: { status: item.raw?.status }, newData: updates, module: "Bandeja de Revisión" });
      load();
    } catch (e) { console.error(e); }
    finally { setApproving(null); }
  };

  const saveEdit = async (item, edits) => {
    await base44.entities[item.entity].update(item.id, edits);
    setEditing(null);
    load();
  };

  const approveAll = async () => {
    for (const item of filtered) {
      await approve(item);
    }
  };

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-8 h-8 border-4 border-slate-200 border-t-[#00C7D9] rounded-full animate-spin" />
    </div>
  );

  return (
    <div>
      <PageHeader
        title="Bandeja de Revisión"
        subtitle={`${allItems.length} ítems generados por IA esperan tu aprobación`}
      >
        {filtered.length > 0 && (
          <Button onClick={approveAll} className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs">
            <CheckCircle className="w-3.5 h-3.5 mr-1" />
            Aprobar Todo ({filtered.length})
          </Button>
        )}
      </PageHeader>

      {/* Filter tabs */}
      <div className="flex gap-2 mb-5 flex-wrap">
        {[
          { key: "all", label: `Todos (${allItems.length})` },
          { key: "ddjj", label: `DDJJ (${filings.length})` },
          { key: "recibo", label: `Recibos (${payslips.length})` },
          { key: "asiento", label: `Asientos (${entries.length})` },
          { key: "documento", label: `Documentos (${documents.length})` },
        ].map(f => (
          <button key={f.key} onClick={() => setFilter(f.key)}
            className={`px-3 py-1.5 rounded-lg text-[12px] font-medium transition-colors ${filter === f.key ? "bg-[#00C7D9] text-white" : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50"}`}>
            {f.label}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 text-center shadow-sm border border-slate-100">
          <CheckCircle className="w-12 h-12 text-emerald-400 mx-auto mb-3" />
          <h3 className="text-base font-bold text-[#1A1A2E]">Bandeja vacía</h3>
          <p className="text-[13px] text-slate-500 mt-1">No hay ítems pendientes de revisión en esta categoría.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(item => (
            <ReviewItem
              key={item.id}
              item={item}
              expanded={expanded}
              editing={editing}
              approving={approving}
              onToggleExpand={(id) => setExpanded(expanded === id ? null : id)}
              onToggleEdit={(id) => { setEditing(editing === id ? null : id); setExpanded(id); }}
              onApprove={approve}
              onReject={reject}
              onSaveEdit={saveEdit}
              onCancelEdit={() => setEditing(null)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function ReviewItem({ item, expanded, editing, approving, onToggleExpand, onToggleEdit, onApprove, onReject, onSaveEdit, onCancelEdit }) {
  const cfg = TYPE_CONFIG[item.type];
  const isExpanded = expanded === item.id;
  const isEditing = editing === item.id;

  return (
    <div className={`bg-white rounded-xl shadow-sm border transition-all ${item.risk ? "border-amber-200" : "border-slate-100"}`}>
      <div className="flex items-center gap-3 p-4">
        <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${cfg.color}`}>
          <cfg.icon className="w-4 h-4" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded uppercase ${cfg.color}`}>{cfg.label}</span>
            <span className="text-[13px] font-semibold text-[#1A1A2E] truncate">{item.title}</span>
          </div>
          <p className="text-[11px] text-slate-500 mt-0.5">{item.subtitle}</p>
          {item.risk && <p className="text-[11px] text-amber-600 mt-0.5">⚠ {item.risk}</p>}
        </div>
        <div className="flex items-center gap-1.5 flex-shrink-0">
          <button onClick={() => onToggleExpand(item.id)}
            className="w-7 h-7 rounded-lg bg-slate-100 hover:bg-slate-200 flex items-center justify-center transition-colors">
            {isExpanded ? <ChevronUp className="w-3.5 h-3.5 text-slate-600" /> : <ChevronDown className="w-3.5 h-3.5 text-slate-600" />}
          </button>
          <button onClick={() => onToggleEdit(item.id)}
            className="w-7 h-7 rounded-lg bg-slate-100 hover:bg-blue-100 flex items-center justify-center transition-colors">
            <Edit2 className="w-3.5 h-3.5 text-slate-600" />
          </button>
          <button onClick={() => onReject(item)} disabled={approving === item.id + "_reject"}
            className="w-7 h-7 rounded-lg bg-rose-50 hover:bg-rose-100 flex items-center justify-center transition-colors">
            {approving === item.id + "_reject" ? <Loader2 className="w-3.5 h-3.5 animate-spin text-rose-500" /> : <XCircle className="w-3.5 h-3.5 text-rose-500" />}
          </button>
          <button onClick={() => onApprove(item)} disabled={approving === item.id}
            className="flex items-center gap-1.5 px-3 h-7 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-medium transition-colors">
            {approving === item.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <CheckCircle className="w-3 h-3" />}
            Aprobar
          </button>
        </div>
      </div>

      {isExpanded && (
        <div className="border-t border-slate-100 p-4 space-y-3">
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {item.meta.map((m, i) => (
              <div key={i} className="bg-slate-50 rounded-lg p-2.5">
                <p className="text-[10px] text-slate-400 uppercase font-semibold">{m.label}</p>
                <p className="text-[13px] font-medium text-[#1A1A2E] mt-0.5">{m.value}</p>
              </div>
            ))}
          </div>
          {item.notes && (
            <div className="bg-[#E0F7FA] rounded-lg p-3">
              <div className="flex items-center gap-1.5 mb-1">
                <Bot className="w-3.5 h-3.5 text-[#00A8BD]" />
                <span className="text-[11px] font-semibold text-[#00A8BD]">Análisis IA</span>
              </div>
              <p className="text-[12px] text-[#1A1A2E]">{item.notes}</p>
            </div>
          )}
          {isEditing && item.editFields && (
            <EditPanel item={item} onSave={onSaveEdit} onCancel={onCancelEdit} />
          )}
        </div>
      )}
    </div>
  );
}

function EditPanel({ item, onSave, onCancel }) {
  const [data, setData] = useState(() => {
    const d = {};
    item.editFields.forEach(f => { d[f.key] = item.raw[f.key] || ""; });
    return d;
  });
  const [saving, setSaving] = useState(false);

  return (
    <div className="bg-blue-50 rounded-xl p-4 border border-blue-100">
      <p className="text-[11px] font-semibold text-blue-700 mb-3 flex items-center gap-1.5">
        <Edit2 className="w-3.5 h-3.5" /> Editar valores antes de aprobar
      </p>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {item.editFields.map(f => (
          <div key={f.key}>
            <label className="text-[11px] text-slate-600 font-medium">{f.label}</label>
            <Input
              type={f.type}
              value={data[f.key]}
              onChange={e => setData(p => ({ ...p, [f.key]: f.type === "number" ? parseFloat(e.target.value) || 0 : e.target.value }))}
              className="mt-1 text-[13px] h-8"
            />
          </div>
        ))}
      </div>
      <div className="flex justify-end gap-2 mt-3">
        <Button variant="outline" size="sm" onClick={onCancel} className="text-xs h-7">Cancelar</Button>
        <Button size="sm" disabled={saving}
          onClick={async () => { setSaving(true); await onSave(item, data); setSaving(false); }}
          className="bg-blue-600 hover:bg-blue-700 text-white text-xs h-7">
          {saving ? <Loader2 className="w-3 h-3 animate-spin mr-1" /> : <Save className="w-3 h-3 mr-1" />}
          Guardar y Aprobar
        </Button>
      </div>
    </div>
  );
}