import { vi } from "vitest";

/**
 * Cria um mock para o query builder encadeável do Supabase.
 * Suporta tanto `.single()` quanto awaitar a chain diretamente (para count queries).
 */
export function createChain(resolveWith: unknown) {
  const chain: Record<string, unknown> = {
    single: vi.fn().mockResolvedValue(resolveWith),
    then: (resolve: (v: unknown) => unknown, reject?: (e: unknown) => unknown) =>
      Promise.resolve(resolveWith).then(resolve, reject),
  };
  const builderMethods = [
    "select", "eq", "gte", "lte", "update", "insert", "order",
    "range", "limit", "ilike", "not", "upsert",
  ];
  builderMethods.forEach((m) => { chain[m] = vi.fn().mockReturnValue(chain); });
  return chain;
}

export function mockStorage() {
  return {
    from: vi.fn().mockReturnValue({
      upload: vi.fn().mockResolvedValue({ data: { path: "test/file.jpg" }, error: null }),
      getPublicUrl: vi.fn().mockReturnValue({ data: { publicUrl: "https://cdn.example.com/file.jpg" } }),
    }),
  };
}
