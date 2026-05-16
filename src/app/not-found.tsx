import Link from "next/link";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="text-center max-w-sm">
        <p className="font-mono text-6xl font-bold text-accent mb-4">404</p>
        <h1 className="font-syne font-bold text-xl text-text-primary mb-2">
          Página não encontrada
        </h1>
        <p className="text-text-secondary text-sm mb-8">
          A página que você procura não existe ou foi removida.
        </p>
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium bg-accent text-background rounded-lg hover:bg-accent-dim transition-colors"
        >
          Voltar ao início
        </Link>
      </div>
    </div>
  );
}
