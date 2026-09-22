# -*- coding: utf-8 -*-
"""Confere que tirar o conteúdo do código não perdeu nada.

Compara o que o navegador enxerga hoje com a referência guardada antes da
mudança. Igualdade de dado, não de texto: a formatação muda, o conteúdo não
pode mudar.
"""
import io, json, os, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import extrair

REF = os.environ.get("REFERENCIA", "/tmp/ref.json")


def diferencas(a, b, caminho=""):
    saida = []
    if type(a) is not type(b):
        return ["%s: tipo mudou (%s -> %s)" % (caminho, type(a).__name__, type(b).__name__)]
    if isinstance(a, dict):
        for k in sorted(set(a) | set(b)):
            if k not in a:
                saida.append("%s.%s: apareceu do nada" % (caminho, k))
            elif k not in b:
                saida.append("%s.%s: sumiu" % (caminho, k))
            else:
                saida += diferencas(a[k], b[k], "%s.%s" % (caminho, k))
    elif isinstance(a, list):
        if len(a) != len(b):
            saida.append("%s: %d itens viraram %d" % (caminho, len(a), len(b)))
        for i, (x, y) in enumerate(zip(a, b)):
            saida += diferencas(x, y, "%s[%d]" % (caminho, i))
    elif a != b:
        saida.append("%s: %r virou %r" % (caminho, str(a)[:50], str(b)[:50]))
    return saida


def main():
    if not os.path.exists(REF):
        print("  sem referência em %s — nada a comparar" % REF)
        return 0
    ref = json.load(io.open(REF, encoding="utf-8"))
    total = 0
    for arq in extrair.JOGOS:
        agora = extrair.despejar(arq)
        d = diferencas(ref[arq], agora, arq.replace(".html", ""))
        total += len(d)
        print("  %-24s %s" % (arq.replace(".html", ""),
                              "idêntico" if not d else "%d diferença(s)" % len(d)))
        for x in d[:6]:
            print("        %s" % x)
    print("\n%s" % ("o conteúdo atravessou intacto" if not total
                    else "%d diferença(s): a extração perdeu algo" % total))
    return 1 if total else 0


if __name__ == "__main__":
    sys.exit(main())
