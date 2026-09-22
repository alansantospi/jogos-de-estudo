# -*- coding: utf-8 -*-
"""Valida `conteudo/*.json`. Conteúdo inválido derruba o build.

É este esquema que a esteira de geração (Fase 4) vai produzir. Ele existir
antes dela é o que permite escrever o gerador contra um alvo fixo.
"""
import io, json, os, sys

RAIZ = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

# tipo -> campos obrigatórios além dos comuns
CAMPOS = {
    "escolha": ["certa", "erradas"],
    "escutar": ["certa", "erradas"],
    "vf":      ["certa"],
    "digitar": ["aceitas"],
    "ordenar": ["sequencia"],
    "ligar":   ["pares"],
    "bussola": ["alvo"],
    # Tipos do motor de inglês cujo miolo fica em `extra`, verbatim, até a
    # fusão dos motores. Declarados para não passarem por tipo desconhecido.
    "memoria": [],
    "cruzada": [],
    "cacapalavras": [],
}
COMUNS = ["tipo", "icone", "enunciado", "origem"]
ORIGENS = {"propria", "derivada"}


def conferir(caminho):
    erros = []
    jogo = json.load(io.open(caminho, encoding="utf-8"))
    nome = os.path.basename(caminho)

    for c in ("id", "materia", "titulo", "missoes", "trilhas", "questoes"):
        if c not in jogo:
            erros.append("%s: falta o campo %s" % (nome, c))
    if erros:
        return erros

    missoes = {m["id"] for m in jogo["missoes"]}
    for t in jogo["trilhas"]:
        for e in t["etapas"]:
            if e not in missoes and e not in ("all", "review"):
                erros.append("%s: a trilha %s aponta para a missão inexistente %s"
                             % (nome, t["id"], e))

    for i, q in enumerate(jogo["questoes"]):
        onde = "%s, questão %d" % (nome, i + 1)
        for c in COMUNS:
            if c not in q:
                erros.append("%s: falta %s" % (onde, c))
        if q.get("origem") not in ORIGENS:
            erros.append("%s: origem deve ser propria ou derivada" % onde)
        # Um motor diz `missao`; o outro, `missoes` (uma questão pode servir
        # a mais de uma). Aceita os dois até a fusão.
        suas = [q["missao"]] if "missao" in q else q.get("missoes", [])
        if "missao" not in q and "missoes" not in q:
            erros.append("%s: não diz a que missão pertence" % onde)
        for m in suas:
            if m not in missoes:
                erros.append("%s: missão desconhecida %r" % (onde, m))
        if q.get("tipo") not in CAMPOS:
            erros.append("%s: tipo desconhecido %r" % (onde, q.get("tipo")))
            continue
        for c in CAMPOS[q["tipo"]]:
            if c not in q:
                erros.append("%s: tipo %s exige %s" % (onde, q["tipo"], c))
        if q["tipo"] in ("escolha", "escutar"):
            if len(q.get("erradas", [])) < 2:
                erros.append("%s: menos de duas alternativas erradas" % onde)
            if q.get("certa") in q.get("erradas", []):
                erros.append("%s: a resposta certa aparece também entre as erradas" % onde)
            vazias = [x for x in [q.get("certa")] + list(q.get("erradas", [])) if not str(x).strip()]
            if vazias:
                erros.append("%s: alternativa vazia" % onde)
    return erros


def main():
    todos = []
    pasta = os.path.join(RAIZ, "conteudo")
    for f in sorted(os.listdir(pasta)):
        if not f.endswith(".json"):
            continue
        e = conferir(os.path.join(pasta, f))
        todos += e
        jogo = json.load(io.open(os.path.join(pasta, f), encoding="utf-8"))
        derivadas = sum(1 for q in jogo["questoes"] if q.get("origem") == "derivada")
        print("  %-20s %3d questões, %3d derivadas   %s"
              % (f[:-5], len(jogo["questoes"]), derivadas,
                 "ok" if not e else "%d problema(s)" % len(e)))
    for x in todos[:10]:
        print("     %s" % x)
    return 1 if todos else 0


if __name__ == "__main__":
    sys.exit(main())
