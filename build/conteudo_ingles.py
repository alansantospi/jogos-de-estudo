# -*- coding: utf-8 -*-
"""Escreve o conteúdo do inglês no HTML a partir de `conteudo/ingles-4ano.json`.

O motor continua o mesmo: recebe os três reservatórios e o banco de verbos na
forma que sempre entendeu. O que mudou é de onde vêm.
"""
import io, json, os, sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import recorte

RAIZ = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
ARQ = "time-travel-english.html"

TIPOS = {"escolha": "choice", "vf": "tf", "digitar": "text", "ordenar": "order",
         "ligar": "match", "escutar": "listenchoice", "memoria": "memory",
         "cacapalavras": "wordsearch", "cruzada": "crossword"}


def _js(v):
    return json.dumps(v, ensure_ascii=False)


def _questao(q):
    """A questão na forma do motor, inclusive o que ficou guardado verbatim."""
    tipo = TIPOS[q["tipo"]]
    # `ticketchoice` é `escolha` no esquema; o motor o distingue pela fase.
    if tipo == "choice" and "TICKET" in (q.get("fase") or ""):
        tipo = "ticketchoice"

    p = ["type:" + _js(tipo), "stage:" + _js(q.get("fase", "")), "ic:" + _js(q["icone"])]
    if q.get("fonte"):
        f = q["fonte"]
        p.append("src:" + _js({"t": f["tipo"], "d": f["detalhe"]} if isinstance(f, dict) else f))
    p.append("q:" + _js(q["enunciado"]))
    if q.get("dica"):
        p.append("hint:" + _js(q["dica"]))
    if q.get("audio"):
        p.append("audio:" + _js(q["audio"]))

    if q["tipo"] in ("escolha", "escutar") and "certa" in q:
        # A ordem original não é recuperável nem importa: o motor embaralha na
        # hora. O que precisa sobreviver é o conjunto e qual delas é a certa.
        p.append("choices:" + _js([q["certa"]] + list(q["erradas"])))
        p.append("answer:0")
    elif q["tipo"] == "vf":
        p.append("answer:" + ("true" if q["certa"] else "false"))
    elif q["tipo"] == "digitar":
        p.append("valid:" + _js(q.get("aceitas", [])))
        p.append("placeholder:" + _js(q.get("exemplo", "")))
    elif q["tipo"] == "ordenar":
        p.append("words:" + _js(q.get("palavras", [])))
        p.append("answer:" + _js(" ".join(q.get("sequencia", []))))
    elif q["tipo"] == "ligar":
        p.append("pairs:" + _js(q.get("pares", [])))

    if q.get("explicacao"):
        p.append("ok:" + _js(q["explicacao"]))
    if q.get("explicacaoErro"):
        p.append("bad:" + _js(q["explicacaoErro"]))
    for k, v in (q.get("extra") or {}).items():
        p.append("%s:%s" % (k, _js(v)))
    return "{" + ",".join(p) + "}"


def _bloco(nome, questoes):
    return "const %s = [\n%s\n];" % (nome, ",\n".join(_questao(q) for q in questoes))


def _bloco_verbos(verbos):
    corpo = ",\n".join("{" + ",".join("%s:%s" % (k, _js(v)) for k, v in verbo.items()) + "}"
                       for verbo in verbos)
    return "const verbBank = [\n%s\n];" % corpo


def aplicar():
    jogo = json.load(io.open(os.path.join(RAIZ, "conteudo", "ingles-4ano.json"),
                             encoding="utf-8"))
    s = io.open(os.path.join(RAIZ, ARQ), encoding="utf-8").read()

    por_res = {}
    for q in jogo["questoes"]:
        por_res.setdefault(q["reservatorio"], []).append(q)

    for nome in ("baseQuestionPool", "unit5Pool", "extraPool"):
        s = recorte.trocar(s, "const %s = [" % nome, _bloco(nome, por_res.get(nome, [])))
    s = recorte.trocar(s, "const verbBank = [", _bloco_verbos(jogo["verbos"]))

    io.open(os.path.join(RAIZ, ARQ), "w", encoding="utf-8").write(s)
    print("  %-24s %d questões e %d verbos do JSON"
          % ("time-travel-english", len(jogo["questoes"]), len(jogo["verbos"])))


if __name__ == "__main__":
    aplicar()
