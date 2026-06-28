import React, { useState, useEffect } from "react";
import { useCompany } from "@/lib/CompanyContext";
import { base44 } from "@/api/base44Client";
import PageHeader from "@/components/shared/PageHeader";
import StatusBadge from "@/components/shared/StatusBadge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FileBarChart, TrendingUp, DollarSign, Download, Calculator } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";

const balanceTypes = [
  { value: "situacion_patrimonial", label: "Estado de Situación Patrimonial" },
  { value: "estado_resultados", label: "Estado de Resultados" },
  { value: "estado_cambios_patrimonio", label: "Estado de Cambios en el Patrimonio" },
  { value: "estado_flujo_efectivo", label: "Estado de Flujo de Efectivo" },
];

export default function BalanceSheets() {
  const { selectedCompany } = useCompany();
  const { toast } = useToast();
  const [clients, setClients] = useState([]);
  const [selectedClient, setSelectedClient] = useState(null);
  const [period, setPeriod] = useState("");
  const [balanceType, setBalanceType] = useState("situacion_patrimonial");
  const [balances, setBalances] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (selectedCompany) {
      loadClients();
      const now = new Date();
      setPeriod(`${String(now.getMonth() + 1).padStart(2, '0')}/${now.getFullYear()}`);
    }
  }, [selectedCompany]);

  const loadClients = async () => {
    const data = await base44.entities.Client.filter({ company_id: selectedCompany.id, status: "active" });
    setClients(data || []);
  };

  const loadBalances = async () => {
    if (!selectedClient) return;
    const data = await base44.entities.BalanceSheet.filter({ client_id: selectedClient.id }, "-period", 50);
    setBalances(data || []);
  };

  const generateBalance = async () => {
    if (!selectedClient) {
      toast({ title: "Seleccioná un cliente", variant: "destructive" });
      return;
    }

    setLoading(true);
    try {
      // Obtener asientos contables del período
      const entries = await base44.entities.AccountEntry.filter({
        client_id: selectedClient.id,
        period,
        status: "posted"
      });

      if (!entries || entries.length === 0) {
        toast({
          title: "Sin datos contables",
          description: "No hay asientos registrados para este período",
          variant: "destructive"
        });
        setLoading(false);
        return;
      }

      // Calcular saldos por cuenta
      const cuentas = {};
      for (const entry of entries) {
        if (!cuentas[entry.account_debit]) cuentas[entry.account_debit] = 0;
        if (!cuentas[entry.account_credit]) cuentas[entry.account_credit] = 0;
        
        cuentas[entry.account_debit] += entry.amount || 0;
        cuentas[entry.account_credit] -= entry.amount || 0;
      }

      // Generar balances
      const balanceRecords = [];
      for (const [cuenta, saldo] of Object.entries(cuentas)) {
        const accountType = saldo >= 0 ? "activo" : "pasivo";
        
        const record = await base44.entities.BalanceSheet.create({
          company_id: selectedClient.company_id,
          client_id: selectedClient.id,
          client_name: selectedClient.business_name,
          period,
          balance_type: balanceType,
          account_code: cuenta,
          account_name: cuenta,
          account_type: accountType,
          debit_amount: saldo > 0 ? saldo : 0,
          credit_amount: saldo < 0 ? Math.abs(saldo) : 0,
          balance: saldo,
          status: "draft"
        });
        
        balanceRecords.push(record);
      }

      toast({
        title: "Balance generado",
        description: `${balanceRecords.length} cuentas procesadas`
      });
      loadBalances();
    } catch (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
    setLoading(false);
  };

  const exportBalance = async () => {
    toast({ title: "Exportando", description: "Generando PDF del balance..." });
    // Implementar exportación a PDF/Excel
  };

  return (
    <div>
      <PageHeader title="Balances Contables" subtitle="Estados financieros y contables">
        <Button onClick={exportBalance} variant="outline" className="text-xs">
          <Download className="w-3.5 h-3.5 mr-1" /> Exportar
        </Button>
      </PageHeader>

      {/* Generador */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-sm font-semibold">Generar Balance</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="text-xs font-medium text-slate-600 mb-1 block">Cliente</label>
              <select
                value={selectedClient?.id || ''}
                onChange={(e) => { setSelectedClient(clients.find(c => c.id === e.target.value)); loadBalances(); }}
                className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
              >
                <option value="">Seleccionar cliente...</option>
                {clients.map(c => <option key={c.id} value={c.id}>{c.business_name}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs font-medium text-slate-600 mb-1 block">Período</label>
              <Input type="text" value={period} onChange={(e) => setPeriod(e.target.value)} placeholder="MM/YYYY" className="h-9" />
            </div>
            <div>
              <label className="text-xs font-medium text-slate-600 mb-1 block">Tipo</label>
              <select
                value={balanceType}
                onChange={(e) => setBalanceType(e.target.value)}
                className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
              >
                {balanceTypes.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
              </select>
            </div>
            <div className="flex items-end">
              <Button onClick={generateBalance} disabled={!selectedClient || loading} className="bg-[#00C7D9] hover:bg-[#00A8BD] w-full">
                {loading ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Calculator className="w-4 h-4 mr-2" />}
                Generar
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabs por tipo */}
      <Tabs defaultValue="situacion_patrimonial" value={balanceType} onValueChange={setBalanceType} className="space-y-4">
        <TabsList className="grid grid-cols-2 md:grid-cols-4">
          {balanceTypes.map(t => <TabsTrigger key={t.value} value={t.value}>{t.label.split(' ')[0]}</TabsTrigger>)}
        </TabsList>

        <TabsContent value={balanceType}>
          {balances.length > 0 ? (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-semibold">
                  {balanceTypes.find(t => t.value === balanceType)?.label} - {selectedClient?.business_name}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {balances.map((b) => (
                    <div key={b.id} className="flex items-center justify-between p-3 border border-slate-100 rounded-lg">
                      <div>
                        <p className="text-sm font-medium text-slate-900">{b.account_name}</p>
                        <p className="text-xs text-slate-500">{b.account_code} - {b.account_type}</p>
                      </div>
                      <div className="text-right">
                        <p className={`text-sm font-bold ${b.balance >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                          ${Math.abs(b.balance || 0).toLocaleString('es-AR')}
                        </p>
                        <StatusBadge status={b.status} />
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="text-center py-12 bg-slate-50 rounded-lg border border-slate-200">
              <FileBarChart className="w-12 h-12 mx-auto text-slate-300 mb-3" />
              <p className="text-slate-500 text-sm">No hay balances generados para este período</p>
              <p className="text-slate-400 text-xs mt-1">Generá el balance usando el formulario de arriba</p>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}