import { cn } from "@/lib/utils";

interface BadgeProps {
  variant?: "paid" | "shipped" | "cancelled" | "pending" | "active" | "past_due" | "trial" | "success" | "failed" | "partial" | "default";
  children: React.ReactNode;
  className?: string;
}

const VARIANTS: Record<string, string> = {
  paid:      "bg-green-500/10 text-green-400 border border-green-500/30",
  active:    "bg-green-500/10 text-green-400 border border-green-500/30",
  success:   "bg-green-500/10 text-green-400 border border-green-500/30",
  shipped:   "bg-blue-500/10 text-blue-400 border border-blue-500/30",
  cancelled: "bg-red-500/10 text-red-400 border border-red-500/30",
  failed:    "bg-red-500/10 text-red-400 border border-red-500/30",
  pending:   "bg-yellow-500/10 text-yellow-400 border border-yellow-500/30",
  past_due:  "bg-yellow-500/10 text-yellow-400 border border-yellow-500/30",
  partial:   "bg-yellow-500/10 text-yellow-400 border border-yellow-500/30",
  trial:     "bg-purple-500/10 text-purple-400 border border-purple-500/30",
  default:   "bg-white/5 text-[#8888a8] border border-[#2a2a38]",
};

const LABELS: Record<string, string> = {
  paid: "Pago", active: "Ativo", success: "Sucesso",
  shipped: "Enviado", cancelled: "Cancelado", failed: "Falhou",
  pending: "Pendente", past_due: "Inadimplente", partial: "Parcial",
  trial: "Trial",
};

export function Badge({ variant = "default", children, className }: BadgeProps) {
  return (
    <span className={cn(
      "inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold font-mono tracking-wide",
      VARIANTS[variant] ?? VARIANTS.default,
      className
    )}>
      {children}
    </span>
  );
}

export function StatusBadge({ status }: { status: string }) {
  const variant = status as BadgeProps["variant"];
  const label = LABELS[status] ?? status;
  return <Badge variant={variant}>{label}</Badge>;
}
