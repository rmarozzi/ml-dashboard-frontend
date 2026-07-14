"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  Search, Download, ChevronRight, AlertTriangle, X,
  TrendingUp, TrendingDown, ChevronUp, ChevronDown, Filter,
  ChevronLeft, ChevronsLeft, ChevronsRight, DollarSign
} from "lucide-react";
import { StatusBadge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { ordersApi, exportApi } from "@/lib/api";
import { usePlan } from "@/contexts/PlanContext";
import { usePermissions } from "@/contexts/PermissionsContext";
import { UpgradeGate } from "@/components/ui/UpgradeGate";
import { formatCurrency, formatDateTime, downloadBlob, formatDocument, getInitials } from "@/lib/utils";

const STATUSES = ["paid", "pending", "shipped", "cancelled"];
const STATUS_LABELS: Record<string, string> = {
  paid: "Pago", pending: "Pendente", shipped: "Enviado", cancelled: "Cancelado"
};

const PAGE_SIZE = 50;

type SortField = "mlId" | "totalAmount" | "dateCreated" | "status";
type SortDir = "asc" | "desc";

export default function OrdersPage() {
  const router = useRouter();
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [onlyMissingCost, setOnlyMissingCost] = useState(false);
  const [expanded, setExpanded] = useState<number | null>(null);
  const [exporting, setExporting] = useState(false);
  const [sortField, setSortField] = useState<SortField>("dateCreated");
  const [sortDir, setSortDir] = useState<SortDir>("desc");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [missingCostTotal, setMissingCostTotal] = useState(0);
  const [activeFilterCol, setActiveFilterCol] = useState<string | null>(null);
  const filterRef = useRef<HTMLDivElement>(null);

  const { hasPlan, hasFeature } = usePlan();
  const { can, isFuncionario } = usePermissions();
  const canViewProfit = hasPlan("prata");
  const canExport = hasFeature("canExport") && (!isFuncionario || can("export_data"));

  // Debounce search input
  useEffect(() => {
    const t = setTimeout(() => { setSearch(searchInput); setCurrentPage(1); }, 400);
    return () => clearTimeout(t);
  }, [searchInput]);

  const load = useCallback(() => {
    setLoading(true);
    const params: Record<string, string> = {
      page: String(currentPage),
      limit: String(PAGE_SIZE),
      sortField,
      sortDir,
    };
    if (search) params.search = search;
    if (statusFilter) params.status = statusFilter;
    if (onlyMissingCost) params.onlyMissingCost = "true";

    ordersApi.list(params)
      .then(({ data }) => {
        setOrders(data.orders ?? []);
        setTotal(data.total ?? 0);
        setTotalPages(data.totalPages ?? 1);
        setMissingCostTotal(data.missingCostTotal ?? 0);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [currentPage, search, statusFilter, onlyMissingCost, sortField, sortDir]);

  useEffect(() => { load(); }, [load]);

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
    setCurrentPage(1);
  };

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) return <ChevronUp size={10} className="text-dim opacity-40" />;
    return sortDir === "asc"
      ? <ChevronUp size={10} className="text-brand" />
      : <ChevronDown size={10} className="text-brand" />;
  };

  const ColHeader = ({ field, label }: { field?: SortField; label: string }) => (
    <th className="px-4 py-3 text-[10px] font-semibold text-dim uppercase tracking-widest whitespace-nowrap">
      {field ? (
        <button onClick={() => handleSort(field)} className="flex items-center gap-1 hover:text-white transition-colors">
          {label}
          <SortIcon field={field} />
        </button>
      ) : <span>{label}</span>}
    </th>
  );

  const activeFiltersCount = (onlyMissingCost ? 1 : 0) + (statusFilter ? 1 : 0) + (search ? 1 : 0);

  return (
    <div className="flex flex-col gap-4">

      {/* Banner de alerta — sem custo cadastrado */}
      {canViewProfit && missingCostTotal > 0 && !onlyMissingCost && (
        <div
          className="flex items-center justify-between gap-3 bg-yellow-500/10 border border-yellow-500/30 rounded-lg px-4 py-3 cursor-pointer hover:bg-yellow-500/15 transition-colors"
          onClick={() => { setOnlyMissingCost(true); setCurrentPage(1); }}
        >
          <div className="flex items-center gap-2">
            <AlertTriangle size={15} className="text-yellow-400 flex-shrink-0" />
            <p className="text-sm text-yellow-400 font-semibold">
              {missingCostTotal} pedido{missingCostTotal !== 1 ? "s" : ""} sem preço de custo cadastrado
            </p>
            <p className="text-xs text-yellow-400/70 hidden sm:block">— lucro e margem podem estar incorretos</p>
          </div>
          <span className="text-xs text-yellow-400 font-semibold whitespace-nowrap">Ver pedidos →</span>
        </div>
      )}

      {/* Toolbar */}
      <div className="flex gap-2 flex-wrap">
        <div className="flex-1 min-w-[200px] relative">
          <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-dim pointer-events-none" />
          <input
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Buscar por ID ou produto..."
            className="w-full bg-bg-3 border border-border rounded-lg pl-8 pr-3 py-2 text-sm text-white placeholder:text-dim outline-none focus:border-brand/50"
          />
          {searchInput && (
            <button onClick={() => setSearchInput("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-dim hover:text-white">
              <X size={13} />
            </button>
          )}
        </div>

        <select
          value={statusFilter}
          onChange={(e) => { setStatusFilter(e.target.value); setCurrentPage(1); }}
          className="bg-bg-3 border border-border rounded-lg px-3 py-2 text-sm text-muted outline-none cursor-pointer"
        >
          <option value="">Todos os status</option>
          {STATUSES.map((s) => <option key={s} value={s}>{STATUS_LABELS[s]}</option>)}
        </select>

        {canViewProfit && (
          <button
            onClick={() => { setOnlyMissingCost(p => !p); setCurrentPage(1); }}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-lg border text-xs font-semibold transition-all ${
              onlyMissingCost
                ? "bg-yellow-500/15 border-yellow-500/50 text-yellow-400"
                : "bg-bg-3 border-border text-muted hover:text-white"
            }`}
          >
            <DollarSign size={12} />
            Sem preço de custo
            {missingCostTotal > 0 && (
              <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold ${onlyMissingCost ? "bg-yellow-500/30" : "bg-bg-5 text-dim"}`}>
                {missingCostTotal}
              </span>
            )}
          </button>
        )}

        {activeFiltersCount > 0 && (
          <button
            onClick={() => { setSearchInput(""); setSearch(""); setStatusFilter(""); setOnlyMissingCost(false); setCurrentPage(1); }}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-red-500/30 bg-red-500/10 text-red-400 text-xs font-semibold"
          >
            <X size={12} /> Limpar filtros
          </button>
        )}

        {canExport && (
          <Button variant="secondary" size="sm" loading={exporting} onClick={handleExport}>
            <Download size={13} /> Exportar CSV
          </Button>
        )}
      </div>

      {/* Contagem + paginação topo */}
      <div className="flex items-center justify-between">
        <p className="text-xs text-dim">
          {loading ? "Carregando..." : `${total} pedido${total !== 1 ? "s" : ""} — página ${currentPage} de ${totalPages}`}
        </p>
        {totalPages > 1 && (
          <PaginationControls currentPage={currentPage} totalPages={totalPages} onChange={(p) => { setCurrentPage(p); setExpanded(null); }} />
        )}
      </div>

      {/* Tabela */}
      <div className="bg-bg-3 border border-border rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-border bg-bg-4">
                <ColHeader field="mlId" label="ID" />
                <th className="px-4 py-3 text-[10px] font-semibold text-dim uppercase tracking-widest whitespace-nowrap">SKU</th>
                <th className="px-4 py-3 text-[10px] font-semibold text-dim uppercase tracking-widest whitespace-nowrap">Produto</th>
                <th className="px-4 py-3 text-[10px] font-semibold text-dim uppercase tracking-widest whitespace-nowrap">Qtd.</th>
                <th className="px-4 py-3 text-[10px] font-semibold text-dim uppercase tracking-widest whitespace-nowrap">Conta ML</th>
                <ColHeader field="totalAmount" label="Receita" />
                {canViewProfit && <th className="px-4 py-3 text-[10px] font-semibold text-dim uppercase tracking-widest whitespace-nowrap">Lucro</th>}
                {canViewProfit && <th className="px-4 py-3 text-[10px] font-semibold text-dim uppercase tracking-widest whitespace-nowrap">Margem</th>}
<th className="px-4 py-3 text-[10px] font-semibold text-dim uppercase tracking-widest whitespace-nowrap">
  <button onClick={() => handleSort("dateCreated")} className="flex items-center gap-1 hover:text-white transition-colors">
    Data da Venda
    <SortIcon field="dateCreated" />
  </button>
</th>
<th className="px-4 py-3 text-[10px] font-semibold text-dim uppercase tracking-widest whitespace-nowrap">
  Data de Liberação
</th>                <ColHeader field="status" label="Status" />
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {loading ? (
  <tr>
    <td colSpan={11} className="py-20">
      <div className="flex flex-col items-center justify-center gap-3">
        <div className="w-8 h-8 border-2 border-brand border-t-transparent rounded-full animate-spin" />
        <p className="text-xs text-dim">Carregando pedidos...</p>
      </div>
    </td>
  </tr>
) : orders.map((order) => {
                    const o = order as any;
                    const isExpanded = expanded === order.id;
                    const profitPositive = (o.profit ?? 0) >= 0;
                    const hasMissingCost = !o.allCostsFound;
                    const hasMissingSku = o.missingSkus?.length > 0;
                    const totalQty = order.items?.reduce((acc: number, i: any) => acc + i.quantity, 0) ?? 0;
                    const firstSku = order.items?.find((i: any) => i.sku)?.sku;
                    const skuCount = order.items?.filter((i: any) => i.sku).length ?? 0;

                    return (
                      <>
                        <tr
                          key={order.id}
                          className={`border-b transition-colors cursor-pointer ${
                            hasMissingCost
                              ? "border-b-yellow-500/20 bg-yellow-500/[0.03] hover:bg-yellow-500/[0.07]"
                              : "border-border/20 hover:bg-bg-4"
                          }`}
                          onClick={() => setExpanded(isExpanded ? null : order.id)}
                        >
                          <td className="px-4 py-3 font-mono text-xs text-muted whitespace-nowrap">
  <div className="flex items-center gap-1.5">
    {hasMissingCost && canViewProfit && (
      <div className="w-1.5 h-1.5 rounded-full bg-yellow-500 flex-shrink-0" title="Sem preço de custo cadastrado" />
    )}
    {order.packId || order.mlId}
  </div>
</td>

                          <td className="px-4 py-3 whitespace-nowrap">
                            {hasMissingSku ? (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  const item = order.items?.[0];
const params = new URLSearchParams();
if (item?.title) params.set("name", item.title);
if (item?.sku) params.set("sku", item.sku);
router.push(`/dashboard/costs?${params.toString()}`);
                                }}
                                className="flex items-center gap-1 bg-yellow-500/10 border border-yellow-500/30 text-yellow-400 text-[10px] font-bold px-2 py-0.5 rounded hover:bg-yellow-500/20 transition-colors"
                              >
                                <AlertTriangle size={9} /> Cadastrar custo
                              </button>
                            ) : (
                              <span className="font-mono text-[10px] bg-bg-5 border border-border px-1.5 py-0.5 rounded text-dim">
                                {firstSku}
                                {skuCount > 1 && <span className="ml-1 text-dim">+{skuCount - 1}</span>}
                              </span>
                            )}
                          </td>

                          <td className="px-4 py-3 text-sm text-white max-w-[200px] truncate">
                            {order.items?.[0]?.title ?? "—"}
                            {order.items && order.items.length > 1 && (
                              <span className="ml-1 text-xs text-dim">+{order.items.length - 1}</span>
                            )}
                          </td>

                          <td className="px-4 py-3 font-mono text-sm text-muted text-center">{totalQty}</td>

                          <td className="px-4 py-3 text-xs text-muted whitespace-nowrap">
                            {order.token?.apelido ?? order.token?.mlNickname ?? "—"}
                          </td>

                          <td className="px-4 py-3 font-mono text-sm text-white whitespace-nowrap">
                            {formatCurrency(order.totalAmount)}
                          </td>

                          {canViewProfit && (
                            <td className={`px-4 py-3 font-mono text-sm whitespace-nowrap ${
                              hasMissingCost ? "text-yellow-400" : profitPositive ? "text-brand" : "text-red-400"
                            }`}>
                              {hasMissingCost ? (
                                <span className="flex items-center gap-1 text-yellow-400 text-xs">
                                  <AlertTriangle size={11} /> Sem custo
                                </span>
                              ) : o.profit != null ? (
                                <span className="flex items-center gap-1">
                                  {profitPositive ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
                                  {formatCurrency(o.profit)}
                                </span>
                              ) : <span className="text-dim">—</span>}
                            </td>
                          )}

                          {canViewProfit && (
                            <td className={`px-4 py-3 font-mono text-sm whitespace-nowrap ${
                              hasMissingCost ? "text-yellow-400" : profitPositive ? "text-brand" : "text-red-400"
                            }`}>
                              {hasMissingCost
                                ? <span className="text-dim">—</span>
                                : o.margin != null ? `${o.margin.toFixed(1)}%` : <span className="text-dim">—</span>}
                            </td>
                          )}

                          <td className="px-4 py-3 text-xs text-dim whitespace-nowrap">
  {formatDateTime(order.dateCreated)}
</td>
<td className="px-4 py-3 text-xs whitespace-nowrap">
  {(() => {
    const releaseDate = order.payments?.find((p: any) => p.moneyReleaseDate)?.moneyReleaseDate;
    if (!releaseDate) return <span className="text-dim">—</span>;
    const isFuture = new Date(releaseDate) > new Date();
    return (
      <span className={isFuture ? "text-yellow-400" : "text-brand"}>
        {formatDateTime(releaseDate)}
      </span>
    );
  })()}
</td>

                          <td className="px-4 py-3"><StatusBadge status={order.status} /></td>

                          <td className="px-4 py-3">
                            <ChevronRight
                              size={14}
                              className={`text-dim transition-transform duration-200 ${isExpanded ? "rotate-90" : ""}`}
                            />
                          </td>
                        </tr>

                        {isExpanded && canViewProfit && (
                          <tr key={`exp-${order.id}`} className="border-b border-border/20">
                            <td colSpan={11} className="p-0">
<div className="bg-bg-4 border-t border-border/30 px-6 py-5">

  {/* Card do Cliente */}
  {order.buyerName && (
    <>
      <p className="text-[10px] font-semibold text-dim uppercase tracking-widest mb-3">
        Dados do Cliente
      </p>
      <div className="bg-bg-3 border border-border rounded-xl px-4 py-3.5 mb-5 flex items-center gap-3.5">
        <div className="w-9 h-9 rounded-full bg-gradient-to-br from-brand/30 to-blue-500/30 flex items-center justify-center flex-shrink-0">
          <span className="font-syne font-bold text-brand text-sm">
            {getInitials(order.buyerName)}
          </span>
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-0.5">
            <span className="text-sm font-semibold text-white">{order.buyerName}</span>
            {order.buyerDocType && (
              <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded border ${
                order.buyerDocType === "CNPJ"
                  ? "bg-purple-500/12 text-purple-400 border-purple-500/30"
                  : "bg-blue-500/12 text-blue-400 border-blue-500/30"
              }`}>
                {order.buyerDocType === "CNPJ" ? "PJ" : "PF"}
              </span>
            )}
          </div>
          <div className="flex gap-3.5 text-xs text-muted flex-wrap">
            {order.buyerDocNumber && (
              <span>{order.buyerDocType ?? "Doc"}: <span className="font-mono text-[#a8a8c0]">{formatDocument(order.buyerDocNumber, order.buyerDocType)}</span></span>
            )}
            {(order.buyerCity || order.buyerState) && (
              <span>{[order.buyerCity, order.buyerState].filter(Boolean).join(", ")}</span>
            )}
          </div>
        </div>
      </div>
    </>
  )}

  <p className="text-[10px] font-semibold text-dim uppercase tracking-widest mb-4">
    Detalhamento Financeiro
  </p>

                                {hasMissingCost && (
                                  <div className="flex items-center gap-2 bg-yellow-500/10 border border-yellow-500/30 rounded-lg px-3 py-2 mb-4">
                                    <AlertTriangle size={13} className="text-yellow-400 flex-shrink-0" />
                                    <p className="text-xs text-yellow-400">
                                      Preço de custo nao cadastrado — lucro e margem podem estar incorretos.{" "}
                                      <button
                                        onClick={() => {
                                          const item = order.items?.[0];
const params = new URLSearchParams();
if (item?.title) params.set("name", item.title);
if (item?.sku) params.set("sku", item.sku);
router.push(`/dashboard/costs?${params.toString()}`);
                                        }}
                                        className="underline font-semibold hover:text-yellow-300"
                                      >
                                        Cadastrar agora
                                      </button>
                                    </p>
                                  </div>
                                )}

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
                                      {hasMissingCost && <span className="ml-2 text-[10px] text-yellow-400">(custo nao cadastrado)</span>}
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
                                      <button
                                        onClick={() => {
                                          const item = order.items?.[0];
const params = new URLSearchParams();
if (item?.title) params.set("name", item.title);
if (item?.sku) params.set("sku", item.sku);
router.push(`/dashboard/costs?${params.toString()}`);
                                        }}
                                        className="text-yellow-400 text-sm font-semibold hover:text-yellow-300 underline"
                                      >
                                        Cadastrar custo
                                      </button>
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
                                    <span className={`font-mono text-base font-bold ${hasMissingCost ? "text-yellow-400" : profitPositive ? "text-brand" : "text-red-400"}`}>
                                      {formatCurrency(o.profit ?? 0)}
                                      {hasMissingCost && <span className="text-[10px] ml-1 opacity-70">*estimado</span>}
                                    </span>
                                  </div>
                                  <div className="flex justify-end mt-1">
                                    <span className={`text-xs font-mono ${hasMissingCost ? "text-yellow-400" : profitPositive ? "text-brand" : "text-red-400"}`}>
                                      Margem: {(o.margin ?? 0).toFixed(1)}%
                                      {hasMissingCost && <span className="ml-1 opacity-70">*estimado</span>}
                                    </span>
                                  </div>
                                </div>

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
  if (item.sku) params.set("sku", item.sku);
  router.push(`/dashboard/costs?${params.toString()}`);
}}
                                                className="flex items-center gap-1 bg-yellow-500/10 border border-yellow-500/30 text-yellow-400 text-[10px] font-bold px-1.5 py-0.5 rounded hover:bg-yellow-500/20 flex-shrink-0"
                                              >
                                                <AlertTriangle size={8} /> Cadastrar custo
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

      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-xs text-dim">
            Mostrando {(currentPage - 1) * PAGE_SIZE + 1}–{Math.min(currentPage * PAGE_SIZE, total)} de {total} pedidos
          </p>
          <PaginationControls
            currentPage={currentPage}
            totalPages={totalPages}
            onChange={(p) => { setCurrentPage(p); setExpanded(null); window.scrollTo({ top: 0, behavior: "smooth" }); }}
          />
        </div>
      )}
    </div>
  );
}

function PaginationControls({ currentPage, totalPages, onChange }: {
  currentPage: number;
  totalPages: number;
  onChange: (page: number) => void;
}) {
  const pages = () => {
    const delta = 2;
    const range: (number | "...")[] = [];
    for (let i = Math.max(2, currentPage - delta); i <= Math.min(totalPages - 1, currentPage + delta); i++) {
      range.push(i);
    }
    if (currentPage - delta > 2) range.unshift("...");
    if (currentPage + delta < totalPages - 1) range.push("...");
    range.unshift(1);
    if (totalPages > 1) range.push(totalPages);
    return range;
  };

  const btn = "w-8 h-8 flex items-center justify-center rounded-lg text-xs font-semibold transition-colors";

  return (
    <div className="flex items-center gap-1">
      <button onClick={() => onChange(1)} disabled={currentPage === 1}
        className={`${btn} border border-border text-dim hover:text-white disabled:opacity-30 disabled:cursor-not-allowed`}>
        <ChevronsLeft size={13} />
      </button>
      <button onClick={() => onChange(currentPage - 1)} disabled={currentPage === 1}
        className={`${btn} border border-border text-dim hover:text-white disabled:opacity-30 disabled:cursor-not-allowed`}>
        <ChevronLeft size={13} />
      </button>
      {pages().map((p, i) => p === "..." ? (
        <span key={`dots-${i}`} className="w-8 h-8 flex items-center justify-center text-dim text-xs">...</span>
      ) : (
        <button key={p} onClick={() => onChange(p as number)}
          className={`${btn} border ${currentPage === p ? "border-brand bg-brand/15 text-brand" : "border-border text-muted hover:text-white hover:border-border-light"}`}>
          {p}
        </button>
      ))}
      <button onClick={() => onChange(currentPage + 1)} disabled={currentPage === totalPages}
        className={`${btn} border border-border text-dim hover:text-white disabled:opacity-30 disabled:cursor-not-allowed`}>
        <ChevronRight size={13} />
      </button>
      <button onClick={() => onChange(totalPages)} disabled={currentPage === totalPages}
        className={`${btn} border border-border text-dim hover:text-white disabled:opacity-30 disabled:cursor-not-allowed`}>
        <ChevronsRight size={13} />
      </button>
    </div>
  );
}