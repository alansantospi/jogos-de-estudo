# -*- coding: utf-8 -*-
"""Põe as fontes das questões num formato só. Roda uma vez.

Cada jogo escrevia a procedência de um jeito — `p.55 q2` num, `livro p.62`
noutro, `revisão ...` num terceiro —, e por isso cada motor tinha o seu
formatador de rótulo. Era a última divergência de lógica entre eles.

Com o conteúdo em dado, normalizar o dado é o que permite ter um código só.
"""
import io, json, os, re, sys

RAIZ = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))


def normalizar(fonte):
    """Devolve (tipo, detalhe): tipo é `livro` ou `folha`."""
    f = (fonte or "").strip()
    if not f:
        return None
    m = re.match(r"^(?:livro\s*)?(p\.\s*\d+.*)$", f, re.I)
    if m:
        return {"tipo": "livro", "detalhe": re.sub(r"\s+", " ", m.group(1)).strip()}
    m = re.match(r"^(?:folha|revis\w*)\s*(.*)$", f, re.I)
    if m:
        d = re.sub(r"^[\s/,]+", "", m.group(1)).strip()
        return {"tipo": "folha", "detalhe": d}
    return {"tipo": "outra", "detalhe": f}


def main():
    total, mudadas = 0, 0
    for nome in sorted(os.listdir(os.path.join(RAIZ, "conteudo"))):
        if not nome.endswith(".json"):
            continue
        caminho = os.path.join(RAIZ, "conteudo", nome)
        jogo = json.load(io.open(caminho, encoding="utf-8"))
        tipos = {}
        for q in jogo["questoes"]:
            if "fonte" not in q:
                continue
            total += 1
            novo = normalizar(q["fonte"])
            if novo and novo != q.get("fonte"):
                if not isinstance(q["fonte"], dict):
                    mudadas += 1
                q["fonte"] = novo
                tipos[novo["tipo"]] = tipos.get(novo["tipo"], 0) + 1
        io.open(caminho, "w", encoding="utf-8").write(
            json.dumps(jogo, ensure_ascii=False, indent=1) + "\n")
        print("  %-18s %s" % (nome[:-5], tipos or "sem fonte declarada"))
    print("  %d fontes normalizadas de %d" % (mudadas, total))


if __name__ == "__main__":
    main()
