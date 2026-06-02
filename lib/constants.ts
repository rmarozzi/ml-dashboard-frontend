import { PlanSlug } from "./types";

export const PLAN_RANK: Record<PlanSlug, number> = {
  bronze: 0,
  prata: 1,
  ouro: 2,
  premium: 3,
};

export const PLAN_LABELS: Record<PlanSlug, string> = {
  bronze: "Bronze",
  prata: "Prata",
  ouro: "Ouro",
  premium: "Premium",
};

export const PLAN_ICONS: Record<PlanSlug, string> = {
  bronze: "🥉",
  prata: "🥈",
  ouro: "🥇",
  premium: "💎",
};

export const PLAN_COLORS: Record<PlanSlug, string> = {
  bronze: "#cd7f32",
  prata: "#9ca3af",
  ouro: "#eab308",
  premium: "#22c55e",
};

export const PERMISSION_LABELS: Record<string, { label: string; desc: string; dep?: string }> = {
  view_orders:    { label: "Ver Pedidos",       desc: "Listagem, busca, filtros e expansão" },
  view_profit:    { label: "Ver Lucro",         desc: "Lucro, margem e breakdown financeiro", dep: "view_orders" },
  view_shipments: { label: "Ver Envios",        desc: "Listagem de envios com status e custo" },
  view_analytics: { label: "Analytics",         desc: "Página completa com todos os gráficos" },
  manage_costs:   { label: "Cadastrar Custos",  desc: "Criar, editar e excluir custos por SKU" },
  export_data:    { label: "Exportar Dados",    desc: "CSV/Excel/PDF de pedidos, lucro e custos" },
  sync_ml:        { label: "Sincronizar ML",    desc: "Botão de sync manual na sidebar" },
};

export const ORDER_STATUS_LABEL: Record<string, string> = {
  paid: "Pago",
  pending: "Pendente",
  cancelled: "Cancelado",
  shipped: "Enviado",
};

export const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:3001";
