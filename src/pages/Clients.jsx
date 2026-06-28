import React, { useState, useEffect } from "react";
import PermissionGuard from "@/components/shared/PermissionGuard";
import { usePermissions } from "@/hooks/usePermissions";
import { base44 } from "@/api/base44Client";
import { logAction } from "@/lib/audit";
import { Plus, Search, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import PageHeader from "@/components/shared/PageHeader";
import StatusBadge from "@/components/shared/StatusBadge";
import EmptyState from "@/components/shared/EmptyState";
import ClientForm from "@/components/clients/ClientForm";
import ClientDetail from "@/components/clients/ClientDetail";

const clientTypeLabels = {
  monotributista: "Monotributista",
  responsable_inscripto: "Resp. Inscripto",
  autonomo: "Autónomo",
  sas: "SAS",
  srl: "SRL",
  sa: "SA",
  cooperativa: "Cooperativa",
  agro: "Agro",
  pyme: "PyME",
};

export default function Clients() {
  const { canViewModule, can } = usePermissions();
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editingClient, setEditingClient] = useState(null);
  const [selectedClient, setSelectedClient] = useState(null);
  const [filterType, setFilterType] = useState("");

  const loadClients = async () => {
    try {
      const data = await base44.entities.Client.list("-created_date", 200);
      setClients(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadClients(); }, []);

  const filtered = clients.filter(c => {
    const matchSearch = !search || 
      c.business_name?.toLowerCase().includes(search.toLowerCase()) ||
      c.cuit?.includes(search);
    const matchType = !filterType || c.client_type === filterType;
    return matchSearch && matchType;
  });

  const handleSave = async (data) => {
    if (editingClient) {
      await base44.entities.Client.update(editingClient.id, data);
      logAction("update", `Editó cliente: ${data.business_name}`, { entityType: "Client", entityId: editingClient.id, clientId: editingClient.id, clientName: data.business_name, oldData: { business_name: editingClient.business_name, cuit: editingClient.cuit }, newData: { business_name: data.business_name, cuit: data.cuit }, module: "Clientes" });
    } else {
      const created = await base44.entities.Client.create(data);
      logAction("create", `Creó cliente: ${data.business_name} (CUIT: ${data.cuit})`, { entityType: "Client", entityId: created?.id, clientId: created?.id, clientName: data.business_name, newData: { business_name: data.business_name, cuit: data.cuit, client_type: data.client_type }, module: "Clientes" });
    }
    setShowForm(false);
    setEditingClient(null);
    loadClients();
  };

  const handleDelete = async (id) => {
    const client = clients.find(c => c.id === id);
    await base44.entities.Client.delete(id);
    logAction("delete", `Eliminó cliente: ${client?.business_name} (CUIT: ${client?.cuit})`, { entityType: "Client", entityId: id, clientId: id, clientName: client?.business_name, oldData: { business_name: client?.business_name, cuit: client?.cuit }, module: "Clientes" });
    setSelectedClient(null);
    loadClients();
  };

  if (!canViewModule("clients")) return <PermissionGuard module="clients" />;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-slate-200 border-t-[#00C7D9] rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div>
      <PageHeader title="Clientes" subtitle={`${clients.length} clientes registrados`}>
        {can("clients", "create") && (
          <Button onClick={() => { setEditingClient(null); setShowForm(true); }} className="bg-[#00C7D9] hover:bg-[#00A8BD] text-white text-xs">
            <Plus className="w-3.5 h-3.5 mr-1" /> Nuevo Cliente
          </Button>
        )}
      </PageHeader>

      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input
            placeholder="Buscar por nombre o CUIT..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 text-[13px] h-9"
          />
        </div>
        <select
          value={filterType}
          onChange={(e) => setFilterType(e.target.value)}
          className="h-9 px-3 rounded-lg border border-slate-200 text-[13px] bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#00C7D9]/20"
        >
          <option value="">Todos los tipos</option>
          {Object.entries(clientTypeLabels).map(([k, v]) => (
            <option key={k} value={k}>{v}</option>
          ))}
        </select>
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          icon={Users}
          title="Sin clientes"
          description="Agregá tu primer cliente para comenzar a gestionar su situación fiscal."
        >
          {can("clients", "create") && (
            <Button onClick={() => setShowForm(true)} className="bg-[#00C7D9] hover:bg-[#00A8BD] text-white text-xs">
              <Plus className="w-3.5 h-3.5 mr-1" /> Nuevo Cliente
            </Button>
          )}
        </EmptyState>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-100">
                  <th className="text-left px-4 py-3 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Cliente</th>
                  <th className="text-left px-4 py-3 text-[11px] font-semibold text-slate-500 uppercase tracking-wider hidden sm:table-cell">CUIT</th>
                  <th className="text-left px-4 py-3 text-[11px] font-semibold text-slate-500 uppercase tracking-wider hidden md:table-cell">Tipo</th>
                  <th className="text-left px-4 py-3 text-[11px] font-semibold text-slate-500 uppercase tracking-wider hidden lg:table-cell">Cumplimiento</th>
                  <th className="text-left px-4 py-3 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Estado</th>
                  <th className="text-left px-4 py-3 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Riesgo</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((client) => (
                  <tr
                    key={client.id}
                    onClick={() => setSelectedClient(client)}
                    className="border-b border-slate-50 hover:bg-[#E0F7FA]/30 cursor-pointer transition-colors"
                  >
                    <td className="px-4 py-3">
                      <p className="text-[13px] font-medium text-[#1A1A2E]">{client.business_name}</p>
                      {client.fantasy_name && <p className="text-[11px] text-slate-400">{client.fantasy_name}</p>}
                    </td>
                    <td className="px-4 py-3 text-[13px] text-slate-600 hidden sm:table-cell font-mono">{client.cuit}</td>
                    <td className="px-4 py-3 text-[13px] text-slate-600 hidden md:table-cell">{clientTypeLabels[client.client_type] || client.client_type}</td>
                    <td className="px-4 py-3 hidden lg:table-cell">
                      <div className="flex items-center gap-2">
                        <div className="w-16 h-1.5 rounded-full bg-slate-100 overflow-hidden">
                          <div
                            className="h-full rounded-full transition-all"
                            style={{
                              width: `${client.compliance_score || 0}%`,
                              backgroundColor: (client.compliance_score || 0) > 70 ? "#10b981" : (client.compliance_score || 0) > 40 ? "#F59E0B" : "#E11D48"
                            }}
                          />
                        </div>
                        <span className="text-[11px] text-slate-500">{client.compliance_score || 0}%</span>
                      </div>
                    </td>
                    <td className="px-4 py-3"><StatusBadge status={client.status} /></td>
                    <td className="px-4 py-3"><StatusBadge status={client.risk_level || "low"} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {showForm && can("clients", "create") && (
        <ClientForm
          client={editingClient}
          onSave={handleSave}
          onClose={() => { setShowForm(false); setEditingClient(null); }}
        />
      )}

      {selectedClient && (
        <ClientDetail
          client={selectedClient}
          onClose={() => setSelectedClient(null)}
          onEdit={(c) => { setSelectedClient(null); setEditingClient(c); setShowForm(true); }}
          onDelete={handleDelete}
          canEdit={can("clients", "edit")}
          canDelete={can("clients", "delete")}
        />
      )}
    </div>
  );
}