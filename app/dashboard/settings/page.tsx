"use client";

import { useEffect, useState } from "react";
import { Toggle } from "@/components/ui/Toggle";
import { Button } from "@/components/ui/Button";
import { dashboardApi } from "@/lib/api";
import { usePlan } from "@/contexts/PlanContext";

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
  const { hasPlan } = usePlan();
  const canAutoSync = hasPlan("ouro");

  useEffect(() => {
    dashboardApi.syncStatus()
      .then(({ data }) => { if (data.settings) setSettings(data.settings); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      await fetch("/api/settings", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(settings) });
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch {} finally { setSaving(false); }
  };

  const Row = ({ label, desc, field, locked }: { label: string; desc: string; field: keyof Settings; locked?: boolean }) => (
    <div className="flex items-start justify-between gap-4 py-4 border-b border-border/30">
      <div className="flex-1">
        <div className="flex items-center gap-2">
          <p className="text-sm font-semibold text-white">{label}</p>
          {locked && <span className="text-[10px] bg-yellow-500/10 text-yellow-400 border border-yellow-500/20 px-1.5 py-0.5 rounded">🥇 Ouro+</span>}
        </div>
        <p className="text-xs text-dim mt-0.5">{desc}</p>
      </div>
      <Toggle
        active={settings[field]}
        onToggle={() => !locked && setSettings((p) => ({ ...p, [field]: !p[field] }))}
        disabled={loading || locked}
      />
    </div>
  );

  return (
    <div className="flex flex-col gap-5 max-w-xl">
      <div className="bg-bg-3 border border-border rounded-xl p-6">
        <h2 className="font-syne text-[15px] font-bold text-white mb-1">Sincronização</h2>
        <p className="text-xs text-dim mb-2">Configure como e quando seus pedidos são sincronizados</p>
        <Row label="Sync Automático" desc="Sincroniza automaticamente a cada hora" field="autoSync" locked={!canAutoSync} />
        <Row label="Alertas de Sync" desc="Receba notificações quando a sincronização falhar" field="syncAlerts" />
      </div>

      <div className="bg-bg-3 border border-border rounded-xl p-6">
        <h2 className="font-syne text-[15px] font-bold text-white mb-1">Notificações</h2>
        <p className="text-xs text-dim mb-2">Gerencie suas preferências de notificação</p>
        <Row label="Notificações por E-mail" desc="Receba alertas e resumos por e-mail" field="emailNotifications" />
      </div>

      <Button variant="primary" loading={saving} onClick={handleSave}>
        {saved ? "✓ Salvo!" : "Salvar configurações"}
      </Button>
    </div>
  );
}
