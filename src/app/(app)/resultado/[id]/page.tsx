import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { Card, CardContent, CardHeader } from "@/components/ui/Card";
import { Badge, StatusBadge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { PROCESSO_LABELS } from "@/types";
import type { Analise, ResultadoIA } from "@/types";
import { gerarLinkWhatsApp } from "@/lib/whatsapp";
import { ResultadoAutoRefresh } from "@/components/ResultadoAutoRefresh";
import { ResultadoBotoes } from "@/components/ResultadoBotoes";
import { SolicitarCotacaoBtn } from "@/components/SolicitarCotacaoBtn";

const CUSTO_LABEL = { baixo: "Baixo", médio: "Médio", alto: "Alto" };
const COMPLEXIDADE_LABEL = { simples: "Simples", moderada: "Moderada", complexa: "Complexa" };

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  try {
    const adminClient = createAdminClient();
    const { data } = await adminClient
      .from("analises")
      .select("titulo, status, resultado_ia")
      .eq("id", id)
      .single();

    if (!data || data.status !== "concluida") return { title: "Análise — NextCast" };

    const resultado = data.resultado_ia as ResultadoIA | null;
    const processo = resultado?.processo_principal ? PROCESSO_LABELS[resultado.processo_principal] : null;
    const description = processo
      ? `Processo recomendado: ${processo}. Análise gerada pela plataforma NextCast.`
      : "Análise de peça metálica gerada pela plataforma NextCast.";

    return {
      title: `${data.titulo} — NextCast`,
      description,
      openGraph: {
        title: `${data.titulo} — NextCast`,
        description: processo ? `Processo recomendado: ${processo}` : description,
        type: "article",
        siteName: "NextCast",
      },
    };
  } catch {
    return { title: "Análise — NextCast" };
  }
}

