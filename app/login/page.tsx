"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Zap, Eye, EyeOff, AlertTriangle } from "lucide-react";
import { authApi } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";

export default function LoginPage() {
  const router = useRouter();
  const { user, loading } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

useEffect(() => {
  if (!loading && user) {
    router.replace("/dashboard");
  }
}, [user, loading, router]);

const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  setError("");
  if (!email || !password) { setError("Preencha e-mail e senha"); return; }
  setSubmitting(true);
  try {
    const { data } = await authApi.login(email, password);
    const role = data?.user?.role;
    // Não chama setSubmitting(false) — deixa o spinner até o redirect
    if (role === "admin") {
      window.location.href = "/admin";
    } else {
      window.location.href = "/dashboard";
    }
  } catch (err: any) {
    setError(err?.response?.data?.message ?? "E-mail ou senha incorretos");
    setSubmitting(false);
  }
};

  if (loading) {
    return (
      <div className="min-h-screen bg-bg-0 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-brand border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-bg-0 flex items-center justify-center p-4">
      {/* Background glow */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-brand/5 rounded-full blur-[120px]" />
      </div>

      <div className="w-full max-w-sm animate-fade-up relative">
        {/* Logo */}
        <div className="flex flex-col items-center mb-8">
          <svg width="48" height="48" viewBox="0 0 48 48" className="mb-4">
            <defs>
              <linearGradient id="vendixGradLogin" x1="0%" y1="100%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#16a34a" />
                <stop offset="100%" stopColor="#4ade80" />
              </linearGradient>
            </defs>
            <rect x="6" y="29" width="6" height="11" rx="1.5" fill="url(#vendixGradLogin)" />
            <rect x="15" y="23" width="6" height="17" rx="1.5" fill="url(#vendixGradLogin)" />
            <rect x="24" y="15" width="6" height="25" rx="1.5" fill="url(#vendixGradLogin)" />
            <path d="M3 36 L36 12" stroke="url(#vendixGradLogin)" strokeWidth="2.6" fill="none" strokeLinecap="round" />
            <path d="M36 12 L28 15" stroke="url(#vendixGradLogin)" strokeWidth="2.6" fill="none" strokeLinecap="round" />
            <path d="M36 12 L33 22" stroke="url(#vendixGradLogin)" strokeWidth="2.6" fill="none" strokeLinecap="round" />
          </svg>
          <h1 className="font-syne text-2xl font-extrabold text-white">Vendix</h1>
          <p className="text-muted text-sm mt-1">Vendas de todos os canais, um painel</p>
        </div>
        {/* Card */}
        <div className="bg-bg-3 border border-border rounded-2xl p-8">
          <h2 className="font-syne text-lg font-bold text-white mb-6">Entrar na sua conta</h2>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-muted">E-mail</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="seu@email.com"
                autoComplete="email"
                className="w-full bg-bg-4 border border-border rounded-lg px-3 py-2.5 text-sm text-white placeholder:text-dim outline-none focus:border-brand/60 focus:ring-1 focus:ring-brand/20 transition-colors"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-muted">Senha</label>
              <div className="relative">
                <input
                  type={showPw ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  autoComplete="current-password"
                  className="w-full bg-bg-4 border border-border rounded-lg px-3 py-2.5 pr-10 text-sm text-white placeholder:text-dim outline-none focus:border-brand/60 focus:ring-1 focus:ring-brand/20 transition-colors"
                />
                <button
                  type="button"
                  onClick={() => setShowPw((p) => !p)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-dim hover:text-muted transition-colors"
                >
                  {showPw ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>

            {error && (
              <div className="flex items-center gap-2 bg-red-500/10 border border-red-500/30 rounded-lg px-3 py-2.5">
                <AlertTriangle size={13} className="text-red-400 flex-shrink-0" />
                <p className="text-xs text-red-400">{error}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={submitting}
              className="w-full py-3 rounded-xl bg-gradient-to-br from-brand to-brand-dim text-black font-bold text-sm transition-opacity hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed mt-2 flex items-center justify-center gap-2"
            >
              {submitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-black/40 border-t-black rounded-full animate-spin" />
                  Entrando...
                </>
              ) : "Entrar"}
            </button>
          </form>
        </div>

        <p className="text-center text-xs text-dim mt-6">
          Problemas de acesso? Fale com o administrador.
        </p>
      </div>
    </div>
  );
}
