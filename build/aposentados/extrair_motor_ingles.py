# -*- coding: utf-8 -*-
"""Separa o jogo de inglês em molde e conteúdo. Roda uma vez.

Este motor serve um jogo só, então não há o que parametrizar: o molde é o
arquivo montado com fendas no lugar dos reservatórios e do banco de verbos.
"""
import io, os, re, sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import recorte

RAIZ = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
ARQ = "time-travel-english.html"
BLOCOS = ("baseQuestionPool", "unit5Pool", "extraPool", "verbBank")


def main():
    s = io.open(os.path.join(RAIZ, ARQ), encoding="utf-8").read()
    for nome in BLOCOS:
        marca = "const %s = [" % nome
        i = s.index(marca)
        j = recorte.fim_da_declaracao(s, i)
        s = s[:i] + ("/*%%%s%%*/" % nome.upper()) + s[j:]
    s = re.sub(r'<svg aria-hidden="true" focusable="false" style="position:absolute.*?</svg>',
               "<!--%SPRITE%-->", s, flags=re.S, count=1)
    os.makedirs(os.path.join(RAIZ, "motor"), exist_ok=True)
    destino = os.path.join(RAIZ, "motor", "ingles.molde.html")
    io.open(destino, "w", encoding="utf-8").write(s)
    fendas = re.findall(r"%[A-Z0-9]+%", s)
    print("  motor/ingles.molde.html  %d KB, fendas: %s" % (len(s) // 1024, sorted(set(fendas))))


if __name__ == "__main__":
    main()
