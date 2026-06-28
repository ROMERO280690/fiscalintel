import React, { useState, useEffect } from "react";
import { useCompany } from "@/lib/CompanyContext";
import { base44 } from "@/api/base44Client";
import PageHeader from "@/components/shared/PageHeader";
import StatusBadge from "@/components/shared/StatusBadge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calculator, TrendingUp, AlertTriangle, CheckCircle, Clock, DollarSign } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";

const categories = ["A", "B", "C", "D", "E", "F", "G", "H", "I", "J", "K", "L", "M", "N"];
const activityTypes = [
  { value: "venta_cosas_muebles", label: "Venta de cosas muebles" },
  { value: "servicios_capital", label: "Prestación de servicios (Capital)" },
  { value: "servicios_interior", label: "Prestación de servicios (Interior)" },
  { value: "mixta", label: "Actividad mixta" },
];
const locations = [
  { value: "capital_federal", label: "Capital Federal" },
  { value: "interior", label: "Interior del país" },
];

export default function Monotributo() {
  const { selectedCompany } = useCompany();
  const { toast } = useToast();
  const [clients, setClients] = useState([]);
  const [selectedClient, setSelectedClient] = useState(null);
  const [period, setPeriod] = useState("");
  const [loading, setLoading] = useState(false);
  const [monotributos, setMonotributos] = useState([]);
  const [recategorizacion, setRecategorizacion] = useState(null);

  useEffect(() => {
    if (selectedCompany) {
      loadClients();
      const now = new Date();
      setPeriod(`${String(now.getMonth() + 1).padStart(2, '0')}/${now.getFullYear()}`);
    }
  }, [selectedCompany]);

  const loadClients = async () => {
    const data = await base44.entities.Client.filter({ company_id: selectedCompany.id, client_type: "monotributista", status: "active" });
    setClients(data || []);
  };

  const loadMonotributos = async () => {
    if (!selectedClient) return;
    const data = await base44.entities.Monotributo.filter({ client_id: selectedClient.id }, "-period", 12);
    setMonotributos(data || []);
  };

  const calculateFee = async () => {
    if (!selectedClient) {
      toast({ title: "Seleccioná un cliente", variant: "destructive" });
      return;
    }

    setLoading(true);
    try {
      const result = await base44.functions.invoke('automaticMonotributo', {
        action: 'calculate_fee',
        client_id: selectedClient.id,
        period,
        category: selectedClient.monotributo_category || 'A',
        activity_type: 'servicios_interior',
        location: 'interior'
      });

      toast({
        title: "Cuota calculada",
        description: `Categoría ${result.data.category} - $${result.data.monthly_fee.toLocaleString('es-AR')}`
      });
      loadMonotributos();
    } catch (error) {
      toast({ title: "Error calculando", description: error.message, variant: "destructive" });
    }
    setLoading(false);
  };

  const checkRecategorization = async () => {
    if (!selectedClient) return;

    try {
      const result = await base44.functions.invoke('automaticMonotributo', {
        action: 'check_recategorization',
        client_id: selectedClient.id
      });
      setRecategorizacion(result.data);
      
      if (result.data.needs_recategorization) {
        toast({
          title: "⚠️ Recategorización requerida",
          description: result.data.message,
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <div>
      <PageHeader title="Monotributo" subtitle="Cálculo de cuotas y recategorización">
        <Button onClick={checkRecategorization} variant="outline" className="text-xs">
          <AlertTriangle className="w-3.5 h-3.5 mr-1" /> Verificar Recategorización
        </Button>
      </PageHeader>

      {/* Selector */}
      <Card className="mb-6">
        <CardContent className="pt-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="text-xs font-medium text-slate-600 mb-1 block">Cliente</label>
              <select
                value={selectedClient?.id || ''}
                onChange={(e) => { setSelectedClient(clients.find(c => c.id === e.target.value)); loadMonotributos(); }}
                className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
              >
                <option value="">Seleccionar monotributista...</option>
                {clients.map(c => <option key={c.id} value={c.id}>{c.business_name} ({c.monotributo_category || 'N/A'})</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs font-medium text-slate-600 mb-1 block">Período</label>
              <Input type="text" value={period} onChange={(e) => setPeriod(e.target.value)} placeholder="MM/YYYY" className="h-9" />
            </div>
            <div className="flex items-end">
              <Button onClick={calculateFee} disabled={!selectedClient || loading} className="bg-[#00C7D9] hover:bg-[#00A8BD] w-full">
                {loading ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Calculator className="w-4 h-4 mr-2" />}
                Calcular Cuota
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Alerta recategorización */}
      {recategorizacion && (
        <Card className="mb-6 bg-amber-50 border-amber-200">
          <CardContent className="pt-4">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-amber-600 mt-0.5" />
              <div>
                <p className="text-sm font-semibold text-amber-800">Estado de Recategorización</p>
                <p className="text-sm text-amber-700 mt-1">{recategorizacion.message}</p>
                <p className="text-xs text-amber-600 mt-2">
                  Categoría actual: {recategorizacion.current_category} | Ingresos anuales: ${recategorizacion.annual_income?.toLocaleString('es-AR')}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Historial */}
      {monotributos.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-semibold">Historial de Cuotas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {monotributos.map((m) => (
                <div key={m.id} className="flex items-center justify-between p-3 border border-slate-100 rounded-lg">
                  <div>
                    <p className="text-sm font-medium text-slate-900">{m.period}</p>
                    <p className="text-xs text-slate-500">Categoría {m.category} - {m.activity_type}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-slate-900">${m.monthly_fee?.toLocaleString('es-AR')}</p>
                    <StatusBadge status={m.status} />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {clients.length === 0 && (
        <div className="text-center py-12">
          <TrendingUp className="w-12 h-12 mx-auto text-slate-300 mb-3" />
          <p className="text-slate-500">No hay clientes monotributistas</p>
          <a href="/clients" className="text-[#00C7D9] text-sm hover:underline">Crear cliente monotributista</a>
        </div>
      )}
    </div>
  );
}