"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { adminApi } from "@/lib/api";

export default function NewClientPage() {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    name: "", email: "", password: "", adminNotes: "", sendEmail: false,
  });

  const set = (k: string, v: string | boolean) => setForm((p) => ({ ...p, [k]: v }));

  const handleSubmit = async () => {
    setError("");
    if (!form.name || !form.email || !form.password) { setError("Preencha todos os campos obrigatórios"); return; }
    setSaving(true);
    try {
      const { data } = await adminApi.createClient({
        name: form.name, email: form.email, password: form.password,
        planSlug: "premium", // sistema de planos desativado — todo cliente tem acesso completo
        adminNotes: form.adminNotes || undefined,
        sendEmail: form.sendEmail,
      });
      router.push(`/admin/clients/${data.client.id}`);
    } catch (err: any) {
      setError(err?.response?.data?.message ?? "Erro ao criar cliente");
    } finally { setSaving(false); }
  };

  return (
    <div className="flex flex-col gap-5 max-w-xl">
      <Link href="/admin/clients" className="flex items-center gap-1.5 text-muted hover:text-white transition-colors text-sm">
        <ArrowLeft size={14} /> Voltar para Clientes
      </Link>

      <div className="bg-bg-3 border border-border rounded-xl p-6">
        <h2 className="font-syne text-lg font-bold text-white mb-6">Criar Novo Cliente</h2>

        <div className="flex flex-col gap-4">
          <div className="grid grid-cols-2 gap-3">
            <Input label="Nome completo *" placeholder="João Silva" value={form.name} onChange={(e) => set("name", e.target.value)} />
            <Input label="E-mail *" type="email" placeholder="joao@empresa.com" value={form.email} onChange={(e) => set("email", e.target.value)} />
          </div>
          <Input label="Senha inicial *" type="password" placeholder="Mínimo 8 caracteres" value={form.password} onChange={(e) => set("password", e.target.value)} />

          <div className="border-t border-border pt-4">
            <label className="text-xs font-medium text-muted block mb-1.5">Observação interna (visível só para admins)</label>
            <textarea value={form.adminNotes} onChange={(e) => set("adminNotes", e.target.value)}
              placeholder="Ex: cliente indicado por parceiro X, observações gerais..."
              className="w-full bg-bg-4 border border-border rounded-lg px-3 py-2.5 text-sm text-white placeholder:text-dim outline-none focus:border-brand/50 resize-none min-h-[80px]" />
          </div>

          <label className="flex items-center gap-2.5 cursor-pointer py-1">
            <input type="checkbox" checked={form.sendEmail} onChange={(e) => set("sendEmail", e.target.checked)} className="accent-brand w-4 h-4" />
            <span className="text-sm text-muted">Enviar credenciais por e-mail após criar</span>
          </label>

          {error && (
            <div className="bg-red-500/10 border border-red-500/30 rounded-lg px-4 py-2.5 text-sm text-red-400">{error}</div>
          )}

          <div className="flex gap-2 pt-2">
            <Link href="/admin/clients" className="flex-1">
              <Button variant="secondary" className="w-full">Cancelar</Button>
            </Link>
            <Button variant="primary" className="flex-1" loading={saving} onClick={handleSubmit}>Criar Cliente</Button>
          </div>
        </div>
      </div>
    </div>
  );
}