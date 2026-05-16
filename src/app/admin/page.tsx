import { createAdminClient } from "@/lib/supabase/admin";
import { Card, CardContent } from "@/components/ui/Card";
import { PROCESSO_LABELS } from "@/types";
import type { ProcessoFabricacao, ResultadoIA } from "@/types";

export default async function AdminPage() {
  const supabase = createAdminClient();

  const [
    { count: totalCompradores },
    { count: totalAnalises },
    { count: concluidas },
    { count: processando },
    { data: processos },
    { data: recentes },
  ] = await Promise.all([
    supabase.from("compradores").select("*", { count: "exact", head: true }),
    supabase.from("analises").select("*", { count: "exact", head: true }),
    supabase.from("analises").select("*", { count: "exact", head: true }).eq("status", "concluida"),
    supabase.from("analises").select("*", { count: "exact", head: true }).eq("status", "processando"),
    supabase.from("analises").select("resultado_ia").eq("status", "concluida"),
    supabase
      .from("analises")
      .select("id, titulo, status, created_at, comprador:compradores(nome)")
      .order("created_at", { ascending: false })
      .limit(5),
  ]);

  // Processo mais recomendado
  const counts: Partial<Record<ProcessoFabricacao, number>> = {};
  for (const a of processos ?? []) {
    const p = (a.resultado_ia as ResultadoIA)?.processo_principal;
    if (p) counts[p] = (counts[p] ?? 0) + 1;
  }
  const processoTop = Object.entries(counts).sort((a, b) => b[1] - a[1])[0]?.[0] as ProcessoFabricacao | undefined;

  const stats = [
    { label: "Compradores", value: totalCompradores ?? 0, color: "text-accent", bg: "bg-accent/10",
      icon: <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" /></svg> },
    { label: "Total de Análises", value: totalAnalises ?? 0, color: "text-success", bg: "bg-success/10",
      icon: <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25z" /></svg> },
    { label: "Concluídas", value: concluidas ?? 0, color: "text-success", bg: "bg-success/10",
      icon: <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg> },
    { label: "Em Processamento", value: processando ?? 0, color: "text-warning", bg: "bg-warning/10",
      icon: <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" /></svg> },
  ];

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="font-syne font-bold text-2xl text-text-primary">Painel Admin</h1>
        <p className="text-text-secondary mt-1">Visão geral da plataforma NextCast</p>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-8">
        {stats.map((stat) => (
          <Card key={stat.label}>
            <CardContent className="flex items-center gap-4">
              <div className={`w-10 h-10 rounded-lg ${stat.bg} flex items-center justify-center ${stat.color}`}>
                {stat.icon}
              </div>
              <div>
                <p className="text-text-secondary text-xs">{stat.label}</p>
                <p className={`font-syne font-bold text-2xl ${stat.color}`}>{stat.value}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {processoTop && (
        <Card glow className="mb-8">
          <CardContent className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center text-accent">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z" />
              </svg>
            </div>
            <div>
              <p className="text-xs text-text-secondary">Processo mais recomendado</p>
              <p className="font-syne font-semibold text-text-primary">{PROCESSO_LABELS[processoTop]}</p>
            </div>
          </CardContent>
        </Card>
      )}

      <div>
        <h2 className="font-syne font-semibold text-text-primary mb-4">Análises recentes</h2>
        <div className="flex flex-col gap-2">
          {recentes?.map((a) => (
            <Card key={a.id}>
              <CardContent className="flex items-center justify-between py-3">
                <div>
                  <p className="text-sm font-medium text-text-primary">{a.titulo}</p>
                  <p className="text-xs text-text-secondary mt-0.5">
                    {(Array.isArray(a.comprador) ? a.comprador[0] : a.comprador as { nome: string } | null)?.nome ?? "—"}
                  </p>
                </div>
                <span className="text-xs text-text-secondary font-mono">
                  {new Date(a.created_at).toLocaleDateString("pt-BR")}
                </span>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
