-- Beta fechado: conta nova só com código de convite e com os termos
-- aceitos, e o link de jogar sem conta.
--
-- A cerca do convite fica no banco, não na tela: a chave pública está no
-- HTML, e qualquer um pode chamar o cadastro do Supabase direto. Um gatilho
-- em auth.users vale para o e-mail, para o Google e para o que vier.

-- ---------- convites ----------

-- Sem política nenhuma: só o SQL Editor (ou a chave de serviço) lê e
-- escreve. O navegador não tem como listar códigos.
create table convites (
  codigo   text primary key check (codigo ~ '^[A-Z0-9-]{6,40}$'),
  nota     text,
  usos     int not null default 0,
  max_usos int not null default 1 check (max_usos >= 0),
  ativo    boolean not null default true,
  criado   timestamptz not null default now()
);
alter table convites enable row level security;

-- Quem entrou com qual convite, e que versão dos termos aceitou. É a prova
-- do aceite; o metadado do usuário a própria conta pode reescrever depois.
create table cadastros (
  conta   uuid primary key references auth.users on delete cascade,
  convite text not null references convites,
  termos  text not null,
  criado  timestamptz not null default now()
);
alter table cadastros enable row level security;

-- Muda quando o texto dos termos ou da política mudar de verdade; tem de
-- bater com TERMOS_VERSAO em build/_conta.js.
create function termos_versao() returns text language sql immutable as $$ select '2026-10-27' $$;

-- Depois do insert, e não antes: `cadastros` aponta para a linha nova. Um
-- erro aqui desfaz o cadastro inteiro do mesmo jeito.
create function exigir_convite() returns trigger
language plpgsql security definer set search_path = public as $$
declare
  c text := upper(regexp_replace(coalesce(new.raw_user_meta_data->>'convite', ''), '\s', '', 'g'));
begin
  if coalesce(new.raw_user_meta_data->>'aceite', '') <> termos_versao() then
    raise exception 'termos_nao_aceitos';
  end if;
  -- O teto e a contagem no mesmo update: dois cadastros ao mesmo tempo não
  -- passam os dois pelo último uso.
  update convites set usos = usos + 1
   where codigo = c and ativo and usos < max_usos;
  if not found then
    raise exception 'convite_invalido';
  end if;
  insert into cadastros (conta, convite, termos) values (new.id, c, termos_versao());
  return new;
end $$;

revoke all on function exigir_convite() from public, anon, authenticated;

create trigger exigir_convite after insert on auth.users
  for each row execute function exigir_convite();

-- Para criar convites no SQL Editor:  select novo_convite('Família da Ana');
-- ou, para uma turma de 30:          select novo_convite('Turma 4B', 30);
-- 40 bits ao acaso: adivinhar um código, no limite de cadastros por hora
-- do Supabase, não é caminho.
create function novo_convite(nota text, max_usos int default 1) returns text
language sql volatile as $$
  insert into convites (codigo, nota, max_usos)
  values (upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 4) || '-' ||
                substr(replace(gen_random_uuid()::text, '-', ''), 1, 6)),
          nota, max_usos)
  returning codigo
$$;
revoke all on function novo_convite(text, int) from public, anon, authenticated;

-- ---------- link de jogar sem conta ----------

-- O dono liga e desliga; quem tem o link joga sem entrar. O link é um uuid
-- ao acaso, não o id do jogo: desligar e ligar de novo troca o endereço.
alter table jogos add column link uuid unique;

-- A conta de quem abre o link não importa, nem existe: a função lê por
-- cima da RLS, só a linha daquele link, e só o que o jogo precisa — nunca
-- o material, nem a conta dona.
create function jogo_por_link(l uuid) returns table (titulo text, materia text, conteudo jsonb)
language sql stable security definer set search_path = public as $$
  select titulo, materia, conteudo from jogos where link = l and l is not null
$$;
revoke all on function jogo_por_link(uuid) from public;
grant execute on function jogo_por_link(uuid) to anon, authenticated;
