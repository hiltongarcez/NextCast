import type { ProcessoFabricacao } from "@/types";

const PROCESSO_COLORS: Record<ProcessoFabricacao, string> = {
  fundição_areia: "bg-orange-500/10 text-orange-400 border-orange-500/20",
  microfusão: "bg-purple-500/10 text-purple-400 border-purple-500/20",
  usinagem_cnc: "bg-accent/10 text-accent border-accent/20",
  barras_perfis: "bg-green-500/10 text-green-400 border-green-500/20",
  bobinas_estamparia: "bg-yellow-500/10 text-yellow-400 border-yellow-500/20",
  forjamento: "bg-red-500/10 text-red-400 border-red-500/20",
};

interface BadgeProps {
  children: React.ReactNode;
  variant?: "default" | "success" | "warning" | "error" | "info" | "processo";
  processo?: ProcessoFabricacao;
  className?: string;
}

const VARIANT_CLASSES = {
  default: "bg-surface-2 text-text-secondary border-border",
  success: "bg-success/10 text-success border-success/20",
  warning: "bg-warning/10 text-warning border-warning/20",
  error: "bg-error/10 text-error border-error/20",
  info: "bg-accent/10 text-accent border-accent/20",
  processo: "",
};

export function Badge({ children, variant = "default", processo, className = "" }: BadgeProps) {
  const colorClass =
    variant === "processo" && processo
      ? PROCESSO_COLORS[processo]
      : VARIANT_CLASSES[variant];

  return (
    <span
      className={`
        inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium
        border font-mono
        ${colorClass} ${className}
      `}
    >
      {children}
    </span>
  );
}

interface StatusBadgeProps {
  status: "processando" | "concluida" | "erro";
}

export function StatusBadge({ status }: StatusBadgeProps) {
  const map = {
    processando: { label: "Processando", variant: "warning" as const },
    concluida: { label: "Concluída", variant: "success" as const },
    erro: { label: "Erro", variant: "error" as const },
  };

  const { label, variant } = map[status];
  return <Badge variant={variant}>{label}</Badge>;
}
