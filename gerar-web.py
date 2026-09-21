#!/usr/bin/env python3
"""Gera as versoes de web/ (fragmentos para a hospedagem de artifacts)
a partir dos arquivos completos da raiz. Nao usar em GitHub Pages."""
import io, re

def preparar(src, dst, titulo):
    s = io.open(src, encoding="utf-8").read()
    style  = re.search(r'<style>.*?</style>',  s, re.S).group(0)
    script = re.search(r'<script>.*?</script>', s, re.S).group(0)
    corpo  = re.search(r'<body>(.*?)</body>',  s, re.S).group(1).replace(script, "")
    io.open(dst, "w", encoding="utf-8").write(
        f"<title>{titulo}</title>\n{style}\n{corpo.strip()}\n{script}\n")
    print("gerado:", dst)

preparar("time-travel-english.html", "web/time-travel-english.html", "Time Travel English")
preparar("exploradores-do-ceu.html", "web/exploradores-do-ceu.html", "Exploradores do Céu")
preparar("historia-e-arte.html",     "web/historia-e-arte.html",     "Linhas do Tempo")
