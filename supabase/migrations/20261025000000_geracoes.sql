-- Cada geração custa dinheiro de verdade. Esta tabela é o registro e o freio:
-- quem gerou, quanto gastou, e se ainda pode gerar hoje.
--
-- A conta só LÊ as próprias linhas. Quem escreve é a função `gerar`, com a
-- chave de serviço — se o navegador pudesse escrever aqui, poderia registrar
-- custo zero e furar o teto.

create table geracoes (
  id            bigint generated always as identity primary key,
  conta         uuid not null references auth.users on delete cascade,
  criado        timestamptz not null default now(),
  estado        text not null default 'reservada'
                check (estado in ('reservada', 'feita', 'falhou')),
  modelo        text,
  caracteres    int not null default 0,
  pedidas       int not null default 0,
  entregues     int not null default 0,
  reprovadas    int not null default 0,
  rodadas       int not null default 0,
  tokens_entrada int not null default 0,
  tokens_saida  int not null default 0,
  custo_usd     numeric(10, 4) not null default 0,
  erro          text
);

create index geracoes_conta_criado on geracoes (conta, criado desc);
create index geracoes_criado on geracoes (criado desc);

alter table geracoes enable row level security;
create policy "dono lê" on geracoes for select using (auth.uid() = conta);

-- Reserva ANTES de chamar o modelo. Contar e inserir num passo só, sob trava,
-- é o que impede dois cliques simultâneos de passarem os dois pelo limite.
--
-- Duas cercas:
--   p_limite_dia   gerações por conta em 24 h
--   p_teto_dia_usd gasto de TODAS as contas em 24 h — a conta que chega
--                  antes do cliente. Geração ainda em curso entra pela
--                  estimativa, porque o custo real só se sabe no fim.
create function reservar_geracao(p_conta uuid, p_caracteres int, p_pedidas int,
                                 p_limite_dia int, p_teto_dia_usd numeric,
                                 p_estimativa_usd numeric)
returns table (id bigint, restantes int)
language plpgsql security definer set search_path = public as $$
declare
  n int;
  gasto numeric;
  novo bigint;
begin
  -- O volume é pequeno: uma trava só, para todas as contas, mantém o teto
  -- global honesto sem complicar.
  perform pg_advisory_xact_lock(hashtext('reservar_geracao'));

  -- Falha sem custo (o modelo nem respondeu) não consome a vez.
  select count(*) into n from geracoes g
   where g.conta = p_conta and g.criado > now() - interval '24 hours'
     and (g.estado <> 'falhou' or g.custo_usd > 0);
  if n >= p_limite_dia then
    raise exception 'limite_conta' using hint = p_limite_dia::text;
  end if;

  select coalesce(sum(case when g.estado = 'reservada' then p_estimativa_usd
                           else g.custo_usd end), 0)
    into gasto from geracoes g where g.criado > now() - interval '24 hours';
  if gasto + p_estimativa_usd > p_teto_dia_usd then
    raise exception 'teto_global';
  end if;

  insert into geracoes (conta, caracteres, pedidas)
  values (p_conta, p_caracteres, p_pedidas) returning geracoes.id into novo;
  return query select novo, p_limite_dia - n - 1;
end $$;

-- Fecha a reserva com o que de fato aconteceu. Só mexe em linha ainda
-- reservada: uma geração não é registrada duas vezes.
create function registrar_geracao(p_id bigint, p_estado text, p_modelo text,
                                  p_entregues int, p_reprovadas int, p_rodadas int,
                                  p_tokens_entrada int, p_tokens_saida int,
                                  p_custo_usd numeric, p_erro text)
returns void
language sql security definer set search_path = public as $$
  update geracoes set estado = p_estado, modelo = p_modelo, entregues = p_entregues,
         reprovadas = p_reprovadas, rodadas = p_rodadas, tokens_entrada = p_tokens_entrada,
         tokens_saida = p_tokens_saida, custo_usd = p_custo_usd, erro = p_erro
   where id = p_id and estado = 'reservada';
$$;

-- Postgres concede EXECUTE a todos por padrão. Aqui, só a função de servidor.
revoke execute on function reservar_geracao(uuid, int, int, int, numeric, numeric)
  from public, anon, authenticated;
revoke execute on function registrar_geracao(bigint, text, text, int, int, int, int, int, numeric, text)
  from public, anon, authenticated;
grant execute on function reservar_geracao(uuid, int, int, int, numeric, numeric) to service_role;
grant execute on function registrar_geracao(bigint, text, text, int, int, int, int, int, numeric, text) to service_role;
