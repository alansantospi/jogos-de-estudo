# Sistema visual — Jogos de Estudo

Direção: **jogo de quiz**, no espírito de Kahoot, Quizizz e Duolingo — lúdico
sem depender de emoji. O que dá o tom é cor forte, forma, peso tipográfico e
retorno físico ao toque.

## As quatro ideias emprestadas

| Referência | O que veio dela |
|---|---|
| **Kahoot** | cada alternativa tem **marcador e cor próprios**, para ser identificada de relance. O marcador é a **letra** (A, B, C, D), não a forma: círculo/triângulo/quadrado/losango é a assinatura do Kahoot, não uma ideia emprestada dele. A letra ainda é a convenção que a criança usa na escola. |
| **Duolingo** | botão com **lábio** de 4px que afunda ao apertar; barra de progresso grossa e arredondada; espaço generoso. |
| **Quizizz** | cor saturada carregando a tela, faixa colorida no topo, celebração curta no acerto. |
| **Quizlet** | tipografia grande e confiante, o card como objeto central. |

## Cor

Todos os 44 pares de texto e fundo foram medidos em WCAG e passam em **AA
(4,5:1)** nos dois temas. `build/contraste.py` converte OKLCH em sRGB e mede;
`python3 build/contraste.py` pode ser rodado de novo a qualquer mudança.

Duas regras que saíram dessa medição:

- **`--materia` e `--materia-solida` são tokens diferentes.** No tema escuro a
  cor da matéria clareia para servir de texto sobre o card; a versão sólida,
  usada em faixa e botão preenchido, continua escura o bastante para o texto
  branco. Misturar os dois derrubava o contraste para 1,5:1.
- **As quatro cores de alternativa não mudam entre os temas.** São
  preenchimentos que recebem a forma branca, não texto; clareá-las no escuro
  derrubava o contraste para 2:1.


Estratégia **comprometida**: a cor da matéria carrega a faixa do topo, os
botões primários e os selos.

| Matéria | Cor |
|---|---|
| Inglês | `oklch(0.55 0.20 265)` azul-violeta |
| Ciências | `oklch(0.60 0.15 195)` turquesa |
| História | `oklch(0.60 0.18 40)` laranja-terra |
| Arte | `oklch(0.56 0.22 330)` magenta |

As quatro cores de alternativa — índigo, âmbar, turquesa e violeta — foram
escolhidas **longe de vermelho e verde**, que já significam errado e certo.
Uma primeira versão usava coral e dava para confundir uma alternativa ainda
não respondida com uma marcada errada.

## Navegação

Feita para o app crescer em matérias e em conteúdo por matéria.

- **A tela mora na URL.** `#inicio`, `#licao/lesson3`, `#missoes`,
  `#missao/moon`, `#trilha/earth`. As funções públicas (`goHome`,
  `startCategory`, `startTrail`…) só escrevem o endereço; quem muda de tela
  é o roteador, ouvindo `hashchange`. Daí saem três coisas de graça: o
  botão voltar do celular recua uma tela em vez de sair do jogo,
  recarregar cai de volta onde estava, e dá para guardar o link de uma
  missão. Funciona igual em `file://`.
- **Migalhas no topo**: `Jogos / Ciências / Missões`. "Jogos" leva ao
  índice — antes não havia volta nenhuma, de dentro de um jogo só pelo
  botão do navegador. Escala para qualquer número de matérias, porque o
  seletor de matéria é o próprio índice.
- **Buscar missão**, sem acento e sem caixa: digitar "relogio" acha "as
  partes do relógio". Filtra título e descrição de missões *e* trilhas, e
  esconde o título de seção ou de grupo que ficou sem cartão. É a parte que
  escala sozinha: conteúdo novo entra sem manutenção.
- **Grupos na lista** ("Atalhos", "Regras do -ING", "Terra e Sol"…) para
  percorrer. Categoria que não está em nenhum grupo cai em "Conteúdos", no
  fim — conteúdo novo nunca some da tela por esquecimento.

