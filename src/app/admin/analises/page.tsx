import { createAdminClient } from "@/lib/supabase/admin";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/Card";
import { Badge, StatusBadge } from "@/components/ui/Badge";
import { PROCESSO_LABELS } from "@/types";
import type { Analise } from "@/types";

const PAGE_SIZE = 20;

type Filtro = "todos" | "cotacao" | "concluida" | "processando" | "erro";

const FILTROS: { value: Filtro; label: string }[] = [
  { value: "todos", label: "Todas" },
  { value: "cotacao", label: "Cotação solicitada" },
  { value: "concluida", label: "Concluídas" },
  { value: "processando", label: "Processando" },
  { value: "erro", label: "Erro" },
];

export default async function AdminAnalisesPage({
  searchParams,
}: {
  searchParams: Promise<{ pagina?: string; filtro?: string }>;
}) {
  const supabase = createAdminClient();

  const { pagina: paginaParam, filtro: filtroParam } = await searchParams;
  const pagina = Math.max(1, Number(paginaParam ?? 1));
  const filtro: Filtro = (FILTROS.find((f) => f.value === filtroParam)?.value) ?? "todos";
  const from = (pagina - 1) * PAGE_SIZE;
  const to = from + PAGE_SIZE - 1;

  function buildQuery(forCount = false) {
    let q = supabase
      .from("analises")
      .select(
        forCount ? "*" : "id, titulo, status, processo_recomendado, cotacao_solicitada, created_at, comprador:compradores(nome, empresa)",
        forCount ? { count: "exact", head: true } : undefined
      );

    if (filtro === "cotacao") q = (q as any).eq("cotacao_solicitada", true);
    else if (filtro !== "todos") q = (q as any).eq("status", filtro);

    return q;
  }

  const [{ data: analises }, { count: total }] = await Promise.all([
    buildQuery().order("created_at", { ascending: false }).range(from, to),
    buildQuery(true),
  ]);

  const totalPaginas = Math.ceil((total ?? 0) / PAGE_SIZE);

  function filtroHref(f: Filtro) {
    return `/admin/analises?filtro=${f}`;
  }

  return (
    <div className="p-8">
      <div className="mb-6">
        <h1 className="font-syne font-bold text-2xl text-text-primary">Todas as Análises</h1>
        <p className="text-text-secondary mt-1">
          {total ?? 0} análise{(total ?? 0) !== 1 ? "s" : ""}
          {filtro !== "todos" ? ` · filtro: ${FILTROS.find((f) => f.value === filtro)?.label}` : ""}
        </p>
      </div>

      {/* Filtros */}
      <div className="flex items-center gap-2 mb-6 flex-wrap">
        {FILTROS.map((f) => (
          <Link
            key={f.value}
            href={filtroHref(f.value)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all duration-150 ${
              filtro === f.value
                ? "border-accent/60 bg-accent/10 text-accent"
                : "border-border text-text-secondary hover:border-accent/30 hover:text-text-primary"
            }`}
          >
            {f.value === "cotacao" && (
              <span className="inline-block w-1.5 h-1.5 rounded-full bg-yellow-400 mr-1.5 align-middle" />
            )}
            {f.label}
          </Link>
        ))}
      </div>

      {!analises || analises.length === 0 ? (
        <div className="text-center py-16 text-text-secondary text-sm">
          Nenhuma análise encontrada.
        </div>
      ) : (
        <>
          <div className="flex flex-col gap-2">
            {analises.map((analise: Analise) => {
              const comprador = analise.comprador as { nome: string; empresa?: string } | null;
              return (
                <Link key={analise.id} href={`/resultado/${analise.id}`}>
                  <Card className="hover:border-accent/30 transition-all duration-150 cursor-pointer group">
                    <CardContent className="flex items-center gap-4 py-3.5">
                      {/* Comprador + título */}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-text-primary group-hover:text-accent transition-colors truncate">
                          {analise.titulo}
                        </p>
                        {comprador && (
                          <p className="text-xs text-text-secondary truncate">
                            {comprador.nome}
                            {comprador.empresa && (
                              <span className="text-muted"> · {comprador.empresa}</span>
                            )}
                          </p>
                        )}
                      </div>

                      {/* Badges + data */}
                      <div className="flex items-center gap-2 flex-shrink-0">
                        {analise.cotacao_solicitada && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-yellow-400/10 border border-yellow-400/30 text-yellow-400">
                            <span className="w-1.5 h-1.5 rounded-full bg-yellow-400" />
                            Cotação
                          </span>
                        )}
                        {analise.processo_recomendado && (
                          <Badge variant="processo" processo={analise.processo_recomendado}>
                            {PROCESSO_LABELS[analise.processo_recomendado]}
                          </Badge>
                        )}
                        <StatusBadge status={analise.status} />
                        <span className="text-xs text-muted font-mono hidden lg:block w-20 text-right">
                          {new Date(analise.created_at).toLocaleDateString("pt-BR")}
                        </span>
                        <svg
                          className="w-4 h-4 text-muted group-hover:text-accent transition-colors"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              );
            })}
          </div>

          {totalPaginas > 1 && (
            <div className="flex items-center justify-between mt-6 pt-6 border-t border-border">
              <span className="text-xs text-text-secondary font-mono">
                Página {pagina} de {totalPaginas}
              </span>
              <div className="flex gap-2">
                {pagina > 1 && (
                  <Link
                    href={`/admin/analises?filtro=${filtro}&pagina=${pagina - 1}`}
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
                    href={`/admin/analises?filtro=${filtro}&pagina=${pagina + 1}`}
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
