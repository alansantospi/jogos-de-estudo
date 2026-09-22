# -*- coding: utf-8 -*-
"""Monta cada jogo a partir do motor, do conteúdo e das partes próprias.

Substitui a cirurgia de texto: antes o build restaurava o HTML de um commit
antigo e aplicava vinte remendos que casavam trechos literais do fonte. Aqui
o motor é fonte, o conteúdo é dado, e montar é preencher fendas.
"""
import io, json, os, re, sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import conteudo as C
import icons

RAIZ = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

JOGOS = {
    "exploradores-do-ceu.html": dict(
        id="ciencias", conteudo="ciencias-4ano", slug="cien",
        cor="oklch(0.525 0.15 195)", titulo="Exploradores do Céu",
        chave="sky_progress_v1", materia="Ciências",
        subtitulo="Terra, Sol, orientação espacial e estrelas",
        sala="jogosdeestudo-cien-",
        patente="lives<=0&&!practiceMode?'Aprendiz do Céu':acc>=90?'Mestre do Céu'"
                ":acc>=70?'Explorador Celeste':'Aprendiz do Céu'"),
    "historia.html": dict(
        id="historia", conteudo="historia-4ano", slug="hist",
        cor="oklch(0.575 0.18 40)", titulo="Linhas do Tempo",
        chave="historia_progress_v1", materia="História",
        subtitulo="História — comunicação, imprensa e tecnologia",
        sala="jogosdeestudo-hist-",
        patente="lives<=0&&!practiceMode?'Aprendiz do Tempo':acc>=90?'Mestre das Linhas do Tempo'"
                ":acc>=70?'Cronista':'Aprendiz do Tempo'"),
    "matematica.html": dict(
        id="matematica", conteudo="matematica-4ano", slug="mat",
        cor="oklch(0.52 0.22 298)", titulo="Régua e Compasso",
        chave="matematica_progress_v1", materia="Matemática",
        subtitulo="Matemática — geometria plana e espacial",
        sala="jogosdeestudo-mat-",
        patente="lives<=0&&!practiceMode?'Aprendiz de Geometria':acc>=90?'Mestre de Régua e Compasso'"
                ":acc>=70?'Geômetra':'Aprendiz de Geometria'"),
    "artes.html": dict(
        id="artes", conteudo="artes-4ano", slug="arte",
        cor="oklch(0.56 0.22 330)", titulo="Ateliê",
        chave="artes_progress_v1", materia="Arte",
        subtitulo="Arte — música e pintura mural",
        sala="jogosdeestudo-arte-",
        patente="lives<=0&&!practiceMode?'Aprendiz de Ateliê':acc>=90?'Mestre de Ateliê'"
                ":acc>=70?'Artista':'Aprendiz de Ateliê'"),
}


def _sprite(molde, jogo):
    """Só os desenhos que este jogo usa, mais os que o motor sempre precisa."""
    usados = {"som", "mudo", "check", "casa", "lupa", "fogo", "tema", "sol", "lua",
              "expandir", "encolher", "palmas", "festa"}
    usados |= {q["icone"] for q in jogo["questoes"]}
    usados |= set(re.findall(r'href="#i-([a-z-]+)"', molde))
    return icons.sprite(sorted(usados))


def montar(arq, p):
    molde = io.open(os.path.join(RAIZ, "motor", "ceu.molde.html"), encoding="utf-8").read()
    jogo = json.load(io.open(os.path.join(RAIZ, "conteudo", p["conteudo"] + ".json"),
                             encoding="utf-8"))
    pasta = os.path.join(RAIZ, "jogo", p["id"])

    s = molde
    for nome in ("hero", "licao", "cartoes"):
        texto = io.open(os.path.join(pasta, nome + ".html"), encoding="utf-8").read()
        s = s.replace("<!--%%%s%%-->" % nome.upper(), texto)

    s = s.replace("/*%BANK%*/", C._bloco_bank(jogo))
    s = s.replace("/*%NOMES%*/", C._bloco_nomes(jogo))
    s = s.replace("/*%TRAILS%*/", C._bloco_trilhas(jogo))
    s = s.replace("<!--%SPRITE%-->", _sprite(s, jogo))

    for campo, marca in (("patente", "%PATENTE%"), ("cor", "%COR%"), ("titulo", "%TITULO%"),
                         ("chave", "%CHAVE%"), ("materia", "%MATERIA%"),
                         ("subtitulo", "%SUBTITULO%"), ("sala", "%SALA%"), ("slug", "%SLUG%")):
        s = s.replace(marca, p[campo])

    sobrou = re.findall(r"%[A-Z]+%", s)
    assert not sobrou, "%s: fendas não preenchidas: %s" % (arq, set(sobrou))
    return s


def montar_ingles():
    """Este motor serve um jogo só: o molde é ele próprio, com fendas."""
    import conteudo_ingles as CI
    molde = io.open(os.path.join(RAIZ, "motor", "ingles.molde.html"), encoding="utf-8").read()
    jogo = json.load(io.open(os.path.join(RAIZ, "conteudo", "ingles-4ano.json"),
                             encoding="utf-8"))
    por_res = {}
    for q in jogo["questoes"]:
        por_res.setdefault(q["reservatorio"], []).append(q)

    s = molde
    for nome in ("baseQuestionPool", "unit5Pool", "extraPool"):
        s = s.replace("/*%%%s%%*/" % nome.upper(),
                      CI._bloco(nome, por_res.get(nome, [])))
    s = s.replace("/*%VERBBANK%*/", CI._bloco_verbos(jogo["verbos"]))

    usados = {"som", "mudo", "check", "casa", "lupa", "fogo", "tema", "sol", "lua",
              "expandir", "encolher", "palmas", "festa"}
    usados |= {q["icone"] for q in jogo["questoes"]}
    usados |= set(re.findall(r'href="#i-([a-z-]+)"', s))
    usados |= {v.get("ic") for v in jogo["verbos"] if v.get("ic")}
    s = s.replace("<!--%SPRITE%-->", icons.sprite(sorted(usados)))

    sobrou = re.findall(r"%[A-Z0-9]+%", s)
    assert not sobrou, "inglês: fendas não preenchidas: %s" % set(sobrou)
    return s


def main():
    for arq, p in JOGOS.items():
        s = montar(arq, p)
        io.open(os.path.join(RAIZ, arq), "w", encoding="utf-8").write(s)
        print("  %-24s montado, %d KB" % (arq.replace(".html", ""), len(s) // 1024))
    s = montar_ingles()
    io.open(os.path.join(RAIZ, "time-travel-english.html"), "w", encoding="utf-8").write(s)
    print("  %-24s montado, %d KB" % ("time-travel-english", len(s) // 1024))


if __name__ == "__main__":
    main()