## Controles e estímulos

- **Tema** em três estados: sistema, claro, escuro. Gravado no aparelho e
  aplicado no `<head>`, antes da primeira pintura — senão a tela pisca na cor
  errada ao abrir. As declarações escuras existem uma vez em `_tokens.css` e o
  build as repete sob `@media` e sob `[data-tema="escuro"]`.
- **Tela cheia** pelo botão. No iPhone o botão nem aparece, em vez de aparecer
  e não fazer nada.
- **Foguinho** na pílula de sequência a partir de três acertos: a criança vê a
  sequência crescer sem precisar ler o número.
- **Fanfarra** é nota, não ruído: uma frase curta em dó maior com brilho por
  cima (o ruído das palmas antigas assustava). **Festa** são confetes em DOM. Ambos entram no fim da partida:
  festa a partir de 60% de acerto, festa e fanfarra a partir de 90%.
- **Tom da sequência**: cada acerto seguido sobe um degrau da escala de dó
  maior, até uma oitava; a partir de três, vira acorde com brilho.
- **Estalinhos** baixos acompanham os confetes, antes da fanfarra.
- **Estrelas** no fim da partida: chegar ao fim vale 1, 70% vale 2, 90% vale
  3; sem vidas, nenhuma. O cartão da missão mostra as do melhor resultado.
- **Frase do fim** sorteada de uma lista por faixa de acerto, sem repetir a
  anterior.
- **Mascote**: uma bolinha da cor da matéria no canto da partida. Sorri e
  pula no acerto, treme e faz "ops" no erro, pega fogo a partir de três
  seguidas, com um balão de fala curto. Quem chama são os sons, então toda
  forma de questão reage. `motor/diversao.js`.
- **Dias seguidos** e **figurinhas** (12, das fáceis às difíceis) saem do
  histórico de partidas, que já é do perfil e já vai para a conta: nada novo
  a guardar. A tela de fim mostra o que a partida trouxe; a página inicial
  mostra o foguinho dos dias e a aba **Álbum**. `motor/conquistas.js`, com
  teste em `teste/esteira/conquistas.test.ts`.
- **Multiplicador da sequência**: a partir de 3 acertos seguidos cada acerto
  vale o dobro, a partir de 6 o triplo; a pílula da sequência mostra ×2/×3.
  Sem isso os pontos eram só acertos × 100 e a sequência não valia nada.
- **Partida de 12 questões** no máximo, nos dois motores (a etapa de trilha
  tem 8). O "Tudo misturado" do inglês tinha 54.
- **Próximo passo** no fim: o botão principal sugere uma coisa só (tentar
  de novo, buscar as 3 estrelas, a próxima missão sem 90% ou a próxima
  trilha); escolher outra missão fica como secundário. `proximoPasso`, com
  teste em `teste/esteira/proximo.test.ts`.
- **Entrada do jogo** com um caminho principal: quem nunca jogou começa
  pela lição e não vê placar de zeros; quem já jogou ganha "Jogar: <próxima
  trilha>" e a lição vira secundária. "Ir aos desafios" é sempre secundário
  e "apagar progresso" fica no pé da tela. `pintarEntrada`, que reorganiza
  na hora as telas escritas à mão de cada jogo.
- **Placar só na partida**: pontos, vidas e sequência somem fora do quiz.
- **Desafio se destrava** com 2 estrelas (70%) em alguma missão; antes
  disso o botão fica tracejado ("abre com 2 estrelas"). Na primeira tela de
  fim com ele aberto, um aviso e o botão "Pronto para o Desafio?". Quem já
  tinha escolhido o Desafio continua com ele.
- **Mascote também na entrada e no fim**, com balão: na entrada cumprimenta
  e lembra os dias seguidos; no fim comemora ou consola conforme as estrelas.
