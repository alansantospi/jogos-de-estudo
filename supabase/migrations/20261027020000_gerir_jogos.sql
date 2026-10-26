-- Gerir um jogo criado: reabrir para editar, acrescentar questões, renomear.
--
-- Editar precisa do material: é contra ele que o trecho de cada questão é
-- conferido, inclusive depois de editada. E acrescentar questões depois
-- confere as novas contra o material antigo somado ao novo. O teto é o do
-- material de duas gerações cheias.
--
-- `questoes` é só para a lista de jogos mostrar quantas são sem baixar o
-- conteúdo inteiro de cada um.

alter table jogos add column material text not null default ''
  check (length(material) <= 120000);
alter table jogos add column ano text not null default '';
alter table jogos add column questoes int
  generated always as (jsonb_array_length(conteudo -> 'questoes')) stored;
