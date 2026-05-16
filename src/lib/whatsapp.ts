import type { Analise, PROCESSO_LABELS } from "@/types";

export function gerarLinkWhatsApp(
  numero: string,
  analise: Pick<Analise, "id" | "titulo" | "processo_recomendado">,
  processoLabels: typeof PROCESSO_LABELS
): string {
  const processo = analise.processo_recomendado
    ? processoLabels[analise.processo_recomendado]
    : "Indefinido";

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://nextcast.vercel.app";
  const url = `${appUrl}/resultado/${analise.id}`;

  const mensagem = encodeURIComponent(
    `🔩 *NextCast — Nova Análise Concluída*\n\n` +
    `*Peça:* ${analise.titulo}\n` +
    `*Processo Recomendado:* ${processo}\n\n` +
    `Ver resultado completo:\n${url}`
  );

  const numeroLimpo = numero.replace(/\D/g, "");
  return `https://wa.me/${numeroLimpo}?text=${mensagem}`;
}

export function gerarLinkAlertaAdmin(analise: Pick<Analise, "id" | "titulo">): string | null {
  const adminNumero = process.env.WHATSAPP_ADMIN_NUMBER;
  if (!adminNumero) return null;

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://nextcast.vercel.app";
  const url = `${appUrl}/admin/analises`;

  const mensagem = encodeURIComponent(
    `📊 *NextCast — Análise Solicitada*\n\n` +
    `Nova análise: *${analise.titulo}*\n\n` +
    `Ver no painel:\n${url}`
  );

  const numeroLimpo = adminNumero.replace(/\D/g, "");
  return `https://wa.me/${numeroLimpo}?text=${mensagem}`;
}
