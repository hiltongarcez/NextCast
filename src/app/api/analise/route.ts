import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { analisarPeca } from "@/lib/claude";
import { enviarEmailAnalise } from "@/lib/email";

const MIME_IMAGEM = new Set(["image/jpeg", "image/png", "image/webp", "image/gif"]);
const RATE_LIMIT_POR_HORA = 10;

export async function POST(request: NextRequest) {
  let analiseId: string | null = null;

  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const formData = await request.formData();
    analiseId = formData.get("analise_id") as string;
    const descricao = (formData.get("descricao") as string) ?? "";
    const titulo = (formData.get("titulo") as string) ?? "";
    const volumeTipo = (formData.get("volume_tipo") as string) ?? "";
    const volumeQtd = (formData.get("volume_qtd") as string) ?? "";
    const arquivo = formData.get("arquivo") as File | null;

    if (!analiseId) {
      return NextResponse.json({ error: "analise_id obrigatório" }, { status: 400 });
    }

    // Verifica que a análise pertence ao usuário
    const { data: analise } = await supabase
      .from("analises")
      .select("id, comprador_id")
      .eq("id", analiseId)
      .single();

    if (!analise || analise.comprador_id !== user.id) {
      return NextResponse.json({ error: "Análise não encontrada" }, { status: 404 });
    }

    // Rate limiting: máximo RATE_LIMIT_POR_HORA análises por hora por usuário
    const umaHoraAtras = new Date(Date.now() - 60 * 60 * 1000).toISOString();
    const { count: recentes } = await supabase
      .from("analises")
      .select("*", { count: "exact", head: true })
      .eq("comprador_id", user.id)
      .gte("created_at", umaHoraAtras);

    if ((recentes ?? 0) > RATE_LIMIT_POR_HORA) {
      await supabase
        .from("analises")
        .update({
          status: "erro",
          erro_mensagem: `Limite de ${RATE_LIMIT_POR_HORA} análises por hora atingido. Tente novamente em breve.`,
          updated_at: new Date().toISOString(),
        })
        .eq("id", analiseId);

      return NextResponse.json(
        { error: `Limite de ${RATE_LIMIT_POR_HORA} análises por hora atingido. Tente novamente em breve.` },
        { status: 429 }
      );
    }

    let imagemBase64: string | undefined;
    let mimeType: string | undefined;
    let arquivoUrl: string | undefined;

    if (arquivo && arquivo.size > 0) {
      const isPDF = arquivo.type === "application/pdf";

      const ext = arquivo.name.split(".").pop() ?? "bin";
      const storagePath = `analises/${user.id}/${analiseId}.${ext}`;

      const { data: uploadData, error: uploadError } = await supabase.storage
        .from("arquivos")
        .upload(storagePath, arquivo, { contentType: arquivo.type, upsert: true });

      if (!uploadError && uploadData) {
        const { data: urlData } = supabase.storage.from("arquivos").getPublicUrl(storagePath);
        arquivoUrl = urlData.publicUrl;
      }

      const buffer = await arquivo.arrayBuffer();
      imagemBase64 = Buffer.from(buffer).toString("base64");
      mimeType = isPDF ? "application/pdf" : arquivo.type;

      if (!isPDF && !MIME_IMAGEM.has(arquivo.type)) {
        imagemBase64 = undefined;
        mimeType = undefined;
      }
    }

    const volumeLabel =
      volumeTipo === "mensal"
        ? `${volumeQtd} peças/mês (produção mensal contínua)`
        : volumeTipo === "eventual"
        ? `${volumeQtd} peças total (produção eventual/única)`
        : volumeQtd
        ? `${volumeQtd} peças`
        : "";

    const promptParts = [
      titulo ? `Título da peça: ${titulo}` : "",
      descricao ? `Descrição fornecida pelo comprador: ${descricao}` : "",
      volumeLabel ? `Volume de produção: ${volumeLabel}` : "",
      mimeType === "application/pdf"
        ? "O desenho técnico da peça está no documento PDF anexado. Analise as cotas, geometria e especificações presentes no desenho."
        : "",
      !imagemBase64 && !descricao
        ? "Analise com base apenas no título fornecido."
        : "",
    ]
      .filter(Boolean)
      .join("\n");

    const resultado = await analisarPeca(promptParts, imagemBase64, mimeType);

    const { error: updateError } = await supabase
      .from("analises")
      .update({
        status: "concluida",
        processo_recomendado: resultado.processo_principal,
        processos_alternativos: resultado.processos_alternativos,
        resultado_ia: resultado,
        arquivo_url: arquivoUrl ?? null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", analiseId);

    if (updateError) throw new Error(updateError.message);

    // Fire-and-forget: notifica o comprador por e-mail
    if (user.email) {
      void (async () => {
        try {
          const { data: perfil } = await supabase
            .from("compradores").select("nome").eq("id", user.id).single();
          await enviarEmailAnalise({
            para: user.email!,
            nome: perfil?.nome ?? "Comprador",
            titulo,
            analiseId: analiseId!,
            resultado,
          });
        } catch {
          // ignorar falha de e-mail
        }
      })();
    }

    return NextResponse.json({ success: true, resultado });

  } catch (err) {
    console.error("[/api/analise]", err);

    if (analiseId) {
      try {
        const supabase = await createClient();
        await supabase
          .from("analises")
          .update({
            status: "erro",
            erro_mensagem: err instanceof Error ? err.message : "Erro interno desconhecido",
            updated_at: new Date().toISOString(),
          })
          .eq("id", analiseId);
      } catch {
        // Ignorar erro secundário
      }
    }

    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Erro interno" },
      { status: 500 }
    );
  }
}
