"use client";
import { useEffect, ReactNode } from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
  className?: string;
}

export function Modal({ open, onClose, title, children, className }: ModalProps) {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [onClose]);

  if (!open) return null;

  return (
    // items-[safe_center]: centraliza verticalmente quando há espaço,
    // mas se o conteúdo for maior que a tela, cai para o topo (com a
    // margem do padding) em vez de cortar o topo do modal.
    <div className="fixed inset-0 z-50 flex items-[safe_center] justify-center p-4 sm:p-6 overflow-y-auto">
      <div className="fixed inset-0 bg-black/80 backdrop-blur-sm" onClick={onClose} />

      <div className={cn(
        "relative bg-bg-3 border border-border rounded-2xl w-full max-h-[85vh] flex flex-col overflow-hidden animate-fade-up my-auto",
        className
      )}>
        {/* Header — sempre visível, nunca rola junto com o conteúdo */}
        {title && (
          <div className="flex items-center justify-between gap-3 px-7 py-5 border-b border-border/60 bg-bg-3 flex-shrink-0">
            <h2 className="font-syne text-lg font-bold text-white truncate">{title}</h2>
            <button onClick={onClose} className="text-muted hover:text-white transition-colors flex-shrink-0">
              <X size={18} />
            </button>
          </div>
        )}

        {/* Corpo rolável */}
        <div className="overflow-y-auto px-7 py-6 flex-1 min-h-0">
          {children}
        </div>
      </div>
    </div>
  );
}