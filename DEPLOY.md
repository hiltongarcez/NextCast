# Deploy — NextCast

Guia completo para subir o NextCast do zero em produção (Vercel + Supabase).

---

## Pré-requisitos

- Node.js 20+ e npm
- Conta no [Supabase](https://supabase.com) (free tier suficiente)
- Conta no [Vercel](https://vercel.com)
- Chave de API da [Anthropic](https://console.anthropic.com)
- Conta no [Resend](https://resend.com) (e-mail transacional — free tier: 3.000 e-mails/mês)
- Repositório no GitHub (ou GitLab/Bitbucket)

---

## 1. Configurar o Supabase

### 1.1 Criar o projeto

1. Acesse [supabase.com](https://supabase.com) → **New project**
2. Anote a **Project URL** e a **anon key** (Settings → API)

### 1.2 Configurar URLs de redirecionamento (Auth)

No painel do Supabase → **Authentication** → **URL Configuration**:

- **Site URL**: `https://nextcast.vercel.app` (ou seu domínio)
- **Redirect URLs**: adicione `https://nextcast.vercel.app/auth/callback`

> Em desenvolvimento, adicione também `http://localhost:3000/auth/callback` à lista de redirect URLs.

### 1.3 Criar as tabelas

Execute no **SQL Editor** do Supabase:

```sql
-- Função auxiliar para obter role sem recursão em RLS
create or replace function public.get_my_role()
returns text language sql stable security definer as $$
  select role from public.compradores where id = auth.uid()
$$;

-- Tabela de compradores (perfis de usuário)
create table public.compradores (
  id uuid references auth.users(id) on delete cascade primary key,
  nome text not null,
  email text,
  empresa text,
  whatsapp text,
  role text not null default 'comprador' check (role in ('comprador', 'admin')),
  ativo boolean not null default true,
  created_at timestamptz not null default now()
);

-- Trigger para criar perfil automaticamente no signup
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer as $$
begin
  insert into public.compradores (id, nome, empresa, email)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'nome', split_part(new.email, '@', 1)),
    new.raw_user_meta_data->>'empresa',
    new.email
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Tabela de análises
create table public.analises (
  id uuid primary key default gen_random_uuid(),
  comprador_id uuid references public.compradores(id) on delete cascade not null,
  titulo text not null,
  descricao text,
  status text not null default 'processando' check (status in ('processando', 'concluida', 'erro')),
  arquivo_url text,
  arquivo_tipo text check (arquivo_tipo in ('imagem', 'pdf')),
  resultado_ia jsonb,
  erro_mensagem text,
  updated_at timestamptz,
  created_at timestamptz not null default now()
);

-- RLS: usuário só vê suas próprias análises; admin vê todas
alter table public.analises enable row level security;

create policy "comprador lê suas análises" on public.analises
  for select using (
    auth.uid() = comprador_id or public.get_my_role() = 'admin'
  );

create policy "comprador cria suas análises" on public.analises
  for insert with check (auth.uid() = comprador_id);

create policy "service_role atualiza análises" on public.analises
  for update using (true);

-- RLS para compradores
alter table public.compradores enable row level security;

create policy "usuário lê seu próprio perfil ou admin lê todos" on public.compradores
  for select using (
    auth.uid() = id or public.get_my_role() = 'admin'
  );

create policy "usuário atualiza seu próprio perfil" on public.compradores
  for update using (auth.uid() = id);
```

### 1.3 Criar o bucket de storage

1. Supabase → **Storage** → **New bucket**
2. Nome: `analises`
3. Marque **Public bucket** → Create

Adicione a policy de upload:

```sql
create policy "usuários autenticados fazem upload"
  on storage.objects for insert
  with check (bucket_id = 'analises' and auth.role() = 'authenticated');

create policy "usuários autenticados leem seus arquivos"
  on storage.objects for select
  using (bucket_id = 'analises' and auth.role() = 'authenticated');
```

### 1.4 Configurar Auth

- Supabase → **Authentication** → **Providers** → Email: habilitar **Email/Password**
- Em **URL Configuration**: adicione `https://nextcast.vercel.app` em **Site URL** e Redirect URLs

---

## 2. Configurar variáveis de ambiente

Copie `.env.local.example` para `.env.local` e preencha:

```bash
cp .env.local.example .env.local
```

| Variável | Onde encontrar |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase → Settings → API → Project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase → Settings → API → anon/public |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase → Settings → API → service_role (secret) |
| `ANTHROPIC_API_KEY` | console.anthropic.com → API Keys |
| `WHATSAPP_ADMIN_NUMBER` | Número do admin no formato `5511999999999` |
| `RESEND_API_KEY` | resend.com → API Keys |
| `RESEND_FROM` | Ex: `NextCast <noreply@seudominio.com.br>` (domínio verificado no Resend) |
| `NEXT_PUBLIC_APP_URL` | `http://localhost:3000` (local) ou URL do Vercel |

---

## 3. Rodar localmente

```bash
npm install
npm run dev
```

Acesse [http://localhost:3000](http://localhost:3000).

Para criar o primeiro usuário admin, insira via SQL:

```sql
-- Após criar o usuário pelo signup, promova para admin:
update public.compradores set role = 'admin' where id = '<uuid-do-usuario>';
```

---

## 4. Deploy no Vercel

### 4.1 Conectar o repositório

1. [vercel.com/new](https://vercel.com/new) → **Import Git Repository**
2. Selecione o repositório do NextCast
3. Framework: **Next.js** (detectado automaticamente)

### 4.2 Configurar variáveis de ambiente no Vercel

Settings → **Environment Variables** — adicione todas as variáveis do `.env.local`:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `ANTHROPIC_API_KEY`
- `WHATSAPP_ADMIN_NUMBER`
- `NEXT_PUBLIC_APP_URL` → `https://nextcast.vercel.app` (ou seu domínio)
- `RESEND_API_KEY`
- `RESEND_FROM` → `NextCast <noreply@seudominio.com.br>`

### 4.3 Deploy

Clique em **Deploy**. O Vercel roda `npm run build` automaticamente.

Deploys subsequentes: cada `git push` na branch `main` faz redeploy automático.

---

## 5. Checklist pós-deploy

- [ ] Login funciona com usuário cadastrado
- [ ] Upload de imagem e PDF na Nova Análise
- [ ] Preview da imagem aparece antes do envio
- [ ] Página de resultado faz auto-refresh enquanto `processando`
- [ ] Resultado da IA aparece após processamento
- [ ] Link de WhatsApp é gerado corretamente
- [ ] Painel admin lista compradores e análises
- [ ] Fluxo "Esqueceu a senha?" envia e-mail e link de recuperação funciona
- [ ] Admin cria comprador e recebe senha temporária
- [ ] Comprador recebe e-mail de boas-vindas com credenciais ao ser criado
- [ ] Comprador recebe e-mail com resultado quando análise conclui
- [ ] Favicon SVG aparece na aba do browser
- [ ] Rate limit bloqueia mais de 10 análises/hora por usuário
- [ ] Análises com erro exibem a mensagem real de falha

---

## 6. Configurar o Resend (e-mail)

### 6.1 Criar conta e obter chave

1. Acesse [resend.com](https://resend.com) → **Sign up** (free tier: 3.000 e-mails/mês)
2. Crie uma API Key em **API Keys** → adicione como `RESEND_API_KEY`

### 6.2 Verificar domínio remetente

1. Resend → **Domains** → **Add Domain** → insira seu domínio (ex: `nextcast.com.br`)
2. Adicione os registros DNS indicados (SPF, DKIM, DMARC)
3. Defina `RESEND_FROM=NextCast <noreply@nextcast.com.br>`

> **Desenvolvimento sem domínio verificado**: use `RESEND_FROM=onboarding@resend.dev` (endereço de teste do Resend). E-mails só chegam no endereço do proprietário da conta.
>
> **Sem RESEND_API_KEY configurada**: o sistema continua funcionando normalmente, apenas sem envio de e-mails (degradação silenciosa).

---

## 7. Domínio customizado (opcional)

Vercel → Settings → **Domains** → adicione seu domínio e configure o DNS conforme as instruções.

Após configurar, atualize:
- `NEXT_PUBLIC_APP_URL` no Vercel
- **Site URL** e **Redirect URLs** no Supabase Auth

---

**E-mail não está sendo enviado**
- Confirme que `RESEND_API_KEY` está configurada
- Verifique que o domínio em `RESEND_FROM` está verificado no Resend
- Consulte os logs em resend.com → **Emails** para ver status de entrega

---

## Troubleshooting

**Build falha com erro de tipo TypeScript**
```bash
npm run build   # reproduza localmente primeiro
```

**"Invalid API Key" da Anthropic**
Verifique se `ANTHROPIC_API_KEY` está configurada no Vercel (não é `NEXT_PUBLIC_`).

**Arquivo não faz upload**
Confirme que o bucket `analises` existe e as policies de storage foram criadas.

**Usuário redireciona para /login em loop**
Verifique se o `NEXT_PUBLIC_SUPABASE_URL` e `NEXT_PUBLIC_SUPABASE_ANON_KEY` estão corretos.
