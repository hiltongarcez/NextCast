"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { Card, CardContent, CardHeader } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";

export default function PerfilPage() {
  const [nome, setNome] = useState("");
  const [empresa, setEmpresa] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    async function fetchPerfil() {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data } = await supabase
        .from("compradores")
        .select("nome, empresa, whatsapp")
        .eq("id", user.id)
        .single();
      if (data) {
        setNome(data.nome ?? "");
        setEmpresa(data.empresa ?? "");
        setWhatsapp(data.whatsapp ?? "");
      }
      setLoading(false);
    }
    fetchPerfil();
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!nome.trim()) {
      setError("O nome é obrigatório.");
      return;
    }
    setError("");
    setSaving(true);
    setSuccess(false);

    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Não autenticado.");

      const { error: dbError } = await supabase
        .from("compradores")
        .update({ nome: nome.trim(), empresa: empresa.trim() || null, whatsapp: whatsapp.trim() || null })
        .eq("id", user.id);

      if (dbError) throw new Error(dbError.message);
      setSuccess(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao salvar. Tente novamente.");
    } finally {
      setSaving(false);
    }
  }

  if (loading) return null;

  return (
    <div className="p-8 max-w-lg">
      <div className="mb-8">
        <h1 className="font-syne font-bold text-2xl text-text-primary">Meu Perfil</h1>
        <p className="text-text-secondary mt-1">Atualize suas informações de contato.</p>
      </div>

      <form onSubmit={handleSubmit}>
        <Card>
          <CardHeader>
            <h2 className="font-syne font-semibold text-text-primary text-sm">Dados pessoais</h2>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <Input
              label="Nome completo"
              placeholder="Seu nome"
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              required
            />
            <Input
              label="Empresa"
              placeholder="Nome da empresa (opcional)"
              value={empresa}
              onChange={(e) => setEmpresa(e.target.value)}
            />
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-text-secondary">WhatsApp</label>
              <input
                type="tel"
                className="w-full px-3.5 py-2.5 rounded-lg text-sm font-sans bg-surface-2 border border-border text-text-primary placeholder-muted transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent/60"
                placeholder="5511999999999"
                value={whatsapp}
                onChange={(e) => setWhatsapp(e.target.value)}
              />
              <p className="text-xs text-text-secondary">Formato internacional sem + (ex: 5511999999999)</p>
            </div>

            {error && (
              <div className="flex items-center gap-2 p-3 rounded-lg bg-error/5 border border-error/20">
                <svg className="w-4 h-4 text-error flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
                </svg>
                <span className="text-sm text-error">{error}</span>
              </div>
            )}

            {success && (
              <div className="flex items-center gap-2 p-3 rounded-lg bg-success/5 border border-success/20">
                <svg className="w-4 h-4 text-success flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span className="text-sm text-success">Perfil atualizado com sucesso.</span>
              </div>
            )}

            <Button type="submit" loading={saving}>
              {saving ? "Salvando..." : "Salvar alterações"}
            </Button>
          </CardContent>
        </Card>
      </form>
    </div>
  );
}
