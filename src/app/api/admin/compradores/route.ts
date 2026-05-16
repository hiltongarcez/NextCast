import { NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { enviarEmailBoasVindas } from "@/lib/email";

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

function gerarSenha(): string {
  const chars = "abcdefghijkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  return Array.from({ length: 10 }, () => chars[Math.floor(Math.random() * chars.length)]).join("") + "!1";
}

export async function GET() {
  const admin = await verificarAdmin();
  if (!admin) return Response.json({ error: "Acesso negado" }, { status: 403 });

  const adminClient = createAdminClient();
  const { data: compradores } = await adminClient
    .from("compradores")
    .select("*")
    .order("created_at", { ascending: false });

  return Response.json(compradores ?? []);
}

export async function POST(req: NextRequest) {
  const admin = await verificarAdmin();
  if (!admin) return Response.json({ error: "Acesso negado" }, { status: 403 });

  const { nome, email, empresa, whatsapp } = await req.json();
  if (!nome?.trim() || !email?.trim()) {
    return Response.json({ error: "Nome e e-mail são obrigatórios." }, { status: 400 });
  }

  const adminClient = createAdminClient();
  const senha = gerarSenha();

  const { data: authData, error: authError } = await adminClient.auth.admin.createUser({
    email: email.trim(),
    password: senha,
    email_confirm: true,
    user_metadata: { nome: nome.trim(), empresa: empresa?.trim() ?? null },
  });

  if (authError) return Response.json({ error: authError.message }, { status: 400 });

  // O trigger já criou o registro em compradores; atualizar campos extras
  await adminClient
    .from("compradores")
    .update({ email: email.trim(), whatsapp: whatsapp?.trim() || null })
    .eq("id", authData.user.id);

  // Fire-and-forget: envia e-mail de boas-vindas com credenciais
  enviarEmailBoasVindas({ para: email.trim(), nome: nome.trim(), senhaTemporaria: senha }).catch(() => {});

  return Response.json({ senha_temporaria: senha });
}
