# -*- coding: utf-8 -*-
"""Nomes das trilhas e enxugamento dos textos de moldura.

Duas coisas. Trilha nenhuma se chama "Trilha X": o rótulo já diz que é uma
trilha, o nome tem de dizer o que ela ensina. E a tela de missões empilhava
três parágrafos de orientação sobre elementos que já se explicam sozinhos —
o seletor Treino/Desafio dizia "sem vidas" e logo abaixo um texto repetia
que no Treino o erro não elimina.
"""
import io, re

NOMES = {
    "time-travel-english.html": [
        ("Trilha Essencial",        "Do Começo ao Fim"),
        ("Trilha dos Verbos",       "Verbos e o -ING"),
        ("Trilha da Gramática",     "Montar as Frases"),
        # No resultado: é o estado, não um nome. "completa" ficava ambíguo.
        ('"Trilha completa"',        '"Trilha concluída"'),
    ],
    "exploradores-do-ceu.html": [
        ("Trilha Terra em Movimento", "Terra em Movimento"),
        ("Trilha da Lua e do Tempo",  "Lua e Calendários"),
        ("Trilha da Orientação",      "Orientação"),
        ("Trilha das Estrelas",       "Estrelas"),
    ],
    "historia.html": [
        ("Trilha da Imprensa",      "Imprensa no Brasil"),
        ("Trilha das Mensagens",    "Mensagens a Distância"),
        ("Trilha do Mundo Digital", "Do Analógico ao Digital"),
    ],
    "artes.html": [
        ("Trilha da Música",  "Melodia e Harmonia"),
        ("Trilha da Pintura", "Pintura e Afresco"),
    ],
}

# O título da seção também não precisa do "de aprendizagem".
CABECALHOS = [("Trilhas de aprendizagem", "Trilhas"),
              ("Escolha uma trilha", "Trilhas")]

# Uma linha por jogo, no lugar do parágrafo de abertura. A tela já tem título
# e dois botões; o que falta é dizer do que trata, não como o jogo funciona.
ABERTURA = {
    "time-travel-english.html": "Present continuous, contrações, horas e rotina.",
    "exploradores-do-ceu.html": "Movimento da Terra, fases da Lua, calendários e estrelas.",
    "historia.html":            "Dos livros copiados à mão até a internet.",
    "artes.html":               "Melodia, harmonia e arranjo — e a pintura mural.",
}


def corta(s, padrao, arq, obrigatorio=True):
    achados = re.findall(padrao, s, re.S)
    if obrigatorio:
        assert len(achados) == 1, "%s: %r casou %d vez(es)" % (arq, padrao[:40], len(achados))
    return re.sub(padrao, "", s, flags=re.S), len(achados)


for arq, pares in NOMES.items():
    s = io.open(arq, encoding="utf-8").read()
    cortado = 0

    for de, para in pares + CABECALHOS:
        n = s.count(de)
        if de in dict(CABECALHOS) and not n:
            continue
        assert n, "%s: nao achei %r" % (arq, de)
        s = s.replace(de, para)

    # O parágrafo de abertura vira uma linha sobre o assunto.
    m = re.search(r'(<h2>[^<]*</h2>\s*)<p>.*?</p>', s, re.S)
    assert m, "%s: nao achei o paragrafo de abertura" % arq
    s = s[:m.start()] + m.group(1) + "<p>" + ABERTURA[arq] + "</p>" + s[m.end():]

    # "No Treino o erro não elimina..." — o seletor ao lado já diz "sem vidas".
    s, n = corta(s, r'<div class="mode-hint">.*?</div>', arq); cortado += n
    # "Escolha o conteúdo que deseja revisar. Dentro de cada missão..."
    s, n = corta(s, r'<div class="mission-desc">.*?</div>', arq, False); cortado += n
    # "Você pode seguir uma sequência de aprendizagem ou escolher..."
    s, n = corta(s, r'<h2>Trilhas</h2>\s*<p>[^<]*sequência de aprendizagem[^<]*</p>',
                 arq, False)
    if n:
        s = s.replace("<div class=\"trail-choice\">", "<h2>Trilhas</h2>\n<div class=\"trail-choice\">", 1)
        cortado += n
    # A missão já aparece no HUD e no cabeçalho do progresso; a linha que a
    # descrevia de novo, em toda questão, era a terceira cópia da mesma coisa.
    s, n = corta(s, r'<div id="storyline"[^>]*></div>', arq, False); cortado += n

    # Cartão de trilha com duas legendas: fica a que diz o conteúdo.
    s, n = corta(s, r'\s*<div class="mission-progress">[^<]*</div>(?=\s*</button>)', arq, False)
    cortado += n

    io.open(arq, "w", encoding="utf-8").write(s)
    print("  %-24s %d nomes, %d textos cortados" % (arq.replace(".html",""), len(pares), cortado))
