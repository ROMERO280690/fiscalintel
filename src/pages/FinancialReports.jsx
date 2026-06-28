import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { FileText, Download, TrendingUp, PieChart, Activity, DollarSign, Calendar, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import PageHeader from "@/components/shared/PageHeader";
import EmptyState from "@/components/shared/EmptyState";
import StatusBadge from "@/components/shared/StatusBadge";

const reportTypes = [
  { id: 'balance_general', label: 'Balance General', icon: PieChart, desc: 'Activo, Pasivo y Patrimonio' },
  { id: 'estado_resultados', label: 'Estado de Resultados', icon: TrendingUp, desc: 'Pérdidas y Ganancias' },
  { id: 'flujo_fondos', label: 'Flujo de Fondos', icon: Activity, desc: 'Cash Flow operativo' },
  { id: 'libro_diario', label: 'Libro Diario', icon: FileText, desc: 'Asientos contables ordenados' },
  { id: 'libro_mayor', label: 'Libro Mayor', icon: FileText, desc: 'Movimientos por cuenta' },
  { id: 'iva_compras', label: 'Libro IVA Compras', icon: FileText, desc: 'Compras e importaciones' },
  { id: 'iva_ventas', label: 'Libro IVA Ventas', icon: FileText, desc: 'Ventas y locaciones' },
];

export default function FinancialReports() {
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedClient, setSelectedClient] = useState("");
  const [selectedReport, setSelectedReport] = useState("balance_general");
  const [period, setPeriod] = useState({
    from: new Date(new Date().getFullYear(), 0, 1).toISOString().split('T')[0],
    to: new Date().toISOString().split('T')[0]
  });
  const [reportData, setReportData] = useState(null);
  const [generating, setGenerating] = useState(false);

  useEffect(() => {
    (async () => {
      const cls = await base44.entities.Client.list("-created_date", 200);
      setClients(cls);
      setLoading(false);
    })();
  }, []);

  const generateReport = async () => {
    if (!selectedClient) return;
    setGenerating(true);
    try {
      let result;
      
      if (['libro_diario', 'libro_mayor', 'iva_compras', 'iva_ventas'].includes(selectedReport)) {
        // Usar funciones de exportación
        if (selectedReport === 'libro_diario') {
          result = await base44.functions.invoke('exportLibroDiario', {
            client_id: selectedClient,
            period_from: period.from,
            period_to: period.to,
            format: 'json'
          });
        } else if (selectedReport.includes('iva')) {
          result = await base44.functions.invoke('exportLibroIVA', {
            client_id: selectedClient,
            period_from: period.from,
            period_to: period.to,
            type: selectedReport === 'iva_compras' ? 'compras' : 'ventas'
          });
        }
      } else {
        // Usar nueva función de reportes financieros
        result = await base44.functions.invoke('generateFinancialReports', {
          client_id: selectedClient,
          period_from: period.from,
          period_to: period.to,
          report_type: selectedReport
        });
      }

      setReportData(result.data);
    } catch (error) {
      alert('Error generando reporte: ' + error.message);
    }
    setGenerating(false);
  };

  const exportReport = async (format) => {
    if (!reportData) return;
    // En producción: generar PDF/Excel real
    alert(`Exportando reporte en formato ${format.toUpperCase()}...\n\nEn producción: se descargará el archivo generado`);
  };

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-8 h-8 border-4 border-white/10 border-t-[#00C7D9] rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="min-h-screen bg-[#0A0B14]">
      <PageHeader title="Reportes Profesionales" subtitle="Balances, estados financieros y libros contables">
        <Button 
          onClick={() => exportReport('pdf')} 
          disabled={!reportData}
          className="bg-[#00C7D9] hover:bg-[#00A8BD] text-white text-xs"
        >
          <Download className="w-3.5 h-3.5 mr-1" /> Exportar PDF
        </Button>
      </PageHeader>

      {/* Filtros */}
      <div className="bg-[#1A1A2E] rounded-xl p-4 border border-white/10 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="text-[11px] text-slate-400 font-semibold uppercase mb-1 block">Cliente</label>
            <select 
              value={selectedClient} 
              onChange={(e) => setSelectedClient(e.target.value)}
              className="w-full h-9 px-3 rounded-lg border border-white/10 text-[13px] bg-white/5 text-white"
            >
              <option value="">Seleccionar cliente</option>
              {clients.map(c => (
                <option key={c.id} value={c.id} className="bg-[#1A1A2E] text-white">{c.business_name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-[11px] text-slate-400 font-semibold uppercase mb-1 block">Desde</label>
            <Input 
              type="date" 
              value={period.from} 
              onChange={(e) => setPeriod(p => ({ ...p, from: e.target.value }))}
              className="h-9 bg-white/5 border-white/10 text-white"
            />
          </div>
          <div>
            <label className="text-[11px] text-slate-400 font-semibold uppercase mb-1 block">Hasta</label>
            <Input 
              type="date" 
              value={period.to} 
              onChange={(e) => setPeriod(p => ({ ...p, to: e.target.value }))}
              className="h-9 bg-white/5 border-white/10 text-white"
            />
          </div>
          <div className="flex items-end">
            <Button 
              onClick={generateReport} 
              disabled={!selectedClient || generating}
              className="w-full bg-[#00C7D9] hover:bg-[#00A8BD] text-white text-xs"
            >
              {generating ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" />
                  Generando...
                </>
              ) : (
                <>
                  <FileText className="w-3.5 h-3.5 mr-1" />
                  Generar Reporte
                </>
              )}
            </Button>
          </div>
        </div>
      </div>

      {/* Tipos de reporte */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3 mb-6">
        {reportTypes.map(rt => (
          <button
            key={rt.id}
            onClick={() => setSelectedReport(rt.id)}
            className={`p-3 rounded-xl border text-left transition-all ${
              selectedReport === rt.id
                ? "bg-[#00C7D9]/10 border-[#00C7D9]"
                : "bg-[#1A1A2E] border-white/10 hover:border-white/20"
            }`}
          >
            <rt.icon className={`w-5 h-5 mb-2 ${selectedReport === rt.id ? 'text-[#00C7D9]' : 'text-slate-400'}`} />
            <p className="text-[11px] font-semibold text-white">{rt.label}</p>
            <p className="text-[9px] text-slate-400">{rt.desc}</p>
          </button>
        ))}
      </div>

      {/* Resultado */}
      {!reportData ? (
        <EmptyState 
          icon={FileText} 
          title="Sin reporte generado" 
          description="Seleccioná un cliente, período y tipo de reporte para generar." 
        />
      ) : (
        <div className="bg-[#1A1A2E] rounded-xl border border-white/10 overflow-hidden">
          {/* Cabecera del reporte */}
          <div className="p-4 border-b border-white/10 bg-white/5">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-[15px] font-bold text-white">{reportData.report_type?.replace('_', ' ').toUpperCase() || 'LIBRO CONTABLE'}</h3>
                <p className="text-[12px] text-slate-400">
                  {reportData.client?.business_name} | {reportData.client?.cuit} | {reportData.period?.from} al {reportData.period?.to}
                </p>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => exportReport('excel')} className="bg-white/5 border-white/10 text-white text-xs">
                  <Download className="w-3.5 h-3.5 mr-1" /> Excel
                </Button>
                <Button variant="outline" size="sm" onClick={() => exportReport('txt_afip')} className="bg-white/5 border-white/10 text-white text-xs">
                  <Download className="w-3.5 h-3.5 mr-1" /> TXT AFIP
                </Button>
              </div>
            </div>
          </div>

          {/* Contenido del reporte */}
          <div className="p-4">
            {selectedReport === 'balance_general' && reportData.data && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Activo */}
                <div>
                  <h4 className="text-[13px] font-bold text-white mb-3">ACTIVO</h4>
                  <div className="space-y-2">
                    {reportData.data.activo?.corriente?.map((item, i) => (
                      <div key={i} className="flex justify-between text-[12px]">
                        <span className="text-slate-300">{item.name}</span>
                        <span className="font-mono text-white">${item.saldo?.toLocaleString("es-AR")}</span>
                      </div>
                    ))}
                    {reportData.data.activo?.noCorriente?.map((item, i) => (
                      <div key={i} className="flex justify-between text-[12px]">
                        <span className="text-slate-300">{item.name}</span>
                        <span className="font-mono text-white">${item.saldo?.toLocaleString("es-AR")}</span>
                      </div>
                    ))}
                  </div>
                  <div className="mt-3 pt-3 border-t border-white/10 font-bold text-[13px] flex justify-between">
                    <span className="text-white">Total Activo</span>
                    <span className="font-mono text-white">${reportData.data.totalActivo?.toLocaleString("es-AR")}</span>
                  </div>
                </div>

                {/* Pasivo */}
                <div>
                  <h4 className="text-[13px] font-bold text-white mb-3">PASIVO</h4>
                  <div className="space-y-2">
                    {reportData.data.pasivo?.corriente?.map((item, i) => (
                      <div key={i} className="flex justify-between text-[12px]">
                        <span className="text-slate-300">{item.name}</span>
                        <span className="font-mono text-white">${item.saldo?.toLocaleString("es-AR")}</span>
                      </div>
                    ))}
                    {reportData.data.pasivo?.noCorriente?.map((item, i) => (
                      <div key={i} className="flex justify-between text-[12px]">
                        <span className="text-slate-300">{item.name}</span>
                        <span className="font-mono text-white">${item.saldo?.toLocaleString("es-AR")}</span>
                      </div>
                    ))}
                  </div>
                  <div className="mt-3 pt-3 border-t border-white/10 font-bold text-[13px] flex justify-between">
                    <span className="text-white">Total Pasivo</span>
                    <span className="font-mono text-white">${reportData.data.totalPasivo?.toLocaleString("es-AR")}</span>
                  </div>
                </div>

                {/* Patrimonio */}
                <div>
                  <h4 className="text-[13px] font-bold text-white mb-3">PATRIMONIO</h4>
                  <div className="space-y-2">
                    {reportData.data.patrimonio?.items?.map((item, i) => (
                      <div key={i} className="flex justify-between text-[12px]">
                        <span className="text-slate-300">{item.name}</span>
                        <span className="font-mono text-white">${item.saldo?.toLocaleString("es-AR")}</span>
                      </div>
                    ))}
                  </div>
                  <div className="mt-3 pt-3 border-t border-white/10 font-bold text-[13px] flex justify-between">
                    <span className="text-white">Total Patrimonio</span>
                    <span className="font-mono text-white">${reportData.data.totalPatrimonio?.toLocaleString("es-AR")}</span>
                  </div>
                </div>
              </div>
            )}

            {selectedReport === 'estado_resultados' && reportData.data && (
              <div className="max-w-2xl">
                <div className="space-y-3">
                  <div>
                    <h4 className="text-[13px] font-bold text-emerald-400 mb-2">(+ ) INGRESOS</h4>
                    <div className="space-y-1">
                      {reportData.data.ingresos?.map((item, i) => (
                        <div key={i} className="flex justify-between text-[12px]">
                          <span className="text-slate-300">{item.name}</span>
                          <span className="font-mono text-emerald-400">${item.monto?.toLocaleString("es-AR")}</span>
                        </div>
                      ))}
                    </div>
                    <div className="mt-2 pt-2 border-t border-emerald-500/30 font-bold text-[13px] flex justify-between">
                      <span className="text-white">Total Ingresos</span>
                      <span className="font-mono text-emerald-400">${reportData.data.totalIngresos?.toLocaleString("es-AR")}</span>
                    </div>
                  </div>

                  <div>
                    <h4 className="text-[13px] font-bold text-rose-400 mb-2">(-) COSTOS Y GASTOS</h4>
                    <div className="space-y-1">
                      {reportData.data.costos?.map((item, i) => (
                        <div key={i} className="flex justify-between text-[12px]">
                          <span className="text-slate-300">{item.name}</span>
                          <span className="font-mono text-rose-400">${item.monto?.toLocaleString("es-AR")}</span>
                        </div>
                      ))}
                      {reportData.data.gastos?.map((item, i) => (
                        <div key={i} className="flex justify-between text-[12px]">
                          <span className="text-slate-300">{item.name}</span>
                          <span className="font-mono text-rose-400">${item.monto?.toLocaleString("es-AR")}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="mt-4 pt-4 border-t border-white/10">
                    <div className="flex justify-between text-[13px] mb-2">
                      <span className="text-slate-300">Resultado Bruto</span>
                      <span className={`font-mono font-bold ${reportData.data.resultadoBruto >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                        ${reportData.data.resultadoBruto?.toLocaleString("es-AR")}
                      </span>
                    </div>
                    <div className="flex justify-between text-[13px]">
                      <span className="text-slate-300">Resultado Neto</span>
                      <span className={`font-mono font-bold text-lg ${reportData.data.resultadoNeto >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                        ${reportData.data.resultadoNeto?.toLocaleString("es-AR")}
                      </span>
                    </div>
                    <div className="mt-2 flex justify-between text-[11px]">
                      <span className="text-slate-400">Margen Neto</span>
                      <span className="text-slate-300">{reportData.data.margenNeto}%</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Para otros reportes (libros contables) */}
            {['libro_diario', 'iva_compras', 'iva_ventas'].includes(selectedReport) && reportData && (
              <div className="text-center py-12">
                <FileText className="w-16 h-16 text-slate-400 mx-auto mb-4" />
                <p className="text-[13px] text-slate-300 mb-2">
                  {reportData.entries_count || 0} registros encontrados
                </p>
                <div className="flex justify-center gap-3 mt-4">
                  <Button onClick={() => exportReport('txt_afip')} className="bg-[#00C7D9] hover:bg-[#00A8BD] text-white text-xs">
                    <Download className="w-3.5 h-3.5 mr-1" /> Descargar TXT AFIP
                  </Button>
                  <Button onClick={() => exportReport('pdf')} variant="outline" className="bg-white/5 border-white/10 text-white text-xs">
                    <Download className="w-3.5 h-3.5 mr-1" /> Descargar PDF
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}