# Criar jogo em um toque

Hoje: fotografa → espera a leitura → confere → toca em Gerar → espera de 2 a
8 minutos **com a tela aberta** → revisa → joga. Duas esperas pagas, uma
parada no meio, e se o celular apagar durante a segunda espera, o que estava
a caminho se perde e o dinheiro já foi.

Depois: **fotografa → toca em Criar jogo → pode fechar o app → volta e o jogo
está pronto, na capa, com Jogar.** Revisar vira opção, não etapa.

## Por que precisa de servidor

Quem conduz a criação hoje é o navegador: ele pede o plano, depois cada
missão e cada lição, quatro de cada vez, e guarda o resultado. Fechou a
tela, parou.

A condução não cabe numa chamada só da função: no plano gratuito do Supabase
cada chamada morre em 150 s, e um jogo de 200 questões são ~35 pedidos ao
modelo. Então o trabalho vira **uma fila no banco**, e a função passa a
**trabalhar a fila**: pega um pedido, faz, grava, pega o próximo.

## O que o pai vê

### 1. Material
- Fotografar / galeria / colar texto, como hoje.
- Um botão só: **Criar jogo**.
- **Ajustar** (opcional, recolhido): nome, matéria, cor, quantidade, ano,
  e "Conferir a leitura antes de gerar" para quem quer o caminho de hoje.
  Sem tocar em nada, valem os padrões: nome e matéria sugeridos, cor da
  matéria, "o material decide", o último ano usado.

### 2. Criando
- A capa aparece assim que o plano volta (nome e matéria sugeridos, na cor).
- Abaixo, uma barra: "3 de 8 missões".
- Uma linha: **"Pode fechar. O jogo fica em Meus jogos quando ficar pronto."**
- Fechar, voltar, recarregar, trocar de aparelho: a tela retoma de onde está.

### 3. Pronto
- A capa grande e **Jogar**.
- Secundários: **Compartilhar** (link e QR) e **Revisar** (com o número de
  questões com aviso, se houver).
- Se alguma missão não veio: "2 missões não vieram. **Tentar de novo**" —
  dentro do mesmo jogo, sem gastar outro do dia.

A página inicial mostra o jogo em criação como card em "Meus jogos", com
"Criando…", e ele vira card normal quando fica pronto.

## Regras

- **O que entra no jogo** é o mesmo de "Pronto, jogar": questão sem aviso.
  Com aviso, fica guardada para revisar, fora do jogo.
- **O jogo é salvo sozinho** quando a última tarefa termina. Revisar depois
  é o "Editar" de hoje, em Meus jogos.
- **Leitura sem conferência:** a página ilegível e o escrito à mão já ficam
  de fora pela própria leitura. Quem quer conferir liga a opção em Ajustar.
- **Uma criação por vez por conta.** Tocar em Criar com outra em curso
  mostra a que está em curso.
- **Limites e teto continuam os mesmos** (`reservar_geracao`): um jogo do
  dia, `MAX_PARTES`, teto de gasto de todas as contas. Tentar de novo uma
  missão conta dentro do mesmo jogo, como hoje.
- **Cada tarefa tenta até 2 vezes sozinha** antes de virar "não veio".

## Como funciona por dentro

### Banco (uma migração)

`criacoes` — uma por jogo em criação.
- `conta`, `estado` (`lendo` | `planejando` | `escrevendo` | `pronta` |
  `falhou`), `pedido` (nome, matéria, cor, ano, total, automático),
  `material`, `paginas`, `plano`, `jogo` (o id em `jogos`, quando salvo),
  `geracao` (a linha `tipo = 'jogo'` de `geracoes`, para o limite e o custo).

`tarefas` — um pedido ao modelo.
- `criacao`, `tipo` (`ler` | `planejar` | `missao` | `licao`), `alvo`,
  `estado` (`fila` | `fazendo` | `feita` | `falhou`), `tentativas`,
  `prazo` (até quando o trabalhador que a pegou tem a vez), `resultado`,
  `erro`, `custo_usd`.

RLS: a conta **lê** as suas; **só a função escreve** (chave de serviço), como
`geracoes` hoje — senão o navegador poderia gravar resultado ou custo.
Realtime ligado em `criacoes` e `tarefas`, para a tela acompanhar sem
perguntar de segundo em segundo.

### Fotos

Para a leitura correr no servidor, as fotos sobem antes: bucket privado
`material`, em `conta/criacao/n.jpg`, já reduzidas como hoje. **São apagadas
quando a leitura termina.** Isso muda o que a política de privacidade diz:
hoje a foto só passa pela função; passa a ficar guardada por alguns minutos.
`privacidade.html` precisa dizer isso antes de ir ao ar.

### Função `gerar`

Ações novas:
- `criar` — recebe o pedido (e os caminhos das fotos, ou o texto), reserva o
  jogo do dia, cria a `criacao` e as primeiras tarefas (`ler`, ou já
  `planejar`), e acorda os trabalhadores. Responde na hora com o id.
- `trabalhar` — interna. Pega **uma** tarefa da fila (`for update skip
  locked`, com `prazo` de 3 min), faz, grava o resultado e o custo, enfileira
  as próximas (o plano gera as tarefas de missão e de lição; a última tarefa
  monta o conteúdo e grava em `jogos`), e chama `trabalhar` de novo antes de
  terminar. Até 4 cadeias por criação, como o `PARALELO` de hoje.
