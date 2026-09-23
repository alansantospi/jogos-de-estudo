# -*- coding: utf-8 -*-
"""Mede se o comprimento entrega a resposta certa.

Sem viés, com quatro opções, a certa é a mais longa em ~25% das questões e
a mais curta em ~25%. Longe disso, a criança pode acertar sem saber.
"""
import io, json, os, re, sys

# A lista de jogos sai da tabela do montador, não de uma cópia aqui. Antes era
# uma lista fixa, repetida em dois medidores: a Gramática entrou e passou sem
# ser medida, porque ninguém lembrou de acrescentá-la nos dois lugares.
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import montar
ARQUIVOS = {a: p["conteudo"] for a, p in montar.JOGOS.items()}
ARQUIVOS["time-travel-english.html"] = "ingles-4ano"   # motor próprio, fora da tabela

CERTA = re.compile(r'(?<![a-z])c:"((?:[^"\\]|\\.)*)"')
ERRADAS = re.compile(r'(?<![a-z])d:\[(.*?)\]')
PERG = re.compile(r'(?<![a-z])q:"((?:[^"\\]|\\.)*)"')
STR = re.compile(r'"((?:[^"\\]|\\.)*)"')
# O acaso puro acerta 25% com quatro opções (um pouco mais quando há menos).
# Uma estratégia de comprimento que acerte acima de 35% é atalho: a criança
# pontua sem saber a matéria. Abaixo de 15% também é pista, invertida.
PISO, TETO = 15.0, 35.0


def questoes(arq):
    """As questões de escolha, lidas do conteúdo — não mais do HTML.

    Enquanto estava tudo dentro do HTML, medir exigia regex sobre código. Com
    o conteúdo em `conteudo/*.json`, é leitura direta: menos jeito de errar e
    o mesmo medidor serve para questão gerada, que nunca vai passar por HTML.
    """
    caminho = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))),
                           "conteudo", ARQUIVOS[arq] + ".json")
    if not os.path.exists(caminho):
        return []
    jogo = json.load(io.open(caminho, encoding="utf-8"))
    return [(q["enunciado"], q["certa"], q["erradas"])
            for q in jogo["questoes"] if q["tipo"] in ("escolha", "escutar")]


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
for arq in sorted(ARQUIVOS):
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
