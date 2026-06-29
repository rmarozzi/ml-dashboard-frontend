"use client";

import { useEffect } from "react";
import { useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Sidebar } from "@/components/layout/Sidebar";
import { Topbar } from "@/components/layout/Topbar";
import { useAuth } from "@/contexts/AuthContext";

const TITLES: Record<string, string> = {
  "/dashboard":            "Visão Geral",
  "/dashboard/orders":     "Pedidos",
  "/dashboard/shipments":  "Envios",
  "/dashboard/analytics":  "Analytics",
  "/dashboard/costs":      "Cadastro de Produtos",
  "/dashboard/employees":  "Funcionários",
  "/dashboard/profile":    "Perfil & Contas ML",
  "/dashboard/settings":   "Configurações",
  "/dashboard/sync-debug": "Debug de Sync",
  "/dashboard/connect":    "Conectar Mercado Livre",
};

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const { user, loading } = useAuth();
  const title = TITLES[pathname] ?? "Dashboard";

  useEffect(() => {
    if (!loading && !user) {
      router.replace("/login");
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-bg-0">
        <div className="w-8 h-8 border-2 border-brand border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="flex h-screen overflow-hidden bg-bg-0">
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <Topbar title={title} onMenuClick={() => setSidebarOpen(true)} />
        <main className="flex-1 overflow-y-auto p-5 lg:p-7">
          <div className="max-w-[1200px] mx-auto animate-fade-up">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}