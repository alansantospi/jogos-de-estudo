# -*- coding: utf-8 -*-
"""Confere que o conteúdo sobrevive à volta: JSON -> motor -> JSON.

A versão anterior comparava com uma referência congelada em /tmp — que some
entre sessões e acusa mudança deliberada de formato como se fosse perda.
Esta fecha o ciclo: lê o que o navegador enxerga no jogo montado, converte de
volta ao esquema e compara com o arquivo de conteúdo. Não depende de nada
externo e continua valendo quando o formato mudar.
"""
import io, json, os, sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import extrair

RAIZ = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

PARES = {
    "exploradores-do-ceu.html": "ciencias-4ano",
    "historia.html": "historia-4ano",
    "artes.html": "artes-4ano",
}

# Campos do esquema que o motor não carrega de volta: são só para nós.
SO_NOSSOS = {"origem"}


def _comparavel(q):
    d = {k: v for k, v in q.items() if k not in SO_NOSSOS}
    f = d.get("fonte")
    if isinstance(f, dict):          # no motor a fonte viaja como {t,d}
        d["fonte"] = {"t": f["tipo"], "d": f["detalhe"]}
    return d


def main():
    total = 0
    for arq, ident in PARES.items():
        jogo = json.load(io.open(os.path.join(RAIZ, "conteudo", ident + ".json"),
                                 encoding="utf-8"))
        esperado = [_comparavel(q) for q in jogo["questoes"]]

        d = extrair.despejar(arq)
        veio = []
        for missao, lista in d["bank"].items():
            for q in lista:
                veio.append(_comparavel(extrair.converter(q, missao)))

        difs = []
        if len(esperado) != len(veio):
            difs.append("%d questões no conteúdo, %d no jogo" % (len(esperado), len(veio)))
        for i, (a, b) in enumerate(zip(esperado, veio)):
            for k in sorted(set(a) | set(b)):
                if a.get(k) != b.get(k):
                    difs.append("questão %d, campo %s: %r no conteúdo, %r no jogo"
                                % (i + 1, k, str(a.get(k))[:40], str(b.get(k))[:40]))
        total += len(difs)
        print("  %-24s %s" % (arq.replace(".html", ""),
                              "o conteúdo bate" if not difs else "%d diferença(s)" % len(difs)))
        for x in difs[:6]:
            print("        %s" % x)
    print("\n%s" % ("o conteúdo atravessa o motor sem perda" if not total
                    else "%d diferença(s): a montagem perdeu algo" % total))
    return 1 if total else 0


if __name__ == "__main__":
    sys.exit(main())
