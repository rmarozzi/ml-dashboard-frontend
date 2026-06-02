"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import { Sidebar } from "@/components/layout/Sidebar";
import { Topbar } from "@/components/layout/Topbar";

const TITLES: Record<string, string> = {
  "/dashboard":            "Visão Geral",
  "/dashboard/orders":     "Pedidos",
  "/dashboard/shipments":  "Envios",
  "/dashboard/analytics":  "Analytics",
  "/dashboard/costs":      "Preços de Custo",
  "/dashboard/employees":  "Funcionários",
  "/dashboard/profile":    "Perfil & Contas ML",
  "/dashboard/settings":   "Configurações",
  "/dashboard/sync-debug": "Debug de Sync",
  "/dashboard/connect":    "Conectar Mercado Livre",
};

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const pathname = usePathname();
  const title = TITLES[pathname] ?? "Dashboard";

  return (
    <div className="flex h-screen overflow-hidden bg-bg-0">
      <Sidebar
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <Topbar
          title={title}
          onMenuClick={() => setSidebarOpen(true)}
        />
        <main className="flex-1 overflow-y-auto p-5 lg:p-7">
          <div className="max-w-[1200px] mx-auto animate-fade-up">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
