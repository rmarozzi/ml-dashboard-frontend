"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { Search, Plus, Users, AlertTriangle, XCircle, CheckCircle, Eye } from "lucide-react";
import { KPICard } from "@/components/ui/KPICard";
import { StatusBadge } from "@/components/ui/Badge";
import { PlanBadge } from "@/components/ui/PlanBadge";
import { Button } from "@/components/ui/Button";
import { adminApi } from "@/lib/api";
import { formatCurrency, timeAgo } from "@/lib/utils";
import { AdminClient, PlanSlug } from "@/lib/types";

const PLANS = ["bronze", "prata", "ouro", "premium"];
const SYNC_COLOR = (t: string) => {
  if (t.includes("min") || parseInt(t) <= 2) return "#22c55e";
  if (parseInt(t) <= 4) return "#eab308";
  return "#ef4444";
};

export default function AdminClientsPage() {
  const [clients, setClients] = useState<AdminClient[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [planFilter, setPlanFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  const load = useCallback(() => {
    setLoading(true);
    const params: Record<string, string> = {};
    if (search) params.search = search;
    if (planFilter) params.plan = planFilter;
    if (statusFilter) params.status = statusFilter;
    adminApi.clients(params)
      .then(({ data }) => setClients(data.clients ?? []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [search, planFilter, statusFilter]);

  useEffect(() => { load(); }, [load]);

  const totals = {
    total: clients.length,
    active: clients.filter((c) => c.subscription?.status === "active").length,
    alerts: clients.filter((c) => c.openAlerts > 0).length,
    pastDue: clients.filter((c) => c.subscription?.status === "past_due").length,
  };

  return (
    <div className="flex flex-col gap-5">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <KPICard label="Total" value={totals.total} icon={Users} loading={loading} />
        <KPICard label="Ativos" value={totals.active} icon={CheckCircle} color="#22c55e" loading={loading} />
        <KPICard label="Com alertas" value={totals.alerts} icon={AlertTriangle} color="#eab308" loading={loading} />
        <KPICard label="Inadimplentes" value={totals.pastDue} icon={XCircle} color="#ef4444" loading={loading} />
      </div>

      <div className="flex gap-2 flex-wrap">
        <div className="flex-1 min-w-[200px] relative">
          <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-dim pointer-events-none" />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Buscar por nome, e-mail ou ID..."
            className="w-full bg-bg-3 border border-border rounded-lg pl-8 pr-3 py-2 text-sm text-white placeholder:text-dim outline-none focus:border-brand/50" />
        </div>
        <select value={planFilter} onChange={(e) => setPlanFilter(e.target.value)}
          className="bg-bg-3 border border-border rounded-lg px-3 py-2 text-sm text-muted outline-none cursor-pointer">
          <option value="">Todos os planos</option>
          {PLANS.map((p) => <option key={p} value={p} className="capitalize">{p}</option>)}
        </select>
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}
          className="bg-bg-3 border border-border rounded-lg px-3 py-2 text-sm text-muted outline-none cursor-pointer">
          <option value="">Todos os status</option>
          <option value="active">Ativo</option>
          <option value="past_due">Inadimplente</option>
          <option value="cancelled">Cancelado</option>
          <option value="trial">Trial</option>
        </select>
        <Link href="/admin/clients/new">
          <Button variant="primary" size="sm"><Plus size={13} /> Novo Cliente</Button>
        </Link>
      </div>

      <div className="bg-bg-3 border border-border rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-border bg-bg-4">
                {["Cliente", "Plano", "Status", "Contas ML", "Func.", "Pedidos", "Última Sync", "Receita/mês", "Alertas", ""].map((h) => (
                  <th key={h} className="px-3 py-3 text-[10px] font-semibold text-dim uppercase tracking-widest whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? Array.from({ length: 7 }).map((_, i) => (
                <tr key={i} className="border-b border-border/20">
                  {Array.from({ length: 10 }).map((_, j) => (
                    <td key={j} className="px-3 py-3"><div className="skeleton h-4 rounded" /></td>
                  ))}
                </tr>
              )) : clients.map((c) => {
                const syncAgo = c.lastSyncAt ? timeAgo(c.lastSyncAt) : "Nunca";
                const syncColor = c.lastSyncAt ? SYNC_COLOR(syncAgo) : "#ef4444";
                const planSlug = c.subscription?.plan?.slug as PlanSlug | undefined;
                return (
                  <tr key={c.id} className="border-b border-border/20 hover:bg-bg-4 transition-colors">
                    <td className="px-3 py-3">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-full bg-gradient-to-br from-brand/20 to-blue-500/20 flex items-center justify-center flex-shrink-0">
                          <span className="text-[11px] font-bold text-brand">{(c.name ?? c.email)[0].toUpperCase()}</span>
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-white whitespace-nowrap">{c.name ?? "—"}</p>
                          <p className="text-[11px] text-dim">{c.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-3 py-3">{planSlug ? <PlanBadge slug={planSlug} /> : <span className="text-dim text-xs">—</span>}</td>
                    <td className="px-3 py-3">{c.subscription ? <StatusBadge status={c.subscription.status} /> : <span className="text-dim text-xs">—</span>}</td>
                    <td className="px-3 py-3 font-mono text-xs text-muted">{c._count.tokens}/{c.subscription?.plan?.maxMlAccounts === -1 ? "∞" : (c.subscription?.plan?.maxMlAccounts ?? "—")}</td>
                    <td className="px-3 py-3 font-mono text-xs text-muted">{c._count.funcionarios}/{c.subscription?.plan?.maxFuncionarios === -1 ? "∞" : (c.subscription?.plan?.maxFuncionarios ?? "—")}</td>
                    <td className="px-3 py-3 font-mono text-sm text-white">{c._count.orders.toLocaleString("pt-BR")}</td>
                    <td className="px-3 py-3">
                      <div className="flex items-center gap-1.5">
                        <div className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: syncColor }} />
                        <span className="text-xs text-muted">{syncAgo}</span>
                      </div>
                    </td>
                    <td className="px-3 py-3 font-mono text-sm">
                      {c.subscription?.plan?.preco
                        ? <span className="text-white">{formatCurrency(c.subscription.plan.preco)}</span>
                        : <span className="text-dim">—</span>}
                    </td>
                    <td className="px-3 py-3">
                      {c.openAlerts > 0
                        ? <span className="bg-red-500/20 text-red-400 border border-red-500/30 text-[11px] font-bold px-2 py-0.5 rounded">{c.openAlerts}</span>
                        : <span className="text-dim text-xs">—</span>}
                    </td>
                    <td className="px-3 py-3">
                      <Link href={`/admin/clients/${c.id}`}>
                        <Button variant="ghost" size="sm"><Eye size={12} /> Ver</Button>
                      </Link>
                    </td>
                  </tr>
                );
              })}
              {!loading && clients.length === 0 && (
                <tr><td colSpan={10} className="py-16 text-center text-muted text-sm">Nenhum cliente encontrado</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
