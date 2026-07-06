"use client";

import { useEffect, useState } from "react";
import { Plus, Trash2, RefreshCw, AlertTriangle, CheckCircle, Percent, ChevronDown, ChevronUp } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import { authApi, mlApi, subscriptionApi, taxRateApi } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import { usePlan } from "@/contexts/PlanContext";
import { usePermissions } from "@/contexts/PermissionsContext";
import { formatDate } from "@/lib/utils";
import { ChannelAccount, Subscription, TaxSetting } from "@/lib/types";

export default function ProfilePage() {
  const { user } = useAuth();
  const { hasPlan } = usePlan();
  const { can, isFuncionario } = usePermissions();
  const [accounts, setAccounts] = useState<ChannelAccount[]>([]);
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [loading, setLoading] = useState(true);
  const [pwForm, setPwForm] = useState({ current: "", next: "", confirm: "" });
  const [pwError, setPwError] = useState("");
  const [pwSuccess, setPwSuccess] = useState(false);
  const [savingPw, setSavingPw] = useState(false);

  const [taxCurrent, setTaxCurrent] = useState<TaxSetting | null>(null);
  const [taxHistory, setTaxHistory] = useState<TaxSetting[]>([]);
  const [taxLoading, setTaxLoading] = useState(true);
  const [showTaxModal, setShowTaxModal] = useState(false);
  const [showTaxHistory, setShowTaxHistory] = useState(false);
  const [taxForm, setTaxForm] = useState({ rate: "", validFrom: new Date().toISOString().slice(0, 10) });
  const [taxSaving, setTaxSaving] = useState(false);
  const [taxError, setTaxError] = useState("");

  const canManage = !isFuncionario || can("manage_costs");

  useEffect(() => {
    Promise.all([mlApi.status(), subscriptionApi.get()])
      .then(([mlRes, subRes]) => {
        setAccounts(mlRes.data.accounts ?? []);
        setSubscription(subRes.data.subscription);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!hasPlan("prata")) { setTaxLoading(false); return; }
    taxRateApi.get()
      .then(({ data }) => {
        setTaxCurrent(data.current);
        setTaxHistory(data.history ?? []);
      })
      .catch(() => {})
      .finally(() => setTaxLoading(false));
  }, [hasPlan]);

  const handleDisconnect = async (accountId: string) => {
    if (!confirm("Desconectar esta conta do Mercado Livre?")) return;
    await mlApi.disconnect(accountId).catch(() => {});
    setAccounts((p) => p.filter((a) => a.id !== accountId));
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

  const handleSaveTaxRate = async () => {
    setTaxError("");
    if (!taxForm.rate || isNaN(Number(taxForm.rate)) || Number(taxForm.rate) < 0) {
      setTaxError("Informe uma alíquota válida");
      return;
    }
    setTaxSaving(true);
    try {
      const { data } = await taxRateApi.create({
        rate: Number(taxForm.rate),
        validFrom: taxCurrent ? taxForm.validFrom : undefined,
      });
      setTaxCurrent(data.setting);
      setTaxHistory((prev) => [data.setting, ...prev]);
      setShowTaxModal(false);
      setTaxForm({ rate: "", validFrom: new Date().toISOString().slice(0, 10) });
    } catch (err: any) {
      setTaxError(err?.response?.data?.message ?? "Erro ao salvar alíquota");
    } finally { setTaxSaving(false); }
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
            <p className="text-xs text-dim mt-0.5">
              {accounts.filter(a => a.channelType === "MERCADO_LIVRE").length} conta(s) conectada(s)
            </p>
          </div>
          <Button variant="secondary" size="sm" onClick={handleConnectML}>
            <Plus size={13} /> Conectar conta
          </Button>
        </div>
        {loading ? (
          <div className="space-y-2">{Array.from({ length: 2 }).map((_, i) => <div key={i} className="skeleton h-16 rounded-lg" />)}</div>
        ) : accounts.filter(a => a.channelType === "MERCADO_LIVRE").length === 0 ? (
          <div className="text-center py-8">
            <p className="text-muted text-sm mb-3">Nenhuma conta conectada</p>
            <Button variant="primary" size="sm" onClick={handleConnectML}><Plus size={13} /> Conectar Mercado Livre</Button>
          </div>
        ) : accounts.filter(a => a.channelType === "MERCADO_LIVRE").map((a) => (
          <div key={a.id} className="flex items-center gap-3 border border-border rounded-lg px-4 py-3 mb-2">
            <div className={`w-2 h-2 rounded-full flex-shrink-0 ${a.isExpired ? "bg-red-500" : a.isExpiringSoon ? "bg-yellow-500" : "bg-brand"}`} />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-white">
                {a.apelido ?? a.externalNickname ?? `Conta #${a.externalAccountId}`}
              </p>
              <p className="text-xs text-dim">
                {a.isExpired ? "Token expirado" : a.isExpiringSoon ? "Expira em breve" : `Expira em ${formatDate(a.tokenExpiresAt)}`}
                {a.externalNickname && ` · @${a.externalNickname}`}
                {!a.initialSyncDone && " · Sincronizando..."}
              </p>
            </div>
            {a.isExpired && (
              <Button variant="secondary" size="sm" onClick={handleConnectML}>
                <RefreshCw size={12} /> Reconectar
              </Button>
            )}
            <button onClick={() => handleDisconnect(a.id)} className="text-dim hover:text-red-400 transition-colors p-1">
              <Trash2 size={14} />
            </button>
          </div>
        ))}
      </div>

      {/* Alíquota de Imposto NF */}
      {hasPlan("prata") && (
        <div className="bg-bg-3 border border-border rounded-xl p-6">
          <div className="flex items-center justify-between mb-2">
            <div>
              <h2 className="font-syne text-[15px] font-bold text-white">Alíquota de Imposto (NF)</h2>
              <p className="text-xs text-dim mt-0.5">Aplicada sobre a receita bruta de todas as vendas</p>
            </div>
            {canManage && (
              <Button variant="secondary" size="sm" onClick={() => setShowTaxModal(true)}>
                <Percent size={13} /> {taxCurrent ? "Alterar" : "Configurar"}
              </Button>
            )}
          </div>
          {taxLoading ? (
            <div className="skeleton h-16 rounded-lg mt-4" />
          ) : taxCurrent ? (
            <div className="mt-4">
              <div className="flex items-center gap-3 border border-border rounded-lg px-4 py-3.5">
                <div className="w-10 h-10 rounded-full bg-brand/15 flex items-center justify-center flex-shrink-0">
                  <Percent size={17} className="text-brand" />
                </div>
                <div className="flex-1">
                  <p className="font-syne text-xl font-bold text-white">{taxCurrent.rate}%</p>
                  <p className="text-xs text-dim">Vigente desde {formatDate(taxCurrent.validFrom)}</p>
                </div>
                {taxHistory.length > 1 && (
                  <button onClick={() => setShowTaxHistory((p) => !p)} className="text-dim hover:text-muted transition-colors p-1">
                    {showTaxHistory ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
                  </button>
                )}
              </div>
              {showTaxHistory && taxHistory.length > 1 && (
                <div className="border-t border-border/50 mt-2 pt-3">
                  <p className="text-[10px] text-dim uppercase tracking-widest mb-2">Histórico</p>
                  <div className="space-y-1.5">
                    {taxHistory.slice(1).map((h) => (
                      <div key={h.id} className="flex justify-between text-xs">
                        <span className="text-dim">Vigente até a alteração seguinte</span>
                        <span className="font-mono text-muted">{h.rate}% · desde {formatDate(h.validFrom)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-6 mt-2">
              <p className="text-muted text-sm mb-3">Nenhuma alíquota configurada ainda</p>
              {canManage && (
                <Button variant="primary" size="sm" onClick={() => setShowTaxModal(true)}>
                  <Percent size={13} /> Configurar alíquota
                </Button>
              )}
            </div>
          )}
        </div>
      )}

      {/* Alterar Senha */}
      <div className="bg-bg-3 border border-border rounded-xl p-6">
        <h2 className="font-syne text-[15px] font-bold text-white mb-5">Alterar Senha</h2>
        <div className="flex flex-col gap-4">
          <Input label="Senha atual" type="password" placeholder="········" value={pwForm.current}
            onChange={(e) => setPwForm((p) => ({ ...p, current: e.target.value }))} />
          <Input label="Nova senha" type="password" placeholder="········" value={pwForm.next}
            onChange={(e) => setPwForm((p) => ({ ...p, next: e.target.value }))} />
          <Input label="Confirmar nova senha" type="password" placeholder="········" value={pwForm.confirm}
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

      {/* Modal alíquota */}
      <Modal open={showTaxModal} onClose={() => setShowTaxModal(false)} title={taxCurrent ? "Alterar Alíquota" : "Configurar Alíquota"} className="max-w-sm">
        <div className="flex flex-col gap-4">
          <Input label="Alíquota de Imposto NF (%)" type="number" placeholder="9.0" min="0" max="100" step="0.1"
            value={taxForm.rate} onChange={(e) => setTaxForm((p) => ({ ...p, rate: e.target.value }))} />
          {taxCurrent ? (
            <>
              <Input label="Vigente a partir de" type="date" value={taxForm.validFrom}
                onChange={(e) => setTaxForm((p) => ({ ...p, validFrom: e.target.value }))} />
              <p className="text-xs text-dim -mt-1">Vendas anteriores continuam usando {taxCurrent.rate}%.</p>
            </>
          ) : (
            <p className="text-xs text-dim -mt-1">Será aplicada a todas as vendas, incluindo anteriores.</p>
          )}
          {taxError && (
            <div className="flex items-center gap-2 text-xs text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">
              <AlertTriangle size={13} /> {taxError}
            </div>
          )}
          <div className="flex gap-2 pt-2">
            <Button variant="secondary" className="flex-1" onClick={() => setShowTaxModal(false)}>Cancelar</Button>
            <Button variant="primary" className="flex-1" loading={taxSaving} onClick={handleSaveTaxRate}>Salvar</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}