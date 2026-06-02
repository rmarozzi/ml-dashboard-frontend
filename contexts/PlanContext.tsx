"use client";

import { createContext, useContext, useMemo, ReactNode } from "react";
import { Plan, PlanSlug } from "@/lib/types";
import { PLAN_RANK } from "@/lib/constants";
import { useAuth } from "./AuthContext";

interface PlanContextValue {
  plan: Plan | null;
  slug: PlanSlug | null;
  hasPlan: (required: PlanSlug) => boolean;
  hasFeature: (feature: keyof Plan) => boolean;
  isActive: boolean;
}

const PlanContext = createContext<PlanContextValue | null>(null);

export function PlanProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();

  const value = useMemo<PlanContextValue>(() => {
    const plan = user?.subscription?.plan ?? null;
    const slug = (plan?.slug ?? null) as PlanSlug | null;
    const isActive = user?.subscription?.status === "active" || user?.subscription?.status === "trial";

    return {
      plan,
      slug,
      isActive,
      hasPlan: (required: PlanSlug) => {
        if (user?.role === "admin") return true;
        if (!slug || !isActive) return false;
        return PLAN_RANK[slug] >= PLAN_RANK[required];
      },
      hasFeature: (feature: keyof Plan) => {
        if (user?.role === "admin") return true;
        if (!plan || !isActive) return false;
        return !!plan[feature];
      },
    };
  }, [user]);

  return <PlanContext.Provider value={value}>{children}</PlanContext.Provider>;
}

export function usePlan() {
  const ctx = useContext(PlanContext);
  if (!ctx) throw new Error("usePlan must be used inside PlanProvider");
  return ctx;
}
