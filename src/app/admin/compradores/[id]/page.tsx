import { createAdminClient } from "@/lib/supabase/admin";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Card, CardContent, CardHeader } from "@/components/ui/Card";
import { Badge, StatusBadge } from "@/components/ui/Badge";
import { PROCESSO_LABELS, type ProcessoFabricacao } from "@/types";

export default async function CompradorDetalhePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = createAdminClient();

  const [{ data: comprador }, { data: analises, count: total }] = await Promise.all([
    supabase.from("compradores").select("*").eq("id", id).single(),
    supabase
      .from("analises")
      .select("id, titulo, status, processo_recomendado, cotacao_solicitada, created_at", { count: "exact" })
      .eq("comprador_id", id)
      .order("created_at", { ascending: false }),
  ]);

  if (!comprador) notFound();

  const concluidas = analises?.filter((a) => a.status === "concluida").length ?? 0;
  const processando = analises?.filter((a) => a.status === "processando").length ?? 0;
  const cotacoes = analises?.filter((a) => a.cotacao_solicitada).length ?? 0;

  return (
    <div className="p-8">
      <Link
        href="/admin/compradores"
        className="inline-flex items-center gap-1.5 text-sm text-text-secondary hover:text-text-primary transition-colors mb-6"
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        Compradores
      </Link>

      <div className="flex items-start gap-6 mb-8">
        <div className="w-14 h-14 rounded-full bg-surface-2 border border-border flex items-center justify-center flex-shrink-0">
          <span className="font-syne font-bold text-xl text-text-secondary">
            {comprador.nome.charAt(0).toUpperCase()}
          </span>
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-1">
            <h1 className="font-syne font-bold text-2xl text-text-primary">{comprador.nome}</h1>
            <Badge variant={comprador.ativo ? "success" : "default"}>
              {comprador.ativo ? "Ativo" : "Inativo"}
            </Badge>
          </div>
          <div className="flex items-center gap-4 text-sm text-text-secondary flex-wrap">
            {comprador.email && <span>{comprador.email}</span>}
            {comprador.empresa && (
              <>
                <span className="text-border">·</span>
                <span>{comprador.empresa}</span>
              </>
            )}
            {comprador.whatsapp && (
              <>
                <span className="text-border">·</span>
                <a
                  href={`https://wa.me/${comprador.whatsapp.replace(/\D/g, "")}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-accent hover:underline"
                >
                  {comprador.whatsapp}
                </a>
              </>
            )}
          </div>
          <p className="text-xs text-muted mt-1">
            Cadastrado em {new Date(comprador.created_at).toLocaleDateString("pt-BR", { dateStyle: "long" })}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {[
          { label: "Total de análises", value: total ?? 0 },
          { label: "Concluídas", value: concluidas },
          { label: "Processando", value: processando },
          { label: "Cotações solicitadas", value: cotacoes },
        ].map((kpi) => (
          <Card key={kpi.label}>
            <CardContent className="py-4">
              <p className="text-xs text-text-secondary mb-1">{kpi.label}</p>
              <p className="font-syne font-bold text-2xl text-text-primary">{kpi.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="mb-4">
        <h2 className="font-syne font-semibold text-lg text-text-primary">Análises</h2>
      </div>

      {!analises || analises.length === 0 ? (
        <div className="text-center py-16 text-text-secondary text-sm border border-border rounded-xl">
          Nenhuma análise encontrada.
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {analises.map((analise) => (
            <Link key={analise.id} href={`/resultado/${analise.id}`}>
              <Card className="hover:border-accent/30 transition-all duration-150 cursor-pointer group">
                <CardContent className="flex items-center gap-4 py-3.5">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-text-primary group-hover:text-accent transition-colors truncate">
                      {analise.titulo}
                    </p>
                    <p className="text-xs text-muted font-mono">
                      {new Date(analise.created_at).toLocaleDateString("pt-BR")}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    {analise.cotacao_solicitada && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-yellow-400/10 border border-yellow-400/30 text-yellow-400">
                        <span className="w-1.5 h-1.5 rounded-full bg-yellow-400" />
                        Cotação
                      </span>
                    )}
                    {analise.processo_recomendado && (
                      <Badge variant="processo" processo={analise.processo_recomendado as ProcessoFabricacao}>
                        {PROCESSO_LABELS[analise.processo_recomendado as ProcessoFabricacao]}
                      </Badge>
                    )}
                    <StatusBadge status={analise.status} />
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
          ))}
        </div>
      )}
    </div>
  );
}
