# -*- coding: utf-8 -*-
"""Escreve o banco de questões no HTML a partir de `conteudo/*.json`.

Do lado do dado, um esquema só; do lado do motor, a forma que ele já
entende. A conversão é aqui, e é conferida por ida e volta em
`build/conferir_conteudo.py` — se o que sai não for igual ao que entrou,
o build cai.
"""
import io, json, os, sys, re
import recorte

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

RAIZ = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

ARQUIVOS = {
    "ciencias-4ano": "exploradores-do-ceu.html",
    "historia-4ano": "historia.html",
    "artes-4ano":    "artes.html",
}

# Nome no esquema -> tipo interno do motor. `escolha` é o padrão e o motor
# a representa pela ausência do campo `t`.
TIPOS = {"vf": "tf", "digitar": "text", "ordenar": "order",
         "ligar": "match", "bussola": "compass"}

FIXAS = [("all", "Desafio misto"), ("review", "Revisão dos meus erros")]


def _js(v):
    """Literal JavaScript. json.dumps serve: JS lê JSON."""
    return json.dumps(v, ensure_ascii=False)


def _questao(q):
    """Devolve a questão na ordem de campos que o motor sempre teve."""
    p = ['ic:' + _js(q["icone"])]
    if q.get("fonte"):
        p.append('src:' + _js(q["fonte"]))
    tipo = TIPOS.get(q["tipo"])
    if tipo:
        p.append('t:' + _js(tipo))
    p.append('q:' + _js(q["enunciado"]))
    if q["tipo"] == "escolha":
        p.append('c:' + _js(q["certa"]))
        p.append('d:' + _js(q["erradas"]))
    elif q["tipo"] == "vf":
        p.append('c:' + ("true" if q["certa"] else "false"))
    elif q["tipo"] == "digitar":
        p.append('valid:' + _js(q["aceitas"]))
        p.append('ph:' + _js(q.get("exemplo", "")))
    elif q["tipo"] == "ordenar":
        p.append('seq:' + _js(q["sequencia"]))
    elif q["tipo"] == "ligar":
        p.append('pairs:' + _js(q["pares"]))
    elif q["tipo"] == "bussola":
        p.append('target:' + _js(q["alvo"]))
    if q.get("explicacao"):
        p.append('e:' + _js(q["explicacao"]))
    return "{" + ",".join(p) + "}"


def _bloco_bank(jogo):
    """As questões agrupadas por missão, na ordem em que aparecem no JSON."""
    por_missao = {}
    for q in jogo["questoes"]:
        por_missao.setdefault(q["missao"], []).append(q)
    partes = []
    for missao, lista in por_missao.items():
        corpo = ",\n".join(_questao(q) for q in lista)
        partes.append("%s:[\n%s]" % (missao, corpo))
    return "const bank={\n" + ",\n".join(partes) + "\n};"


def _bloco_nomes(jogo):
    itens = list(FIXAS) + [(m["id"], m["nome"]) for m in jogo["missoes"]]
    return "const nomes={" + ",".join(
        "%s:%s" % (k, _js(v)) for k, v in itens) + "};"


def _bloco_trilhas(jogo):
    return "const trails={" + ",".join(
        "%s:{name:%s,steps:%s}" % (t["id"], _js(t["nome"]), _js(t["etapas"]))
        for t in jogo["trilhas"]) + "};"


def aplicar():
    for ident, arq in ARQUIVOS.items():
        jogo = json.load(io.open(os.path.join(RAIZ, "conteudo", ident + ".json"),
                                 encoding="utf-8"))
        s = io.open(os.path.join(RAIZ, arq), encoding="utf-8").read()
        s = recorte.trocar(s, "const bank=", _bloco_bank(jogo), "{", "}")
        s = recorte.trocar(s, "const nomes=", _bloco_nomes(jogo), "{", "}")
        s = recorte.trocar(s, "const trails=", _bloco_trilhas(jogo), "{", "}")
        io.open(os.path.join(RAIZ, arq), "w", encoding="utf-8").write(s)
        print("  %-24s %d questões do JSON" % (arq.replace(".html", ""),
                                               len(jogo["questoes"])))


if __name__ == "__main__":
    aplicar()
