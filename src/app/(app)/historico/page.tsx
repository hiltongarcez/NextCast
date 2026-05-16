import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Suspense } from "react";
import { Card, CardContent } from "@/components/ui/Card";
import { Badge, StatusBadge } from "@/components/ui/Badge";
import { Skeleton } from "@/components/ui/Skeleton";
import { HistoricoFiltros } from "@/components/HistoricoFiltros";
import { PROCESSO_LABELS } from "@/types";
import type { Analise } from "@/types";

const PAGE_SIZE = 10;

function buildUrl(pagina: number, busca: string, status: string, processo: string) {
  const p = new URLSearchParams();
  if (busca) p.set("busca", busca);
  if (status) p.set("status", status);
  if (processo) p.set("processo", processo);
  p.set("pagina", String(pagina));
  return `/historico?${p.toString()}`;
}

export default async function HistoricoPage({
  searchParams,
}: {
  searchParams: Promise<{ pagina?: string; busca?: string; status?: string; processo?: string }>;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { pagina: paginaParam, busca = "", status = "", processo = "" } = await searchParams;
  const pagina = Math.max(1, Number(paginaParam ?? 1));
  const from = (pagina - 1) * PAGE_SIZE;
  const to = from + PAGE_SIZE - 1;

  let query = supabase.from("analises").select("*").eq("comprador_id", user.id);
  let countQuery = supabase.from("analises").select("*", { count: "exact", head: true }).eq("comprador_id", user.id);

  if (busca) { query = query.ilike("titulo", `%${busca}%`); countQuery = countQuery.ilike("titulo", `%${busca}%`); }
  if (status) { query = query.eq("status", status); countQuery = countQuery.eq("status", status); }
  if (processo) { query = query.eq("processo_recomendado", processo); countQuery = countQuery.eq("processo_recomendado", processo); }

  const [{ data: analises }, { count: total }] = await Promise.all([
    query.order("created_at", { ascending: false }).range(from, to),
    countQuery,
  ]);

  const totalPaginas = Math.ceil((total ?? 0) / PAGE_SIZE);
  const temFiltro = busca || status || processo;

  return (
    <div className="p-8">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="font-syne font-bold text-2xl text-text-primary">Histórico</h1>
          <p className="text-text-secondary mt-1">
            {total ?? 0} análise{(total ?? 0) !== 1 ? "s" : ""}
            {temFiltro ? " encontradas" : ""}
          </p>
        </div>
        <Link href="/nova-analise">
          <button className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium bg-accent text-background rounded-lg hover:bg-accent-dim transition-colors shadow-glow">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
            Nova Análise
          </button>
        </Link>
      </div>

      <Suspense fallback={
        <div className="flex flex-wrap gap-3 mb-6">
          <Skeleton className="h-9 flex-1 min-w-52" />
          <Skeleton className="h-9 w-40" />
          <Skeleton className="h-9 w-44" />
        </div>
      }>
        <HistoricoFiltros />
      </Suspense>

      {!analises || analises.length === 0 ? (
        <div className="text-center py-24 text-text-secondary">
          <svg className="w-12 h-12 mx-auto mb-4 opacity-30" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <p className="text-sm">
            {temFiltro ? "Nenhuma análise encontrada com esses filtros." : "Nenhuma análise ainda."}
          </p>
          {temFiltro && (
            <Link href="/historico" className="text-xs text-accent hover:underline mt-2 inline-block">
              Limpar filtros
            </Link>
          )}
        </div>
      ) : (
        <>
          <div className="flex flex-col gap-3">
            {analises.map((analise: Analise) => (
              <Link key={analise.id} href={`/resultado/${analise.id}`}>
                <Card className="hover:border-accent/30 transition-all duration-150 cursor-pointer group">
                  <CardContent className="flex items-center gap-4 py-4">
                    <div className="w-10 h-10 rounded-lg bg-surface-2 flex items-center justify-center flex-shrink-0">
                      {analise.arquivo_tipo === "pdf" ? (
                        <svg className="w-5 h-5 text-text-secondary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
                        </svg>
                      ) : (
                        <svg className="w-5 h-5 text-text-secondary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="m2.25 15.75 5.159-5.159a2.25 2.25 0 0 1 3.182 0l5.159 5.159m-1.5-1.5 1.409-1.409a2.25 2.25 0 0 1 3.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 0 0 1.5-1.5V6a1.5 1.5 0 0 0-1.5-1.5H3.75A1.5 1.5 0 0 0 2.25 6v12a1.5 1.5 0 0 0 1.5 1.5Zm10.5-11.25h.008v.008h-.008V8.25Zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Z" />
                        </svg>
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-text-primary group-hover:text-accent transition-colors truncate">
                        {analise.titulo}
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        {analise.processo_recomendado && (
                          <Badge variant="processo" processo={analise.processo_recomendado}>
                            {PROCESSO_LABELS[analise.processo_recomendado]}
                          </Badge>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-4 flex-shrink-0">
                      <StatusBadge status={analise.status} />
                      <span className="text-xs text-text-secondary font-mono hidden sm:block">
                        {new Date(analise.created_at).toLocaleDateString("pt-BR")}
                      </span>
                      <svg className="w-4 h-4 text-muted group-hover:text-accent transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>

          {totalPaginas > 1 && (
            <div className="flex items-center justify-between mt-6 pt-6 border-t border-border">
              <span className="text-xs text-text-secondary font-mono">
                Página {pagina} de {totalPaginas}
              </span>
              <div className="flex gap-2">
                {pagina > 1 && (
                  <Link
                    href={buildUrl(pagina - 1, busca, status, processo)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-lg border border-border text-text-secondary hover:text-text-primary hover:border-accent/40 transition-all"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                    Anterior
                  </Link>
                )}
                {pagina < totalPaginas && (
                  <Link
                    href={buildUrl(pagina + 1, busca, status, processo)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-lg border border-border text-text-secondary hover:text-text-primary hover:border-accent/40 transition-all"
                  >
                    Próxima
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </Link>
                )}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
