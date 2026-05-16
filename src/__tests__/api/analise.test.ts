import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";
import { createChain } from "@/test/mock-chain";

vi.mock("@/lib/supabase/server");
vi.mock("@/lib/claude");

import { POST } from "@/app/api/analise/route";
import { createClient } from "@/lib/supabase/server";
import { analisarPeca } from "@/lib/claude";

const USER = { id: "user-1", email: "test@test.com" };

function makeSupabase(options: {
  user?: unknown;
  fromResponses?: unknown[];
} = {}) {
  const { user = USER, fromResponses = [] } = options;
  const mockFrom = vi.fn();

  fromResponses.forEach((res) => {
    mockFrom.mockReturnValueOnce(createChain(res));
  });
  // Fallback para chamadas não esperadas (ex: catch block)
  mockFrom.mockReturnValue(createChain({ data: null, error: null }));

  return {
    auth: { getUser: vi.fn().mockResolvedValue({ data: { user } }) },
    from: mockFrom,
    storage: {
      from: vi.fn().mockReturnValue({
        upload: vi.fn().mockResolvedValue({ data: { path: "test/file.jpg" }, error: null }),
        getPublicUrl: vi.fn().mockReturnValue({ data: { publicUrl: "https://cdn.example.com/file.jpg" } }),
      }),
    },
  };
}

function makeRequest(fields: Record<string, string> = {}) {
  const fd = new FormData();
  Object.entries(fields).forEach(([k, v]) => fd.append(k, v));
  return { formData: vi.fn().mockResolvedValue(fd) } as unknown as NextRequest;
}

describe("POST /api/analise", () => {
  beforeEach(() => {
    vi.mocked(createClient).mockReset();
    vi.mocked(analisarPeca).mockReset();
  });

  it("retorna 401 quando não há usuário autenticado", async () => {
    vi.mocked(createClient).mockResolvedValue(makeSupabase({ user: null }) as never);

    const res = await POST(makeRequest({ analise_id: "a-1" }));

    expect(res.status).toBe(401);
    const body = await res.json();
    expect(body.error).toBe("Não autorizado");
  });

  it("retorna 400 quando analise_id não é enviado", async () => {
    vi.mocked(createClient).mockResolvedValue(makeSupabase() as never);

    const res = await POST(makeRequest({}));

    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toContain("analise_id");
  });

  it("retorna 404 quando análise não pertence ao usuário", async () => {
    vi.mocked(createClient).mockResolvedValue(
      makeSupabase({
        fromResponses: [
          { data: null, error: null }, // ownership check retorna null
        ],
      }) as never
    );

    const res = await POST(makeRequest({ analise_id: "a-1" }));

    expect(res.status).toBe(404);
    const body = await res.json();
    expect(body.error).toBe("Análise não encontrada");
  });

  it("retorna 429 quando o rate limit é atingido", async () => {
    vi.mocked(createClient).mockResolvedValue(
      makeSupabase({
        fromResponses: [
          { data: { id: "a-1", comprador_id: "user-1" }, error: null }, // ownership ✓
          { count: 11, data: null, error: null },                        // rate limit excedido
          { data: null, error: null },                                   // update status erro
        ],
      }) as never
    );

    const res = await POST(makeRequest({ analise_id: "a-1" }));

    expect(res.status).toBe(429);
    const body = await res.json();
    expect(body.error).toContain("10 análises por hora");
  });

  it("retorna 200 com resultado em caso de sucesso", async () => {
    const resultado = {
      processo_principal: "usinagem_cnc",
      processos_alternativos: [],
      justificativa: "Tolerâncias apertadas requerem CNC",
      caracteristicas_identificadas: ["furos precisos"],
      consideracoes_tecnicas: "Material para CNC",
      estimativa_custo_relativo: "médio",
      complexidade: "moderada",
      volume_recomendado: "1–500 peças/mês",
    };

    vi.mocked(createClient).mockResolvedValue(
      makeSupabase({
        fromResponses: [
          { data: { id: "a-1", comprador_id: "user-1" }, error: null }, // ownership ✓
          { count: 3, data: null, error: null },                        // rate limit ok
          { data: null, error: null },                                   // update concluida
        ],
      }) as never
    );
    vi.mocked(analisarPeca).mockResolvedValue(resultado as never);

    const res = await POST(makeRequest({ analise_id: "a-1", titulo: "Suporte CNC" }));

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.resultado.processo_principal).toBe("usinagem_cnc");
  });

  it("chama analisarPeca com título e descrição concatenados", async () => {
    vi.mocked(createClient).mockResolvedValue(
      makeSupabase({
        fromResponses: [
          { data: { id: "a-1", comprador_id: "user-1" }, error: null },
          { count: 0, data: null, error: null },
          { data: null, error: null },
        ],
      }) as never
    );
    vi.mocked(analisarPeca).mockResolvedValue({
      processo_principal: "forjamento",
      processos_alternativos: [],
      justificativa: "Alta resistência",
      caracteristicas_identificadas: [],
      consideracoes_tecnicas: "Forjamento adequado",
      estimativa_custo_relativo: "alto",
      complexidade: "complexa",
      volume_recomendado: "100+ peças/mês",
    } as never);

    await POST(makeRequest({ analise_id: "a-1", titulo: "Eixo Cardã", descricao: "Alta resistência" }));

    const promptArg = vi.mocked(analisarPeca).mock.calls[0][0];
    expect(promptArg).toContain("Eixo Cardã");
    expect(promptArg).toContain("Alta resistência");
  });
});
