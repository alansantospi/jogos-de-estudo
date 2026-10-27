# Ligar a geração de questões

A tela `gerar.html` recebe o material colado, ou fotos e PDF, e devolve
questões para revisar.
Quem gera é uma função no Supabase, porque a chave da API não pode ir para o
navegador. Ligar é uma vez só, uns quinze minutos, e precisa da conta já
ligada (`CONTA.md`).

## O que custa

Cada jogo chama o Claude Opus 5.5 com esforço alto, e isso é dinheiro de
verdade. Um jogo é um pedido que divide o material em missões e, por
missão, um pedido de questões (até 12) e um da lição, quatro ao mesmo
tempo. Cada pedido manda o material inteiro, então o custo cresce com o
material e com o número de missões.

**Medido em 26/10/2026**, com 5 fotos de História (4.676 caracteres lidos):
leitura US$ 0,11; plano US$ 0,04; cinco partes US$ 0,46 — 23 questões por
US$ 0,61, uns US$ 0,027 por questão, em cerca de 1 minuto. Partes que
precisaram de uma rodada de correção custaram o dobro das outras. Isso foi
antes da lição, que acrescenta um pedido de esforço médio por missão:
**estimativa, não medida**, de US$ 0,03 a 0,06 cada. Um jogo de 100
questões deve ficar perto de US$ 3, e um de 200, o máximo, perto de US$ 6 —
dois desses num dia já passam da metade do teto diário. O custo real de cada jogo aparece na
tela, logo acima das questões, e fica na tabela `geracoes`.

Há três cercas, da mais próxima à mais distante:

| cerca | padrão | onde muda |
|---|---|---|
| jogos por conta em 24 h | 3 | `LIMITE_POR_DIA` |
| leituras de foto por conta em 24 h | 10 | `LIMITE_LEITURAS` |
| páginas por leitura (lidas de 10 em 10; os lotes depois do primeiro não contam como outra leitura) | 30 | `LIMITES_LEITURA` em `leitura.ts` |
| questões por jogo | 200 | `LIMITES.totalMax` em `esteira.ts` |
| pedidos dentro de um jogo | 60 | `MAX_PARTES` |
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

## Nome, matéria e quantas questões

Na etapa Conferir, o nome do jogo e a matéria podem ficar em branco:

- vindo de fotos ou PDF, a leitura sugere os dois a partir do que está
  impresso nas páginas (o título do capítulo e a disciplina), e a tela
  preenche os campos que a pessoa ainda não escreveu;
- vindo de texto colado, quem sugere é o plano, na hora de gerar.

**Quantas questões** vem marcado em **O material decide**, como nos jogos
feitos à mão: o plano recebe o teto (200) e escreve quantas o material
sustenta sem repetir nem inventar. A tela mostra quantas devem vir, pela
régua de ~170 caracteres por questão (medida num jogo real: 4.676
caracteres deram 28). Os botões 10, 30, 60, 100 e 200 pedem um número; pedir
além do que o material sustenta avisa antes de gerar, porque o plano só
distribui o que cabe: pedir 100 com material para 37 traz umas 37.

## Jogar o que foi criado

Na revisão, **Salvar e jogar** guarda as questões aprovadas na conta (tabela
`jogos`, da migração `20261027010000_jogos.sql`) e abre `jogar.html?id=…`,
que monta o jogo no navegador com o mesmo motor dos jogos feitos à mão. O
jogo aparece na página inicial, em "Meus jogos", para quem entrar na
mesma conta. Depois de aberto uma vez, abre também sem internet.

Salvar de novo atualiza o mesmo jogo. **Baixar** continua existindo: é o
arquivo para `conteudo/`, para quem quer o jogo montado pelo build, com a
lição em `licao` (o build ainda não a usa: as lições dele são escritas à
mão em `build/licao_*.py`).

O que o jogo criado ainda não tem: o desenho de cada passo da lição, e
progresso sincronizado entre aparelhos (a sincronização só conhece os jogos
do build).

## A lição

