import Anthropic from "@anthropic-ai/sdk";
import type { ResultadoIA } from "@/types";

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

const SYSTEM_PROMPT = `Você é um especialista em processos de fabricação de peças metálicas industriais.
Analise a imagem ou descrição fornecida e recomende o processo de fabricação mais adequado.

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
    max_tokens: 1024,
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
  const jsonStr = raw.slice(jsonStart, jsonEnd + 1);

  const resultado = JSON.parse(jsonStr) as ResultadoIA;
  return resultado;
}
