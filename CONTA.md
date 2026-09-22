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

O painel do Supabase mudou e agora são **duas seções separadas** em
**Project Settings** — não existe mais uma única aba "API".

**A URL** fica em **Project Settings → Data API**, no campo *Project URL*:

```
https://abcdefghijklm.supabase.co
```

> Cuidado: a documentação do Supabase mostra a URL terminando em `/rest/v1/`.
> Aqui use **só a base**, sem o `/rest/v1`.

**A chave** fica em **Project Settings → API Keys**, na aba *API keys*, campo
**publishable key**:

```
sb_publishable_xxxxxxxxxxxxxxxxxxxxxx
```

É essa que vai no HTML — ela é pública por desenho, e quem protege os dados é
a política de acesso por linha que você criou no passo 2.

> **Nunca** use a *secret key* (`sb_secret_...`). Ela dá acesso total e
> ignora as políticas. A página avisa se você colar a errada.

> Projeto antigo? Pode haver só a aba **Legacy API keys**, com a chave
> `anon public` (começa com `eyJ`). Essa também funciona. As legadas serão
> desativadas até o fim de 2026.

## 4. Colar no código

Em `build/_conta.js`, no topo:

```js
const CONTA = {
  url:   "https://abcdefghijklm.supabase.co",
  chave: "sb_publishable_xxxxxxxxxxxxxxxxxxxxxx",
};
```

Depois rode `sh build/rebuild.sh` e publique. A aba **Conta** passa a mostrar
o formulário de entrada.

Se algum dos dois estiver errado, a aba **Conta** diz qual e por quê — URL com
`/rest/v1` no fim, ou a chave secreta no lugar da pública — em vez de dar erro
de rede sem explicação.

## 5. Dizer ao Supabase qual é o endereço do jogo

**Este passo não é opcional.** Por padrão o Supabase acha que o site roda em
`http://localhost:3000`, e manda o link de confirmação de e-mail para lá — que
no seu celular dá *conexão recusada*.

Em **Authentication → URL Configuration**:

- **Site URL**: `https://alansantospi.github.io/jogos-de-estudo/`
- **Redirect URLs**: adicione o mesmo endereço

### Mais simples: dispensar a confirmação

Para um jogo de família, com uma conta só e o e-mail sendo seu, a confirmação
não protege de nada. Em **Authentication → Sign In / Providers → Email**,
desligue **Confirm email**. O cadastro passa a valer na hora.

Se você já tentou criar a conta antes disso, ela ficou pendente. Em
**Authentication → Users**, apague o usuário e cadastre de novo pelo jogo —
ou confirme-o ali mesmo, pelo menu de três pontos.

Mesmo desligando a confirmação, deixe o **Site URL** correto: ele também vale
para recuperação de senha e para o login com Google.

## 6. Opcional: entrar com Google

Em **Authentication → Sign In / Providers → Google**, ligue o provedor e siga
as instruções do Supabase — exige criar credenciais OAuth no Google Cloud. O
Site URL do passo 5 já cobre o retorno.

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
