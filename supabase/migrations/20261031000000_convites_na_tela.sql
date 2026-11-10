-- Criar e desligar convites pela aba Conta, em vez do SQL Editor. Só quem
-- está em `admins` vê e usa; a lista de admins só muda pelo SQL Editor:
--
--   insert into admins select id from auth.users where email = 'voce@exemplo.com';
--
-- As três funções leem por cima da RLS (security definer), então cada uma
-- confere o admin antes de qualquer coisa. Sem isso, qualquer conta logada
-- criaria convites.

create table admins (
  conta uuid primary key references auth.users on delete cascade
);
alter table admins enable row level security;

create function sou_admin() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from admins where conta = auth.uid())
$$;

create function criar_convite(nota text, max_usos int) returns text
language plpgsql security definer set search_path = public as $$
begin
  if not sou_admin() then raise exception 'so_admin'; end if;
  if length(coalesce(trim(nota), '')) not between 1 and 120 then raise exception 'nota_invalida'; end if;
  if max_usos not between 1 and 500 then raise exception 'usos_invalidos'; end if;
  return novo_convite(trim(nota), max_usos);
end $$;

-- Os e-mails de quem entrou com cada código: é para o admin saber quem
-- está no beta, e só o admin chega aqui.
create function listar_convites()
returns table (codigo text, nota text, usos int, max_usos int, ativo boolean, criado timestamptz, contas text[])
language plpgsql stable security definer set search_path = public as $$
begin
  if not sou_admin() then raise exception 'so_admin'; end if;
  return query
    select c.codigo, c.nota, c.usos, c.max_usos, c.ativo, c.criado,
           coalesce(array_agg(u.email::text order by k.criado) filter (where u.id is not null), '{}')
      from convites c
      left join cadastros k on k.convite = c.codigo
      left join auth.users u on u.id = k.conta
     group by c.codigo
     order by c.criado desc
     limit 200;
end $$;

create function mudar_convite(codigo text, ativo boolean) returns void
language plpgsql security definer set search_path = public as $$
begin
  if not sou_admin() then raise exception 'so_admin'; end if;
  update convites c set ativo = mudar_convite.ativo where c.codigo = mudar_convite.codigo;
  if not found then raise exception 'convite_inexistente'; end if;
end $$;

revoke all on function sou_admin() from public, anon;
revoke all on function criar_convite(text, int) from public, anon;
revoke all on function listar_convites() from public, anon;
revoke all on function mudar_convite(text, boolean) from public, anon;
grant execute on function sou_admin() to authenticated;
grant execute on function criar_convite(text, int) to authenticated;
grant execute on function listar_convites() to authenticated;
grant execute on function mudar_convite(text, boolean) to authenticated;
