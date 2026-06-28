import React from "react";

const statusConfig = {
  active: { label: "Activo", className: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  inactive: { label: "Inactivo", className: "bg-slate-50 text-slate-500 border-slate-200" },
  suspended: { label: "Suspendido", className: "bg-rose-50 text-rose-600 border-rose-200" },
  low: { label: "Bajo", className: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  medium: { label: "Medio", className: "bg-amber-50 text-amber-700 border-amber-200" },
  high: { label: "Alto", className: "bg-orange-50 text-orange-700 border-orange-200" },
  critical: { label: "Crítico", className: "bg-rose-50 text-rose-700 border-rose-200" },
  urgent: { label: "Urgente", className: "bg-rose-50 text-rose-700 border-rose-200" },
  pending: { label: "Pendiente", className: "bg-amber-50 text-amber-700 border-amber-200" },
  pending_review: { label: "Pend. Revisión", className: "bg-amber-50 text-amber-700 border-amber-300" },
  in_progress: { label: "En Progreso", className: "bg-blue-50 text-blue-700 border-blue-200" },
  review: { label: "Revisión", className: "bg-purple-50 text-purple-700 border-purple-200" },
  completed: { label: "Completada", className: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  overdue: { label: "Vencida", className: "bg-rose-50 text-rose-700 border-rose-200" },
  uploaded: { label: "Cargado", className: "bg-slate-50 text-slate-600 border-slate-200" },
  processing: { label: "Procesando", className: "bg-cyan-50 text-cyan-700 border-cyan-200" },
  classified: { label: "Clasificado", className: "bg-blue-50 text-blue-700 border-blue-200" },
  reviewed: { label: "Revisado", className: "bg-purple-50 text-purple-700 border-purple-200" },
  approved: { label: "Aprobado", className: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  rejected: { label: "Rechazado", className: "bg-rose-50 text-rose-700 border-rose-200" },
  draft: { label: "Borrador", className: "bg-slate-50 text-slate-600 border-slate-200" },
  ai_generated: { label: "IA Generado", className: "bg-cyan-50 text-cyan-700 border-cyan-200" },
  submitted: { label: "Presentada", className: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  rectified: { label: "Rectificada", className: "bg-amber-50 text-amber-700 border-amber-200" },
};

export default function StatusBadge({ status }) {
  const config = statusConfig[status] || { label: status, className: "bg-slate-50 text-slate-600 border-slate-200" };
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold border ${config.className}`}>
      {config.label}
    </span>
  );
}