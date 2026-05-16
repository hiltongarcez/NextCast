-- NextCast — Schema Supabase
-- Execute este script no SQL Editor do Supabase

-- =============================================
-- EXTENSÕES
-- =============================================
create extension if not exists "uuid-ossp";

-- =============================================
-- TABELA: compradores
-- =============================================
create table public.compradores (
  id          uuid primary key references auth.users(id) on delete cascade,
  nome        text not null,
  email       text,
  empresa     text,
  telefone    text,
  whatsapp    text,
  role        text not null default 'comprador' check (role in ('admin', 'comprador')),
  ativo       boolean not null default true,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

alter table public.compradores enable row level security;

-- Políticas RLS — apenas acesso próprio; admin usa service_role (bypassa RLS)
create policy "Usuário vê seu próprio perfil"
  on public.compradores for select
  using (auth.uid() = id);

create policy "Usuário atualiza seu próprio perfil"
  on public.compradores for update
  using (auth.uid() = id);

-- =============================================
-- TABELA: analises
-- =============================================
create table public.analises (
  id                      uuid primary key default uuid_generate_v4(),
  comprador_id            uuid not null references public.compradores(id) on delete cascade,
  titulo                  text not null,
  descricao               text,
  arquivo_url             text,
  arquivo_tipo            text check (arquivo_tipo in ('imagem', 'pdf')),
  status                  text not null default 'processando'
                            check (status in ('processando', 'concluida', 'erro')),
  processo_recomendado    text check (
                            processo_recomendado in (
                              'fundição_areia', 'microfusão', 'usinagem_cnc',
                              'barras_perfis', 'bobinas_estamparia', 'forjamento'
                            )
                          ),
  processos_alternativos  text[],
  resultado_ia            jsonb,
  erro_mensagem           text,
  created_at              timestamptz not null default now(),
  updated_at              timestamptz not null default now()
);

alter table public.analises enable row level security;

-- Políticas RLS
create policy "Comprador vê suas análises"
  on public.analises for select
  using (auth.uid() = comprador_id);

create policy "Comprador cria suas análises"
  on public.analises for insert
  with check (auth.uid() = comprador_id);

create policy "Comprador atualiza suas análises"
  on public.analises for update
  using (auth.uid() = comprador_id);

-- Admin acessa analises via service_role (createAdminClient), sem policy necessária

-- =============================================
-- STORAGE: bucket arquivos
-- =============================================
insert into storage.buckets (id, name, public)
values ('arquivos', 'arquivos', true)
on conflict do nothing;

create policy "Usuário faz upload dos próprios arquivos"
  on storage.objects for insert
  with check (
    bucket_id = 'arquivos' and
    auth.uid()::text = (storage.foldername(name))[2]
  );

create policy "Arquivos são públicos para leitura"
  on storage.objects for select
  using (bucket_id = 'arquivos');

-- =============================================
-- TRIGGER: updated_at automático
-- =============================================
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger trg_compradores_updated_at
  before update on public.compradores
  for each row execute function public.set_updated_at();

create trigger trg_analises_updated_at
  before update on public.analises
  for each row execute function public.set_updated_at();

-- =============================================
-- FUNÇÃO: criar perfil ao registrar usuário
-- =============================================
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

create trigger trg_on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
