-- O jogo grande é feito de vários pedidos: o plano e uma parte por missão.
-- O limite por conta passa a contar JOGOS, não pedidos. Cada jogo é uma
-- linha `tipo = 'jogo'` (a criação); o plano e as partes apontam para ela
-- por `criacao`. O teto de gasto de todas as contas continua contando tudo.
--
-- A leitura de fotos não gasta jogo: tem um limite próprio, mais folgado,
-- porque se lê antes de saber se o material presta para um jogo.

alter table geracoes drop constraint geracoes_tipo_check;
alter table geracoes add constraint geracoes_tipo_check check (tipo in ('jogo', 'plano', 'gerar', 'ler'));
alter table geracoes add column criacao bigint references geracoes on delete cascade;
create index geracoes_criacao on geracoes (criacao);

drop function reservar_geracao(uuid, text, int, int, int, numeric, numeric);

create function reservar_geracao(p_conta uuid, p_tipo text, p_criacao bigint,
                                 p_caracteres int, p_pedidas int,
                                 p_limite_jogos int, p_limite_leituras int, p_max_partes int,
                                 p_teto_dia_usd numeric, p_estimativa_usd numeric)
returns table (id bigint, restantes int)
language plpgsql security definer set search_path = public as $$
declare
  n int;
  gasto numeric;
  novo bigint;
  dono uuid;
begin
  perform pg_advisory_xact_lock(hashtext('reservar_geracao'));

  if p_tipo = 'jogo' then
    -- Um jogo conta se algo dele já custou, ou se ainda está sendo feito.
    -- Jogo que morreu sem gastar nada (o modelo nem respondeu) devolve a vez.
    select count(*) into n from geracoes j
     where j.conta = p_conta and j.tipo = 'jogo' and j.criado > now() - interval '24 hours'
       and (j.criado > now() - interval '15 minutes'
            or exists (select 1 from geracoes p where p.criacao = j.id and p.custo_usd > 0));
    if n >= p_limite_jogos then
      raise exception 'limite_conta' using hint = p_limite_jogos::text;
    end if;
    insert into geracoes (conta, tipo, estado, pedidas)
    values (p_conta, 'jogo', 'feita', p_pedidas) returning geracoes.id into novo;
    return query select novo, p_limite_jogos - n - 1;
    return;
  end if;

  if p_tipo = 'ler' then
    select count(*) into n from geracoes g
     where g.conta = p_conta and g.tipo = 'ler' and g.criado > now() - interval '24 hours'
       and (g.estado <> 'falhou' or g.custo_usd > 0);
    if n >= p_limite_leituras then
      raise exception 'limite_leitura' using hint = p_limite_leituras::text;
    end if;
  else
    -- Plano e parte só existem dentro de um jogo aberto há pouco, da mesma
    -- conta, e com um número limitado de pedidos: é o que impede um jogo de
    -- virar geração sem fim.
    select g.conta into dono from geracoes g
     where g.id = p_criacao and g.tipo = 'jogo' and g.criado > now() - interval '3 hours';
    if dono is null or dono <> p_conta then
      raise exception 'criacao_invalida';
    end if;
    select count(*) into n from geracoes g where g.criacao = p_criacao;
    if n >= p_max_partes then
      raise exception 'limite_partes' using hint = p_max_partes::text;
    end if;
  end if;

  select coalesce(sum(case when g.estado = 'reservada' then p_estimativa_usd
                           else g.custo_usd end), 0)
    into gasto from geracoes g where g.criado > now() - interval '24 hours';
  if gasto + p_estimativa_usd > p_teto_dia_usd then
    raise exception 'teto_global';
  end if;

  insert into geracoes (conta, tipo, criacao, caracteres, pedidas)
  values (p_conta, p_tipo, p_criacao, p_caracteres, p_pedidas) returning geracoes.id into novo;
  -- Para o plano e as partes, "restantes" são os jogos que ainda cabem hoje.
  select count(*) into n from geracoes j
   where j.conta = p_conta and j.tipo = 'jogo' and j.criado > now() - interval '24 hours'
     and (j.criado > now() - interval '15 minutes'
          or exists (select 1 from geracoes p where p.criacao = j.id and p.custo_usd > 0));
  return query select novo, greatest(p_limite_jogos - n, 0);
end $$;

revoke execute on function reservar_geracao(uuid, text, bigint, int, int, int, int, int, numeric, numeric)
  from public, anon, authenticated;
grant execute on function reservar_geracao(uuid, text, bigint, int, int, int, int, int, numeric, numeric)
  to service_role;
