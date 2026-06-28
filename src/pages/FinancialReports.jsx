import React, { useState, useEffect } from "react";
import PermissionGuard from "@/components/shared/PermissionGuard";
import { usePermissions } from "@/hooks/usePermissions";
import { useCompanyData } from "@/hooks/useCompanyData";
import { useCompany } from "@/lib/CompanyContext";
import { base44 } from "@/api/base44Client";
import { Download, FileText, TrendingUp, PieChart, Activity } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import PageHeader from "@/components/shared/PageHeader";
import StatusBadge from "@/components/shared/StatusBadge";
import EmptyState from "@/components/shared/EmptyState";

const reportTypes = [
  { id: "balance_comprobacion", label: "Balance de Comprobación", icon: FileText },
  { id: "estado_resultados", label: "Estado de Resultados", icon: TrendingUp },
  { id: "balance_general", label: "Balance General", icon: PieChart },
  { id: "iva_compras", label: "Libro IVA Compras", icon: Activity },
  { id: "iva_ventas", label: "Libro IVA Ventas", icon: Activity },
];

export default function FinancialReports() {
  const { canViewModule } = usePermissions();
  const { activeCompany } = useCompany();
  const { data: entries, loading, reload: reloadEntries } = useCompanyData("AccountEntry", {}, "-date", 500);
  const { data: clients } = useCompanyData("Client");
  const [selectedClient, setSelectedClient] = useState("");
  const [selectedReport, setSelectedReport] = useState("balance_comprobacion");
  const [period, setPeriod] = useState({ from: "", to: "" });
  const [reportData, setReportData] = useState(null);
  const [generating, setGenerating] = useState(false);

  useEffect(() => {
    const today = new Date();
    const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
    setPeriod({
      from: firstDay.toISOString().split("T")[0],
      to: today.toISOString().split("T")[0],
    });
  }, []);

  const generateReport = async () => {
    if (!selectedClient || !period.from || !period.to) return;
    setGenerating(true);
    try {
      const filteredEntries = entries.filter(e => 
        e.client_id === selectedClient && 
        e.status === "posted" &&
        e.date >= period.from && 
        e.date <= period.to
      );

      let result;
      switch (selectedReport) {
        case "balance_comprobacion":
          result = generateBalanceComprobacion(filteredEntries);
          break;
        case "estado_resultados":
          result = generateEstadoResultados(filteredEntries);
          break;
        case "balance_general":
          result = generateBalanceGeneral(filteredEntries);
          break;
        case "iva_compras":
          result = await generateLibroIVA(filteredEntries, "compras");
          break;
        case "iva_ventas":
          result = await generateLibroIVA(filteredEntries, "ventas");
          break;
        default:
          result = { data: [] };
      }
      setReportData(result);
    } catch (e) {
      console.error(e);
    } finally {
      setGenerating(false);
    }
  };

  const generateBalanceComprobacion = (entries) => {
    const accounts = {};
    entries.forEach(e => {
      if (!accounts[e.account_debit]) accounts[e.account_debit] = { debit: 0, credit: 0 };
      if (!accounts[e.account_credit]) accounts[e.account_credit] = { debit: 0, credit: 0 };
      if (e.account_debit) accounts[e.account_debit].debit += e.amount || 0;
      if (e.account_credit) accounts[e.account_credit].credit += e.amount || 0;
    });

    const rows = Object.entries(accounts).map(([account, data]) => ({
      account,
      debit: data.debit,
      credit: data.credit,
      saldo: data.debit - data.credit,
    }));

    const totalDebe = rows.reduce((s, r) => s + r.debit, 0);
    const totalHaber = rows.reduce((s, r) => s + r.credit, 0);

    return {
      title: "Balance de Comprobación",
      client: clients.find(c => c.id === selectedClient)?.business_name,
      period: `${period.from} al ${period.to}`,
      data: rows,
      totals: { totalDebe, totalHaber, diferencia: totalDebe - totalHaber },
    };
  };

  const generateEstadoResultados = (entries) => {
    let ingresos = 0, egresos = 0;
    entries.forEach(e => {
      if (e.entry_type === "venta" || e.entry_type === "cobro") ingresos += e.amount || 0;
      if (e.entry_type === "compra" || e.entry_type === "pago" || e.entry_type === "gasto") egresos += e.amount || 0;
    });

    return {
      title: "Estado de Resultados",
      client: clients.find(c => c.id === selectedClient)?.business_name,
      period: `${period.from} al ${period.to}`,
      data: [
        { concepto: "Ingresos Operativos", monto: ingresos },
        { concepto: "Egresos Operativos", monto: -egresos },
        { concepto: "Resultado Neto", monto: ingresos - egresos },
      ],
      resultado: ingresos - egresos,
    };
  };

  const generateBalanceGeneral = (entries) => {
    const activo = {}, pasivo = {}, patrimonio = {};
    entries.forEach(e => {
      const account = e.account_debit || e.account_credit;
      const saldo = (e.account_debit ? 1 : -1) * (e.amount || 0);
      if (account.toLowerCase().includes("caja") || account.toLowerCase().includes("banco") || account.startsWith("1.")) {
        activo[account] = (activo[account] || 0) + saldo;
      } else if (account.toLowerCase().includes("proveedor") || account.startsWith("2.")) {
        pasivo[account] = (pasivo[account] || 0) + saldo;
      } else if (account.toLowerCase().includes("capital") || account.startsWith("3.")) {
        patrimonio[account] = (patrimonio[account] || 0) + saldo;
      }
    });

    return {
      title: "Balance General",
      client: clients.find(c => c.id === selectedClient)?.business_name,
      period: `${period.from} al ${period.to}`,
      data: {
        activo: Object.entries(activo).map(([k, v]) => ({ cuenta: k, monto: v })),
        pasivo: Object.entries(pasivo).map(([k, v]) => ({ cuenta: k, monto: v })),
        patrimonio: Object.entries(patrimonio).map(([k, v]) => ({ cuenta: k, monto: v })),
      },
      totalActivo: Object.values(activo).reduce((s, v) => s + v, 0),
      totalPasivo: Object.values(pasivo).reduce((s, v) => s + v, 0),
      totalPatrimonio: Object.values(patrimonio).reduce((s, v) => s + v, 0),
    };
  };

  const generateLibroIVA = async (entries, type) => {
    const client = clients.find(c => c.id === selectedClient);
    const docs = await base44.entities.Document.filter({
      client_id: selectedClient,
      category: type === "compras" ? "iva_compras" : "iva_ventas",
      status: "approved",
    });

    const rows = docs.map(d => ({
      fecha: d.date,
      tipo: d.doc_type,
      numero: `${d.point_of_sale || "0000"}-${d.invoice_number || "00000000"}`,
      emisor_receptor: type === "compras" ? d.issuer_name : client?.business_name,
      cuit: type === "compras" ? d.issuer_cuit : client?.cuit,
      neto: d.net_amount || 0,
      iva: d.tax_amount || 0,
      total: d.amount || 0,
    }));

    const totalNeto = rows.reduce((s, r) => s + r.neto, 0);
    const totalIva = rows.reduce((s, r) => s + r.iva, 0);
    const totalGeneral = rows.reduce((s, r) => s + r.total, 0);

    return {
      title: `Libro IVA ${type === "compras" ? "Compras" : "Ventas"}`,
      client: client?.business_name,
      period: `${period.from} al ${period.to}`,
      data: rows,
      totals: { totalNeto, totalIva, totalGeneral },
      type,
    };
  };

  const exportLibroIVA = async () => {
    if (!selectedClient || !period.from || !period.to) return;
    try {
      const response = await base44.functions.invoke('exportLibroIVA', {
        client_id: selectedClient,
        period_from: period.from,
        period_to: period.to,
        type: reportData.type,
      });
      const blob = new Blob([response.data], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `LibroIVA_${reportData.type}_${selectedClient}_${period.from}.txt`;
      a.click();
    } catch (e) {
      console.error(e);
    }
  };

  const exportToCSV = () => {
    if (!reportData) return;
    let csv = "";
    csv += `Reporte: ${reportData.title}\n`;
    csv += `Cliente: ${reportData.client}\n`;
    csv += `Período: ${reportData.period}\n\n`;

    if (selectedReport === "balance_general") {
      csv += "ACTIVO\nCuenta,Monto\n";
      reportData.data.activo.forEach(r => csv += `${r.cuenta},${r.monto}\n`);
      csv += "\nPASIVO\nCuenta,Monto\n";
      reportData.data.pasivo.forEach(r => csv += `${r.cuenta},${r.monto}\n`);
      csv += "\nPATRIMONIO\nCuenta,Monto\n";
      reportData.data.patrimonio.forEach(r => csv += `${r.cuenta},${r.monto}\n`);
    } else if (selectedReport.includes("iva")) {
      csv += "Fecha,Tipo,Número,Emisor/Receptor,CUIT,Neto,IVA,Total\n";
      reportData.data.forEach(r => csv += `${r.fecha},${r.tipo},${r.numero},${r.emisor_receptor},${r.cuit},${r.neto},${r.iva},${r.total}\n`);
      csv += `\nTotales,Neto: ${reportData.totals.totalNeto},IVA: ${reportData.totals.totalIva},Total: ${reportData.totals.totalGeneral}\n`;
    } else {
      const headers = selectedReport === "balance_comprobacion" 
        ? "Cuenta,Debe,Haber,Saldo" 
        : "Concepto,Monto";
      csv += headers + "\n";
      reportData.data.forEach(r => {
        if (selectedReport === "balance_comprobacion") {
          csv += `${r.account},${r.debit},${r.credit},${r.saldo}\n`;
        } else {
          csv += `${r.concepto},${r.monto}\n`;
        }
      });
    }

    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${reportData.title.replace(/\s+/g, "_")}_${selectedClient}_${period.from}.csv`;
    a.click();
  };

  if (!canViewModule("accounting")) return <PermissionGuard module="accounting" />;

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-8 h-8 border-4 border-slate-200 border-t-[#00C7D9] rounded-full animate-spin" />
    </div>
  );

  return (
    <div>
      <PageHeader title="Reportes Financieros" subtitle="Balances y Libros de IVA">
        <div className="flex gap-2">
          {selectedReport.includes("iva") && reportData && (
            <Button onClick={exportLibroIVA} disabled={generating} variant="outline" className="text-xs">
              <Download className="w-3.5 h-3.5 mr-1" /> Libro IVA Digital (.txt)
            </Button>
          )}
          <Button onClick={exportToCSV} disabled={!reportData} variant="outline" className="text-xs">
            <Download className="w-3.5 h-3.5 mr-1" /> Exportar CSV
          </Button>
        </div>
      </PageHeader>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 mb-4">
        <div className="lg:col-span-3 bg-white rounded-xl p-4 shadow-sm border border-slate-100">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="text-[11px] font-medium text-slate-500 uppercase">Cliente</label>
              <select value={selectedClient} onChange={e => setSelectedClient(e.target.value)}
                className="mt-1 w-full h-9 px-3 rounded-lg border border-slate-200 text-[13px] bg-white">
                <option value="">Seleccionar</option>
                {clients.map(c => <option key={c.id} value={c.id}>{c.business_name}</option>)}
              </select>
            </div>
            <div>
              <label className="text-[11px] font-medium text-slate-500 uppercase">Desde</label>
              <Input type="date" value={period.from} onChange={e => setPeriod(p => ({ ...p, from: e.target.value }))}
                className="mt-1 h-9 text-[13px]" />
            </div>
            <div>
              <label className="text-[11px] font-medium text-slate-500 uppercase">Hasta</label>
              <Input type="date" value={period.to} onChange={e => setPeriod(p => ({ ...p, to: e.target.value }))}
                className="mt-1 h-9 text-[13px]" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-4 shadow-sm border border-slate-100">
          <label className="text-[11px] font-medium text-slate-500 uppercase mb-2 block">Tipo de Reporte</label>
          <div className="space-y-1">
            {reportTypes.map(rt => (
              <button key={rt.id} onClick={() => { setSelectedReport(rt.id); setReportData(null); }}
                className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-[12px] transition-colors ${
                  selectedReport === rt.id 
                    ? "bg-[#00C7D9] text-white" 
                    : "bg-slate-50 text-slate-600 hover:bg-slate-100"
                }`}>
                <rt.icon className="w-3.5 h-3.5" />
                {rt.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="mb-4">
        <Button onClick={generateReport} disabled={!selectedClient || generating} 
          className="bg-[#00C7D9] hover:bg-[#00A8BD] text-white text-xs">
          {generating ? "Generando..." : "Generar Reporte"}
        </Button>
      </div>

      {!reportData ? (
        <EmptyState icon={FileText} title="Sin reporte generado" description="Seleccioná un cliente, período y tipo de reporte para generar." />
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
          <div className="p-4 border-b border-slate-100 bg-slate-50">
            <h3 className="text-[15px] font-bold text-[#1A1A2E]">{reportData.title}</h3>
            <p className="text-[12px] text-slate-500">{reportData.client} | {reportData.period}</p>
          </div>

          <div className="p-4">
            {selectedReport === "balance_general" ? (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <h4 className="text-[13px] font-semibold text-[#1A1A2E] mb-2">ACTIVO</h4>
                  <div className="space-y-1">
                    {reportData.data.activo.map((r, i) => (
                      <div key={i} className="flex justify-between text-[12px]">
                        <span className="text-slate-600">{r.cuenta}</span>
                        <span className="font-mono">${r.monto.toLocaleString("es-AR")}</span>
                      </div>
                    ))}
                  </div>
                  <div className="mt-2 pt-2 border-t border-slate-200 font-bold text-[13px] flex justify-between">
                    <span>Total Activo</span>
                    <span className="font-mono">${reportData.totalActivo.toLocaleString("es-AR")}</span>
                  </div>
                </div>

                <div>
                  <h4 className="text-[13px] font-semibold text-[#1A1A2E] mb-2">PASIVO</h4>
                  <div className="space-y-1">
                    {reportData.data.pasivo.map((r, i) => (
                      <div key={i} className="flex justify-between text-[12px]">
                        <span className="text-slate-600">{r.cuenta}</span>
                        <span className="font-mono">${r.monto.toLocaleString("es-AR")}</span>
                      </div>
                    ))}
                  </div>
                  <div className="mt-2 pt-2 border-t border-slate-200 font-bold text-[13px] flex justify-between">
                    <span>Total Pasivo</span>
                    <span className="font-mono">${reportData.totalPasivo.toLocaleString("es-AR")}</span>
                  </div>
                </div>

                <div>
                  <h4 className="text-[13px] font-semibold text-[#1A1A2E] mb-2">PATRIMONIO</h4>
                  <div className="space-y-1">
                    {reportData.data.patrimonio.map((r, i) => (
                      <div key={i} className="flex justify-between text-[12px]">
                        <span className="text-slate-600">{r.cuenta}</span>
                        <span className="font-mono">${r.monto.toLocaleString("es-AR")}</span>
                      </div>
                    ))}
                  </div>
                  <div className="mt-2 pt-2 border-t border-slate-200 font-bold text-[13px] flex justify-between">
                    <span>Total Patrimonio</span>
                    <span className="font-mono">${reportData.totalPatrimonio.toLocaleString("es-AR")}</span>
                  </div>
                </div>
              </div>
            ) : selectedReport.includes("iva") ? (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-slate-100">
                      <th className="text-left px-3 py-2 text-[11px] font-semibold text-slate-500 uppercase">Fecha</th>
                      <th className="text-left px-3 py-2 text-[11px] font-semibold text-slate-500 uppercase">Tipo</th>
                      <th className="text-left px-3 py-2 text-[11px] font-semibold text-slate-500 uppercase">Número</th>
                      <th className="text-left px-3 py-2 text-[11px] font-semibold text-slate-500 uppercase hidden md:table-cell">Emisor/Receptor</th>
                      <th className="text-left px-3 py-2 text-[11px] font-semibold text-slate-500 uppercase hidden lg:table-cell">CUIT</th>
                      <th className="text-right px-3 py-2 text-[11px] font-semibold text-slate-500 uppercase">Neto</th>
                      <th className="text-right px-3 py-2 text-[11px] font-semibold text-slate-500 uppercase">IVA</th>
                      <th className="text-right px-3 py-2 text-[11px] font-semibold text-slate-500 uppercase">Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {reportData.data.map((r, i) => (
                      <tr key={i} className="border-b border-slate-50">
                        <td className="px-3 py-2 text-[12px]">{r.fecha}</td>
                        <td className="px-3 py-2 text-[12px]"><StatusBadge status={r.tipo} /></td>
                        <td className="px-3 py-2 text-[12px] font-mono">{r.numero}</td>
                        <td className="px-3 py-2 text-[12px] hidden md:table-cell">{r.emisor_receptor}</td>
                        <td className="px-3 py-2 text-[12px] font-mono hidden lg:table-cell">{r.cuit}</td>
                        <td className="px-3 py-2 text-right text-[12px] font-mono">${r.neto.toLocaleString("es-AR")}</td>
                        <td className="px-3 py-2 text-right text-[12px] font-mono text-amber-600">${r.iva.toLocaleString("es-AR")}</td>
                        <td className="px-3 py-2 text-right text-[12px] font-mono font-bold">${r.total.toLocaleString("es-AR")}</td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="bg-slate-50 font-bold">
                      <td colSpan={5} className="px-3 py-2 text-[12px] text-right">Totales:</td>
                      <td className="px-3 py-2 text-right text-[12px] font-mono">${reportData.totals.totalNeto.toLocaleString("es-AR")}</td>
                      <td className="px-3 py-2 text-right text-[12px] font-mono text-amber-600">${reportData.totals.totalIva.toLocaleString("es-AR")}</td>
                      <td className="px-3 py-2 text-right text-[12px] font-mono">${reportData.totals.totalGeneral.toLocaleString("es-AR")}</td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            ) : (
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-100">
                    {selectedReport === "balance_comprobacion" ? (
                      <>
                        <th className="text-left px-3 py-2 text-[11px] font-semibold text-slate-500 uppercase">Cuenta</th>
                        <th className="text-right px-3 py-2 text-[11px] font-semibold text-slate-500 uppercase">Debe</th>
                        <th className="text-right px-3 py-2 text-[11px] font-semibold text-slate-500 uppercase">Haber</th>
                        <th className="text-right px-3 py-2 text-[11px] font-semibold text-slate-500 uppercase">Saldo</th>
                      </>
                    ) : (
                      <>
                        <th className="text-left px-3 py-2 text-[11px] font-semibold text-slate-500 uppercase">Concepto</th>
                        <th className="text-right px-3 py-2 text-[11px] font-semibold text-slate-500 uppercase">Monto</th>
                      </>
                    )}
                  </tr>
                </thead>
                <tbody>
                  {reportData.data.map((r, i) => (
                    <tr key={i} className="border-b border-slate-50">
                      {selectedReport === "balance_comprobacion" ? (
                        <>
                          <td className="px-3 py-2 text-[12px] font-medium">{r.account}</td>
                          <td className="px-3 py-2 text-right text-[12px] font-mono">${r.debit.toLocaleString("es-AR")}</td>
                          <td className="px-3 py-2 text-right text-[12px] font-mono">${r.credit.toLocaleString("es-AR")}</td>
                          <td className={`px-3 py-2 text-right text-[12px] font-mono font-bold ${r.saldo >= 0 ? "text-[#1A1A2E]" : "text-rose-600"}`}>
                            ${r.saldo.toLocaleString("es-AR")}
                          </td>
                        </>
                      ) : (
                        <>
                          <td className="px-3 py-2 text-[12px] font-medium">{r.concepto}</td>
                          <td className={`px-3 py-2 text-right text-[12px] font-mono font-bold ${r.monto >= 0 ? "text-[#1A1A2E]" : "text-rose-600"}`}>
                            ${Math.abs(r.monto).toLocaleString("es-AR")}
                          </td>
                        </>
                      )}
                    </tr>
                  ))}
                </tbody>
                {reportData.totals && (
                  <tfoot>
                    <tr className="bg-slate-50 font-bold">
                      <td className="px-3 py-2 text-[12px]">
                        {selectedReport === "balance_comprobacion" ? "Totales" : "Resultado Neto"}
                      </td>
                      {selectedReport === "balance_comprobacion" ? (
                        <>
                          <td className="px-3 py-2 text-right text-[12px] font-mono">${reportData.totals.totalDebe.toLocaleString("es-AR")}</td>
                          <td className="px-3 py-2 text-right text-[12px] font-mono">${reportData.totals.totalHaber.toLocaleString("es-AR")}</td>
                          <td className={`px-3 py-2 text-right text-[12px] font-mono ${reportData.totals.diferencia === 0 ? "text-emerald-600" : "text-rose-600"}`}>
                            ${reportData.totals.diferencia.toLocaleString("es-AR")}
                          </td>
                        </>
                      ) : (
                        <td className={`px-3 py-2 text-right text-[12px] font-mono ${reportData.resultado >= 0 ? "text-emerald-600" : "text-rose-600"}`}>
                          ${reportData.resultado.toLocaleString("es-AR")}
                        </td>
                      )}
                    </tr>
                  </tfoot>
                )}
              </table>
            )}
          </div>
        </div>
      )}
    </div>
  );
}