"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard, ShoppingCart, Truck, BarChart2, DollarSign,
  Users, Settings, User, Bell, LogOut, Zap, Lock,
  CreditCard, Activity, RefreshCw,Edit,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { usePlan } from "@/contexts/PlanContext";
import { usePermissions } from "@/contexts/PermissionsContext";
import { PlanSlug } from "@/lib/types";
import { PLAN_ICONS, PLAN_LABELS, PLAN_RANK } from "@/lib/constants";
import { cn } from "@/lib/utils";

interface NavItem {
  href: string;
  label: string;
  icon: React.ElementType;
  requiredPlan?: PlanSlug;
  permission?: string;
  adminOnly?: boolean;
}

const CLIENT_NAV: NavItem[] = [
  { href: "/dashboard",           label: "Visão Geral",     icon: LayoutDashboard },
  { href: "/dashboard/orders",    label: "Pedidos",         icon: ShoppingCart,  permission: "view_orders" },
  { href: "/dashboard/shipments", label: "Envios",          icon: Truck,         permission: "view_shipments" },
  { href: "/dashboard/costs",     label: "Cadastro de Produtos", icon: DollarSign,    requiredPlan: "prata" },
  { href: "/dashboard/edit-products", label: "Alterar Produtos", icon: Edit,    requiredPlan: "prata" },
  { href: "/dashboard/employees", label: "Funcionários",    icon: Users,         requiredPlan: "prata" },
  { href: "/dashboard/profile",   label: "Perfil & ML",     icon: User },
  { href: "/dashboard/settings",  label: "Configurações",   icon: Settings },
];

const ADMIN_NAV: NavItem[] = [
  { href: "/admin",                  label: "Visão Geral",   icon: LayoutDashboard },
  { href: "/admin/clients",          label: "Clientes",      icon: Users },
  { href: "/admin/subscriptions",    label: "Assinaturas",   icon: CreditCard },
  { href: "/admin/financial",        label: "Financeiro",    icon: DollarSign },
  { href: "/admin/monitoring",       label: "Monitoramento", icon: Activity },
  { href: "/admin/alerts",           label: "Alertas",       icon: Bell },
];

interface SidebarProps {
  open: boolean;
  onClose: () => void;
  criticalAlerts?: number;
}

export function Sidebar({ open, onClose, criticalAlerts = 0 }: SidebarProps) {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const { slug: planSlug, hasPlan } = usePlan();
  const { can, isFuncionario } = usePermissions();

  const isAdmin = user?.role === "admin";
  const navItems = isAdmin ? ADMIN_NAV : CLIENT_NAV;

  const isVisible = (item: NavItem): boolean => {
    if (isAdmin) return true;
    // hide if permission-gated and employee doesn't have it
    if (item.permission && isFuncionario && !can(item.permission as keyof typeof can)) return false;
    return true;
  };

  const isLocked = (item: NavItem): boolean => {
    if (isAdmin || !item.requiredPlan) return false;
    return !hasPlan(item.requiredPlan);
  };

  return (
    <>
      {/* Overlay on mobile */}
      {open && (
        <div
          className="fixed inset-0 bg-black/60 z-40 lg:hidden"
          onClick={onClose}
        />
      )}

      <aside
        className={cn(
          "fixed top-0 left-0 h-full z-50 flex flex-col",
          "w-[220px] border-r border-border transition-transform duration-250",
          isAdmin ? "bg-bg-1" : "bg-bg-2",
          open ? "translate-x-0" : "-translate-x-full",
          "lg:translate-x-0 lg:static lg:z-auto"
        )}
      >
        {/* Logo */}
        <div className="flex items-center gap-3 px-4 py-5 border-b border-border flex-shrink-0">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-brand to-brand-dim flex items-center justify-center flex-shrink-0">
            <Zap size={15} className="text-black" />
          </div>
          <div>
            <div className="font-syne text-[15px] font-extrabold text-white leading-none">
              ML Dash
            </div>
            {isAdmin && (
              <div className="text-[9px] font-bold text-red-400 tracking-widest uppercase mt-0.5">
                Admin
              </div>
            )}
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 py-2 px-2 overflow-y-auto">
          {navItems.filter(isVisible).map((item) => {
            const active = pathname === item.href || (item.href !== "/dashboard" && item.href !== "/admin" && pathname.startsWith(item.href));
            const locked = isLocked(item);
            const Icon = item.icon;

            return (
              <Link
                key={item.href}
                href={locked ? "#" : item.href}
                onClick={() => { if (!locked) onClose(); }}
                className={cn(
                  "flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-[13px] mb-0.5 transition-colors",
                  active
                    ? "bg-brand/15 text-brand font-semibold"
                    : locked
                    ? "text-dim cursor-default"
                    : "text-muted hover:bg-bg-4 hover:text-white"
                )}
              >
                <Icon size={15} className="flex-shrink-0" />
                <span className="flex-1 truncate">{item.label}</span>
                {locked && <Lock size={11} className="text-dim flex-shrink-0" />}
                {item.href === "/admin/alerts" && criticalAlerts > 0 && (
                  <span className="bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                    {criticalAlerts}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        {/* User */}
        <div className="px-3 py-3 border-t border-border flex-shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-full bg-gradient-to-br from-brand/30 to-blue-500/30 flex items-center justify-center flex-shrink-0">
              <span className="text-[11px] font-bold text-brand">
                {(user?.name ?? user?.email ?? "?")[0].toUpperCase()}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-xs font-semibold text-white truncate">
                {user?.name ?? user?.email}
              </div>
              <div className="text-[10px] text-dim capitalize">{user?.role}</div>
            </div>
            <button onClick={logout} className="text-dim hover:text-white transition-colors p-1">
              <LogOut size={13} />
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}
