import { Resend } from "resend";
import { PROCESSO_LABELS } from "@/types";
import type { ResultadoIA } from "@/types";

const FROM = process.env.RESEND_FROM ?? "NextCast <noreply@nextcast.com.br>";

function wrapLayout(content: string): string {
  return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background-color:#f4f4f5;font-family:Arial,sans-serif">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f4f4f5">
    <tr>
      <td align="center" style="padding:40px 20px">
        <table width="100%" cellpadding="0" cellspacing="0" style="max-width:600px">
          <tr>
            <td style="background-color:#0a0c10;padding:24px 32px;border-radius:8px 8px 0 0">
              <span style="font-size:20px;font-weight:bold;color:#ffffff;font-family:Arial,sans-serif">
                Next<span style="color:#00c2ff">Cast</span>
              </span>
            </td>
          </tr>
          ${content}
          <tr>
            <td style="background-color:#f8fafc;padding:16px 32px;border-radius:0 0 8px 8px;border-top:1px solid #e2e8f0">
              <p style="margin:0;font-size:12px;color:#9ca3af;text-align:center;font-family:Arial,sans-serif">
                NextCast — Plataforma de recomendação de processos industriais
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

export async function enviarEmailAnalise({
  para,
  nome,
  titulo,
  analiseId,
  resultado,
}: {
  para: string;
  nome: string;
  titulo: string;
  analiseId: string;
  resultado: ResultadoIA;
}) {
  if (!process.env.RESEND_API_KEY) return;
  const resend = new Resend(process.env.RESEND_API_KEY);

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://nextcast.vercel.app";
  const url = `${appUrl}/resultado/${analiseId}`;
  const processo = PROCESSO_LABELS[resultado.processo_principal];
  const custoLabel = { baixo: "Baixo", médio: "Médio", alto: "Alto" }[resultado.estimativa_custo_relativo];
  const complexLabel = { simples: "Simples", moderada: "Moderada", complexa: "Complexa" }[resultado.complexidade];

  const html = wrapLayout(`
    <tr>
      <td style="background-color:#ffffff;padding:32px">
        <h2 style="margin:0 0 8px;color:#111827;font-size:22px;font-weight:bold">Sua análise está pronta!</h2>
        <p style="color:#6b7280;margin:0 0 24px;font-size:14px">
          Olá, ${nome}. A análise da peça <strong>${titulo}</strong> foi concluída com sucesso.
        </p>

        <table width="100%" cellpadding="0" cellspacing="0" style="background:#f0f9ff;border:1px solid #bae6fd;border-radius:8px;margin-bottom:20px">
          <tr>
            <td style="padding:20px">
              <p style="margin:0 0 4px;font-size:11px;color:#0369a1;text-transform:uppercase;letter-spacing:0.08em;font-weight:bold">
                Processo Recomendado
              </p>
              <p style="margin:0 0 8px;font-size:24px;font-weight:bold;color:#0c4a6e">${processo}</p>
              <p style="margin:0;font-size:13px;color:#374151;line-height:1.5">${resultado.justificativa}</p>
            </td>
          </tr>
        </table>

        <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:24px">
          <tr>
            <td width="33%" style="padding-right:8px">
              <table width="100%" cellpadding="0" cellspacing="0" style="background:#f9fafb;border:1px solid #e5e7eb;border-radius:6px">
                <tr><td style="padding:12px;text-align:center">
                  <p style="margin:0 0 2px;font-size:10px;color:#9ca3af;text-transform:uppercase;letter-spacing:0.05em">Custo</p>
                  <p style="margin:0;font-size:14px;font-weight:bold;color:#111827">${custoLabel}</p>
                </td></tr>
              </table>
            </td>
            <td width="33%" style="padding:0 4px">
              <table width="100%" cellpadding="0" cellspacing="0" style="background:#f9fafb;border:1px solid #e5e7eb;border-radius:6px">
                <tr><td style="padding:12px;text-align:center">
                  <p style="margin:0 0 2px;font-size:10px;color:#9ca3af;text-transform:uppercase;letter-spacing:0.05em">Complexidade</p>
                  <p style="margin:0;font-size:14px;font-weight:bold;color:#111827">${complexLabel}</p>
                </td></tr>
              </table>
            </td>
            <td width="33%" style="padding-left:8px">
              <table width="100%" cellpadding="0" cellspacing="0" style="background:#f9fafb;border:1px solid #e5e7eb;border-radius:6px">
                <tr><td style="padding:12px;text-align:center">
                  <p style="margin:0 0 2px;font-size:10px;color:#9ca3af;text-transform:uppercase;letter-spacing:0.05em">Volume</p>
                  <p style="margin:0;font-size:11px;font-weight:bold;color:#111827">${resultado.volume_recomendado}</p>
                </td></tr>
              </table>
            </td>
          </tr>
        </table>

        <a href="${url}" style="display:inline-block;background-color:#00c2ff;color:#0a0c10;padding:12px 28px;border-radius:6px;text-decoration:none;font-size:14px;font-weight:bold">
          Ver resultado completo →
        </a>
      </td>
    </tr>
  `);

  return resend.emails.send({
    from: FROM,
    to: para,
    subject: `Análise concluída: ${titulo} — NextCast`,
    html,
  });
}

export async function enviarEmailBoasVindas({
  para,
  nome,
  senhaTemporaria,
}: {
  para: string;
  nome: string;
  senhaTemporaria: string;
}) {
  if (!process.env.RESEND_API_KEY) return;
  const resend = new Resend(process.env.RESEND_API_KEY);

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://nextcast.vercel.app";

  const html = wrapLayout(`
    <tr>
      <td style="background-color:#ffffff;padding:32px">
        <h2 style="margin:0 0 8px;color:#111827;font-size:22px;font-weight:bold">Bem-vindo ao NextCast!</h2>
        <p style="color:#6b7280;margin:0 0 24px;font-size:14px">
          Olá, ${nome}! Sua conta foi criada com sucesso. Use as credenciais abaixo para acessar a plataforma.
        </p>

        <table width="100%" cellpadding="0" cellspacing="0" style="background:#f9fafb;border:1px solid #e5e7eb;border-radius:8px;margin-bottom:24px">
          <tr>
            <td style="padding:20px">
              <p style="margin:0 0 12px;font-size:13px;color:#374151">
                <strong style="display:inline-block;width:64px;color:#6b7280">E-mail:</strong>
                <span style="font-family:monospace;color:#111827">${para}</span>
              </p>
              <p style="margin:0;font-size:13px;color:#374151">
                <strong style="display:inline-block;width:64px;color:#6b7280">Senha:</strong>
                <span style="font-family:monospace;background:#e0f2fe;padding:2px 8px;border-radius:4px;color:#0369a1;font-size:15px">${senhaTemporaria}</span>
              </p>
            </td>
          </tr>
        </table>

        <p style="color:#6b7280;font-size:13px;margin:0 0 24px;line-height:1.5">
          Recomendamos que você altere sua senha no primeiro acesso, em <strong>Meu Perfil</strong>.
        </p>

        <a href="${appUrl}/login" style="display:inline-block;background-color:#00c2ff;color:#0a0c10;padding:12px 28px;border-radius:6px;text-decoration:none;font-size:14px;font-weight:bold">
          Acessar plataforma →
        </a>
      </td>
    </tr>
  `);

  return resend.emails.send({
    from: FROM,
    to: para,
    subject: "Bem-vindo ao NextCast — suas credenciais de acesso",
    html,
  });
}
