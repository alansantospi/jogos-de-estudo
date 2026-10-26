-- A leitura de foto e PDF também chama o modelo e também custa. Ela passa
-- pelas mesmas cercas da geração e fica na mesma tabela; `tipo` separa as
-- duas na hora de ver para onde foi o gasto.

alter table geracoes add column tipo text not null default 'gerar'
  check (tipo in ('gerar', 'ler'));

-- A assinatura muda (p_tipo), e Postgres não troca assinatura com
-- `create or replace`: sai a velha, entra a nova, com as mesmas permissões.
drop function reservar_geracao(uuid, int, int, int, numeric, numeric);

create function reservar_geracao(p_conta uuid, p_tipo text, p_caracteres int, p_pedidas int,
                                 p_limite_dia int, p_teto_dia_usd numeric,
                                 p_estimativa_usd numeric)
returns table (id bigint, restantes int)
language plpgsql security definer set search_path = public as $$
declare
  n int;
  gasto numeric;
  novo bigint;
begin
  perform pg_advisory_xact_lock(hashtext('reservar_geracao'));

  -- Leitura e geração dividem a mesma cota: as duas custam.
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

  insert into geracoes (conta, tipo, caracteres, pedidas)
  values (p_conta, p_tipo, p_caracteres, p_pedidas) returning geracoes.id into novo;
  return query select novo, p_limite_dia - n - 1;
end $$;

revoke execute on function reservar_geracao(uuid, text, int, int, int, numeric, numeric)
  from public, anon, authenticated;
grant execute on function reservar_geracao(uuid, text, int, int, int, numeric, numeric) to service_role;
