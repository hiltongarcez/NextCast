"use client";

import { useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

export default function EsqueciSenhaPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [enviado, setEnviado] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const supabase = createClient();
    const redirectTo = `${window.location.origin}/auth/callback?next=/redefinir-senha`;

    const { error: authError } = await supabase.auth.resetPasswordForEmail(email.trim(), {
      redirectTo,
    });

    if (authError) {
      setError("Não foi possível enviar o e-mail. Verifique o endereço e tente novamente.");
      setLoading(false);
      return;
    }

    setEnviado(true);
    setLoading(false);
  }

  return (
    <div className="min-h-screen bg-background bg-grid flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="flex flex-col items-center gap-4 mb-8">
          <img src="/logo.svg" alt="NextCast" className="w-12 h-12 rounded-xl" />
          <div className="text-center">
            <h1 className="font-syne font-bold text-2xl text-text-primary tracking-tight">NextCast</h1>
            <p className="text-sm text-text-secondary mt-1">Recuperação de senha</p>
          </div>
        </div>

        <div className="bg-surface rounded-2xl border border-border shadow-card p-6">
          {enviado ? (
            <div className="flex flex-col items-center gap-4 py-2">
              <div className="w-12 h-12 rounded-full bg-accent/10 flex items-center justify-center">
                <svg className="w-6 h-6 text-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
                </svg>
              </div>
              <div className="text-center">
                <h2 className="font-syne font-semibold text-text-primary mb-1">E-mail enviado!</h2>
                <p className="text-sm text-text-secondary leading-relaxed">
                  Verifique a caixa de entrada de <strong className="text-text-primary">{email}</strong> e
                  clique no link para redefinir sua senha.
                </p>
                <p className="text-xs text-text-secondary mt-2">
                  Não recebeu? Verifique o spam ou aguarde alguns minutos.
                </p>
              </div>
              <Link href="/login" className="text-sm text-accent hover:underline mt-2">
                Voltar ao login
              </Link>
            </div>
          ) : (
            <>
              <h2 className="font-syne font-semibold text-lg text-text-primary mb-2">Esqueceu a senha?</h2>
              <p className="text-sm text-text-secondary mb-6">
                Informe seu e-mail e enviaremos um link para redefinir sua senha.
              </p>

              <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                <Input
                  label="E-mail"
                  type="email"
                  placeholder="seu@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoComplete="email"
                />

                {error && (
                  <div className="flex items-center gap-2 p-3 rounded-lg bg-error/5 border border-error/20">
                    <svg className="w-4 h-4 text-error flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
                    </svg>
                    <span className="text-sm text-error">{error}</span>
                  </div>
                )}

                <Button type="submit" loading={loading} className="w-full mt-2">
                  Enviar link de recuperação
                </Button>
              </form>
            </>
          )}
        </div>

        {!enviado && (
          <p className="text-center text-sm text-text-secondary mt-6">
            Lembrou a senha?{" "}
            <Link href="/login" className="text-accent hover:underline">
              Entrar
            </Link>
          </p>
        )}
      </div>
    </div>
  );
}
