import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Plus, Search, DollarSign, TrendingUp, TrendingDown, X, CheckCircle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import PageHeader from "@/components/shared/PageHeader";
import EmptyState from "@/components/shared/EmptyState";

const categoryLabels = {
  cobro_cliente: "Cobro cliente", pago_proveedor: "Pago proveedor",
  impuesto: "Impuesto", sueldo: "Sueldo", alquiler: "Alquiler",
  servicio: "Servicio", banco: "Banco", otro: "Otro"
};

const accountLabels = {
  caja: "Caja", banco_santander: "Santander", banco_galicia: "Galicia",
  banco_bbva: "BBVA", banco_nacion: "Nación", banco_otro: "Banco Otro",
  cuenta_corriente: "Cta. Cte.", caja_ahorro: "Caja Ahorro"
};

function TxForm({ clients, tx, onSave, onClose }) {
  const [form, setForm] = useState(tx || {
    client_id: "", type: "ingreso", category: "cobro_cliente",
    date: new Date().toISOString().split("T")[0],
    description: "", amount: 0, account: "caja", reference: ""
  });
  const [saving, setSaving] = useState(false);
  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="bg-[#1A1A2E] rounded-2xl shadow-2xl border border-white/10 w-full max-w-lg">
        <div className="flex items-center justify-between p-5 border-b border-white/10">
          <h2 className="text-[15px] font-bold text-white">{tx ? "Editar Movimiento" : "Nuevo Movimiento"}</h2>
          <button onClick={onClose}><X className="w-5 h-5 text-slate-400" /></button>
        </div>
        <div className="p-5 space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[11px] text-slate-400 font-semibold uppercase mb-1 block">Cliente</label>
              <select value={form.client_id} onChange={e => set("client_id", e.target.value)}
                className="w-full h-9 px-3 rounded-lg border border-white/10 text-[13px] bg-white/5 text-white focus:outline-none focus:ring-2 focus:ring-[#00C7D9]/20">
                <option value="">Sin cliente</option>
                {clients.map(c => <option key={c.id} value={c.id} className="bg-[#1A1A2E] text-white">{c.business_name}</option>)}
              </select>
            </div>
            <div>
              <label className="text-[11px] text-slate-400 font-semibold uppercase mb-1 block">Tipo</label>
              <select value={form.type} onChange={e => set("type", e.target.value)}
                className="w-full h-9 px-3 rounded-lg border border-white/10 text-[13px] bg-white/5 text-white focus:outline-none focus:ring-2 focus:ring-[#00C7D9]/20">
                <option value="ingreso" className="bg-[#1A1A2E] text-white">Ingreso</option>
                <option value="egreso" className="bg-[#1A1A2E] text-white">Egreso</option>
                <option value="transferencia" className="bg-[#1A1A2E] text-white">Transferencia</option>
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[11px] text-slate-400 font-semibold uppercase mb-1 block">Categoría</label>
              <select value={form.category} onChange={e => set("category", e.target.value)}
                className="w-full h-9 px-3 rounded-lg border border-white/10 text-[13px] bg-white/5 text-white focus:outline-none focus:ring-2 focus:ring-[#00C7D9]/20">
                {Object.entries(categoryLabels).map(([k, v]) => <option key={k} value={k} className="bg-[#1A1A2E] text-white">{v}</option>)}
              </select>
            </div>
            <div>
              <label className="text-[11px] text-slate-400 font-semibold uppercase mb-1 block">Cuenta</label>
              <select value={form.account} onChange={e => set("account", e.target.value)}
                className="w-full h-9 px-3 rounded-lg border border-white/10 text-[13px] bg-white/5 text-white focus:outline-none focus:ring-2 focus:ring-[#00C7D9]/20">
                {Object.entries(accountLabels).map(([k, v]) => <option key={k} value={k} className="bg-[#1A1A2E] text-white">{v}</option>)}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[11px] text-slate-400 font-semibold uppercase mb-1 block">Fecha</label>
              <Input type="date" value={form.date} onChange={e => set("date", e.target.value)} className="h-9 text-[13px] bg-white/5 border-white/10 text-white" />
            </div>
            <div>
              <label className="text-[11px] text-slate-400 font-semibold uppercase mb-1 block">Monto $</label>
              <Input type="number" value={form.amount} onChange={e => set("amount", parseFloat(e.target.value) || 0)} className="h-9 text-[13px] bg-white/5 border-white/10 text-white" />
            </div>
          </div>
          <div>
            <label className="text-[11px] text-slate-400 font-semibold uppercase mb-1 block">Descripción</label>
            <Input value={form.description} onChange={e => set("description", e.target.value)} className="h-9 text-[13px] bg-white/5 border-white/10 text-white" placeholder="Descripción del movimiento" />
          </div>
          <div>
            <label className="text-[11px] text-slate-400 font-semibold uppercase mb-1 block">Referencia / Nro. cheque</label>
            <Input value={form.reference} onChange={e => set("reference", e.target.value)} className="h-9 text-[13px] bg-white/5 border-white/10 text-white" />
          </div>
        </div>
        <div className="flex justify-end gap-2 p-5 border-t border-white/10">
          <Button variant="outline" size="sm" onClick={onClose} className="bg-white/5 border-white/10 text-white hover:bg-white/10">Cancelar</Button>
          <Button size="sm" disabled={saving || !form.amount} onClick={async () => { setSaving(true); await onSave(form); setSaving(false); }}
            className="bg-[#00C7D9] hover:bg-[#00A8BD] text-white">
            {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin mr-1" /> : <CheckCircle className="w-3.5 h-3.5 mr-1" />}
            Guardar
          </Button>
        </div>
      </div>
    </div>
  );
}

