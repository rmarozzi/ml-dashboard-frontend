"use client";

import { useState, useEffect } from "react";
import { Menu, RefreshCw, Bell, Clock, Sun, Moon } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { usePermissions } from "@/contexts/PermissionsContext";
import { useTheme } from "@/contexts/ThemeContext";
import { dashboardApi } from "@/lib/api";
import { timeAgo } from "@/lib/utils";
import { cn } from "@/lib/utils";

interface TopbarProps {
  title: string;
  onMenuClick: () => void;
}

export function Topbar({ title, onMenuClick }: TopbarProps) {
  const { user } = useAuth();
  const { can, isFuncionario } = usePermissions();
  const { theme, toggleTheme } = useTheme();
  const [syncing, setSyncing] = useState(false);
  const [lastSync, setLastSync] = useState<string | null>(null);

  const isAdmin = user?.role === "admin";
  const canSync = !isFuncionario || can("sync_ml");

  useEffect(() => {
    if (isAdmin) return;
    dashboardApi.syncStatus()
      .then(({ data }) => setLastSync(data.lastSyncAt))
      .catch(() => {});

    const interval = setInterval(() => {
      dashboardApi.syncStatus()
        .then(({ data }) => setLastSync(data.lastSyncAt))
        .catch(() => {});
    }, 60_000);
    return () => clearInterval(interval);
  }, [isAdmin]);

  const handleSync = async () => {
    setSyncing(true);
    try {
      await dashboardApi.sync();
      const { data } = await dashboardApi.syncStatus();
      setLastSync(data.lastSyncAt);
    } catch {}
    finally { setSyncing(false); }
  };

  return (
    <header className="h-14 bg-bg-2 border-b border-border flex items-center gap-3 px-4 flex-shrink-0">
      <button
        onClick={onMenuClick}
        className="text-muted hover:text-white transition-colors p-1 lg:hidden"
      >
        <Menu size={18} />
      </button>

      <h1 className="font-syne text-[15px] font-bold text-white flex-1 truncate">{title}</h1>

      {/* Last sync timer */}
      {!isAdmin && lastSync && (
        <div className="hidden sm:flex items-center gap-1.5 text-[11px] text-dim">
          <Clock size={11} />
          <span>Sync: {timeAgo(lastSync)}</span>
        </div>
      )}

      {/* Sync button */}
      {!isAdmin && canSync && (
        <button
          onClick={handleSync}
          disabled={syncing}
          className={cn(
            "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all",
            syncing
              ? "bg-bg-4 border border-border text-dim cursor-not-allowed"
              : "bg-brand/10 border border-brand/40 text-brand hover:bg-brand/20"
          )}
        >
          <RefreshCw size={12} className={syncing ? "animate-spin" : ""} />
          <span className="hidden sm:inline">{syncing ? "Sincronizando..." : "Sincronizar ML"}</span>
        </button>
      )}

      {/* Theme toggle */}
      <button
        onClick={toggleTheme}
        className="text-muted hover:text-white transition-colors p-1.5 rounded-lg hover:bg-bg-4"
        title={theme === "dark" ? "Mudar para modo claro" : "Mudar para modo escuro"}
      >
        {theme === "dark" ? <Sun size={16} /> : <Moon size={16} />}
      </button>

      <button className="relative text-muted hover:text-white transition-colors p-1">
        <Bell size={17} />
        <span className="absolute top-0 right-0 w-2 h-2 bg-red-500 rounded-full" />
      </button>
    </header>
  );
}