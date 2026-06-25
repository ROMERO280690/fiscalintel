import React from "react";
import { X, Edit, Trash2, Mail, Phone, MapPin, Building2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import StatusBadge from "@/components/shared/StatusBadge";

const clientTypeLabels = {
  monotributista: "Monotributista",
  responsable_inscripto: "Resp. Inscripto",
  autonomo: "Autónomo",
  sas: "SAS", srl: "SRL", sa: "SA",
  cooperativa: "Cooperativa", agro: "Agro", pyme: "PyME",
};

export default function ClientDetail({ client, onClose, onEdit, onDelete }) {
  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="absolute inset-0 bg-black/30" onClick={onClose} />
      <div className="relative bg-white w-full max-w-md h-full overflow-y-auto shadow-xl">
        <div className="sticky top-0 bg-white z-10 flex items-center justify-between p-5 border-b border-slate-100">
          <h2 className="text-base font-bold text-[#1A1A2E]">Detalle del Cliente</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600"><X className="w-5 h-5" /></button>
        </div>

        <div className="p-5 space-y-5">
          <div>
            <h3 className="text-lg font-bold text-[#1A1A2E]">{client.business_name}</h3>
            {client.fantasy_name && <p className="text-[13px] text-slate-500">{client.fantasy_name}</p>}
            <div className="flex items-center gap-2 mt-2">
              <StatusBadge status={client.status} />
              <StatusBadge status={client.risk_level || "low"} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <InfoItem label="CUIT" value={client.cuit} mono />
            <InfoItem label="Tipo" value={clientTypeLabels[client.client_type] || client.client_type} />
            <InfoItem label="Categoría" value={client.tax_category} />
            <InfoItem label="Cumplimiento" value={`${client.compliance_score || 0}%`} />
          </div>

          <div className="space-y-2">
            {client.email && (
              <div className="flex items-center gap-2 text-[13px] text-slate-600">
                <Mail className="w-3.5 h-3.5 text-slate-400" /> {client.email}
              </div>
            )}
            {client.phone && (
              <div className="flex items-center gap-2 text-[13px] text-slate-600">
                <Phone className="w-3.5 h-3.5 text-slate-400" /> {client.phone}
              </div>
            )}
            {client.address && (
              <div className="flex items-center gap-2 text-[13px] text-slate-600">
                <MapPin className="w-3.5 h-3.5 text-slate-400" /> {client.address}{client.city ? `, ${client.city}` : ""}{client.province ? `, ${client.province}` : ""}
              </div>
            )}
            {client.activity && (
              <div className="flex items-center gap-2 text-[13px] text-slate-600">
                <Building2 className="w-3.5 h-3.5 text-slate-400" /> {client.activity}
              </div>
            )}
          </div>

          {client.notes && (
            <div>
              <p className="text-[11px] font-semibold text-slate-500 uppercase mb-1">Notas</p>
              <p className="text-[13px] text-slate-600 bg-slate-50 rounded-lg p-3">{client.notes}</p>
            </div>
          )}

          <div className="flex gap-2 pt-2">
            <Button onClick={() => onEdit(client)} variant="outline" className="flex-1 text-xs">
              <Edit className="w-3.5 h-3.5 mr-1" /> Editar
            </Button>
            <Button onClick={() => { if (confirm("¿Eliminar este cliente?")) onDelete(client.id); }} variant="outline" className="text-xs text-rose-600 border-rose-200 hover:bg-rose-50">
              <Trash2 className="w-3.5 h-3.5" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

function InfoItem({ label, value, mono }) {
  return (
    <div>
      <p className="text-[11px] font-semibold text-slate-500 uppercase">{label}</p>
      <p className={`text-[13px] font-medium text-[#1A1A2E] ${mono ? "font-mono" : ""}`}>{value || "—"}</p>
    </div>
  );
}