import React, { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { Calendar as CalendarIcon, Filter, Clock, AlertTriangle, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import StatusBadge from "@/components/shared/StatusBadge";
import DarkCard from "./DarkCard";

const MONTHS = [
  "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
  "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"
];

const OBLIGATION_LABELS = {
  iva: "IVA",
  iibb: "Ingresos Brutos",
  monotributo: "Monotributo",
  autonomos: "Autónomos",
  ganancias: "Ganancias",
  bienes_personales: "Bienes Personales",
  sueldos: "Sueldos",
  f931: "F931",
  sociedades: "Sociedades",
  municipal: "Tasas Municipales",
  otro: "Otro",
};

export default function TaxDeadlineCalendar({ activeCompanyId }) {
  const [deadlines, setDeadlines] = useState([]);
  const [clients, setClients] = useState([]);
  const [selectedClient, setSelectedClient] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      base44.entities.TaxDeadline.list("-due_date", 200),
      base44.entities.Client.list("-created_date", 200),
    ]).then(([d, c]) => {
      setDeadlines(d);
      setClients(c);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [activeCompanyId]);

  // Filtrar por empresa y cliente
  const filteredDeadlines = deadlines.filter(d => {
    if (activeCompanyId && d.company_id !== activeCompanyId) return false;
    if (selectedClient && d.client_id !== selectedClient) return false;
    return true;
  });

  // Agrupar por mes
  const today = new Date();
  const currentMonth = today.getMonth();
  const nextMonth = (currentMonth + 1) % 12;

  const getDaysInMonth = (month) => {
    return new Date(today.getFullYear(), month + 1, 0).getDate();
  };

  const getDeadlinesForDay = (day, month) => {
    return filteredDeadlines.filter(d => {
      const dDate = new Date(d.due_date);
      return dDate.getDate() === day && dDate.getMonth() === month;
    });
  };

  const upcomingDeadlines = filteredDeadlines
    .filter(d => {
      const dDate = new Date(d.due_date);
      const diffTime = dDate - today;
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      return diffDays >= 0 && diffDays <= 30 && d.status !== "completed";
    })
    .sort((a, b) => new Date(a.due_date) - new Date(b.due_date))
    .slice(0, 8);

  const stats = {
    pending: filteredDeadlines.filter(d => d.status === "pending").length,
    completed: filteredDeadlines.filter(d => d.status === "completed").length,
    overdue: filteredDeadlines.filter(d => d.status === "overdue").length,
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-48 bg-gradient-to-br from-slate-900 to-slate-800 rounded-2xl">
        <div className="w-8 h-8 border-4 border-slate-700 border-t-[#00C7D9] rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <DarkCard title="Calendario de Vencimientos Fiscales" icon={CalendarIcon} iconColor="text-cyan-400">
      {/* Filtro por cliente */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Filter className="w-3.5 h-3.5 text-white/40" />
          <select
            value={selectedClient}
            onChange={e => setSelectedClient(e.target.value)}
            className="bg-white/5 border border-white/10 rounded-md px-2 py-1 text-[11px] text-white/70 focus:outline-none focus:ring-1 focus:ring-[#00C7D9]/30"
          >
            <option value="">Todos los clientes</option>
            {clients.map(c => (
              <option key={c.id} value={c.id}>{c.business_name}</option>
            ))}
          </select>
        </div>

        <div className="flex gap-2">
          <div className="flex items-center gap-1 text-[10px] text-white/50">
            <div className="w-2 h-2 rounded-full bg-emerald-500" />
            <span>Completado ({stats.completed})</span>
          </div>
          <div className="flex items-center gap-1 text-[10px] text-white/50">
            <div className="w-2 h-2 rounded-full bg-amber-500" />
            <span>Pendiente ({stats.pending})</span>
          </div>
          <div className="flex items-center gap-1 text-[10px] text-white/50">
            <div className="w-2 h-2 rounded-full bg-rose-500" />
            <span>Vencido ({stats.overdue})</span>
          </div>
        </div>
      </div>

      {/* Calendario mes actual */}
      <div className="grid grid-cols-2 gap-3 mb-3">
        {/* Mes actual */}
        <div className="bg-white/3 rounded-xl p-3 border border-white/5">
          <h4 className="text-[11px] font-semibold text-white/90 mb-2 uppercase tracking-wider">
            {MONTHS[currentMonth]} {today.getFullYear()}
          </h4>
          <div className="grid grid-cols-7 gap-0.5 text-[9px] text-white/40 mb-1">
            {["D", "L", "M", "M", "J", "V", "S"].map(d => (
              <div key={d} className="text-center py-1">{d}</div>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-0.5">
            {Array.from({ length: getDaysInMonth(currentMonth) }, (_, i) => i + 1).map(day => {
              const dayDeadlines = getDeadlinesForDay(day, currentMonth);
              const hasOverdue = dayDeadlines.some(d => d.status === "overdue");
              const hasPending = dayDeadlines.some(d => d.status === "pending");
              const hasCompleted = dayDeadlines.every(d => d.status === "completed");

              return (
                <div
                  key={day}
                  className={`aspect-square rounded-md flex items-center justify-center text-[10px] relative ${
                    dayDeadlines.length > 0
                      ? hasOverdue
                        ? "bg-rose-500/20 border border-rose-500/30 text-rose-300"
                        : hasPending
                        ? "bg-amber-500/20 border border-amber-500/30 text-amber-300"
                        : "bg-emerald-500/20 border border-emerald-500/30 text-emerald-300"
                      : "text-white/30"
                  }`}
                >
                  {day}
                  {dayDeadlines.length > 0 && (
                    <span className="absolute -bottom-0.5 -right-0.5 w-2 h-2 rounded-full bg-white/20" />
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Próximos vencimientos (lista) */}
        <div className="bg-white/3 rounded-xl p-3 border border-white/5">
          <h4 className="text-[11px] font-semibold text-white/90 mb-2 uppercase tracking-wider flex items-center gap-1.5">
            <Clock className="w-3 h-3 text-amber-400" />
            Próximos 7 Días
          </h4>
          <div className="space-y-1.5 max-h-40 overflow-y-auto">
            {upcomingDeadlines.length > 0 ? (
              upcomingDeadlines.map(d => {
                const dueDate = new Date(d.due_date);
                const diffTime = dueDate - today;
                const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                const client = clients.find(c => c.id === d.client_id);

                return (
                  <div
                    key={d.id}
                    className={`flex items-center justify-between p-2 rounded-lg border ${
                      diffDays === 0
                        ? "bg-rose-500/10 border-rose-500/20"
                        : diffDays <= 3
                        ? "bg-amber-500/10 border-amber-500/20"
                        : "bg-white/3 border-white/5"
                    }`}
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-[10px] text-white/80 truncate">
                        {OBLIGATION_LABELS[d.obligation_type] || d.obligation_type} — {client?.business_name || "Cliente"}
                      </p>
                      <p className="text-[9px] text-white/40">
                        {d.period || "Sin período"}
                      </p>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className={`text-[9px] font-semibold px-1.5 py-0.5 rounded-full ${
                        diffDays === 0
                          ? "bg-rose-500/20 text-rose-400"
                          : diffDays <= 3
                          ? "bg-amber-500/20 text-amber-400"
                          : "bg-white/10 text-white/40"
                      }`}>
                        {diffDays === 0 ? "Hoy" : diffDays === 1 ? "Mañana" : `En ${diffDays} días`}
                      </span>
                      {d.status === "completed" && <CheckCircle className="w-3 h-3 text-emerald-400" />}
                      {d.status === "overdue" && <AlertTriangle className="w-3 h-3 text-rose-400" />}
                    </div>
                  </div>
                );
              })
            ) : (
              <p className="text-[10px] text-white/40 text-center py-4">
                No hay vencimientos próximos
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Todos los vencimientos del mes */}
      <div>
        <h4 className="text-[11px] font-semibold text-white/90 mb-2 uppercase tracking-wider">
          Todos los Vencimientos ({filteredDeadlines.length})
        </h4>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 max-h-48 overflow-y-auto">
          {filteredDeadlines.slice(0, 12).map(d => {
            const dueDate = new Date(d.due_date);
            const client = clients.find(c => c.id === d.client_id);
            const isToday = dueDate.toDateString() === today.toDateString();
            const isOverdue = dueDate < today && d.status !== "completed";

            return (
              <div
                key={d.id}
                className={`flex items-center justify-between p-2 rounded-lg border ${
                  isOverdue
                    ? "bg-rose-500/10 border-rose-500/20"
                    : isToday
                    ? "bg-amber-500/10 border-amber-500/20"
                    : d.status === "completed"
                    ? "bg-emerald-500/10 border-emerald-500/20"
                    : "bg-white/3 border-white/5"
                }`}
              >
                <div className="flex-1 min-w-0">
                  <p className="text-[10px] text-white/80 truncate">
                    {OBLIGATION_LABELS[d.obligation_type] || d.obligation_type}
                  </p>
                  <p className="text-[9px] text-white/40 truncate">
                    {client?.business_name || "Cliente"} • {d.period || ""}
                  </p>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="text-[9px] font-medium text-white/60">
                    {dueDate.getDate()}/{dueDate.getMonth() + 1}
                  </span>
                  <StatusBadge status={d.status} />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </DarkCard>
  );
}