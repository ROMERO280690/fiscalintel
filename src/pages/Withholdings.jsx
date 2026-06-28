import React, { useState, useEffect } from "react";
import { useCompany } from "@/lib/CompanyContext";
import { base44 } from "@/api/base44Client";
import PageHeader from "@/components/shared/PageHeader";
import StatusBadge from "@/components/shared/StatusBadge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FileCheck, Calculator, Send, CheckCircle, DollarSign } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";

const withholdingTypes = [
  { value: "iibb_local", label: "IIBB - Régimen Local", rate: 3.5 },
  { value: "iibb_cm", label: "IIBB - Convenio Multilateral", rate: 2.5 },
  { value: "iva", label: "Retención IVA", rate: 10.5 },
  { value: "ganancias", label: "Retención Ganancias", rate: 6 },
  { value: "sellos", label: "Sellos", rate: 1.2 },
];

export default function Withholdings() {
  const { selectedCompany } = useCompany();
  const { toast } = useToast();
  const [clients, setClients] = useState([]);
  const [selectedClient, setSelectedClient] = useState(null);
  const [period, setPeriod] = useState("");
  const [withholdings, setWithholdings] = useState([]);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    withholding_type: "iibb_local",
    taxable_base: 0,
    rate: 3.5
  });

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

  const loadWithholdings = async () => {
    if (!selectedClient) return;
    const data = await base44.entities.Withholding.filter({ client_id: selectedClient.id }, "-period", 50);
    setWithholdings(data || []);
  };

  const calculateWithholding = async () => {
    if (!selectedClient) {
      toast({ title: "Seleccioná un cliente", variant: "destructive" });
      return;
    }

    setLoading(true);
    try {
      const result = await base44.functions.invoke('withholdings', {
        action: 'calculate_withholding',
        client_id: selectedClient.id,
        period,
        withholding_type: form.withholding_type,
        taxable_base: form.taxable_base,
        rate: form.rate
      });

      toast({
        title: "Retención calculada",
        description: `$${result.data.amount.toLocaleString('es-AR')} (${form.rate}%)`
      });
      loadWithholdings();
    } catch (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
    setLoading(false);
  };

  const generateCertificates = async () => {
    try {
      const result = await base44.functions.invoke('withholdings', {
        action: 'generate_certificate',
        client_id: selectedClient.id,
        period
      });
      toast({ title: "Certificados generados", description: result.data.message });
      loadWithholdings();
    } catch (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  };

  const submitPayments = async () => {
    try {
      const result = await base44.functions.invoke('withholdings', {
        action: 'submit_payments',
        client_id: selectedClient.id,
        period
      });
      toast({ title: "Presentación exitosa", description: result.data.message });
      loadWithholdings();
    } catch (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  };

  return (
    <div>
      <PageHeader title="Retenciones y Percepciones" subtitle="IIBB, IVA, Ganancias, Sellos">
        <div className="flex gap-2">
          <Button onClick={generateCertificates} variant="outline" className="text-xs">
            <FileCheck className="w-3.5 h-3.5 mr-1" /> Generar Certificados
          </Button>
          <Button onClick={submitPayments} className="bg-[#00C7D9] hover:bg-[#00A8BD] text-xs">
            <Send className="w-3.5 h-3.5 mr-1" /> Presentar Pagos
          </Button>
        </div>
      </PageHeader>

      {/* Formulario */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-sm font-semibold">Nueva Retención</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="text-xs font-medium text-slate-600 mb-1 block">Cliente</label>
              <select
                value={selectedClient?.id || ''}
                onChange={(e) => { setSelectedClient(clients.find(c => c.id === e.target.value)); loadWithholdings(); }}
                className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
              >
                <option value="">Seleccionar cliente...</option>
                {clients.map(c => <option key={c.id} value={c.id}>{c.business_name}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs font-medium text-slate-600 mb-1 block">Tipo</label>
              <select
                value={form.withholding_type}
                onChange={(e) => {
                  const selected = withholdingTypes.find(t => t.value === e.target.value);
                  setForm({ ...form, withholding_type: e.target.value, rate: selected?.rate || 0 });
                }}
                className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
              >
                {withholdingTypes.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs font-medium text-slate-600 mb-1 block">Base Imponible</label>
              <Input
                type="number"
                value={form.taxable_base}
                onChange={(e) => setForm({ ...form, taxable_base: parseFloat(e.target.value) || 0 })}
                className="h-9"
              />
            </div>
            <div className="flex items-end">
              <Button onClick={calculateWithholding} disabled={!selectedClient || loading} className="bg-[#00C7D9] hover:bg-[#00A8BD] w-full">
                {loading ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Calculator className="w-4 h-4 mr-2" />}
                Calcular
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Listado */}
      {withholdings.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-semibold">Retenciones del Período</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {withholdings.map((w) => (
                <div key={w.id} className="flex items-center justify-between p-3 border border-slate-100 rounded-lg">
                  <div>
                    <p className="text-sm font-medium text-slate-900">{w.withholding_type} - {w.period}</p>
                    <p className="text-xs text-slate-500">Base: ${w.taxable_base?.toLocaleString('es-AR')} | Alícuota: {w.rate}%</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-slate-900">${w.amount?.toLocaleString('es-AR')}</p>
                    <StatusBadge status={w.status} />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}