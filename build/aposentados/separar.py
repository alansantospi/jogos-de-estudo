# -*- coding: utf-8 -*-
"""Separa o jogo montado em motor compartilhado e partes próprias. Roda uma vez.

O corte é conferido remontando e comparando byte a byte com o original: se
sobrar ou faltar um caractere, o separador está errado e não vale usar.
"""
import io, os, re, sys

RAIZ = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

# Onde cortar. Cada fenda é (nome, marca de início, marca de fim exclusiva).
FENDAS = [
    ("hero",   '<section id="start" class="screen active">', '<section id="lesson"'),
    ("licao",  '<section id="lesson"',                       '<section id="categories"'),
    ("cartoes",'<div class="trail-grid">',                   '<div style="margin-top:18px"><button class="secondary"'),
]


def separar(arq):
    s = io.open(os.path.join(RAIZ, arq), encoding="utf-8").read()
    pedacos, resto = {}, s
    for nome, ini, fim in FENDAS:
        i = resto.index(ini)
        j = resto.index(fim, i)
        pedacos[nome] = resto[i:j]
        resto = resto[:i] + "<!--%%%s%%-->" % nome.upper() + resto[j:]
    return pedacos, resto


def remontar(molde, pedacos):
    for nome, texto in pedacos.items():
        molde = molde.replace("<!--%%%s%%-->" % nome.upper(), texto)
    return molde


def main():
    falhas = 0
    for arq in ("exploradores-do-ceu.html", "historia.html", "artes.html"):
        pedacos, molde = separar(arq)
        volta = remontar(molde, pedacos)
        original = io.open(os.path.join(RAIZ, arq), encoding="utf-8").read()
        ok = volta == original
        falhas += 0 if ok else 1
        print("  %-24s %s   %s" % (
            arq.replace(".html", ""),
            "corte reversível" if ok else "CORTE PERDE BYTES",
            " ".join("%s=%dB" % (n, len(t)) for n, t in pedacos.items())))
    return 1 if falhas else 0


if __name__ == "__main__":
    sys.exit(main())
