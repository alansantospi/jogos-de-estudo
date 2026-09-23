# Partes próprias de cada jogo

O que não cabe no motor nem no conteúdo: o texto de abertura e a lição.

```
jogo/ciencias/   hero.html  licao.html  cartoes.html
jogo/historia/   ...
jogo/artes/      ...
jogo/matematica/ ...
jogo/gramatica/  ...   <- licao.html é gerada, não escrita
```

| | |
|---|---|
| `hero.html` | a tela inicial: título, frase de abertura, botões |
| `licao.html` | o que a criança estuda antes de jogar |
| `cartoes.html` | os cartões de trilha e de missão |

## A lição da Gramática é de outro tipo

As quatro primeiras lições são texto corrido: a criança lê cinco telas e vai
jogar. A da Gramática é **em catorze passos curtos, um por missão**, e cada
passo tem uma ideia só, um infográfico com que dá para mexer, uma checagem
imediata e um botão que leva direto às questões daquela missão. O endereço
guarda o passo (`#licao/lesson7`), então dá para parar e voltar.

Ela é **gerada** por `build/licao_gramatica.py`, que roda no rebuild antes da
montagem. Editar `jogo/gramatica/licao.html` à mão não adianta.

Três mecânicas dão conta dos catorze passos, todas por delegação de clique:

| | |
|---|---|
| `escolher` | tocar a opção certa — serve também para tocar a palavra na frase |
| `revelar` | tocar o cartão para abrir a resposta |
| `maquina` | um ou dois eixos de escolha que compõem um resultado e acendem o desenho |

**Duas armadilhas do motor, já pisadas.** O motor faz de todo `<svg>` um
desenho de ícone (`fill:none; stroke:currentColor`), então `<text>` dentro de
um infográfico sai contornado e oco até levar `stroke:none`. E todo `button` é
`inline-flex` de 3 rem com um lábio de sombra, então cartão e palavra-na-frase
precisam desfazer isso.

`teste/casos/licao.js` cobre as três mecânicas, e três mutações em
`teste/mutacao.py` provam que o teste morde.

**`cartoes.html` ainda é markup escrito à mão nos quatro jogos antigos.** Nos
dois novos ele sai do conteúdo; nos antigos, não. As trilhas e as missões já
estão em `conteudo/*.json`, então gerar os cartões daí tiraria a última
duplicação entre dado e apresentação.

O inglês não aparece aqui: tem um motor só para ele, então tudo o que é seu
está no próprio molde.
