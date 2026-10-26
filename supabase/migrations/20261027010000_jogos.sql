-- Os jogos criados pela tela de gerar. O conteúdo é o mesmo JSON de
-- `conteudo/`; quem joga é `jogar.html?id=…`, que monta o jogo no navegador
-- com o mesmo motor dos jogos feitos à mão.
--
-- Diferente de `geracoes`, aqui a conta escreve direto: o conteúdo é dela,
-- revisado por ela, e não há custo a proteger. O tamanho é cercado pelo
-- banco, para um JSON fora de propósito não ocupar o espaço de todos.

create table jogos (
  id         uuid primary key default gen_random_uuid(),
  conta      uuid not null default auth.uid() references auth.users on delete cascade,
  titulo     text not null check (length(titulo) between 1 and 120),
  materia    text not null check (length(materia) between 1 and 60),
  conteudo   jsonb not null check (pg_column_size(conteudo) < 600000),
  criado     timestamptz not null default now(),
  atualizado timestamptz not null default now()
);

create index jogos_conta on jogos (conta, atualizado desc);

alter table jogos enable row level security;
create policy "dono lê"     on jogos for select using (auth.uid() = conta);
create policy "dono cria"   on jogos for insert with check (auth.uid() = conta);
create policy "dono muda"   on jogos for update using (auth.uid() = conta) with check (auth.uid() = conta);
create policy "dono apaga"  on jogos for delete using (auth.uid() = conta);
