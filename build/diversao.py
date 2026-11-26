# -*- coding: utf-8 -*-
"""O que deixa o jogo mais divertido e é igual nos dois motores: o mascote,
os dias seguidos e as figurinhas. Mora em motor/ (conquistas.js,
diversao.js, diversao.css) e entra no lugar de <!--%DIVERSAO%--> nos
moldes. A página inicial usa só conquistas.js, para desenhar o álbum."""
import io, os, re

RAIZ = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
MARCA = "<!--%DIVERSAO%-->"


def _ler(nome):
    return io.open(os.path.join(RAIZ, "motor", nome), encoding="utf-8").read()


def conquistas_js():
    return _ler("conquistas.js")


def tempo_js():
    """haQuanto: datas em palavras ("há 3 dias") na página inicial e na de criar."""
    return _ler("tempo.js")


def icones():
    """Os desenhos que as figurinhas e os avisos usam: o sprite de cada
    página precisa deles, e o `href` montado em JS não aparece para a busca
    por `href="#i-…"` que escolhe o sprite."""
    return set(re.findall(r'ic: "([a-z-]+)"', conquistas_js())) | {"fogo", "estrela"}


def embutir(molde):
    if molde.count(MARCA) != 1:
        raise SystemExit("molde sem %s (ou com mais de um)" % MARCA)
    bloco = ("<style>" + _ler("diversao.css") + "</style>\n<script>"
             + conquistas_js() + "\n" + _ler("diversao.js") + "</script>")
    return molde.replace(MARCA, bloco)
