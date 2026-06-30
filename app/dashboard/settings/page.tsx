"use client";

import { useEffect, useState } from "react";
import { AlertTriangle, CheckCircle, Clock } from "lucide-react";
import { Toggle } from "@/components/ui/Toggle";
import { Button } from "@/components/ui/Button";
import api from "@/lib/api";
import { usePlan } from "@/contexts/PlanContext";
import { usePermissions } from "@/contexts/PermissionsContext";

interface Settings {
  autoSync: boolean;
  emailNotifications: boolean;
  syncAlerts: boolean;
}

export default function SettingsPage() {
  const [settings, setSettings] = useState<Settings>({ autoSync: false, emailNotifications: true, syncAlerts: true });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");

  const { hasPlan } = usePlan();
  const { isFuncionario } = usePermissions();
  const canAutoSync = hasPlan("ouro");
  const canEdit = !isFuncionario; // funcionário não edita configurações do líder

  useEffect(() => {
    api.get("/settings")
      .then(({ data }) => { if (data.settings) setSettings(data.settings); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const updateField = async (field: keyof Settings, value: boolean) => {
    setError("");
    const previous = settings;
    const next = { ...settings, [field]: value };
    setSettings(next); // atualização otimista

    setSaving(true);
    try {
      const { data } = await api.post("/settings", { [field]: value });
      if (data.settings) setSettings(data.settings);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (err: any) {
      setSettings(previous); // reverte se der erro
      setError(err?.response?.data?.message ?? "Erro ao salvar configuração");
    } finally {
      setSaving(false);
    }
  };

  const Row = ({ label, desc, field, locked }: { label: string; desc: string; field: keyof Settings; locked?: boolean }) => (
    <div className="flex items-start justify-between gap-4 py-4 border-b border-border/30 last:border-b-0">
      <div className="flex-1">
        <div className="flex items-center gap-2">
          <p className="text-sm font-semibold text-white">{label}</p>
          {locked && <span className="text-[10px] bg-yellow-500/10 text-yellow-400 border border-yellow-500/20 px-1.5 py-0.5 rounded">🥇 Ouro+</span>}
        </div>
        <p className="text-xs text-dim mt-0.5">{desc}</p>
      </div>
      <Toggle
        active={settings[field]}
        onToggle={() => canEdit && !locked && updateField(field, !settings[field])}
        disabled={loading || locked || !canEdit || saving}
      />
    </div>
  );

  return (
    <div className="flex flex-col gap-5 max-w-xl">
      {!canEdit && (
        <div className="flex items-center gap-2 bg-blue-500/10 border border-blue-500/20 rounded-lg px-4 py-2.5">
          <AlertTriangle size={14} className="text-blue-400 flex-shrink-0" />
          <p className="text-xs text-blue-400">Apenas o responsável pela conta pode alterar estas configurações.</p>
        </div>
      )}

      <div className="bg-bg-3 border border-border rounded-xl p-6">
        <h2 className="font-syne text-[15px] font-bold text-white mb-1">Sincronização</h2>
        <p className="text-xs text-dim mb-2">Configure como e quando seus pedidos são sincronizados</p>

        <Row label="Sync Automático" desc="Sincroniza automaticamente a cada hora, sem precisar clicar manualmente" field="autoSync" locked={!canAutoSync} />

        {settings.autoSync && canAutoSync && (
          <div className="flex items-center gap-2 bg-brand/10 border border-brand/20 rounded-lg px-3 py-2 mt-3">
            <Clock size={13} className="text-brand flex-shrink-0" />
            <p className="text-xs text-brand">Sync automático ativo — roda a cada hora em segundo plano.</p>
          </div>
        )}

        <Row label="Alertas de Sync" desc="Receba notificações quando a sincronização falhar" field="syncAlerts" />
      </div>

      <div className="bg-bg-3 border border-border rounded-xl p-6">
        <h2 className="font-syne text-[15px] font-bold text-white mb-1">Notificações</h2>
        <p className="text-xs text-dim mb-2">Gerencie suas preferências de notificação</p>
        <Row label="Notificações por E-mail" desc="Receba alertas e resumos por e-mail" field="emailNotifications" />
      </div>

      {error && (
        <div className="flex items-center gap-2 text-xs text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">
          <AlertTriangle size={13} /> {error}
        </div>
      )}

      {saved && (
        <div className="flex items-center gap-2 text-xs text-brand bg-brand/10 border border-brand/20 rounded-lg px-3 py-2">
          <CheckCircle size={13} /> Configuração salva!
        </div>
      )}
    </div>
  );
}