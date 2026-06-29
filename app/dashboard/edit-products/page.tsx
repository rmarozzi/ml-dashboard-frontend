"use client";

import { useEffect, useState } from "react";
import {
  Search, Edit, ChevronDown, ChevronUp, Package, AlertTriangle, CheckCircle,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import { UpgradeGate } from "@/components/ui/UpgradeGate";
import { costsApi } from "@/lib/api";
import { usePlan } from "@/contexts/PlanContext";
import { usePermissions } from "@/contexts/PermissionsContext";
import { formatCurrency, formatDate } from "@/lib/utils";
import { ProductCost } from "@/lib/types";

export default function EditProductsPage() {
  const [costs, setCosts] = useState<ProductCost[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [expanded, setExpanded] = useState<number | null>(null);

  const [editing, setEditing] = useState<ProductCost | null>(null);
  const [showMoreFields, setShowMoreFields] = useState(false);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saveSuccess, setSaveSuccess] = useState(false);

  const [form, setForm] = useState({
    name: "", cost: "", validFrom: new Date().toISOString().slice(0, 10),
    ean: "", ncm: "", cest: "", codFabricante: "", marca: "",
  });

  const { hasPlan } = usePlan();
  const { can, isFuncionario } = usePermissions();
  const canManage = !isFuncionario || can("manage_costs");

  const loadCosts = () => {
    setLoading(true);
    costsApi.list()
      .then(({ data }) => setCosts(data.costs ?? []))
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => { loadCosts(); }, []);

  if (!hasPlan("prata")) {
    return (
      <UpgradeGate feature="Alteração de Produtos" requiredPlan="prata"
        benefits={[
          "Altere o custo de produtos já cadastrados",
          "Histórico preservado — vendas antigas mantêm o valor original",
          "Atualize dados cadastrais (EAN, NCM, CEST, marca) instantaneamente",
        ]}
      />
    );
  }

  const filtered = costs.filter((c) =>
    !search ||
    c.sku.toLowerCase().includes(search.toLowerCase()) ||
    c.name.toLowerCase().includes(search.toLowerCase())
  );

  const openEdit = (cost: ProductCost) => {
    setEditing(cost);
    setForm({
      name: cost.name,
      cost: "",
      validFrom: new Date().toISOString().slice(0, 10),
      ean: cost.ean ?? "",
      ncm: cost.ncm ?? "",
      cest: cost.cest ?? "",
      codFabricante: cost.codFabricante ?? "",
      marca: cost.marca ?? "",
    });
    setErrors({});
    setShowMoreFields(false);
  };

  const closeEdit = () => {
    setEditing(null);
    setSaveSuccess(false);
  };

  const validate = () => {
    const e: Record<string, string> = {};
    if (!form.name.trim()) e.name = "Nome obrigatório";
    if (form.cost && (isNaN(Number(form.cost)) || Number(form.cost) < 0)) e.cost = "Custo inválido";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSave = async () => {
    if (!editing) return;
    if (!validate()) return;
    setSaving(true);
    try {
      const payload: any = {
        name: form.name.trim(),
        ean: form.ean.trim(),
        ncm: form.ncm.trim(),
        cest: form.cest.trim(),
        codFabricante: form.codFabricante.trim(),
        marca: form.marca.trim(),
      };
      if (form.cost) {
        payload.cost = Number(form.cost);
        payload.validFrom = form.validFrom;
      }
      await costsApi.update(editing.sku, payload);
      setSaveSuccess(true);
      loadCosts();
      setTimeout(() => closeEdit(), 1200);
    } catch (err: any) {
      setErrors({ name: err?.response?.data?.message ?? "Erro ao atualizar produto" });
    } finally { setSaving(false); }
  };

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <p className="text-sm text-muted">{costs.length} produto{costs.length !== 1 ? "s" : ""} cadastrado{costs.length !== 1 ? "s" : ""}</p>
      </div>

      <div className="relative max-w-md">
        <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-dim pointer-events-none" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar por SKU ou nome..."
          className="w-full bg-bg-3 border border-border rounded-lg pl-8 pr-3 py-2 text-sm text-white placeholder:text-dim outline-none focus:border-brand/50"
        />
      </div>

      <div className="flex flex-col gap-2">
        {loading ? Array.from({ length: 5 }).map((_, i) => <div key={i} className="skeleton h-16 rounded-xl" />) :
         filtered.length === 0 ? (
          <div className="bg-bg-3 border border-dashed border-border rounded-xl p-12 text-center">
            <Package size={28} className="text-dim mx-auto mb-3" />
            <p className="text-muted text-sm">{search ? "Nenhum produto encontrado" : "Nenhum produto cadastrado ainda"}</p>
          </div>
        ) : filtered.map((cost) => (
          <div key={cost.id} className="bg-bg-3 border border-border rounded-xl overflow-hidden">
            <div className="flex items-center gap-4 px-5 py-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <span className="font-mono text-xs bg-bg-5 border border-border px-2 py-0.5 rounded text-muted">{cost.sku}</span>
                  <span className="text-sm font-semibold text-white truncate">{cost.name}</span>
                </div>
                <div className="flex gap-3 text-xs text-dim flex-wrap">
                  <span>Custo atual desde {formatDate(cost.validFrom)}</span>
                  {cost.marca && <span>Marca: {cost.marca}</span>}
                </div>
              </div>
              <div className="text-right flex-shrink-0">
                <div className="font-mono font-bold text-white text-base">{formatCurrency(cost.cost)}</div>
                <div className="text-xs text-dim">custo do produto</div>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                {cost.history && cost.history.length > 0 && (
                  <button onClick={() => setExpanded(expanded === cost.id ? null : cost.id)} className="text-dim hover:text-muted transition-colors p-1">
                    {expanded === cost.id ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
                  </button>
                )}
                {canManage && (
                  <Button variant="secondary" size="sm" onClick={() => openEdit(cost)}>
                    <Edit size={12} /> Editar
                  </Button>
                )}
              </div>
            </div>
            {expanded === cost.id && (
              <div className="border-t border-border bg-bg-4 px-5 py-3.5">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs mb-3">
                  <div><p className="text-dim mb-0.5">NCM</p><p className="font-mono text-muted">{cost.ncm || "—"}</p></div>
                  <div><p className="text-dim mb-0.5">CEST</p><p className="font-mono text-muted">{cost.cest || "—"}</p></div>
                  <div><p className="text-dim mb-0.5">Cód. Fabricante</p><p className="font-mono text-muted">{cost.codFabricante || "—"}</p></div>
                  <div><p className="text-dim mb-0.5">EAN</p><p className="font-mono text-muted">{cost.ean || "—"}</p></div>
                </div>
                {cost.history && cost.history.length > 0 && (
                  <>
                    <p className="text-[10px] text-dim uppercase tracking-widest mb-2 mt-3 pt-3 border-t border-border/50">Histórico de custo</p>
                    <div className="space-y-1.5">
                      {cost.history.map((h) => (
                        <div key={h.id} className="flex justify-between text-xs">
                          <span className="text-dim">{formatDate(h.validFrom)}</span>
                          <span className="font-mono text-muted">{formatCurrency(h.cost)}</span>
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Modal de edição */}
      <Modal open={!!editing} onClose={closeEdit} title={`Editar Produto — ${editing?.sku ?? ""}`} className="max-w-md">
        <div className="flex flex-col gap-4">
          <Input label="Descrição do Produto" value={form.name}
            onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))} error={errors.name} />

          <div className="bg-bg-4 border border-border rounded-lg p-3.5">
            <p className="text-xs font-semibold text-white mb-1">Alterar custo</p>
            <p className="text-xs text-dim mb-3">
              Custo atual: <span className="font-mono text-white">{editing ? formatCurrency(editing.cost) : ""}</span>
              {" "}— deixe em branco para não alterar.
            </p>
            <div className="grid grid-cols-2 gap-3">
              <Input label="Novo custo (R$)" type="number" placeholder="89.90" min="0" step="0.01" value={form.cost}
                onChange={(e) => setForm((p) => ({ ...p, cost: e.target.value }))} error={errors.cost} />
              <Input label="Vigente a partir de" type="date" value={form.validFrom}
                onChange={(e) => setForm((p) => ({ ...p, validFrom: e.target.value }))}
                disabled={!form.cost} />
            </div>
            {form.cost && (
              <p className="text-[11px] text-yellow-400 mt-2">
                Vendas anteriores a esta data continuam usando o custo de {editing ? formatCurrency(editing.cost) : ""}.
              </p>
            )}
          </div>

          <button
            onClick={() => setShowMoreFields((p) => !p)}
            className="flex items-center gap-1.5 text-xs text-muted hover:text-white transition-colors"
          >
            {showMoreFields ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
            Outros dados cadastrais — EAN, NCM, CEST, marca
          </button>

          {showMoreFields && (
            <div className="flex flex-col gap-3 bg-bg-4 border border-border rounded-lg p-3">
              <div className="grid grid-cols-2 gap-3">
                <Input label="EAN" value={form.ean} onChange={(e) => setForm((p) => ({ ...p, ean: e.target.value }))} />
                <Input label="NCM" value={form.ncm} onChange={(e) => setForm((p) => ({ ...p, ncm: e.target.value }))} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <Input label="CEST" value={form.cest} onChange={(e) => setForm((p) => ({ ...p, cest: e.target.value }))} />
                <Input label="Cód. Fabricante" value={form.codFabricante} onChange={(e) => setForm((p) => ({ ...p, codFabricante: e.target.value }))} />
              </div>
              <Input label="Marca / Fabricante / Importador" value={form.marca} onChange={(e) => setForm((p) => ({ ...p, marca: e.target.value }))} />
              <p className="text-[11px] text-dim">Estes campos são atualizados imediatamente, sem efeito retroativo.</p>
            </div>
          )}

          {saveSuccess && (
            <div className="flex items-center gap-2 text-xs text-brand bg-brand/10 border border-brand/20 rounded-lg px-3 py-2">
              <CheckCircle size={13} /> Produto atualizado com sucesso!
            </div>
          )}

          <div className="flex gap-2 pt-2">
            <Button variant="secondary" className="flex-1" onClick={closeEdit}>Cancelar</Button>
            <Button variant="primary" className="flex-1" loading={saving} onClick={handleSave}>Salvar Alterações</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}