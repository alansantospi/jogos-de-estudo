# -*- coding: utf-8 -*-
"""Monta `jogar.html`, que abre no navegador os jogos criados pela tela de
gerar (`jogar.html?id=…`).

Leva o motor inteiro, o mesmo de `montar.py`, com o sprite já preenchido e
as fendas do conteúdo vazias; `_montar_jogo.js` as preenche com o JSON que
vem da conta. O sprite leva todos os desenhos que uma questão gerada pode
pedir (`esteira.py` dá a mesma lista ao modelo).
"""
import io, json, os, re, sys

RAIZ = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, os.path.join(RAIZ, "build"))
import icons

ler = lambda *p: io.open(os.path.join(RAIZ, *p), encoding="utf-8").read()

molde = ler("motor", "ceu.molde.html")
usados = {"som", "mudo", "check", "casa", "lupa", "fogo", "tema", "sol", "lua", "expandir",
          "encolher", "palmas", "festa", "remendo", "dado", "livro"}
usados |= set(re.findall(r'href="#i-([a-z-]+)"', molde))
usados |= set(icons._P)
molde = molde.replace("<!--%SPRITE%-->", icons.sprite(sorted(usados)))

conta = ler("build", "_conta.js")
m = re.search(r"^const CONTA = \{.*?^\};", conta, re.S | re.M)
if not m:
    raise SystemExit("build/_conta.js: não achei a declaração const CONTA = {...};")

html = ler("build", "_jogar.html")
for fenda in ("/*%CONTA%*/", "/*%MOLDE%*/", "/*%MONTAR%*/"):
    if fenda not in html:
        raise SystemExit("build/_jogar.html: falta a fenda " + fenda)
html = html.replace("/*%CONTA%*/", m.group(0))
# Dentro de <script>, "</" fecharia a tag: o molde tem as suas.
html = html.replace("/*%MOLDE%*/", json.dumps(molde, ensure_ascii=False).replace("</", "<\\/"))
montar = ler("build", "_montar_jogo.js")
if re.search(r"</script", montar, re.I):
    raise SystemExit("build/_montar_jogo.js: o texto </script fecharia a tag que o recebe")
html = html.replace("/*%MONTAR%*/", montar)

io.open(os.path.join(RAIZ, "jogar.html"), "w", encoding="utf-8").write(html)
print("  %-24s abre os jogos criados na conta (%d KB)" % ("jogar", len(html) // 1024))
