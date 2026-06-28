import React, { useState, useEffect } from "react";
import PermissionGuard from "@/components/shared/PermissionGuard";
import { usePermissions } from "@/hooks/usePermissions";
import { base44 } from "@/api/base44Client";
import { Plus, Search, CheckSquare, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import PageHeader from "@/components/shared/PageHeader";
import StatusBadge from "@/components/shared/StatusBadge";
import EmptyState from "@/components/shared/EmptyState";
import TaskForm from "@/components/tasks/TaskForm";

const statusTabs = [
  { value: "", label: "Todas" },
  { value: "pending", label: "Pendientes" },
  { value: "in_progress", label: "En Progreso" },
  { value: "review", label: "Revisión" },
  { value: "completed", label: "Completadas" },
  { value: "overdue", label: "Vencidas" },
];

export default function Tasks() {
  const { canViewModule } = usePermissions();
  const [tasks, setTasks] = useState([]);
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editingTask, setEditingTask] = useState(null);

  const load = async () => {
    try {
      const [t, c] = await Promise.all([
        base44.entities.Task.list("-created_date", 200),
        base44.entities.Client.list("-created_date", 200),
      ]);
      setTasks(t);
      setClients(c);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const filtered = tasks.filter(t => {
    const matchSearch = !search || t.title?.toLowerCase().includes(search.toLowerCase());
    const matchStatus = !statusFilter || t.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const handleSave = async (data) => {
    if (editingTask) {
      await base44.entities.Task.update(editingTask.id, data);
    } else {
      await base44.entities.Task.create(data);
    }
    setShowForm(false);
    setEditingTask(null);
    load();
  };

  const handleStatusChange = async (task, newStatus) => {
    await base44.entities.Task.update(task.id, {
      status: newStatus,
      ...(newStatus === "completed" ? { completed_date: new Date().toISOString().split("T")[0] } : {}),
    });
    load();
  };

  const handleDelete = async (id) => {
    await base44.entities.Task.delete(id);
    load();
  };

  if (!canViewModule("tasks")) return <PermissionGuard module="tasks" />;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-slate-200 border-t-[#00C7D9] rounded-full animate-spin" />
      </div>
    );
  }

  const isOverdue = (task) => task.due_date && new Date(task.due_date) < new Date() && task.status !== "completed";

  return (
    <div>
      <PageHeader title="Gestión de Tareas" subtitle={`${tasks.length} tareas`}>
        <Button onClick={() => { setEditingTask(null); setShowForm(true); }} className="bg-[#00C7D9] hover:bg-[#00A8BD] text-white text-xs">
          <Plus className="w-3.5 h-3.5 mr-1" /> Nueva Tarea
        </Button>
      </PageHeader>

      <div className="flex gap-1 mb-4 overflow-x-auto pb-1">
        {statusTabs.map(tab => (
          <button
            key={tab.value}
            onClick={() => setStatusFilter(tab.value)}
            className={`px-3 py-1.5 rounded-lg text-[12px] font-medium whitespace-nowrap transition-colors ${
              statusFilter === tab.value
                ? "bg-[#00C7D9] text-white"
                : "bg-white text-slate-600 hover:bg-slate-50 border border-slate-200"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <Input placeholder="Buscar tareas..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9 text-[13px] h-9" />
      </div>

      {filtered.length === 0 ? (
        <EmptyState icon={CheckSquare} title="Sin tareas" description="Creá tareas para organizar tu trabajo contable.">
          <Button onClick={() => setShowForm(true)} className="bg-[#00C7D9] hover:bg-[#00A8BD] text-white text-xs">
            <Plus className="w-3.5 h-3.5 mr-1" /> Nueva Tarea
          </Button>
        </EmptyState>
      ) : (
        <div className="space-y-2">
          {filtered.map(task => (
            <div
              key={task.id}
              className={`bg-white rounded-xl p-4 shadow-sm border transition-all hover:shadow-md cursor-pointer ${
                isOverdue(task) ? "border-rose-200 bg-rose-50/30" : "border-slate-100"
              }`}
              onClick={() => { setEditingTask(task); setShowForm(true); }}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="text-[13px] font-semibold text-[#1A1A2E] truncate">{task.title}</h3>
                    <StatusBadge status={task.status} />
                    <StatusBadge status={task.priority} />
                  </div>
                  <div className="flex items-center gap-3 text-[11px] text-slate-500">
                    {task.client_name && <span>{task.client_name}</span>}
                    {task.due_date && (
                      <span className={`flex items-center gap-1 ${isOverdue(task) ? "text-rose-500 font-semibold" : ""}`}>
                        <Calendar className="w-3 h-3" /> {task.due_date}
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex gap-1" onClick={e => e.stopPropagation()}>
                  {task.status !== "completed" && (
                    <button
                      onClick={() => handleStatusChange(task, "completed")}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 transition-colors"
                      title="Marcar completada"
                    >
                      <CheckSquare className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {showForm && (
        <TaskForm
          task={editingTask}
          clients={clients}
          onSave={handleSave}
          onDelete={editingTask ? () => { handleDelete(editingTask.id); setShowForm(false); setEditingTask(null); } : null}
          onClose={() => { setShowForm(false); setEditingTask(null); }}
        />
      )}
    </div>
  );
}