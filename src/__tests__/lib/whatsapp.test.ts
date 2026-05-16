import { describe, it, expect } from "vitest";
import { gerarLinkWhatsApp, gerarLinkAlertaAdmin } from "@/lib/whatsapp";
import { PROCESSO_LABELS } from "@/types";

const analise = {
  id: "abc-123",
  titulo: "Suporte de Alumínio",
  processo_recomendado: "usinagem_cnc" as const,
};

describe("gerarLinkWhatsApp", () => {
  it("retorna URL wa.me com número limpo", () => {
    const link = gerarLinkWhatsApp("+55 (11) 99999-9999", analise, PROCESSO_LABELS);
    expect(link).toMatch(/^https:\/\/wa\.me\/5511999999999\?text=/);
  });

  it("inclui o título da peça", () => {
    const link = gerarLinkWhatsApp("5511999999999", analise, PROCESSO_LABELS);
    expect(decodeURIComponent(link)).toContain("Suporte de Alumínio");
  });

  it("inclui o label do processo recomendado", () => {
    const link = gerarLinkWhatsApp("5511999999999", analise, PROCESSO_LABELS);
    expect(decodeURIComponent(link)).toContain("Usinagem CNC");
  });

  it("usa 'Indefinido' quando processo_recomendado é undefined", () => {
    const analise = { id: "abc-123", titulo: "Peça", processo_recomendado: undefined };
    const link = gerarLinkWhatsApp("5511999999999", analise, PROCESSO_LABELS);
    expect(decodeURIComponent(link)).toContain("Indefinido");
  });

  it("inclui a URL do resultado", () => {
    const link = gerarLinkWhatsApp("5511999999999", analise, PROCESSO_LABELS);
    expect(decodeURIComponent(link)).toContain("/resultado/abc-123");
  });

  it("usa NEXT_PUBLIC_APP_URL para montar a URL do resultado", () => {
    process.env.NEXT_PUBLIC_APP_URL = "https://nextcast.vercel.app";
    const link = gerarLinkWhatsApp("5511999999999", analise, PROCESSO_LABELS);
    expect(decodeURIComponent(link)).toContain("https://nextcast.vercel.app/resultado/abc-123");
  });
});

describe("gerarLinkAlertaAdmin", () => {
  it("retorna null quando WHATSAPP_ADMIN_NUMBER não está definido", () => {
    const original = process.env.WHATSAPP_ADMIN_NUMBER;
    delete process.env.WHATSAPP_ADMIN_NUMBER;
    expect(gerarLinkAlertaAdmin({ id: "1", titulo: "Peça" })).toBeNull();
    process.env.WHATSAPP_ADMIN_NUMBER = original;
  });

  it("retorna URL wa.me quando WHATSAPP_ADMIN_NUMBER está definido", () => {
    process.env.WHATSAPP_ADMIN_NUMBER = "5511999999999";
    const link = gerarLinkAlertaAdmin({ id: "1", titulo: "Peça Teste" });
    expect(link).toMatch(/^https:\/\/wa\.me\/5511999999999\?text=/);
    expect(decodeURIComponent(link!)).toContain("Peça Teste");
  });

  it("limpa caracteres não numéricos do número admin", () => {
    process.env.WHATSAPP_ADMIN_NUMBER = "+55 (11) 98765-4321";
    const link = gerarLinkAlertaAdmin({ id: "1", titulo: "Teste" });
    expect(link).toMatch(/^https:\/\/wa\.me\/5511987654321\?text=/);
  });

  it("inclui URL do painel admin", () => {
    process.env.WHATSAPP_ADMIN_NUMBER = "5511999999999";
    process.env.NEXT_PUBLIC_APP_URL = "https://nextcast.vercel.app";
    const link = gerarLinkAlertaAdmin({ id: "1", titulo: "Teste" });
    expect(decodeURIComponent(link!)).toContain("/admin/analises");
  });
});
