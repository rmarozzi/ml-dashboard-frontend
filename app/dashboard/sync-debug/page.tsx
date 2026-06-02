"use client";

import { useState } from "react";
import { Play, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { UpgradeGate } from "@/components/ui/UpgradeGate";
import { usePlan } from "@/contexts/PlanContext";
import api from "@/lib/api";

export default function SyncDebugPage() {
  const [preview, setPreview] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const { hasPlan } = usePlan();

  if (!hasPlan("premium")) {
    return <UpgradeGate feature="Debug de Sincronização" requiredPlan="premium"
      benefits={["Preview dos dados brutos da API ML", "Flags novo/atualizado/sem mudança", "Sync manual com resultado detalhado"]} />;
  }

  const handlePreview = async () => {
    setLoading(true);
    try {
      const { data } = await api.get("/sync/preview");
      setPreview(data);
    } catch (err: any) {
      setPreview({ error: err?.response?.data?.message ?? "Erro ao carregar preview" });
    } finally { setLoading(false); }
  };

  return (
    <div className="flex flex-col gap-5">
      <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg px-4 py-3 text-xs text-yellow-400">
        ⚠️ O preview carrega dados da API do Mercado Livre sem salvar no banco. Use para diagnosticar problemas de sincronização.
      </div>
      <div className="flex gap-3">
        <Button variant="primary" loading={loading} onClick={handlePreview}>
          <Play size={13} /> Carregar Preview
        </Button>
        {preview && <Button variant="secondary" onClick={() => setPreview(null)}><RefreshCw size={13} /> Limpar</Button>}
      </div>
      {preview && (
        <div className="bg-bg-3 border border-border rounded-xl p-5">
          <div className="flex gap-4 mb-4 flex-wrap">
            {[
              ["Novos", preview.new ?? 0, "text-brand"],
              ["Atualizados", preview.updated ?? 0, "text-blue-400"],
              ["Sem mudança", preview.unchanged ?? 0, "text-dim"],
            ].map(([l, v, c]) => (
              <div key={String(l)} className="bg-bg-4 rounded-lg px-4 py-3 flex-1 min-w-[100px]">
                <p className="text-xs text-dim mb-1">{l}</p>
                <p className={`font-syne text-2xl font-bold ${c}`}>{v}</p>
              </div>
            ))}
          </div>
          <p className="text-xs text-dim uppercase tracking-widest mb-2">Dados brutos</p>
          <pre className="bg-bg-0 border border-border rounded-lg p-4 text-xs text-muted overflow-auto max-h-[500px] font-mono">
            {JSON.stringify(preview, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
}
