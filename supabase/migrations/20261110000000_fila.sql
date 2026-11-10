-- A criação conduzida pelo servidor (conteudo/spec-criar-em-um-toque.md,
-- fase 1). O jogo vira uma fila: `criacoes`, uma por jogo em criação, e
-- `tarefas`, um pedido ao modelo cada. A função `gerar` trabalha a fila,
-- uma tarefa por chamada, e fechar a tela não para nada.
--
-- Como `geracoes`, a conta só LÊ: quem escreve é a função, com a chave de
-- serviço. Se o navegador pudesse escrever aqui, gravaria resultado ou custo.

create table criacoes (
  id         bigint generated always as identity primary key,
  conta      uuid not null references auth.users on delete cascade,
  -- A linha `tipo = 'jogo'` de geracoes: é ela que conta no dia e prende o custo.
  geracao    bigint not null references geracoes on delete cascade,
  estado     text not null default 'planejando'
             check (estado in ('planejando', 'escrevendo', 'montando', 'pronta', 'falhou')),
  pedido     jsonb not null check (pg_column_size(pedido) < 200000),
  plano      jsonb,
  jogo       uuid references jogos on delete set null,
  erro       text,
  criado     timestamptz not null default now(),
  atualizado timestamptz not null default now()
);

-- Uma criação por vez por conta (decisão de 10/11/2026).
create unique index criacoes_uma_por_conta on criacoes (conta)
  where estado in ('planejando', 'escrevendo', 'montando');
create index criacoes_conta on criacoes (conta, criado desc);

create table tarefas (
  id         bigint generated always as identity primary key,
  criacao    bigint not null references criacoes on delete cascade,
  tipo       text not null check (tipo in ('planejar', 'missao', 'licao')),
  alvo       text not null default '',
  -- Planejar primeiro, as missões depois, as lições por último.
  ordem      int not null default 0,
  estado     text not null default 'fila' check (estado in ('fila', 'fazendo', 'feita', 'falhou')),
  tentativas int not null default 0,
  -- Até quando quem pegou a tarefa tem a vez. Vencido, o corte de 150 s
  -- matou o trabalhador: a tarefa volta à fila.
  prazo      timestamptz,
  resultado  jsonb check (pg_column_size(resultado) < 400000),
  erro       text,
  custo_usd  numeric(10, 4) not null default 0,
  criado     timestamptz not null default now(),
  atualizado timestamptz not null default now(),
  unique (criacao, tipo, alvo)
);

create index tarefas_fila on tarefas (estado, ordem, id) where estado in ('fila', 'fazendo');
-- A tela acompanha pelo que mudou desde a última olhada.
create index tarefas_criacao on tarefas (criacao, atualizado);

alter table criacoes enable row level security;
alter table tarefas enable row level security;
create policy "dono lê" on criacoes for select using (auth.uid() = conta);
create policy "dono lê" on tarefas for select
  using (exists (select 1 from criacoes c where c.id = tarefas.criacao and c.conta = auth.uid()));

create function tocar() returns trigger language plpgsql as $$
begin
  new.atualizado := now();
  return new;
end $$;
create trigger tocar before update on criacoes for each row execute function tocar();
create trigger tocar before update on tarefas for each row execute function tocar();

-- A próxima tarefa: a primeira da fila na ordem, ou uma `fazendo` de prazo
-- vencido, de uma criação com menos de quatro tarefas em curso. Já sai
-- marcada como `fazendo`, com a tentativa contada. A trava serializa só a
-- escolha (milissegundos), e é o que segura o limite de quatro.
create function pegar_tarefa(p_prazo_s int, p_paralelo int, p_tentativas int)
returns setof tarefas
language plpgsql security definer set search_path = public as $$
declare
  t tarefas;
begin
  perform pg_advisory_xact_lock(hashtext('pegar_tarefa'));

  -- Cortada no meio todas as vezes que podia: não volta mais.
  update tarefas set estado = 'falhou', prazo = null,
         erro = coalesce(erro, 'Cortada no meio: a função passou do tempo.')
   where estado = 'fazendo' and prazo < now() and tentativas >= p_tentativas;

  select * into t from tarefas x
   where (x.estado = 'fila' or (x.estado = 'fazendo' and x.prazo < now()))
     and (select count(*) from tarefas y
           where y.criacao = x.criacao and y.estado = 'fazendo' and y.prazo >= now()) < p_paralelo
   order by x.ordem, x.id
   limit 1
   for update skip locked;
  if not found then return; end if;

  update tarefas set estado = 'fazendo', tentativas = tentativas + 1,
         prazo = now() + make_interval(secs => p_prazo_s)
   where id = t.id returning * into t;
  return next t;
end $$;

