# -*- coding: utf-8 -*-
"""Acha o fim de uma declaração JavaScript sem se enganar com aspas.

Contar chaves no texto cru parece bastar até uma questão conter um colchete
dentro de uma string — aí a conta fecha no lugar errado e a substituição
engole o que vier depois. Este varredor pula literais e escapes.
"""


def fim_da_declaracao(s, inicio, abre="[", fecha="]"):
    """Posição logo após o `;` que encerra a declaração que começa em `inicio`."""
    i = s.index(abre, inicio)
    nivel, aspas, escapa = 0, None, False
    while i < len(s):
        c = s[i]
        if escapa:
            escapa = False
        elif aspas:
            if c == "\\":
                escapa = True
            elif c == aspas:
                aspas = None
            elif aspas == "`" and c == "$" and s[i + 1:i + 2] == "{":
                # Interpolação de template: entra num nível de chaves próprio.
                j, n = i + 2, 1
                while j < len(s) and n:
                    if s[j] == "{":
                        n += 1
                    elif s[j] == "}":
                        n -= 1
                    j += 1
                i = j - 1
        elif c == "/" and s[i + 1:i + 2] == "/":
            # Comentário de linha. Um apóstrofo dentro dele — "can't" — abriria
            # uma string falsa e a conta engoliria o resto do arquivo.
            i = s.find("\n", i)
            if i < 0:
                break
        elif c == "/" and s[i + 1:i + 2] == "*":
            i = s.index("*/", i) + 1
        elif c in "\"'`":
            aspas = c
        elif c == abre:
            nivel += 1
        elif c == fecha:
            nivel -= 1
            if nivel == 0:
                # Ponto e vírgula é opcional em JavaScript, e um dos
                # reservatórios deste projeto fecha sem ele. Procurar o `;`
                # cegamente saltava para dentro da declaração seguinte.
                j = i + 1
                while j < len(s) and s[j] in " \t":
                    j += 1
                return j + 1 if j < len(s) and s[j] == ";" else i + 1
        i += 1
    raise AssertionError("declaração sem fechamento a partir de %d" % inicio)


def trocar(s, marca, bloco, abre="[", fecha="]"):
    i = s.index(marca)
    return s[:i] + bloco + s[fim_da_declaracao(s, i, abre, fecha):]
