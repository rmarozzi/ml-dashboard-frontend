import { cn } from "@/lib/utils";
import { ButtonHTMLAttributes, ReactNode } from "react";
import { Loader2 } from "lucide-react";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "ghost" | "danger";
  size?: "sm" | "md" | "lg";
  loading?: boolean;
  children: ReactNode;
}

const VARIANTS = {
  primary:   "bg-gradient-to-br from-brand to-brand-dim text-black font-bold hover:opacity-90",
  secondary: "bg-bg-4 border border-border text-muted hover:text-white hover:border-border-light",
  ghost:     "bg-transparent text-muted hover:text-white hover:bg-bg-4",
  danger:    "bg-red-500/10 border border-red-500/30 text-red-400 hover:bg-red-500/20",
};

const SIZES = {
  sm: "px-3 py-1.5 text-xs rounded-md",
  md: "px-4 py-2.5 text-sm rounded-lg",
  lg: "px-6 py-3 text-sm rounded-xl",
};

export function Button({
  variant = "secondary", size = "md", loading, children, className, disabled, ...props
}: ButtonProps) {
  return (
    <button
      className={cn(
        "inline-flex items-center justify-center gap-2 font-medium transition-all focus:outline-none",
        "disabled:opacity-50 disabled:cursor-not-allowed",
        VARIANTS[variant],
        SIZES[size],
        className
      )}
      disabled={disabled || loading}
      {...props}
    >
      {loading && <Loader2 size={14} className="animate-spin" />}
      {children}
    </button>
  );
}
