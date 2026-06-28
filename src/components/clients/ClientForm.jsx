import React, { useState } from "react";
import { X, Search, CheckCircle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { base44 } from "@/api/base44Client";

const clientTypes = [
  { value: "monotributista", label: "Monotributista" },
  { value: "responsable_inscripto", label: "Responsable Inscripto" },
  { value: "autonomo", label: "Autónomo" },
  { value: "sas", label: "SAS" },
  { value: "srl", label: "SRL" },
  { value: "sa", label: "SA" },
  { value: "cooperativa", label: "Cooperativa" },
  { value: "agro", label: "Agro" },
  { value: "pyme", label: "PyME" },
];

export default function ClientForm({ client, onSave, onClose }) {
  const [form, setForm] = useState({
    business_name: client?.business_name || "",
    fantasy_name: client?.fantasy_name || "",
    cuit: client?.cuit || "",
    client_type: client?.client_type || "monotributista",
    email: client?.email || "",
    phone: client?.phone || "",
    address: client?.address || "",
    city: client?.city || "",
    province: client?.province || "",
    activity: client?.activity || "",
    activity_code: client?.activity_code || "",
    tax_category: client?.tax_category || "",
    notes: client?.notes || "",
  });
  const [saving, setSaving] = useState(false);
  const [consulting, setConsulting] = useState(false);
  const [consulted, setConsulted] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    await onSave(form);
    setSaving(false);
  };

  const update = (field, value) => setForm(prev => ({ ...prev, [field]: value }));

  const consultarAFIP = async () => {
    if (form.cuit.length < 10) return;
    
    setConsulting(true);
    try {
      const result = await base44.functions.invoke('consultaAFIP', { cuit: form.cuit });
      
      if (result.data?.found) {
        setForm(prev => ({
          ...prev,
          business_name: result.data.business_name || prev.business_name,
          fantasy_name: result.data.fantasy_name || prev.fantasy_name,
          address: result.data.address || prev.address,
          city: result.data.city || prev.city,
          province: result.data.province || prev.province,
          activity: result.data.activity || prev.activity,
          client_type: result.data.client_type || prev.client_type,
        }));
        setConsulted(true);
      } else if (result.data?.inferred_type) {
        // Si no encontró datos, al menos inferimos el tipo por el CUIT
        setForm(prev => ({ ...prev, client_type: result.data.inferred_type }));
      }
    } catch (error) {
      // Error silencioso - el usuario completa manual
      console.log('Consulta AFIP no disponible - carga manual');
    }
    setConsulting(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto m-4">
        <div className="sticky top-0 bg-white flex items-center justify-between p-5 border-b border-slate-100 rounded-t-2xl">
          <h2 className="text-base font-bold text-[#1A1A2E]">{client ? "Editar Cliente" : "Nuevo Cliente"}</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600"><X className="w-5 h-5" /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <Label className="text-[12px] font-medium text-slate-600">Razón Social *</Label>
              <Input value={form.business_name} onChange={e => update("business_name", e.target.value)} required className="mt-1 text-[13px] h-9" />
            </div>
            <div>
              <Label className="text-[12px] font-medium text-slate-600">Nombre de Fantasía</Label>
              <Input value={form.fantasy_name} onChange={e => update("fantasy_name", e.target.value)} className="mt-1 text-[13px] h-9" />
            </div>
            <div>
              <Label className="text-[12px] font-medium text-slate-600">CUIT *</Label>
              <div className="flex gap-2 mt-1">
                <Input 
                  value={form.cuit} 
                  onChange={e => {
                    update("cuit", e.target.value);
                    setConsulted(false);
                  }} 
                  onBlur={consultarAFIP}
                  placeholder="XX-XXXXXXXX-X" 
                  required 
                  className="text-[13px] h-9 font-mono flex-1" 
                />
                {consulting && (
                  <Button type="button" disabled className="bg-blue-600 h-9 w-9">
                    <Loader2 className="w-4 h-4 animate-spin" />
                  </Button>
                )}
                {consulted && !consulting && (
                  <Button type="button" disabled className="bg-emerald-600 h-9 w-9">
                    <CheckCircle className="w-4 h-4" />
                  </Button>
                )}
                {!consulted && !consulting && form.cuit.length >= 10 && (
                  <Button type="button" onClick={consultarAFIP} className="bg-blue-600 hover:bg-blue-700 h-9 w-9">
                    <Search className="w-4 h-4" />
                  </Button>
                )}
              </div>
              <p className="text-[10px] text-slate-500 mt-1">
                {consulted ? '✓ Datos validados en AFIP' : 'Completá manualmente o esperá la validación automática'}
              </p>
            </div>
            <div>
              <Label className="text-[12px] font-medium text-slate-600">Tipo de Contribuyente *</Label>
              <select value={form.client_type} onChange={e => update("client_type", e.target.value)} className="mt-1 w-full h-9 px-3 rounded-md border border-slate-200 text-[13px] bg-white focus:outline-none focus:ring-2 focus:ring-[#00C7D9]/20">
                {clientTypes.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
              </select>
            </div>
            <div>
              <Label className="text-[12px] font-medium text-slate-600">Categoría Impositiva</Label>
              <Input value={form.tax_category} onChange={e => update("tax_category", e.target.value)} className="mt-1 text-[13px] h-9" />
            </div>
            <div>
              <Label className="text-[12px] font-medium text-slate-600">Email</Label>
              <Input type="email" value={form.email} onChange={e => update("email", e.target.value)} className="mt-1 text-[13px] h-9" />
            </div>
            <div>
              <Label className="text-[12px] font-medium text-slate-600">Teléfono</Label>
              <Input value={form.phone} onChange={e => update("phone", e.target.value)} className="mt-1 text-[13px] h-9" />
            </div>
            <div className="col-span-2">
              <Label className="text-[12px] font-medium text-slate-600">Actividad Principal</Label>
              <Input value={form.activity} onChange={e => update("activity", e.target.value)} className="mt-1 text-[13px] h-9" />
            </div>
            <div className="col-span-2">
              <Label className="text-[12px] font-medium text-slate-600">Dirección</Label>
              <Input value={form.address} onChange={e => update("address", e.target.value)} className="mt-1 text-[13px] h-9" />
            </div>
            <div>
              <Label className="text-[12px] font-medium text-slate-600">Ciudad</Label>
              <Input value={form.city} onChange={e => update("city", e.target.value)} className="mt-1 text-[13px] h-9" />
            </div>
            <div>
              <Label className="text-[12px] font-medium text-slate-600">Provincia</Label>
              <Input value={form.province} onChange={e => update("province", e.target.value)} className="mt-1 text-[13px] h-9" />
            </div>
          </div>
          <div>
            <Label className="text-[12px] font-medium text-slate-600">Notas</Label>
            <textarea value={form.notes} onChange={e => update("notes", e.target.value)} rows={3} className="mt-1 w-full rounded-md border border-slate-200 px-3 py-2 text-[13px] focus:outline-none focus:ring-2 focus:ring-[#00C7D9]/20" />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={onClose} className="text-xs">Cancelar</Button>
            <Button type="submit" disabled={saving} className="bg-[#00C7D9] hover:bg-[#00A8BD] text-white text-xs">
              {saving ? "Guardando..." : client ? "Actualizar" : "Crear Cliente"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}