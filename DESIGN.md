# Sistema visual — Jogos de Estudo

Direção: **jogo de quiz**, no espírito de Kahoot, Quizizz e Duolingo — lúdico
sem depender de emoji. O que dá o tom é cor forte, forma, peso tipográfico e
retorno físico ao toque.

## As quatro ideias emprestadas

| Referência | O que veio dela |
|---|---|
| **Kahoot** | cada alternativa tem uma **forma** própria (círculo, triângulo, quadrado, losango) em cor própria. A forma identifica a resposta — é o papel que o emoji fazia, mas legível e acessível. |
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

## Movimento

90–420 ms. `--mola` (com leve ultrapassagem) nas celebrações; `--saida`
(desaceleração) no resto. Os botões afundam ao toque trocando `translateY`
pelo lábio da sombra. `prefers-reduced-motion` desliga tudo, inclusive o
afundamento.

## Como reconstruir

```sh
sh build/rebuild.sh
```

Regenera os quatro jogos a partir das cópias pré-design, aplicando
`build/aplicar.py` (folha de estilo, ícones, remoção de emoji),
`build/letras.py` (formas das alternativas) e `build/_tokens.css`.
