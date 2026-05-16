export type ProcessoFabricacao =
  | "fundição_areia"
  | "microfusão"
  | "usinagem_cnc"
  | "barras_perfis"
  | "bobinas_estamparia"
  | "forjamento";

export const PROCESSO_LABELS: Record<ProcessoFabricacao, string> = {
  fundição_areia: "Fundição em Areia",
  microfusão: "Microfusão",
  usinagem_cnc: "Usinagem CNC",
  barras_perfis: "Barras / Perfis",
  bobinas_estamparia: "Bobinas / Estamparia",
  forjamento: "Forjamento",
};

export interface Comprador {
  id: string;
  nome: string;
  email?: string;
  empresa?: string;
  whatsapp?: string;
  role: "comprador" | "admin";
  ativo: boolean;
  created_at: string;
}

export interface Analise {
  id: string;
  comprador_id: string;
  titulo: string;
  descricao?: string;
  arquivo_url?: string;
  arquivo_tipo?: "imagem" | "pdf";
  status: "processando" | "concluida" | "erro";
  processo_recomendado?: ProcessoFabricacao;
  processos_alternativos?: ProcessoFabricacao[];
  resultado_ia?: ResultadoIA;
  erro_mensagem?: string;
  cotacao_solicitada?: boolean;
  created_at: string;
  updated_at?: string;
  comprador?: Comprador;
}

export interface ResultadoIA {
  processo_principal: ProcessoFabricacao;
  processos_alternativos: ProcessoFabricacao[];
  justificativa: string;
  caracteristicas_identificadas: string[];
  consideracoes_tecnicas: string;
  estimativa_custo_relativo: "baixo" | "médio" | "alto";
  complexidade: "simples" | "moderada" | "complexa";
  volume_recomendado: string;
  material_sugerido?: string;
  observacoes?: string;
}

export interface AdminUser {
  id: string;
  email: string;
  role: "admin" | "comprador";
}
