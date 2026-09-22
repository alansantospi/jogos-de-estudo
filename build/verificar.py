# -*- coding: utf-8 -*-
"""Pega função chamada num motor que não a tem.

Os dois motores batizaram as mesmas coisas de formas diferentes
(showAchievement / mostrarConquista). Chamar o nome errado só quebra em
tempo de execução, no motor errado, no caminho errado — foi assim que a
entrada na sala ficou travada em "Conectando...". Aqui a divergência
derruba o build.
"""
import io, re, sys

# Nomes que existem só em um dos motores: usar sem `typeof` é erro.
SO_EM_UM = ["mostrarConquista", "makeQuestions", "allItems", "verbBank",
            "record", "weakItems", "weakVerbs", "nomes", "missionMeta"]

# Nomes que os dois motores tinham para a mesma coisa e que já convergiram.
# Voltar a usá-los é regressão, e a Fase 2 existiu para acabar com eles.
APOSENTADOS = {
    "showAchievement": "mostrarConquista",
    "buildCategoryPool": "makeQuestions",
    "buildQuestionPool": "makeTodasQuestions",
    "progress.verbs": "progress.items",
    "best.accuracy": "best.acc",
}

JOGOS = ("historia.html", "artes.html", "exploradores-do-ceu.html",
         "time-travel-english.html", "matematica.html")

def _sem_comentarios(js):
    """Comentários citam nomes de função; varrer texto é achar a si mesmo."""
    js = re.sub(r"/\*.*?\*/", "", js, flags=re.S)
    return re.sub(r"(^|[^:])//[^\n]*", r"\1", js)


falhas = []
for arq in JOGOS:
    s = io.open(arq, encoding="utf-8").read()
    js = "\n".join(re.findall(r"<script>(.*?)</script>", s, re.S))
    js = _sem_comentarios(js)
    for nome in SO_EM_UM:
        define = re.search(r"\b(?:function|const|let|var)\s+%s\b" % nome, js)
        if define:
            continue
        # usado sem definir: só vale se guardado por typeof
        for m in re.finditer(r"\b%s\b" % nome, js):
            ini = max(0, m.start() - 40)
            if "typeof" in js[ini:m.start()]:
                continue
            linha = js[:m.start()].count("\n") + 1
            falhas.append("%s: usa %s sem definir e sem typeof (linha ~%d do script)"
                          % (arq.replace(".html", ""), nome, linha))
            break

for arq in JOGOS:
    js = _sem_comentarios("\n".join(re.findall(r"<script>(.*?)</script>",
                          io.open(arq, encoding="utf-8").read(), re.S)))
    for velho, novo_nome in APOSENTADOS.items():
        if velho in js:
            falhas.append("%s: usa %s, que virou %s"
                          % (arq.replace(".html", ""), velho, novo_nome))

for f in falhas:
    print("  " + f)
print("  ok  os dois motores falam a mesma lingua" if not falhas
      else "  %d problema(s)" % len(falhas))
sys.exit(1 if falhas else 0)
