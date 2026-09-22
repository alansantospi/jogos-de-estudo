# Motor

O motor é fonte; o jogo é montado dele.

```sh
sh build/rebuild.sh      # valida o conteúdo, monta os quatro, confere
sh teste/rodar.sh        # e o comportamento
```

## Os arquivos

| | |
|---|---|
| `ceu.molde.html` | 96 KB. Serve Ciências, História e Arte. |
| `ingles.molde.html` | 161 KB. Serve só o Time Travel English. |

## As fendas

O montador preenche por substituição de texto — sem analisar sintaxe, que é
onde o build antigo se enganava.

**`ceu.molde.html`**

| fenda | de onde vem |
|---|---|
| `%COR%` `%TITULO%` `%MATERIA%` `%SUBTITULO%` | `build/montar.py`, tabela `JOGOS` |
| `%CHAVE%` `%SALA%` `%SLUG%` `%PATENTE%` | idem |
| `/*%BANK%*/` `/*%NOMES%*/` `/*%TRAILS%*/` | `conteudo/*.json` |
| `<!--%SPRITE%-->` | desenhos usados, de `build/desenhos.py` |
| `<!--%HERO%-->` `<!--%LICAO%-->` `<!--%CARTOES%-->` | `jogo/<id>/` |

**`ingles.molde.html`** só tem as de conteúdo e o sprite: serve um jogo só,
então não há o que parametrizar.

## Por que dois moldes e não um

Medido antes de separar: os três jogos do céu compartilham **99,2% do script e
98,1% do estilo**. Depois de parametrizar cor, título, matéria, chave de
progresso, prefixo da sala e patentes, o molde ficou **idêntico** nos três —
`build/aposentados/extrair_motor.py` cobrava isso e só gravava se batesse.

O de inglês é outro motor de verdade: gera questão por regra a partir de um
banco de verbos, em vez de sortear de um banco fixo. Fundir os dois é trabalho
que não estava na Fase 3.

## Mexer no motor

Editar o molde direto. Não há passo de build que o reescreva — essa era
exatamente a fragilidade que a Fase 3 tirou.

Depois, `sh teste/rodar.sh`. A suíte percorre as 414 questões dos quatro
jogos, a navegação, a tela de fim e os perfis, e ainda confere que ela própria
morde, reinjetando seis defeitos reais.
