"use client";

import { AlertTriangle, TrendingUp, TrendingDown } from "lucide-react";
import { useRouter } from "next/navigation";
import { formatCurrency, formatDocument, getInitials } from "@/lib/utils";
import { usePlan } from "@/contexts/PlanContext";

interface OrderDetailPanelProps {
  order: any;
}

export function OrderDetailPanel({ order }: OrderDetailPanelProps) {
  const router    = useRouter();
  const { hasPlan } = usePlan();
  const canViewProfit = hasPlan("prata");

  const o               = order as any;
  const profitPositive  = (o.profit ?? 0) >= 0;
  const hasMissingCost  = !o.allCostsFound;

  const handleCadastrarCusto = (item?: any) => {
    const params = new URLSearchParams();
    if (item?.title) params.set("name", item.title);
    if (item?.sku)   params.set("sku", item.sku);
    router.push(`/dashboard/costs?${params.toString()}`);
  };

  return (
    <div className="bg-bg-4 border-t border-border/30 px-6 py-5">

      {/* Dados do Cliente */}
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

      {canViewProfit && (
        <>
          <p className="text-[10px] font-semibold text-dim uppercase tracking-widest mb-4">
            Detalhamento Financeiro
          </p>

          {hasMissingCost && (
            <div className="flex items-center gap-2 bg-yellow-500/10 border border-yellow-500/30 rounded-lg px-3 py-2 mb-4">
              <AlertTriangle size={13} className="text-yellow-400 flex-shrink-0" />
              <p className="text-xs text-yellow-400">
                Preço de custo nao cadastrado — lucro e margem podem estar incorretos.{" "}
                <button
                  onClick={() => handleCadastrarCusto(order.items?.[0])}
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
                  onClick={() => handleCadastrarCusto(order.items?.[0])}
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
        </>
      )}

      {/* Itens do Pedido */}
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
                      onClick={() => handleCadastrarCusto(item)}
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
  );
}