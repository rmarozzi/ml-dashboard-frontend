"use client";

import { useEffect, useState, useRef, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import * as XLSX from "xlsx";
import {
  Plus, Trash2, ChevronDown, ChevronUp, Package, Upload,
  Download, FileSpreadsheet, AlertTriangle, CheckCircle, X, Loader2,
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

// ─── Mapeamento de cabeçalhos da planilha → campos internos ───────────────
const HEADER_MAP: Record<string, string> = {
  "EAN": "ean",
  "NCM": "ncm",
  "CEST": "cest",
  "SKU": "sku",
  "COD FABRICANTE": "codFabricante",
  "CODIGO FABRICANTE": "codFabricante",
  "DESCRICAO": "name",
  "DESCRICAO DO PRODUTO": "name",
  "MARCA / FABRICANTE / IMPORTADOR": "marca",
  "MARCA/FABRICANTE/IMPORTADOR": "marca",
  "MARCA": "marca",
  "CUSTO DO PRODUTO": "cost",
  "CUSTO": "cost",
};

function normalizeHeader(h: any): string {
  return (h ?? "")
    .toString()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .toUpperCase();
}

interface ParsedRow {
  _row: number;
  ean: string;
  ncm: string;
  cest: string;
  sku: string;
  codFabricante: string;
  name: string;
  marca: string;
  cost: number;
  _valid: boolean;
  _error?: string;
}

function parseExcelFile(file: File): Promise<ParsedRow[]> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = e.target?.result;
        const workbook = XLSX.read(data, { type: "array" });
        const sheet = workbook.Sheets[workbook.SheetNames[0]];
        const rows: any[][] = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: "" });

        if (rows.length < 2) { resolve([]); return; }

        const headerRow = rows[0];
        const fieldIndexes: Record<string, number> = {};
        headerRow.forEach((h, idx) => {
          const field = HEADER_MAP[normalizeHeader(h)];
          if (field) fieldIndexes[field] = idx;
        });

        const dataRows = rows.slice(1).filter((r) => r.some((cell) => cell !== "" && cell != null));

        const parsed: ParsedRow[] = dataRows.map((r, i) => {
          const getVal = (field: string) =>
            fieldIndexes[field] != null ? String(r[fieldIndexes[field]] ?? "").trim() : "";

          const sku = getVal("sku");
          const name = getVal("name");
          const costRaw = getVal("cost");
          const cost = parseFloat(costRaw.replace(",", "."));

          let valid = true;
          let error = "";
          if (!sku) { valid = false; error = "SKU vazio"; }
          else if (!name) { valid = false; error = "Descrição vazia"; }
          else if (!costRaw || isNaN(cost) || cost < 0) { valid = false; error = "Custo inválido"; }

          return {
            _row: i + 2,
            ean: getVal("ean"),
            ncm: getVal("ncm"),
            cest: getVal("cest"),
            sku,
            codFabricante: getVal("codFabricante"),
            name,
            marca: getVal("marca"),
            cost,
            _valid: valid,
            _error: error,
          };
        });

        resolve(parsed);
      } catch (err) {
        reject(err);
      }
    };
    reader.onerror = reject;
    reader.readAsArrayBuffer(file);
  });
}

function downloadTemplate() {
  const headers = ["EAN", "NCM", "CEST", "SKU", "COD FABRICANTE", "DESCRIÇÃO", "MARCA / FABRICANTE / IMPORTADOR", "CUSTO DO PRODUTO"];
  const example1 = ["7891234567890", "61091000", "2800", "CZ1234", "FAB-001", "Camiseta Algodão Premium Branca", "Marca Exemplo", "29.90"];
  const example2 = ["", "", "", "CZ5678", "", "Caneca Térmica 500ml Inox", "", "18.50"];
  const ws = XLSX.utils.aoa_to_sheet([headers, example1, example2]);
  ws["!cols"] = headers.map((h) => ({ wch: Math.max(18, h.length + 4) }));
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Produtos");
  XLSX.writeFile(wb, "modelo_cadastro_produtos.xlsx");
}

