import React, { useState } from "react";
import { X, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const taskTypes = [
  { value: "general", label: "General" },
  { value: "ddjj_iva", label: "DDJJ IVA" },
  { value: "ddjj_iibb", label: "DDJJ IIBB" },
  { value: "ddjj_ganancias", label: "DDJJ Ganancias" },
  { value: "monotributo", label: "Monotributo" },
  { value: "sueldos", label: "Sueldos" },
  { value: "sociedades", label: "Sociedades" },
  { value: "audit", label: "Auditoría" },
  { value: "vencimiento", label: "Vencimiento" },
];

export default function TaskForm({ task, clients, onSave, onDelete, onClose }) {
  const [form, setForm] = useState({
    title: task?.title || "",
    description: task?.description || "",
    client_id: task?.client_id || "",
    client_name: task?.client_name || "",
    task_type: task?.task_type || "general",
    status: task?.status || "pending",
    priority: task?.priority || "medium",
    due_date: task?.due_date || "",
    assigned_to: task?.assigned_to || "",
    period: task?.period || "",
  });
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    const selectedClient = clients.find(c => c.id === form.client_id);
    await onSave({ ...form, client_name: selectedClient?.business_name || form.client_name });
    setSaving(false);
  };

  const update = (field, value) => setForm(prev => ({ ...prev, [field]: value }));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto m-4">
        <div className="sticky top-0 bg-white flex items-center justify-between p-5 border-b border-slate-100 rounded-t-2xl">
          <h2 className="text-base font-bold text-[#1A1A2E]">{task ? "Editar Tarea" : "Nueva Tarea"}</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600"><X className="w-5 h-5" /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div>
            <Label className="text-[12px] font-medium text-slate-600">Título *</Label>
            <Input value={form.title} onChange={e => update("title", e.target.value)} required className="mt-1 text-[13px] h-9" />
          </div>
          <div>
            <Label className="text-[12px] font-medium text-slate-600">Descripción</Label>
            <textarea value={form.description} onChange={e => update("description", e.target.value)} rows={2} className="mt-1 w-full rounded-md border border-slate-200 px-3 py-2 text-[13px] focus:outline-none focus:ring-2 focus:ring-[#00C7D9]/20" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-[12px] font-medium text-slate-600">Cliente</Label>
              <select value={form.client_id} onChange={e => update("client_id", e.target.value)} className="mt-1 w-full h-9 px-3 rounded-md border border-slate-200 text-[13px] bg-white focus:outline-none focus:ring-2 focus:ring-[#00C7D9]/20">
                <option value="">Sin cliente</option>
                {clients.map(c => <option key={c.id} value={c.id}>{c.business_name}</option>)}
              </select>
            </div>
            <div>
              <Label className="text-[12px] font-medium text-slate-600">Tipo</Label>
              <select value={form.task_type} onChange={e => update("task_type", e.target.value)} className="mt-1 w-full h-9 px-3 rounded-md border border-slate-200 text-[13px] bg-white focus:outline-none focus:ring-2 focus:ring-[#00C7D9]/20">
                {taskTypes.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
              </select>
            </div>
            <div>
              <Label className="text-[12px] font-medium text-slate-600">Prioridad</Label>
              <select value={form.priority} onChange={e => update("priority", e.target.value)} className="mt-1 w-full h-9 px-3 rounded-md border border-slate-200 text-[13px] bg-white focus:outline-none focus:ring-2 focus:ring-[#00C7D9]/20">
                <option value="low">Baja</option>
                <option value="medium">Media</option>
                <option value="high">Alta</option>
                <option value="urgent">Urgente</option>
              </select>
            </div>
            <div>
              <Label className="text-[12px] font-medium text-slate-600">Estado</Label>
              <select value={form.status} onChange={e => update("status", e.target.value)} className="mt-1 w-full h-9 px-3 rounded-md border border-slate-200 text-[13px] bg-white focus:outline-none focus:ring-2 focus:ring-[#00C7D9]/20">
                <option value="pending">Pendiente</option>
                <option value="in_progress">En Progreso</option>
                <option value="review">Revisión</option>
                <option value="completed">Completada</option>
              </select>
            </div>
            <div>
              <Label className="text-[12px] font-medium text-slate-600">Fecha límite</Label>
              <Input type="date" value={form.due_date} onChange={e => update("due_date", e.target.value)} className="mt-1 text-[13px] h-9" />
            </div>
            <div>
              <Label className="text-[12px] font-medium text-slate-600">Período Fiscal</Label>
              <Input value={form.period} onChange={e => update("period", e.target.value)} placeholder="MM/YYYY" className="mt-1 text-[13px] h-9" />
            </div>
          </div>
          <div className="flex justify-between pt-2">
            <div>
              {onDelete && (
                <Button type="button" variant="outline" onClick={() => { if (confirm("¿Eliminar esta tarea?")) onDelete(); }} className="text-xs text-rose-600 border-rose-200 hover:bg-rose-50">
                  <Trash2 className="w-3.5 h-3.5 mr-1" /> Eliminar
                </Button>
              )}
            </div>
            <div className="flex gap-2">
              <Button type="button" variant="outline" onClick={onClose} className="text-xs">Cancelar</Button>
              <Button type="submit" disabled={saving} className="bg-[#00C7D9] hover:bg-[#00A8BD] text-white text-xs">
                {saving ? "Guardando..." : task ? "Actualizar" : "Crear Tarea"}
              </Button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}