-- A lição do jogo criado é escrita uma missão por pedido, como as questões:
-- cada pedido é uma linha `tipo = 'licao'` apontando para a criação. Conta
-- no teto de gasto e no número de pedidos do jogo, não no limite de jogos.

alter table geracoes drop constraint geracoes_tipo_check;
alter table geracoes add constraint geracoes_tipo_check
  check (tipo in ('jogo', 'plano', 'gerar', 'licao', 'ler'));
