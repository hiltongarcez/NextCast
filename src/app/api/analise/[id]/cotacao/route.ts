import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  const { data: analise } = await supabase
    .from("analises")
    .select("id, comprador_id, status")
    .eq("id", id)
    .single();

  if (!analise || analise.comprador_id !== user.id) {
    return NextResponse.json({ error: "Análise não encontrada" }, { status: 404 });
  }

  if (analise.status !== "concluida") {
    return NextResponse.json({ error: "Análise ainda não concluída" }, { status: 400 });
  }

  const { error } = await supabase
    .from("analises")
    .update({ cotacao_solicitada: true, updated_at: new Date().toISOString() })
    .eq("id", id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ success: true });
}
