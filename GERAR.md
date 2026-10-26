# Ligar a geração de questões

A tela `gerar.html` recebe o material colado, ou fotos e PDF, e devolve
questões para revisar.
Quem gera é uma função no Supabase, porque a chave da API não pode ir para o
navegador. Ligar é uma vez só, uns quinze minutos, e precisa da conta já
ligada (`CONTA.md`).

## O que custa

Cada jogo chama o Claude Opus 5.5 com esforço alto, e isso é dinheiro de
verdade. Um jogo é um pedido que divide o material em missões e mais um
pedido por missão, até 12 questões cada, quatro ao mesmo tempo. Cada pedido
manda o material inteiro, então o custo cresce com o material e com o
número de missões: perto de US$ 0,20 a 0,40 por missão, ou seja, uns
US$ 0,60 a 1,20 para 30 questões e US$ 2 a 4 para 100. Ler fotos
custa à parte: cada foto pesa uns 1.600 tokens de entrada, e o texto lido
volta como saída, então dez fotos de livro devem ficar entre US$ 0,20 e
US$ 0,50. **Isso é estimativa, não medida**: o custo real de cada uma aparece na tela, logo
acima das questões, e fica na tabela `geracoes`.

Há três cercas, da mais próxima à mais distante:

| cerca | padrão | onde muda |
|---|---|---|
| jogos por conta em 24 h | 3 | `LIMITE_POR_DIA` |
| leituras de foto por conta em 24 h | 10 | `LIMITE_LEITURAS` |
| pedidos dentro de um jogo | 20 | `MAX_PARTES` |
| gasto de todas as contas em 24 h | US$ 15 | `TETO_DIA_USD` |
| gasto do mês na Anthropic | — | console da Anthropic, passo 3 |

Um jogo que morre sem ter gastado nada (o modelo nem respondeu) não conta.

As quatro primeiras são da função; a terceira é a única que vale mesmo se a
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

**Ordem, quando há migração nova:** `supabase db push` antes do deploy. A
função chama `reservar_geracao` com a assinatura da migração mais recente;
publicada antes dela, toda geração e toda leitura param com "Não consegui
reservar a geração".

## 5. Conferir

Abra `gerar.html`, entre com a conta da família, cole um texto de pelo menos
300 caracteres e gere 5 questões. Deve levar de meio minuto a dois minutos.

Para a leitura, escolha duas ou três fotos de página de livro e toque em
**Ler arquivos**. Cada página volta com o texto lido e um selo: lida, lida em
parte ou não deu para ler. O texto das marcadas vai para a caixa de material;
confira antes de gerar, porque as questões só usam o que estiver ali.

Para ver o que já se gastou, no **SQL Editor**:

```sql
select date_trunc('day', criado) dia, count(*) geracoes, sum(custo_usd) gasto
  from geracoes group by 1 order by 1 desc;
```

## Jogar o que foi criado

Na revisão, **Salvar e jogar** guarda as questões aprovadas na conta (tabela
`jogos`, da migração `20261027010000_jogos.sql`) e abre `jogar.html?id=…`,
que monta o jogo no navegador com o mesmo motor dos jogos feitos à mão. O
jogo aparece na página inicial, em "Criados na conta", para quem entrar na
mesma conta. Depois de aberto uma vez, abre também sem internet.

Salvar de novo atualiza o mesmo jogo. **Baixar** continua existindo: é o
arquivo para `conteudo/`, para quem quer o jogo montado pelo build, com
lição.

O que o jogo criado ainda não tem: lição, e progresso sincronizado entre
aparelhos (a sincronização só conhece os jogos do build).

## Quando dá errado

| a tela diz | o que é |
|---|---|
| "A chave da API não foi aceita" | o passo 3 não foi feito, ou a chave foi revogada |
| "Não consegui reservar a geração" | a migração do passo 2 não rodou |
| "A tabela de jogos ainda não existe" | falta `supabase db push` da migração de jogos |
| "Você já criou os N jogos de hoje" | a cerca por conta; a contagem é das últimas 24 h |
| "A geração está pausada por hoje" | o teto global; vale para todas as contas |
| "Nenhuma página deu para ler" | foto escura, tremida ou de longe; refaça de frente, com luz, a página inteira no quadro |
| "Não consegui abrir … (HEIC)" | foto do iPhone aberta no computador; exporte como JPEG, ou mande pelo próprio celular |
| "Faltou tempo para regerar" | a primeira rodada demorou e a função tem teto de 150 s no plano grátis; as questões vêm, sem a troca das reprovadas |

Uma geração que falha sem ter gastado nada não consome a vez.