- **Na sequência, o acerto avança sozinho** em 1,6 s (a partir de 3
  seguidos; tocar em "Próxima" adianta). Fora dela e no erro, espera: a
  explicação é para ser lida.
- **O mascote evolui com o álbum**: com 3, 6, 9 e 12 figurinhas ganha
  chapéu, medalha, coroa e brilho, em todos os jogos. A tela de fim avisa
  quando ele evolui; o álbum diz quanto falta para o próximo.
- **O bichinho reage na caixa da resposta**, onde o olhar está depois de
  responder (no celular o topo já saiu da tela); a fala dele é o título da
  caixa. No topo ele fica só com a chama da sequência e o "oi" do começo.
- **Bichinhos para escolher** no álbum: Bolinha, Gato e Coelho de saída;
  Dino, Coruja e Robô abrem com 4, 7 e 10 figurinhas (a tela de fim avisa).
  A cara e as reações são as mesmas em todos; muda o corpo e a cor. A
  escolha fica no perfil e vale em todos os jogos.
- **A última questão vale dobro** (partidas de 5 ou mais; na trilha, só a
  da última etapa), avisada com um selo amarelo e um "Capricha nessa!".
- **Datas em palavras** ("há 25 min", "ontem", "há 2 semanas") na página
  inicial e na de criar; no histórico, a data exata aparece ao passar o
  mouse.
- **Resposta marcada com ✓ e ✗**, além da cor; e um contador só
  ("Questão 3/9"), sem o percentual repetido.
- `prefers-reduced-motion` desliga confete e pulsação; o botão de mudo cala
  tudo.

## Sala em rede

Um aparelho vira telão e mostra a pergunta; os outros entram por um código de
quatro dígitos e veem só os botões A/B/C/D. Quem acerta mais rápido pontua
mais (1000 menos a demora, até metade).

A conexão é direta entre os aparelhos, por WebRTC via PeerJS — sem servidor
nosso, sem conta. **É o único modo que exige internet**, e a tela diz isso: o
resto do jogo roda do arquivo baixado.

**Não precisa ser a mesma rede, mas ajuda.** O caminho é: broker
(`0.peerjs.com`) para os aparelhos se acharem, STUN para descobrir o endereço
público e furar o NAT, e daí conexão direta. O STUN funciona — verificado com
o do Google e o da Cloudflare. O que não existe é o relé (TURN) para quando o
NAT é restritivo demais, caso típico de dados móveis: os servidores TURN que o
PeerJS traz por padrão **não resolvem em DNS**, e o relé público mais conhecido
(OpenRelay) passou a recusar credencial anônima — responde 400. Por isso o
jogador que não conecta em 12 s recebe um aviso dizendo para pôr todo mundo no
mesmo Wi-Fi. Resolver de verdade exigiria um TURN com conta.

### Os dois motores não têm os mesmos nomes

O de inglês chama o aviso flutuante de `showAchievement`; os do céu, de
`mostrarConquista`. Código compartilhado entre eles não pode citar nenhum dos
dois direto: referenciar identificador não declarado lança `ReferenceError` e
mata a função inteira — foi assim que a entrada na sala travou em
"Conectando...", tendo escrito a mensagem uma linha antes de morrer.

`build/verificar.py` derruba o build quando um motor usa um nome que só
existe no outro sem guardar com `typeof`.

## Texto

Menos palavras do que parece necessário. Três regras:

- **Nada de "Trilha da X"** — o rótulo já diz que é uma trilha; o nome diz o
  que ela ensina ("Verbos e o -ING", "Imprensa no Brasil").
- **Nenhum elemento explica o vizinho.** O seletor já diz "Treino / sem
  vidas"; não cabe uma frase embaixo repetindo que no Treino o erro não
  elimina. A missão já aparece no HUD e no cabeçalho do progresso; não cabe
  uma terceira linha descrevendo-a em cada questão.
- **A tela de abertura diz o assunto, não o manual.** Uma linha, tipo
  "Movimento da Terra, fases da Lua, calendários e estrelas."

