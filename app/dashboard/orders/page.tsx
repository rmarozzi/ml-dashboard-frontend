"use client";

import { useEffect, useState, useCallback } from "react";
import { Search, Download, ChevronRight, AlertTriangle, X, TrendingUp, TrendingDown } from "lucide-react";
import { StatusBadge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { ordersApi, exportApi } from "@/lib/api";
import { usePlan } from "@/contexts/PlanContext";
import { usePermissions } from "@/contexts/PermissionsContext";
import { UpgradeGate } from "@/components/ui/UpgradeGate";
import { formatCurrency, formatDateTime, downloadBlob } from "@/lib/utils";
import { Order } from "@/lib/types";

const STATUSES = ["paid", "pending", "shipped", "cancelled"];
const STATUS_LABELS: Record<string, string> = {
  paid: "Pago", pending: "Pendente", shipped: "Enviado", cancelled: "Cancelado"
};

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
      {/* Alerta custo nao cadastrado */}
      {canViewProfit && orders.some((o) => !(o as any).allCostsFound) && (
        <div className="flex items-center gap-2 bg-yellow-500/10 border border-yellow-500/30 rounded-lg px-4 py-2.5">
          <AlertTriangle size={14} className="text-yellow-400 flex-shrink-0" />
          <p className="text-xs text-yellow-400">
            Alguns pedidos com custo de produto nao cadastrado - lucro pode estar impreciso
          </p>
        </div>
      )}

      {/* Toolbar */}
      <div className="flex gap-2 flex-wrap">
        <div className="flex-1 min-w-[200px] relative">
          <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-dim pointer-events-none" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por ID ou produto..."
            className="w-full bg-bg-3 border border-border rounded-lg pl-8 pr-3 py-2 text-sm text-white placeholder:text-dim outline-none focus:border-brand/50"
          />
          {search && (
            <button onClick={() => setSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-dim hover:text-white">
              <X size={13} />
            </button>
          )}
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="bg-bg-3 border border-border rounded-lg px-3 py-2 text-sm text-muted outline-none cursor-pointer"
        >
          <option value="">Todos os status</option>
          {STATUSES.map((s) => (
            <option key={s} value={s}>{STATUS_LABELS[s]}</option>
          ))}
        </select>
        {canExport && (
          <Button variant="secondary" size="sm" loading={exporting} onClick={handleExport}>
            <Download size={13} /> Exportar CSV
          </Button>
        )}
      </div>

      {/* Tabela */}
      <div className="bg-bg-3 border border-border rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-border bg-bg-4">
                {[
                  "ID", "Produto", "Conta ML", "Receita",
                  canViewProfit && "Tarifa ML",
                  canViewProfit && "Frete",
                  canViewProfit && "Lucro",
                  canViewProfit && "Margem",
                  "Data", "Status", ""
                ].filter(Boolean).map((h) => (
                  <th key={String(h)} className="px-4 py-3 text-[10px] font-semibold text-dim uppercase tracking-widest whitespace-nowrap">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading
                ? Array.from({ length: 8 }).map((_, i) => (
                    <tr key={i} className="border-b border-border/20">
                      {Array.from({ length: 11 }).map((_, j) => (
                        <td key={j} className="px-4 py-3"><div className="skeleton h-4 rounded" /></td>
                      ))}
                    </tr>
                  ))
                : orders.map((order) => {
                    const o = order as any;
                    const isExpanded = expanded === order.id;
                    const profitPositive = (o.profit ?? 0) >= 0;

                    return (
                      <>
                        <tr
                          key={order.id}
                          className="border-b border-border/20 hover:bg-bg-4 transition-colors cursor-pointer"
                          onClick={() => setExpanded(isExpanded ? null : order.id)}
                        >
                          <td className="px-4 py-3 font-mono text-xs text-muted whitespace-nowrap">{order.mlId}</td>
                          <td className="px-4 py-3 text-sm text-white max-w-[180px] truncate">
                            {order.items?.[0]?.title ?? "—"}
                            {order.items && order.items.length > 1 && (
                              <span className="ml-1 text-xs text-dim">+{order.items.length - 1}</span>
                            )}
                          </td>
                          <td className="px-4 py-3 text-xs text-muted whitespace-nowrap">
                            {order.token?.apelido ?? order.token?.mlNickname ?? "—"}
                          </td>
                          <td className="px-4 py-3 font-mono text-sm text-white whitespace-nowrap">
                            {formatCurrency(order.totalAmount)}
                          </td>
                          {canViewProfit && (
                            <td className="px-4 py-3 font-mono text-sm text-red-400 whitespace-nowrap">
                              {(o.mlFee ?? 0) > 0
                                ? `-${formatCurrency(o.mlFee)}`
                                : <span className="text-dim">R$ 0,00</span>}
                            </td>
                          )}
                          {canViewProfit && (
                            <td className="px-4 py-3 font-mono text-sm text-red-400 whitespace-nowrap">
                              {(o.shippingCost ?? 0) > 0
                                ? `-${formatCurrency(o.shippingCost)}`
                                : <span className="text-dim">R$ 0,00</span>}
                            </td>
                          )}
                          {canViewProfit && (
                            <td className={`px-4 py-3 font-mono text-sm whitespace-nowrap ${profitPositive ? "text-brand" : "text-red-400"}`}>
                              {o.profit != null
                                ? (
                                  <span className="flex items-center gap-1">
                                    {profitPositive ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
                                    {formatCurrency(o.profit)}
                                  </span>
                                )
                                : <span className="text-dim">—</span>}
                            </td>
                          )}
                          {canViewProfit && (
                            <td className={`px-4 py-3 font-mono text-sm whitespace-nowrap ${profitPositive ? "text-brand" : "text-red-400"}`}>
                              {o.margin != null ? `${o.margin.toFixed(1)}%` : <span className="text-dim">—</span>}
                            </td>
                          )}
                          <td className="px-4 py-3 text-xs text-dim whitespace-nowrap">
                            {formatDateTime(order.dateCreated)}
                          </td>
                          <td className="px-4 py-3"><StatusBadge status={order.status} /></td>
                          <td className="px-4 py-3">
                            <ChevronRight
                              size={14}
                              className={`text-dim transition-transform duration-200 ${isExpanded ? "rotate-90" : ""}`}
                            />
                          </td>
                        </tr>

                        {/* Breakdown expandido */}
                        {isExpanded && canViewProfit && (
                          <tr key={`exp-${order.id}`} className="border-b border-border/20">
                            <td colSpan={11} className="p-0">
                              <div className="bg-bg-4 border-t border-border/30 px-6 py-5">
                                <p className="text-[10px] font-semibold text-dim uppercase tracking-widest mb-4">
                                  Detalhamento Financeiro
                                </p>

                                <div className="flex flex-col gap-0 max-w-md">

                                  {/* Receita Bruta */}
                                  <div className="flex justify-between items-center py-2 border-b border-border/20">
                                    <span className="text-sm text-muted">Receita Bruta</span>
                                    <span className="font-mono text-sm font-bold text-white">
                                      {formatCurrency(order.totalAmount)}
                                    </span>
                                  </div>

                                  {/* Tarifa ML */}
                                  <div className="flex justify-between items-center py-2 border-b border-border/20">
                                    <span className="text-sm text-muted">Tarifa Mercado Livre</span>
                                    <span className="font-mono text-sm text-red-400">
                                      -{formatCurrency(o.mlFee ?? 0)}
                                    </span>
                                  </div>

                                  {/* Frete */}
                                  <div className="flex justify-between items-center py-2 border-b border-border/20">
                                    <span className="text-sm text-muted">Frete (cobrado do vendedor)</span>
                                    <span className={`font-mono text-sm ${(o.shippingCost ?? 0) > 0 ? "text-red-400" : "text-dim"}`}>
                                      -{formatCurrency(o.shippingCost ?? 0)}
                                    </span>
                                  </div>

                                  {/* Imposto NF */}
                                  <div className="flex justify-between items-center py-2 border-b border-border/20">
                                    <span className="text-sm text-muted">
                                      Imposto NF
                                      {!o.allCostsFound && (
                                        <span className="ml-2 text-[10px] text-yellow-400">(custo nao cadastrado)</span>
                                      )}
                                    </span>
                                    <span className={`font-mono text-sm ${(o.nfTax ?? 0) > 0 ? "text-red-400" : "text-dim"}`}>
                                      -{formatCurrency(o.nfTax ?? 0)}
                                    </span>
                                  </div>

                                  {/* Custo do Produto */}
                                  <div className="flex justify-between items-center py-2 border-b border-border/20">
                                    <span className="text-sm text-muted">Custo do Produto</span>
                                    {(o.productCost ?? 0) > 0 ? (
                                      <span className="font-mono text-sm text-red-400">
                                        -{formatCurrency(o.productCost)}
                                      </span>
                                    ) : (
                                      <span className="text-yellow-400 text-sm font-semibold">Verificar custo</span>
                                    )}
                                  </div>

                                  {/* Imposto ML - so aparece se > 0 */}
                                  {(o.mlTax ?? 0) > 0 && (
                                    <div className="flex justify-between items-center py-2 border-b border-border/20">
                                      <span className="text-sm text-muted">Imposto ML</span>
                                      <span className="font-mono text-sm text-red-400">
                                        -{formatCurrency(o.mlTax)}
                                      </span>
                                    </div>
                                  )}

                                  {/* Estorno - so aparece se > 0 */}
                                  {(o.estorno ?? 0) > 0 && (
                                    <div className="flex justify-between items-center py-2 border-b border-border/20">
                                      <span className="text-sm text-muted">Estorno / Bonus ML</span>
                                      <span className="font-mono text-sm text-brand">
                                        +{formatCurrency(o.estorno)}
                                      </span>
                                    </div>
                                  )}

                                  {/* Lucro Liquido */}
                                  <div className="flex justify-between items-center py-3 mt-2 rounded-lg bg-bg-5 px-3">
                                    <span className="text-sm font-bold text-white">Lucro Liquido</span>
                                    <span className={`font-mono text-base font-bold ${profitPositive ? "text-brand" : "text-red-400"}`}>
                                      {formatCurrency(o.profit ?? 0)}
                                    </span>
                                  </div>

                                  {/* Margem */}
                                  <div className="flex justify-end mt-1">
                                    <span className={`text-xs font-mono ${profitPositive ? "text-brand" : "text-red-400"}`}>
                                      Margem: {(o.margin ?? 0).toFixed(1)}%
                                    </span>
                                  </div>

                                </div>

                                {/* Itens do pedido */}
                                {order.items && order.items.length > 0 && (
                                  <div className="mt-5 pt-4 border-t border-border/30">
                                    <p className="text-[10px] font-semibold text-dim uppercase tracking-widest mb-3">
                                      Itens do Pedido
                                    </p>
                                    <div className="flex flex-col gap-2">
                                      {order.items.map((item) => (
                                        <div key={item.id} className="flex items-center justify-between text-sm">
                                          <div className="flex items-center gap-2 flex-1 min-w-0">
                                            <span className="text-muted truncate">{item.title}</span>
                                            <span className="text-dim text-xs flex-shrink-0">x{item.quantity}</span>
                                            {item.sku && (
                                              <span className="font-mono text-[10px] bg-bg-5 border border-border px-1.5 py-0.5 rounded text-dim flex-shrink-0">
                                                {item.sku}
                                              </span>
                                            )}
                                          </div>
                                          <span className="font-mono text-white flex-shrink-0 ml-4">
                                            {formatCurrency(item.unitPrice * item.quantity)}
                                          </span>
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                )}

                              </div>
                            </td>
                          </tr>
                        )}
                      </>
                    );
                  })}
              {!loading && orders.length === 0 && (
                <tr>
                  <td colSpan={11} className="py-16 text-center text-muted text-sm">
                    Nenhum pedido encontrado
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}