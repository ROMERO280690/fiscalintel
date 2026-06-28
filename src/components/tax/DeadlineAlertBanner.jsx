import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { AlertTriangle, Bell, X, CheckCircle, Loader2, Send } from "lucide-react";
import { Button } from "@/components/ui/button";

const OBLIGATION_LABELS = {
  iva: "IVA", iibb: "IIBB", monotributo: "Monotributo",
  autonomos: "Autónomos", ganancias: "Ganancias", bienes_personales: "B. Personales",
  sueldos: "Sueldos", f931: "F931", sociedades: "Sociedades",
  municipal: "Municipal", otro: "Otro"
};

export default function DeadlineAlertBanner() {
  const [alerts, setAlerts] = useState([]);
  const [dismissed, setDismissed] = useState(() => {
    try { return JSON.parse(localStorage.getItem("contaia_dismissed_alerts") || "[]"); }
    catch { return []; }
  });
  const [sending, setSending] = useState(false);
  const [sendResult, setSendResult] = useState(null);

  useEffect(() => {
    loadAlerts();
  }, []);

  const loadAlerts = async () => {
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const deadlines = await base44.entities.TaxDeadline.filter({ status: "pending" }, "due_date", 200);
      const urgent = deadlines.filter(dl => {
        const due = new Date(dl.due_date);
        due.setHours(0, 0, 0, 0);
        const diff = Math.round((due - today) / (1000 * 60 * 60 * 24));
        return diff <= 15; // Show alerts for next 15 days + overdue
      }).sort((a, b) => new Date(a.due_date) - new Date(b.due_date));
      setAlerts(urgent);
    } catch { /* ignore */ }
  };

  const dismiss = (id) => {
    const next = [...dismissed, id];
    setDismissed(next);
    localStorage.setItem("contaia_dismissed_alerts", JSON.stringify(next));
  };

  const sendAlerts = async () => {
    setSending(true);
    setSendResult(null);
    try {
      const res = await base44.functions.invoke("checkTaxDeadlines", {});
      setSendResult({ ok: true, sent: res.data?.sent || 0 });
      await loadAlerts();
    } catch (e) {
      setSendResult({ ok: false, msg: e.message });
    } finally {
      setSending(false);
    }
  };

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const visible = alerts.filter(a => !dismissed.includes(a.id));
  if (visible.length === 0) return null;

  const getDaysLabel = (dl) => {
    const due = new Date(dl.due_date);
    due.setHours(0, 0, 0, 0);
    const diff = Math.round((due - today) / (1000 * 60 * 60 * 24));
    if (diff < 0) return { label: `Vencido hace ${Math.abs(diff)}d`, color: "text-rose-700 bg-rose-100 border-rose-200" };
    if (diff === 0) return { label: "Vence hoy", color: "text-rose-700 bg-rose-100 border-rose-200" };
    if (diff === 1) return { label: "Vence mañana", color: "text-orange-700 bg-orange-100 border-orange-200" };
    if (diff <= 3) return { label: `${diff} días`, color: "text-orange-700 bg-orange-100 border-orange-200" };
    if (diff <= 7) return { label: `${diff} días`, color: "text-amber-700 bg-amber-100 border-amber-200" };
    return { label: `${diff} días`, color: "text-blue-700 bg-blue-100 border-blue-200" };
  };

  const critical = visible.filter(a => {
    const due = new Date(a.due_date); due.setHours(0, 0, 0, 0);
    return Math.round((due - today) / (1000 * 60 * 60 * 24)) <= 3;
  }).length;

  return (
    <div className="mb-5 bg-white rounded-xl border border-amber-200 shadow-sm overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-amber-50 border-b border-amber-100">
        <div className="flex items-center gap-2">
          <Bell className="w-4 h-4 text-amber-600" />
          <span className="text-[13px] font-semibold text-amber-800">
            {visible.length} vencimiento{visible.length !== 1 ? "s" : ""} próximo{visible.length !== 1 ? "s" : ""}
            {critical > 0 && <span className="ml-2 text-rose-600">· {critical} crítico{critical !== 1 ? "s" : ""}</span>}
          </span>
        </div>
        <div className="flex items-center gap-2">
          {sendResult && (
            <span className={`text-[11px] font-medium ${sendResult.ok ? "text-emerald-600" : "text-rose-600"}`}>
              {sendResult.ok ? `✓ ${sendResult.sent} alertas enviadas` : `Error: ${sendResult.msg}`}
            </span>
          )}
          <Button size="sm" variant="outline" onClick={sendAlerts} disabled={sending}
            className="text-[11px] h-7 px-2 border-amber-300 text-amber-700 hover:bg-amber-100">
            {sending ? <Loader2 className="w-3 h-3 animate-spin mr-1" /> : <Send className="w-3 h-3 mr-1" />}
            {sending ? "Enviando..." : "Enviar Alertas"}
          </Button>
        </div>
      </div>

      {/* Alert list */}
      <div className="divide-y divide-slate-50 max-h-64 overflow-y-auto">
        {visible.slice(0, 10).map(dl => {
          const { label, color } = getDaysLabel(dl);
          return (
            <div key={dl.id} className="flex items-center justify-between px-4 py-2.5 hover:bg-slate-50/50 transition-colors">
              <div className="flex items-center gap-3 min-w-0">
                <AlertTriangle className="w-3.5 h-3.5 text-amber-500 flex-shrink-0" />
                <div className="min-w-0">
                  <p className="text-[13px] font-medium text-[#1A1A2E] truncate">
                    {OBLIGATION_LABELS[dl.obligation_type] || dl.obligation_type} — {dl.client_name}
                  </p>
                  <p className="text-[11px] text-slate-400">{dl.description || dl.period}</p>
                </div>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0 ml-3">
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${color}`}>{label}</span>
                <span className="text-[12px] font-mono text-slate-500">{dl.due_date}</span>
                <button onClick={() => dismiss(dl.id)}
                  className="w-5 h-5 rounded flex items-center justify-center text-slate-300 hover:text-slate-500 hover:bg-slate-100 transition-colors">
                  <X className="w-3 h-3" />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {visible.length > 10 && (
        <div className="px-4 py-2 bg-slate-50 border-t border-slate-100">
          <p className="text-[11px] text-slate-400">+{visible.length - 10} más en el calendario</p>
        </div>
      )}
    </div>
  );
}