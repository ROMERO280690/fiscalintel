import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useAuth } from "@/lib/AuthContext";
import { useCompany } from "@/lib/CompanyContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Building2, Shield, UserCheck, ArrowRight, Check, Loader2 } from "lucide-react";
import { toast } from "sonner";

const COLORS = ["#00C7D9","#6366f1","#f59e0b","#10b981","#ef4444","#8b5cf6","#f97316","#06b6d4","#ec4899","#84cc16"];

const COMPANY_TYPES = [
  { value: "srl", label: "SRL" },
  { value: "sas", label: "SAS" },
  { value: "sa", label: "SA" },
  { value: "monotributista", label: "Monotributista" },
  { value: "responsable_inscripto", label: "Resp. Inscripto" },
  { value: "autonomo", label: "Autónomo" },
];

export default function Onboarding() {
  const { user } = useAuth();
  const { reload } = useCompany();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);

  const [orgData, setOrgData] = useState({
    name: "",
    org_type: "estudio_contable",
    cuit: "",
    email: user?.email || "",
    phone: "",
    address: "",
  });

  const [companyData, setCompanyData] = useState({
    business_name: "",
    fantasy_name: "",
    cuit: "",
    company_type: "srl",
    email: "",
    phone: "",
    address: "",
    city: "",
    province: "",
    color: "#00C7D9",
  });

  const handleCreateOrg = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const org = await base44.entities.Organization.create({
        ...orgData,
        owner_user_id: user?.id,
        status: "active",
        plan: "free",
        max_companies: 10,
      });

      // Update user role
      await base44.auth.updateMe({ role: "estudio_contable" });

      setOrgData(prev => ({ ...prev, id: org.id }));
      setStep(2);
      toast.success("Organización creada");
    } catch (err) {
      toast.error(err.message || "Error al crear organización");
    } finally {
      setLoading(false);
    }
  };

  const handleCreateCompany = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await base44.entities.Company.create({
        ...companyData,
        organization_id: orgData.id,
        status: "active",
      });

      toast.success("Empresa creada");
      await reload();
      setStep(3);
    } catch (err) {
      toast.error(err.message || "Error al crear empresa");
    } finally {
      setLoading(false);
    }
  };

  const handleFinish = () => {
    window.location.href = "/";
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0A0B14] via-[#1A1C2E] to-[#0D0E1A] flex items-center justify-center p-4">
      <div className="w-full max-w-2xl">
        {/* Progress Steps */}
        <div className="flex items-center justify-center gap-2 mb-8">
          {[1, 2, 3].map((s) => (
            <React.Fragment key={s}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                step >= s ? "bg-[#00C7D9] text-white" : "bg-slate-700 text-slate-400"
              }`}>
                {step > s ? <Check className="w-4 h-4" /> : s}
              </div>
              {s < 3 && (
                <div className={`w-12 h-0.5 transition-all ${step > s ? "bg-[#00C7D9]" : "bg-slate-700"}`} />
              )}
            </React.Fragment>
          ))}
        </div>

        {/* Step 1: Organization */}
        {step === 1 && (
          <Card className="bg-white/5 border-white/10 backdrop-blur-sm">
            <CardHeader className="text-center">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center mx-auto mb-3">
                <Shield className="w-6 h-6 text-white" />
              </div>
              <CardTitle className="text-xl font-bold text-white">Creá tu Estudio Contable</CardTitle>
              <CardDescription className="text-slate-400">
                Configurá la organización que administrará tus empresas clientas
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleCreateOrg} className="space-y-4">
                <div>
                  <Label className="text-slate-300">Nombre del Estudio *</Label>
                  <Input
                    value={orgData.name}
                    onChange={(e) => setOrgData({ ...orgData, name: e.target.value })}
                    placeholder="Ej: Fernández & Asociados"
                    className="mt-1 bg-white/5 border-white/10 text-white"
                    required
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-slate-300">Tipo</Label>
                    <select
                      value={orgData.org_type}
                      onChange={(e) => setOrgData({ ...orgData, org_type: e.target.value })}
                      className="mt-1 w-full h-10 px-3 rounded-md border border-white/10 bg-[#1A1A2E] text-white text-sm"
                    >
                      <option value="estudio_contable" className="bg-[#1A1A2E] text-white">Estudio Contable</option>
                      <option value="grupo_economico" className="bg-[#1A1A2E] text-white">Grupo Económico</option>
                      <option value="empresa_independiente" className="bg-[#1A1A2E] text-white">Empresa Independiente</option>
                      <option value="holding" className="bg-[#1A1A2E] text-white">Holding</option>
                    </select>
                  </div>
                  <div>
                    <Label className="text-slate-300">CUIT</Label>
                    <Input
                      value={orgData.cuit}
                      onChange={(e) => setOrgData({ ...orgData, cuit: e.target.value })}
                      placeholder="XX-XXXXXXXX-X"
                      className="mt-1 bg-white/5 border-white/10 text-white font-mono"
                    />
                  </div>
                </div>
                <div>
                  <Label className="text-slate-300">Email</Label>
                  <Input
                    type="email"
                    value={orgData.email}
                    onChange={(e) => setOrgData({ ...orgData, email: e.target.value })}
                    className="mt-1 bg-white/5 border-white/10 text-white"
                  />
                </div>
                <Button
                  type="submit"
                  className="w-full h-11 bg-gradient-to-r from-[#00C7D9] to-[#00A8BD] hover:from-[#00A8BD] hover:to-[#0097A8] text-white font-medium"
                  disabled={loading || !orgData.name}
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Creando...
                    </>
                  ) : (
                    <>
                      Continuar
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </>
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>
        )}

        {/* Step 2: First Company */}
        {step === 2 && (
          <Card className="bg-white/5 border-white/10 backdrop-blur-sm">
            <CardHeader className="text-center">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#00C7D9] to-[#00A8BD] flex items-center justify-center mx-auto mb-3">
                <Building2 className="w-6 h-6 text-white" />
              </div>
              <CardTitle className="text-xl font-bold text-white">Agregá tu Primera Empresa</CardTitle>
              <CardDescription className="text-slate-400">
                Cargá los datos de la empresa que vas a administrar
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleCreateCompany} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="col-span-2">
                    <Label className="text-slate-300">Razón Social *</Label>
                    <Input
                      value={companyData.business_name}
                      onChange={(e) => setCompanyData({ ...companyData, business_name: e.target.value })}
                      placeholder="Ej: Tech Solutions SRL"
                      className="mt-1 bg-white/5 border-white/10 text-white"
                      required
                    />
                  </div>
                  <div>
                    <Label className="text-slate-300">Nombre Fantasía</Label>
                    <Input
                      value={companyData.fantasy_name}
                      onChange={(e) => setCompanyData({ ...companyData, fantasy_name: e.target.value })}
                      placeholder="Ej: TechSol"
                      className="mt-1 bg-white/5 border-white/10 text-white"
                    />
                  </div>
                  <div>
                    <Label className="text-slate-300">CUIT *</Label>
                    <Input
                      value={companyData.cuit}
                      onChange={(e) => setCompanyData({ ...companyData, cuit: e.target.value })}
                      placeholder="XX-XXXXXXXX-X"
                      className="mt-1 bg-white/5 border-white/10 text-white font-mono"
                      required
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-slate-300">Tipo</Label>
                    <select
                      value={companyData.company_type}
                      onChange={(e) => setCompanyData({ ...companyData, company_type: e.target.value })}
                      className="mt-1 w-full h-10 px-3 rounded-md border border-white/10 bg-[#1A1A2E] text-white text-sm"
                    >
                      {COMPANY_TYPES.map((t) => (
                        <option key={t.value} value={t.value} className="bg-[#1A1A2E] text-white">{t.label}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <Label className="text-slate-300">Color</Label>
                    <div className="mt-1 flex gap-1.5">
                      {COLORS.map((c) => (
                        <button
                          key={c}
                          type="button"
                          onClick={() => setCompanyData({ ...companyData, color: c })}
                          className={`w-6 h-6 rounded-full border-2 transition-all ${
                            companyData.color === c ? "border-white scale-110" : "border-transparent"
                          }`}
                          style={{ backgroundColor: c }}
                        />
                      ))}
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-slate-300">Email</Label>
                    <Input
                      type="email"
                      value={companyData.email}
                      onChange={(e) => setCompanyData({ ...companyData, email: e.target.value })}
                      className="mt-1 bg-white/5 border-white/10 text-white"
                    />
                  </div>
                  <div>
                    <Label className="text-slate-300">Teléfono</Label>
                    <Input
                      value={companyData.phone}
                      onChange={(e) => setCompanyData({ ...companyData, phone: e.target.value })}
                      className="mt-1 bg-white/5 border-white/10 text-white"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-slate-300">Ciudad</Label>
                    <Input
                      value={companyData.city}
                      onChange={(e) => setCompanyData({ ...companyData, city: e.target.value })}
                      className="mt-1 bg-white/5 border-white/10 text-white"
                    />
                  </div>
                  <div>
                    <Label className="text-slate-300">Provincia</Label>
                    <Input
                      value={companyData.province}
                      onChange={(e) => setCompanyData({ ...companyData, province: e.target.value })}
                      className="mt-1 bg-white/5 border-white/10 text-white"
                    />
                  </div>
                </div>
                <Button
                  type="submit"
                  className="w-full h-11 bg-gradient-to-r from-[#00C7D9] to-[#00A8BD] hover:from-[#00A8BD] hover:to-[#0097A8] text-white font-medium"
                  disabled={loading || !companyData.business_name || !companyData.cuit}
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Creando...
                    </>
                  ) : (
                    <>
                      Crear Empresa
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </>
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>
        )}

        {/* Step 3: Success */}
        {step === 3 && (
          <Card className="bg-white/5 border-white/10 backdrop-blur-sm">
            <CardHeader className="text-center">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-500 to-green-600 flex items-center justify-center mx-auto mb-3">
                <UserCheck className="w-6 h-6 text-white" />
              </div>
              <CardTitle className="text-xl font-bold text-white">¡Configuración Completa!</CardTitle>
              <CardDescription className="text-slate-400">
                Tu estudio contable está listo para operar
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-white/5 rounded-lg p-4 space-y-2">
                <div className="flex items-center gap-2 text-sm">
                  <Check className="w-4 h-4 text-emerald-400" />
                  <span className="text-slate-300">Organización: <strong className="text-white">{orgData.name}</strong></span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Check className="w-4 h-4 text-emerald-400" />
                  <span className="text-slate-300">Empresa: <strong className="text-white">{companyData.business_name}</strong></span>
                </div>
              </div>
              <Button
                onClick={handleFinish}
                className="w-full h-11 bg-gradient-to-r from-[#00C7D9] to-[#00A8BD] hover:from-[#00A8BD] hover:to-[#0097A8] text-white font-medium"
              >
                Ir al Dashboard
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}