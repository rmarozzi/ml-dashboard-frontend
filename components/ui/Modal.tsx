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
    // Sem overflow-y-auto aqui — esse container NUNCA rola.
    // p-4 (1rem) de cada lado + max-h-[calc(100vh-2rem)] na caixa abaixo
    // garantem matematicamente que a caixa sempre cabe, centralizada,
    // sem nunca precisar de scroll na página.
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-black/80 backdrop-blur-sm" onClick={onClose} />

      <div
        className={cn(
          "relative z-10 bg-bg-3 border border-border rounded-2xl w-full max-h-[calc(100vh-2rem)] flex flex-col overflow-hidden animate-fade-up shadow-2xl",
          className
        )}
      >
        {/* Header — fixo, nunca rola */}
        {title && (
          <div className="flex items-center justify-between gap-3 px-7 py-5 border-b border-border/60 bg-bg-3 flex-shrink-0">
            <h2 className="font-syne text-lg font-bold text-white truncate">{title}</h2>
            <button onClick={onClose} className="text-muted hover:text-white transition-colors flex-shrink-0">
              <X size={18} />
            </button>
          </div>
        )}

        {/* Corpo — só este rola, e só se o conteúdo for maior que a tela */}
        <div className="overflow-y-auto px-7 py-6 flex-1 min-h-0">
          {children}
        </div>
      </div>
    </div>
  );
}