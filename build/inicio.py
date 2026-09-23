# -*- coding: utf-8 -*-
"""Monta a página inicial: perfis, histórico e conta.

O índice é o único lugar que enxerga as quatro matérias, então é ali que
moram o seletor de aluno e o histórico. Ele lê o localStorage dos quatro
jogos — mesma origem — em vez de manter uma cópia própria.
"""
import io, json, re, sys
sys.path.insert(0, "build")
import icons

USADOS = ["livro", "terra", "prensa", "nota", "regua", "letras"]

SPRITE = {
 "livro": '<path d="M4 5.5A2 2 0 0 1 6 4h6v15H6a2 2 0 0 0-2 1.5z"/><path d="M20 5.5A2 2 0 0 0 18 4h-6v15h6a2 2 0 0 1 2 1.5z"/>',
 "terra": '<circle cx="12" cy="12" r="8.5"/><path d="M4 9.5c3 1.5 5 .5 7 1.5s1.5 3.5 3 4 3-1 4.5-.5"/>',
 "prensa": '<path d="M5 4h14v6H5z"/><path d="M7 10v3h10v-3"/><path d="M4 16h16"/><path d="M8 20h8"/><path d="M12 16v4"/>',
 "nota": '<path d="M9 18V5l10-2v13"/><ellipse cx="6.5" cy="18" rx="2.5" ry="2"/><ellipse cx="16.5" cy="16" rx="2.5" ry="2"/>',
 "letras": '<path d="M3 18 7.5 6l4.5 12M4.5 14h6"/><path d="M15 18V9h3a2.5 2.5 0 0 1 0 5h-3"/>',
 "regua": '<rect x="2" y="7" width="20" height="10" rx="1.5" transform="rotate(-8 12 12)"/><path d="M6.5 9v3M10.5 8.5v4M14.5 8v3M18.5 7.5v4"/>',
}

html = io.open("build/_inicio.html", encoding="utf-8").read()
tokens = io.open("build/_inicio_tokens.css", encoding="utf-8").read()
extra = io.open("build/_inicio_extra.css", encoding="utf-8").read()
js = io.open("build/_inicio.js", encoding="utf-8").read()
conta = io.open("build/_conta.js", encoding="utf-8").read()
missoes = json.load(io.open("build/missoes.json", encoding="utf-8"))

sprite = "".join('<symbol id="i-%s" viewBox="0 0 24 24">%s</symbol>' % (n, SPRITE[n]) for n in USADOS)

html = html.replace("/*TOKENS*/", tokens + extra)
html = html.replace("/*SPRITE*/", sprite)
html = html.replace("/*MISSOES*/", "const MISSOES = " + json.dumps(missoes, ensure_ascii=False) + ";")
html = html.replace("/*JS*/", js + conta)

io.open("index.html", "w", encoding="utf-8").write(html)
print("  %-24s perfis, historico e conta (%d KB)" % ("index", len(html) // 1024))
