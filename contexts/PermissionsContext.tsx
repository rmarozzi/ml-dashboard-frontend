"use client";

import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { EmployeePermissions } from "@/lib/types";
import { useAuth } from "./AuthContext";
import api from "@/lib/api";

interface PermissionsContextValue {
  permissions: EmployeePermissions | null;
  mlAccountIds: number[];
  can: (perm: keyof EmployeePermissions) => boolean;
  isAdmin: boolean;
  isLider: boolean;
  isFuncionario: boolean;
  loading: boolean;
}

const PermissionsContext = createContext<PermissionsContextValue | null>(null);

const ALL_TRUE: EmployeePermissions = {
  view_orders: true,
  view_profit: true,
  view_shipments: true,
  view_analytics: true,
  manage_costs: true,
  export_data: true,
  sync_ml: true,
};

export function PermissionsProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [permissions, setPermissions] = useState<EmployeePermissions | null>(null);
  const [mlAccountIds, setMlAccountIds] = useState<number[]>([]);
  const [loading, setLoading] = useState(false);

  const isAdmin = user?.role === "admin";
  const isLider = user?.role === "lider";
  const isFuncionario = user?.role === "funcionario";

  useEffect(() => {
    if (!user) return;
    if (isAdmin || isLider) {
      setPermissions(ALL_TRUE);
      return;
    }
    // funcionario: fetch granular permissions
    setLoading(true);
    api
      .get("/employees/me/permissions")
      .then(({ data }) => {
        setPermissions(data.permissions);
        setMlAccountIds(data.mlAccountIds ?? []);
      })
      .catch(() => setPermissions(ALL_TRUE))
      .finally(() => setLoading(false));
  }, [user, isAdmin, isLider]);

  const can = (perm: keyof EmployeePermissions): boolean => {
    if (isAdmin || isLider) return true;
    if (!permissions) return false;
    return permissions[perm];
  };

  return (
    <PermissionsContext.Provider
      value={{ permissions, mlAccountIds, can, isAdmin, isLider, isFuncionario, loading }}
    >
      {children}
    </PermissionsContext.Provider>
  );
}

export function usePermissions() {
  const ctx = useContext(PermissionsContext);
  if (!ctx) throw new Error("usePermissions must be used inside PermissionsProvider");
  return ctx;
}