function ProductsPageContent() {
  const searchParams = useSearchParams();
  const skuParam = searchParams.get("sku") ?? "";
  const nameParam = searchParams.get("name") ?? "";

  const [costs, setCosts] = useState<ProductCost[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [showMoreFields, setShowMoreFields] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const [form, setForm] = useState({
    sku: "", name: "", cost: "", ean: "", ncm: "", cest: "", codFabricante: "", marca: "",
  });

  // Bulk upload state
  const [showBulkModal, setShowBulkModal] = useState(false);
  const [bulkStep, setBulkStep] = useState<"upload" | "preview" | "result">("upload");
  const [bulkRows, setBulkRows] = useState<ParsedRow[]>([]);
  const [bulkParsing, setBulkParsing] = useState(false);
  const [bulkSubmitting, setBulkSubmitting] = useState(false);
  const [bulkResult, setBulkResult] = useState<{ total: number; created: number; skipped: number; errors: any[] } | null>(null);
  const [bulkParseError, setBulkParseError] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { hasPlan } = usePlan();
  const { can, isFuncionario } = usePermissions();
  const canManage = !isFuncionario || can("manage_costs");

  useEffect(() => {
    if (skuParam || nameParam) {
      setForm((prev) => ({ ...prev, sku: skuParam || prev.sku, name: nameParam || prev.name }));
      setShowModal(true);
    }
  }, [skuParam, nameParam]);

  const loadCosts = () => {
    costsApi.list()
      .then(({ data }) => setCosts(data.costs ?? []))
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => { loadCosts(); }, []);

  if (!hasPlan("prata")) {
    return (
      <UpgradeGate feature="Cadastro de Produtos" requiredPlan="prata"
        benefits={[
          "Cadastre o custo de cada produto por SKU",
          "Cadastro em massa via planilha Excel",
          "Cálculo automático de lucro líquido por pedido",
          "Margem percentual real por venda",
        ]}
      />
    );
  }

  const validate = () => {
    const e: Record<string, string> = {};
    if (!form.sku.trim()) e.sku = "SKU obrigatório";
    if (!form.name.trim()) e.name = "Nome obrigatório";
    if (!form.cost || isNaN(Number(form.cost)) || Number(form.cost) < 0) e.cost = "Custo inválido";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const resetForm = () => {
    setForm({ sku: "", name: "", cost: "", ean: "", ncm: "", cest: "", codFabricante: "", marca: "" });
    setErrors({});
    setShowMoreFields(false);
  };

  const handleSave = async () => {
    if (!validate()) return;
    setSaving(true);
    try {
      const { data } = await costsApi.create({
        sku: form.sku.trim(), name: form.name.trim(), cost: Number(form.cost),
        ean: form.ean.trim() || undefined,
        ncm: form.ncm.trim() || undefined,
        cest: form.cest.trim() || undefined,
        codFabricante: form.codFabricante.trim() || undefined,
        marca: form.marca.trim() || undefined,
      });
      setCosts((prev) => [data.cost, ...prev]);
      setShowModal(false);
      resetForm();
      window.history.replaceState({}, "", "/dashboard/costs");
    } catch (err: any) {
      setErrors({ sku: err?.response?.data?.message ?? "Erro ao cadastrar produto" });
    } finally { setSaving(false); }
  };

  const handleCloseModal = () => {
    setShowModal(false); resetForm();
    window.history.replaceState({}, "", "/dashboard/costs");
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Remover este produto?")) return;
    await costsApi.delete(id).catch(() => {});
    setCosts((prev) => prev.filter((c) => c.id !== id));
  };

  // ─── Bulk upload handlers ────────────────────────────────────────────────
  const handleFileSelect = async (file: File) => {
    setBulkParseError("");
    setBulkParsing(true);
    try {
      const rows = await parseExcelFile(file);
      if (rows.length === 0) {
        setBulkParseError("Nenhuma linha de dados encontrada na planilha. Verifique se usou o modelo correto.");
        setBulkParsing(false);
        return;
      }
      setBulkRows(rows);
      setBulkStep("preview");
    } catch (err) {
      setBulkParseError("Erro ao ler o arquivo. Confirme que é um arquivo .xlsx válido.");
    } finally {
      setBulkParsing(false);
    }
  };

  const handleBulkSubmit = async () => {
    const validRows = bulkRows.filter((r) => r._valid);
    if (validRows.length === 0) return;
    setBulkSubmitting(true);
    try {
      const { data } = await costsApi.bulkCreate(validRows);
      setBulkResult(data);
      setBulkStep("result");
      loadCosts();
    } catch (err: any) {
      setBulkParseError(err?.response?.data?.message ?? "Erro ao enviar produtos");
    } finally {
      setBulkSubmitting(false);
    }
  };

  const handleCloseBulkModal = () => {
    setShowBulkModal(false);
    setBulkStep("upload");
    setBulkRows([]);
    setBulkResult(null);
    setBulkParseError("");
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const validCount = bulkRows.filter((r) => r._valid).length;
  const invalidCount = bulkRows.length - validCount;
  const cameFromOrders = !!(skuParam || nameParam);

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <p className="text-sm text-muted">{costs.length} produto{costs.length !== 1 ? "s" : ""} cadastrado{costs.length !== 1 ? "s" : ""}</p>
        {canManage && (
          <div className="flex gap-2">
            <Button variant="secondary" size="sm" onClick={() => setShowBulkModal(true)}>
              <Upload size={14} /> Cadastro em Massa
            </Button>
            <Button variant="primary" size="sm" onClick={() => setShowModal(true)}>
              <Plus size={14} /> Cadastrar Produto
            </Button>
          </div>
        )}
      </div>

      <div className="flex flex-col gap-2">
        {loading ? Array.from({ length: 5 }).map((_, i) => <div key={i} className="skeleton h-16 rounded-xl" />) :
         costs.length === 0 ? (
          <div className="bg-bg-3 border border-dashed border-border rounded-xl p-12 text-center">
            <Package size={28} className="text-dim mx-auto mb-3" />
            <p className="text-muted text-sm mb-3">Nenhum produto cadastrado ainda</p>
            {canManage && (
              <div className="flex gap-2 justify-center">
                <Button variant="secondary" size="sm" onClick={() => setShowBulkModal(true)}><Upload size={14} /> Cadastro em Massa</Button>
                <Button variant="primary" size="sm" onClick={() => setShowModal(true)}><Plus size={14} /> Cadastrar Produto</Button>
              </div>
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
                <div className="flex gap-3 text-xs text-dim flex-wrap">
                  <span>Vigente desde {formatDate(cost.validFrom)}</span>
                  {cost.marca && <span>Marca: {cost.marca}</span>}
                  {cost.ean && <span>EAN: {cost.ean}</span>}
                </div>
              </div>
              <div className="text-right flex-shrink-0">
                <div className="font-mono font-bold text-white text-base">{formatCurrency(cost.cost)}</div>
                <div className="text-xs text-dim">custo do produto</div>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <button onClick={() => setExpanded(expanded === cost.id ? null : cost.id)} className="text-dim hover:text-muted transition-colors p-1">
                  {expanded === cost.id ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
                </button>
                {canManage && (
                  <button onClick={() => handleDelete(cost.id)} className="text-dim hover:text-red-400 transition-colors p-1"><Trash2 size={14} /></button>
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
                    <p className="text-[10px] text-dim uppercase tracking-widest mb-2 mt-3 pt-3 border-t border-border/50">Histórico de variação</p>
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

      {/* Modal: cadastro único */}
      <Modal open={showModal} onClose={handleCloseModal} title="Cadastrar Produto" className="max-w-md">
        <div className="flex flex-col gap-4">
          {cameFromOrders && (
            <div className="bg-brand/10 border border-brand/30 rounded-lg px-3 py-2.5">
              <p className="text-xs text-brand">SKU e produto preenchidos automaticamente a partir do pedido. Complete o custo abaixo.</p>
            </div>
          )}
          <Input label="SKU do Produto" placeholder="MLB123456" value={form.sku}
            onChange={(e) => setForm((p) => ({ ...p, sku: e.target.value }))} error={errors.sku} />
          <Input label="Descrição do Produto" placeholder="Tênis Nike Air Max 270" value={form.name}
            onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))} error={errors.name} />
          <Input label="Custo (R$)" type="number" placeholder="89.90" min="0" step="0.01" value={form.cost}
            onChange={(e) => setForm((p) => ({ ...p, cost: e.target.value }))} error={errors.cost} autoFocus={cameFromOrders} />

          <button
            onClick={() => setShowMoreFields((p) => !p)}
            className="flex items-center gap-1.5 text-xs text-muted hover:text-white transition-colors -mt-1"
          >
            {showMoreFields ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
            Mais detalhes (opcional) — EAN, NCM, CEST, marca
          </button>

          {showMoreFields && (
            <div className="flex flex-col gap-3 bg-bg-4 border border-border rounded-lg p-3">
              <div className="grid grid-cols-2 gap-3">
                <Input label="EAN" placeholder="7891234567890" value={form.ean}
                  onChange={(e) => setForm((p) => ({ ...p, ean: e.target.value }))} />
                <Input label="NCM" placeholder="61091000" value={form.ncm}
                  onChange={(e) => setForm((p) => ({ ...p, ncm: e.target.value }))} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <Input label="CEST" placeholder="2800" value={form.cest}
                  onChange={(e) => setForm((p) => ({ ...p, cest: e.target.value }))} />
                <Input label="Cód. Fabricante" placeholder="FAB-001" value={form.codFabricante}
                  onChange={(e) => setForm((p) => ({ ...p, codFabricante: e.target.value }))} />
              </div>
              <Input label="Marca / Fabricante / Importador" placeholder="Marca Exemplo" value={form.marca}
                onChange={(e) => setForm((p) => ({ ...p, marca: e.target.value }))} />
            </div>
          )}

          <p className="text-xs text-dim -mt-1">Este valor será aplicado a todas as vendas deste produto, incluindo as anteriores ao cadastro.</p>
          <div className="flex gap-2 pt-2">
            <Button variant="secondary" className="flex-1" onClick={handleCloseModal}>Cancelar</Button>
            <Button variant="primary" className="flex-1" loading={saving} onClick={handleSave}>Salvar</Button>
          </div>
        </div>
      </Modal>

      {/* Modal: cadastro em massa */}
      <Modal open={showBulkModal} onClose={handleCloseBulkModal} title="Cadastro de Produtos em Massa" className="max-w-2xl">
        {bulkStep === "upload" && (
          <div className="flex flex-col gap-5">
            <div className="bg-bg-4 border border-border rounded-xl p-5">
              <div className="flex items-start gap-3">
                <FileSpreadsheet size={20} className="text-brand flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-semibold text-white mb-1">1. Baixe a planilha modelo</p>
                  <p className="text-xs text-dim mb-3">
                    Use o modelo abaixo para garantir que as colunas sejam reconhecidas corretamente.
                  </p>
                  <Button variant="secondary" size="sm" onClick={downloadTemplate}>
                    <Download size={13} /> Baixar planilha modelo (.xlsx)
                  </Button>
                </div>
              </div>
            </div>

            <div className="bg-bg-4 border border-border rounded-xl p-5">
              <div className="flex items-start gap-3">
                <Upload size={20} className="text-brand flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm font-semibold text-white mb-1">2. Envie a planilha preenchida</p>
                  <p className="text-xs text-dim mb-3">
                    Colunas aceitas: EAN, NCM, CEST, SKU, Cód. Fabricante, Descrição, Marca, Custo do Produto.
                  </p>

                  <label className="flex flex-col items-center justify-center gap-2 border-2 border-dashed border-border rounded-xl py-8 px-4 cursor-pointer hover:border-brand/50 hover:bg-brand/5 transition-colors">
                    {bulkParsing ? (
                      <>
                        <Loader2 size={24} className="text-brand animate-spin" />
                        <span className="text-xs text-muted">Lendo planilha...</span>
                      </>
                    ) : (
                      <>
                        <Upload size={24} className="text-dim" />
                        <span className="text-xs text-muted">Clique para selecionar o arquivo .xlsx</span>
                      </>
                    )}
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept=".xlsx,.xls"
                      className="hidden"
                      disabled={bulkParsing}
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) handleFileSelect(file);
                      }}
                    />
                  </label>
                </div>
              </div>
            </div>

            {bulkParseError && (
              <div className="flex items-center gap-2 text-xs text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2.5">
                <AlertTriangle size={13} /> {bulkParseError}
              </div>
            )}
          </div>
        )}

        {bulkStep === "preview" && (
          <div className="flex flex-col gap-4">
            <div className="flex items-center gap-3 flex-wrap">
              <div className="flex items-center gap-1.5 text-xs text-brand bg-brand/10 border border-brand/30 rounded-lg px-3 py-1.5">
                <CheckCircle size={13} /> {validCount} válido{validCount !== 1 ? "s" : ""}
              </div>
              {invalidCount > 0 && (
                <div className="flex items-center gap-1.5 text-xs text-yellow-400 bg-yellow-500/10 border border-yellow-500/30 rounded-lg px-3 py-1.5">
                  <AlertTriangle size={13} /> {invalidCount} com erro (serão ignorados)
                </div>
              )}
            </div>

            <div className="border border-border rounded-xl overflow-hidden max-h-[320px] overflow-y-auto">
              <table className="w-full text-left">
                <thead className="sticky top-0 bg-bg-4">
                  <tr className="border-b border-border">
                    <th className="px-3 py-2 text-[10px] font-semibold text-dim uppercase">Linha</th>
                    <th className="px-3 py-2 text-[10px] font-semibold text-dim uppercase">SKU</th>
                    <th className="px-3 py-2 text-[10px] font-semibold text-dim uppercase">Descrição</th>
                    <th className="px-3 py-2 text-[10px] font-semibold text-dim uppercase">Custo</th>
                    <th className="px-3 py-2 text-[10px] font-semibold text-dim uppercase">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {bulkRows.map((r) => (
                    <tr key={r._row} className={`border-b border-border/20 ${!r._valid ? "bg-red-500/5" : ""}`}>
                      <td className="px-3 py-2 text-xs font-mono text-dim">{r._row}</td>
                      <td className="px-3 py-2 text-xs font-mono text-muted">{r.sku || "—"}</td>
                      <td className="px-3 py-2 text-xs text-white max-w-[180px] truncate">{r.name || "—"}</td>
                      <td className="px-3 py-2 text-xs font-mono text-muted">{isNaN(r.cost) ? "—" : formatCurrency(r.cost)}</td>
                      <td className="px-3 py-2">
                        {r._valid ? (
                          <span className="text-[10px] text-brand">✓ OK</span>
                        ) : (
                          <span className="text-[10px] text-red-400">{r._error}</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {bulkParseError && (
              <div className="flex items-center gap-2 text-xs text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2.5">
                <AlertTriangle size={13} /> {bulkParseError}
              </div>
            )}

            <div className="flex gap-2 pt-1">
              <Button variant="secondary" className="flex-1" onClick={() => { setBulkStep("upload"); setBulkRows([]); if (fileInputRef.current) fileInputRef.current.value = ""; }}>
                Escolher outro arquivo
              </Button>
              <Button variant="primary" className="flex-1" loading={bulkSubmitting} disabled={validCount === 0} onClick={handleBulkSubmit}>
                Cadastrar {validCount} produto{validCount !== 1 ? "s" : ""}
              </Button>
            </div>
          </div>
        )}

        {bulkStep === "result" && bulkResult && (
          <div className="flex flex-col gap-4">
            <div className="flex flex-col items-center text-center py-4">
              <div className="w-14 h-14 rounded-full bg-brand/15 flex items-center justify-center mb-3">
                <CheckCircle size={28} className="text-brand" />
              </div>
              <p className="font-syne text-lg font-bold text-white mb-1">Importação concluída!</p>
              <p className="text-sm text-muted">
                {bulkResult.created} de {bulkResult.total} produto{bulkResult.total !== 1 ? "s" : ""} cadastrado{bulkResult.created !== 1 ? "s" : ""} com sucesso
              </p>
            </div>

            {bulkResult.errors.length > 0 && (
              <div className="border border-yellow-500/30 bg-yellow-500/5 rounded-xl p-4">
                <p className="text-xs font-semibold text-yellow-400 mb-2">
                  {bulkResult.skipped} item{bulkResult.skipped !== 1 ? "s" : ""} ignorado{bulkResult.skipped !== 1 ? "s" : ""}:
                </p>
                <div className="space-y-1 max-h-[180px] overflow-y-auto">
                  {bulkResult.errors.map((e, i) => (
                    <div key={i} className="text-xs text-muted flex gap-2">
                      <span className="text-dim flex-shrink-0">Linha {e.row}:</span>
                      <span className="truncate">{e.sku} — {e.message}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <Button variant="primary" onClick={handleCloseBulkModal}>Concluir</Button>
          </div>
        )}
      </Modal>
    </div>
  );
}

export default function ProductsPage() {
  return (
    <Suspense fallback={<div className="skeleton h-32 rounded-xl" />}>
      <ProductsPageContent />
    </Suspense>
  );
}