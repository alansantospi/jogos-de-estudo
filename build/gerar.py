# -*- coding: utf-8 -*-
"""Monta `gerar.html`, a tela da esteira: pedir, revisar e baixar.

A URL e a chave pública do Supabase moram em `build/_conta.js`. A página
leva a mesma declaração, recortada de lá, em vez de uma cópia à mão que
deixaria de bater na primeira troca de projeto.
"""
import io, os, re, sys

RAIZ = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

conta = io.open(os.path.join(RAIZ, "build", "_conta.js"), encoding="utf-8").read()
m = re.search(r"^const CONTA = \{.*?^\};", conta, re.S | re.M)
if not m:
    raise SystemExit("build/_conta.js: não achei a declaração const CONTA = {...};")

html = io.open(os.path.join(RAIZ, "build", "_gerar.html"), encoding="utf-8").read()
if "/*%CONTA%*/" not in html:
    raise SystemExit("build/_gerar.html: falta a fenda /*%CONTA%*/")
html = html.replace("/*%CONTA%*/", m.group(0))

# Os desenhos são os mesmos dos jogos (`icons.py`): só os que a tela usa.
sys.path.insert(0, os.path.join(RAIZ, "build"))
from icons import _P
USADOS = ["mais", "camera", "escrever", "livro", "xis", "check", "alerta", "relogio", "seta-baixo"]
if "/*SPRITE*/" not in html:
    raise SystemExit("build/_gerar.html: falta a fenda /*SPRITE*/")
html = html.replace("/*SPRITE*/", "".join(
    '<symbol id="i-%s" viewBox="0 0 24 24">%s</symbol>' % (n, _P[n]) for n in USADOS))

io.open(os.path.join(RAIZ, "gerar.html"), "w", encoding="utf-8").write(html)
print("  %-24s ler, conferir, revisar e baixar (%d KB)" % ("gerar", len(html) // 1024))
