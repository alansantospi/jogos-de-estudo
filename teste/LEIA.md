# Testes

```sh
sh teste/rodar.sh              # tudo
sh teste/rodar.sh conteudo     # só um caso
```

Sai com código 1 se algo falhar, então serve de portão antes de publicar.

## O que roda

**Medidores** (`build/medir_*.py`, `build/verificar.py`) — sobre os dados, sem
navegador. Viés de comprimento e de plausibilidade nas alternativas, e função
chamada num motor que não a tem.

**Casos** (`teste/casos/*.js`) — num Chrome de verdade, sem cabeça:

| caso | onde | o que cobra |
|---|---|---|
| `conteudo` | 4 jogos | percorre todas as trilhas: sem `undefined`, sem alternativa vazia, letra na ordem, ícone presente |
| `navegacao` | 4 jogos | rotas, o endereço persistindo, busca sem acento, migalhas |
| `fim` | 4 jogos | caixa de revisão, ícones nela, patente da matéria certa |
| `perfis` | índice | isolamento entre alunos, histórico a partir do progresso, lixeira, restauração |

**Mutação** (`teste/mutacao.py`) — reinjeta quatro defeitos que este projeto
teve de verdade e cobra que a suíte falhe. Suíte que passa não prova nada.

## Por que Chrome de verdade e não um DOM simulado

Os defeitos que mais custaram aqui só aparecem no navegador:

- `svg.hidden = false` não remove o atributo, porque `SVGElement` não é
  `HTMLElement` — o foguinho ficava invisível;
- `<use>` não herda `fill` do `<svg>` de origem — os ícones saíam preenchidos;
- um `<svg>` sem tamanho dentro de uma linha de texto estica até 425 px.

Um stub teria passado em todos os três. Tentei o caminho do stub antes e ele
gerou uma série de falsos negativos.

## Limites conhecidos

- **O botão voltar do navegador não é acionado.** `history.back()` é navegação
  e, sob `--virtual-time-budget`, o Chrome nunca a conclui — trava em 90 s. O
  que se cobra é a invariante que o defeito real violava: o endereço persiste
  e o histórico cresce.
- **A sala em rede não é testada aqui.** Precisa de dois aparelhos e do
  intermediário público; o tempo virtual atropela a conexão real. Está
  verificada à mão, com dois navegadores.
- **Layout não é medido.** Contraste tem medidor próprio; transbordo a 320 px
  foi conferido à mão.
