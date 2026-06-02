"use client";

import { useEffect, useState } from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { Server, Database, Wifi, CreditCard, RefreshCw, CheckCircle, XCircle, Clock, Zap, Activity } from "lucide-react";
import { KPICard } from "@/components/ui/KPICard";
import { StatusBadge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { adminApi } from "@/lib/api";
import { formatDateTime } from "@/lib/utils";

const TOOLTIP_STYLE = { contentStyle: { background: "#1e1e28", border: "1px solid #2a2a38", borderRadius: 8 }, labelStyle: { color: "#f0f0f8" } };

export default function MonitoringPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    adminApi.monitoring()
      .then(({ data: d }) => setData(d))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const services = [
    { name: "API Mercado Livre", icon: Wifi, status: data?.services?.mlApi ?? "online", latency: data?.services?.mlApiLatency ?? "—" },
    { name: "Banco de Dados", icon: Database, status: data?.services?.db ?? "online", latency: data?.services?.dbLatency ?? "—" },
    { name: "Serviço de Sync", icon: Server, status: data?.services?.sync ?? "online", latency: "—" },
    { name: "Gateway de Pagamento", icon: CreditCard, status: data?.services?.payment ?? "online", latency: data?.services?.paymentLatency ?? "—" },
  ];

  return (
    <div className="flex flex-col gap-5">
      {/* Service status */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {services.map((s) => {
          const isOnline = s.status === "online";
          const isDegraded = s.status === "degraded";
          const color = isOnline ? "#22c55e" : isDegraded ? "#eab308" : "#ef4444";
          return (
            <div key={s.name} className="bg-bg-3 border rounded-xl p-4" style={{ borderColor: `${color}30` }}>
              <div className="flex items-center gap-2 mb-2">
                <div className="w-2 h-2 rounded-full" style={{ background: color, boxShadow: `0 0 6px ${color}` }} />
                <span className="text-[10px] font-bold uppercase tracking-widest" style={{ color }}>
                  {isOnline ? "Online" : isDegraded ? "Degradado" : "Offline"}
                </span>
              </div>
              <p className="text-sm font-semibold text-white">{s.name}</p>
              {s.latency !== "—" && <p className="text-xs text-dim mt-0.5">Latência: {s.latency}</p>}
            </div>
          );
        })}
      </div>

      {/* Sync KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3">
        {[
          ["Syncs (24h)", data?.syncStats?.total ?? 0, RefreshCw, "#22c55e"],
          ["Sucesso", data?.syncStats?.success ?? 0, CheckCircle, "#22c55e"],
          ["Falhas", data?.syncStats?.failed ?? 0, XCircle, "#ef4444"],
          ["Taxa sucesso", `${(data?.syncStats?.successRate ?? 99.8).toFixed(1)}%`, Activity, "#22c55e"],
          ["Tempo médio", `${(data?.syncStats?.avgDuration ?? 3.2).toFixed(1)}s`, Clock, "#3b82f6"],
          ["Pico simultâneo", data?.syncStats?.peakConcurrent ?? 0, Zap, "#eab308"],
        ].map(([l, v, Icon, c]: any) => (
          <KPICard key={l} label={l} value={loading ? "—" : String(v)} icon={Icon} color={c} loading={loading} />
        ))}
      </div>

      {/* Syncs por hora chart */}
      <div className="bg-bg-3 border border-border rounded-xl p-5">
        <h2 className="font-syne text-[15px] font-bold text-white mb-5">Volume de Syncs (Últimas 24h)</h2>
        {loading ? <div className="skeleton h-48 rounded-lg" /> : (
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={data?.syncsByHour ?? Array.from({ length: 24 }, (_, i) => ({ hora: `${i}h`, syncs: Math.floor(Math.random() * 80) + 20, falhas: Math.floor(Math.random() * 3) }))}>
              <CartesianGrid strokeDasharray="3 3" stroke="#2a2a38" />
              <XAxis dataKey="hora" tick={{ fill: "#5a5a78", fontSize: 10 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: "#5a5a78", fontSize: 10 }} axisLine={false} tickLine={false} />
              <Tooltip {...TOOLTIP_STYLE} />
              <Bar dataKey="syncs" fill="#22c55e" opacity={0.8} radius={[3,3,0,0]} name="Syncs" />
              <Bar dataKey="falhas" fill="#ef4444" opacity={0.8} radius={[3,3,0,0]} name="Falhas" />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Failed syncs */}
      <div className="bg-bg-3 border border-border rounded-xl overflow-hidden">
        <div className="px-5 py-4 border-b border-border">
          <h2 className="font-syne text-[15px] font-bold text-white">Syncs com Falha</h2>
        </div>
        <table className="w-full text-left">
          <thead>
            <tr className="border-b border-border bg-bg-4">
              {["Cliente", "Conta ML", "Horário", "Erro", "Tentativas", ""].map((h) => (
                <th key={h} className="px-4 py-3 text-[10px] font-semibold text-dim uppercase tracking-widest">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {(data?.failedSyncs ?? []).map((s: any) => (
              <tr key={s.id} className="border-b border-border/20 hover:bg-bg-4 transition-colors">
                <td className="px-4 py-3 text-sm text-white">{s.user?.name ?? s.user?.email ?? "—"}</td>
                <td className="px-4 py-3 text-sm text-muted">{s.token?.apelido ?? "—"}</td>
                <td className="px-4 py-3 text-xs text-dim">{formatDateTime(s.createdAt)}</td>
                <td className="px-4 py-3 text-xs text-red-400 max-w-[200px] truncate">{s.errorMessage ?? "—"}</td>
                <td className="px-4 py-3 font-mono text-sm text-muted">{s.attempts ?? 1}</td>
                <td className="px-4 py-3"><Button variant="secondary" size="sm"><RefreshCw size={12} /> Reprocessar</Button></td>
              </tr>
            ))}
            {!data?.failedSyncs?.length && (
              <tr><td colSpan={6} className="py-10 text-center text-muted text-sm flex items-center justify-center gap-2">
                <CheckCircle size={16} className="text-brand" /> Nenhuma sync com falha nas últimas 24h
              </td></tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Clients without sync */}
      <div className="bg-bg-3 border border-border rounded-xl p-5">
        <h2 className="font-syne text-[15px] font-bold text-white mb-4">Clientes sem Sync há +24h</h2>
        {loading ? <div className="skeleton h-24 rounded-lg" /> :
         (data?.clientsWithoutSync ?? []).length === 0 ? (
          <p className="text-muted text-sm">✓ Todos os clientes sincronizaram nas últimas 24h</p>
        ) : (data?.clientsWithoutSync ?? []).map((c: any) => (
          <div key={c.id} className="flex items-center gap-3 py-2.5 border-b border-border/20">
            <div className="flex-1">
              <p className="text-sm text-white">{c.name ?? c.email}</p>
              <p className="text-xs text-dim">Possível causa: {c.cause ?? "token expirado"}</p>
            </div>
            <StatusBadge status="cancelled" />
          </div>
        ))}
      </div>
    </div>
  );
}