-- Toma as criações sem tarefa por fazer, uma vez cada: quem recebe a linha
-- monta o jogo. `montando` parado há mais de três minutos é de um
-- trabalhador que morreu no meio, e volta a ser tomado.
create function concluir_criacoes()
returns setof criacoes
language sql security definer set search_path = public as $$
  update criacoes c set estado = 'montando'
   where (c.estado in ('planejando', 'escrevendo')
          or (c.estado = 'montando' and c.atualizado < now() - interval '3 minutes'))
     and not exists (select 1 from tarefas t where t.criacao = c.id and t.estado in ('fila', 'fazendo'))
  returning c.*;
$$;

-- O plano chegou: guarda-o e enfileira as tarefas dele, num passo só.
create function planejar_criacao(p_criacao bigint, p_pedido jsonb, p_plano jsonb, p_tarefas jsonb)
returns void
language plpgsql security definer set search_path = public as $$
begin
  insert into tarefas (criacao, tipo, alvo, ordem)
  select p_criacao, x->>'tipo', x->>'alvo', (x->>'ordem')::int from jsonb_array_elements(p_tarefas) x
  on conflict (criacao, tipo, alvo) do nothing;
  update criacoes set pedido = p_pedido, plano = p_plano, estado = 'escrevendo'
   where id = p_criacao and estado = 'planejando';
end $$;

-- O custo de cada tentativa soma: a que o corte matou também foi paga.
create function terminar_tarefa(p_id bigint, p_estado text, p_resultado jsonb, p_erro text, p_custo numeric)
returns void
language sql security definer set search_path = public as $$
  update tarefas set estado = p_estado, resultado = coalesce(p_resultado, resultado), erro = p_erro,
         custo_usd = custo_usd + p_custo, prazo = null
   where id = p_id;
$$;

-- "Tentar de novo" na tela: a tarefa que falhou volta com uma tentativa só,
-- e a criação volta a escrever. Jogo já salvo não é salvo de novo (ver
-- `fechar` em _esteira/fila.ts).
create function tentar_tarefa(p_conta uuid, p_criacao bigint, p_tipo text, p_alvo text, p_tentativas int)
returns boolean
language plpgsql security definer set search_path = public as $$
begin
  update tarefas t set estado = 'fila', tentativas = p_tentativas - 1, erro = null
    from criacoes c
   where t.criacao = c.id and c.id = p_criacao and c.conta = p_conta
     and t.tipo = p_tipo and t.alvo = p_alvo and t.estado = 'falhou'
     and c.estado in ('escrevendo', 'pronta');
  if not found then return false; end if;
  update criacoes set estado = 'escrevendo', erro = null where id = p_criacao and estado = 'pronta';
  return true;
end $$;

revoke execute on function pegar_tarefa(int, int, int), concluir_criacoes(),
  planejar_criacao(bigint, jsonb, jsonb, jsonb), terminar_tarefa(bigint, text, jsonb, text, numeric),
  tentar_tarefa(uuid, bigint, text, text, int)
  from public, anon, authenticated;
grant execute on function pegar_tarefa(int, int, int), concluir_criacoes(),
  planejar_criacao(bigint, jsonb, jsonb, jsonb), terminar_tarefa(bigint, text, jsonb, text, numeric),
  tentar_tarefa(uuid, bigint, text, text, int)
  to service_role;

-- A rede de segurança: a cada minuto, se há tarefa sem ninguém (na fila, ou
-- de prazo vencido) ou criação por fechar, acorda a função. O endereço e o
-- segredo moram no Vault, fora do repositório (GERAR.md, "A fila"); sem
-- eles, o relógio não faz nada.
create extension if not exists pg_cron with schema pg_catalog;
create extension if not exists pg_net with schema extensions;

create function acordar_fila() returns void
language plpgsql security definer set search_path = public as $$
declare
  n int;
  url text;
  segredo text;
begin
  select count(*) into n from tarefas
   where estado = 'fila' or (estado = 'fazendo' and prazo < now());
  if n = 0 and not exists (
       select 1 from criacoes c
        where (c.estado in ('planejando', 'escrevendo')
               or (c.estado = 'montando' and c.atualizado < now() - interval '3 minutes'))
          and not exists (select 1 from tarefas t where t.criacao = c.id and t.estado in ('fila', 'fazendo')))
  then return; end if;
  select decrypted_secret into url from vault.decrypted_secrets where name = 'gerar_url';
  select decrypted_secret into segredo from vault.decrypted_secrets where name = 'trabalho_segredo';
  if url is null or segredo is null then return; end if;
  perform net.http_post(url := url,
    body := jsonb_build_object('acao', 'trabalhar', 'cadeias', greatest(1, least(n, 4))),
    headers := jsonb_build_object('Content-Type', 'application/json', 'x-trabalho', segredo));
end $$;
revoke execute on function acordar_fila() from public, anon, authenticated;

select cron.schedule('acordar-fila', '* * * * *', 'select public.acordar_fila()');