- `tentar` — recoloca na fila uma tarefa que falhou.

Rede de segurança: **Supabase Cron** a cada minuto chama `trabalhar` se houver
tarefa na fila sem ninguém, ou tarefa `fazendo` com `prazo` vencido (o
trabalhador morreu no corte de 150 s). Nada fica parado.

`montarConteudo`, que hoje está no navegador, passa para
`supabase/functions/_esteira/`, para o servidor montar o jogo. O navegador
usa a mesma, importada do mesmo arquivo pelo build.

As ações de hoje (`ler`, `abrir`, `planejar`, `gerar`, `licao`) continuam
enquanto a tela antiga existir, e saem na fase 2.

### Avisar que ficou pronto

Fechar o app e receber "seu jogo está pronto" exige **notificação push**, e
no iPhone o push da web só funciona com o site instalado como app (PWA). Por
isso fica para a fase 3, junto com a PWA. Até lá, quem volta encontra o jogo
pronto em Meus jogos e na página inicial.

## Fases

1. **Fila e trabalhador.** A tela continua a mesma, mas quem conduz é o
   servidor: fechar a tela não perde mais nada. É a fase que tira o risco
   de dinheiro perdido.
2. **Um toque.** Material → Criar jogo → Criando → Pronto. Ajustar
   recolhido. Saem as etapas Jogo e Revisar como portão, e as ações antigas
   da função.
3. **PWA e push.** Instalar, abrir sem rede, e o aviso de jogo pronto.

Cada fase vai ao ar sozinha.

## O que custa

- **Modelo:** igual. São os mesmos pedidos; muda quem os faz.
- **Supabase:** chamadas de função a mais (uma por tarefa, mais o cron por
  minuto) e alguns MB de foto por poucos minutos. Cabe no plano gratuito
  para o uso do beta; vale medir na fase 1.
- **Tentativa automática:** até 2 por tarefa pode dobrar o custo de uma
  missão que falha. O teto diário continua valendo.

## Riscos

- **Corte de 150 s no meio de uma tarefa:** o modelo é pago e a resposta se
  perde. Hoje acontece igual; o `prazo` e o cron fazem a tarefa voltar à
  fila em vez de ficar presa. O custo da tentativa perdida fica registrado.
- **Cadeia que para:** o cron retoma em até um minuto.
- **Duas cadeias pegando a mesma tarefa:** `skip locked` impede.
- **Trocar a tela antiga com criação em curso:** a fase 2 só entra quando a
  fase 1 já conduziu tudo; não há criação conduzida pelo navegador a migrar.

## Como saber que funcionou

- **Fase 1:** criar um jogo, fechar a aba no meio, reabrir: está tudo lá e
  terminou sozinho. Matar a função no meio de uma tarefa (teste com prazo
  curto): o cron retoma. Em `teste/esteira/`, a fila inteira com um modelo
  de mentira: ordem, paralelismo de 4, tentativa automática, custo somado
  igual ao de hoje.
- **Fase 2:** do toque em "Criar jogo" a "Jogar", nenhum toque obrigatório
  no meio. Ver alguém criar um jogo no celular, sem ajuda, uma vez.
- **Fase 3:** com o app instalado e fechado, o aviso chega.

## Decisões (10/11/2026)

1. **Fotos guardadas por minutos:** sim. A política de privacidade é
   atualizada na fase 2, junto com a subida das fotos.
2. **Uma criação por vez por conta:** sim.
3. **Tentativa automática:** **1** (cada tarefa tem no máximo 2 tentativas
   sozinha). "Tentar de novo" na tela dá mais uma.
4. **Plano do Supabase:** fica no gratuito (corte de 150 s). A fila e o cron
   cobrem o corte; se a fase 1 mostrar muita tarefa cortada, reavaliar com
   os números de `tarefas`.

## Fase 1, como ficou

- A leitura de fotos continua no navegador (fase 2 a move). A fila começa
  no plano: `criar` reserva o jogo e enfileira `planejar`; o plano enfileira
  as missões e as lições.
- O jogo é salvo pelo servidor quando a última tarefa termina, com as
  questões sem aviso. Tentar de novo depois disso traz as questões para a
  revisão aberta, e "Atualizar e jogar" as leva para o jogo.
- Acrescentar questões a um jogo salvo e criar a lição de um jogo antigo
  continuam conduzidos pelo navegador até a fase 2.

## Fase 2a, como ficou

- Material → **Criar jogo** → Criando → Pronto. "Ajustar" fica recolhido
  no Material (capa, cor, quantas, ano), com o resumo do que vale à vista.
- "Conferir a leitura antes de criar" leva à etapa de conferir, como antes.
  Ela também abre sozinha quando o material não serve como está (nada lido,
  curto ou longo demais).
- Criando: a capa na cor do jogo, a barra de andamento, "N de M missões" e
  "Pode fechar". Pronto: **Jogar**; Compartilhar, Revisar (com quantas têm
  aviso) e Novo jogo como opção; o que não veio, com Tentar de novo; o que
  chegou depois de salvo, com "Pôr no jogo".
- A página inicial mostra a criação em curso como card "Criando…", que leva
  à tela de criar.
- **Falta (2b):** as fotos subirem e a leitura ir para a fila. Até lá, a
  tela precisa ficar aberta só enquanto lê as fotos. Acrescentar questões e
  criar a lição de jogo antigo ainda são conduzidos pela tela, e as ações
  antigas da função ficam por causa deles.
