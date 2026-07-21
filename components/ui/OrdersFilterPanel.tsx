"use client";

import { useEffect, useState } from "react";
import { X, RotateCcw } from "lucide-react";
import api from "@/lib/api";

export interface OrderFilters {
  status:           string[];
  dateFrom:         string;
  dateTo:           string;
  releaseFrom:      string;
  releaseTo:        string;
  released:         string;
  amountMin:        string;
  amountMax:        string;
  shippingMin:      string;
  shippingMax:      string;
  channelType:      string;
  channelAccountId: string;
  sku:              string;
  itemCount:        string;
  isPack:           string;
  shipmentStatus:   string[];
  hasTracking:      string;
  state:            string[];
  city:             string;
  docType:          string;
}

export const EMPTY_FILTERS: OrderFilters = {
  status: [], dateFrom: "", dateTo: "", releaseFrom: "", releaseTo: "", released: "",
  amountMin: "", amountMax: "", shippingMin: "", shippingMax: "",
  channelType: "", channelAccountId: "", sku: "", itemCount: "", isPack: "",
  shipmentStatus: [], hasTracking: "", state: [], city: "", docType: "",
};

export function countActiveFilters(f: OrderFilters): number {
  let n = 0;
  if (f.status.length)          n++;
  if (f.dateFrom || f.dateTo)   n++;
  if (f.releaseFrom || f.releaseTo) n++;
  if (f.released)               n++;
  if (f.amountMin || f.amountMax)   n++;
  if (f.shippingMin || f.shippingMax) n++;
  if (f.channelType)            n++;
  if (f.channelAccountId)       n++;
  if (f.sku)                    n++;
  if (f.itemCount)              n++;
  if (f.isPack)                 n++;
  if (f.shipmentStatus.length)  n++;
  if (f.hasTracking)            n++;
  if (f.state.length)           n++;
  if (f.city)                   n++;
  if (f.docType)                n++;
  return n;
}

const STATUS_LABELS: Record<string, string> = {
  paid: "Pago", pending: "Pendente", shipped: "Enviado", cancelled: "Cancelado",
};

const SHIPMENT_LABELS: Record<string, string> = {
  pending: "Aguardando etiqueta", handling: "Preparando", ready_to_ship: "Pronto p/ despachar",
  shipped: "Em trânsito", delivered: "Entregue", not_delivered: "Não entregue", cancelled: "Cancelado",
};

interface FilterOptions {
  states:           string[];
  accounts:         { id: string; label: string; channelType: string }[];
  skus:             string[];
  shipmentStatuses: string[];
}

interface Props {
  open:     boolean;
  onClose:  () => void;
  filters:  OrderFilters;
  onChange: (f: OrderFilters) => void;
}

