import axios from "axios";

// All requests go through Next.js API routes (BFF layer)
const api = axios.create({
  baseURL: "/api",
  withCredentials: true,
  headers: { "Content-Type": "application/json" },
});

api.interceptors.response.use(
  (res) => res,
  (err) => {
    // Não redireciona automaticamente — deixa cada página tratar o 401
    return Promise.reject(err);
  }
);

export default api;

// ─── Auth ─────────────────────────────────────────────────────────────────────
export const authApi = {
  login: (email: string, password: string) =>
    api.post("/auth/login", { email, password }),
  logout: () => api.post("/auth/logout"),
  me: () => api.get("/auth/me"),
  changePassword: (currentPassword: string, newPassword: string) =>
    api.post("/auth/change-password", { currentPassword, newPassword }),
  mlUrl: () => api.get("/auth/ml-url"),
};

// ─── Dashboard ────────────────────────────────────────────────────────────────
export const dashboardApi = {
  stats: (params?: Record<string, string>) => api.get("/dashboard/stats", { params }),
  syncStatus: () => api.get("/sync/status"),
  sync: () => api.get("/orders/sync"),
};

// ─── Orders ──────────────────────────────────────────────────────────────────
export const ordersApi = {
  list: (params?: Record<string, string>) => api.get("/orders", { params }),
  profit: (params?: Record<string, string>) => api.get("/profit/orders", { params }),
};

// ─── Shipments ───────────────────────────────────────────────────────────────
export const shipmentsApi = {
  list: (params?: Record<string, string>) => api.get("/shipments", { params }),
};

// ─── Costs ───────────────────────────────────────────────────────────────────
export const costsApi = {
  list: () => api.get("/costs"),
  create: (data: { sku: string; name: string; cost: number; ean?: string; ncm?: string; cest?: string; codFabricante?: string; marca?: string }) =>
    api.post("/costs", data),
  bulkCreate: (products: any[]) => api.post("/costs/bulk", { products }),
  update: (sku: string, data: { name?: string; cost?: number; validFrom?: string; ean?: string; ncm?: string; cest?: string; codFabricante?: string; marca?: string }) =>
    api.put(`/costs/${encodeURIComponent(sku)}`, data),
  delete: (id: number) => api.delete(`/costs/${id}`),
};

export const taxRateApi = {
  get: () => api.get("/settings/tax-rate"),
  create: (data: { rate: number; validFrom?: string }) => api.post("/settings/tax-rate", data),
};

// ─── Employees ───────────────────────────────────────────────────────────────
export const employeesApi = {
  list: () => api.get("/employees"),
  create: (data: { name: string; email: string; password: string }) =>
    api.post("/employees", data),
  updatePermissions: (id: number, permissions: Record<string, boolean>) =>
    api.put(`/employees/${id}/permissions`, { permissions }),
  updateMlAccess: (id: number, tokenIds: number[]) =>
    api.put(`/employees/${id}/ml-access`, { tokenIds }),
  toggleActive: (id: number) => api.post(`/employees/${id}/toggle-active`),
  delete: (id: number) => api.delete(`/employees/${id}`),
};

// ─── ML ──────────────────────────────────────────────────────────────────────
export const mlApi = {
  status: () => api.get("/ml/status"),
  disconnect: (tokenId: number) => api.delete(`/ml/disconnect/${tokenId}`),
};

// ─── Subscription ─────────────────────────────────────────────────────────────
export const subscriptionApi = {
  get: () => api.get("/subscription"),
};

// ─── Export ──────────────────────────────────────────────────────────────────
export const exportApi = {
  orders: (params?: Record<string, string>) =>
    api.get("/export/orders", { params, responseType: "blob" }),
  profit: (params?: Record<string, string>) =>
    api.get("/export/profit", { params, responseType: "blob" }),
  costs: () => api.get("/export/costs", { responseType: "blob" }),
};

// ─── Admin ───────────────────────────────────────────────────────────────────
export const adminApi = {
  overview: () => api.get("/admin/overview"),
  clients: (params?: Record<string, string>) => api.get("/admin/clients", { params }),
  client: (id: number) => api.get(`/admin/clients/${id}`),
  createClient: (data: unknown) => api.post("/admin/clients", data),
  updateClient: (id: number, data: unknown) => api.put(`/admin/clients/${id}`, data),
  changePlan: (id: number, planId: number) => api.put(`/admin/clients/${id}/plan`, { planId }),
  toggleStatus: (id: number) => api.put(`/admin/clients/${id}/status`),
  resetPassword: (id: number) => api.post(`/admin/clients/${id}/reset-password`),
  cancelSubscription: (id: number, reason: string) =>
    api.delete(`/admin/clients/${id}/subscription`, { data: { reason } }),
  syncs: (id: number) => api.get(`/admin/clients/${id}/syncs`),
  employees: (clientId: number) => api.get(`/admin/clients/${clientId}/employees`),
  createEmployee: (clientId: number, data: unknown) =>
    api.post(`/admin/clients/${clientId}/employees`, data),
  updateEmployeePermissions: (clientId: number, employeeId: number, permissions: unknown) =>
    api.put(`/admin/clients/${clientId}/employees/${employeeId}/permissions`, { permissions }),
  subscriptions: () => api.get("/admin/subscriptions"),
  financial: () => api.get("/admin/financial"),
  monitoring: () => api.get("/admin/monitoring"),
  alerts: (params?: Record<string, string>) => api.get("/admin/alerts", { params }),
  resolveAlert: (id: number, note: string) =>
    api.put(`/admin/alerts/${id}/resolve`, { note }),
  plans: () => api.get("/admin/plans"),
  updatePlan: (id: number, data: unknown) => api.put(`/admin/plans/${id}`, data),
};
