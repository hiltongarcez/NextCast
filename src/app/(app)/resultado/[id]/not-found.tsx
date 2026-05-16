import Link from "next/link";

export default function ResultadoNotFound() {
  return (
    <div className="p-8 flex flex-col items-center justify-center min-h-[60vh] text-center">
      <p className="font-mono text-4xl font-bold text-accent mb-3">404</p>
      <h1 className="font-syne font-bold text-xl text-text-primary mb-2">
        Análise não encontrada
      </h1>
      <p className="text-text-secondary text-sm mb-8">
        Esta análise não existe ou você não tem permissão para acessá-la.
      </p>
      <Link
        href="/historico"
        className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium bg-surface-2 text-text-primary border border-border rounded-lg hover:border-accent/40 transition-colors"
      >
        Ver histórico
      </Link>
    </div>
  );
}