export function OrdersFilterPanel({ open, onClose, filters, onChange }: Props) {
  const [opts, setOpts] = useState<FilterOptions>({
    states: [], accounts: [], skus: [], shipmentStatuses: [],
  });

  useEffect(() => {
    if (!open) return;
    api.get("/orders/filter-options")
      .then(({ data }) => setOpts({
        states:           data.states ?? [],
        accounts:         data.accounts ?? [],
        skus:             data.skus ?? [],
        shipmentStatuses: data.shipmentStatuses ?? [],
      }))
      .catch(() => {});
  }, [open]);

  const set = (patch: Partial<OrderFilters>) => onChange({ ...filters, ...patch });

  const toggleIn = (key: "status" | "shipmentStatus" | "state", value: string) => {
    const list = filters[key];
    set({ [key]: list.includes(value) ? list.filter((v) => v !== value) : [...list, value] } as any);
  };

  // ── Presets de data ────────────────────────────────────────────────────────
  const applyPreset = (preset: string) => {
    const iso   = (d: Date) => d.toISOString().slice(0, 10);
    const today = new Date();
    let from = new Date(), to = new Date();

    switch (preset) {
      case "today":                                              break;
      case "yesterday": from.setDate(today.getDate() - 1); to = new Date(from); break;
      case "7d":        from.setDate(today.getDate() - 6);       break;
      case "30d":       from.setDate(today.getDate() - 29);      break;
      case "month":     from = new Date(today.getFullYear(), today.getMonth(), 1); break;
      case "lastMonth":
        from = new Date(today.getFullYear(), today.getMonth() - 1, 1);
        to   = new Date(today.getFullYear(), today.getMonth(), 0);
        break;
      default: return;
    }
    set({ dateFrom: iso(from), dateTo: iso(to) });
  };

  if (!open) return null;

  const inputCls  = "w-full bg-bg-5 border border-border rounded-lg px-2.5 py-1.5 text-xs text-white placeholder:text-dim outline-none focus:border-brand/50";
  const selectCls = "w-full bg-bg-5 border border-border rounded-lg px-2.5 py-1.5 text-xs text-muted outline-none cursor-pointer";
  const labelCls  = "text-[10px] font-semibold text-dim uppercase tracking-widest";

  const Chip = ({ active, onClick, children }: any) => (
    <button
      onClick={onClick}
      className={`px-2 py-1 rounded-md border text-[11px] font-semibold transition-colors ${
        active
          ? "bg-brand/15 border-brand/50 text-brand"
          : "bg-bg-5 border-border text-muted hover:text-white"
      }`}
    >
      {children}
    </button>
  );

  const Section = ({ title, children }: any) => (
    <div className="flex flex-col gap-2 pb-4 border-b border-border/40">
      <p className={labelCls}>{title}</p>
      {children}
    </div>
  );

  return (
    <>
      {/* Backdrop mobile */}
      <div className="fixed inset-0 bg-black/50 z-40 lg:hidden" onClick={onClose} />

      <aside className="fixed lg:sticky top-0 right-0 z-50 lg:z-auto h-screen lg:h-[calc(100vh-6rem)] w-[300px] flex-shrink-0 bg-bg-3 border-l lg:border lg:rounded-xl border-border flex flex-col">

        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-border flex-shrink-0">
          <p className="text-sm font-bold text-white">Filtros</p>
          <div className="flex items-center gap-1">
            <button
              onClick={() => onChange(EMPTY_FILTERS)}
              title="Limpar todos"
              className="text-dim hover:text-red-400 transition-colors p-1"
            >
              <RotateCcw size={14} />
            </button>
            <button onClick={onClose} className="text-dim hover:text-white transition-colors p-1">
              <X size={15} />
            </button>
          </div>
        </div>

        {/* Corpo scrollável */}
        <div className="flex-1 overflow-y-auto px-4 py-4 flex flex-col gap-4">

          <Section title="Status do pedido">
            <div className="flex flex-wrap gap-1.5">
              {Object.keys(STATUS_LABELS).map((s) => (
                <Chip key={s} active={filters.status.includes(s)} onClick={() => toggleIn("status", s)}>
                  {STATUS_LABELS[s]}
                </Chip>
              ))}
            </div>
          </Section>

          <Section title="Data da venda">
            <div className="flex flex-wrap gap-1.5">
              {[
                ["today", "Hoje"], ["yesterday", "Ontem"], ["7d", "7 dias"],
                ["30d", "30 dias"], ["month", "Este mês"], ["lastMonth", "Mês passado"],
              ].map(([k, l]) => (
                <Chip key={k} active={false} onClick={() => applyPreset(k)}>{l}</Chip>
              ))}
            </div>
            <div className="flex gap-2">
              <input type="date" value={filters.dateFrom} onChange={(e) => set({ dateFrom: e.target.value })} className={inputCls} />
              <input type="date" value={filters.dateTo}   onChange={(e) => set({ dateTo:   e.target.value })} className={inputCls} />
            </div>
          </Section>

          <Section title="Liberação do dinheiro">
            <select value={filters.released} onChange={(e) => set({ released: e.target.value })} className={selectCls}>
              <option value="">Todos</option>
              <option value="yes">Já liberado</option>
              <option value="no">A liberar</option>
            </select>
            <div className="flex gap-2">
              <input type="date" value={filters.releaseFrom} onChange={(e) => set({ releaseFrom: e.target.value })} className={inputCls} />
              <input type="date" value={filters.releaseTo}   onChange={(e) => set({ releaseTo:   e.target.value })} className={inputCls} />
            </div>
          </Section>

          <Section title="Receita (R$)">
            <div className="flex gap-2">
              <input type="number" placeholder="Mín." value={filters.amountMin} onChange={(e) => set({ amountMin: e.target.value })} className={inputCls} />
              <input type="number" placeholder="Máx." value={filters.amountMax} onChange={(e) => set({ amountMax: e.target.value })} className={inputCls} />
            </div>
          </Section>

          <Section title="Frete (R$)">
            <div className="flex gap-2">
              <input type="number" placeholder="Mín." value={filters.shippingMin} onChange={(e) => set({ shippingMin: e.target.value })} className={inputCls} />
              <input type="number" placeholder="Máx." value={filters.shippingMax} onChange={(e) => set({ shippingMax: e.target.value })} className={inputCls} />
            </div>
          </Section>

          <Section title="Canal e conta">
            <select value={filters.channelType} onChange={(e) => set({ channelType: e.target.value })} className={selectCls}>
              <option value="">Todos os canais</option>
              <option value="MERCADO_LIVRE">Mercado Livre</option>
              <option value="SHOPEE">Shopee</option>
            </select>
            <select value={filters.channelAccountId} onChange={(e) => set({ channelAccountId: e.target.value })} className={selectCls}>
              <option value="">Todas as contas</option>
              {opts.accounts.map((a) => <option key={a.id} value={a.id}>{a.label}</option>)}
            </select>
          </Section>

          <Section title="Produto">
            <input
              list="sku-options"
              placeholder="SKU"
              value={filters.sku}
              onChange={(e) => set({ sku: e.target.value })}
              className={inputCls}
            />
            <datalist id="sku-options">
              {opts.skus.map((s) => <option key={s} value={s} />)}
            </datalist>
            <select value={filters.itemCount} onChange={(e) => set({ itemCount: e.target.value })} className={selectCls}>
              <option value="">Qualquer quantidade</option>
              <option value="single">1 item</option>
              <option value="multi">2 ou mais itens</option>
            </select>
            <select value={filters.isPack} onChange={(e) => set({ isPack: e.target.value })} className={selectCls}>
              <option value="">Carrinho: todos</option>
              <option value="yes">Só pedidos de carrinho</option>
              <option value="no">Só pedidos avulsos</option>
            </select>
          </Section>

          <Section title="Envio">
            {opts.shipmentStatuses.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {opts.shipmentStatuses.map((s) => (
                  <Chip key={s} active={filters.shipmentStatus.includes(s)} onClick={() => toggleIn("shipmentStatus", s)}>
                    {SHIPMENT_LABELS[s] ?? s}
                  </Chip>
                ))}
              </div>
            )}
            <select value={filters.hasTracking} onChange={(e) => set({ hasTracking: e.target.value })} className={selectCls}>
              <option value="">Rastreio: todos</option>
              <option value="yes">Com rastreio</option>
              <option value="no">Sem rastreio</option>
            </select>
          </Section>

          <Section title="Comprador">
            <select value={filters.docType} onChange={(e) => set({ docType: e.target.value })} className={selectCls}>
              <option value="">PF e PJ</option>
              <option value="CPF">Pessoa Física</option>
              <option value="CNPJ">Pessoa Jurídica</option>
            </select>
            <input
              placeholder="Cidade"
              value={filters.city}
              onChange={(e) => set({ city: e.target.value })}
              className={inputCls}
            />
            {opts.states.length > 0 && (
              <div className="flex flex-wrap gap-1.5 max-h-32 overflow-y-auto">
                {opts.states.map((s) => (
                  <Chip key={s} active={filters.state.includes(s)} onClick={() => toggleIn("state", s)}>
                    {s}
                  </Chip>
                ))}
              </div>
            )}
          </Section>

        </div>
      </aside>
    </>
  );
}