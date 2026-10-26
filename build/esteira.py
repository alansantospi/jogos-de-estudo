# -*- coding: utf-8 -*-
"""Escreve para a esteira de geração o que ela precisa saber do build.

A função de servidor roda em Deno e não lê Python. Os nomes de desenho que
uma questão pode usar estão em `build/icons.py`; copiá-los à mão para lá é
o mesmo erro da lista de jogos repetida em quatro arquivos. Então sai daqui,
a cada build, e o deploy da função vem depois do build.
"""
import io, json, os, sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import icons

RAIZ = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DESTINO = os.path.join(RAIZ, "supabase", "functions", "_esteira", "icones.ts")

# Desenhos da interface do motor, não de conteúdo: uma questão com o ícone
# de "som" ou de "expandir" seria engano, não ilustração.
DA_INTERFACE = {"som", "mudo", "check", "casa", "lupa", "fogo", "tema", "expandir",
                "encolher", "palmas", "festa", "voltar", "xis", "mais", "menos",
                "alerta", "seta-baixo", "seta-cima"}

nomes = sorted(n for n in icons._P if n not in DA_INTERFACE)
texto = ("/* Gerado por build/esteira.py a partir de build/icons.py. Não editar. */\n"
         "export const ICONES: string[] = %s;\n" % json.dumps(nomes, ensure_ascii=False))
io.open(DESTINO, "w", encoding="utf-8").write(texto)
print("  %-24s %d desenhos disponíveis para questão gerada" % ("esteira", len(nomes)))
