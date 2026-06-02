import { Lock } from "lucide-react";
import { PlanSlug } from "@/lib/types";
import { PLAN_ICONS, PLAN_LABELS, PLAN_COLORS } from "@/lib/constants";

interface UpgradeGateProps {
  feature: string;
  requiredPlan: PlanSlug;
  benefits?: string[];
  children?: React.ReactNode;
  inline?: boolean;
}

export function UpgradeGate({ feature, requiredPlan, benefits = [], children, inline }: UpgradeGateProps) {
  const color = PLAN_COLORS[requiredPlan];

  if (inline) {
    return (
      <div className="flex items-center gap-2 text-dim text-xs">
        <Lock size={12} />
        <span>Disponível no plano</span>
        <span style={{ color, fontWeight: 700 }}>
          {PLAN_ICONS[requiredPlan]} {PLAN_LABELS[requiredPlan]}
        </span>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-[360px] p-8">
      <div className="bg-bg-3 border border-border rounded-2xl p-10 text-center max-w-md w-full animate-fade-up">
        <div
          className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-5"
          style={{ background: `${color}18`, border: `1px solid ${color}30` }}
        >
          <Lock size={28} style={{ color }} />
        </div>
        <h2 className="font-syne text-xl font-bold text-white mb-2">{feature}</h2>
        <p className="text-muted text-sm mb-2">
          Disponível a partir do plano{" "}
          <span style={{ color, fontWeight: 700 }}>
            {PLAN_ICONS[requiredPlan]} {PLAN_LABELS[requiredPlan]}
          </span>
        </p>
        {benefits.length > 0 && (
          <ul className="mt-4 mb-6 text-left space-y-2">
            {benefits.map((b) => (
              <li key={b} className="flex items-start gap-2 text-sm text-muted">
                <span className="text-brand mt-0.5">✓</span>
                <span>{b}</span>
              </li>
            ))}
          </ul>
        )}
        <button
          className="w-full py-3 rounded-lg font-bold text-sm text-black transition-opacity hover:opacity-90"
          style={{ background: `linear-gradient(135deg, ${color}, ${color}cc)` }}
        >
          {PLAN_ICONS[requiredPlan]} Fazer upgrade para {PLAN_LABELS[requiredPlan]}
        </button>
      </div>
      {children}
    </div>
  );
}
