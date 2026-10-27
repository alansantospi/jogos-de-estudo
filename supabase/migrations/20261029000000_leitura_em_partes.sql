-- Uma leitura maior que uma chamada da função (10 páginas, o que cabe em
-- 150 s) vem em várias. A primeira é a leitura do dia; as outras apontam
-- para ela por `criacao` e não gastam outra. O que cerca a leitura inteira
-- é a soma das páginas (`pedidas`), até p_paginas_leitura.

drop function reservar_geracao(uuid, text, bigint, int, int, int, int, int, numeric, numeric);

create function reservar_geracao(p_conta uuid, p_tipo text, p_criacao bigint,
                                 p_caracteres int, p_pedidas int,
                                 p_limite_jogos int, p_limite_leituras int, p_max_partes int,
                                 p_paginas_leitura int,
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
    if p_criacao is null then
      -- Só a primeira chamada de cada leitura conta como leitura do dia.
      select count(*) into n from geracoes g
       where g.conta = p_conta and g.tipo = 'ler' and g.criacao is null
         and g.criado > now() - interval '24 hours'
         and (g.estado <> 'falhou' or g.custo_usd > 0);
      if n >= p_limite_leituras then
        raise exception 'limite_leitura' using hint = p_limite_leituras::text;
      end if;
      if p_pedidas > p_paginas_leitura then
        raise exception 'limite_paginas' using hint = p_paginas_leitura::text;
      end if;
    else
      -- A continuação: da mesma conta, de uma leitura de agora há pouco, e
      -- a leitura inteira não passa do teto de páginas.
      select g.conta into dono from geracoes g
       where g.id = p_criacao and g.tipo = 'ler' and g.criacao is null
         and g.criado > now() - interval '1 hour';
      if dono is null or dono <> p_conta then
        raise exception 'criacao_invalida';
      end if;
      select coalesce(sum(g.pedidas), 0) into n from geracoes g
       where g.id = p_criacao or g.criacao = p_criacao;
      if n + p_pedidas > p_paginas_leitura then
        raise exception 'limite_paginas' using hint = p_paginas_leitura::text;
      end if;
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
  -- "restantes" são os jogos que ainda cabem hoje: é o que a tela mostra.
  select count(*) into n from geracoes j
   where j.conta = p_conta and j.tipo = 'jogo' and j.criado > now() - interval '24 hours'
     and (j.criado > now() - interval '15 minutes'
          or exists (select 1 from geracoes p where p.criacao = j.id and p.custo_usd > 0));
  return query select novo, greatest(p_limite_jogos - n, 0);
end $$;

revoke execute on function reservar_geracao(uuid, text, bigint, int, int, int, int, int, int, numeric, numeric)
  from public, anon, authenticated;
grant execute on function reservar_geracao(uuid, text, bigint, int, int, int, int, int, int, numeric, numeric)
  to service_role;
