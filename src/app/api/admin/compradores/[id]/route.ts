import { NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

async function verificarAdmin() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  const { data: perfil } = await supabase
    .from("compradores")
    .select("role")
    .eq("id", user.id)
    .single();
  return perfil?.role === "admin" ? user : null;
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const admin = await verificarAdmin();
  if (!admin) return Response.json({ error: "Acesso negado" }, { status: 403 });

  const { id } = await params;
  const { ativo } = await req.json();

  const adminClient = createAdminClient();
  const { error } = await adminClient.from("compradores").update({ ativo }).eq("id", id);

  if (error) return Response.json({ error: error.message }, { status: 400 });
  return Response.json({ ok: true });
}
