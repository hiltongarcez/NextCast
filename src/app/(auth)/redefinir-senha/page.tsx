"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

export default function RedefinirSenhaPage() {
  const router = useRouter();
  const [senha, setSenha] = useState("");
  const [confirmar, setConfirmar] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [concluido, setConcluido] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (senha.length < 8) {
      setError("A senha deve ter pelo menos 8 caracteres.");
      return;
    }
    if (senha !== confirmar) {
      setError("As senhas não coincidem.");
      return;
    }

    setLoading(true);
    const supabase = createClient();
    const { error: authError } = await supabase.auth.updateUser({ password: senha });

    if (authError) {
      setError(
        authError.message.includes("same password")
          ? "A nova senha não pode ser igual à senha atual."
          : "Link inválido ou expirado. Solicite um novo link de recuperação."
      );
      setLoading(false);
      return;
    }

    setConcluido(true);
    setLoading(false);
    setTimeout(() => router.push("/dashboard"), 2500);
  }

  return (
    <div className="min-h-screen bg-background bg-grid flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="flex flex-col items-center gap-4 mb-8">
          <img src="/logo.svg" alt="NextCast" className="w-12 h-12 rounded-xl" />
          <div className="text-center">
            <h1 className="font-syne font-bold text-2xl text-text-primary tracking-tight">NextCast</h1>
            <p className="text-sm text-text-secondary mt-1">Redefinição de senha</p>
          </div>
        </div>

        <div className="bg-surface rounded-2xl border border-border shadow-card p-6">
          {concluido ? (
            <div className="flex flex-col items-center gap-4 py-2">
              <div className="w-12 h-12 rounded-full bg-accent/10 flex items-center justify-center">
                <svg className="w-6 h-6 text-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="text-center">
                <h2 className="font-syne font-semibold text-text-primary mb-1">Senha atualizada!</h2>
                <p className="text-sm text-text-secondary">
                  Redirecionando para o dashboard...
                </p>
              </div>
            </div>
          ) : (
            <>
              <h2 className="font-syne font-semibold text-lg text-text-primary mb-2">Nova senha</h2>
              <p className="text-sm text-text-secondary mb-6">
                Escolha uma senha segura com pelo menos 8 caracteres.
              </p>

              <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                <Input
                  label="Nova senha"
                  type="password"
                  placeholder="••••••••"
                  value={senha}
                  onChange={(e) => setSenha(e.target.value)}
                  required
                  autoComplete="new-password"
                />
                <Input
                  label="Confirmar nova senha"
                  type="password"
                  placeholder="••••••••"
                  value={confirmar}
                  onChange={(e) => setConfirmar(e.target.value)}
                  required
                  autoComplete="new-password"
                />

                {error && (
                  <div className="flex items-center gap-2 p-3 rounded-lg bg-error/5 border border-error/20">
                    <svg className="w-4 h-4 text-error flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
                    </svg>
                    <span className="text-sm text-error">{error}</span>
                  </div>
                )}

                {error.includes("expirado") && (
                  <Link
                    href="/esqueci-senha"
                    className="text-sm text-accent hover:underline text-center"
                  >
                    Solicitar novo link →
                  </Link>
                )}

                <Button type="submit" loading={loading} className="w-full mt-2">
                  Redefinir senha
                </Button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
