# -*- coding: utf-8 -*-
"""Um formatador de rótulo de fonte para os quatro jogos.

Cada motor tinha o seu, porque cada jogo escrevia a procedência de um jeito.
`build/normalizar_fonte.py` pôs o dado num formato só — `{t,d}` —, e aí o
código pode ser um só também. Era a última divergência de lógica entre os
motores.
"""
import io, os, re

RAIZ = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

COMUM = '''    fonte.innerHTML = rotuloFonte(q.src);
    fonte.style.display = q.src ? 'inline-block' : 'none';'''

FUNCAO = '''
/* ---------- rótulo de procedência ---------- */
/* A fonte vem normalizada do conteúdo: {t:"livro"|"folha", d:"p.49"}. Antes
   cada jogo escrevia à sua maneira e cada motor tinha o seu formatador. */
function rotuloFonte(src){
  if(!src) return "";
  if(typeof src === "string") return src;          // conteúdo antigo, se houver
  if(src.t === "livro") return "Livro, " + src.d;
  if(src.t === "folha") return "Folha da escola" + (src.d ? ", " + src.d : "");
  return src.d || "";
}
'''

# O trecho antigo, por motor. Só o do céu difere entre os três jogos, e é
# justamente por isso que ele some.
ALVO = re.compile(
    r"    fonte\.textContent = !q\.src \? ''\n"
    r"(?:      :[^\n]*\n)+"
    r"    fonte\.style\.display=q\.src\?'inline-block':'none';")

JOGOS = ("exploradores-do-ceu.html", "historia.html", "artes.html")


def aplicar():
    for arq in JOGOS:
        s = io.open(os.path.join(RAIZ, arq), encoding="utf-8").read()
        n = len(ALVO.findall(s))
        assert n == 1, "%s: o formatador de fonte casou %d vez(es)" % (arq, n)
        s = ALVO.sub(COMUM, s)
        marca = "function renderQuestion(){"
        assert s.count(marca) == 1, arq
        s = s.replace(marca, FUNCAO + "\n" + marca, 1)
        io.open(os.path.join(RAIZ, arq), "w", encoding="utf-8").write(s)
        print("  %-24s rótulo de fonte unificado" % arq.replace(".html", ""))


if __name__ == "__main__":
    aplicar()
