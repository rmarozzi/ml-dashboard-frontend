"use client";

import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import { Sidebar } from "@/components/layout/Sidebar";
import { Topbar } from "@/components/layout/Topbar";
import { adminApi } from "@/lib/api";

const TITLES: Record<string, string> = {
  "/admin":                 "Visão Geral da Plataforma",
  "/admin/clients":         "Clientes",
  "/admin/clients/new":     "Novo Cliente",
  "/admin/subscriptions":   "Assinaturas",
  "/admin/financial":       "Financeiro",
  "/admin/monitoring":      "Monitoramento",
  "/admin/alerts":          "Central de Alertas",
};

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [criticalAlerts, setCriticalAlerts] = useState(0);
  const pathname = usePathname();
  const title = TITLES[pathname] ?? "Admin";

  useEffect(() => {
    adminApi.alerts({ severity: "critical", status: "open" })
      .then(({ data }) => setCriticalAlerts(data.alerts?.length ?? 0))
      .catch(() => {});
  }, [pathname]);

  return (
    <div className="flex h-screen overflow-hidden bg-bg-0">
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} criticalAlerts={criticalAlerts} />
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <Topbar title={title} onMenuClick={() => setSidebarOpen(true)} />
        <main className="flex-1 overflow-y-auto p-5 lg:p-7">
          <div className="max-w-[1300px] mx-auto animate-fade-up">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
