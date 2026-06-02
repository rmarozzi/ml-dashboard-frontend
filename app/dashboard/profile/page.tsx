"use client";

import { useEffect, useState } from "react";
import { Plus, Trash2, RefreshCw, AlertTriangle, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { StatusBadge } from "@/components/ui/Badge";
import { PlanBadge } from "@/components/ui/PlanBadge";
import { authApi, mlApi, subscriptionApi } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import { usePlan } from "@/contexts/PlanContext";
import { formatDate, formatCurrency } from "@/lib/utils";
import { MlToken, Subscription } from "@/lib/types";

export default function ProfilePage() {
  const { user, refresh } = useAuth();
  const { slug: planSlug } = usePlan();
  const [tokens, setTokens] = useState<MlToken[]>([]);
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [loading, setLoading] = useState(true);
  const [pwForm, setPwForm] = useState({ current: "", next: "", confirm: "" });
  const [pwError, setPwError] = useState("");
  const [pwSuccess, setPwSuccess] = useState(false);
  const [savingPw, setSavingPw] = useState(false);

  useEffect(() => {
    Promise.all([mlApi.status(), subscriptionApi.get()])
      .then(([mlRes, subRes]) => {
        setTokens(mlRes.data.tokens ?? []);
        setSubscription(subRes.data.subscription);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const handleDisconnect = async (tokenId: number) => {
    if (!confirm("Desconectar esta conta do Mercado Livre?")) return;
    await mlApi.disconnect(tokenId).catch(() => {});
    setTokens((p) => p.filter((t) => t.id !== tokenId));
  };

  const handleConnectML = async () => {
    const { data } = await authApi.mlUrl();
    window.location.href = data.url;
  };

  const handleChangePassword = async () => {
    setPwError("");
    if (pwForm.next !== pwForm.confirm) { setPwError("As senhas não coincidem"); return; }
    if (pwForm.next.length < 6) { setPwError("Mínimo 6 caracteres"); return; }
    setSavingPw(true);
    try {
      await authApi.changePassword(pwForm.current, pwForm.next);
      setPwSuccess(true);
      setPwForm({ current: "", next: "", confirm: "" });
      setTimeout(() => setPwSuccess(false), 3000);
    } catch (err: any) {
      setPwError(err?.response?.data?.message ?? "Senha atual incorreta");
    } finally { setSavingPw(false); }
  };

  return (
    <div className="flex flex-col gap-5 max-w-2xl">
      {/* Account info */}
      <div className="bg-bg-3 border border-border rounded-xl p-6">
        <h2 className="font-syne text-[15px] font-bold text-white mb-5">Dados da Conta</h2>
        <div className="flex items-center gap-4 mb-5">
          <div className="w-14 h-14 rounded-full bg-gradient-to-br from-brand/30 to-blue-500/30 flex items-center justify-center flex-shrink-0">
            <span className="font-syne text-xl font-bold text-brand">
              {(user?.name ?? user?.email ?? "?")[0].toUpperCase()}
            </span>
          </div>
          <div>
            <p className="text-lg font-bold text-white">{user?.name ?? "—"}</p>
            <p className="text-sm text-muted">{user?.email}</p>
            <p className="text-xs text-dim capitalize mt-0.5">{user?.role}</p>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4 text-sm border-t border-border pt-4">
          <div><p className="text-dim text-xs mb-1">ID</p><p className="font-mono text-white">#{user?.id}</p></div>
          <div><p className="text-dim text-xs mb-1">Último acesso</p><p className="text-muted">{user?.lastLoginAt ? formatDate(user.lastLoginAt) : "—"}</p></div>
          <div><p className="text-dim text-xs mb-1">Última sync</p><p className="text-muted">{user?.lastSyncAt ? formatDate(user.lastSyncAt) : "Nunca"}</p></div>
        </div>
      </div>

      {/* ML Accounts */}
      <div className="bg-bg-3 border border-border rounded-xl p-6">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h2 className="font-syne text-[15px] font-bold text-white">Contas Mercado Livre</h2>
            <p className="text-xs text-dim mt-0.5">{tokens.length} conta{tokens.length !== 1 ? "s" : ""} conectada{tokens.length !== 1 ? "s" : ""}</p>
          </div>
          <Button variant="secondary" size="sm" onClick={handleConnectML}>
            <Plus size={13} /> Conectar conta
          </Button>
        </div>
        {loading ? (
          <div className="space-y-2">{Array.from({ length: 2 }).map((_, i) => <div key={i} className="skeleton h-16 rounded-lg" />)}</div>
        ) : tokens.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-muted text-sm mb-3">Nenhuma conta conectada</p>
            <Button variant="primary" size="sm" onClick={handleConnectML}><Plus size={13} /> Conectar Mercado Livre</Button>
          </div>
        ) : tokens.map((t) => (
          <div key={t.id} className="flex items-center gap-3 border border-border rounded-lg px-4 py-3 mb-2">
            <div className={`w-2 h-2 rounded-full flex-shrink-0 ${t.isExpired ? "bg-red-500" : t.isExpiringSoon ? "bg-yellow-500" : "bg-brand"}`} />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-white">{t.apelido ?? t.mlNickname ?? `Conta #${t.id}`}</p>
              <p className="text-xs text-dim">
                {t.isExpired ? "Token expirado" : t.isExpiringSoon ? "Expira em breve" : `Expira em ${formatDate(t.expiresAt)}`}
                {t.mlNickname && ` · @${t.mlNickname}`}
              </p>
            </div>
            {t.isExpired && (
              <Button variant="secondary" size="sm" onClick={handleConnectML}>
                <RefreshCw size={12} /> Reconectar
              </Button>
            )}
            <button onClick={() => handleDisconnect(t.id)} className="text-dim hover:text-red-400 transition-colors p-1">
              <Trash2 size={14} />
            </button>
          </div>
        ))}
      </div>

      {/* Subscription (lider only) */}
      {user?.role === "lider" && planSlug && (
        <div className="bg-bg-3 border border-border rounded-xl p-6">
          <h2 className="font-syne text-[15px] font-bold text-white mb-5">Assinatura</h2>
          {loading ? <div className="skeleton h-20 rounded-lg" /> : subscription ? (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <PlanBadge slug={planSlug} />
                <StatusBadge status={subscription.status} />
              </div>
              <div className="grid grid-cols-2 gap-4 text-sm border-t border-border pt-4">
                <div><p className="text-dim text-xs mb-1">Valor mensal</p><p className="font-mono font-bold text-white">{formatCurrency(subscription.plan.preco)}</p></div>
                <div><p className="text-dim text-xs mb-1">Próxima cobrança</p><p className="text-muted">{formatDate(subscription.currentPeriodEnd)}</p></div>
                <div><p className="text-dim text-xs mb-1">Contas ML</p><p className="text-muted">{subscription.plan.maxMlAccounts === -1 ? "Ilimitadas" : subscription.plan.maxMlAccounts}</p></div>
                <div><p className="text-dim text-xs mb-1">Funcionários</p><p className="text-muted">{subscription.plan.maxFuncionarios === -1 ? "Ilimitados" : subscription.plan.maxFuncionarios}</p></div>
              </div>
            </div>
          ) : <p className="text-muted text-sm">Nenhuma assinatura ativa</p>}
        </div>
      )}

      {/* Change password */}
      <div className="bg-bg-3 border border-border rounded-xl p-6">
        <h2 className="font-syne text-[15px] font-bold text-white mb-5">Alterar Senha</h2>
        <div className="flex flex-col gap-4">
          <Input label="Senha atual" type="password" placeholder="••••••••" value={pwForm.current}
            onChange={(e) => setPwForm((p) => ({ ...p, current: e.target.value }))} />
          <Input label="Nova senha" type="password" placeholder="••••••••" value={pwForm.next}
            onChange={(e) => setPwForm((p) => ({ ...p, next: e.target.value }))} />
          <Input label="Confirmar nova senha" type="password" placeholder="••••••••" value={pwForm.confirm}
            onChange={(e) => setPwForm((p) => ({ ...p, confirm: e.target.value }))} />
          {pwError && (
            <div className="flex items-center gap-2 text-xs text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">
              <AlertTriangle size={13} /> {pwError}
            </div>
          )}
          {pwSuccess && (
            <div className="flex items-center gap-2 text-xs text-brand bg-brand/10 border border-brand/20 rounded-lg px-3 py-2">
              <CheckCircle size={13} /> Senha alterada com sucesso!
            </div>
          )}
          <Button variant="primary" size="md" loading={savingPw} onClick={handleChangePassword}>Alterar senha</Button>
        </div>
      </div>
    </div>
  );
}
