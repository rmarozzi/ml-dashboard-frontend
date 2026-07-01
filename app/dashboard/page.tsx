"use client";

import { useEffect, useState, useRef } from "react";
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis,
  CartesianGrid, Tooltip, ResponsiveContainer,
} from "recharts";
import { TrendingUp, ShoppingCart, CreditCard, DollarSign, Percent, Package2, MapPin, Store, ChevronDown, Calendar } from "lucide-react";
import { KPICard } from "@/components/ui/KPICard";
import { StatusBadge } from "@/components/ui/Badge";
import { dashboardApi } from "@/lib/api";
import { usePlan } from "@/contexts/PlanContext";
import { formatCurrency, formatCurrencyShort } from "@/lib/utils";

const TOOLTIP_STYLE = {
  contentStyle: { background: "#1e1e28", border: "1px solid #2a2a38", borderRadius: 8 },
  labelStyle: { color: "#f0f0f8" },
};

export default function DashboardPage() {
const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [brandFilter, setBrandFilter] = useState<string[]>([]);
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [brandDropdownOpen, setBrandDropdownOpen] = useState(false);
  const brandDropdownRef = useRef<HTMLDivElement>(null);
  const { hasPlan } = usePlan();
  const canViewProfit = hasPlan("prata");

  useEffect(() => {
    setLoading(true);
    const params: Record<string, string> = {};
    if (brandFilter.length > 0) params.brand = brandFilter.join(",");
    if (dateFrom) params.dateFrom = dateFrom;
    if (dateTo) params.dateTo = dateTo;
    dashboardApi.stats(params)
      .then(({ data }) => setStats(data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [brandFilter, dateFrom, dateTo]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (brandDropdownRef.current && !brandDropdownRef.current.contains(e.target as Node)) {
        setBrandDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const toggleBrand = (b: string) => {
    setBrandFilter((prev) => (prev.includes(b) ? prev.filter((x) => x !== b) : [...prev, b]));
  };

  const Pct = ({ value, color = "muted" }: { value: number | null; color?: string }) => {
    if (value == null) return <span className="text-dim">—</span>;
    return <span className={`text-${color}`}>{value.toFixed(1)}%</span>;
  };

  return (
    <div className="flex flex-col gap-6">

{/* ── Filtros ──────────────────────────────────────────────────────── */}
      <div className="flex flex-wrap items-center gap-3">
        {!loading && (stats?.availableBrands?.length ?? 0) > 0 && (
          <div className="relative" ref={brandDropdownRef}>
            <button
              onClick={() => setBrandDropdownOpen((v) => !v)}
              className="flex items-center gap-2 bg-bg-3 border border-border rounded-lg px-3 py-2 text-sm text-muted hover:text-white transition-colors max-w-xs"
            >
              <span className="truncate">
                {brandFilter.length === 0
                  ? "Todas as marcas"
                  : brandFilter.length === 1
                  ? brandFilter[0]
                  : `${brandFilter.length} marcas selecionadas`}
              </span>
              <ChevronDown size={14} className={`shrink-0 transition-transform ${brandDropdownOpen ? "rotate-180" : ""}`} />
            </button>
            {brandDropdownOpen && (
              <div className="absolute z-20 mt-1 w-56 max-h-64 overflow-y-auto bg-bg-3 border border-border rounded-lg shadow-lg py-1">
                {stats.availableBrands.map((b: string) => (
                  <label
                    key={b}
                    className="flex items-center gap-2 px-3 py-2 text-sm text-muted hover:bg-bg-4 cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      checked={brandFilter.includes(b)}
                      onChange={() => toggleBrand(b)}
                      className="accent-brand"
                    />
                    <span>{b}</span>
                  </label>
                ))}
              </div>
            )}
          </div>
        )}

        <div className="flex items-center gap-2 bg-bg-3 border border-border rounded-lg px-3 py-1.5">
          <Calendar size={14} className="text-dim shrink-0" />
          <input
            type="date"
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
            className="bg-transparent text-sm text-muted outline-none"
          />
          <span className="text-dim text-xs">até</span>
          <input
            type="date"
            value={dateTo}
            onChange={(e) => setDateTo(e.target.value)}
            className="bg-transparent text-sm text-muted outline-none"
          />
        </div>

        <button
          onClick={() => {
            const today = new Date().toISOString().slice(0, 10);
            setDateFrom(today);
            setDateTo(today);
          }}
          className="text-xs text-brand hover:underline"
        >
          Hoje
        </button>

        {(brandFilter.length > 0 || dateFrom || dateTo) && (
          <button
            onClick={() => {
              setBrandFilter([]);
              setDateFrom("");
              setDateTo("");
            }}
            className="text-xs text-red-400 hover:text-red-300 transition-colors"
          >
            Limpar filtros
          </button>
        )}
      </div>

      {/* ── KPIs ──────────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3">
        <KPICard
          label="Faturamento"
          value={loading ? "—" : formatCurrencyShort(stats?.totalRevenue ?? 0)}
          icon={TrendingUp}
          loading={loading}
        />
        {canViewProfit && (
          <KPICard
            label="CMV"
            value={loading ? "—" : formatCurrencyShort(stats?.totalCmv ?? 0)}
            sub={!loading && stats?.totalRevenue > 0 ? `${((stats.totalCmv / stats.totalRevenue) * 100).toFixed(1)}%` : undefined}
            icon={Package2}
            color="#ef4444"
            loading={loading}
          />
        )}
        {canViewProfit && (
          <KPICard
            label="Margem de Contribuição"
            value={loading ? "—" : formatCurrencyShort(stats?.totalProfit ?? 0)}
            sub={!loading ? `${(stats?.margin ?? 0).toFixed(1)}%` : undefined}
            icon={Percent}
            color="#a855f7"
            loading={loading}
          />
        )}
        <KPICard
          label="Pgto. Comissão"
          value="—"
          sub="Em breve"
          icon={DollarSign}
          color="#eab308"
          loading={loading}
        />
        <KPICard
          label="Qtde Vendida"
          value={loading ? "—" : (stats?.totalOrders ?? 0).toLocaleString("pt-BR")}
          icon={ShoppingCart}
          color="#3b82f6"
          loading={loading}
        />
        <KPICard
          label="Ticket Médio"
          value={loading ? "—" : formatCurrencyShort(stats?.avgTicket ?? 0)}
          icon={CreditCard}
          color="#22c55e"
          loading={loading}
        />
      </div>

      {/* ── Gráfico de Receita ───────────────────────────────────────────── */}
      <div className="bg-bg-3 border border-border rounded-xl p-5">
        <div className="flex items-center justify-between mb-5">
          <h2 className="font-syne text-[17px] font-bold text-white">Receita Mensal</h2>
          <span className="text-[11px] text-dim">Últimos 6 meses</span>
        </div>
        {loading ? <div className="skeleton h-48 rounded-lg" /> : (
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

      {/* ── Status breakdown + bar chart ─────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-bg-3 border border-border rounded-xl p-5">
          <h2 className="font-syne text-[15px] font-bold text-white mb-4">Pedidos por Status</h2>
          {loading ? (
            <div className="space-y-3">{[1,2,3,4].map(i => <div key={i} className="skeleton h-8 rounded" />)}</div>
          ) : (
            <div className="space-y-3">
              {(stats?.statusBreakdown ?? []).map((s: any) => {
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
          {loading ? <div className="skeleton h-[160px] rounded-lg" /> : (
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

      {/* ── Venda por Canal ──────────────────────────────────────────────── */}
      <div className="bg-bg-3 border border-border rounded-xl overflow-hidden">
        <div className="flex items-center gap-2 px-5 py-4 border-b border-border">
          <Store size={15} className="text-brand" />
          <h2 className="font-syne text-[15px] font-bold text-white">Venda por Canal</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-border bg-bg-4">
                {["Canal", "Qtde", "Faturado", "Fat. %", canViewProfit && "CMV", canViewProfit && "CMV %", canViewProfit && "Margem", canViewProfit && "Margem %", "Comissão"]
                  .filter(Boolean).map((h) => (
                    <th key={String(h)} className="px-4 py-3 text-[10px] font-semibold text-dim uppercase tracking-widest whitespace-nowrap">{h}</th>
                  ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={9} className="px-4 py-3"><div className="skeleton h-5 rounded" /></td></tr>
              ) : (stats?.vendaPorCanal ?? []).map((c: any) => (
                <tr key={c.canal} className="border-b border-border/20 hover:bg-bg-4 transition-colors">
                  <td className="px-4 py-3 text-sm font-semibold text-white whitespace-nowrap">{c.canal}</td>
                  <td className="px-4 py-3 font-mono text-sm text-muted">{c.qtd.toLocaleString("pt-BR")}</td>
                  <td className="px-4 py-3 font-mono text-sm text-white whitespace-nowrap">{formatCurrency(c.faturado)}</td>
                  <td className="px-4 py-3 font-mono text-sm"><Pct value={c.faturadoPct} color="muted" /></td>
                  {canViewProfit && <td className="px-4 py-3 font-mono text-sm text-red-400 whitespace-nowrap">{c.cmv != null ? formatCurrency(c.cmv) : "—"}</td>}
                  {canViewProfit && <td className="px-4 py-3 font-mono text-sm"><Pct value={c.cmvPct} color="red-400" /></td>}
                  {canViewProfit && <td className="px-4 py-3 font-mono text-sm text-brand whitespace-nowrap">{c.margem != null ? formatCurrency(c.margem) : "—"}</td>}
                  {canViewProfit && <td className="px-4 py-3 font-mono text-sm"><Pct value={c.margemPct} color="brand" /></td>}
                  <td className="px-4 py-3 text-xs text-dim">—</td>
                </tr>
              ))}
            </tbody>
            {!loading && stats?.vendaPorCanal?.length > 0 && (
              <tfoot>
                <tr className="bg-bg-4 border-t border-border font-semibold">
                  <td className="px-4 py-3 text-sm text-white">Total Geral</td>
                  <td className="px-4 py-3 font-mono text-sm text-white">{stats.totalOrders.toLocaleString("pt-BR")}</td>
                  <td className="px-4 py-3 font-mono text-sm text-white">{formatCurrency(stats.totalRevenue)}</td>
                  <td className="px-4 py-3 font-mono text-sm text-white">100%</td>
                  {canViewProfit && <td className="px-4 py-3 font-mono text-sm text-red-400">{formatCurrency(stats.totalCmv ?? 0)}</td>}
                  {canViewProfit && <td className="px-4 py-3 font-mono text-sm text-red-400">{stats.totalRevenue > 0 ? ((stats.totalCmv / stats.totalRevenue) * 100).toFixed(1) : "0"}%</td>}
                  {canViewProfit && <td className="px-4 py-3 font-mono text-sm text-brand">{formatCurrency(stats.totalProfit ?? 0)}</td>}
                  {canViewProfit && <td className="px-4 py-3 font-mono text-sm text-brand">{(stats.margin ?? 0).toFixed(1)}%</td>}
                  <td className="px-4 py-3 text-xs text-dim">—</td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>
        <p className="text-[11px] text-dim px-5 py-3 border-t border-border/50">
          Outros canais de venda (Shopee, Magalu, Amazon) serão adicionados em breve.
        </p>
      </div>

      {/* ── Venda por Estado + Venda por Produto ────────────────────────────── */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">

        <div className="bg-bg-3 border border-border rounded-xl overflow-hidden">
          <div className="flex items-center gap-2 px-5 py-4 border-b border-border">
            <MapPin size={15} className="text-brand" />
            <h2 className="font-syne text-[15px] font-bold text-white">Venda por Estado</h2>
          </div>
          <div className="overflow-x-auto max-h-[420px] overflow-y-auto">
            <table className="w-full text-left">
              <thead className="sticky top-0 bg-bg-4 z-10">
                <tr className="border-b border-border">
                  {["UF", "Qtde", "Faturado", "Fat. %", canViewProfit && "Margem %"]
                    .filter(Boolean).map((h) => (
                      <th key={String(h)} className="px-4 py-2.5 text-[10px] font-semibold text-dim uppercase tracking-widest whitespace-nowrap">{h}</th>
                    ))}
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  Array.from({ length: 6 }).map((_, i) => (
                    <tr key={i}><td colSpan={5} className="px-4 py-2.5"><div className="skeleton h-4 rounded" /></td></tr>
                  ))
                ) : (stats?.vendaPorEstado ?? []).map((s: any) => (
                  <tr key={s.uf} className="border-b border-border/20 hover:bg-bg-4 transition-colors">
                    <td className="px-4 py-2.5 text-sm font-semibold text-white">{s.uf}</td>
                    <td className="px-4 py-2.5 font-mono text-xs text-muted">{s.qtd}</td>
                    <td className="px-4 py-2.5 font-mono text-xs text-white whitespace-nowrap">{formatCurrency(s.faturado)}</td>
                    <td className="px-4 py-2.5 font-mono text-xs"><Pct value={s.faturadoPct} color="muted" /></td>
                    {canViewProfit && <td className="px-4 py-2.5 font-mono text-xs"><Pct value={s.margemPct} color="brand" /></td>}
                  </tr>
                ))}
                {!loading && (stats?.vendaPorEstado?.length ?? 0) === 0 && (
                  <tr><td colSpan={5} className="px-4 py-8 text-center text-muted text-sm">Nenhum dado de localização disponível</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="bg-bg-3 border border-border rounded-xl overflow-hidden">
          <div className="flex items-center gap-2 px-5 py-4 border-b border-border">
            <Package2 size={15} className="text-brand" />
            <h2 className="font-syne text-[15px] font-bold text-white">Venda por Produto</h2>
          </div>
          <div className="overflow-x-auto max-h-[420px] overflow-y-auto">
            <table className="w-full text-left">
              <thead className="sticky top-0 bg-bg-4 z-10">
                <tr className="border-b border-border">
                  {["Produto", "Qtde", "Faturado", canViewProfit && "Margem %"]
                    .filter(Boolean).map((h) => (
                      <th key={String(h)} className="px-4 py-2.5 text-[10px] font-semibold text-dim uppercase tracking-widest whitespace-nowrap">{h}</th>
                    ))}
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  Array.from({ length: 6 }).map((_, i) => (
                    <tr key={i}><td colSpan={4} className="px-4 py-2.5"><div className="skeleton h-4 rounded" /></td></tr>
                  ))
                ) : (stats?.vendaPorProduto ?? []).map((p: any) => (
                  <tr key={p.sku + p.name} className="border-b border-border/20 hover:bg-bg-4 transition-colors">
                    <td className="px-4 py-2.5 text-sm text-white max-w-[200px] truncate" title={p.name}>{p.name}</td>
                    <td className="px-4 py-2.5 font-mono text-xs text-muted">{p.qtd}</td>
                    <td className="px-4 py-2.5 font-mono text-xs text-white whitespace-nowrap">{formatCurrency(p.faturado)}</td>
                    {canViewProfit && <td className="px-4 py-2.5 font-mono text-xs"><Pct value={p.margemPct} color="brand" /></td>}
                  </tr>
                ))}
                {!loading && (stats?.vendaPorProduto?.length ?? 0) === 0 && (
                  <tr><td colSpan={4} className="px-4 py-8 text-center text-muted text-sm">Nenhum produto vendido ainda</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* ── Pedidos Recentes ─────────────────────────────────────────────── */}
      <div className="bg-bg-3 border border-border rounded-xl p-5">
        <div className="flex items-center justify-between mb-5">
          <h2 className="font-syne text-[15px] font-bold text-white">Pedidos Recentes</h2>
          <a href="/dashboard/orders" className="text-xs text-brand hover:underline">Ver todos →</a>
        </div>
        {loading ? (
          <div className="space-y-3">{[1,2,3,4,5].map(i => <div key={i} className="skeleton h-10 rounded" />)}</div>
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
                {(stats?.recentOrders ?? []).map((order: any) => (
                  <tr key={order.id} className="border-b border-border/20 hover:bg-bg-4 transition-colors">
                    <td className="py-3 pr-4 font-mono text-xs text-muted">{order.packId || order.mlId}</td>
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