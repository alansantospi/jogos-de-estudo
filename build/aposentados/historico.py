# -*- coding: utf-8 -*-
"""Registro de partidas, por perfil.

Cada jogo anota uma linha ao terminar; quem lê e resume é a página inicial,
que enxerga os quatro. As chaves são curtas porque isto cresce a cada
partida e mora no localStorage.
"""
import io, re

JOGOS = {
    "historia.html": ("hist", "História"),
    "artes.html": ("arte", "Arte"),
    "exploradores-do-ceu.html": ("cien", "Ciências"),
    "time-travel-english.html": ("ing", "Inglês"),
}

JS = '''
/* ---------- histórico de partidas ---------- */
/* Uma linha por partida terminada. Campos curtos: isto cresce sem parar e
   divide os 5 MB do localStorage com o progresso. */
const HIST_CHAVE = "jogos_historico_v1";
const HIST_MAX = 400;

function registrarPartida(acertos, total, pontos){
  if(!total) return;                       // saiu antes de responder: não conta
  try{
    const p = perfilAtual();
    const k = HIST_CHAVE + (p ? ":" + p.id : "");
    const lista = JSON.parse(localStorage.getItem(k) || "[]");
    lista.push({q: Date.now(), j: "%(slug)s", m: currentCategory || "all",
                t: activeTrail || null, a: acertos, n: total, p: pontos || 0});
    while(lista.length > HIST_MAX) lista.shift();
    localStorage.setItem(k, JSON.stringify(lista));
  }catch(e){}
}
'''


def aplicar(arq, slug):
    s = io.open(arq, encoding="utf-8").read()
    ceu = arq != "time-travel-english.html"

    assert s.count("function endGame(){") == 1, arq
    s = s.replace("function endGame(){",
                  "function endGame(){\n  registrarPartida(hits, %s, score);"
                  % ("answered" if ceu else "answeredCount"), 1)

    ancora = "</script>\n</body>" if "</script>\n</body>" in s else "</script></body>"
    s = s.replace(ancora, (JS % {"slug": slug}) + ancora)

    io.open(arq, "w", encoding="utf-8").write(s)
    print("  %-24s registro de partidas" % arq.replace(".html", ""))


for arq, (slug, _) in JOGOS.items():
    aplicar(arq, slug)
