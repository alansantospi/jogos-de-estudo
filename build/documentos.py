#!/usr/bin/env python3
"""Confere os documentos do repositório.

Existe por um motivo específico: conteudo/LEIA.md ficou 0 bytes por quatro
commits sem ninguém notar. O heredoc que devia escrevê-lo não escreveu, e os
scripts que depois tentaram atualizá-lo falharam contra um arquivo vazio —
falhas que eu li como problema de regex. Documento vazio agora quebra o build.

Confere também que a tabela de inventário do conteúdo diz a verdade: número
que envelhece calado é pior que número ausente.
"""
import io, json, glob, os, re, subprocess, sys

MINIMO = 200   # bytes; abaixo disso não é documento, é acidente
falhas = []

# --- todo .md versionado tem de ter corpo ---------------------------------
saida = subprocess.run(["git", "ls-files", "*.md"], capture_output=True, text=True)
for caminho in saida.stdout.split():
    n = os.path.getsize(caminho)
    if n < MINIMO:
        falhas.append("%s tem só %d bytes" % (caminho, n))

# --- a tabela de inventário confere com os arquivos -----------------------
leia = io.open("conteudo/LEIA.md", encoding="utf-8").read()
linha = re.compile(r"^\| `(\S+\.json)` \| (\d+) \| (\d+) \|$", re.M)
dito = {m.group(1): (int(m.group(2)), int(m.group(3)))
        for m in linha.finditer(leia)}

real = {}
for caminho in sorted(glob.glob("conteudo/*.json")):
    d = json.load(io.open(caminho, encoding="utf-8"))
    qs = d.get("questoes", [])
    real[os.path.basename(caminho)] = (
        len(qs), sum(1 for q in qs if q.get("origem") == "derivada"))

for arquivo in sorted(set(dito) | set(real)):
    if arquivo not in dito:
        falhas.append("%s existe mas não está na tabela de conteudo/LEIA.md" % arquivo)
    elif arquivo not in real:
        falhas.append("%s está na tabela mas não existe" % arquivo)
    elif dito[arquivo] != real[arquivo]:
        falhas.append("%s: tabela diz %d/%d, arquivo tem %d/%d"
                      % ((arquivo,) + dito[arquivo] + real[arquivo]))

soma = re.search(r"^\| \*\*total\*\* \| \*\*(\d+)\*\* \| \*\*(\d+)\*\* \|$", leia, re.M)
if not soma:
    falhas.append("conteudo/LEIA.md não tem linha de total")
else:
    esperado = (sum(v[0] for v in real.values()), sum(v[1] for v in real.values()))
    if (int(soma.group(1)), int(soma.group(2))) != esperado:
        falhas.append("total: tabela diz %s/%s, soma é %d/%d"
                      % (soma.group(1), soma.group(2), esperado[0], esperado[1]))

for f in falhas:
    print("  FALHA", f)
if falhas:
    sys.exit(1)
print("  ok   %d documentos, inventário confere (%d questões, %d derivadas)"
       % (len(saida.stdout.split()),
          sum(v[0] for v in real.values()), sum(v[1] for v in real.values())))
