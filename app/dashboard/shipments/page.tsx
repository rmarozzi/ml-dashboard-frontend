/* eslint-disable react-hooks/rules-of-hooks, react-hooks/exhaustive-deps */
"use client";

import { useEffect, useState } from "react";
import { Truck, Package, CheckCircle, Clock } from "lucide-react";
import { StatusBadge } from "@/components/ui/Badge";
import { KPICard } from "@/components/ui/KPICard";
import { UpgradeGate } from "@/components/ui/UpgradeGate";
import { shipmentsApi } from "@/lib/api";
import { usePermissions } from "@/contexts/PermissionsContext";
import { formatCurrency, formatDateTime } from "@/lib/utils";
import { Shipment } from "@/lib/types";

export default function ShipmentsPage() {
  const [shipments, setShipments] = useState<Shipment[]>([]);
  const [loading, setLoading] = useState(true);
  const { can, isFuncionario } = usePermissions();

  if (isFuncionario && !can("view_shipments")) {
    return <UpgradeGate feature="Ver Envios" requiredPlan="prata" />;
  }

  useEffect(() => {
    shipmentsApi.list()
      .then(({ data }) => setShipments(data.shipments ?? []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const counts = {
    total: shipments.length,
    shipped: shipments.filter((s) => s.status === "shipped").length,
    delivered: shipments.filter((s) => s.status === "delivered").length,
    pending: shipments.filter((s) => s.status === "pending" || s.status === "handling").length,
  };

  return (
    <div className="flex flex-col gap-5">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <KPICard label="Total de Envios" value={counts.total} icon={Package} loading={loading} />
        <KPICard label="Em trânsito" value={counts.shipped} icon={Truck} color="#3b82f6" loading={loading} />
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
              )) : shipments.map((s) => (
                <tr key={s.id} className="border-b border-border/20 hover:bg-bg-4 transition-colors">
                  <td className="px-4 py-3 font-mono text-xs text-muted">{s.mlShipmentId}</td>
                  <td className="px-4 py-3 text-sm text-muted">{s.token?.apelido ?? "—"}</td>
                  <td className="px-4 py-3"><StatusBadge status={s.status} /></td>
                  <td className="px-4 py-3 font-mono text-xs text-muted">{s.trackingNumber ?? "—"}</td>
                  <td className="px-4 py-3 font-mono text-sm text-white">{s.cost != null ? formatCurrency(s.cost) : "—"}</td>
                  <td className="px-4 py-3 text-xs text-dim">{formatDateTime(s.dateCreated)}</td>
                </tr>
              ))}
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