O que fica é o que ensina: as partes expositivas da lição e a explicação que
aparece no retorno de cada resposta.

## Tipografia

- **Fredoka** (500/600/700) — títulos, enunciado, números e rótulos de jogo.
  Arredondada e cheia, dá o tom lúdico.
- **Nunito** (400/600/700/900) — corpo, descrições e alternativas.

Escala fixa, de 0.8125 a 2.375 rem. Números com `tabular-nums`.

## Componentes

- **Alternativas**: bloco alto (4.5rem), forma colorida à esquerda, borda de
  2px e lábio. Acerto fica verde e dá um pulo curto; erro fica vermelho.
- **Missões e trilhas**: cards com ícone em chip colorido, barra de progresso
  grossa e selo de estado.
- **Retorno**: bloco com borda inteira, fundo tingido e rótulo grande
  ("Certo" / "Ainda não"). Sem filete lateral.
- **Ilustrações**: toda questão e todo termo da lição têm um desenho, como
  antes tinham um emoji. São **125 ícones de linha** (24×24, traço 2), num
  chip com a cor da matéria. `build/mapa.py` liga cada uma das 223 antigas
  ilustrações a um desses ícones — conceitos próximos compartilham o mesmo
  desenho (☀️ 🌅 🌇 viram `sol`; 🎻 🎹 🥁 viram `instrumento`).
  Nenhum emoji em lugar nenhum, mas nenhuma ilustração foi perdida.
- **HUD**: pílulas translúcidas sobre a faixa colorida, com número e rótulo.
- **Aviso de conquista**: pílula verde (`--aviso`, a mesma nos dois temas)
  com texto branco a 5,5:1. Não usa a cor da matéria: o cabeçalho é dessa
  cor, e um aviso azul sobre faixa azul dá 1,09:1 — some. Aparece **abaixo
  do painel de progresso**, nunca sobre o cabeçalho, porque é a trilha que
  ele está anunciando. O JS mede o painel e escreve `--aviso-topo`.
- **Virada de etapa**: cartão maior, não pílula. Nomeia a etapa que fechou
  ("Etapa 1 de 9 concluída") e a que começa ("Agora: +ING"), fica 2,8 s, e
  o nó correspondente da trilha pisca ao ficar verde. A criança precisa ver
  *onde estava* e *para onde foi*, não só que algo aconteceu.

## Movimento

90–420 ms. `--mola` (com leve ultrapassagem) nas celebrações; `--saida`
(desaceleração) no resto. Os botões afundam ao toque trocando `translateY`
pelo lábio da sombra. `prefers-reduced-motion` desliga tudo, inclusive o
afundamento.

## Como reconstruir

```sh
sh build/rebuild.sh      # valida o conteúdo, monta os quatro jogos, confere
sh teste/rodar.sh        # e o comportamento
```

O motor é fonte em `motor/*.molde.html`, o conteúdo é dado em
`conteudo/*.json`, as partes próprias de cada jogo ficam em `jogo/<id>/`, e
`build/montar.py` preenche as fendas. Mexer no motor é editar o molde: não há
passo de build que o reescreva.

Até setembro de 2026 isto funcionava ao contrário — o build restaurava o HTML
de um commit antigo e aplicava vinte remendos que casavam trechos literais do
fonte. Os scripts estão em `build/aposentados/`, com o registro do que cada um
resolveu e de como a fragilidade cobrou o preço.

A varredura de emoji daquele tempo removia **só pictogramas**. Setas
(`→ ↔ ←`), sinais de conferido (`✓ ✗`) e formas geométricas são conteúdo: uma
versão anterior apagou 192 setas e transformou `CLEAN → CLEANING` em
`CLEAN CLEANING`.

No fim, `build/medir_alternativas.py` e `build/medir_plausibilidade.py`
derrubam o build se a alternativa certa voltar a se entregar pelo tamanho,
pelos absolutos ou pelo eco do enunciado — ver PRODUCT.md.
