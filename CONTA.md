# Ligar a conta (sincronizar entre aparelhos)

Hoje o progresso de cada aluno fica **no aparelho**. Funciona sem internet,
mas não passa do notebook para o celular. Para sincronizar falta criar um
projeto gratuito e colar dois valores no código — dez minutos, uma vez só.

Escolhi **Supabase** por um motivo concreto: a chave que vai no HTML é
pública por desenho, e quem protege os dados é a política de acesso por
linha, não o segredo da chave. Isso importa aqui, porque o repositório é
público.

## 1. Criar o projeto

1. Entre em <https://supabase.com> e crie uma conta (o plano gratuito basta).
2. **New project** — dê um nome, escolha a região **South America (São Paulo)**
   e guarde a senha do banco.
3. Espere o projeto subir (uns 2 minutos).

## 2. Criar a tabela e as regras de acesso

Em **SQL Editor**, cole isto e rode:

```sql
create table familias (
  id uuid primary key references auth.users on delete cascade,
  dados jsonb not null default '{}'::jsonb,
  atualizado timestamptz not null default now()
);

alter table familias enable row level security;

-- Cada conta só enxerga e só escreve a própria linha. É esta regra que
-- torna seguro publicar a chave anon no HTML.
create policy "dono lê"     on familias for select using (auth.uid() = id);
create policy "dono insere" on familias for insert with check (auth.uid() = id);
create policy "dono altera" on familias for update using (auth.uid() = id);
```

## 3. Pegar os dois valores

Em **Project Settings → API**:

- **Project URL** — algo como `https://abcdefgh.supabase.co`
- **anon public** — a chave longa que começa com `eyJ...`

## 4. Colar no código

Em `build/_conta.js`, no topo:

```js
const CONTA = {
  url:   "https://abcdefgh.supabase.co",
  chave: "eyJ...",
};
```

Depois rode `sh build/rebuild.sh` e publique. A aba **Conta** passa a mostrar
o formulário de entrada.

## 5. Opcional: entrar com Google

Em **Authentication → Providers → Google**, ligue o provedor e siga as
instruções do Supabase (exige criar credenciais OAuth no Google Cloud). Em
**Authentication → URL Configuration**, ponha
`https://alansantospi.github.io/jogos-de-estudo/` como Site URL. Sem isso, o
botão "Entrar com Google" não volta para o lugar certo.

## Como a sincronização se comporta

- **Uma conta por família, vários alunos dentro dela.** A criança não precisa
  de senha; quem entra é você.
- **O histórico só cresce.** Partidas dos dois aparelhos são reunidas e
  ordenadas por data, sem sobrescrever — jogar no celular não apaga o que foi
  feito no tablet.
- **No progresso por questão fica o maior número de acertos e de erros** de
  cada lado. Não dá para somar sem inventar contagem, e o maior é o mais
  fiel ao que a criança realmente fez.
- **Sincroniza ao entrar e no botão "Sincronizar agora".** Não é contínuo, de
  propósito: menos chamada, menos surpresa.

## O que isso significa para os dados da Anne

O progresso de estudo dela passa a ficar também num servidor do Supabase, sob
a sua conta. São dados de acerto e erro por questão, mais o nome que você
escolher para o perfil — nada exige o nome verdadeiro. Se preferir não ter
isso fora do aparelho, é só não ligar a conta: tudo o mais continua
funcionando.
