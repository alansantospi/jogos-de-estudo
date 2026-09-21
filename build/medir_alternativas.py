# -*- coding: utf-8 -*-
"""Mede se o comprimento entrega a resposta certa.

Sem viés, com quatro opções, a certa é a mais longa em ~25% das questões e
a mais curta em ~25%. Longe disso, a criança pode acertar sem saber.
"""
import io, re, sys

CERTA = re.compile(r'(?<![a-z])c:"((?:[^"\\]|\\.)*)"')
ERRADAS = re.compile(r'(?<![a-z])d:\[(.*?)\]')
PERG = re.compile(r'(?<![a-z])q:"((?:[^"\\]|\\.)*)"')
STR = re.compile(r'"((?:[^"\\]|\\.)*)"')
# O acaso puro acerta 25% com quatro opções (um pouco mais quando há menos).
# Uma estratégia de comprimento que acerte acima de 35% é atalho: a criança
# pontua sem saber a matéria. Abaixo de 15% também é pista, invertida.
PISO, TETO = 15.0, 35.0


def questoes(arq):
    s = io.open(arq, encoding="utf-8").read()
    i = s.index("const bank="); j = s.index("\n};", i) + 3
    out = []
    for l in s[i:j].split("\n"):
        mq, mc, md = PERG.search(l), CERTA.search(l), ERRADAS.search(l)
        if mq and mc and md:
            out.append((mq.group(1), mc.group(1), STR.findall(md.group(1))))
    return out


def estrategia(it, escolher):
    """Quanto acerta quem sempre escolhe pelo comprimento, desempatando no acaso."""
    p = 0.0
    for _, c, d in it:
        tam = [len(c)] + [len(x) for x in d]
        alvo = escolher(tam)
        p += 1.0 / tam.count(alvo) if len(c) == alvo else 0.0
    return 100 * p / len(it)


def medir(arq):
    it = questoes(arq)
    if not it:
        return None
    mc = sum(len(c) for _, c, d in it) / len(it)
    me = sum(len(x) for _, _, d in it for x in d) / sum(len(d) for _, _, d in it)
    return it, estrategia(it, max), estrategia(it, min), mc, me


ruim = 0
for arq in ("artes.html", "historia.html", "exploradores-do-ceu.html"):
    it, pmaior, pmenor, mc, me = medir(arq)
    mal = not (PISO <= pmaior <= TETO) or not (PISO <= pmenor <= TETO)
    print("  %-22s n=%-4d  sempre-a-maior=%4.1f%%  sempre-a-menor=%4.1f%%"
          "  mediaC=%4.1f mediaE=%4.1f  %s"
          % (arq.replace(".html", ""), len(it), pmaior, pmenor, mc, me,
             "VIÉS" if mal else "ok"))
    if mal:
        ruim += 1
        if "-v" in sys.argv:
            piores = sorted(((len(c) - max(len(x) for x in d), q, c, d) for q, c, d in it),
                            reverse=True)[:12]
            for g, q, c, d in piores:
                if g <= 0:
                    break
                print("     +%-3d %s" % (g, q[:72]))
                print("          C %3d %s" % (len(c), c))
                for x in d:
                    print("          e %3d %s" % (len(x), x))
print("  (acaso puro: 25%%. Faixa aceita: %g%% a %g%%)" % (PISO, TETO))
sys.exit(1 if ruim else 0)
