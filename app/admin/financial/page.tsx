"use client";

import { useEffect, useState } from "react";
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Cell, ReferenceLine,
} from "recharts";
import { DollarSign, TrendingUp, TrendingDown, Users, ArrowUpRight, ArrowDownRight } from "lucide-react";
import { KPICard } from "@/components/ui/KPICard";
import { PlanBadge } from "@/components/ui/PlanBadge";
import { Button } from "@/components/ui/Button";
import { adminApi } from "@/lib/api";
import { formatCurrency, formatCurrencyShort, formatDate } from "@/lib/utils";
import { PlanSlug } from "@/lib/types";

const TOOLTIP_STYLE = { contentStyle: { background: "#1e1e28", border: "1px solid #2a2a38", borderRadius: 8 }, labelStyle: { color: "#f0f0f8" } };

export default function FinancialPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    adminApi.financial()
      .then(({ data: d }) => setData(d))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const kpis = data?.kpis ?? {};

  return (
    <div className="flex flex-col gap-6">
      {/* MRR KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <KPICard label="MRR Atual" value={loading ? "—" : formatCurrencyShort(kpis.mrr ?? 0)} sub={`${kpis.mrrGrowth >= 0 ? "+" : ""}${(kpis.mrrGrowth ?? 0).toFixed(1)}% vs mês ant.`} trend={kpis.mrrGrowth >= 0 ? "up" : "down"} icon={DollarSign} loading={loading} />
        <KPICard label="MRR Novo" value={loading ? "—" : formatCurrencyShort(kpis.mrrNew ?? 0)} sub="Novos clientes" trend="up" icon={TrendingUp} color="#22c55e" loading={loading} />
        <KPICard label="MRR Expansão" value={loading ? "—" : formatCurrencyShort(kpis.mrrExpansion ?? 0)} sub="Upgrades" trend="up" icon={ArrowUpRight} color="#3b82f6" loading={loading} />
        <KPICard label="MRR Churn" value={loading ? "—" : formatCurrencyShort(kpis.mrrChurn ?? 0)} sub="Cancelamentos" trend="down" icon={TrendingDown} color="#ef4444" loading={loading} />
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <KPICard label="MRR Contração" value={loading ? "—" : formatCurrencyShort(kpis.mrrContraction ?? 0)} sub="Downgrades" icon={ArrowDownRight} color="#eab308" loading={loading} />
        <KPICard label="MRR Líquido" value={loading ? "—" : formatCurrencyShort(kpis.mrrNet ?? 0)} sub="Novo + Expansão - Contração - Churn" trend={kpis.mrrNet >= 0 ? "up" : "down"} icon={DollarSign} loading={loading} />
        <KPICard label="LTV Médio" value={loading ? "—" : formatCurrencyShort(kpis.ltv ?? 0)} icon={Users} color="#a855f7" loading={loading} />
        <KPICard label="LTV / CAC" value={loading ? "—" : `${(kpis.ltvCac ?? 0).toFixed(1)}x`} icon={TrendingUp} color="#22c55e" loading={loading} />
      </div>

      {/* MRR Stacked area by plan */}
      <div className="bg-bg-3 border border-border rounded-xl p-5">
        <h2 className="font-syne text-[15px] font-bold text-white mb-5">Composição do MRR por Plano (12 meses)</h2>
        {loading ? <div className="skeleton h-52 rounded-lg" /> : (
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={data?.mrrByPlanHistory ?? []}>
              <defs>
                {[["gBronze","#cd7f32"],["gPrata","#9ca3af"],["gOuro","#eab308"],["gPremium","#22c55e"]].map(([id,c]) => (
                  <linearGradient key={id} id={id} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={c} stopOpacity={0.4} />
                    <stop offset="100%" stopColor={c} stopOpacity={0.05} />
                  </linearGradient>
                ))}
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#2a2a38" />
              <XAxis dataKey="mes" tick={{ fill: "#5a5a78", fontSize: 10 }} axisLine={false} tickLine={false} />
              <YAxis tickFormatter={(v) => `${(v/1000).toFixed(0)}k`} tick={{ fill: "#5a5a78", fontSize: 10 }} axisLine={false} tickLine={false} />
              <Tooltip {...TOOLTIP_STYLE} formatter={(v: any) => formatCurrencyShort(v)} />
              <Area type="monotone" dataKey="bronze" stackId="1" stroke="#cd7f32" fill="url(#gBronze)" name="Bronze" />
              <Area type="monotone" dataKey="prata" stackId="1" stroke="#9ca3af" fill="url(#gPrata)" name="Prata" />
              <Area type="monotone" dataKey="ouro" stackId="1" stroke="#eab308" fill="url(#gOuro)" name="Ouro" />
              <Area type="monotone" dataKey="premium" stackId="1" stroke="#22c55e" fill="url(#gPremium)" name="Premium" />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Waterfall MRR */}
      <div className="bg-bg-3 border border-border rounded-xl p-5">
        <h2 className="font-syne text-[15px] font-bold text-white mb-5">Waterfall MRR — Variação Mensal</h2>
        {loading ? <div className="skeleton h-48 rounded-lg" /> : (
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={[
              { name: "MRR Inicial", value: kpis.mrrStart ?? 0, fill: "#5a5a78" },
              { name: "Novo", value: kpis.mrrNew ?? 0, fill: "#22c55e" },
              { name: "Expansão", value: kpis.mrrExpansion ?? 0, fill: "#3b82f6" },
              { name: "Contração", value: -(kpis.mrrContraction ?? 0), fill: "#eab308" },
              { name: "Churn", value: -(kpis.mrrChurn ?? 0), fill: "#ef4444" },
              { name: "MRR Final", value: kpis.mrr ?? 0, fill: "#22c55e" },
            ]}>
              <CartesianGrid strokeDasharray="3 3" stroke="#2a2a38" />
              <XAxis dataKey="name" tick={{ fill: "#5a5a78", fontSize: 10 }} axisLine={false} tickLine={false} />
              <YAxis tickFormatter={(v) => `${(v/1000).toFixed(0)}k`} tick={{ fill: "#5a5a78", fontSize: 10 }} axisLine={false} tickLine={false} />
              <Tooltip {...TOOLTIP_STYLE} formatter={(v: any) => formatCurrencyShort(Math.abs(v))} />
              <ReferenceLine y={0} stroke="#2a2a38" />
              <Bar dataKey="value" radius={[4,4,0,0]}>
                {[
                  { fill: "#5a5a78" }, { fill: "#22c55e" }, { fill: "#3b82f6" },
                  { fill: "#eab308" }, { fill: "#ef4444" }, { fill: "#22c55e" },
                ].map((entry, i) => <Cell key={i} fill={entry.fill} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Inadimplência table */}
      <div className="bg-bg-3 border border-border rounded-xl overflow-hidden">
        <div className="px-5 py-4 border-b border-border">
          <h2 className="font-syne text-[15px] font-bold text-white">Inadimplência</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-border bg-bg-4">
                {["Cliente","Plano","Valor em aberto","Dias em atraso","Tentativas","Última tentativa",""].map((h) => (
                  <th key={h} className="px-4 py-3 text-[10px] font-semibold text-dim uppercase tracking-widest whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {(data?.delinquents ?? []).map((d: any) => (
                <tr key={d.id} className="border-b border-border/20 hover:bg-bg-4 transition-colors">
                  <td className="px-4 py-3">
                    <p className="text-sm font-semibold text-white">{d.name ?? "—"}</p>
                    <p className="text-xs text-dim">{d.email}</p>
                  </td>
                  <td className="px-4 py-3">{d.planSlug ? <PlanBadge slug={d.planSlug as PlanSlug} /> : "—"}</td>
                  <td className="px-4 py-3 font-mono text-sm text-red-400 font-bold">{formatCurrency(d.amount ?? 0)}</td>
                  <td className="px-4 py-3 font-mono text-sm text-yellow-400">{d.daysLate}d</td>
                  <td className="px-4 py-3 font-mono text-sm text-muted">{d.attempts}</td>
                  <td className="px-4 py-3 text-xs text-dim">{d.lastAttempt ? formatDate(d.lastAttempt) : "—"}</td>
                  <td className="px-4 py-3">
                    <div className="flex gap-1.5">
                      <Button variant="secondary" size="sm">Retentar</Button>
                      <Button variant="danger" size="sm">Suspender</Button>
                    </div>
                  </td>
                </tr>
              ))}
              {!loading && !(data?.delinquents?.length) && (
                <tr><td colSpan={7} className="py-12 text-center text-muted text-sm">Nenhum cliente inadimplente 🎉</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Projected revenue */}
      <div className="bg-bg-3 border border-border rounded-xl p-5">
        <h2 className="font-syne text-[15px] font-bold text-white mb-4">Receita Projetada (próximos 3 meses)</h2>
        <div className="grid grid-cols-3 gap-4">
          {[
            ["Pessimista", data?.projection?.pessimist ?? 0, "text-red-400", "border-red-500/30", "bg-red-500/10"],
            ["Realista", data?.projection?.realistic ?? 0, "text-white", "border-border", "bg-bg-4"],
            ["Otimista", data?.projection?.optimist ?? 0, "text-brand", "border-brand/30", "bg-brand/10"],
          ].map(([label, value, tc, bc, bg]) => (
            <div key={String(label)} className={`border rounded-xl p-4 text-center ${bc} ${bg}`}>
              <p className="text-xs text-dim uppercase tracking-widest mb-2">{label}</p>
              <p className={`font-syne text-xl font-bold ${tc}`}>{loading ? "—" : formatCurrencyShort(value as number)}</p>
              <p className="text-xs text-dim mt-1">por mês</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
