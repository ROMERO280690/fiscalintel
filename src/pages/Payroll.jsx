import React, { useState, useEffect } from "react";
import PermissionGuard from "@/components/shared/PermissionGuard";
import { usePermissions } from "@/hooks/usePermissions";
import { useCompanyData } from "@/hooks/useCompanyData";
import { useCompany } from "@/lib/CompanyContext";
import { base44 } from "@/api/base44Client";
import { logAction } from "@/lib/audit";
import { Plus, Users, Loader2, Bot, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import PageHeader from "@/components/shared/PageHeader";
import StatusBadge from "@/components/shared/StatusBadge";
import EmptyState from "@/components/shared/EmptyState";

const tabs = ["Empleados", "Liquidaciones", "F931"];

export default function Payroll() {
  const { canViewModule, can } = usePermissions();
  const { activeCompany } = useCompany();
  const { data: employees, loading: loadingEmp, reload: reloadEmp } = useCompanyData("Employee");
  const { data: payslips, reload: reloadPayslips } = useCompanyData("Payslip");
  const { data: clients, reload: reloadClients } = useCompanyData("Client");
  const loading = loadingEmp;
  const [activeTab, setActiveTab] = useState("Empleados");
  const [showEmpForm, setShowEmpForm] = useState(false);
  const [generating, setGenerating] = useState(null);

  const load = () => { reloadEmp(); reloadPayslips(); reloadClients(); };

  const getClientName = (id) => clients.find(c => c.id === id)?.business_name || "—";

  const generatePayslip = async (employee) => {
    setGenerating(employee.id);
    try {
      const period = new Date().toLocaleDateString("es-AR", { month: "2-digit", year: "numeric" }).replace("/", "/");
      const result = await base44.integrations.Core.InvokeLLM({
        prompt: `Sos un liquidador de sueldos argentino experto. Calculá el recibo de sueldo para el período actual.
Empleado: ${employee.full_name}
Salario base: $${employee.base_salary}
Convenio: ${employee.agreement || "General"}
Tipo: ${employee.hours_type}

Calculá con porcentajes vigentes 2026:
- Jubilación empleado: 11%
- Obra social empleado: 3%
- ANSSAL: 0.5%  
- Sindical: 2% (si aplica)
- Contribuciones patronales: 26.5% aprox
- SAC proporcional mensual

Respondé en JSON con todos los montos.`,
        response_json_schema: {
          type: "object",
          properties: {
            gross_salary: { type: "number" },
            jubilacion: { type: "number" },
            obra_social_employee: { type: "number" },
            anssal: { type: "number" },
            sindical: { type: "number" },
            total_deductions: { type: "number" },
            net_salary: { type: "number" },
            employer_contributions: { type: "number" },
            sac: { type: "number" },
            ai_notes: { type: "string" }
          }
        }
      });

      const ps = await base44.entities.Payslip.create({
        client_id: employee.client_id,
        company_id: activeCompany?.id,
        employee_id: employee.id,
        employee_name: employee.full_name,
        period,
        base_salary: employee.base_salary,
        gross_salary: result.gross_salary || employee.base_salary,
        jubilacion: result.jubilacion || 0,
        obra_social_employee: result.obra_social_employee || 0,
        anssal: result.anssal || 0,
        sindical: result.sindical || 0,
        total_deductions: result.total_deductions || 0,
        net_salary: result.net_salary || 0,
        employer_contributions: result.employer_contributions || 0,
        sac: result.sac || 0,
        ai_notes: result.ai_notes || "",
        status: "ai_generated",
      });
      logAction("ai_run", `Generó recibo de sueldo IA: ${employee.full_name} — Período ${period}`, { entityType: "Payslip", entityId: ps?.id, clientId: employee.client_id, newData: { employee: employee.full_name, period, net_salary: result.net_salary }, module: "Sueldos" });
      load();
      setActiveTab("Liquidaciones");
    } catch (e) { console.error(e); }
    finally { setGenerating(null); }
  };

  if (!canViewModule("payroll")) return <PermissionGuard module="payroll" />;

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-8 h-8 border-4 border-slate-200 border-t-[#00C7D9] rounded-full animate-spin" />
    </div>
  );

  return (
    <div>
      <PageHeader title="Sueldos y Jornales" subtitle="Liquidación de haberes con IA">
        {activeTab === "Empleados" && (
          <Button onClick={() => setShowEmpForm(true)} className="bg-[#00C7D9] hover:bg-[#00A8BD] text-white text-xs">
            <Plus className="w-3.5 h-3.5 mr-1" /> Nuevo Empleado
          </Button>
        )}
      </PageHeader>

      <div className="flex gap-1 mb-5">
        {tabs.map(t => (
          <button key={t} onClick={() => setActiveTab(t)}
            className={`px-4 py-2 rounded-lg text-[12px] font-medium transition-colors ${activeTab === t ? "bg-[#00C7D9] text-white" : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50"}`}>
            {t}
          </button>
        ))}
      </div>

      {activeTab === "Empleados" && (
        employees.length === 0
          ? <EmptyState icon={Users} title="Sin empleados" description="Agregá empleados para liquidar sueldos con IA." >
              <Button onClick={() => setShowEmpForm(true)} className="bg-[#00C7D9] hover:bg-[#00A8BD] text-white text-xs"><Plus className="w-3.5 h-3.5 mr-1"/>Nuevo Empleado</Button>
            </EmptyState>
          : <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
              <table className="w-full">
                <thead><tr className="border-b border-slate-100">
                  <th className="text-left px-4 py-3 text-[11px] font-semibold text-slate-500 uppercase">Empleado</th>
                  <th className="text-left px-4 py-3 text-[11px] font-semibold text-slate-500 uppercase hidden md:table-cell">Cliente</th>
                  <th className="text-left px-4 py-3 text-[11px] font-semibold text-slate-500 uppercase hidden lg:table-cell">Salario Base</th>
                  <th className="text-left px-4 py-3 text-[11px] font-semibold text-slate-500 uppercase">Estado</th>
                  <th className="text-left px-4 py-3 text-[11px] font-semibold text-slate-500 uppercase">Acción</th>
                </tr></thead>
                <tbody>
                  {employees.map(emp => (
                    <tr key={emp.id} className="border-b border-slate-50 hover:bg-slate-50 transition-colors">
                      <td className="px-4 py-3">
                        <p className="text-[13px] font-medium text-[#1A1A2E]">{emp.full_name}</p>
                        <p className="text-[11px] text-slate-400 font-mono">{emp.cuil}</p>
                      </td>
                      <td className="px-4 py-3 text-[13px] text-slate-600 hidden md:table-cell">{getClientName(emp.client_id)}</td>
                      <td className="px-4 py-3 text-[13px] font-mono text-[#1A1A2E] hidden lg:table-cell">${emp.base_salary?.toLocaleString("es-AR")}</td>
                      <td className="px-4 py-3"><StatusBadge status={emp.status} /></td>
                      <td className="px-4 py-3">
                        <Button size="sm" onClick={() => generatePayslip(emp)} disabled={generating === emp.id}
                          className="bg-[#00C7D9] hover:bg-[#00A8BD] text-white text-[11px] h-7 px-2">
                          {generating === emp.id ? <Loader2 className="w-3 h-3 animate-spin mr-1" /> : <Bot className="w-3 h-3 mr-1" />}
                          Liquidar IA
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
      )}

      {activeTab === "Liquidaciones" && (
        payslips.length === 0
          ? <EmptyState icon={Users} title="Sin liquidaciones" description="Generá liquidaciones desde la pestaña Empleados." />
          : <div className="space-y-3">
              {payslips.map(ps => (
                <div key={ps.id} className="bg-white rounded-xl p-4 shadow-sm border border-slate-100">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h3 className="text-[13px] font-bold text-[#1A1A2E]">{ps.employee_name}</h3>
                      <p className="text-[11px] text-slate-500">Período: {ps.period}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <StatusBadge status={ps.status} />
                      {ps.status === "ai_generated" && (
                        <Button size="sm" onClick={async () => { await base44.entities.Payslip.update(ps.id, { status: "approved" }); logAction("approve", `Aprobó recibo de sueldo: ${ps.employee_name} — ${ps.period}`, { entityType: "Payslip", entityId: ps.id, clientId: ps.client_id, newData: { status: "approved" }, module: "Sueldos" }); load(); }}
                          className="bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] h-7 px-2">
                          <CheckCircle className="w-3 h-3 mr-1" />Aprobar
                        </Button>
                      )}
                    </div>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-[12px]">
                    <SalItem label="Bruto" value={ps.gross_salary} />
                    <SalItem label="Jubilación" value={ps.jubilacion} neg />
                    <SalItem label="Obra Social" value={ps.obra_social_employee} neg />
                    <SalItem label="Neto" value={ps.net_salary} highlight />
                  </div>
                  {ps.ai_notes && <p className="mt-2 text-[11px] text-slate-500 bg-slate-50 rounded-lg px-3 py-2">{ps.ai_notes}</p>}
                </div>
              ))}
            </div>
      )}

      {activeTab === "F931" && (
        <F931View payslips={payslips} clients={clients} />
      )}

      {showEmpForm && <EmployeeForm clients={clients} onSave={async (data) => { const emp = await base44.entities.Employee.create({ ...data, company_id: activeCompany?.id }); logAction("create", `Creó empleado: ${data.full_name} (CUIL: ${data.cuil})`, { entityType: "Employee", entityId: emp?.id, clientId: data.client_id, newData: { full_name: data.full_name, cuil: data.cuil, base_salary: data.base_salary }, module: "Sueldos" }); setShowEmpForm(false); load(); }} onClose={() => setShowEmpForm(false)} />}
    </div>
  );
}

function SalItem({ label, value, neg, highlight }) {
  return (
    <div className={`rounded-lg p-2 ${highlight ? "bg-[#E0F7FA]" : "bg-slate-50"}`}>
      <p className="text-[10px] text-slate-500 uppercase">{label}</p>
      <p className={`text-[13px] font-bold font-mono ${highlight ? "text-[#00A8BD]" : neg ? "text-rose-600" : "text-[#1A1A2E]"}`}>
        {neg ? "-" : ""}${(value || 0).toLocaleString("es-AR")}
      </p>
    </div>
  );
}

function F931View({ payslips, clients }) {
  const approved = payslips.filter(p => p.status === "approved" || p.status === "paid");
  const totalGross = approved.reduce((s, p) => s + (p.gross_salary || 0), 0);
  const totalContrib = approved.reduce((s, p) => s + (p.employer_contributions || 0), 0);
  const totalDeductions = approved.reduce((s, p) => s + (p.total_deductions || 0), 0);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white rounded-xl p-4 shadow-sm border border-slate-100 text-center">
          <p className="text-[11px] text-slate-500 uppercase mb-1">Total Remuneraciones</p>
          <p className="text-xl font-bold text-[#1A1A2E] font-mono">${totalGross.toLocaleString("es-AR")}</p>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-sm border border-slate-100 text-center">
          <p className="text-[11px] text-slate-500 uppercase mb-1">Contribuciones Patronales</p>
          <p className="text-xl font-bold text-[#1A1A2E] font-mono">${totalContrib.toLocaleString("es-AR")}</p>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-sm border border-slate-100 text-center">
          <p className="text-[11px] text-slate-500 uppercase mb-1">Aportes Empleados</p>
          <p className="text-xl font-bold text-[#1A1A2E] font-mono">${totalDeductions.toLocaleString("es-AR")}</p>
        </div>
      </div>
      {approved.length === 0 ? (
        <EmptyState icon={Users} title="Sin datos F931" description="Aprobá liquidaciones para calcular el F931." />
      ) : (
        <div className="bg-white rounded-xl p-4 shadow-sm border border-slate-100">
          <h3 className="text-[13px] font-semibold text-[#1A1A2E] mb-3">Detalle por Empleado</h3>
          <table className="w-full">
            <thead><tr className="border-b border-slate-100">
              <th className="text-left py-2 text-[11px] font-semibold text-slate-500 uppercase">Empleado</th>
              <th className="text-right py-2 text-[11px] font-semibold text-slate-500 uppercase">Bruto</th>
              <th className="text-right py-2 text-[11px] font-semibold text-slate-500 uppercase">Aportes</th>
              <th className="text-right py-2 text-[11px] font-semibold text-slate-500 uppercase">Contribuciones</th>
            </tr></thead>
            <tbody>
              {approved.map(p => (
                <tr key={p.id} className="border-b border-slate-50">
                  <td className="py-2 text-[13px] text-[#1A1A2E]">{p.employee_name}</td>
                  <td className="py-2 text-right text-[13px] font-mono">${(p.gross_salary || 0).toLocaleString("es-AR")}</td>
                  <td className="py-2 text-right text-[13px] font-mono text-rose-600">${(p.total_deductions || 0).toLocaleString("es-AR")}</td>
                  <td className="py-2 text-right text-[13px] font-mono text-amber-600">${(p.employer_contributions || 0).toLocaleString("es-AR")}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function EmployeeForm({ clients, onSave, onClose }) {
  const [form, setForm] = useState({ client_id: "", full_name: "", cuil: "", dni: "", position: "", agreement: "", base_salary: "", hire_date: "", obra_social: "", hours_type: "full_time", status: "active" });
  const [saving, setSaving] = useState(false);
  const update = (f, v) => setForm(p => ({ ...p, [f]: v }));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto m-4 p-5">
        <h2 className="text-base font-bold text-[#1A1A2E] mb-4">Nuevo Empleado</h2>
        <form onSubmit={async e => { e.preventDefault(); setSaving(true); await onSave(form); setSaving(false); }} className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2">
              <Label className="text-[12px] font-medium text-slate-600">Cliente *</Label>
              <select value={form.client_id} onChange={e => update("client_id", e.target.value)} required className="mt-1 w-full h-9 px-3 rounded-md border border-slate-200 text-[13px] bg-white">
                <option value="">Seleccionar</option>
                {clients.map(c => <option key={c.id} value={c.id}>{c.business_name}</option>)}
              </select>
            </div>
            <div className="col-span-2">
              <Label className="text-[12px] font-medium text-slate-600">Nombre completo *</Label>
              <Input value={form.full_name} onChange={e => update("full_name", e.target.value)} required className="mt-1 text-[13px] h-9" />
            </div>
            <div>
              <Label className="text-[12px] font-medium text-slate-600">CUIL *</Label>
              <Input value={form.cuil} onChange={e => update("cuil", e.target.value)} placeholder="XX-XXXXXXXX-X" required className="mt-1 text-[13px] h-9 font-mono" />
            </div>
            <div>
              <Label className="text-[12px] font-medium text-slate-600">DNI</Label>
              <Input value={form.dni} onChange={e => update("dni", e.target.value)} className="mt-1 text-[13px] h-9 font-mono" />
            </div>
            <div>
              <Label className="text-[12px] font-medium text-slate-600">Cargo</Label>
              <Input value={form.position} onChange={e => update("position", e.target.value)} className="mt-1 text-[13px] h-9" />
            </div>
            <div>
              <Label className="text-[12px] font-medium text-slate-600">Convenio</Label>
              <Input value={form.agreement} onChange={e => update("agreement", e.target.value)} className="mt-1 text-[13px] h-9" />
            </div>
            <div>
              <Label className="text-[12px] font-medium text-slate-600">Salario Base *</Label>
              <Input type="number" value={form.base_salary} onChange={e => update("base_salary", e.target.value)} required className="mt-1 text-[13px] h-9" />
            </div>
            <div>
              <Label className="text-[12px] font-medium text-slate-600">Fecha de Ingreso</Label>
              <Input type="date" value={form.hire_date} onChange={e => update("hire_date", e.target.value)} className="mt-1 text-[13px] h-9" />
            </div>
            <div>
              <Label className="text-[12px] font-medium text-slate-600">Tipo de Jornada</Label>
              <select value={form.hours_type} onChange={e => update("hours_type", e.target.value)} className="mt-1 w-full h-9 px-3 rounded-md border border-slate-200 text-[13px] bg-white">
                <option value="full_time">Tiempo Completo</option>
                <option value="part_time">Tiempo Parcial</option>
                <option value="hours">Por Horas</option>
              </select>
            </div>
            <div>
              <Label className="text-[12px] font-medium text-slate-600">Obra Social</Label>
              <Input value={form.obra_social} onChange={e => update("obra_social", e.target.value)} className="mt-1 text-[13px] h-9" />
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={onClose} className="text-xs">Cancelar</Button>
            <Button type="submit" disabled={saving} className="bg-[#00C7D9] hover:bg-[#00A8BD] text-white text-xs">
              {saving ? "Guardando..." : "Crear Empleado"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}