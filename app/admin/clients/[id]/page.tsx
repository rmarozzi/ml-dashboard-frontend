"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Edit, AlertTriangle, RefreshCw, XCircle, BarChart2, Users, Wifi, RefreshCcw, CreditCard, Bell } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { StatusBadge } from "@/components/ui/Badge";
import { PlanBadge } from "@/components/ui/PlanBadge";
import { Button } from "@/components/ui/Button";
import { Toggle } from "@/components/ui/Toggle";
import { Modal } from "@/components/ui/Modal";
import { Input } from "@/components/ui/Input";
import { adminApi } from "@/lib/api";
import { PERMISSION_LABELS } from "@/lib/constants";
import { formatCurrency, formatDate, formatDateTime, timeAgo } from "@/lib/utils";
import { PlanSlug } from "@/lib/types";

const TABS = ["Visão Geral", "Equipe", "Contas ML", "Sincronizações", "Assinatura", "Alertas"];
const TOOLTIP_STYLE = { contentStyle: { background: "#1e1e28", border: "1px solid #2a2a38", borderRadius: 8 }, labelStyle: { color: "#f0f0f8" } };

export default function ClientDetailPage() {
  const { id } = useParams();
  const [client, setClient] = useState<any>(null);
  const [employees, setEmployees] = useState<any[]>([]);
  const [syncs, setSyncs] = useState<any[]>([]);
  const [alerts, setAlerts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState(0);
  const [editPerms, setEditPerms] = useState<any>(null);
  const [localPerms, setLocalPerms] = useState<Record<string, boolean>>({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const cid = Number(id);
    Promise.all([
      adminApi.client(cid),
      adminApi.employees(cid),
      adminApi.syncs(cid),
      adminApi.alerts({ clientId: String(cid) }),
    ]).then(([cRes, eRes, sRes, aRes]) => {
      setClient(cRes.data.client);
      setEmployees(eRes.data.employees ?? []);
      setSyncs(sRes.data.syncs ?? []);
      setAlerts(aRes.data.alerts ?? []);
    }).catch(() => {}).finally(() => setLoading(false));
  }, [id]);

  const handleToggleStatus = async () => {
    await adminApi.toggleStatus(Number(id)).catch(() => {});
    setClient((p: any) => ({ ...p, active: !p.active }));
  };

  const handleResolveAlert = async (alertId: number) => {
    const note = prompt("Nota de resolução (obrigatório):");
    if (!note) return;
    await adminApi.resolveAlert(alertId, note).catch(() => {});
    setAlerts((p) => p.map((a) => a.id === alertId ? { ...a, status: "resolved" } : a));
  };

  const openPerms = (emp: any) => {
    setEditPerms(emp);
    setLocalPerms({ ...(emp.employeePermission ?? {}) });
  };

  const savePerms = async () => {
    if (!editPerms) return;
    setSaving(true);
    try {
      await adminApi.updateEmployeePermissions(Number(id), editPerms.id, localPerms);
      setEmployees((p) => p.map((e) => e.id === editPerms.id ? { ...e, employeePermission: localPerms } : e));
      setEditPerms(null);
    } catch {} finally { setSaving(false); }
  };

  if (loading) return (
    <div className="flex flex-col gap-4">
      {Array.from({ length: 4 }).map((_, i) => <div key={i} className="skeleton h-20 rounded-xl" />)}
    </div>
  );
  if (!client) return <div className="text-muted text-sm">Cliente não encontrado</div>;

  const planSlug = client.subscription?.plan?.slug as PlanSlug | undefined;

  return (
    <div className="flex flex-col gap-5">
      <Link href="/admin/clients" className="flex items-center gap-1.5 text-muted hover:text-white text-sm w-fit">
        <ArrowLeft size={14} /> Voltar
      </Link>

      {/* Header */}
      <div className="bg-bg-3 border border-border rounded-xl p-6">
        <div className="flex items-start gap-4 flex-wrap">
          <div className="w-14 h-14 rounded-full bg-gradient-to-br from-brand/30 to-blue-500/30 flex items-center justify-center flex-shrink-0">
            <span className="font-syne text-xl font-bold text-brand">{(client.name ?? client.email)[0].toUpperCase()}</span>
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2 flex-wrap mb-1">
              <h1 className="font-syne text-xl font-bold text-white">{client.name ?? "—"}</h1>
              {planSlug && <PlanBadge slug={planSlug} />}
              <StatusBadge status={client.active ? "active" : "cancelled"} />
            </div>
            <p className="text-sm text-muted mb-1">{client.email}</p>
            <div className="flex gap-4 text-xs text-dim flex-wrap">
              <span>Cadastro: {formatDate(client.createdAt)}</span>
              <span>Último acesso: {client.lastLoginAt ? timeAgo(client.lastLoginAt) : "Nunca"}</span>
              <span>ID: #{client.id}</span>
            </div>
          </div>
          <div className="flex gap-2 flex-wrap">
            <Button variant="secondary" size="sm"><Edit size={12} /> Editar</Button>
            <Button variant={client.active ? "danger" : "secondary"} size="sm" onClick={handleToggleStatus}>
              {client.active ? <><XCircle size={12} /> Suspender</> : <><RefreshCw size={12} /> Reativar</>}
            </Button>
          </div>
        </div>
        {client.adminNotes && (
          <div className="mt-4 bg-yellow-500/10 border border-yellow-500/20 rounded-lg px-4 py-2.5">
            <p className="text-xs text-yellow-400 font-semibold mb-0.5">Nota interna</p>
            <p className="text-sm text-yellow-300">{client.adminNotes}</p>
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-border overflow-x-auto">
        {TABS.map((t, i) => (
          <button key={t} onClick={() => setTab(i)}
            className={`px-4 py-2.5 text-sm font-semibold whitespace-nowrap transition-colors border-b-2 -mb-px ${
              tab === i ? "border-brand text-brand" : "border-transparent text-muted hover:text-white"
            }`}>{t}</button>
        ))}
      </div>

      {/* Tab 0: Overview */}
      {tab === 0 && (
        <div className="flex flex-col gap-4">
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
            {[
              ["Total de Pedidos", client._count?.orders?.toLocaleString("pt-BR") ?? 0, BarChart2, "#22c55e"],
              ["Contas ML", client._count?.tokens ?? 0, Wifi, "#3b82f6"],
              ["Funcionários", client._count?.funcionarios ?? 0, Users, "#a855f7"],
            ].map(([l, v, Icon, c]: any) => (
              <div key={l} className="bg-bg-3 border border-border rounded-xl p-4 flex items-center gap-3">
                <div className="rounded-lg p-2" style={{ background: `${c}18` }}><Icon size={16} style={{ color: c }} /></div>
                <div><p className="text-[10px] text-dim uppercase tracking-widest">{l}</p><p className="font-syne text-xl font-bold text-white">{v}</p></div>
              </div>
            ))}
          </div>
          <div className="bg-bg-3 border border-border rounded-xl p-5">
            <h3 className="font-syne text-[14px] font-bold text-white mb-4">Atividade de Sync (30 dias)</h3>
            <ResponsiveContainer width="100%" height={160}>
              <BarChart data={syncs.slice(0, 30).map((s, i) => ({ dia: `D-${i}`, syncs: 1, falhas: s.status === "failed" ? 1 : 0 }))}>
                <CartesianGrid strokeDasharray="3 3" stroke="#2a2a38" />
                <XAxis dataKey="dia" tick={{ fill: "#5a5a78", fontSize: 10 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: "#5a5a78", fontSize: 10 }} axisLine={false} tickLine={false} />
                <Tooltip {...TOOLTIP_STYLE} />
                <Bar dataKey="syncs" fill="#22c55e" opacity={0.8} radius={[3,3,0,0]} name="Syncs" />
                <Bar dataKey="falhas" fill="#ef4444" opacity={0.8} radius={[3,3,0,0]} name="Falhas" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Tab 1: Team */}
      {tab === 1 && (
        <div className="bg-bg-3 border border-border rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-border bg-bg-4">
                  {["Funcionário", "Ativo", "Permissões", "Último acesso", ""].map((h) => (
                    <th key={h} className="px-4 py-3 text-[10px] font-semibold text-dim uppercase tracking-widest">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {employees.map((emp) => (
                  <tr key={emp.id} className="border-b border-border/20 hover:bg-bg-4 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-full bg-blue-500/20 flex items-center justify-center">
                          <span className="text-xs font-bold text-blue-400">{(emp.name ?? emp.email)[0].toUpperCase()}</span>
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-white">{emp.name}</p>
                          <p className="text-xs text-dim">{emp.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3"><span className={`text-xs font-semibold ${emp.active ? "text-brand" : "text-red-400"}`}>{emp.active ? "Ativo" : "Inativo"}</span></td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-1">
                        {emp.employeePermission && Object.entries(emp.employeePermission).filter(([k]) => k !== "id" && k !== "funcionarioId" && k !== "liderId").map(([key, val]) => (
                          <span key={key} className={`text-[10px] font-semibold px-1.5 py-0.5 rounded border ${val ? "bg-brand/10 text-brand border-brand/30" : "bg-white/4 text-dim border-border"}`}>
                            {PERMISSION_LABELS[key]?.label.split(" ")[0] ?? key}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-xs text-dim">{emp.lastLoginAt ? timeAgo(emp.lastLoginAt) : "Nunca"}</td>
                    <td className="px-4 py-3">
                      <Button variant="ghost" size="sm" onClick={() => openPerms(emp)}><Edit size={12} /> Permissões</Button>
                    </td>
                  </tr>
                ))}
                {employees.length === 0 && <tr><td colSpan={5} className="py-12 text-center text-muted text-sm">Nenhum funcionário</td></tr>}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 2: ML Accounts */}
      {tab === 2 && (
        <div className="bg-bg-3 border border-border rounded-xl overflow-hidden">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-border bg-bg-4">
                {["Apelido", "Nickname ML", "ID no ML", "Status", "Expiração", "Pedidos"].map((h) => (
                  <th key={h} className="px-4 py-3 text-[10px] font-semibold text-dim uppercase tracking-widest">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {(client.tokens ?? []).map((t: any) => (
                <tr key={t.id} className="border-b border-border/20 hover:bg-bg-4 transition-colors">
                  <td className="px-4 py-3 text-sm text-white">{t.apelido ?? "—"}</td>
                  <td className="px-4 py-3 text-sm text-muted">{t.mlNickname ? `@${t.mlNickname}` : "—"}</td>
                  <td className="px-4 py-3 font-mono text-xs text-dim">{t.mlUserId ?? "—"}</td>
                  <td className="px-4 py-3">
                    <StatusBadge status={new Date(t.expiresAt) < new Date() ? "cancelled" : "active"} />
                  </td>
                  <td className="px-4 py-3 text-xs text-dim">{formatDate(t.expiresAt)}</td>
                  <td className="px-4 py-3 font-mono text-sm text-white">{t._count?.orders ?? 0}</td>
                </tr>
              ))}
              {(client.tokens ?? []).length === 0 && <tr><td colSpan={6} className="py-12 text-center text-muted text-sm">Nenhuma conta conectada</td></tr>}
            </tbody>
          </table>
        </div>
      )}

      {/* Tab 3: Syncs */}
      {tab === 3 && (
        <div className="bg-bg-3 border border-border rounded-xl overflow-hidden">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-border bg-bg-4">
                {["Data/Hora", "Conta ML", "Novos", "Atualizados", "Status", "Duração", "Erro"].map((h) => (
                  <th key={h} className="px-4 py-3 text-[10px] font-semibold text-dim uppercase tracking-widest">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {syncs.map((s) => (
                <tr key={s.id} className="border-b border-border/20 hover:bg-bg-4 transition-colors">
                  <td className="px-4 py-3 text-xs text-dim whitespace-nowrap">{formatDateTime(s.createdAt)}</td>
                  <td className="px-4 py-3 text-sm text-muted">{s.token?.apelido ?? s.token?.mlNickname ?? "—"}</td>
                  <td className="px-4 py-3 font-mono text-sm text-brand">{s.ordersNew}</td>
                  <td className="px-4 py-3 font-mono text-sm text-blue-400">{s.ordersUpdated}</td>
                  <td className="px-4 py-3"><StatusBadge status={s.status} /></td>
                  <td className="px-4 py-3 font-mono text-xs text-muted">{(s.durationMs / 1000).toFixed(1)}s</td>
                  <td className="px-4 py-3 text-xs text-red-400 max-w-[200px] truncate">{s.errorMessage ?? "—"}</td>
                </tr>
              ))}
              {syncs.length === 0 && <tr><td colSpan={7} className="py-12 text-center text-muted text-sm">Nenhuma sincronização registrada</td></tr>}
            </tbody>
          </table>
        </div>
      )}

      {/* Tab 4: Subscription */}
      {tab === 4 && (
        <div className="bg-bg-3 border border-border rounded-xl p-6">
          {client.subscription ? (
            <div className="flex flex-col gap-5">
              <div className="flex items-center justify-between flex-wrap gap-3">
                {planSlug && <PlanBadge slug={planSlug} />}
                <StatusBadge status={client.subscription.status} />
              </div>
              <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 text-sm border-t border-border pt-5">
                <div><p className="text-dim text-xs mb-1">Valor mensal</p><p className="font-mono font-bold text-white text-lg">{formatCurrency(client.subscription.plan.preco)}</p></div>
                <div><p className="text-dim text-xs mb-1">Período atual</p><p className="text-muted">{formatDate(client.subscription.currentPeriodStart)} → {formatDate(client.subscription.currentPeriodEnd)}</p></div>
                <div><p className="text-dim text-xs mb-1">Cliente desde</p><p className="text-muted">{formatDate(client.createdAt)}</p></div>
              </div>
              <div className="flex gap-2 flex-wrap pt-2 border-t border-border">
                <Button variant="secondary" size="sm"><RefreshCcw size={12} /> Alterar plano</Button>
                <Button variant="danger" size="sm"><XCircle size={12} /> Cancelar assinatura</Button>
              </div>
            </div>
          ) : <p className="text-muted text-sm">Nenhuma assinatura ativa</p>}
        </div>
      )}

      {/* Tab 5: Alerts */}
      {tab === 5 && (
        <div className="flex flex-col gap-2">
          {alerts.map((a) => (
            <div key={a.id} className={`bg-bg-3 border rounded-xl px-5 py-4 flex items-center gap-3 ${
              a.severity === "critical" ? "border-red-500/30" : a.severity === "warning" ? "border-yellow-500/30" : "border-border"
            } ${a.status === "resolved" ? "opacity-50" : ""}`}>
              <div className={`w-2 h-2 rounded-full flex-shrink-0 ${a.severity === "critical" ? "bg-red-500" : a.severity === "warning" ? "bg-yellow-500" : "bg-blue-500"}`} />
              <div className="flex-1">
                <p className="text-sm text-white">{a.description}</p>
                <p className="text-xs text-dim mt-0.5">{timeAgo(a.createdAt)}</p>
              </div>
              {a.status === "open" && (
                <Button variant="secondary" size="sm" onClick={() => handleResolveAlert(a.id)}>Resolver</Button>
              )}
              {a.status === "resolved" && <span className="text-xs text-brand">Resolvido</span>}
            </div>
          ))}
          {alerts.length === 0 && <div className="bg-bg-3 border border-border rounded-xl py-12 text-center text-muted text-sm">Nenhum alerta para este cliente</div>}
        </div>
      )}

      {/* Permissions modal */}
      <Modal open={!!editPerms} onClose={() => setEditPerms(null)} title={`Permissões — ${editPerms?.name ?? ""}`} className="max-w-lg">
        <div className="flex flex-col gap-1">
          {Object.entries(PERMISSION_LABELS).map(([key, meta]) => (
            <div key={key} className="flex items-start gap-3 py-3 border-b border-border/20">
              <div className="flex-1">
                <p className="text-sm font-semibold text-white">{meta.label}</p>
                <p className="text-xs text-dim">{meta.desc}</p>
              </div>
              <Toggle active={!!localPerms[key]} onToggle={() => setLocalPerms((p) => ({ ...p, [key]: !p[key] }))} />
            </div>
          ))}
          <div className="flex gap-2 pt-4">
            <Button variant="secondary" className="flex-1" onClick={() => setEditPerms(null)}>Cancelar</Button>
            <Button variant="primary" className="flex-1" loading={saving} onClick={savePerms}>Salvar</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
