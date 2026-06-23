"use client";

import { useEffect, useState } from "react";
import { Truck, Package, CheckCircle, Clock } from "lucide-react";
import { KPICard } from "@/components/ui/KPICard";
import { UpgradeGate } from "@/components/ui/UpgradeGate";
import { shipmentsApi } from "@/lib/api";
import { usePermissions } from "@/contexts/PermissionsContext";
import { formatCurrency, formatDateTime } from "@/lib/utils";
import { Shipment } from "@/lib/types";

// Todos os status possíveis retornados pela API do Mercado Livre,
// traduzidos para uma linguagem amigável ao usuário final.
const STATUS_LABELS: Record<string, string> = {
  pending: "Aguardando etiqueta",
  handling: "Preparando envio",
  ready_to_ship: "Pronto para despachar",
  shipped: "Em trânsito",
  not_delivered: "Não entregue",
  delivered: "Entregue",
  cancelled: "Cancelado",
};

const STATUS_COLORS: Record<string, { text: string; bg: string; border: string }> = {
  pending:        { text: "#eab308", bg: "rgba(234,179,8,0.1)",  border: "rgba(234,179,8,0.3)" },
  handling:       { text: "#eab308", bg: "rgba(234,179,8,0.1)",  border: "rgba(234,179,8,0.3)" },
  ready_to_ship:  { text: "#3b82f6", bg: "rgba(59,130,246,0.1)", border: "rgba(59,130,246,0.3)" },
  shipped:        { text: "#3b82f6", bg: "rgba(59,130,246,0.1)", border: "rgba(59,130,246,0.3)" },
  delivered:      { text: "#22c55e", bg: "rgba(34,197,94,0.1)",  border: "rgba(34,197,94,0.3)" },
  not_delivered:  { text: "#ef4444", bg: "rgba(239,68,68,0.1)",  border: "rgba(239,68,68,0.3)" },
  cancelled:      { text: "#ef4444", bg: "rgba(239,68,68,0.1)",  border: "rgba(239,68,68,0.3)" },
};

function ShipmentStatusBadge({ status }: { status: string }) {
  const c = STATUS_COLORS[status] ?? { text: "#8888a8", bg: "rgba(255,255,255,0.04)", border: "rgba(255,255,255,0.1)" };
  const label = STATUS_LABELS[status] ?? status;
  return (
    <span
      className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold tracking-wide whitespace-nowrap"
      style={{ color: c.text, background: c.bg, border: `1px solid ${c.border}` }}
    >
      {label}
    </span>
  );
}

export default function ShipmentsPage() {
  const [shipments, setShipments] = useState<Shipment[]>([]);
  const [loading, setLoading] = useState(true);
  const { can, isFuncionario } = usePermissions();

  useEffect(() => {
    shipmentsApi.list()
      .then(({ data }) => setShipments(data.shipments ?? []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (isFuncionario && !can("view_shipments")) {
    return <UpgradeGate feature="Ver Envios" requiredPlan="prata" />;
  }

  const counts = {
    total: shipments.length,
    inTransit: shipments.filter((s) => s.status === "shipped" || s.status === "ready_to_ship").length,
    delivered: shipments.filter((s) => s.status === "delivered").length,
    pending: shipments.filter((s) => s.status === "pending" || s.status === "handling").length,
  };

  return (
    <div className="flex flex-col gap-5">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <KPICard label="Total de Envios" value={counts.total} icon={Package} loading={loading} />
        <KPICard label="Em trânsito" value={counts.inTransit} icon={Truck} color="#3b82f6" loading={loading} />
        <KPICard label="Entregues" value={counts.delivered} icon={CheckCircle} color="#22c55e" loading={loading} />
        <KPICard label="Pendentes" value={counts.pending} icon={Clock} color="#eab308" loading={loading} />
      </div>

      <div className="bg-bg-3 border border-border rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-border bg-bg-4">
                {["ID do Envio", "Conta ML", "Status", "Rastreio", "Custo", "Data"].map((h) => (
                  <th key={h} className="px-4 py-3 text-[10px] font-semibold text-dim uppercase tracking-widest">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? Array.from({ length: 8 }).map((_, i) => (
                <tr key={i} className="border-b border-border/20">
                  {Array.from({ length: 6 }).map((_, j) => (
                    <td key={j} className="px-4 py-3"><div className="skeleton h-4 rounded" /></td>
                  ))}
                </tr>
              )) : shipments.map((s) => {
                const accountLabel = s.token?.apelido || s.token?.mlNickname || "—";
                return (
                  <tr key={s.id} className="border-b border-border/20 hover:bg-bg-4 transition-colors">
                    <td className="px-4 py-3 font-mono text-xs text-muted">{s.mlShipmentId}</td>
                    <td className="px-4 py-3 text-sm text-muted">{accountLabel}</td>
                    <td className="px-4 py-3"><ShipmentStatusBadge status={s.status} /></td>
                    <td className="px-4 py-3 font-mono text-xs text-muted">{s.trackingNumber ?? "—"}</td>
                    <td className="px-4 py-3 font-mono text-sm text-white">{s.cost != null ? formatCurrency(s.cost) : "—"}</td>
                    <td className="px-4 py-3 text-xs text-dim">{formatDateTime(s.dateCreated)}</td>
                  </tr>
                );
              })}
              {!loading && shipments.length === 0 && (
                <tr><td colSpan={6} className="py-16 text-center text-muted text-sm">Nenhum envio encontrado</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}