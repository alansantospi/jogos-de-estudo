# Conteúdo

As questões saíram de dentro do HTML. Um arquivo por jogo; o build escreve no
motor a partir daqui.

```sh
python3 build/esquema.py     # valida
sh build/rebuild.sh          # valida, injeta e confere que nada se perdeu
```

## Estado

| arquivo | questões | derivadas |
|---|---:|---:|
| `ciencias-4ano.json` | 187 | 20 |
| `historia-4ano.json` | 92 | 67 |
| `artes-4ano.json` | 34 | 30 |

**Inglês ainda não está aqui.** Naquele motor as questões vão para as missões
por expressão regular sobre o texto da fase, em três reservatórios, mais
geradores por regra a partir de um banco de verbos. Desembaraçar isso é a
Fase 2, quando os dois motores se fundem — ver `PLANO.md`.

## Um jogo

```json
{
  "id": "ciencias-4ano",
  "materia": "Ciências",
  "titulo": "Exploradores do Céu",
  "motor": "ceu",
  "missoes": [{"id": "earth", "nome": "Movimento da Terra"}],
  "trilhas": [{"id": "earth", "nome": "Terra em Movimento",
               "etapas": ["earth", "sun"]}],
  "questoes": []
}
```

## Uma questão

Campos comuns a todos os tipos:

| campo | |
|---|---|
| `tipo` | `escolha`, `vf`, `digitar`, `ordenar`, `ligar`, `bussola` |
| `missao` | id de uma missão declarada acima |
| `icone` | nome de um desenho de `build/desenhos.py` |
| `enunciado` | a pergunta |
| `origem` | `propria` ou `derivada` |
| `fonte` | de onde veio, quando há (`livro p.37`) |
| `explicacao` | o que aparece no retorno |

E o que cada tipo exige além disso:

```json
{"tipo":"escolha",  "certa":"...", "erradas":["...","...","..."]}
{"tipo":"vf",       "certa":true}
{"tipo":"digitar",  "aceitas":["lua","a lua"], "exemplo":"Digite..."}
{"tipo":"ordenar",  "sequencia":["primeiro","segundo","terceiro"]}
{"tipo":"ligar",    "pares":[["Melodia","Linha musical"]]}
{"tipo":"bussola",  "alvo":"N"}
```

## Por que `origem` não é detalhe

Decide o que pode ser publicado com o produto. Questão marcada `derivada` veio
do livro didático ou da folha da escola — serve para a Anne estudar, não para
acompanhar um produto à venda. Hoje são **117 de 313**. Ver `PLANO.md`, §2.1.

## O que o validador cobra

Missão que não existe, trilha apontando para missão inexistente, tipo
desconhecido, campo obrigatório ausente, menos de duas alternativas erradas,
alternativa vazia, e a resposta certa repetida entre as erradas.

Além dele, `build/medir_alternativas.py` e `build/medir_plausibilidade.py`
leem daqui e barram conteúdo em que o comprimento ou a plausibilidade
entreguem a resposta.
