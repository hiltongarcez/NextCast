import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Card, CardContent, CardHeader } from "@/components/ui/Card";
import { StatusBadge } from "@/components/ui/Badge";
import type { Analise, ProcessoFabricacao } from "@/types";
import { PROCESSO_LABELS } from "@/types";
import { AnalisesPorSemana } from "@/components/charts/AnalisesPorSemana";
import { ProcessosDistribuicao } from "@/components/charts/ProcessosDistribuicao";

const MS_SEMANA = 7 * 24 * 60 * 60 * 1000;

function gerarDadosSemana(analises: { created_at: string }[]) {
  const agora = Date.now();
  const dados = Array.from({ length: 8 }, (_, i) => {
    const inicioMs = agora - (7 - i) * MS_SEMANA;
    const label = new Date(inicioMs).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" });
    return { label, inicioMs, total: 0 };
  });

  analises.forEach(({ created_at }) => {
    const ts = new Date(created_at).getTime();
    for (let i = dados.length - 1; i >= 0; i--) {
      if (ts >= dados[i].inicioMs) {
        dados[i].total++;
        break;
      }
    }
  });

  return dados.map(({ label, total }) => ({ label, total }));
}

function gerarDadosProcessos(analises: { processo_recomendado: string | null }[]) {
  const contagem: Record<string, number> = {};
  analises.forEach(({ processo_recomendado }) => {
    if (processo_recomendado) {
      contagem[processo_recomendado] = (contagem[processo_recomendado] ?? 0) + 1;
    }
  });
  return Object.entries(contagem)
    .map(([p, count]) => ({
      processo: PROCESSO_LABELS[p as ProcessoFabricacao] ?? p,
      count,
    }))
    .sort((a, b) => b.count - a.count);
}

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const oitoSemanasAtras = new Date(Date.now() - 8 * MS_SEMANA).toISOString();

  const [
    { count: total },
    { count: concluidas },
    { count: processando },
    { data: analises },
    { data: perfil },
    { data: historico },
    { data: porProcesso },
  ] = await Promise.all([
    supabase.from("analises").select("*", { count: "exact", head: true }).eq("comprador_id", user.id),
    supabase.from("analises").select("*", { count: "exact", head: true }).eq("comprador_id", user.id).eq("status", "concluida"),
    supabase.from("analises").select("*", { count: "exact", head: true }).eq("comprador_id", user.id).eq("status", "processando"),
    supabase.from("analises").select("*").eq("comprador_id", user.id).order("created_at", { ascending: false }).limit(5),
    supabase.from("compradores").select("nome").eq("id", user.id).single(),
    supabase.from("analises").select("created_at").eq("comprador_id", user.id).gte("created_at", oitoSemanasAtras),
    supabase.from("analises").select("processo_recomendado").eq("comprador_id", user.id).eq("status", "concluida"),
  ]);

  const primeiroNome = perfil?.nome?.split(" ")[0] ?? "Bem-vindo";
  const dadosSemana = gerarDadosSemana(historico ?? []);
  const dadosProcessos = gerarDadosProcessos(porProcesso ?? []);
  const mostrarGraficos = (total ?? 0) > 0;

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="font-syne font-bold text-2xl text-text-primary">Olá, {primeiroNome}</h1>
        <p className="text-text-secondary mt-1">Aqui está o resumo das suas análises.</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <Card>
          <CardContent className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center">
              <svg className="w-5 h-5 text-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25z" />
              </svg>
            </div>
            <div>
              <p className="text-text-secondary text-xs">Total de Análises</p>
              <p className="font-syne font-bold text-2xl text-text-primary">{total ?? 0}</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-lg bg-success/10 flex items-center justify-center">
              <svg className="w-5 h-5 text-success" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <p className="text-text-secondary text-xs">Concluídas</p>
              <p className="font-syne font-bold text-2xl text-text-primary">{concluidas ?? 0}</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-lg bg-warning/10 flex items-center justify-center">
              <svg className="w-5 h-5 text-warning" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <p className="text-text-secondary text-xs">Em processamento</p>
              <p className="font-syne font-bold text-2xl text-text-primary">{processando ?? 0}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Gráficos */}
      {mostrarGraficos && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-8">
          <Card>
            <CardHeader>
              <AnalisesPorSemana dados={dadosSemana} />
            </CardHeader>
          </Card>
          <Card>
            <CardHeader>
              <ProcessosDistribuicao dados={dadosProcessos} />
            </CardHeader>
          </Card>
        </div>
      )}

      {/* CTA */}
      <Card glow className="mb-8">
        <CardContent className="flex items-center justify-between">
          <div>
            <h3 className="font-syne font-semibold text-text-primary">Nova análise de peça</h3>
            <p className="text-sm text-text-secondary mt-0.5">
              Envie uma imagem ou PDF e receba a recomendação de processo de fabricação.
            </p>
          </div>
          <Link
            href="/nova-analise"
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium bg-accent text-background rounded-lg hover:bg-accent-dim transition-colors shadow-glow"
          >
            Iniciar análise
          </Link>
        </CardContent>
      </Card>

      {/* Recentes */}
      {analises && analises.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-syne font-semibold text-text-primary">Análises recentes</h2>
            <Link href="/historico" className="text-sm text-accent hover:underline">
              Ver todas
            </Link>
          </div>

          <div className="space-y-3">
            {analises.map((analise: Analise) => (
              <Link key={analise.id} href={`/resultado/${analise.id}`}>
                <Card className="hover:border-accent/30 transition-all duration-150 cursor-pointer">
                  <CardContent className="flex items-center justify-between py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-md bg-surface-2 flex items-center justify-center">
                        <svg className="w-4 h-4 text-text-secondary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
                        </svg>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-text-primary">{analise.titulo}</p>
                        <p className="text-xs text-text-secondary">
                          {analise.processo_recomendado
                            ? PROCESSO_LABELS[analise.processo_recomendado]
                            : "—"}
                        </p>
                      </div>
                    </div>
                    <StatusBadge status={analise.status} />
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      )}

      {(!analises || analises.length === 0) && (
        <div className="text-center py-16 text-text-secondary">
          <svg className="w-12 h-12 mx-auto mb-4 opacity-30" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25z" />
          </svg>
          <p className="text-sm">Nenhuma análise ainda.</p>
          <p className="text-xs mt-1">Crie sua primeira análise de peça metálica.</p>
        </div>
      )}
    </div>
  );
}
