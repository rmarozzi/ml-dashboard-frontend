"use client";

import { useEffect, useState, useCallback } from "react";
import { Search, Download, ChevronRight, AlertTriangle, X } from "lucide-react";
import { StatusBadge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { ordersApi, exportApi } from "@/lib/api";
import { usePlan } from "@/contexts/PlanContext";
import { usePermissions } from "@/contexts/PermissionsContext";
import { UpgradeGate } from "@/components/ui/UpgradeGate";
import { formatCurrency, formatDateTime, downloadBlob } from "@/lib/utils";
import { Order } from "@/lib/types";

const STATUSES = ["paid", "pending", "shipped", "cancelled"];

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [expanded, setExpanded] = useState<number | null>(null);
  const [exporting, setExporting] = useState(false);
  const { hasPlan, hasFeature } = usePlan();
  const { can, isFuncionario } = usePermissions();

  const canViewProfit = hasPlan("prata");
  const canExport = hasFeature("canExport") && (!isFuncionario || can("export_data"));

  const load = useCallback(() => {
    setLoading(true);
    const params: Record<string, string> = {};
    if (search) params.search = search;
    if (statusFilter) params.status = statusFilter;
    ordersApi.list(params)
      .then(({ data }) => setOrders(data.orders ?? []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [search, statusFilter]);

  useEffect(() => { load(); }, [load]);

  if (isFuncionario && !can("view_orders")) {
    return <UpgradeGate feature="Ver Pedidos" requiredPlan="prata" />;
  }

  const handleExport = async () => {
    setExporting(true);
    try {
      const { data } = await exportApi.orders(statusFilter ? { status: statusFilter } : undefined);
      downloadBlob(data, "pedidos.csv");
    } catch {} finally { setExporting(false); }
  };

  return (
    <div className="flex flex-col gap-4">
      {canViewProfit && (
        <div className="flex items-center gap-2 bg-yellow-500/10 border border-yellow-500/30 rounded-lg px-4 py-2.5">
          <AlertTriangle size={14} className="text-yellow-400 flex-shrink-0" />
          <p className="text-xs text-yellow-400">Alguns pedidos com custo não cadastrado — margens podem estar imprecisas</p>
        </div>
      )}

      <div className="flex gap-2 flex-wrap">
        <div className="flex-1 min-w-[200px] relative">
          <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-dim pointer-events-none" />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Buscar por ID ou produto..."
            className="w-full bg-bg-3 border border-border rounded-lg pl-8 pr-3 py-2 text-sm text-white placeholder:text-dim outline-none focus:border-brand/50" />
          {search && <button onClick={() => setSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-dim hover:text-white"><X size={13} /></button>}
        </div>
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}
          className="bg-bg-3 border border-border rounded-lg px-3 py-2 text-sm text-muted outline-none cursor-pointer">
          <option value="">Todos os status</option>
          {STATUSES.map((s) => <option key={s} value={s} className="capitalize">{s}</option>)}
        </select>
        {canExport && (
          <Button variant="secondary" size="sm" loading={exporting} onClick={handleExport}>
            <Download size={13} /> Exportar CSV
          </Button>
        )}
      </div>

      <div className="bg-bg-3 border border-border rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-border bg-bg-4">
                {["ID", "Produto", "Conta ML", "Valor", canViewProfit && "Lucro", canViewProfit && "Margem", "Data", "Status", ""]
                  .filter(Boolean).map((h) => (
                  <th key={String(h)} className="px-4 py-3 text-[10px] font-semibold text-dim uppercase tracking-widest whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? Array.from({ length: 8 }).map((_, i) => (
                <tr key={i} className="border-b border-border/20">
                  {Array.from({ length: 7 }).map((_, j) => (
                    <td key={j} className="px-4 py-3"><div className="skeleton h-4 rounded" /></td>
                  ))}
                </tr>
              )) : orders.map((order) => (
                <>
                  <tr key={order.id} className="border-b border-border/20 hover:bg-bg-4 transition-colors cursor-pointer"
                    onClick={() => setExpanded(expanded === order.id ? null : order.id)}>
                    <td className="px-4 py-3 font-mono text-xs text-muted">{order.mlId}</td>
                    <td className="px-4 py-3 text-sm text-white max-w-[180px] truncate">{order.items?.[0]?.title ?? "—"}</td>
                    <td className="px-4 py-3 text-xs text-muted">{order.token?.apelido ?? order.token?.mlNickname ?? "—"}</td>
                    <td className="px-4 py-3 font-mono text-sm text-white">{formatCurrency(order.totalAmount)}</td>
                    {canViewProfit && (
                      <td className={`px-4 py-3 font-mono text-sm ${(order.profit ?? 0) >= 0 ? "text-brand" : "text-red-400"}`}>
                        {order.profit != null ? formatCurrency(order.profit) : <span className="text-dim">—</span>}
                      </td>
                    )}
                    {canViewProfit && (
                      <td className={`px-4 py-3 font-mono text-sm ${(order.margin ?? 0) >= 0 ? "text-brand" : "text-red-400"}`}>
                        {order.margin != null ? `${order.margin.toFixed(1)}%` : <span className="text-dim">—</span>}
                      </td>
                    )}
                    <td className="px-4 py-3 text-xs text-dim">{formatDateTime(order.dateCreated)}</td>
                    <td className="px-4 py-3"><StatusBadge status={order.status} /></td>
                    <td className="px-4 py-3"><ChevronRight size={14} className={`text-dim transition-transform ${expanded === order.id ? "rotate-90" : ""}`} /></td>
                  </tr>
                  {expanded === order.id && canViewProfit && (
                    <tr key={`exp-${order.id}`} className="bg-bg-4 border-b border-border/20">
                      <td colSpan={9} className="px-6 py-4">
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                          {[
                            ["Receita Bruta", formatCurrency(order.totalAmount), "text-white"],
                            ["Taxa ML (~14%)", formatCurrency(order.totalAmount * 0.14), "text-red-400"],
                            ["Custo Produto", "Verificar custo", "text-yellow-400"],
                            ["Lucro Líquido", order.profit != null ? formatCurrency(order.profit) : "—", (order.profit ?? 0) >= 0 ? "text-brand" : "text-red-400"],
                          ].map(([label, value, color]) => (
                            <div key={String(label)}>
                              <p className="text-[10px] text-dim uppercase tracking-widest mb-1">{label}</p>
                              <p className={`text-base font-bold font-mono ${color}`}>{value}</p>
                            </div>
                          ))}
                        </div>
                      </td>
                    </tr>
                  )}
                </>
              ))}
              {!loading && orders.length === 0 && (
                <tr><td colSpan={9} className="py-16 text-center text-muted text-sm">Nenhum pedido encontrado</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
