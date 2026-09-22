# -*- coding: utf-8 -*-
"""Separa os três jogos do motor do céu em motor compartilhado e partes próprias.

Roda uma vez. Depois quem manda é `motor/ceu.molde.html` mais `jogo/*/`.

Medido antes de fazer: os três compartilham 99,2% do script e 98,1% do
estilo. O que difere é cor, título, matéria, chave de progresso, prefixo da
sala e patentes — tudo parâmetro — mais o herói, a lição e os cartões.
"""
import io, os, re, sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import recorte, separar

RAIZ = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

JOGOS = {
    "exploradores-do-ceu.html": dict(
        id="ciencias", slug="cien", cor="oklch(0.525 0.15 195)", titulo="Exploradores do Céu",
        chave="sky_progress_v1", materia="Ciências", sala="jogosdeestudo-cien-",
        patente="lives<=0&&!practiceMode?'Aprendiz do Céu':acc>=90?'Mestre do Céu'"
                ":acc>=70?'Explorador Celeste':'Aprendiz do Céu'"),
    "historia.html": dict(
        id="historia", slug="hist", cor="oklch(0.575 0.18 40)", titulo="Linhas do Tempo",
        chave="historia_progress_v1", materia="História", sala="jogosdeestudo-hist-",
        patente="lives<=0&&!practiceMode?'Aprendiz do Tempo':acc>=90?'Mestre das Linhas do Tempo'"
                ":acc>=70?'Cronista':'Aprendiz do Tempo'"),
    "artes.html": dict(
        id="artes", slug="arte", cor="oklch(0.56 0.22 330)", titulo="Ateliê",
        chave="artes_progress_v1", materia="Arte", sala="jogosdeestudo-arte-",
        patente="lives<=0&&!practiceMode?'Aprendiz de Ateliê':acc>=90?'Mestre de Ateliê'"
                ":acc>=70?'Artista':'Aprendiz de Ateliê'"),
}

# Comentários que divergem só na redação. Normalizados para o motor ser um só.
COMENTARIOS = [
    ("/* Identidade estavel de cada questao, usada pelo progresso e pela revisao. */",
     "/* ---------- identidade estavel de cada questao (para o progresso) ---------- */"),
    ("    // Duas fontes: o livro didatico (livro p.NN) e a folha de revisao da escola.\n", ""),
    ("/* ---------- estado ---------- */\n", ""),
]


def molde(arq, p):
    _, m = separar.separar(arq)
    for de, para in COMENTARIOS:
        m = m.replace(de, para)
    # A patente contém o título; se o título for trocado antes, ela não casa.
    m = m.replace('lista.push({q: Date.now(), j: "%s",' % p["slug"],
                  'lista.push({q: Date.now(), j: "%SLUG%",')
    for campo, marca in (("patente", "%PATENTE%"), ("cor", "%COR%"), ("titulo", "%TITULO%"),
                         ("chave", "%CHAVE%"), ("sala", "%SALA%")):
        m = m.replace(p[campo], marca)
    m = m.replace('<a href="#inicio">%s</a>' % p["materia"], '<a href="#inicio">%MATERIA%</a>')
    m = re.sub(r'<div class="subtitle">.*?</div>',
               '<div class="subtitle">%SUBTITULO%</div>', m, count=1, flags=re.S)
    m = re.sub(r'<svg aria-hidden="true" focusable="false" style="position:absolute.*?</svg>',
               "<!--%SPRITE%-->", m, flags=re.S, count=1)
    for nome in ("bank", "nomes", "trails"):
        i = m.index("const %s=" % nome)
        j = recorte.fim_da_declaracao(m, i, "{", "}")
        m = m[:i] + ("/*%%%s%%*/" % nome.upper()) + m[j:]
    return m


def main():
    moldes, proprios = {}, {}
    for arq, p in JOGOS.items():
        moldes[arq] = molde(arq, p)
        pedacos, _ = separar.separar(arq)
        proprios[arq] = pedacos

    ref = moldes["exploradores-do-ceu.html"]
    iguais = all(moldes[a] == ref for a in JOGOS)
    print("  motor idêntico nos três: %s" % ("sim" if iguais else "NÃO"))
    if not iguais:
        import difflib
        for a in JOGOS:
            if moldes[a] == ref:
                continue
            d = [l for l in difflib.unified_diff(ref.split("\n"), moldes[a].split("\n"),
                                                  lineterm="", n=0)
                 if not l.startswith(("---", "+++", "@@"))]
            print("    %s diverge em %d linhas:" % (a, len(d)))
            for l in d[:8]:
                print("      %s" % l.strip()[:110])
        return 1

    os.makedirs(os.path.join(RAIZ, "motor"), exist_ok=True)
    io.open(os.path.join(RAIZ, "motor", "ceu.molde.html"), "w", encoding="utf-8").write(ref)
    print("  motor/ceu.molde.html  %d KB" % (len(ref) // 1024))

    for arq, p in JOGOS.items():
        pasta = os.path.join(RAIZ, "jogo", p["id"])
        os.makedirs(pasta, exist_ok=True)
        for nome, texto in proprios[arq].items():
            io.open(os.path.join(pasta, nome + ".html"), "w", encoding="utf-8").write(texto)
        print("  jogo/%-10s %s" % (p["id"], " ".join(
            "%s=%dB" % (n, len(t)) for n, t in proprios[arq].items())))
    return 0


if __name__ == "__main__":
    sys.exit(main())
