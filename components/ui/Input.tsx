import { cn } from "@/lib/utils";
import { forwardRef, InputHTMLAttributes } from "react";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, className, ...props }, ref) => (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label className="text-xs font-medium text-muted">{label}</label>
      )}
      <input
        ref={ref}
        className={cn(
          "w-full bg-bg-4 border border-border rounded-lg px-3 py-2.5 text-[13px] text-white",
          "placeholder:text-dim outline-none transition-colors",
          "focus:border-brand/60 focus:ring-1 focus:ring-brand/20",
          error && "border-red-500/60",
          className
        )}
        {...props}
      />
      {error && <p className="text-xs text-red-400">{error}</p>}
    </div>
  )
);
Input.displayName = "Input";

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  children: React.ReactNode;
}

export function Select({ label, children, className, ...props }: SelectProps) {
  return (
    <div className="flex flex-col gap-1.5">
      {label && <label className="text-xs font-medium text-muted">{label}</label>}
      <select
        className={cn(
          "w-full bg-bg-4 border border-border rounded-lg px-3 py-2.5 text-[13px] text-white outline-none",
          "focus:border-brand/60 cursor-pointer",
          className
        )}
        {...props}
      >
        {children}
      </select>
    </div>
  );
}
