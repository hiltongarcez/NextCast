import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";
import { createChain } from "@/test/mock-chain";

vi.mock("@/lib/supabase/server");
vi.mock("@/lib/supabase/admin");

import { POST } from "@/app/api/admin/compradores/route";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

function makeUserSupabase(role: "admin" | "comprador" | null) {
  const user = role !== null ? { id: "user-1", email: "admin@test.com" } : null;
  const perfil = role ? { data: { role }, error: null } : { data: null, error: null };

  return {
    auth: { getUser: vi.fn().mockResolvedValue({ data: { user } }) },
    from: vi.fn().mockReturnValue(createChain(perfil)),
  };
}

function makeAdminSupabase(createUserResult: unknown) {
  return {
    auth: {
      admin: {
        createUser: vi.fn().mockResolvedValue(createUserResult),
      },
    },
    from: vi.fn().mockReturnValue(createChain({ data: null, error: null })),
  };
}

function makeRequest(body: Record<string, unknown>) {
  return { json: vi.fn().mockResolvedValue(body) } as unknown as NextRequest;
}

describe("POST /api/admin/compradores", () => {
  beforeEach(() => {
    vi.mocked(createClient).mockReset();
    vi.mocked(createAdminClient).mockReset();
  });

  it("retorna 403 quando não há usuário autenticado", async () => {
    vi.mocked(createClient).mockResolvedValue(makeUserSupabase(null) as never);

    const res = await POST(makeRequest({ nome: "Teste", email: "t@t.com" }));

    expect(res.status).toBe(403);
    const body = await res.json();
    expect(body.error).toBe("Acesso negado");
  });

  it("retorna 403 quando usuário não é admin", async () => {
    vi.mocked(createClient).mockResolvedValue(makeUserSupabase("comprador") as never);

    const res = await POST(makeRequest({ nome: "Teste", email: "t@t.com" }));

    expect(res.status).toBe(403);
    const body = await res.json();
    expect(body.error).toBe("Acesso negado");
  });

  it("retorna 400 quando nome é omitido", async () => {
    vi.mocked(createClient).mockResolvedValue(makeUserSupabase("admin") as never);

    const res = await POST(makeRequest({ email: "t@t.com" }));

    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toContain("obrigatórios");
  });

  it("retorna 400 quando email é omitido", async () => {
    vi.mocked(createClient).mockResolvedValue(makeUserSupabase("admin") as never);

    const res = await POST(makeRequest({ nome: "Teste" }));

    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toContain("obrigatórios");
  });

  it("retorna 400 com mensagem de erro quando createUser falha", async () => {
    vi.mocked(createClient).mockResolvedValue(makeUserSupabase("admin") as never);
    vi.mocked(createAdminClient).mockReturnValue(
      makeAdminSupabase({ data: null, error: { message: "Email já cadastrado" } }) as never
    );

    const res = await POST(makeRequest({ nome: "Teste", email: "dup@t.com" }));

    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toBe("Email já cadastrado");
  });

  it("retorna senha_temporaria com 12 caracteres em caso de sucesso", async () => {
    vi.mocked(createClient).mockResolvedValue(makeUserSupabase("admin") as never);
    vi.mocked(createAdminClient).mockReturnValue(
      makeAdminSupabase({ data: { user: { id: "new-user-1" } }, error: null }) as never
    );

    const res = await POST(makeRequest({ nome: "João Silva", email: "joao@empresa.com" }));

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(typeof body.senha_temporaria).toBe("string");
    expect(body.senha_temporaria).toHaveLength(12);
  });

  it("cria usuário com email_confirm: true", async () => {
    const mockCreateUser = vi.fn().mockResolvedValue({
      data: { user: { id: "new-user-1" } },
      error: null,
    });
    vi.mocked(createClient).mockResolvedValue(makeUserSupabase("admin") as never);
    vi.mocked(createAdminClient).mockReturnValue({
      auth: { admin: { createUser: mockCreateUser } },
      from: vi.fn().mockReturnValue(createChain({ data: null, error: null })),
    } as never);

    await POST(makeRequest({ nome: "João", email: "joao@test.com", empresa: "Empresa Ltda" }));

    const callArgs = mockCreateUser.mock.calls[0][0];
    expect(callArgs.email_confirm).toBe(true);
    expect(callArgs.email).toBe("joao@test.com");
    expect(callArgs.user_metadata.nome).toBe("João");
    expect(callArgs.user_metadata.empresa).toBe("Empresa Ltda");
  });
});