export default function Treasury() {
  const [transactions, setTransactions] = useState([]);
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [accountFilter, setAccountFilter] = useState("");

  const load = async () => {
    const [txs, cls] = await Promise.all([
      base44.entities.TreasuryTransaction.list("-date", 300),
      base44.entities.Client.list("-created_date", 200),
    ]);
    setTransactions(txs); setClients(cls); setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const handleSave = async (data) => {
    const client = clients.find(c => c.id === data.client_id);
    if (editing) {
      await base44.entities.TreasuryTransaction.update(editing.id, { ...data, client_name: client?.business_name });
    } else {
      await base44.entities.TreasuryTransaction.create({ ...data, client_name: client?.business_name });
    }
    setShowForm(false); setEditing(null); load();
  };

  const filtered = transactions.filter(t => {
    const matchSearch = !search || t.description?.toLowerCase().includes(search.toLowerCase()) || t.client_name?.toLowerCase().includes(search.toLowerCase());
    const matchType = !typeFilter || t.type === typeFilter;
    const matchAccount = !accountFilter || t.account === accountFilter;
    return matchSearch && matchType && matchAccount;
  });

  const totalIngresos = transactions.filter(t => t.type === "ingreso").reduce((s, t) => s + (t.amount || 0), 0);
  const totalEgresos = transactions.filter(t => t.type === "egreso").reduce((s, t) => s + (t.amount || 0), 0);
  const saldo = totalIngresos - totalEgresos;

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-8 h-8 border-4 border-white/10 border-t-[#00C7D9] rounded-full animate-spin" />
    </div>
  );

  return (
    <div>
      <PageHeader title="Tesorería" subtitle="Caja, bancos y conciliación">
        <Button onClick={() => { setEditing(null); setShowForm(true); }} className="bg-[#00C7D9] hover:bg-[#00A8BD] text-white text-xs">
          <Plus className="w-3.5 h-3.5 mr-1" /> Nuevo Movimiento
        </Button>
      </PageHeader>

      <div className="grid grid-cols-3 gap-3 mb-4">
        <div className="bg-[#1A1A2E] rounded-xl p-4 shadow-sm border border-emerald-500/30">
          <div className="flex items-center gap-2 mb-1">
            <TrendingUp className="w-4 h-4 text-emerald-400" />
            <p className="text-[11px] text-slate-400 font-semibold uppercase">Ingresos</p>
          </div>
          <p className="text-xl font-bold text-emerald-400 font-mono">${totalIngresos.toLocaleString("es-AR")}</p>
        </div>
        <div className="bg-[#1A1A2E] rounded-xl p-4 shadow-sm border border-rose-500/30">
          <div className="flex items-center gap-2 mb-1">
            <TrendingDown className="w-4 h-4 text-rose-400" />
            <p className="text-[11px] text-slate-400 font-semibold uppercase">Egresos</p>
          </div>
          <p className="text-xl font-bold text-rose-400 font-mono">${totalEgresos.toLocaleString("es-AR")}</p>
        </div>
        <div className={`bg-[#1A1A2E] rounded-xl p-4 shadow-sm border ${saldo >= 0 ? "border-[#00C7D9]/30" : "border-rose-500/30"}`}>
          <div className="flex items-center gap-2 mb-1">
            <DollarSign className={`w-4 h-4 ${saldo >= 0 ? "text-[#00C7D9]" : "text-rose-400"}`} />
            <p className="text-[11px] text-slate-400 font-semibold uppercase">Saldo Neto</p>
          </div>
          <p className={`text-xl font-bold font-mono ${saldo >= 0 ? "text-[#00C7D9]" : "text-rose-400"}`}>${saldo.toLocaleString("es-AR")}</p>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input placeholder="Buscar movimientos..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9 h-9 text-[13px]" />
        </div>
        <select value={typeFilter} onChange={e => setTypeFilter(e.target.value)}
          className="h-9 px-3 rounded-lg border border-white/10 text-[13px] bg-[#1A1A2E] text-white focus:outline-none">
          <option value="">Todos los tipos</option>
          <option value="ingreso">Ingresos</option>
          <option value="egreso">Egresos</option>
          <option value="transferencia">Transferencias</option>
        </select>
        <select value={accountFilter} onChange={e => setAccountFilter(e.target.value)}
          className="h-9 px-3 rounded-lg border border-white/10 text-[13px] bg-[#1A1A2E] text-white focus:outline-none">
          <option value="">Todas las cuentas</option>
          {Object.entries(accountLabels).map(([k, v]) => <option key={k} value={k} className="bg-[#1A1A2E] text-white">{v}</option>)}
        </select>
      </div>

      {filtered.length === 0 ? (
        <EmptyState icon={DollarSign} title="Sin movimientos" description="Registrá ingresos y egresos de caja y bancos.">
          <Button onClick={() => setShowForm(true)} className="bg-[#00C7D9] hover:bg-[#00A8BD] text-white text-xs">
            <Plus className="w-3.5 h-3.5 mr-1" /> Nuevo Movimiento
          </Button>
        </EmptyState>
      ) : (
        <div className="bg-[#1A1A2E] rounded-xl shadow-sm border border-white/10 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/10">
                  <th className="text-left px-4 py-3 text-[11px] font-semibold text-slate-400 uppercase">Movimiento</th>
                  <th className="text-left px-4 py-3 text-[11px] font-semibold text-slate-400 uppercase hidden sm:table-cell">Cuenta</th>
                  <th className="text-left px-4 py-3 text-[11px] font-semibold text-slate-400 uppercase hidden md:table-cell">Fecha</th>
                  <th className="text-right px-4 py-3 text-[11px] font-semibold text-slate-400 uppercase">Monto</th>
                  <th className="text-left px-4 py-3 text-[11px] font-semibold text-slate-400 uppercase hidden lg:table-cell">Conciliado</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(tx => (
                  <tr key={tx.id} onClick={() => { setEditing(tx); setShowForm(true); }}
                    className="border-b border-white/5 hover:bg-white/5 cursor-pointer transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <span className={`w-2 h-2 rounded-full flex-shrink-0 ${tx.type === "ingreso" ? "bg-emerald-400" : tx.type === "egreso" ? "bg-rose-400" : "bg-blue-400"}`} />
                        <div>
                          <p className="text-[13px] font-medium text-white">{tx.description || categoryLabels[tx.category]}</p>
                          <p className="text-[11px] text-slate-400">{tx.client_name || "Sin cliente"} · {categoryLabels[tx.category]}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-[13px] text-slate-300 hidden sm:table-cell">{accountLabels[tx.account] || tx.account}</td>
                    <td className="px-4 py-3 text-[13px] text-slate-300 hidden md:table-cell font-mono">{tx.date}</td>
                    <td className={`px-4 py-3 text-right text-[13px] font-bold font-mono ${tx.type === "ingreso" ? "text-emerald-400" : tx.type === "egreso" ? "text-rose-400" : "text-blue-400"}`}>
                      {tx.type === "ingreso" ? "+" : tx.type === "egreso" ? "-" : ""}${(tx.amount || 0).toLocaleString("es-AR")}
                    </td>
                    <td className="px-4 py-3 hidden lg:table-cell">
                      <button onClick={async (e) => { e.stopPropagation(); await base44.entities.TreasuryTransaction.update(tx.id, { reconciled: !tx.reconciled }); load(); }}
                        className={`text-[11px] px-2 py-0.5 rounded-full font-semibold border ${tx.reconciled ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30" : "bg-white/5 text-slate-400 border-white/10"}`}>
                        {tx.reconciled ? "✓ Conciliado" : "Pendiente"}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {showForm && <TxForm clients={clients} tx={editing} onSave={handleSave} onClose={() => { setShowForm(false); setEditing(null); }} />}
    </div>
  );
}