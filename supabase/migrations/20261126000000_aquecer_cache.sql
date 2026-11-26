-- O cache do material: todos os pedidos de questões de um jogo começam
-- iguais (sistema, esquema, material), e o mesmo vale para os de lição. O
-- primeiro pedido de cada tipo grava o cache; os seguintes leem a uma fração
-- do preço. Mas pedidos que saem juntos não leem o cache um do outro: se as
-- quatro primeiras missões partissem ao mesmo tempo, as quatro pagariam a
-- gravação. Por isso, enquanto nenhuma tarefa de um tipo terminou, só uma
-- daquele tipo roda por criação; terminada a primeira, volta o paralelo de
-- sempre. A primeira missão e a primeira lição ainda correm juntas: são
-- caches diferentes.
create or replace function pegar_tarefa(p_prazo_s int, p_paralelo int, p_tentativas int)
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
     and (x.tipo = 'planejar'
          or exists (select 1 from tarefas y
                      where y.criacao = x.criacao and y.tipo = x.tipo and y.estado in ('feita', 'falhou'))
          or not exists (select 1 from tarefas y
                          where y.criacao = x.criacao and y.tipo = x.tipo
                            and y.estado = 'fazendo' and y.prazo >= now()))
   order by x.ordem, x.id
   limit 1
   for update skip locked;
  if not found then return; end if;

  update tarefas set estado = 'fazendo', tentativas = tentativas + 1,
         prazo = now() + make_interval(secs => p_prazo_s)
   where id = t.id returning * into t;
  return next t;
end $$;
