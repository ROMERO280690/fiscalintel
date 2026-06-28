import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Users, Plus, Mail, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import PageHeader from "@/components/shared/PageHeader";
import StatusBadge from "@/components/shared/StatusBadge";
import EmptyState from "@/components/shared/EmptyState";
import { toast } from "sonner";

const ROLE_LABELS = {
  super_admin: "Super Admin",
  estudio_contable: "Estudio Contable",
  contador: "Contador",
  auditor: "Auditor",
  liquidador: "Liquidador",
  rrhh: "RRHH",
  administrativo: "Administrativo",
  cliente: "Cliente",
};

const ROLE_DESCRIPTIONS = {
  super_admin: "Acceso completo a todo",
  estudio_contable: "Administra múltiples empresas",
  contador: "Gestión contable y fiscal completa",
  auditor: "Solo lectura y auditoría",
  liquidador: "Liquidación de sueldos y F931",
  rrhh: "Gestión de empleados y legajos",
  administrativo: "Tareas administrativas básicas",
  cliente: "Acceso solo al portal del cliente",
};

export default function Team() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteData, setInviteData] = useState({ email: "", role: "contador" });
  const [inviting, setInviting] = useState(false);

  const loadUsers = async () => {
    try {
      const allUsers = await base44.entities.User.list();
      setUsers(allUsers);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadUsers(); }, []);

  const handleInvite = async () => {
    if (!inviteData.email) return;
    setInviting(true);
    try {
      await base44.users.inviteUser(inviteData.email, inviteData.role);
      toast.success(`Invitación enviada a ${inviteData.email}`);
      setShowInviteModal(false);
      setInviteData({ email: "", role: "contador" });
      loadUsers();
    } catch (e) {
      toast.error(e.message || "Error al enviar invitación");
    } finally {
      setInviting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-slate-200 border-t-[#00C7D9] rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        title="Equipo y Permisos"
        subtitle={`${users.length} usuario${users.length !== 1 ? "s" : ""} en tu organización`}
      >
        <Button onClick={() => setShowInviteModal(true)} className="bg-[#00C7D9] hover:bg-[#00A8BD] text-white text-xs">
          <Plus className="w-3.5 h-3.5 mr-1" /> Invitar Usuario
        </Button>
      </PageHeader>

      {users.length === 0 ? (
        <EmptyState
          icon={Users}
          title="Sin usuarios"
          description="Invitá colaboradores para trabajar en tu estudio contable."
        >
          <Button onClick={() => setShowInviteModal(true)} className="bg-[#00C7D9] hover:bg-[#00A8BD] text-white text-xs">
            <Plus className="w-3.5 h-3.5 mr-1" /> Invitar Usuario
          </Button>
        </EmptyState>
      ) : (
        <div className="bg-[#1A1A2E] rounded-xl shadow-sm border border-white/10 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/10">
                  <th className="text-left px-4 py-3 text-[11px] font-semibold text-slate-400 uppercase">Usuario</th>
                  <th className="text-left px-4 py-3 text-[11px] font-semibold text-slate-400 uppercase">Email</th>
                  <th className="text-left px-4 py-3 text-[11px] font-semibold text-slate-400 uppercase">Rol</th>
                  <th className="text-left px-4 py-3 text-[11px] font-semibold text-slate-400 uppercase">Estado</th>
                </tr>
              </thead>
              <tbody>
                {users.map(user => {
                  const initial = (user.full_name || user.email || "?").charAt(0).toUpperCase();
                  return (
                    <tr key={user.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-[#00C7D9]/20 flex items-center justify-center text-[#00C7D9] font-bold text-[11px]">
                            {initial}
                          </div>
                          <div>
                            <p className="text-[13px] font-medium text-white">{user.full_name || "Sin nombre"}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-[13px] text-slate-300">{user.email}</td>
                      <td className="px-4 py-3">
                        <div>
                          <p className="text-[12px] font-medium text-white">{ROLE_LABELS[user.role] || user.role}</p>
                          <p className="text-[10px] text-slate-400">{ROLE_DESCRIPTIONS[user.role] || ""}</p>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <StatusBadge status="active" />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {showInviteModal && (
        <InviteModal
          inviteData={inviteData}
          setInviteData={setInviteData}
          inviting={inviting}
          onInvite={handleInvite}
          onClose={() => { setShowInviteModal(false); setInviteData({ email: "", role: "contador" }); }}
        />
      )}
    </div>
  );
}

function InviteModal({ inviteData, setInviteData, inviting, onInvite, onClose }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="bg-[#1A1A2E] rounded-2xl shadow-2xl border border-white/10 w-full max-w-md">
        <div className="flex items-center justify-between p-5 border-b border-white/10">
          <h2 className="text-[15px] font-bold text-white">Invitar Usuario</h2>
          <button onClick={onClose}><Mail className="w-5 h-5 text-slate-400" /></button>
        </div>
        <div className="p-5 space-y-4">
          <div>
            <Label className="text-[12px] font-medium text-slate-300">Email *</Label>
            <Input
              type="email"
              value={inviteData.email}
              onChange={e => setInviteData(p => ({ ...p, email: e.target.value }))}
              placeholder="usuario@ejemplo.com"
              className="mt-1 h-9 bg-white/5 border-white/10 text-white"
            />
          </div>
          <div>
            <Label className="text-[12px] font-medium text-slate-300">Rol *</Label>
            <select
              value={inviteData.role}
              onChange={e => setInviteData(p => ({ ...p, role: e.target.value }))}
              className="mt-1 w-full h-9 px-3 rounded-lg border border-white/10 text-[13px] bg-white/5 text-white"
            >
              <option value="contador" className="bg-[#1A1A2E] text-white">Contador</option>
              <option value="auditor" className="bg-[#1A1A2E] text-white">Auditor</option>
              <option value="liquidador" className="bg-[#1A1A2E] text-white">Liquidador</option>
              <option value="rrhh" className="bg-[#1A1A2E] text-white">RRHH</option>
              <option value="administrativo" className="bg-[#1A1A2E] text-white">Administrativo</option>
              <option value="cliente" className="bg-[#1A1A2E] text-white">Cliente (Portal)</option>
            </select>
            <p className="text-[11px] text-slate-400 mt-1.5">{ROLE_DESCRIPTIONS[inviteData.role]}</p>
          </div>
        </div>
        <div className="flex justify-end gap-2 p-5 border-t border-white/10">
          <Button variant="outline" size="sm" onClick={onClose} className="bg-white/5 border-white/10 text-white hover:bg-white/10">
            Cancelar
          </Button>
          <Button size="sm" disabled={inviting || !inviteData.email} onClick={onInvite} className="bg-[#00C7D9] hover:bg-[#00A8BD] text-white">
            {inviting ? (
              <>
                <Loader2 className="w-3.5 h-3.5 mr-1 animate-spin" />
                Enviando...
              </>
            ) : (
              <>
                <Mail className="w-3.5 h-3.5 mr-1" />
                Enviar Invitación
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}