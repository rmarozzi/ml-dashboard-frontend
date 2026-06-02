"use client";

import { useEffect, useState } from "react";
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis,
  CartesianGrid, Tooltip, ResponsiveContainer,
} from "recharts";
import { TrendingUp, ShoppingCart, CreditCard, DollarSign } from "lucide-react";
import { KPICard } from "@/components/ui/KPICard";
import { StatusBadge } from "@/components/ui/Badge";
import { dashboardApi } from "@/lib/api";
import { usePlan } from "@/contexts/PlanContext";
import { formatCurrency, formatCurrencyShort } from "@/lib/utils";
import { DashboardStats } from "@/lib/types";

const TOOLTIP_STYLE = {
  contentStyle: { background: "#1e1e28", border: "1px solid #2a2a38", borderRadius: 8 },
  labelStyle: { color: "#f0f0f8" },
};

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const { hasPlan } = usePlan();
  const canViewProfit = hasPlan("prata");

  useEffect(() => {
    dashboardApi.stats()
      .then(({ data }) => setStats(data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="flex flex-col gap-6">
      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <KPICard
          label="Receita Bruta"
          value={loading ? "—" : formatCurrencyShort(stats?.totalRevenue ?? 0)}
          sub="+14.2% vs mês anterior"
          trend="up"
          icon={TrendingUp}
          loading={loading}
        />
        <KPICard
          label="Pedidos"
          value={loading ? "—" : (stats?.totalOrders ?? 0).toLocaleString("pt-BR")}
          sub="+9.8% vs mês anterior"
          trend="up"
          icon={ShoppingCart}
          color="#3b82f6"
          loading={loading}
        />
        <KPICard
          label="Ticket Médio"
          value={loading ? "—" : formatCurrencyShort(stats?.avgTicket ?? 0)}
          sub="+3.8% vs mês anterior"
          trend="up"
          icon={CreditCard}
          color="#a855f7"
          loading={loading}
        />
        {canViewProfit ? (
          <KPICard
            label="Lucro Líquido"
            value={loading ? "—" : formatCurrencyShort(stats?.totalProfit ?? 0)}
            sub="+18.1% vs mês anterior"
            trend="up"
            icon={DollarSign}
            loading={loading}
          />
        ) : (
          <div className="bg-bg-3 border border-dashed border-border rounded-xl p-5 flex flex-col items-center justify-center gap-2 text-center">
            <DollarSign size={20} className="text-dim" />
            <p className="text-xs text-dim">Lucro disponível no plano <span className="text-[#9ca3af] font-bold">🥈 Prata+</span></p>
          </div>
        )}
      </div>

      {/* Revenue chart */}
      <div className="bg-bg-3 border border-border rounded-xl p-5">
        <div className="flex items-center justify-between mb-5">
          <h2 className="font-syne text-[17px] font-bold text-white">Receita Mensal</h2>
          <span className="text-[11px] text-dim">Últimos 6 meses</span>
        </div>
        {loading ? (
          <div className="skeleton h-48 rounded-lg" />
        ) : (
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={stats?.monthlyData ?? []}>
              <defs>
                <linearGradient id="gRevenue" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#22c55e" stopOpacity={0.3} />
                  <stop offset="100%" stopColor="#22c55e" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="gProfit" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#3b82f6" stopOpacity={0.3} />
                  <stop offset="100%" stopColor="#3b82f6" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#2a2a38" />
              <XAxis dataKey="mes" tick={{ fill: "#5a5a78", fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} tick={{ fill: "#5a5a78", fontSize: 11 }} axisLine={false} tickLine={false} />
              <Tooltip {...TOOLTIP_STYLE} formatter={(v: any) => formatCurrency(v)} />
              <Area type="monotone" dataKey="receita" stroke="#22c55e" strokeWidth={2} fill="url(#gRevenue)" name="Receita" />
              {canViewProfit && (
                <Area type="monotone" dataKey="lucro" stroke="#3b82f6" strokeWidth={2} fill="url(#gProfit)" name="Lucro" />
              )}
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Status breakdown + bar chart */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-bg-3 border border-border rounded-xl p-5">
          <h2 className="font-syne text-[15px] font-bold text-white mb-4">Pedidos por Status</h2>
          {loading ? (
            <div className="space-y-3">
              {[1,2,3,4].map(i => <div key={i} className="skeleton h-8 rounded" />)}
            </div>
          ) : (
            <div className="space-y-3">
              {(stats?.statusBreakdown ?? []).map((s) => {
                const pct = Math.round((s.count / (stats?.totalOrders ?? 1)) * 100);
                const colors: Record<string, string> = { paid: "#22c55e", shipped: "#3b82f6", cancelled: "#ef4444", pending: "#eab308" };
                return (
                  <div key={s.status}>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="capitalize text-muted">{s.status}</span>
                      <span className="font-mono text-white">{s.count} ({pct}%)</span>
                    </div>
                    <div className="h-1.5 bg-bg-5 rounded-full overflow-hidden">
                      <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, background: colors[s.status] ?? "#8888a8" }} />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="bg-bg-3 border border-border rounded-xl p-5">
          <h2 className="font-syne text-[15px] font-bold text-white mb-4">Últimos 6 Meses</h2>
          {loading ? (
            <div className="skeleton h-[160px] rounded-lg" />
          ) : (
            <ResponsiveContainer width="100%" height={160}>
              <BarChart data={stats?.monthlyData ?? []}>
                <CartesianGrid strokeDasharray="3 3" stroke="#2a2a38" />
                <XAxis dataKey="mes" tick={{ fill: "#5a5a78", fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} tick={{ fill: "#5a5a78", fontSize: 11 }} axisLine={false} tickLine={false} />
                <Tooltip {...TOOLTIP_STYLE} formatter={(v: any) => formatCurrency(v)} />
                <Bar dataKey="receita" fill="#22c55e" opacity={0.8} radius={[4, 4, 0, 0]} name="Receita" />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Recent orders */}
      <div className="bg-bg-3 border border-border rounded-xl p-5">
        <div className="flex items-center justify-between mb-5">
          <h2 className="font-syne text-[15px] font-bold text-white">Pedidos Recentes</h2>
          <a href="/dashboard/orders" className="text-xs text-brand hover:underline">Ver todos →</a>
        </div>
        {loading ? (
          <div className="space-y-3">
            {[1,2,3,4,5].map(i => <div key={i} className="skeleton h-10 rounded" />)}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-border">
                  {["ID", "Produto", "Valor", canViewProfit && "Lucro", canViewProfit && "Margem", "Status"]
                    .filter(Boolean)
                    .map((h) => (
                      <th key={String(h)} className="pb-2 pr-4 text-[11px] font-semibold text-dim uppercase tracking-widest">{h}</th>
                    ))}
                </tr>
              </thead>
              <tbody>
                {(stats?.recentOrders ?? []).map((order) => (
                  <tr key={order.id} className="border-b border-border/20 hover:bg-bg-4 transition-colors">
                    <td className="py-3 pr-4 font-mono text-xs text-muted">{order.mlId}</td>
                    <td className="py-3 pr-4 text-sm text-white max-w-[180px] truncate">
                      {order.items?.[0]?.title ?? "—"}
                    </td>
                    <td className="py-3 pr-4 font-mono text-sm text-white">{formatCurrency(order.totalAmount)}</td>
                    {canViewProfit && (
                      <td className={`py-3 pr-4 font-mono text-sm ${(order.profit ?? 0) >= 0 ? "text-brand" : "text-red-400"}`}>
                        {order.profit != null ? formatCurrency(order.profit) : "—"}
                      </td>
                    )}
                    {canViewProfit && (
                      <td className={`py-3 pr-4 font-mono text-sm ${(order.margin ?? 0) >= 0 ? "text-brand" : "text-red-400"}`}>
                        {order.margin != null ? `${order.margin.toFixed(1)}%` : "—"}
                      </td>
                    )}
                    <td className="py-3"><StatusBadge status={order.status} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
