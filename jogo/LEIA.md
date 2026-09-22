# Partes próprias de cada jogo

O que não cabe no motor nem no conteúdo: o texto de abertura e a lição.

```
jogo/ciencias/   hero.html  licao.html  cartoes.html
jogo/historia/   ...
jogo/artes/      ...
```

| | |
|---|---|
| `hero.html` | a tela inicial: título, frase de abertura, botões |
| `licao.html` | a parte expositiva, que a criança lê antes de jogar |
| `cartoes.html` | os cartões de trilha e de missão |

**`cartoes.html` ainda é markup escrito à mão, e não devia ser.** As trilhas e
as missões já estão declaradas em `conteudo/*.json`; gerar os cartões daí
tiraria a última duplicação entre dado e apresentação. Ficou para depois
porque a Fase 3 já trocou o build inteiro, e misturar as duas coisas tiraria a
garantia de que o comportamento não mudou.

O inglês não aparece aqui: tem um motor só para ele, então tudo o que é seu
está no próprio molde.
