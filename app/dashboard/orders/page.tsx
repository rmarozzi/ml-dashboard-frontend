"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  Search, Download, ChevronRight, AlertTriangle, X,
  TrendingUp, TrendingDown, ChevronUp, ChevronDown, Filter
} from "lucide-react";
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

type SortField = "mlId" | "totalAmount" | "mlFee" | "shippingCost" | "profit" | "margin" | "dateCreated" | "status";
type SortDir = "asc" | "desc";

interface ColumnFilter {
  value: string;
  operator: "contains" | "gt" | "lt" | "eq";
}

export default function OrdersPage() {
  const router = useRouter();
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [onlyMissingSku, setOnlyMissingSku] = useState(false);
  const [expanded, setExpanded] = useState<number | null>(null);
  const [exporting, setExporting] = useState(false);
  const [sortField, setSortField] = useState<SortField>("dateCreated");
  const [sortDir, setSortDir] = useState<SortDir>("desc");
  const [activeFilterCol, setActiveFilterCol] = useState<string | null>(null);
  const [columnFilters, setColumnFilters] = useState<Record<string, ColumnFilter>>({});
  const filterRef = useRef<HTMLDivElement>(null);

  const { hasPlan, hasFeature } = usePlan();
  const { can, isFuncionario } = usePermissions();
  const canViewProfit = hasPlan("prata");
  const canExport = hasFeature("canExport") && (!isFuncionario || can("export_data"));

  const load = useCallback(() => {
    setLoading(true);
    const params: Record<string, string> = {};
    if (search) params.search = search;
    if (statusFilter) params.status = statusFilter;
    params.limit = "500";
    ordersApi.list(params)
      .then(({ data }) => setOrders(data.orders ?? []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [search, statusFilter]);

  useEffect(() => { load(); }, [load]);

  // Close filter dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (filterRef.current && !filterRef.current.contains(e.target as Node)) {
        setActiveFilterCol(null);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

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

  const handleSort = (field: SortField) => {
    if (sortField === field) setSortDir(d => d === "asc" ? "desc" : "asc");
    else { setSortField(field); setSortDir("asc"); }
  };

  const setColFilter = (col: string, value: string, operator: ColumnFilter["operator"] = "contains") => {
    setColumnFilters(prev => value
      ? { ...prev, [col]: { value, operator } }
      : Object.fromEntries(Object.entries(prev).filter(([k]) => k !== col))
    );
  };

  // Apply column filters
  const filtered = orders.filter(o => {
    if (onlyMissingSku && (!o.missingSkus || o.missingSkus.length === 0)) return false;

    for (const [col, f] of Object.entries(columnFilters)) {
      const val = f.value.toLowerCase();
      switch (col) {
        case "mlId":
          if (!o.mlId?.toLowerCase().includes(val)) return false; break;
        case "product":
          if (!o.items?.[0]?.title?.toLowerCase().includes(val)) return false; break;
        case "sku":
          if (!o.items?.some((i: any) => i.sku?.toLowerCase().includes(val))) return false; break;
        case "conta":
          if (!(o.token?.apelido ?? o.token?.mlNickname ?? "").toLowerCase().includes(val)) return false; break;
        case "status":
          if (o.status !== f.value) return false; break;
        case "receita":
          if (f.operator === "gt" && o.totalAmount <= parseFloat(f.value)) return false;
          if (f.operator === "lt" && o.totalAmount >= parseFloat(f.value)) return false;
          break;
        case "lucro":
          if (f.operator === "gt" && (o.profit ?? 0) <= parseFloat(f.value)) return false;
          if (f.operator === "lt" && (o.profit ?? 0) >= parseFloat(f.value)) return false;
          break;
        case "margem":
          if (f.operator === "gt" && (o.margin ?? 0) <= parseFloat(f.value)) return false;
          if (f.operator === "lt" && (o.margin ?? 0) >= parseFloat(f.value)) return false;
          break;
      }
    }
    return true;
  });

  // Apply sort
  const sorted = [...filtered].sort((a, b) => {
    let av: any, bv: any;
    switch (sortField) {
      case "mlId": av = a.mlId; bv = b.mlId; break;
      case "totalAmount": av = a.totalAmount; bv = b.totalAmount; break;
      case "mlFee": av = a.mlFee ?? 0; bv = b.mlFee ?? 0; break;
      case "shippingCost": av = a.shippingCost ?? 0; bv = b.shippingCost ?? 0; break;
      case "profit": av = a.profit ?? 0; bv = b.profit ?? 0; break;
      case "margin": av = a.margin ?? 0; bv = b.margin ?? 0; break;
      case "dateCreated": av = new Date(a.dateCreated).getTime(); bv = new Date(b.dateCreated).getTime(); break;
      case "status": av = a.status; bv = b.status; break;
    }
    if (av < bv) return sortDir === "asc" ? -1 : 1;
    if (av > bv) return sortDir === "asc" ? 1 : -1;
    return 0;
  });

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) return <ChevronUp size={10} className="text-dim opacity-40" />;
    return sortDir === "asc"
      ? <ChevronUp size={10} className="text-brand" />
      : <ChevronDown size={10} className="text-brand" />;
  };

  const hasFilter = (col: string) => !!columnFilters[col];

  const ColHeader = ({ field, col, label, numeric }: { field?: SortField; col: string; label: string; numeric?: boolean }) => (
    <th className="px-4 py-3 text-[10px] font-semibold text-dim uppercase tracking-widest whitespace-nowrap">
      <div className="flex items-center gap-1">
        {field ? (
          <button onClick={() => handleSort(field)} className="flex items-center gap-1 hover:text-white transition-colors">
            {label}
            <SortIcon field={field} />
          </button>
        ) : <span>{label}</span>}
        <div className="relative" ref={activeFilterCol === col ? filterRef : undefined}>
          <button
            onClick={(e) => { e.stopPropagation(); setActiveFilterCol(activeFilterCol === col ? null : col); }}
            className={`ml-0.5 p-0.5 rounded transition-colors ${hasFilter(col) ? "text-brand" : "text-dim hover:text-white"}`}
          >
            <Filter size={9} />
          </button>
          {activeFilterCol === col && (
            <div className="absolute top-6 left-0 z-50 bg-bg-4 border border-border rounded-xl shadow-xl p-3 min-w-[180px]">
              {numeric ? (
                <div className="flex flex-col gap-2">
                  <p className="text-[10px] text-dim uppercase tracking-widest">Filtrar {label}</p>
                  <div className="flex gap-1">
                    <button onClick={() => setColFilter(col, columnFilters[col]?.value ?? "", "gt")}
                      className={`flex-1 text-[10px] py-1 rounded border transition-colors ${columnFilters[col]?.operator === "gt" ? "border-brand text-brand" : "border-border text-dim"}`}>
                      Maior que
                    </button>
                    <button onClick={() => setColFilter(col, columnFilters[col]?.value ?? "", "lt")}
                      className={`flex-1 text-[10px] py-1 rounded border transition-colors ${columnFilters[col]?.operator === "lt" ? "border-brand text-brand" : "border-border text-dim"}`}>
                      Menor que
                    </button>
                  </div>
                  <input
                    type="number"
                    placeholder="Valor..."
                    value={columnFilters[col]?.value ?? ""}
                    onChange={(e) => setColFilter(col, e.target.value, columnFilters[col]?.operator ?? "gt")}
                    className="w-full bg-bg-5 border border-border rounded-lg px-2 py-1.5 text-xs text-white outline-none focus:border-brand/50"
                  />
                  {hasFilter(col) && (
                    <button onClick={() => setColFilter(col, "")} className="text-[10px] text-red-400 hover:text-red-300">
                      Limpar filtro
                    </button>
                  )}
                </div>
              ) : col === "status" ? (
                <div className="flex flex-col gap-1">
                  <p className="text-[10px] text-dim uppercase tracking-widest mb-1">Status</p>
                  {["", ...STATUSES].map(s => (
                    <button key={s} onClick={() => { setColFilter(col, s, "eq"); setActiveFilterCol(null); }}
                      className={`text-left text-xs px-2 py-1.5 rounded transition-colors ${columnFilters[col]?.value === s ? "bg-brand/20 text-brand" : "text-muted hover:bg-bg-5"}`}>
                      {s ? STATUS_LABELS[s] : "Todos"}
                    </button>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col gap-2">
                  <p className="text-[10px] text-dim uppercase tracking-widest">Buscar {label}</p>
                  <input
                    autoFocus
                    placeholder={`Filtrar ${label}...`}
                    value={columnFilters[col]?.value ?? ""}
                    onChange={(e) => setColFilter(col, e.target.value)}
                    className="w-full bg-bg-5 border border-border rounded-lg px-2 py-1.5 text-xs text-white outline-none focus:border-brand/50"
                  />
                  {hasFilter(col) && (
                    <button onClick={() => setColFilter(col, "")} className="text-[10px] text-red-400 hover:text-red-300">
                      Limpar filtro
                    </button>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </th>
  );

  const activeFiltersCount = Object.keys(columnFilters).length + (onlyMissingSku ? 1 : 0);

  return (
    <div className="flex flex-col gap-4">

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

        {/* Filtro sem SKU */}
        <button
          onClick={() => setOnlyMissingSku(p => !p)}
          className={`flex items-center gap-1.5 px-3 py-2 rounded-lg border text-xs font-semibold transition-all ${
            onlyMissingSku
              ? "bg-yellow-500/15 border-yellow-500/50 text-yellow-400"
              : "bg-bg-3 border-border text-muted hover:text-white"
          }`}
        >
          <AlertTriangle size={12} />
          Sem SKU
          {orders.filter(o => o.missingSkus?.length > 0).length > 0 && (
            <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold ${onlyMissingSku ? "bg-yellow-500/30" : "bg-bg-5"}`}>
              {orders.filter(o => o.missingSkus?.length > 0).length}
            </span>
          )}
        </button>

        {/* Limpar filtros */}
        {activeFiltersCount > 0 && (
          <button
            onClick={() => { setColumnFilters({}); setOnlyMissingSku(false); }}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-red-500/30 bg-red-500/10 text-red-400 text-xs font-semibold"
          >
            <X size={12} /> Limpar {activeFiltersCount} filtro{activeFiltersCount > 1 ? "s" : ""}
          </button>
        )}

        {canExport && (
          <Button variant="secondary" size="sm" loading={exporting} onClick={handleExport}>
            <Download size={13} /> Exportar CSV
          </Button>
        )}
      </div>

      {/* Contagem */}
      <div className="flex items-center justify-between">
        <p className="text-xs text-dim">
          {sorted.length} pedido{sorted.length !== 1 ? "s" : ""}
          {activeFiltersCount > 0 && ` (filtrado de ${orders.length})`}
        </p>
      </div>

      {/* Tabela */}
      <div className="bg-bg-3 border border-border rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-border bg-bg-4">
                <ColHeader field="mlId" col="mlId" label="ID" />
                <ColHeader col="sku" label="SKU" />
                <ColHeader col="product" label="Produto" />
                <th className="px-4 py-3 text-[10px] font-semibold text-dim uppercase tracking-widest whitespace-nowrap">Qtd.</th>
                <ColHeader col="conta" label="Conta ML" />
                <ColHeader field="totalAmount" col="receita" label="Receita" numeric />
                {canViewProfit && <ColHeader field="profit" col="lucro" label="Lucro" numeric />}
                {canViewProfit && <ColHeader field="margin" col="margem" label="Margem" numeric />}
                <ColHeader field="dateCreated" col="data" label="Data" />
                <ColHeader field="status" col="status" label="Status" />
                <th className="px-4 py-3" />
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
                : sorted.map((order) => {
                    const o = order as any;
                    const isExpanded = expanded === order.id;
                    const profitPositive = (o.profit ?? 0) >= 0;
                    const hasMissingSku = o.missingSkus?.length > 0;
                    const totalQty = order.items?.reduce((acc: number, i: any) => acc + i.quantity, 0) ?? 0;
                    const firstSku = order.items?.find((i: any) => i.sku)?.sku;
                    const skuCount = order.items?.filter((i: any) => i.sku).length ?? 0;

                    return (
                      <>
                        <tr
                          key={order.id}
                          className={`border-b border-border/20 hover:bg-bg-4 transition-colors cursor-pointer ${hasMissingSku ? "border-l-2 border-l-yellow-500/50" : ""}`}
                          onClick={() => setExpanded(isExpanded ? null : order.id)}
                        >
                          {/* ID */}
                          <td className="px-4 py-3 font-mono text-xs text-muted whitespace-nowrap">{order.mlId}</td>

                          {/* SKU */}
                          <td className="px-4 py-3 whitespace-nowrap">
                            {hasMissingSku ? (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  const item = order.items?.find((i: any) => !i.sku);
                                  const params = new URLSearchParams();
                                  if (item?.title) params.set("name", item.title);
                                  if (item?.mlItemId) params.set("sku", item.mlItemId);
                                  router.push(`/dashboard/costs?${params.toString()}`);
                                }}
                                className="flex items-center gap-1 bg-yellow-500/10 border border-yellow-500/30 text-yellow-400 text-[10px] font-bold px-2 py-0.5 rounded hover:bg-yellow-500/20 transition-colors"
                              >
                                <AlertTriangle size={9} />
                                Sem SKU
                              </button>
                            ) : (
                              <span className="font-mono text-[10px] bg-bg-5 border border-border px-1.5 py-0.5 rounded text-dim">
                                {firstSku}
                                {skuCount > 1 && <span className="ml-1 text-dim">+{skuCount - 1}</span>}
                              </span>
                            )}
                          </td>

                          {/* Produto */}
                          <td className="px-4 py-3 text-sm text-white max-w-[200px] truncate">
                            {order.items?.[0]?.title ?? "—"}
                            {order.items && order.items.length > 1 && (
                              <span className="ml-1 text-xs text-dim">+{order.items.length - 1}</span>
                            )}
                          </td>

                          {/* Qtd */}
                          <td className="px-4 py-3 font-mono text-sm text-muted text-center">
                            {totalQty}
                          </td>

                          {/* Conta ML */}
                          <td className="px-4 py-3 text-xs text-muted whitespace-nowrap">
                            {order.token?.apelido ?? order.token?.mlNickname ?? "—"}
                          </td>

                          {/* Receita */}
                          <td className="px-4 py-3 font-mono text-sm text-white whitespace-nowrap">
                            {formatCurrency(order.totalAmount)}
                          </td>

                          {/* Lucro */}
                          {canViewProfit && (
                            <td className={`px-4 py-3 font-mono text-sm whitespace-nowrap ${profitPositive ? "text-brand" : "text-red-400"}`}>
                              {o.profit != null ? (
                                <span className="flex items-center gap-1">
                                  {profitPositive ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
                                  {formatCurrency(o.profit)}
                                </span>
                              ) : <span className="text-dim">—</span>}
                            </td>
                          )}

                          {/* Margem */}
                          {canViewProfit && (
                            <td className={`px-4 py-3 font-mono text-sm whitespace-nowrap ${profitPositive ? "text-brand" : "text-red-400"}`}>
                              {o.margin != null ? `${o.margin.toFixed(1)}%` : <span className="text-dim">—</span>}
                            </td>
                          )}

                          {/* Data */}
                          <td className="px-4 py-3 text-xs text-dim whitespace-nowrap">
                            {formatDateTime(order.dateCreated)}
                          </td>

                          {/* Status */}
                          <td className="px-4 py-3"><StatusBadge status={order.status} /></td>

                          {/* Expand */}
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
                                  <div className="flex justify-between items-center py-2 border-b border-border/20">
                                    <span className="text-sm text-muted">Receita Bruta</span>
                                    <span className="font-mono text-sm font-bold text-white">{formatCurrency(order.totalAmount)}</span>
                                  </div>
                                  <div className="flex justify-between items-center py-2 border-b border-border/20">
                                    <span className="text-sm text-muted">Tarifa Mercado Livre</span>
                                    <span className="font-mono text-sm text-red-400">-{formatCurrency(o.mlFee ?? 0)}</span>
                                  </div>
                                  <div className="flex justify-between items-center py-2 border-b border-border/20">
                                    <span className="text-sm text-muted">Frete (cobrado do vendedor)</span>
                                    <span className={`font-mono text-sm ${(o.shippingCost ?? 0) > 0 ? "text-red-400" : "text-dim"}`}>
                                      -{formatCurrency(o.shippingCost ?? 0)}
                                    </span>
                                  </div>
                                  <div className="flex justify-between items-center py-2 border-b border-border/20">
                                    <span className="text-sm text-muted">
                                      Imposto NF
                                      {!o.allCostsFound && <span className="ml-2 text-[10px] text-yellow-400">(custo nao cadastrado)</span>}
                                    </span>
                                    <span className={`font-mono text-sm ${(o.nfTax ?? 0) > 0 ? "text-red-400" : "text-dim"}`}>
                                      -{formatCurrency(o.nfTax ?? 0)}
                                    </span>
                                  </div>
                                  <div className="flex justify-between items-center py-2 border-b border-border/20">
                                    <span className="text-sm text-muted">Custo do Produto</span>
                                    {(o.productCost ?? 0) > 0 ? (
                                      <span className="font-mono text-sm text-red-400">-{formatCurrency(o.productCost)}</span>
                                    ) : (
                                      <span className="text-yellow-400 text-sm font-semibold">Verificar custo</span>
                                    )}
                                  </div>
                                  {(o.mlTax ?? 0) > 0 && (
                                    <div className="flex justify-between items-center py-2 border-b border-border/20">
                                      <span className="text-sm text-muted">Imposto ML</span>
                                      <span className="font-mono text-sm text-red-400">-{formatCurrency(o.mlTax)}</span>
                                    </div>
                                  )}
                                  {(o.estorno ?? 0) > 0 && (
                                    <div className="flex justify-between items-center py-2 border-b border-border/20">
                                      <span className="text-sm text-muted">Estorno / Bonus ML</span>
                                      <span className="font-mono text-sm text-brand">+{formatCurrency(o.estorno)}</span>
                                    </div>
                                  )}
                                  <div className="flex justify-between items-center py-3 mt-2 rounded-lg bg-bg-5 px-3">
                                    <span className="text-sm font-bold text-white">Lucro Liquido</span>
                                    <span className={`font-mono text-base font-bold ${profitPositive ? "text-brand" : "text-red-400"}`}>
                                      {formatCurrency(o.profit ?? 0)}
                                    </span>
                                  </div>
                                  <div className="flex justify-end mt-1">
                                    <span className={`text-xs font-mono ${profitPositive ? "text-brand" : "text-red-400"}`}>
                                      Margem: {(o.margin ?? 0).toFixed(1)}%
                                    </span>
                                  </div>
                                </div>

                                {/* Itens */}
                                {order.items && order.items.length > 0 && (
                                  <div className="mt-5 pt-4 border-t border-border/30">
                                    <p className="text-[10px] font-semibold text-dim uppercase tracking-widest mb-3">
                                      Itens do Pedido
                                    </p>
                                    <div className="flex flex-col gap-2">
                                      {order.items.map((item: any) => (
                                        <div key={item.id} className="flex items-center justify-between text-sm gap-4">
                                          <div className="flex items-center gap-2 flex-1 min-w-0">
                                            <span className="text-muted truncate">{item.title}</span>
                                            <span className="text-dim text-xs flex-shrink-0">x{item.quantity}</span>
                                            {item.sku ? (
                                              <span className="font-mono text-[10px] bg-bg-5 border border-border px-1.5 py-0.5 rounded text-dim flex-shrink-0">
                                                {item.sku}
                                              </span>
                                            ) : (
                                              <button
                                                onClick={(e) => {
                                                  e.stopPropagation();
                                                  const params = new URLSearchParams();
                                                  if (item.title) params.set("name", item.title);
                                                  if (item.mlItemId) params.set("sku", item.mlItemId);
                                                  router.push(`/dashboard/costs?${params.toString()}`);
                                                }}
                                                className="flex items-center gap-1 bg-yellow-500/10 border border-yellow-500/30 text-yellow-400 text-[10px] font-bold px-1.5 py-0.5 rounded hover:bg-yellow-500/20 flex-shrink-0"
                                              >
                                                <AlertTriangle size={8} /> Cadastrar SKU
                                              </button>
                                            )}
                                          </div>
                                          <span className="font-mono text-white flex-shrink-0">
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
              {!loading && sorted.length === 0 && (
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