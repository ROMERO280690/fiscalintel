import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useCompany } from "@/lib/CompanyContext";
import { usePermissions } from "@/hooks/usePermissions";
import PageHeader from "@/components/shared/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import StatusBadge from "@/components/shared/StatusBadge";
import {
  Building2, Plus, GitBranch, Users, Edit2, Trash2,
  Check, X, ChevronDown, ChevronRight, Shield
} from "lucide-react";

const COMPANY_TYPE_LABELS = {
  monotributista: "Monotributista",
  responsable_inscripto: "Resp. Inscripto",
  autonomo: "Autónomo",
  sas: "SAS",
  srl: "SRL",
  sa: "SA",
  cooperativa: "Cooperativa",
  agro: "Agropecuaria",
  pyme: "PyME",
  otro: "Otro",
};

const COLORS = ["#00C7D9","#6366f1","#f59e0b","#10b981","#ef4444","#8b5cf6","#f97316","#06b6d4","#ec4899","#84cc16"];

export default function Companies() {
  const { role } = usePermissions();
  const { organizations, companies, branches, activeOrg, setActiveCompany, reload } = useCompany();
  const [expanded, setExpanded] = useState({});
  const [showOrgForm, setShowOrgForm] = useState(false);
  const [showCompanyForm, setShowCompanyForm] = useState(false);
  const [showBranchForm, setShowBranchForm] = useState(false);
  const [editingCompany, setEditingCompany] = useState(null);
  const [parentCompanyId, setParentCompanyId] = useState(null);

  const orgCompanies = companies.filter(c => c.organization_id === activeOrg?.id);

  const toggleExpand = (id) => setExpanded(p => ({ ...p, [id]: !p[id] }));

  const deleteCompany = async (id) => {
    if (!confirm("¿Eliminar empresa? Esta acción no se puede deshacer.")) return;
    await base44.entities.Company.delete(id);
    reload();
  };

  const deleteBranch = async (id) => {
    if (!confirm("¿Eliminar sucursal?")) return;
    await base44.entities.Branch.delete(id);
    reload();
  };

  return (
    <div>
      <PageHeader
        title="Empresas y Sucursales"
        subtitle={`${orgCompanies.length} empresa${orgCompanies.length !== 1 ? "s" : ""} en esta organización`}
      >
        <div className="flex gap-2">
          {(role === "super_admin" || role === "estudio_contable") && (
            <Button onClick={() => setShowOrgForm(true)} variant="outline" className="text-xs">
              <Shield className="w-3.5 h-3.5 mr-1" /> Organización
            </Button>
          )}
          <Button onClick={() => { setEditingCompany(null); setShowCompanyForm(true); }}
            className="bg-[#00C7D9] hover:bg-[#00A8BD] text-white text-xs">
            <Plus className="w-3.5 h-3.5 mr-1" /> Nueva Empresa
          </Button>
        </div>
      </PageHeader>

      {/* Org info */}
      {activeOrg && (
        <div className="bg-gradient-to-r from-[#1A1A2E] to-[#16213E] rounded-xl p-4 mb-5 flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-[#00C7D9]/20 flex items-center justify-center">
            <Shield className="w-5 h-5 text-[#00C7D9]" />
          </div>
          <div className="flex-1">
            <p className="text-white font-semibold text-[14px]">{activeOrg.name}</p>
            <p className="text-slate-400 text-[11px]">{activeOrg.cuit} · {activeOrg.org_type?.replace("_", " ")}</p>
          </div>
          <span className="text-[10px] bg-[#00C7D9]/20 text-[#00C7D9] px-2 py-1 rounded-full font-semibold uppercase">
            {activeOrg.plan || "free"}
          </span>
        </div>
      )}

      {/* Companies list */}
      {orgCompanies.length === 0 ? (
        <div className="bg-white rounded-2xl p-16 text-center shadow-sm border border-slate-100">
          <Building2 className="w-16 h-16 text-slate-200 mx-auto mb-4" />
          <h3 className="text-base font-bold text-[#1A1A2E]">No hay empresas</h3>
          <p className="text-[13px] text-slate-500 mt-1 mb-4">Creá la primera empresa para comenzar a operar.</p>
          <Button onClick={() => setShowCompanyForm(true)} className="bg-[#00C7D9] hover:bg-[#00A8BD] text-white text-xs">
            <Plus className="w-3.5 h-3.5 mr-1" /> Nueva Empresa
          </Button>
        </div>
      ) : (
        <div className="space-y-3">
          {orgCompanies.map(company => {
            const compBranches = branches.filter(b => b.company_id === company.id);
            const isExp = expanded[company.id];
            return (
              <div key={company.id} className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
                <div className="flex items-center gap-3 p-4">
                  <button onClick={() => toggleExpand(company.id)} className="w-6 h-6 flex items-center justify-center text-slate-400">
                    {isExp ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                  </button>
                  <div
                    className="w-9 h-9 rounded-xl flex items-center justify-center text-white font-bold text-[13px] flex-shrink-0"
                    style={{ backgroundColor: company.color || "#00C7D9" }}
                  >
                    {company.fantasy_name?.[0] || company.business_name?.[0] || "E"}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[14px] font-semibold text-[#1A1A2E]">
                      {company.fantasy_name || company.business_name}
                    </p>
                    <p className="text-[11px] text-slate-500 font-mono">{company.cuit} · {COMPANY_TYPE_LABELS[company.company_type] || company.company_type}</p>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <span className="text-[10px] text-slate-400 flex items-center gap-1">
                      <GitBranch className="w-3 h-3" /> {compBranches.length}
                    </span>
                    <StatusBadge status={company.status} />
                    <Button size="sm" variant="ghost" onClick={() => setActiveCompany(company)}
                      className="text-[11px] text-[#00C7D9] h-7 px-2">
                      <Check className="w-3 h-3 mr-1" /> Activar
                    </Button>
                    <button onClick={() => { setEditingCompany(company); setShowCompanyForm(true); }}
                      className="w-7 h-7 rounded-lg bg-slate-100 hover:bg-blue-50 flex items-center justify-center">
                      <Edit2 className="w-3.5 h-3.5 text-slate-500" />
                    </button>
                    <button onClick={() => deleteCompany(company.id)}
                      className="w-7 h-7 rounded-lg bg-slate-100 hover:bg-rose-50 flex items-center justify-center">
                      <Trash2 className="w-3.5 h-3.5 text-rose-400" />
                    </button>
                  </div>
                </div>

                {isExp && (
                  <div className="border-t border-slate-100 px-5 py-3 bg-slate-50/50">
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Sucursales</p>
                      <button
                        onClick={() => { setParentCompanyId(company.id); setShowBranchForm(true); }}
                        className="text-[11px] text-[#00C7D9] flex items-center gap-1 hover:underline">
                        <Plus className="w-3 h-3" /> Agregar
                      </button>
                    </div>
                    {compBranches.length === 0 ? (
                      <p className="text-[12px] text-slate-400 py-2">Sin sucursales registradas.</p>
                    ) : (
                      <div className="space-y-1.5">
                        {compBranches.map(branch => (
                          <div key={branch.id} className="flex items-center gap-2 bg-white rounded-lg px-3 py-2 border border-slate-100">
                            <GitBranch className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                            <div className="flex-1 min-w-0">
                              <p className="text-[12px] font-medium text-[#1A1A2E]">{branch.name}</p>
                              <p className="text-[10px] text-slate-400">{branch.city} {branch.address ? `· ${branch.address}` : ""}</p>
                            </div>
                            {branch.is_headquarters && (
                              <span className="text-[10px] bg-[#00C7D9]/10 text-[#00A8BD] px-1.5 py-0.5 rounded-full font-semibold">Casa central</span>
                            )}
                            <button onClick={() => deleteBranch(branch.id)}
                              className="w-6 h-6 rounded bg-slate-100 hover:bg-rose-50 flex items-center justify-center">
                              <X className="w-3 h-3 text-rose-400" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {showCompanyForm && (
        <CompanyForm
          company={editingCompany}
          orgId={activeOrg?.id}
          onSave={async (data) => {
            if (editingCompany) {
              await base44.entities.Company.update(editingCompany.id, data);
            } else {
              await base44.entities.Company.create(data);
            }
            setShowCompanyForm(false);
            setEditingCompany(null);
            reload();
          }}
          onClose={() => { setShowCompanyForm(false); setEditingCompany(null); }}
        />
      )}

      {showBranchForm && (
        <BranchForm
          companyId={parentCompanyId}
          orgId={activeOrg?.id}
          onSave={async (data) => {
            await base44.entities.Branch.create(data);
            setShowBranchForm(false);
            reload();
          }}
          onClose={() => setShowBranchForm(false)}
        />
      )}

      {showOrgForm && (
        <OrgForm
          org={activeOrg}
          onSave={async (data) => {
            if (activeOrg) {
              await base44.entities.Organization.update(activeOrg.id, data);
            } else {
              await base44.entities.Organization.create(data);
            }
            setShowOrgForm(false);
            reload();
          }}
          onClose={() => setShowOrgForm(false)}
        />
      )}
    </div>
  );
}

function CompanyForm({ company, orgId, onSave, onClose }) {
  const [form, setForm] = useState({
    organization_id: orgId || "",
    business_name: company?.business_name || "",
    fantasy_name: company?.fantasy_name || "",
    cuit: company?.cuit || "",
    company_type: company?.company_type || "srl",
    activity: company?.activity || "",
    email: company?.email || "",
    phone: company?.phone || "",
    address: company?.address || "",
    city: company?.city || "",
    province: company?.province || "",
    color: company?.color || "#00C7D9",
    status: company?.status || "active",
  });
  const [saving, setSaving] = useState(false);
  const upd = (f, v) => setForm(p => ({ ...p, [f]: v }));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto m-4 p-5">
        <h2 className="text-base font-bold text-[#1A1A2E] mb-4">{company ? "Editar Empresa" : "Nueva Empresa"}</h2>
        <form onSubmit={async e => { e.preventDefault(); setSaving(true); await onSave(form); setSaving(false); }} className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2">
              <Label className="text-[12px] font-medium text-slate-600">Razón Social *</Label>
              <Input value={form.business_name} onChange={e => upd("business_name", e.target.value)} required className="mt-1 text-[13px] h-9" />
            </div>
            <div>
              <Label className="text-[12px] font-medium text-slate-600">Nombre Fantasía</Label>
              <Input value={form.fantasy_name} onChange={e => upd("fantasy_name", e.target.value)} className="mt-1 text-[13px] h-9" />
            </div>
            <div>
              <Label className="text-[12px] font-medium text-slate-600">CUIT *</Label>
              <Input value={form.cuit} onChange={e => upd("cuit", e.target.value)} placeholder="XX-XXXXXXXX-X" required className="mt-1 text-[13px] h-9 font-mono" />
            </div>
            <div>
              <Label className="text-[12px] font-medium text-slate-600">Tipo</Label>
              <select value={form.company_type} onChange={e => upd("company_type", e.target.value)} className="mt-1 w-full h-9 px-3 rounded-md border border-slate-200 text-[13px] bg-white">
                {Object.entries(COMPANY_TYPE_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
              </select>
            </div>
            <div>
              <Label className="text-[12px] font-medium text-slate-600">Color identificación</Label>
              <div className="mt-1 flex gap-1.5 flex-wrap">
                {COLORS.map(c => (
                  <button type="button" key={c} onClick={() => upd("color", c)}
                    className={`w-6 h-6 rounded-full border-2 transition-all ${form.color === c ? "border-slate-800 scale-110" : "border-transparent"}`}
                    style={{ backgroundColor: c }} />
                ))}
              </div>
            </div>
            <div>
              <Label className="text-[12px] font-medium text-slate-600">Email</Label>
              <Input type="email" value={form.email} onChange={e => upd("email", e.target.value)} className="mt-1 text-[13px] h-9" />
            </div>
            <div>
              <Label className="text-[12px] font-medium text-slate-600">Teléfono</Label>
              <Input value={form.phone} onChange={e => upd("phone", e.target.value)} className="mt-1 text-[13px] h-9" />
            </div>
            <div className="col-span-2">
              <Label className="text-[12px] font-medium text-slate-600">Dirección</Label>
              <Input value={form.address} onChange={e => upd("address", e.target.value)} className="mt-1 text-[13px] h-9" />
            </div>
            <div>
              <Label className="text-[12px] font-medium text-slate-600">Ciudad</Label>
              <Input value={form.city} onChange={e => upd("city", e.target.value)} className="mt-1 text-[13px] h-9" />
            </div>
            <div>
              <Label className="text-[12px] font-medium text-slate-600">Provincia</Label>
              <Input value={form.province} onChange={e => upd("province", e.target.value)} className="mt-1 text-[13px] h-9" />
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={onClose} className="text-xs">Cancelar</Button>
            <Button type="submit" disabled={saving} className="bg-[#00C7D9] hover:bg-[#00A8BD] text-white text-xs">
              {saving ? "Guardando..." : company ? "Actualizar" : "Crear Empresa"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

function BranchForm({ companyId, orgId, onSave, onClose }) {
  const [form, setForm] = useState({ company_id: companyId, organization_id: orgId || "", name: "", code: "", address: "", city: "", province: "", phone: "", email: "", manager_name: "", is_headquarters: false, status: "active" });
  const [saving, setSaving] = useState(false);
  const upd = (f, v) => setForm(p => ({ ...p, [f]: v }));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-md m-4 p-5">
        <h2 className="text-base font-bold text-[#1A1A2E] mb-4">Nueva Sucursal</h2>
        <form onSubmit={async e => { e.preventDefault(); setSaving(true); await onSave(form); setSaving(false); }} className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2">
              <Label className="text-[12px] font-medium text-slate-600">Nombre *</Label>
              <Input value={form.name} onChange={e => upd("name", e.target.value)} required className="mt-1 text-[13px] h-9" placeholder="Ej: Casa Central, Sucursal Norte" />
            </div>
            <div>
              <Label className="text-[12px] font-medium text-slate-600">Código</Label>
              <Input value={form.code} onChange={e => upd("code", e.target.value)} className="mt-1 text-[13px] h-9 font-mono" placeholder="SC-001" />
            </div>
            <div>
              <Label className="text-[12px] font-medium text-slate-600">Ciudad</Label>
              <Input value={form.city} onChange={e => upd("city", e.target.value)} className="mt-1 text-[13px] h-9" />
            </div>
            <div className="col-span-2">
              <Label className="text-[12px] font-medium text-slate-600">Dirección</Label>
              <Input value={form.address} onChange={e => upd("address", e.target.value)} className="mt-1 text-[13px] h-9" />
            </div>
            <div>
              <Label className="text-[12px] font-medium text-slate-600">Responsable</Label>
              <Input value={form.manager_name} onChange={e => upd("manager_name", e.target.value)} className="mt-1 text-[13px] h-9" />
            </div>
            <div className="flex items-end pb-1">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={form.is_headquarters} onChange={e => upd("is_headquarters", e.target.checked)} className="rounded" />
                <span className="text-[12px] text-slate-600">Casa central</span>
              </label>
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={onClose} className="text-xs">Cancelar</Button>
            <Button type="submit" disabled={saving} className="bg-[#00C7D9] hover:bg-[#00A8BD] text-white text-xs">
              {saving ? "Guardando..." : "Crear Sucursal"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

function OrgForm({ org, onSave, onClose }) {
  const [form, setForm] = useState({
    name: org?.name || "",
    org_type: org?.org_type || "estudio_contable",
    cuit: org?.cuit || "",
    email: org?.email || "",
    phone: org?.phone || "",
    address: org?.address || "",
    plan: org?.plan || "free",
    status: org?.status || "active",
  });
  const [saving, setSaving] = useState(false);
  const upd = (f, v) => setForm(p => ({ ...p, [f]: v }));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-md m-4 p-5">
        <h2 className="text-base font-bold text-[#1A1A2E] mb-4">{org ? "Editar Organización" : "Nueva Organización"}</h2>
        <form onSubmit={async e => { e.preventDefault(); setSaving(true); await onSave(form); setSaving(false); }} className="space-y-3">
          <div>
            <Label className="text-[12px] font-medium text-slate-600">Nombre *</Label>
            <Input value={form.name} onChange={e => upd("name", e.target.value)} required className="mt-1 text-[13px] h-9" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-[12px] font-medium text-slate-600">Tipo</Label>
              <select value={form.org_type} onChange={e => upd("org_type", e.target.value)} className="mt-1 w-full h-9 px-3 rounded-md border border-slate-200 text-[13px] bg-white">
                <option value="estudio_contable">Estudio Contable</option>
                <option value="grupo_economico">Grupo Económico</option>
                <option value="empresa_independiente">Empresa Independiente</option>
                <option value="holding">Holding</option>
              </select>
            </div>
            <div>
              <Label className="text-[12px] font-medium text-slate-600">CUIT</Label>
              <Input value={form.cuit} onChange={e => upd("cuit", e.target.value)} className="mt-1 text-[13px] h-9 font-mono" />
            </div>
          </div>
          <div>
            <Label className="text-[12px] font-medium text-slate-600">Email</Label>
            <Input type="email" value={form.email} onChange={e => upd("email", e.target.value)} className="mt-1 text-[13px] h-9" />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={onClose} className="text-xs">Cancelar</Button>
            <Button type="submit" disabled={saving} className="bg-[#00C7D9] hover:bg-[#00A8BD] text-white text-xs">
              {saving ? "Guardando..." : org ? "Actualizar" : "Crear Organización"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}