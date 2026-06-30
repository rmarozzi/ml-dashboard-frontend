// ─── User & Auth ─────────────────────────────────────────────────────────────
export type Role = "admin" | "lider" | "funcionario";
export type PlanSlug = "bronze" | "prata" | "ouro" | "premium";

export interface User {
  id: number;
  email: string;
  name: string | null;
  role: Role;
  liderId: number | null;
  active: boolean;
  lastLoginAt: string | null;
  lastSyncAt: string | null;
  subscription?: Subscription | null;
}

// ─── Plan ────────────────────────────────────────────────────────────────────
export interface Plan {
  id: number;
  nome: string;
  slug: PlanSlug;
  preco: number;
  maxMlAccounts: number;
  maxFuncionarios: number;
  maxSyncOrders: number;
  autoSync: boolean;
  granularPermissions: boolean;
  mlAccessControl: boolean;
  canExport: boolean;
  canViewAnalytics: boolean;
  canViewProfit: boolean;
  canManageCosts: boolean;
  canDebugSync: boolean;
  supportSla: boolean;
  active: boolean;
}

export interface Subscription {
  id: number;
  planId: number;
  plan: Plan;
  status: "active" | "cancelled" | "past_due" | "trial";
  currentPeriodStart: string;
  currentPeriodEnd: string;
  cancelledAt: string | null;
}

// ─── ML Token ────────────────────────────────────────────────────────────────
export interface MlToken {
  id: number;
  apelido: string | null;
  mlUserId: string | null;
  mlNickname: string | null;
  expiresAt: string;
  isExpired: boolean;
  isExpiringSoon: boolean;
}

// ─── Orders ──────────────────────────────────────────────────────────────────
export type OrderStatus = "paid" | "pending" | "cancelled" | "shipped";

export interface Order {
  id: number;
  mlId: string;
  packId: string | null;
  buyerName: string | null;
  buyerDocType: string | null;
  buyerDocNumber: string | null;
  buyerCity: string | null;
  buyerState: string | null;
  status: OrderStatus;
  totalAmount: number;
  netReceived: number | null;
  dateCreated: string;
  tokenId: number;
  token?: { apelido: string | null; mlNickname: string | null };
  items?: OrderItem[];
  payments?: Payment[];
  profit?: number | null;
  margin?: number | null;
}

export interface OrderItem {
  id: number;
  title: string;
  quantity: number;
  unitPrice: number;
  sku: string | null;
}

export interface Payment {
  id: number;
  mlPaymentId: string | null;
  status: string;
  totalPaidAmount: number;
  taxesAmount: number;
  operationType: string;
  paymentMethodId: string | null;
  moneyReleaseDate: string | null;
}

// ─── Employees ───────────────────────────────────────────────────────────────
export interface EmployeePermissions {
  view_orders: boolean;
  view_profit: boolean;
  view_shipments: boolean;
  view_analytics: boolean;
  manage_costs: boolean;
  export_data: boolean;
  sync_ml: boolean;
}

export interface Employee {
  id: number;
  name: string | null;
  email: string;
  active: boolean;
  lastLoginAt: string | null;
  employeePermission: EmployeePermissions | null;
  mlAccessCount: number;
  totalMlAccounts: number;
}

// ─── Dashboard Stats ─────────────────────────────────────────────────────────
export interface DashboardStats {
  totalRevenue: number;
  totalOrders: number;
  avgTicket: number;
  totalProfit: number | null;
  monthlyData: MonthlyPoint[];
  recentOrders: Order[];
  statusBreakdown: { status: string; count: number }[];
}

export interface MonthlyPoint {
  mes: string;
  receita: number;
  lucro: number | null;
}

// ─── Analytics ───────────────────────────────────────────────────────────────
export interface AnalyticsData {
  revenue: number;
  cost: number;
  profit: number;
  margin: number;
  orders: number;
  avgTicket: number;
  byPeriod: PeriodPoint[];
  paymentMethods: { name: string; value: number }[];
}

export interface PeriodPoint {
  label: string;
  receita: number;
  custo: number;
  lucro: number;
}

// ─── Shipment ────────────────────────────────────────────────────────────────
export interface Shipment {
  id: number;
  mlShipmentId: string;
  status: string;
  trackingNumber: string | null;
  cost: number | null;
  dateCreated: string;
  token?: { apelido: string | null; mlNickname?: string | null };
}

// ─── Product Cost ─────────────────────────────────────────────────────────────
export interface ProductCost {
  id: number;
  sku: string;
  name: string;
  cost: number;
  taxRate: number;
  validFrom: string;
  ean: string | null;
  ncm: string | null;
  cest: string | null;
  codFabricante: string | null;
  marca: string | null;
  history?: ProductCost[];
}

// ─── Admin ────────────────────────────────────────────────────────────────────
export interface AdminClient {
  id: number;
  name: string | null;
  email: string;
  active: boolean;
  createdAt: string;
  lastLoginAt: string | null;
  lastSyncAt: string | null;
  subscription: Subscription | null;
  _count: { orders: number; tokens: number; funcionarios: number };
  openAlerts: number;
}

export interface AdminAlert {
  id: number;
  type: string;
  severity: "critical" | "warning" | "info";
  description: string;
  status: "open" | "resolved";
  createdAt: string;
  resolvedAt: string | null;
  resolvedNote: string | null;
  client: { id: number; name: string | null; email: string };
  token: { apelido: string | null } | null;
}

export interface AdminOverview {
  mrr: number;
  mrrGrowth: number;
  activeClients: number;
  newClients30d: number;
  churn30d: number;
  churnRate: number;
  arr: number;
  avgTicket: number;
  mrrHistory: { mes: string; mrr: number }[];
  planDistribution: { name: string; value: number; slug: PlanSlug }[];
  systemHealth: {
    syncs24h: number;
    syncFails24h: number;
    expiredTokens: number;
    pastDueClients: number;
    openAlerts: number;
    criticalAlerts: number;
  };
}

export interface SyncLog {
  id: number;
  status: "success" | "failed" | "partial";
  ordersNew: number;
  ordersUpdated: number;
  errorMessage: string | null;
  durationMs: number;
  createdAt: string;
  token: { apelido: string | null; mlNickname: string | null };
}
export interface TaxSetting {
  id: number;
  rate: number;
  validFrom: string;
  createdAt: string;
}