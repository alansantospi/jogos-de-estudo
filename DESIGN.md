# Sistema visual — Jogos de Estudo

Direção: **o caderno da aluna**. Papel, pauta, tinta. O conteúdo escrito à mão
é dela; a estrutura impressa é do caderno. O jogo deve parecer o lugar onde
esse conteúdo mora, não um aplicativo por cima dele.

Registro: **product**. Uma escala tipográfica fixa, cor restrita, nenhum
ornamento que não comunique estado.

## Cor

Estratégia **restrita**: papel + tinta + uma cor por matéria, usada só em
ação primária, seleção e estado — nunca como decoração.

O papel é branco com desvio de croma para o **azul**, não para o quente.
Caderno brasileiro é branco-azulado; creme e pergaminho ficaram de fora de
propósito.

| Token | Claro | Papel de grafite (escuro) |
|---|---|---|
| `--paper` | `oklch(0.988 0.003 255)` | `oklch(0.185 0.008 262)` |
| `--surface` | `oklch(1 0 0)` | `oklch(0.225 0.009 262)` |
| `--rule` | `oklch(0.885 0.010 255)` | `oklch(0.340 0.012 262)` |
| `--ink` | `oklch(0.26 0.021 262)` | `oklch(0.945 0.006 262)` |
| `--ink-soft` | `oklch(0.46 0.018 262)` | `oklch(0.760 0.012 262)` |

Uma caneta por matéria, das que existem no estojo:

| Matéria | Cor |
|---|---|
| Inglês | `oklch(0.47 0.15 258)` azul esferográfica |
| Ciências | `oklch(0.46 0.11 192)` verde-azulado |
| História | `oklch(0.45 0.15 28)` vermelho-vinho |
| Arte | `oklch(0.47 0.16 312)` violeta |

Semântica separada da cor da matéria: `--certo` verde, `--errado` vermelho.

O modo escuro não é inversão: é papel de grafite, pensado para o uso real
à noite com abajur.

## Tipografia

Par no eixo de contraste — serifa + sans humanista.

- **Source Serif 4** — só em h1/h2/h3 e no enunciado da questão. O enunciado
  é matéria de leitura, vinda de um livro; a serifa marca isso.
- **Atkinson Hyperlegible** — toda a interface: botões, rótulos, dados, corpo.
  Foi desenhada pelo Braille Institute para legibilidade. A escolha conversa
  com o conteúdo de História, que ensina Braille e Libras.

Escala **fixa** (sem `clamp`), razão ~1.2: 0.75 / 0.875 / 1 / 1.125 / 1.375 /
1.625 / 2 rem. Números com `tabular-nums`.

## Componentes

- **Alternativas**: linhas com marcador de letra (A, B, C, D), borda inteira,
  estados de acerto e erro pelo fundo e pela borda.
- **Missões e trilhas**: lista com régua entre itens — não grade de cards
  iguais. Ícone à esquerda, título e descrição empilhados, estado e progresso
  à direita.
- **Retorno**: bloco com borda inteira e fundo tingido, com rótulo textual
  ("Certo" / "Ainda não"). Sem filete lateral.
- **Ícones**: sprite SVG de linha, 24×24, traço 1.6, `currentColor`. Um por
  missão. Nenhum emoji em lugar nenhum.
- **HUD**: número grande com rótulo em texto embaixo (Pontos, Vidas,
  Sequência). Vidas mostra ∞ no modo Treino.

## Movimento

150–250 ms, curva `cubic-bezier(0.22,1,0.36,1)`. Só transmite estado: barra de
progresso, troca de fundo, número de pontos que sobe e some. Sem sequência de
entrada na carga da página. `prefers-reduced-motion` desliga tudo.

## Como reconstruir

```sh
sh build/rebuild.sh
```

Regenera os quatro jogos a partir das cópias pré-design, aplicando
`build/aplicar.py` (folha de estilo, ícones, remoção de emoji) e
`build/letras.py` (marcadores das alternativas).
