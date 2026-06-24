/* eslint-disable react-hooks/rules-of-hooks, react-hooks/exhaustive-deps */
"use client";

import { useEffect, useState } from "react";
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from "recharts";
import { TrendingUp, DollarSign, ShoppingCart, CreditCard, Percent, TrendingDown } from "lucide-react";
import { KPICard } from "@/components/ui/KPICard";
import { UpgradeGate } from "@/components/ui/UpgradeGate";
import { analyticsApi } from "@/lib/api";
import { usePlan } from "@/contexts/PlanContext";
import { usePermissions } from "@/contexts/PermissionsContext";
import { formatCurrency, formatCurrencyShort } from "@/lib/utils";
import { AnalyticsData } from "@/lib/types";

const RANGES = [
  { label: "Hoje", value: "today" },
  { label: "7 dias", value: "7d" },
  { label: "30 dias", value: "30d" },
  { label: "90 dias", value: "90d" },
  { label: "12 meses", value: "12m" },
];
const PIE_COLORS = ["#22c55e", "#3b82f6", "#eab308", "#a855f7", "#f97316"];

const TOOLTIP_STYLE = {
  contentStyle: { background: "#1e1e28", border: "1px solid #2a2a38", borderRadius: 8 },
  labelStyle: { color: "#f0f0f8" },
};

export default function AnalyticsPage() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [range, setRange] = useState("30d");
  const { hasPlan, hasFeature } = usePlan();
  const { can, isFuncionario } = usePermissions();

  useEffect(() => {
    setLoading(true);
    analyticsApi.get({ range })
      .then(({ data: d }) => setData(d))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [range]);

  return (
    <div className="flex flex-col gap-5">
      {/* Range selector */}
      <div className="flex gap-2 flex-wrap">
        {RANGES.map((r) => (
          <button key={r.value} onClick={() => setRange(r.value)}
            className={`px-4 py-1.5 rounded-lg border text-xs font-semibold transition-all ${
              range === r.value
                ? "bg-brand/15 border-brand/50 text-brand"
                : "bg-bg-3 border-border text-muted hover:text-white"
            }`}>
            {r.label}
          </button>
        ))}
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
        <KPICard label="Receita Bruta" value={loading ? "—" : formatCurrencyShort(data?.revenue ?? 0)} icon={TrendingUp} loading={loading} />
<KPICard label="Custo Total" value={loading ? "—" : formatCurrencyShort(data?.cost ?? 0)} icon={TrendingDown} color="#ef4444" loading={loading} />
<KPICard label="Lucro Líquido" value={loading ? "—" : formatCurrencyShort(data?.profit ?? 0)} icon={DollarSign} loading={loading} />
<KPICard label="Margem Média" value={loading ? "—" : `${(data?.margin ?? 0).toFixed(1)}%`} icon={Percent} color="#a855f7" loading={loading} />
<KPICard label="Qtd. Pedidos" value={loading ? "—" : (data?.orders ?? 0).toLocaleString("pt-BR")} icon={ShoppingCart} color="#3b82f6" loading={loading} />
<KPICard label="Ticket Médio" value={loading ? "—" : formatCurrencyShort(data?.avgTicket ?? 0)} icon={CreditCard} color="#eab308" loading={loading} />
      </div>

      {/* Area chart */}
      <div className="bg-bg-3 border border-border rounded-xl p-5">
        <h2 className="font-syne text-[15px] font-bold text-white mb-5">Composição Financeira</h2>
        {loading ? <div className="skeleton h-52 rounded-lg" /> : (
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={data?.byPeriod ?? []}>
              <defs>
                <linearGradient id="gR" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#22c55e" stopOpacity={0.3} />
                  <stop offset="100%" stopColor="#22c55e" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="gP" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#3b82f6" stopOpacity={0.3} />
                  <stop offset="100%" stopColor="#3b82f6" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#2a2a38" />
              <XAxis dataKey="label" tick={{ fill: "#5a5a78", fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tickFormatter={(v) => `${(v/1000).toFixed(0)}k`} tick={{ fill: "#5a5a78", fontSize: 11 }} axisLine={false} tickLine={false} />
              <Tooltip {...TOOLTIP_STYLE} formatter={(v: any) => formatCurrency(v)} />
              <Legend wrapperStyle={{ fontSize: 12, color: "#8888a8" }} />
              <Area type="monotone" dataKey="receita" stroke="#22c55e" strokeWidth={2} fill="url(#gR)" name="Receita" />
              <Area type="monotone" dataKey="lucro" stroke="#3b82f6" strokeWidth={2} fill="url(#gP)" name="Lucro" />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Stacked bar */}
        <div className="bg-bg-3 border border-border rounded-xl p-5">
          <h2 className="font-syne text-[15px] font-bold text-white mb-5">Receita vs Custo</h2>
          {loading ? <div className="skeleton h-48 rounded-lg" /> : (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={data?.byPeriod ?? []}>
                <CartesianGrid strokeDasharray="3 3" stroke="#2a2a38" />
                <XAxis dataKey="label" tick={{ fill: "#5a5a78", fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tickFormatter={(v) => `${(v/1000).toFixed(0)}k`} tick={{ fill: "#5a5a78", fontSize: 11 }} axisLine={false} tickLine={false} />
                <Tooltip {...TOOLTIP_STYLE} formatter={(v: any) => formatCurrency(v)} />
                <Bar dataKey="custo" stackId="a" fill="#ef4444" opacity={0.7} name="Custo" />
                <Bar dataKey="lucro" stackId="a" fill="#22c55e" opacity={0.9} name="Lucro" radius={[4,4,0,0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Payment methods pie */}
        <div className="bg-bg-3 border border-border rounded-xl p-5">
          <h2 className="font-syne text-[15px] font-bold text-white mb-5">Formas de Pagamento</h2>
          {loading ? <div className="skeleton h-48 rounded-lg" /> : (
            <div className="flex items-center gap-4">
              <ResponsiveContainer width={160} height={160}>
                <PieChart>
                  <Pie data={data?.paymentMethods ?? []} cx="50%" cy="50%" innerRadius={45} outerRadius={72} dataKey="value" paddingAngle={2}>
                    {(data?.paymentMethods ?? []).map((_, i) => (
                      <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip {...TOOLTIP_STYLE} formatter={(v: any) => `${v}%`} />
                </PieChart>
              </ResponsiveContainer>
              <div className="flex-1 space-y-2">
                {(data?.paymentMethods ?? []).map((m, i) => (
                  <div key={m.name} className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: PIE_COLORS[i % PIE_COLORS.length] }} />
                    <span className="text-xs text-muted flex-1">{m.name}</span>
                    <span className="text-xs font-bold font-mono text-white">{m.value}%</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
