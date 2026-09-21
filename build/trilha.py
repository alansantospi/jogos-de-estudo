# -*- coding: utf-8 -*-
"""Leva o nó atual da trilha para a vista.

Com nove etapas a faixa rola na horizontal e o nó atual costuma ficar fora
da tela; sem isto a criança não enxerga em que ponto do caminho está.
"""
import io

ROLAR = (
    "\n  const atual=map.querySelector('.current');"
    "\n  if(atual) atual.scrollIntoView({block:'nearest',inline:'center'});"
)

ALVOS = [
    ("historia.html", "}).join('');\n}"),
    ("artes.html", "}).join('');\n}"),
    ("exploradores-do-ceu.html", "}).join('');\n}"),
    ("time-travel-english.html", '  }).join("");\n}'),
]

for arq, ancora in ALVOS:
    s = io.open(arq, encoding="utf-8").read()
    assert s.count(ancora) == 1, "%s: ancora aparece %d vez(es)" % (arq, s.count(ancora))
    io.open(arq, "w", encoding="utf-8").write(
        s.replace(ancora, ancora[:-2] + ROLAR + "\n}"))
print("  ok  trilha rola ate o no atual")
