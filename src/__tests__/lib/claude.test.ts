import { describe, it, expect, vi, beforeEach } from "vitest";

const mockCreate = vi.hoisted(() => vi.fn());

vi.mock("@anthropic-ai/sdk", () => ({
  default: class {
    messages = { create: mockCreate };
  },
}));

import { analisarPeca } from "@/lib/claude";

const resultadoMock = {
  processo_principal: "usinagem_cnc",
  processos_alternativos: ["microfusão"],
  justificativa: "Tolerâncias apertadas requerem CNC",
  caracteristicas_identificadas: ["furos precisos", "tolerância IT6"],
  consideracoes_tecnicas: "Material adequado para usinagem",
  estimativa_custo_relativo: "médio",
  complexidade: "moderada",
  volume_recomendado: "1 a 500 peças/mês",
  material_sugerido: "Aço SAE 1045",
  material_divergencia: undefined,
  consideracao_material: undefined,
  observacoes: undefined,
};

describe("analisarPeca", () => {
  beforeEach(() => {
    mockCreate.mockReset();
  });

  it("retorna resultado parseado com descrição textual", async () => {
    mockCreate.mockResolvedValue({
      content: [{ type: "text", text: JSON.stringify(resultadoMock) }],
    });

    const resultado = await analisarPeca("Suporte de alumínio com furos roscados M8");
    expect(resultado.processo_principal).toBe("usinagem_cnc");
    expect(resultado.estimativa_custo_relativo).toBe("médio");
    expect(resultado.complexidade).toBe("moderada");
  });

  it("extrai JSON mesmo com texto extra antes e depois", async () => {
    mockCreate.mockResolvedValue({
      content: [
        { type: "text", text: `Aqui está a análise:\n${JSON.stringify(resultadoMock)}\nFim da análise.` },
      ],
    });

    const resultado = await analisarPeca("Peça metálica");
    expect(resultado.processo_principal).toBe("usinagem_cnc");
  });

  it("inclui bloco de imagem quando arquivo de imagem é fornecido", async () => {
    mockCreate.mockResolvedValue({
      content: [{ type: "text", text: JSON.stringify(resultadoMock) }],
    });

    await analisarPeca("Peça com imagem", "base64data==", "image/jpeg");

    const callArgs = mockCreate.mock.calls[0][0];
    const content = callArgs.messages[0].content;
    expect(content).toHaveLength(2);
    expect(content[0].type).toBe("image");
    expect(content[0].source.data).toBe("base64data==");
    expect(content[0].source.media_type).toBe("image/jpeg");
    expect(content[1].type).toBe("text");
  });

  it("não inclui bloco de arquivo quando nenhum arquivo é fornecido", async () => {
    mockCreate.mockResolvedValue({
      content: [{ type: "text", text: JSON.stringify(resultadoMock) }],
    });

    await analisarPeca("Apenas texto");

    const callArgs = mockCreate.mock.calls[0][0];
    const content = callArgs.messages[0].content;
    expect(content).toHaveLength(1);
    expect(content[0].type).toBe("text");
  });

  it("usa o modelo claude-opus-4-7", async () => {
    mockCreate.mockResolvedValue({
      content: [{ type: "text", text: JSON.stringify(resultadoMock) }],
    });

    await analisarPeca("Peça");

    const callArgs = mockCreate.mock.calls[0][0];
    expect(callArgs.model).toBe("claude-opus-4-7");
  });

  it("envia PDF como document block quando mimeType é application/pdf", async () => {
    mockCreate.mockResolvedValue({
      content: [{ type: "text", text: JSON.stringify(resultadoMock) }],
    });

    await analisarPeca("Desenho técnico em PDF", "pdfbase64==", "application/pdf");

    const callArgs = mockCreate.mock.calls[0][0];
    const content = callArgs.messages[0].content;
    expect(content[0].type).toBe("document");
    expect(content[0].source.media_type).toBe("application/pdf");
    expect(content[0].source.data).toBe("pdfbase64==");
  });

  it("lança erro quando resposta não contém bloco de texto", async () => {
    mockCreate.mockResolvedValue({
      content: [{ type: "tool_use", id: "x", name: "tool", input: {} }],
    });

    await expect(analisarPeca("Peça")).rejects.toThrow("Resposta inesperada da IA");
  });

  it("lança erro quando resposta não contém JSON válido", async () => {
    mockCreate.mockResolvedValue({
      content: [{ type: "text", text: "Desculpe, não consigo analisar esta imagem." }],
    });

    await expect(analisarPeca("Peça")).rejects.toThrow("A IA não retornou um JSON válido. Tente novamente.");
  });

  it("retorna campos opcionais de material quando presentes", async () => {
    const mockComMaterial = {
      ...resultadoMock,
      material_divergencia: "Usuário informou Inox 316, desenho especifica SAE 1020",
      consideracao_material: undefined,
    };
    mockCreate.mockResolvedValue({
      content: [{ type: "text", text: JSON.stringify(mockComMaterial) }],
    });

    const resultado = await analisarPeca("Peça com divergência de material");
    expect(resultado.material_divergencia).toBe("Usuário informou Inox 316, desenho especifica SAE 1020");
    expect(resultado.material_sugerido).toBe("Aço SAE 1045");
  });
});