export default async function ResultadoPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: analise } = await supabase
    .from("analises")
    .select("*, comprador:compradores(*)")
    .eq("id", id)
    .single();

  if (!analise) notFound();

  if (analise.comprador_id !== user.id) {
    const { data: perfil } = await supabase
      .from("compradores")
      .select("role")
      .eq("id", user.id)
      .single();
    if (perfil?.role !== "admin") redirect("/dashboard");
  }

  const a = analise as Analise;
  const resultado = a.resultado_ia;

  const whatsappLink = a.comprador?.whatsapp
    ? gerarLinkWhatsApp(a.comprador.whatsapp, a, PROCESSO_LABELS)
    : null;

  return (
    <div className="p-8 max-w-3xl">
      <ResultadoAutoRefresh status={a.status} />

      {/* Breadcrumb */}
      <div className="flex items-center gap-3 mb-8 print:hidden">
        <Link
          href="/historico"
          className="flex items-center gap-1.5 text-sm text-text-secondary hover:text-text-primary transition-colors"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
          </svg>
          Histórico
        </Link>
        <span className="text-border">/</span>
        <span className="text-sm text-text-primary truncate max-w-xs">{a.titulo}</span>
      </div>

      {/* Cabeçalho — título visível na impressão */}
      <div className="flex items-start justify-between mb-6 gap-4">
        <div>
          <h1 className="font-syne font-bold text-2xl text-text-primary">{a.titulo}</h1>
          <div className="flex items-center gap-3 mt-2 flex-wrap">
            <StatusBadge status={a.status} />
            <span className="text-xs text-text-secondary font-mono">
              {new Date(a.created_at).toLocaleDateString("pt-BR", {
                day: "2-digit",
                month: "short",
                year: "numeric",
                hour: "2-digit",
                minute: "2-digit",
              })}
            </span>
            {a.material_informado && (
              <span className="inline-flex items-center gap-1.5 text-xs text-text-secondary">
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5M10 11.25h4M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z" />
                </svg>
                {a.material_informado}
              </span>
            )}
          </div>
        </div>

        {/* Botões de ação — ocultos na impressão */}
        <div className="flex items-center gap-2 flex-shrink-0 print:hidden">
          {a.status === "concluida" && (
            <SolicitarCotacaoBtn
              analiseId={a.id}
              jasolicitada={a.cotacao_solicitada ?? false}
            />
          )}
          <ResultadoBotoes />
          {whatsappLink && (
            <a href={whatsappLink} target="_blank" rel="noopener noreferrer">
              <Button variant="secondary" size="sm">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/>
                  <path d="M12 0C5.373 0 0 5.373 0 12c0 2.123.555 4.117 1.527 5.845L0 24l6.345-1.505A11.96 11.96 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 22c-1.89 0-3.667-.494-5.2-1.357l-.373-.218-3.768.894.924-3.673-.242-.385A10 10 0 012 12C2 6.477 6.477 2 12 2s10 4.477 10 10-4.477 10-10 10z"/>
                </svg>
                Compartilhar
              </Button>
            </a>
          )}
        </div>
      </div>

      {a.status === "processando" && (
        <Card>
          <CardContent className="flex flex-col items-center py-12 gap-4">
            <div className="w-12 h-12 rounded-full border-2 border-accent border-t-transparent animate-spin" />
            <p className="text-text-secondary text-sm">Analisando peça com IA...</p>
            <p className="text-text-secondary text-xs">Recarregue a página em alguns instantes.</p>
          </CardContent>
        </Card>
      )}

      {a.status === "erro" && (
        <Card>
          <CardContent className="flex flex-col items-center py-12 gap-4">
            <div className="w-12 h-12 rounded-full bg-error/10 flex items-center justify-center">
              <svg className="w-6 h-6 text-error" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
              </svg>
            </div>
            <p className="text-text-secondary text-sm text-center max-w-sm">
              {a.erro_mensagem ?? "Ocorreu um erro ao processar esta análise."}
            </p>
            <Link href="/nova-analise" className="print:hidden">
              <Button variant="secondary" size="sm">Tentar novamente</Button>
            </Link>
          </CardContent>
        </Card>
      )}

      {a.status === "concluida" && resultado && (
        <div className="flex flex-col gap-5">
          <Card glow>
            <CardHeader>
              <p className="text-xs text-text-secondary font-mono uppercase tracking-wider">Processo Recomendado</p>
            </CardHeader>
            <CardContent className="flex items-center justify-between">
              <div>
                <h2 className="font-syne font-bold text-3xl text-gradient-accent">
                  {PROCESSO_LABELS[resultado.processo_principal]}
                </h2>
                <p className="text-sm text-text-secondary mt-2 max-w-lg">{resultado.justificativa}</p>
              </div>
              <Badge variant="processo" processo={resultado.processo_principal} className="text-sm px-3 py-1">
                {PROCESSO_LABELS[resultado.processo_principal]}
              </Badge>
            </CardContent>
          </Card>

          <div className="grid grid-cols-3 gap-4">
            <Card>
              <CardContent className="text-center py-4">
                <p className="text-xs text-text-secondary mb-1">Custo Relativo</p>
                <p className="font-syne font-semibold text-text-primary capitalize">
                  {CUSTO_LABEL[resultado.estimativa_custo_relativo]}
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="text-center py-4">
                <p className="text-xs text-text-secondary mb-1">Complexidade</p>
                <p className="font-syne font-semibold text-text-primary capitalize">
                  {COMPLEXIDADE_LABEL[resultado.complexidade]}
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="text-center py-4">
                <p className="text-xs text-text-secondary mb-1">Volume Recomendado</p>
                <p className="font-syne font-semibold text-text-primary text-xs">
                  {resultado.volume_recomendado}
                </p>
              </CardContent>
            </Card>
          </div>

          {resultado.material_divergencia && (
            <div className="flex gap-3 p-4 rounded-xl border border-yellow-400/30 bg-yellow-400/5">
              <svg className="w-5 h-5 text-yellow-400 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
              </svg>
              <div>
                <p className="text-sm font-medium text-yellow-400 mb-1">Divergência de material detectada</p>
                <p className="text-sm text-text-secondary leading-relaxed">{resultado.material_divergencia}</p>
              </div>
            </div>
          )}

          {resultado.caracteristicas_identificadas?.length > 0 && (
            <Card>
              <CardHeader>
                <h3 className="font-syne font-semibold text-sm text-text-primary">Características identificadas</h3>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {resultado.caracteristicas_identificadas.map((c, i) => (
                    <Badge key={i} variant="info">{c}</Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader>
              <h3 className="font-syne font-semibold text-sm text-text-primary">Considerações técnicas</h3>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-text-secondary leading-relaxed">{resultado.consideracoes_tecnicas}</p>
              {resultado.material_sugerido && (
                <div className="mt-3 flex items-center gap-2">
                  <span className="text-xs text-text-secondary">Material sugerido:</span>
                  <Badge variant="default">{resultado.material_sugerido}</Badge>
                </div>
              )}
            </CardContent>
          </Card>

          {resultado.processos_alternativos?.length > 0 && (
            <Card>
              <CardHeader>
                <h3 className="font-syne font-semibold text-sm text-text-primary">Processos alternativos</h3>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {resultado.processos_alternativos.map((p) => (
                    <Badge key={p} variant="processo" processo={p}>
                      {PROCESSO_LABELS[p]}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {resultado.observacoes && (
            <Card>
              <CardHeader>
                <h3 className="font-syne font-semibold text-sm text-text-primary">Observações</h3>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-text-secondary leading-relaxed">{resultado.observacoes}</p>
              </CardContent>
            </Card>
          )}

          {resultado.consideracao_material && (
            <Card>
              <CardHeader>
                <h3 className="font-syne font-semibold text-sm text-text-primary">Consideração sobre material</h3>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-text-secondary leading-relaxed">{resultado.consideracao_material}</p>
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}
