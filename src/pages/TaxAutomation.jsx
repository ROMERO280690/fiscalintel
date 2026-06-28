import React, { useState, useEffect } from "react";
import { useAuth } from "@/lib/AuthContext";
import { useCompany } from "@/lib/CompanyContext";
import { base44 } from "@/api/base44Client";
import PageHeader from "@/components/shared/PageHeader";
import StatusBadge from "@/components/shared/StatusBadge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { 
  Calculator, FileCheck, Send, AlertTriangle, CheckCircle, 
  Clock, DollarSign, FileText, TrendingUp, Users, AlertCircle
} from "lucide-react";
import { useToast } from "@/components/ui/use-toast";

export default function TaxAutomation() {
  const { user } = useAuth();
  const { selectedCompany } = useCompany();
  const { toast } = useToast();

  const [clients, setClients] = useState([]);
  const [selectedClient, setSelectedClient] = useState(null);
  const [period, setPeriod] = useState("");
  const [loading, setLoading] = useState(false);
  const [calculating, setCalculating] = useState(null);
  
  // IVA
  const [ivaData, setIvaData] = useState(null);
  
  // IIBB
  const [iibbData, setIibbData] = useState(null);
  
  // Sueldos
  const [payrollData, setPayrollData] = useState(null);
  
  // Vencimientos
  const [deadlines, setDeadlines] = useState([]);

  useEffect(() => {
    if (selectedCompany) {
      loadClients();
      loadDeadlines();
    }
  }, [selectedCompany]);

  const loadClients = async () => {
    const data = await base44.entities.Client.filter({
      company_id: selectedCompany.id,
      status: 'active'
    });
    setClients(data || []);
    
    // Set current period
    const now = new Date();
    const currentPeriod = `${String(now.getMonth() + 1).padStart(2, '0')}/${now.getFullYear()}`;
    setPeriod(currentPeriod);
  };

  const loadDeadlines = async () => {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    
    // Generar vencimientos del mes
    const vencimientos = [
      { type: 'IVA', due: `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-18`, description: 'IVA F.2072' },
      { type: 'IIBB', due: `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-15`, description: 'IIBB CM' },
      { type: 'Sueldos', due: `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-12`, description: 'F.931' },
      { type: 'Ganancias', due: `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-20`, description: 'Ganancias SIJP' }
    ];
    
    setDeadlines(vencimientos);
  };

  const calculateIVA = async () => {
    if (!selectedClient) {
      toast({
        title: "Seleccioná un cliente",
        description: "Elegí un cliente para calcular el IVA",
        variant: "destructive"
      });
      return;
    }

    setCalculating('iva');
    try {
      const result = await base44.functions.invoke('automaticIVA', {
        action: 'calculate_iva',
        client_id: selectedClient.id,
        period
      });

      setIvaData(result.data);
      toast({
        title: "IVA calculado",
        description: `Débito: $${result.data.debito_fiscal.toLocaleString()} | Crédito: $${result.data.credito_fiscal.toLocaleString()}`
      });
    } catch (error) {
      toast({
        title: "Error calculando IVA",
        description: error.response?.data?.error || error.message,
        variant: "destructive"
      });
    }
    setCalculating(null);
  };

  const calculateIIBB = async () => {
    if (!selectedClient) {
      toast({ title: "Seleccioná un cliente", variant: "destructive" });
      return;
    }

    setCalculating('iibb');
    try {
      const result = await base44.functions.invoke('automaticIIBB', {
        action: 'calculate_iibb',
        client_id: selectedClient.id,
        period
      });

      setIibbData(result.data);
      toast({
        title: "IIBB calculado",
        description: `Base imponible: $${result.data.base_imponible.toLocaleString()} | Impuesto: $${result.data.impuesto.toLocaleString()}`
      });
    } catch (error) {
      toast({
        title: "Error calculando IIBB",
        description: error.response?.data?.error || error.message,
        variant: "destructive"
      });
    }
    setCalculating(null);
  };

  const calculatePayroll = async () => {
    if (!selectedClient) {
      toast({ title: "Seleccioná un cliente", variant: "destructive" });
      return;
    }

    setCalculating('payroll');
    try {
      const result = await base44.functions.invoke('automaticPayroll', {
        action: 'calculate_payroll',
        client_id: selectedClient.id,
        period
      });

      setPayrollData(result.data);
      toast({
        title: "Sueldos calculados",
        description: `${result.data.employees_count} empleados | Bruto: $${result.data.total_gross.toLocaleString()}`
      });
    } catch (error) {
      toast({
        title: "Error calculando sueldos",
        description: error.response?.data?.error || error.message,
        variant: "destructive"
      });
    }
    setCalculating(null);
  };

  const submitDDJJ = async (type) => {
    try {
      let result;
      
      if (type === 'iva') {
        result = await base44.functions.invoke('automaticIVA', {
          action: 'submit_ddjj',
          client_id: selectedClient.id,
          period
        });
      } else if (type === 'iibb') {
        result = await base44.functions.invoke('automaticIIBB', {
          action: 'submit_ddjj',
          client_id: selectedClient.id,
          period
        });
      } else if (type === 'payroll') {
        result = await base44.functions.invoke('automaticPayroll', {
          action: 'submit_f931',
          client_id: selectedClient.id,
          period
        });
      }

      toast({
        title: "Presentación exitosa",
        description: result.data.message || "DDJJ presentada en AFIP",
        variant: "default"
      });

      // Reset data
      if (type === 'iva') setIvaData(null);
      if (type === 'iibb') setIibbData(null);
      if (type === 'payroll') setPayrollData(null);
    } catch (error) {
      toast({
        title: "Error presentando DDJJ",
        description: error.response?.data?.error || error.message,
        variant: "destructive"
      });
    }
  };

  const getDaysUntilDue = (dueDate) => {
    const today = new Date();
    const due = new Date(dueDate);
    const diffTime = due - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const getUrgencyBadge = (days) => {
    if (days < 0) return <Badge variant="destructive">Vencido</Badge>;
    if (days <= 3) return <Badge className="bg-rose-500">Urgente</Badge>;
    if (days <= 7) return <Badge className="bg-amber-500">Próximo</Badge>;
    return <Badge className="bg-emerald-500">A tiempo</Badge>;
  };

  return (
    <div className="p-6">
      <PageHeader 
        title="Automatización Fiscal" 
        subtitle="Contador automático - Presentaciones AFIP"
      >
        <Button className="bg-[#00C7D9] hover:bg-[#00A8BD]">
          <Send className="w-4 h-4 mr-2" />
          Presentar Todo
        </Button>
      </PageHeader>

      {/* Selector de cliente y período */}
      <Card className="mb-6">
        <CardContent className="pt-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="text-xs font-medium text-slate-600 mb-1 block">Cliente</label>
              <select
                value={selectedClient?.id || ''}
                onChange={(e) => setSelectedClient(clients.find(c => c.id === e.target.value))}
                className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#00C7D9]"
              >
                <option value="">Seleccionar cliente...</option>
                {clients.map(client => (
                  <option key={client.id} value={client.id}>
                    {client.business_name}
                  </option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="text-xs font-medium text-slate-600 mb-1 block">Período</label>
              <input
                type="text"
                value={period}
                onChange={(e) => setPeriod(e.target.value)}
                placeholder="MM/YYYY"
                className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#00C7D9]"
              />
            </div>

            <div className="flex items-end">
              <div className="flex gap-2">
                <Button 
                  onClick={calculateIVA}
                  disabled={!selectedClient || calculating}
                  className="bg-blue-600 hover:bg-blue-700 flex-1"
                >
                  {calculating === 'iva' ? (
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <Calculator className="w-4 h-4" />
                  )}
                </Button>
                <Button 
                  onClick={calculateIIBB}
                  disabled={!selectedClient || calculating}
                  className="bg-orange-600 hover:bg-orange-700 flex-1"
                >
                  {calculating === 'iibb' ? (
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <Calculator className="w-4 h-4" />
                  )}
                </Button>
                <Button 
                  onClick={calculatePayroll}
                  disabled={!selectedClient || calculating}
                  className="bg-emerald-600 hover:bg-emerald-700 flex-1"
                >
                  {calculating === 'payroll' ? (
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <Users className="w-4 h-4" />
                  )}
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Vencimientos */}
      <Card className="mb-6">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <Clock className="w-4 h-4 text-[#00C7D9]" />
            Vencimientos del Mes
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
            {deadlines.map((venc, idx) => {
              const days = getDaysUntilDue(venc.due);
              return (
                <div key={idx} className="rounded-lg border border-slate-200 p-3">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-semibold text-slate-700">{venc.type}</span>
                    {getUrgencyBadge(days)}
                  </div>
                  <p className="text-[11px] text-slate-500">{venc.description}</p>
                  <p className="text-xs font-medium text-slate-900 mt-1">
                    {new Date(venc.due).toLocaleDateString('es-AR', { day: 'numeric', month: 'short' })}
                    {days < 0 && ` (-${Math.abs(days)} días)`}
                    {days === 0 && ' (HOY)'}
                    {days > 0 && ` (${days} días)`}
                  </p>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="iva" className="space-y-4">
        <TabsList className="grid grid-cols-3">
          <TabsTrigger value="iva">IVA</TabsTrigger>
          <TabsTrigger value="iibb">IIBB</TabsTrigger>
          <TabsTrigger value="payroll">Sueldos</TabsTrigger>
        </TabsList>

        {/* IVA */}
        <TabsContent value="iva">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <FileText className="w-4 h-4 text-blue-600" />
                IVA - Formulario 2072
              </CardTitle>
            </CardHeader>
            <CardContent>
              {!ivaData ? (
                <div className="text-center py-8 text-slate-500 text-sm">
                  <Calculator className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p>Calculá el IVA del período seleccionado</p>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="rounded-lg bg-blue-50 p-4 border border-blue-200">
                      <p className="text-xs text-blue-700 font-medium mb-1">Débito Fiscal</p>
                      <p className="text-xl font-bold text-blue-900">${ivaData.debito_fiscal.toLocaleString('es-AR')}</p>
                    </div>
                    <div className="rounded-lg bg-emerald-50 p-4 border border-emerald-200">
                      <p className="text-xs text-emerald-700 font-medium mb-1">Crédito Fiscal</p>
                      <p className="text-xl font-bold text-emerald-900">${ivaData.credito_fiscal.toLocaleString('es-AR')}</p>
                    </div>
                  </div>
                  
                  <div className="rounded-lg bg-slate-50 p-4 border border-slate-200">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs text-slate-600 font-medium">IVA a Pagar</p>
                        <p className="text-2xl font-bold text-slate-900 mt-1">
                          ${ivaData.tax_payable.toLocaleString('es-AR')}
                        </p>
                      </div>
                      <Button 
                        onClick={() => submitDDJJ('iva')}
                        className="bg-[#00C7D9] hover:bg-[#00A8BD]"
                      >
                        <Send className="w-4 h-4 mr-2" />
                        Presentar F.2072
                      </Button>
                    </div>
                  </div>

                  {ivaData.observaciones && (
                    <div className="rounded-lg bg-amber-50 p-3 border border-amber-200">
                      <div className="flex items-start gap-2">
                        <AlertTriangle className="w-4 h-4 text-amber-600 mt-0.5" />
                        <div>
                          <p className="text-xs font-semibold text-amber-800">Observaciones</p>
                          <p className="text-xs text-amber-700 mt-1">{ivaData.observaciones}</p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* IIBB */}
        <TabsContent value="iibb">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-orange-600" />
                IIBB - Convenio Multilateral
              </CardTitle>
            </CardHeader>
            <CardContent>
              {!iibbData ? (
                <div className="text-center py-8 text-slate-500 text-sm">
                  <Calculator className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p>Calculá IIBB del período seleccionado</p>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="grid grid-cols-3 gap-4">
                    <div className="rounded-lg bg-orange-50 p-4 border border-orange-200">
                      <p className="text-xs text-orange-700 font-medium mb-1">Base Imponible</p>
                      <p className="text-lg font-bold text-orange-900">${iibbData.base_imponible.toLocaleString('es-AR')}</p>
                    </div>
                    <div className="rounded-lg bg-blue-50 p-4 border border-blue-200">
                      <p className="text-xs text-blue-700 font-medium mb-1">Coeficiente</p>
                      <p className="text-lg font-bold text-blue-900">{(iibbData.coefficient * 100).toFixed(2)}%</p>
                    </div>
                    <div className="rounded-lg bg-emerald-50 p-4 border border-emerald-200">
                      <p className="text-xs text-emerald-700 font-medium mb-1">Impuesto</p>
                      <p className="text-lg font-bold text-emerald-900">${iibbData.impuesto.toLocaleString('es-AR')}</p>
                    </div>
                  </div>
                  
                  <div className="rounded-lg bg-slate-50 p-4 border border-slate-200">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs text-slate-600 font-medium">Total a Pagar</p>
                        <p className="text-2xl font-bold text-slate-900 mt-1">
                          ${iibbData.impuesto.toLocaleString('es-AR')}
                        </p>
                      </div>
                      <Button 
                        onClick={() => submitDDJJ('iibb')}
                        className="bg-[#00C7D9] hover:bg-[#00A8BD]"
                      >
                        <Send className="w-4 h-4 mr-2" />
                        Presentar IIBB
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Sueldos */}
        <TabsContent value="payroll">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <Users className="w-4 h-4 text-emerald-600" />
                Sueldos - F.931
              </CardTitle>
            </CardHeader>
            <CardContent>
              {!payrollData ? (
                <div className="text-center py-8 text-slate-500 text-sm">
                  <Calculator className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p>Calculá sueldos del período seleccionado</p>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="rounded-lg bg-slate-50 p-3 border border-slate-200">
                      <p className="text-xs text-slate-600 font-medium mb-1">Empleados</p>
                      <p className="text-lg font-bold text-slate-900">{payrollData.employees_count}</p>
                    </div>
                    <div className="rounded-lg bg-blue-50 p-3 border border-blue-200">
                      <p className="text-xs text-blue-700 font-medium mb-1">Bruto Total</p>
                      <p className="text-lg font-bold text-blue-900">${payrollData.total_gross.toLocaleString('es-AR')}</p>
                    </div>
                    <div className="rounded-lg bg-emerald-50 p-3 border border-emerald-200">
                      <p className="text-xs text-emerald-700 font-medium mb-1">Neto Total</p>
                      <p className="text-lg font-bold text-emerald-900">${payrollData.total_net.toLocaleString('es-AR')}</p>
                    </div>
                    <div className="rounded-lg bg-orange-50 p-3 border border-orange-200">
                      <p className="text-xs text-orange-700 font-medium mb-1">Contribuciones</p>
                      <p className="text-lg font-bold text-orange-900">${payrollData.total_contributions.toLocaleString('es-AR')}</p>
                    </div>
                  </div>

                  {payrollData.payslips && (
                    <div className="rounded-lg border border-slate-200">
                      <div className="bg-slate-50 px-4 py-2 border-b border-slate-200">
                        <p className="text-xs font-semibold text-slate-700">Detalle de Recibos</p>
                      </div>
                      <div className="divide-y divide-slate-100">
                        {payrollData.payslips.map((payslip, idx) => (
                          <div key={idx} className="p-3 flex items-center justify-between">
                            <div>
                              <p className="text-sm font-medium text-slate-900">{payslip.employee_name}</p>
                              <p className="text-xs text-slate-500">Neto: ${payslip.net_salary.toLocaleString('es-AR')}</p>
                            </div>
                            <Badge variant="outline">Aprobado</Badge>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  <div className="rounded-lg bg-slate-50 p-4 border border-slate-200">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs text-slate-600 font-medium">F.931 a Presentar</p>
                        <p className="text-xs text-slate-500 mt-1">
                          Vencimiento: {new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toLocaleDateString('es-AR')}
                        </p>
                      </div>
                      <Button 
                        onClick={() => submitDDJJ('payroll')}
                        className="bg-[#00C7D9] hover:bg-[#00A8BD]"
                      >
                        <Send className="w-4 h-4 mr-2" />
                        Presentar F.931
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}