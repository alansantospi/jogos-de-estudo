# Conteúdo

As questões saíram de dentro do HTML. Um arquivo por jogo; o build escreve no
motor a partir daqui.

```sh
python3 build/esquema.py     # valida
sh build/rebuild.sh          # valida, monta e confere que nada se perdeu
```

## Estado

| arquivo | questões | derivadas |
|---|---:|---:|
| `ciencias-4ano.json` | 187 | 20 |
| `historia-4ano.json` | 92 | 67 |
| `artes-4ano.json` | 34 | 30 |
| `ingles-4ano.json` | 186 | 45 |
| `matematica-4ano.json` | 91 | 75 |
| **total** | **590** | **237** |

O inglês guarda também `verbos` (49), de onde os geradores por regra fabricam
questão na hora. Essas geradas não estão aqui — são código, e só viram dado
quando os motores se fundirem.

## Um jogo

```json
{
  "id": "matematica-4ano",
  "materia": "Matemática",
  "titulo": "Régua e Compasso",
  "motor": "ceu",
  "missoes": [{"id": "angulos", "nome": "Ângulos"}],
  "trilhas": [{"id": "planas", "nome": "Figuras Planas",
               "etapas": ["retas", "angulos", "all"]}],
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
| `fonte` | `{"tipo": "livro"\|"folha", "detalhe": "p.37"}`, quando há |
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

**O inglês tem duas peculiaridades que sobrevivem por enquanto.** Uma questão
pode servir a mais de uma missão, então lá o campo é `missoes` (lista) em vez
de `missao`. E ela carrega `reservatorio` e `fase`, que são como aquele motor
ainda se organiza — some quando os motores se fundirem.

Campo que o esquema não souber traduzir fica em `extra`, verbatim. É o que
salva os tipos de memória e cruzada, cujo miolo ainda é próprio daquele motor.

## Por que `origem` não é detalhe

Decide o que pode ser publicado com o produto. Questão marcada `derivada` veio
do livro didático ou da folha da escola — serve para a Anne estudar, não para
acompanhar um produto à venda. Hoje são **237 de 590**. Ver `PLANO.md`, §2.1.

## O que o validador cobra

Missão que não existe, trilha apontando para missão inexistente, tipo
desconhecido, campo obrigatório ausente, menos de duas alternativas erradas,
alternativa vazia, e a resposta certa repetida entre as erradas.

Além dele, `build/medir_alternativas.py` e `build/medir_plausibilidade.py`
leem daqui e barram conteúdo em que o comprimento, os absolutos ou o eco do
enunciado entreguem a resposta.

## Acrescentar uma matéria

Foi o que a Matemática fez, e não exigiu passo de build novo:

1. escrever `conteudo/<materia>-<ano>.json`;
2. registrar o jogo na tabela `JOGOS` de `build/montar.py` — cor, título,
   chave de progresso, prefixo da sala, patentes;
3. criar `jogo/<id>/` com `hero.html`, `licao.html` e `cartoes.html` (os
   cartões dá para gerar do próprio conteúdo);
4. acrescentar a matéria em `build/_inicio.js`, `build/_inicio.html` e
   `build/missoes.json`, para a página inicial conhecê-la.

**Cuidado com a cor.** Ela precisa ficar longe do verde de "certo" e do
vermelho de "errado", ou a faixa da matéria vira um sinal falso. Na Matemática
o primeiro verde escolhido ficou a 0,052 do verde de acerto — o par mais
próximo de toda a paleta.
