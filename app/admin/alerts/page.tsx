/* eslint-disable react-hooks/rules-of-hooks, react-hooks/exhaustive-deps */
"use client";

import { useEffect, useState } from "react";
import { CheckCircle, AlertTriangle, AlertCircle, Info } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { adminApi } from "@/lib/api";
import { AdminAlert } from "@/lib/types";
import { timeAgo } from "@/lib/utils";
import { Modal } from "@/components/ui/Modal";
import { Input } from "@/components/ui/Input";

const SEV_FILTERS = [
  { label: "Todos", value: "" },
  { label: "Críticos", value: "critical" },
  { label: "Avisos", value: "warning" },
  { label: "Info", value: "info" },
];

const SeverityIcon = ({ s }: { s: string }) => {
  if (s === "critical") return <AlertTriangle size={15} className="text-red-400 flex-shrink-0" />;
  if (s === "warning") return <AlertCircle size={15} className="text-yellow-400 flex-shrink-0" />;
  return <Info size={15} className="text-blue-400 flex-shrink-0" />;
};

export default function AdminAlertsPage() {
  const [alerts, setAlerts] = useState<AdminAlert[]>([]);
  const [loading, setLoading] = useState(true);
  const [sevFilter, setSevFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("open");
  const [resolving, setResolving] = useState<AdminAlert | null>(null);
  const [resolveNote, setResolveNote] = useState("");
  const [saving, setSaving] = useState(false);

  const load = () => {
    setLoading(true);
    const params: Record<string, string> = {};
    if (sevFilter) params.severity = sevFilter;
    if (statusFilter) params.status = statusFilter;
    adminApi.alerts(params)
      .then(({ data }) => setAlerts(data.alerts ?? []))
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, [sevFilter, statusFilter]);

  const handleResolve = async () => {
    if (!resolving || !resolveNote.trim()) return;
    setSaving(true);
    try {
      await adminApi.resolveAlert(resolving.id, resolveNote);
      setAlerts((p) => p.map((a) => a.id === resolving.id ? { ...a, status: "resolved" } : a));
      setResolving(null);
      setResolveNote("");
    } catch {} finally { setSaving(false); }
  };

  const severityBorder: Record<string, string> = {
    critical: "border-red-500/30",
    warning: "border-yellow-500/30",
    info: "border-blue-500/30",
  };

  return (
    <div className="flex flex-col gap-5">
      {/* Filters */}
      <div className="flex gap-2 flex-wrap">
        {SEV_FILTERS.map((f) => (
          <button key={f.value} onClick={() => setSevFilter(f.value)}
            className={`px-4 py-1.5 rounded-lg border text-xs font-semibold transition-all ${
              sevFilter === f.value
                ? "bg-brand/15 border-brand/50 text-brand"
                : "bg-bg-3 border-border text-muted hover:text-white"
            }`}>{f.label}</button>
        ))}
        <div className="ml-auto">
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-bg-3 border border-border rounded-lg px-3 py-1.5 text-xs text-muted outline-none cursor-pointer">
            <option value="open">Abertos</option>
            <option value="resolved">Resolvidos</option>
            <option value="">Todos</option>
          </select>
        </div>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-3 gap-3">
        {[
          ["Críticos", alerts.filter((a) => a.severity === "critical" && a.status === "open").length, "text-red-400", "bg-red-500/10 border-red-500/20"],
          ["Avisos", alerts.filter((a) => a.severity === "warning" && a.status === "open").length, "text-yellow-400", "bg-yellow-500/10 border-yellow-500/20"],
          ["Info", alerts.filter((a) => a.severity === "info" && a.status === "open").length, "text-blue-400", "bg-blue-500/10 border-blue-500/20"],
        ].map(([l, v, tc, bg]) => (
          <div key={String(l)} className={`border rounded-xl px-4 py-3 flex items-center justify-between ${bg}`}>
            <span className={`text-xs font-semibold ${tc}`}>{l}</span>
            <span className={`font-syne text-2xl font-bold ${tc}`}>{v}</span>
          </div>
        ))}
      </div>

      {/* Alerts list */}
      <div className="flex flex-col gap-2">
        {loading ? Array.from({ length: 5 }).map((_, i) => <div key={i} className="skeleton h-20 rounded-xl" />) :
         alerts.length === 0 ? (
          <div className="bg-bg-3 border border-border rounded-xl py-16 text-center">
            <CheckCircle size={28} className="text-brand mx-auto mb-2" />
            <p className="text-muted text-sm">Nenhum alerta encontrado</p>
          </div>
        ) : alerts.map((alert) => (
          <div key={alert.id} className={`bg-bg-3 border ${severityBorder[alert.severity] ?? "border-border"} rounded-xl px-5 py-4 flex items-start gap-3 ${alert.status === "resolved" ? "opacity-50" : ""}`}>
            <SeverityIcon s={alert.severity} />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-white leading-snug">{alert.description}</p>
              <div className="flex gap-3 mt-1 flex-wrap">
                <span className="text-xs text-dim">Cliente: <span className="text-muted">{alert.client.name ?? alert.client.email}</span></span>
                <span className="text-xs text-dim">{timeAgo(alert.createdAt)}</span>
                {alert.token && <span className="text-xs text-dim">Conta: {alert.token.apelido ?? "—"}</span>}
              </div>
              {alert.status === "resolved" && alert.resolvedNote && (
                <p className="text-xs text-brand mt-1">✓ {alert.resolvedNote}</p>
              )}
            </div>
            {alert.status === "open" && (
              <Button variant="secondary" size="sm" onClick={() => { setResolving(alert); setResolveNote(""); }}>
                Resolver
              </Button>
            )}
          </div>
        ))}
      </div>

      {/* Resolve modal */}
      <Modal open={!!resolving} onClose={() => setResolving(null)} title="Resolver Alerta" className="max-w-md">
        {resolving && (
          <div className="flex flex-col gap-4">
            <div className="bg-bg-4 border border-border rounded-lg px-4 py-3">
              <p className="text-sm text-white">{resolving.description}</p>
              <p className="text-xs text-dim mt-1">{resolving.client.name ?? resolving.client.email}</p>
            </div>
            <Input label="Nota de resolução (obrigatório)" placeholder="Ex: Token renovado manualmente, cliente notificado..."
              value={resolveNote} onChange={(e) => setResolveNote(e.target.value)} />
            <div className="flex gap-2">
              <Button variant="secondary" className="flex-1" onClick={() => setResolving(null)}>Cancelar</Button>
              <Button variant="primary" className="flex-1" loading={saving} disabled={!resolveNote.trim()} onClick={handleResolve}>Marcar como resolvido</Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