Cada missão ganha um ou dois passos de lição, escritos junto com as
questões (`supabase/functions/_esteira/licao.ts`), no formato das lições
feitas à mão: a ideia, cartões de tocar ou uma escolha que mostra o
resultado, a pegadinha e uma checagem. Só falta o desenho. O jogo abre com
**Estudar passo a passo** e **Ver o resumo**, como os outros.

Cada passo cita o trecho do material que o sustenta. Passo cujo trecho não
está no material volta ao modelo uma vez; se ainda assim não bater, chega à
revisão **fora da lição** e não pode ser posto de volta. Na revisão, o bloco
**Lição** (fechado, acima das questões) mostra cada passo para conferir e
tirar. Entram no jogo só os passos das missões com questão aprovada.

Jogo salvo antes da lição ganha o botão **Criar a lição** em Editar, se
tiver material guardado. Conta como um jogo do dia.

O texto da lição vira HTML no jogo. O servidor tira toda marcação que não
seja `<b>`, e o navegador escapa tudo de novo antes de montar: material
colado pode trazer qualquer coisa.

## Gerir os jogos criados

`gerar.html#meus` (aba **Meus jogos**, ou "Editar ou apagar" no índice)
lista os jogos da conta. Cada um tem:

- **Jogar** — abre `jogar.html?id=…`.
- **Editar** — reabre o jogo na revisão, com todas as questões aprovadas. Ali
  se renomeia (nome e matéria), edita, descarta, e **Atualizar e jogar**
  grava por cima do mesmo jogo. Editar não chama o modelo nem gasta jogo.
- **Acrescentar questões** (dentro de Editar) — o material novo passa pelas
  etapas de sempre; as missões novas saem só dele e entram depois das que o
  jogo já tem, sem tocar nelas. Conta como um jogo do dia. O jogo guarda o
  material somado, até 120 mil caracteres e 200 questões.
- **Compartilhar** — liga um link `jogar.html?l=…` para jogar sem entrar
  na conta; **Desligar link** o apaga. Detalhes em `BETA.md`.
- **Apagar** — pede um segundo toque; apaga da conta e do aparelho.

Precisa da migração `20261027020000_gerir_jogos.sql`: ela guarda o material
de cada jogo, contra o qual a questão editada é reconferida. Jogo salvo antes
dela reabre sem material, e então a edição não é reconferida.

## Quando dá errado

| a tela diz | o que é |
|---|---|
| "A chave da API não foi aceita" | o passo 3 não foi feito, ou a chave foi revogada |
| "Não consegui reservar a geração" | a migração do passo 2 não rodou |
| "A tabela de jogos ainda não existe" | falta `supabase db push` da migração de jogos |
| "Não consegui buscar os jogos: column … does not exist" | falta `supabase db push` da migração `gerir_jogos` |
| "Ação desconhecida" ao gerar a lição | falta `supabase functions deploy gerar` |
| lição "não veio" com erro de reserva | falta `supabase db push` da migração `licao` |
| "Não consegui mudar o link: column … link does not exist" | falta `supabase db push` da migração `beta_fechado` |
| "Este link não abre mais" | o dono desligou o link, ou apagou o jogo |
| "Conta nova só com código de convite válido" | o convite não existe, esgotou ou foi desligado (`BETA.md`) |
| "Este jogo já está no tamanho máximo" | acrescentar passaria de 120 mil caracteres de material ou 200 questões |
| "Você já criou os N jogos de hoje" | a cerca por conta; a contagem é das últimas 24 h |
| "A geração está pausada por hoje" | o teto global; vale para todas as contas |
| "Nenhuma página deu para ler" | foto escura, tremida ou de longe; refaça de frente, com luz, a página inteira no quadro |
| "Não consegui abrir … (HEIC)" | foto do iPhone aberta no computador; exporte como JPEG, ou mande pelo próprio celular |
| "Faltou tempo para regerar" | a primeira rodada demorou e a função tem teto de 150 s no plano grátis; as questões vêm, sem a troca das reprovadas |

Uma geração que falha sem ter gastado nada não consome a vez.
