"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Badge } from "@/components/ui/Badge";
import { Skeleton } from "@/components/ui/Skeleton";
import type { Comprador } from "@/types";

export default function CompradoresPage() {
  const [compradores, setCompradores] = useState<Comprador[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [senhaTemporal, setSenhaTemporal] = useState("");
  const [togglingId, setTogglingId] = useState<string | null>(null);

  const [form, setForm] = useState({ nome: "", email: "", empresa: "", whatsapp: "" });

  const loadCompradores = useCallback(async () => {
    const res = await fetch("/api/admin/compradores");
    const data = await res.json();
    setCompradores(Array.isArray(data) ? data : []);
    setLoading(false);
  }, []);

  useEffect(() => { loadCompradores(); }, [loadCompradores]);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!form.nome || !form.email) {
      setError("Nome e e-mail são obrigatórios.");
      return;
    }
    setSaving(true);
    setError("");

    try {
      const res = await fetch("/api/admin/compradores", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Erro ao criar comprador.");

      setSenhaTemporal(json.senha_temporaria);
      setForm({ nome: "", email: "", empresa: "", whatsapp: "" });
      setShowForm(false);
      await loadCompradores();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao salvar comprador.");
    } finally {
      setSaving(false);
    }
  }

  async function toggleAtivo(id: string, ativo: boolean) {
    setTogglingId(id);
    try {
      await fetch(`/api/admin/compradores/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ativo: !ativo }),
      });
      await loadCompradores();
    } finally {
      setTogglingId(null);
    }
  }

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="font-syne font-bold text-2xl text-text-primary">Compradores</h1>
          <p className="text-text-secondary mt-1">
            {compradores.length} cadastrado{compradores.length !== 1 ? "s" : ""}
          </p>
        </div>
        <Button onClick={() => { setShowForm(!showForm); setError(""); }}>
          {showForm ? "Cancelar" : "Novo Comprador"}
        </Button>
      </div>

      {senhaTemporal && (
        <div className="mb-6 p-4 rounded-xl border border-accent/30 bg-accent/5 flex items-start justify-between gap-4">
          <div>
            <p className="text-sm font-medium text-text-primary mb-1">Comprador criado com sucesso!</p>
            <p className="text-xs text-text-secondary mb-2">Anote a senha temporária antes de fechar — ela não será exibida novamente.</p>
            <div className="flex items-center gap-2">
              <code className="font-mono text-sm bg-surface-2 border border-border px-3 py-1.5 rounded-lg text-accent tracking-wider">
                {senhaTemporal}
              </code>
              <button
                onClick={() => navigator.clipboard.writeText(senhaTemporal)}
                className="text-xs text-text-secondary hover:text-accent transition-colors"
              >
                Copiar
              </button>
            </div>
          </div>
          <button onClick={() => setSenhaTemporal("")} className="text-text-secondary hover:text-text-primary transition-colors flex-shrink-0">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      )}

      {showForm && (
        <Card className="mb-6">
          <CardHeader>
            <h2 className="font-syne font-semibold text-sm text-text-primary">Cadastrar Comprador</h2>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSave} className="grid grid-cols-2 gap-4">
              <Input
                label="Nome completo"
                value={form.nome}
                onChange={(e) => setForm((f) => ({ ...f, nome: e.target.value }))}
                required
              />
              <Input
                label="E-mail"
                type="email"
                value={form.email}
                onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                required
              />
              <Input
                label="Empresa"
                value={form.empresa}
                onChange={(e) => setForm((f) => ({ ...f, empresa: e.target.value }))}
              />
              <Input
                label="WhatsApp"
                value={form.whatsapp}
                onChange={(e) => setForm((f) => ({ ...f, whatsapp: e.target.value }))}
                placeholder="5511999999999"
              />

              {error && (
                <div className="col-span-2 text-sm text-error p-3 rounded-lg bg-error/5 border border-error/20">
                  {error}
                </div>
              )}

              <div className="col-span-2 flex justify-end gap-3">
                <Button type="button" variant="ghost" onClick={() => setShowForm(false)}>Cancelar</Button>
                <Button type="submit" loading={saving}>Salvar comprador</Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {loading ? (
        <div className="flex flex-col gap-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="rounded-xl border border-border bg-surface p-4 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <Skeleton className="w-10 h-10 rounded-full flex-shrink-0" />
                <div>
                  <Skeleton className="h-4 w-40 mb-1.5" />
                  <Skeleton className="h-3 w-52" />
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Skeleton className="h-5 w-14" />
                <Skeleton className="h-8 w-20" />
              </div>
            </div>
          ))}
        </div>
      ) : compradores.length === 0 ? (
        <div className="text-center py-12 text-text-secondary text-sm">
          Nenhum comprador cadastrado.
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {compradores.map((c) => (
            <Card key={c.id}>
              <CardContent className="flex items-center justify-between py-4">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-surface-2 flex items-center justify-center flex-shrink-0">
                    <span className="font-syne font-bold text-sm text-text-secondary">
                      {c.nome.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-text-primary">{c.nome}</p>
                    {c.email && <p className="text-xs text-text-secondary">{c.email}</p>}
                    {c.empresa && <p className="text-xs text-text-secondary">{c.empresa}</p>}
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <Badge variant={c.ativo ? "success" : "default"}>
                    {c.ativo ? "Ativo" : "Inativo"}
                  </Badge>
                  <Button
                    variant="ghost"
                    size="sm"
                    loading={togglingId === c.id}
                    onClick={() => toggleAtivo(c.id, c.ativo)}
                  >
                    {c.ativo ? "Desativar" : "Ativar"}
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
