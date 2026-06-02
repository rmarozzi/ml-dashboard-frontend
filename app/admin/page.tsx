"use client";

import { useEffect, useState } from "react";
import {
  AreaChart, Area, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from "recharts";
import { DollarSign, Users, TrendingUp, TrendingDown, Star, CreditCard, RefreshCw, AlertTriangle, XCircle, Bell } from "lucide-react";
import { KPICard } from "@/components/ui/KPICard";
import { PlanBadge } from "@/components/ui/PlanBadge";
import { adminApi } from "@/lib/api";
import { formatCurrencyShort, formatPercent } from "@/lib/utils";
import { AdminOverview } from "@/lib/types";
import { PlanSlug } from "@/lib/types";

const PIE_COLORS: Record<string, string> = { bronze: "#cd7f32", prata: "#9ca3af", ouro: "#eab308", premium: "#22c55e" };
const TOOLTIP_STYLE = { contentStyle: { background: "#1e1e28", border: "1px solid #2a2a38", borderRadius: 8 }, labelStyle: { color: "#f0f0f8" } };

export default function AdminOverviewPage() {
  const [data, setData] = useState<AdminOverview | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    adminApi.overview()
      .then(({ data: d }) => setData(d))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="flex flex-col gap-6">
      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3">
        <KPICard label="MRR" value={loading ? "—" : formatCurrencyShort(data?.mrr ?? 0)}
          sub={data ? `${formatPercent(data.mrrGrowth)} vs mês ant.` : undefined}
          trend={(data?.mrrGrowth ?? 0) >= 0 ? "up" : "down"} icon={DollarSign} loading={loading} />
        <KPICard label="Clientes Ativos" value={loading ? "—" : (data?.activeClients ?? 0)} icon={Users} color="#3b82f6" loading={loading} />
        <KPICard label="Novos (30d)" value={loading ? "—" : (data?.newClients30d ?? 0)} icon={TrendingUp} loading={loading} />
        <KPICard label="Churn (30d)" value={loading ? "—" : (data?.churn30d ?? 0)}
          sub={data ? `${data.churnRate.toFixed(1)}% do total` : undefined}
          icon={TrendingDown} color="#ef4444" loading={loading} />
        <KPICard label="ARR" value={loading ? "—" : formatCurrencyShort(data?.arr ?? 0)} icon={Star} color="#eab308" loading={loading} />
        <KPICard label="Ticket Médio" value={loading ? "—" : formatCurrencyShort(data?.avgTicket ?? 0)} icon={CreditCard} color="#a855f7" loading={loading} />
      </div>

      {/* MRR chart + Plan pie */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 bg-bg-3 border border-border rounded-xl p-5">
          <div className="flex items-center justify-between mb-5">
            <h2 className="font-syne text-[15px] font-bold text-white">Evolução do MRR</h2>
            <span className="text-xs text-dim">Últimos 12 meses</span>
          </div>
          {loading ? <div className="skeleton h-52 rounded-lg" /> : (
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={data?.mrrHistory ?? []}>
                <defs>
                  <linearGradient id="gMrr" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#22c55e" stopOpacity={0.25} />
                    <stop offset="100%" stopColor="#22c55e" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#2a2a38" />
                <XAxis dataKey="mes" tick={{ fill: "#5a5a78", fontSize: 10 }} axisLine={false} tickLine={false} />
                <YAxis tickFormatter={(v) => `${(v/1000).toFixed(0)}k`} tick={{ fill: "#5a5a78", fontSize: 10 }} axisLine={false} tickLine={false} />
                <Tooltip {...TOOLTIP_STYLE} formatter={(v: any) => formatCurrencyShort(v)} />
                <Area type="monotone" dataKey="mrr" stroke="#22c55e" strokeWidth={2} fill="url(#gMrr)" name="MRR" />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>

        <div className="bg-bg-3 border border-border rounded-xl p-5">
          <h2 className="font-syne text-[15px] font-bold text-white mb-4">Clientes por Plano</h2>
          {loading ? <div className="skeleton h-36 rounded-lg mb-4" /> : (
            <div className="flex flex-col items-center">
              <ResponsiveContainer width={160} height={160}>
                <PieChart>
                  <Pie data={data?.planDistribution ?? []} cx="50%" cy="50%" innerRadius={42} outerRadius={70} dataKey="value" paddingAngle={2}>
                    {(data?.planDistribution ?? []).map((d) => (
                      <Cell key={d.slug} fill={PIE_COLORS[d.slug]} />
                    ))}
                  </Pie>
                  <Tooltip {...TOOLTIP_STYLE} />
                </PieChart>
              </ResponsiveContainer>
              <div className="space-y-2 w-full mt-2">
                {(data?.planDistribution ?? []).map((d) => (
                  <div key={d.slug} className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full" style={{ background: PIE_COLORS[d.slug] }} />
                      <PlanBadge slug={d.slug as PlanSlug} />
                    </div>
                    <span className="font-mono font-bold text-white">{d.value}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* System health */}
      <div>
        <h2 className="font-syne text-[15px] font-bold text-white mb-3">Saúde do Sistema</h2>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {[
            { label: "Syncs (24h)", value: loading ? "—" : `${(data?.systemHealth.syncs24h ?? 0).toLocaleString()} / ${data?.systemHealth.syncFails24h ?? 0} falhas`, icon: RefreshCw, color: "#22c55e" },
            { label: "Tokens expirados", value: loading ? "—" : `${data?.systemHealth.expiredTokens ?? 0} contas`, icon: AlertTriangle, color: "#eab308" },
            { label: "Inadimplentes", value: loading ? "—" : `${data?.systemHealth.pastDueClients ?? 0} clientes`, icon: XCircle, color: "#ef4444" },
            { label: "Alertas abertos", value: loading ? "—" : `${data?.systemHealth.openAlerts ?? 0} (${data?.systemHealth.criticalAlerts ?? 0} críticos)`, icon: Bell, color: "#ef4444" },
          ].map((h) => (
            <div key={h.label} className="bg-bg-3 border border-border rounded-xl p-4 flex items-center gap-3">
              <div className="rounded-lg p-2 flex-shrink-0" style={{ background: `${h.color}18` }}>
                <h.icon size={16} style={{ color: h.color }} />
              </div>
              <div>
                <p className="text-[10px] text-dim uppercase tracking-widest mb-0.5">{h.label}</p>
                <p className="font-syne text-base font-bold text-white">{h.value}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
