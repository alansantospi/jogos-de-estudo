# Ligar a geração de questões

A tela `gerar.html` recebe o material colado e devolve questões para revisar.
Quem gera é uma função no Supabase, porque a chave da API não pode ir para o
navegador. Ligar é uma vez só, uns quinze minutos, e precisa da conta já
ligada (`CONTA.md`).

## O que custa

Cada geração chama o Claude Opus 5.5 com esforço alto, e isso é dinheiro de
verdade. Pelo tamanho do pedido, uma geração de 10 questões deve ficar entre
US$ 0,15 e US$ 0,40; a regeração das que reprovam soma um pouco. **Isso é
estimativa, não medida**: o custo real de cada uma aparece na tela, logo
acima das questões, e fica na tabela `geracoes`.

Há três cercas, da mais próxima à mais distante:

| cerca | padrão | onde muda |
|---|---|---|
| gerações por conta em 24 h | 10 | `LIMITE_POR_DIA` |
| gasto de todas as contas em 24 h | US$ 5 | `TETO_DIA_USD` |
| gasto do mês na Anthropic | — | console da Anthropic, passo 3 |

As duas primeiras são da função; a terceira é a única que vale mesmo se a
função tiver um defeito. **Configure a terceira.**

## 1. Instalar a CLI do Supabase

```sh
brew install supabase/tap/supabase
supabase login
supabase link --project-ref bjlbfstuossmxnaqblih
```

O `project-ref` é o pedaço da URL do projeto antes de `.supabase.co`.

## 2. Criar a tabela

```sh
supabase db push
```

Isso roda `supabase/migrations/20261025000000_geracoes.sql`: a tabela
`geracoes` e as duas funções que reservam e registram cada geração. Sem CLI,
dá para colar o mesmo arquivo no **SQL Editor** do painel.

A conta só **lê** as próprias linhas. Quem escreve é a função, com a chave de
serviço — se o navegador pudesse escrever ali, poderia registrar custo zero.

## 3. A chave da API

1. Em <https://console.anthropic.com>, **API Keys → Create Key**.
2. Nas configurações da organização no console, ponha um limite de gasto
   mensal (*spend limit*). É a cerca que não depende do nosso código.
3. Guarde a chave no Supabase, não no repositório:

```sh
supabase secrets set ANTHROPIC_API_KEY=sk-ant-...
```

Para mudar os limites, do mesmo jeito, sem novo deploy:

```sh
supabase secrets set LIMITE_POR_DIA=20 TETO_DIA_USD=10
```

## 4. Publicar a função

O build escreve na função a lista de desenhos que uma questão pode usar,
então ele vem antes:

```sh
sh build/rebuild.sh
supabase functions deploy gerar
```

## 5. Conferir

Abra `gerar.html`, entre com a conta da família, cole um texto de pelo menos
300 caracteres e gere 5 questões. Deve levar de meio minuto a dois minutos.

Para ver o que já se gastou, no **SQL Editor**:

```sql
select date_trunc('day', criado) dia, count(*) geracoes, sum(custo_usd) gasto
  from geracoes group by 1 order by 1 desc;
```

## Quando dá errado

| a tela diz | o que é |
|---|---|
| "A chave da API não foi aceita" | o passo 3 não foi feito, ou a chave foi revogada |
| "Não consegui reservar a geração" | a migração do passo 2 não rodou |
| "Você já fez as N gerações de hoje" | a cerca por conta; a contagem é das últimas 24 h |
| "A geração está pausada por hoje" | o teto global; vale para todas as contas |
| "Faltou tempo para regerar" | a primeira rodada demorou e a função tem teto de 150 s no plano grátis; as questões vêm, sem a troca das reprovadas |

Uma geração que falha sem ter gastado nada não consome a vez.
