/* eslint-disable react-hooks/rules-of-hooks, react-hooks/exhaustive-deps */
"use client";

import { useEffect, useState } from "react";
import { Plus, Users, CheckCircle, XCircle, Edit, Trash2 } from "lucide-react";
import { KPICard } from "@/components/ui/KPICard";
import { Toggle } from "@/components/ui/Toggle";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import { UpgradeGate } from "@/components/ui/UpgradeGate";
import { employeesApi, mlApi } from "@/lib/api";
import { usePlan } from "@/contexts/PlanContext";
import { PERMISSION_LABELS } from "@/lib/constants";
import { formatDate, timeAgo } from "@/lib/utils";
import { Employee, MlToken } from "@/lib/types";

export default function EmployeesPage() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [mlTokens, setMlTokens] = useState<MlToken[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [editingPerms, setEditingPerms] = useState<Employee | null>(null);
  const [saving, setSaving] = useState(false);
  const [createForm, setCreateForm] = useState({ name: "", email: "", password: "" });
  const [localPerms, setLocalPerms] = useState<Record<string, boolean>>({});
  const [localMlIds, setLocalMlIds] = useState<number[]>([]);
  const { hasPlan, plan } = usePlan();

  if (!hasPlan("prata")) {
    return (
      <UpgradeGate feature="Gestão de Funcionários" requiredPlan="prata"
        benefits={["Adicione colaboradores à sua operação", "Controle granular de permissões", "Restrinja acesso por conta ML"]} />
    );
  }

  const canGranular = hasPlan("ouro");
  const maxEmployees = plan?.maxFuncionarios ?? 0;
  const activeCount = employees.filter((e) => e.active).length;
  const slotsLeft = maxEmployees === -1 ? "∞" : Math.max(0, maxEmployees - activeCount);

  useEffect(() => {
    Promise.all([employeesApi.list(), mlApi.status()])
      .then(([empRes, mlRes]) => {
        setEmployees(empRes.data.employees ?? []);
        setMlTokens(mlRes.data.tokens ?? []);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const handleCreate = async () => {
    if (!createForm.name || !createForm.email || !createForm.password) return;
    setSaving(true);
    try {
      const { data } = await employeesApi.create(createForm);
      setEmployees((p) => [...p, data.employee]);
      setShowCreate(false);
      setCreateForm({ name: "", email: "", password: "" });
    } catch {} finally { setSaving(false); }
  };

  const handleToggle = async (emp: Employee) => {
    await employeesApi.toggleActive(emp.id).catch(() => {});
    setEmployees((p) => p.map((e) => e.id === emp.id ? { ...e, active: !e.active } : e));
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Remover funcionário permanentemente?")) return;
    await employeesApi.delete(id).catch(() => {});
    setEmployees((p) => p.filter((e) => e.id !== id));
  };

  const openPerms = (emp: Employee) => {
    setEditingPerms(emp);
    setLocalPerms({ ...emp.employeePermission } as Record<string, boolean>);
    setLocalMlIds([]);
  };

  const savePerms = async () => {
    if (!editingPerms) return;
    setSaving(true);
    try {
      await Promise.all([
        employeesApi.updatePermissions(editingPerms.id, localPerms),
        canGranular && employeesApi.updateMlAccess(editingPerms.id, localMlIds),
      ]);
      setEmployees((p) => p.map((e) => e.id === editingPerms.id
        ? { ...e, employeePermission: localPerms as unknown as Employee["employeePermission"] } : e));
      setEditingPerms(null);
    } catch {} finally { setSaving(false); }
  };

  return (
    <div className="flex flex-col gap-5">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <KPICard label="Total" value={employees.length} icon={Users} loading={loading} />
        <KPICard label="Ativos" value={activeCount} icon={CheckCircle} color="#22c55e" loading={loading} />
        <KPICard label="Inativos" value={employees.filter((e) => !e.active).length} icon={XCircle} color="#ef4444" loading={loading} />
        <KPICard label="Slots livres" value={slotsLeft} icon={Users} color="#eab308" loading={loading} />
      </div>

      <div className="flex justify-end">
        <Button variant="primary" size="sm"
          disabled={maxEmployees !== -1 && activeCount >= maxEmployees}
          onClick={() => setShowCreate(true)}>
          <Plus size={14} /> Adicionar Funcionário
        </Button>
      </div>

      <div className="bg-bg-3 border border-border rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-border bg-bg-4">
                {["Funcionário", "Ativo", canGranular ? "Permissões" : "Acesso", "Contas ML", "Último acesso", ""].map((h) => (
                  <th key={h} className="px-4 py-3 text-[10px] font-semibold text-dim uppercase tracking-widest">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? Array.from({ length: 4 }).map((_, i) => (
                <tr key={i} className="border-b border-border/20">
                  {Array.from({ length: 6 }).map((_, j) => (
                    <td key={j} className="px-4 py-3"><div className="skeleton h-5 rounded" /></td>
                  ))}
                </tr>
              )) : employees.map((emp) => (
                <tr key={emp.id} className="border-b border-border/20 hover:bg-bg-4 transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500/30 to-purple-500/30 flex items-center justify-center flex-shrink-0">
                        <span className="text-xs font-bold text-blue-400">{(emp.name ?? emp.email)[0].toUpperCase()}</span>
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-white">{emp.name}</p>
                        <p className="text-xs text-dim">{emp.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <Toggle active={emp.active} onToggle={() => handleToggle(emp)} />
                  </td>
                  <td className="px-4 py-3">
                    {canGranular && emp.employeePermission ? (
                      <div className="flex flex-wrap gap-1">
                        {Object.entries(emp.employeePermission).map(([key, val]) => (
                          <span key={key} className={`text-[10px] font-semibold px-1.5 py-0.5 rounded border ${
                            val ? "bg-brand/10 text-brand border-brand/30" : "bg-white/4 text-dim border-border"
                          }`}>
                            {PERMISSION_LABELS[key]?.label.split(" ")[0] ?? key}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <span className="text-xs text-muted">Acesso espelhado</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-sm text-muted">{emp.mlAccessCount}/{emp.totalMlAccounts}</td>
                  <td className="px-4 py-3 text-xs text-dim">{emp.lastLoginAt ? timeAgo(emp.lastLoginAt) : "Nunca"}</td>
                  <td className="px-4 py-3">
                    <div className="flex gap-1.5">
                      {canGranular && (
                        <Button variant="ghost" size="sm" onClick={() => openPerms(emp)}>
                          <Edit size={12} /> Permissões
                        </Button>
                      )}
                      <Button variant="ghost" size="sm" onClick={() => handleDelete(emp.id)}>
                        <Trash2 size={12} className="text-red-400" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
              {!loading && employees.length === 0 && (
                <tr><td colSpan={6} className="py-16 text-center text-muted text-sm">Nenhum funcionário cadastrado</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create modal */}
      <Modal open={showCreate} onClose={() => setShowCreate(false)} title="Novo Funcionário" className="max-w-sm">
        <div className="flex flex-col gap-4">
          <Input label="Nome completo" placeholder="Maria Silva" value={createForm.name}
            onChange={(e) => setCreateForm((p) => ({ ...p, name: e.target.value }))} />
          <Input label="E-mail" type="email" placeholder="maria@empresa.com" value={createForm.email}
            onChange={(e) => setCreateForm((p) => ({ ...p, email: e.target.value }))} />
          <Input label="Senha inicial" type="password" placeholder="••••••••" value={createForm.password}
            onChange={(e) => setCreateForm((p) => ({ ...p, password: e.target.value }))} />
          {!canGranular && (
            <p className="text-xs text-yellow-400 bg-yellow-500/10 border border-yellow-500/20 rounded-lg px-3 py-2">
              No plano Prata o funcionário herda automaticamente seus acessos. Upgrade para Ouro para permissões granulares.
            </p>
          )}
          <div className="flex gap-2 pt-2">
            <Button variant="secondary" className="flex-1" onClick={() => setShowCreate(false)}>Cancelar</Button>
            <Button variant="primary" className="flex-1" loading={saving} onClick={handleCreate}>Criar</Button>
          </div>
        </div>
      </Modal>

      {/* Permissions modal */}
      <Modal open={!!editingPerms} onClose={() => setEditingPerms(null)} title={`Permissões — ${editingPerms?.name ?? ""}`} className="max-w-lg">
        <div className="flex flex-col gap-1">
          {Object.entries(PERMISSION_LABELS).map(([key, meta]) => (
            <div key={key} className="flex items-start gap-3 py-3 border-b border-border/20">
              <div className="flex-1">
                <p className="text-sm font-semibold text-white">{meta.label}</p>
                <p className="text-xs text-dim">{meta.desc}</p>
                {meta.dep && <p className="text-[11px] text-yellow-400 mt-0.5">Requer: {PERMISSION_LABELS[meta.dep]?.label}</p>}
              </div>
              <Toggle
                active={!!localPerms[key]}
                onToggle={() => setLocalPerms((p) => ({ ...p, [key]: !p[key] }))}
              />
            </div>
          ))}
          {mlTokens.length > 0 && (
            <div className="mt-4">
              <p className="text-xs font-semibold text-muted uppercase tracking-widest mb-2">Contas ML acessíveis</p>
              {mlTokens.map((t) => (
                <label key={t.id} className="flex items-center gap-2.5 py-2 cursor-pointer">
                  <input type="checkbox" checked={localMlIds.includes(t.id)}
                    onChange={(e) => setLocalMlIds((p) => e.target.checked ? [...p, t.id] : p.filter((id) => id !== t.id))}
                    className="accent-brand" />
                  <span className="text-sm text-muted">{t.apelido ?? t.mlNickname ?? `Conta #${t.id}`}</span>
                  {t.isExpired && <span className="text-[10px] text-red-400">expirado</span>}
                </label>
              ))}
            </div>
          )}
          <div className="flex gap-2 pt-4">
            <Button variant="secondary" className="flex-1" onClick={() => setEditingPerms(null)}>Cancelar</Button>
            <Button variant="primary" className="flex-1" loading={saving} onClick={savePerms}>Salvar</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
