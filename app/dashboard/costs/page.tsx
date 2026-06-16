/* eslint-disable react-hooks/rules-of-hooks, react-hooks/exhaustive-deps */
"use client";

import { useEffect, useState } from "react";
import { Plus, Trash2, ChevronDown, ChevronUp } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import { UpgradeGate } from "@/components/ui/UpgradeGate";
import { costsApi } from "@/lib/api";
import { usePlan } from "@/contexts/PlanContext";
import { usePermissions } from "@/contexts/PermissionsContext";
import { formatCurrency, formatDate } from "@/lib/utils";
import { ProductCost } from "@/lib/types";

export default function CostsPage() {
  const [costs, setCosts] = useState<ProductCost[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [expanded, setExpanded] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);
const searchParams = typeof window !== "undefined" ? new URLSearchParams(window.location.search) : new URLSearchParams();
const [form, setForm] = useState({
  sku: searchParams.get("sku") ?? "",
  name: searchParams.get("name") ?? "",
  cost: "",
  taxRate: "",
  validFrom: new Date().toISOString().slice(0, 10)
});
const [showModal, setShowModal] = useState(!!searchParams.get("sku") || !!searchParams.get("name"));
  const [errors, setErrors] = useState<Record<string, string>>({});
  const { hasPlan } = usePlan();
  const { can, isFuncionario } = usePermissions();

  const canManage = !isFuncionario || can("manage_costs");

  if (!hasPlan("prata")) {
    return (
      <UpgradeGate feature="Preços de Custo" requiredPlan="prata"
        benefits={[
          "Cadastre o custo de cada produto por SKU",
          "Histórico de variação de preço com datas",
          "Cálculo automático de lucro líquido por pedido",
          "Margem percentual real por venda",
          "Alerta de produtos sem custo cadastrado",
        ]}
      />
    );
  }

  useEffect(() => {
    costsApi.list()
      .then(({ data }) => setCosts(data.costs ?? []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const validate = () => {
    const e: Record<string, string> = {};
    if (!form.sku.trim()) e.sku = "SKU obrigatório";
    if (!form.name.trim()) e.name = "Nome obrigatório";
    if (!form.cost || isNaN(Number(form.cost)) || Number(form.cost) < 0) e.cost = "Custo inválido";
    if (!form.taxRate || isNaN(Number(form.taxRate))) e.taxRate = "Alíquota inválida";
    if (!form.validFrom) e.validFrom = "Data obrigatória";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSave = async () => {
    if (!validate()) return;
    setSaving(true);
    try {
      const { data } = await costsApi.create({
        sku: form.sku.trim(),
        name: form.name.trim(),
        cost: Number(form.cost),
        taxRate: Number(form.taxRate),
        validFrom: form.validFrom,
      });
      setCosts((prev) => [data.cost, ...prev]);
      setShowModal(false);
      setForm({ sku: "", name: "", cost: "", taxRate: "", validFrom: new Date().toISOString().slice(0, 10) });
    } catch {} finally { setSaving(false); }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Remover este custo?")) return;
    await costsApi.delete(id).catch(() => {});
    setCosts((prev) => prev.filter((c) => c.id !== id));
  };

  const totalValue = form.cost && form.taxRate
    ? (Number(form.cost) * (1 + Number(form.taxRate) / 100)).toFixed(2)
    : null;

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-muted">{costs.length} produto{costs.length !== 1 ? "s" : ""} cadastrado{costs.length !== 1 ? "s" : ""}</p>
        </div>
        {canManage && (
          <Button variant="primary" size="sm" onClick={() => setShowModal(true)}>
            <Plus size={14} /> Cadastrar Custo
          </Button>
        )}
      </div>

      <div className="flex flex-col gap-2">
        {loading ? Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="skeleton h-16 rounded-xl" />
        )) : costs.length === 0 ? (
          <div className="bg-bg-3 border border-dashed border-border rounded-xl p-12 text-center">
            <p className="text-muted text-sm mb-3">Nenhum custo cadastrado ainda</p>
            {canManage && (
              <Button variant="primary" size="sm" onClick={() => setShowModal(true)}>
                <Plus size={14} /> Cadastrar primeiro custo
              </Button>
            )}
          </div>
        ) : costs.map((cost) => (
          <div key={cost.id} className="bg-bg-3 border border-border rounded-xl overflow-hidden">
            <div className="flex items-center gap-4 px-5 py-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <span className="font-mono text-xs bg-bg-5 border border-border px-2 py-0.5 rounded text-muted">{cost.sku}</span>
                  <span className="text-sm font-semibold text-white truncate">{cost.name}</span>
                </div>
                <div className="flex gap-4 text-xs text-dim">
                  <span>Vigente desde {formatDate(cost.validFrom)}</span>
                  <span>Alíquota: {cost.taxRate}%</span>
                </div>
              </div>
              <div className="text-right flex-shrink-0">
                <div className="font-mono font-bold text-white text-base">{formatCurrency(cost.cost)}</div>
                <div className="text-xs text-dim">c/ imposto: {formatCurrency(cost.cost * (1 + cost.taxRate / 100))}</div>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                {cost.history && cost.history.length > 0 && (
                  <button onClick={() => setExpanded(expanded === cost.id ? null : cost.id)}
                    className="text-dim hover:text-muted transition-colors p-1">
                    {expanded === cost.id ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
                  </button>
                )}
                {canManage && (
                  <button onClick={() => handleDelete(cost.id)} className="text-dim hover:text-red-400 transition-colors p-1">
                    <Trash2 size={14} />
                  </button>
                )}
              </div>
            </div>
            {expanded === cost.id && cost.history && (
              <div className="border-t border-border bg-bg-4 px-5 py-3">
                <p className="text-[10px] text-dim uppercase tracking-widest mb-2">Histórico de variação</p>
                <div className="space-y-1.5">
                  {cost.history.map((h) => (
                    <div key={h.id} className="flex justify-between text-xs">
                      <span className="text-dim">{formatDate(h.validFrom)}</span>
                      <span className="font-mono text-muted">{formatCurrency(h.cost)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      <Modal open={showModal} onClose={() => setShowModal(false)} title="Cadastrar Custo de Produto" className="max-w-md">
        <div className="flex flex-col gap-4">
          <div className="grid grid-cols-2 gap-3">
            <Input label="SKU do Produto" placeholder="MLB123456" value={form.sku}
              onChange={(e) => setForm((p) => ({ ...p, sku: e.target.value }))} error={errors.sku} />
            <Input label="Vigência a partir de" type="date" value={form.validFrom}
              onChange={(e) => setForm((p) => ({ ...p, validFrom: e.target.value }))} error={errors.validFrom} />
          </div>
          <Input label="Nome do Produto" placeholder="Tênis Nike Air Max 270" value={form.name}
            onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))} error={errors.name} />
          <div className="grid grid-cols-2 gap-3">
            <Input label="Custo (R$)" type="number" placeholder="89.90" min="0" step="0.01" value={form.cost}
              onChange={(e) => setForm((p) => ({ ...p, cost: e.target.value }))} error={errors.cost} />
            <Input label="Alíquota de imposto (%)" type="number" placeholder="12" min="0" max="100" step="0.1" value={form.taxRate}
              onChange={(e) => setForm((p) => ({ ...p, taxRate: e.target.value }))} error={errors.taxRate} />
          </div>
          {totalValue && (
            <div className="bg-bg-4 border border-border rounded-lg px-4 py-3">
              <p className="text-xs text-dim mb-1">Preview — Custo total com imposto</p>
              <p className="font-mono font-bold text-brand text-lg">R$ {totalValue}</p>
            </div>
          )}
          <div className="flex gap-2 pt-2">
            <Button variant="secondary" className="flex-1" onClick={() => setShowModal(false)}>Cancelar</Button>
            <Button variant="primary" className="flex-1" loading={saving} onClick={handleSave}>Salvar</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
