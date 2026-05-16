import Anthropic from "@anthropic-ai/sdk";
import type { ResultadoIA } from "@/types";

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

const SYSTEM_PROMPT = `Você é um especialista em processos de fabricação de peças metálicas industriais.
Analise a imagem ou descrição fornecida e recomende o processo de fabricação mais adequado.

REGRAS CRÍTICAS PARA ANÁLISE DIMENSIONAL (siga rigorosamente ao analisar desenhos técnicos):
1. Identifique TODAS as cotas de comprimento presentes no desenho, listando cada seção individualmente com seu valor.
2. O comprimento total da peça é SEMPRE a soma de todas as cotas parciais de comprimento — nunca use uma cota de seção isolada como comprimento total.
3. Descreva cada seção dimensional encontrada (ex: "Seção A: 45mm + Seção B: 30mm + Seção C: 25mm = comprimento total: 100mm").
4. Aplique o mesmo raciocínio para diâmetros escalonados, alturas e demais dimensões compostas por múltiplos segmentos.
5. Nunca confunda a cota de um trecho ou detalhe com a dimensão global da peça.

Processos disponíveis:
- fundição_areia: Ideal para peças grandes, geometria complexa, baixo/médio volume
- microfusão: Ideal para peças pequenas, alta precisão dimensional, acabamento fino
- usinagem_cnc: Ideal para peças com tolerâncias apertadas, pequenas séries, geometria precisa
- barras_perfis: Ideal para formas padronizadas (redondos, quadrados, perfis), médio/alto volume
- bobinas_estamparia: Ideal para peças planas, chapas, alto volume, forma regular
- forjamento: Ideal para peças que exigem alta resistência mecânica, esforços dinâmicos

Responda SOMENTE com um JSON válido no seguinte formato, sem markdown, sem explicações fora do JSON:
{
  "processo_principal": "fundição_areia" | "microfusão" | "usinagem_cnc" | "barras_perfis" | "bobinas_estamparia" | "forjamento",
  "processos_alternativos": [],
  "justificativa": "Explicação detalhada da escolha principal",
  "caracteristicas_identificadas": ["característica 1", "característica 2"],
  "consideracoes_tecnicas": "Detalhes técnicos relevantes",
  "estimativa_custo_relativo": "baixo" | "médio" | "alto",
  "complexidade": "simples" | "moderada" | "complexa",
  "volume_recomendado": "Ex: 100 a 10.000 peças/mês",
  "material_sugerido": "Ex: Aço SAE 1045 (opcional)",
  "observacoes": "Observações adicionais (opcional)"
}`;

export async function analisarPeca(
  descricao: string,
  arquivoBase64?: string,
  mimeType?: string
): Promise<ResultadoIA> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const content: any[] = [];

  if (arquivoBase64 && mimeType) {
    if (mimeType === "application/pdf") {
      content.push({
        type: "document",
        source: {
          type: "base64",
          media_type: "application/pdf",
          data: arquivoBase64,
        },
      });
    } else {
      content.push({
        type: "image",
        source: {
          type: "base64",
          media_type: mimeType as "image/jpeg" | "image/png" | "image/webp" | "image/gif",
          data: arquivoBase64,
        },
      });
    }
  }

  content.push({
    type: "text",
    text: descricao || "Analise a peça metálica e recomende o processo de fabricação.",
  });

  const message = await client.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 4096,
    system: SYSTEM_PROMPT,
    messages: [{ role: "user", content }],
  });

  const textBlock = message.content.find((b) => b.type === "text");
  if (!textBlock || textBlock.type !== "text") {
    throw new Error("Resposta inesperada da IA");
  }

  const raw = textBlock.text.trim();
  const jsonStart = raw.indexOf("{");
  const jsonEnd = raw.lastIndexOf("}");

  if (jsonStart === -1 || jsonEnd === -1 || jsonEnd < jsonStart) {
    throw new Error("A IA não retornou um JSON válido. Tente novamente.");
  }

  const jsonStr = raw.slice(jsonStart, jsonEnd + 1);
  const resultado = JSON.parse(jsonStr) as ResultadoIA;
  return resultado;
}
