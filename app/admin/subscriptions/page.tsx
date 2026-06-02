"use client";

import { useEffect, useState } from "react";
import { DollarSign, Users, TrendingDown, Clock } from "lucide-react";
import { KPICard } from "@/components/ui/KPICard";
import { StatusBadge } from "@/components/ui/Badge";
import { PlanBadge } from "@/components/ui/PlanBadge";
import { adminApi } from "@/lib/api";
import { formatCurrency, formatDate, formatCurrencyShort } from "@/lib/utils";
import { PlanSlug } from "@/lib/types";

const COHORT_COLORS = (v: number) =>
  v >= 90 ? "bg-green-500/30 text-green-300" :
  v >= 70 ? "bg-green-500/15 text-green-400" :
  v >= 50 ? "bg-yellow-500/15 text-yellow-400" :
  "bg-red-500/15 text-red-400";

export default function SubscriptionsPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    adminApi.subscriptions()
      .then(({ data: d }) => setData(d))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const kpis = data?.kpis ?? {};
  const cohort = data?.cohort ?? [];
  const movements = data?.movements ?? [];
  const subscriptions = data?.subscriptions ?? [];

  return (
    <div className="flex flex-col gap-6">
      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <KPICard label="MRR Total" value={loading ? "—" : formatCurrencyShort(kpis.mrr ?? 0)} icon={DollarSign} loading={loading} />
        <KPICard label="Trials ativos" value={loading ? "—" : kpis.activeTrials ?? 0} sub={`Média ${kpis.avgTrialDaysLeft ?? 0} dias restantes`} icon={Clock} color="#a855f7" loading={loading} />
        <KPICard label="Renovações (7d)" value={loading ? "—" : formatCurrencyShort(kpis.upcomingRenewals ?? 0)} icon={TrendingDown} color="#22c55e" loading={loading} />
        <KPICard label="Cancelamentos agendados" value={loading ? "—" : kpis.scheduledCancellations ?? 0} icon={Users} color="#ef4444" loading={loading} />
      </div>

      {/* Cohort table */}
      <div className="bg-bg-3 border border-border rounded-xl p-5">
        <h2 className="font-syne text-[15px] font-bold text-white mb-5">Retenção por Cohort</h2>
        {loading ? <div className="skeleton h-48 rounded-lg" /> : cohort.length === 0 ? (
          <p className="text-muted text-sm">Dados de cohort indisponíveis</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="pb-3 pr-4 text-left text-[11px] text-dim uppercase tracking-widest font-semibold">Entrada</th>
                  <th className="pb-3 pr-4 text-left text-[11px] text-dim uppercase tracking-widest font-semibold">Clientes</th>
                  {["1m", "2m", "3m", "6m", "12m"].map((h) => (
                    <th key={h} className="pb-3 px-2 text-center text-[11px] text-dim uppercase tracking-widest font-semibold">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {cohort.map((row: any) => (
                  <tr key={row.month} className="border-b border-border/20">
                    <td className="py-2.5 pr-4 font-mono text-xs text-muted">{row.month}</td>
                    <td className="py-2.5 pr-4 font-semibold text-white">{row.total}</td>
                    {["m1","m2","m3","m6","m12"].map((k) => {
                      const val = row[k];
                      return (
                        <td key={k} className="py-2.5 px-2 text-center">
                          {val != null ? (
                            <span className={`inline-block px-2 py-0.5 rounded text-xs font-bold ${COHORT_COLORS(val)}`}>
                              {val}%
                            </span>
                          ) : <span className="text-dim text-xs">—</span>}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Movements feed + subscriptions table side by side */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Movements feed */}
        <div className="bg-bg-3 border border-border rounded-xl p-5">
          <h2 className="font-syne text-[15px] font-bold text-white mb-4">Movimentações Recentes</h2>
          <div className="flex flex-col gap-2 max-h-[340px] overflow-y-auto pr-1">
            {loading ? Array.from({ length: 5 }).map((_, i) => <div key={i} className="skeleton h-14 rounded-lg" />) :
             movements.length === 0 ? <p className="text-muted text-sm">Nenhuma movimentação</p> :
             movements.map((m: any) => {
               const colors: Record<string, string> = {
                 new: "#22c55e", upgrade: "#3b82f6", downgrade: "#eab308",
                 cancel: "#ef4444", reactivate: "#a855f7", past_due: "#ef4444",
               };
               const labels: Record<string, string> = {
                 new: "Novo cliente", upgrade: "Upgrade", downgrade: "Downgrade",
                 cancel: "Cancelamento", reactivate: "Reativação", past_due: "Inadimplência",
               };
               const color = colors[m.changeType] ?? "#8888a8";
               return (
                 <div key={m.id} className="flex items-start gap-3 py-2.5 border-b border-border/20">
                   <div className="w-2 h-2 rounded-full flex-shrink-0 mt-1.5" style={{ background: color }} />
                   <div className="flex-1 min-w-0">
                     <p className="text-sm font-semibold" style={{ color }}>{labels[m.changeType] ?? m.changeType}</p>
                     <p className="text-xs text-muted truncate">{m.user?.name ?? m.user?.email}</p>
                     {m.toPlan && <p className="text-xs text-dim">→ {m.toPlan.nome}</p>}
                   </div>
                   <span className="text-[11px] text-dim flex-shrink-0">{formatDate(m.createdAt)}</span>
                 </div>
               );
             })}
          </div>
        </div>

        {/* MRR por plano */}
        <div className="bg-bg-3 border border-border rounded-xl p-5">
          <h2 className="font-syne text-[15px] font-bold text-white mb-4">MRR por Plano</h2>
          {loading ? <div className="space-y-3">{Array.from({length:4}).map((_,i)=><div key={i} className="skeleton h-10 rounded"/>)}</div> :
           (data?.mrrByPlan ?? []).map((p: any) => {
             const total = data?.kpis?.mrr ?? 1;
             const pct = Math.round((p.mrr / total) * 100);
             const colors: Record<string, string> = { bronze: "#cd7f32", prata: "#9ca3af", ouro: "#eab308", premium: "#22c55e" };
             const c = colors[p.slug] ?? "#8888a8";
             return (
               <div key={p.slug} className="mb-4">
                 <div className="flex justify-between mb-1">
                   <div className="flex items-center gap-2">
                     <PlanBadge slug={p.slug as PlanSlug} />
                     <span className="text-xs text-dim">{p.count} clientes</span>
                   </div>
                   <div className="text-right">
                     <span className="font-mono text-sm font-bold text-white">{formatCurrencyShort(p.mrr)}</span>
                     <span className="text-xs text-dim ml-1">({pct}%)</span>
                   </div>
                 </div>
                 <div className="h-1.5 bg-bg-5 rounded-full overflow-hidden">
                   <div className="h-full rounded-full" style={{ width: `${pct}%`, background: c }} />
                 </div>
               </div>
             );
           })}
        </div>
      </div>

      {/* Subscriptions table */}
      <div className="bg-bg-3 border border-border rounded-xl overflow-hidden">
        <div className="px-5 py-4 border-b border-border">
          <h2 className="font-syne text-[15px] font-bold text-white">Todas as Assinaturas</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-border bg-bg-4">
                {["Cliente", "Plano", "Valor", "Status", "Início", "Próxima cobrança", "Dias como cliente"].map((h) => (
                  <th key={h} className="px-4 py-3 text-[10px] font-semibold text-dim uppercase tracking-widest whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? Array.from({length:5}).map((_,i) => (
                <tr key={i} className="border-b border-border/20">
                  {Array.from({length:7}).map((_,j) => <td key={j} className="px-4 py-3"><div className="skeleton h-4 rounded"/></td>)}
                </tr>
              )) : subscriptions.map((s: any) => {
                const days = Math.floor((Date.now() - new Date(s.currentPeriodStart).getTime()) / 86400000);
                return (
                  <tr key={s.id} className="border-b border-border/20 hover:bg-bg-4 transition-colors">
                    <td className="px-4 py-3">
                      <p className="text-sm font-semibold text-white">{s.user?.name ?? "—"}</p>
                      <p className="text-xs text-dim">{s.user?.email}</p>
                    </td>
                    <td className="px-4 py-3">{s.plan?.slug ? <PlanBadge slug={s.plan.slug as PlanSlug} /> : "—"}</td>
                    <td className="px-4 py-3 font-mono text-sm text-white">{formatCurrency(s.plan?.preco ?? 0)}</td>
                    <td className="px-4 py-3"><StatusBadge status={s.status} /></td>
                    <td className="px-4 py-3 text-xs text-dim">{formatDate(s.currentPeriodStart)}</td>
                    <td className="px-4 py-3 text-xs text-dim">{formatDate(s.currentPeriodEnd)}</td>
                    <td className="px-4 py-3 font-mono text-sm text-muted">{days}d</td>
                  </tr>
                );
              })}
              {!loading && subscriptions.length === 0 && (
                <tr><td colSpan={7} className="py-16 text-center text-muted text-sm">Nenhuma assinatura</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
