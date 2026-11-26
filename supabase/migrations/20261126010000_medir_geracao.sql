-- Duas medidas que faltavam para baixar o custo sem chutar:
--
-- * quanto da entrada veio do cache. `tokens_entrada` continua sendo o
--   total (cache incluído); as colunas novas dizem quanto dele foi lido e
--   quanto foi gravado. Leitura zerada nos pedidos depois do primeiro de um
--   jogo quer dizer que alguma coisa está quebrando o cache.
-- * por que a primeira rodada reprovou, contado por motivo. A troca apaga a
--   questão ruim, e o motivo ia junto; sem ele não há como saber qual regra
--   do pedido mais gasta rodada de troca.
alter table geracoes
  add column tokens_cache_leitura int not null default 0,
  add column tokens_cache_escrita int not null default 0,
  add column motivos jsonb check (pg_column_size(motivos) < 20000);

-- Os parâmetros novos têm padrão: a versão da função já publicada, que não
-- os manda, segue funcionando até a nova subir.
drop function registrar_geracao(bigint, text, text, int, int, int, int, int, numeric, text);
create function registrar_geracao(p_id bigint, p_estado text, p_modelo text,
                                  p_entregues int, p_reprovadas int, p_rodadas int,
                                  p_tokens_entrada int, p_tokens_saida int,
                                  p_custo_usd numeric, p_erro text,
                                  p_cache_leitura int default 0, p_cache_escrita int default 0,
                                  p_motivos jsonb default null)
returns void
language sql security definer set search_path = public as $$
  update geracoes set estado = p_estado, modelo = p_modelo, entregues = p_entregues,
         reprovadas = p_reprovadas, rodadas = p_rodadas, tokens_entrada = p_tokens_entrada,
         tokens_saida = p_tokens_saida, custo_usd = p_custo_usd, erro = p_erro,
         tokens_cache_leitura = p_cache_leitura, tokens_cache_escrita = p_cache_escrita,
         motivos = p_motivos
   where id = p_id and estado = 'reservada';
$$;

revoke execute on function registrar_geracao(bigint, text, text, int, int, int, int, int, numeric, text,
                                             int, int, jsonb)
  from public, anon, authenticated;
grant execute on function registrar_geracao(bigint, text, text, int, int, int, int, int, numeric, text,
                                            int, int, jsonb)
  to service_role;
