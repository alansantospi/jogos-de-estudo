# -*- coding: utf-8 -*-
"""Tira o conteúdo do jogo de inglês para o mesmo esquema dos outros.

Lá a questão não declara a que missão pertence: `buildCategoryPool` filtra os
três reservatórios por expressão regular sobre o texto da fase. Aqui esse
mapeamento implícito vira explícito — e o resultado é conferido rodando os
mesmos filtros e comparando conjunto a conjunto.

Os geradores por regra continuam sendo código; o que fica declarado é qual
missão usa quais, e com que tamanho.
"""
import io, json, os, re, subprocess, sys, tempfile

RAIZ = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
CHROME = next((c for c in [
    "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
    "/usr/bin/google-chrome", "/usr/bin/chromium"] if os.path.exists(c)), None)
ARQ = "time-travel-english.html"

# O mapeamento que hoje vive dentro do switch, escrito uma vez só.
FILTROS = {
    "contractions":       ("unit5Pool", r"CONTRACTIONS|WHAT ARE YOU DOING|CAN / CAN'T|LISTENING — UNIT 5"),
    "clock_routine":      ("unit5Pool", r"WHAT TIME IS IT|DAILY ROUTINE|SONG|LISTENING — THE TIME"),
    "time_numbers":       ("extraPool", r"NUMBERS|WHAT TIME|LISTENING — THE TIME"),
    "world":              ("extraPool", r"SOLAR SYSTEM|CULTURE"),
    "negative_questions": ("baseQuestionPool", r"NEGATIV|PERGUNT|QUESTION"),
    "ticket":             ("baseQuestionPool", r"TICKET"),
}

TIPOS = {"choice": "escolha", "tf": "vf", "text": "digitar", "order": "ordenar",
         "match": "ligar", "listenchoice": "escutar", "ticketchoice": "escolha",
         "memory": "memoria", "wordsearch": "cacapalavras", "crossword": "cruzada"}


def despejar():
    fonte = io.open(os.path.join(RAIZ, ARQ), encoding="utf-8").read()
    js = """<script>addEventListener("load",()=>{
      const p=document.createElement("pre"); p.id="__d";
      p.textContent=JSON.stringify({base:baseQuestionPool, unit5:unit5Pool,
        extra:extraPool, verbos:verbBank, meta:missionMeta, trilhas:trails});
      document.body.appendChild(p);});</script>"""
    with tempfile.NamedTemporaryFile("w", suffix=".html", dir=RAIZ,
                                     delete=False, encoding="utf-8") as f:
        f.write(fonte.replace("</body>", js + "</body>"))
        caminho = f.name
    try:
        saida = subprocess.run(
            [CHROME, "--headless", "--disable-gpu", "--virtual-time-budget=6000",
             "--dump-dom", caminho], capture_output=True, text=True, timeout=90).stdout
    finally:
        os.unlink(caminho)
    m = re.search(r'<pre id="__d">(.*?)</pre>', saida, re.S)
    assert m, "o conteúdo do inglês não saiu"
    import html as _h
    return json.loads(_h.unescape(m.group(1)))


def converter(q, missoes, reservatorio):
    """Traduz para o esquema e guarda verbatim o que não souber traduzir.

    Sem o saco `extra`, cada tipo novo seria uma perda silenciosa: foi assim
    que `memory` quase perdeu os pares e `crossword` as respostas.
    """
    tipo = TIPOS.get(q.get("type"), q.get("type"))
    usados = {"type", "stage", "ic", "src", "q", "hint", "audio"}
    fora = {"tipo": tipo, "missoes": missoes, "icone": q.get("ic", "estrela"),
            "enunciado": q.get("q", ""), "fase": q.get("stage", ""),
            # Sem saber de que reservatório veio não dá para devolver ao motor,
            # e JSON que não é a verdade vira decoração que diverge.
            "reservatorio": reservatorio}
    if q.get("src"):
        fora["fonte"] = q["src"]
        fora["origem"] = "derivada" if re.search(r"livro|folha", q["src"], re.I) else "propria"
    else:
        fora["origem"] = "propria"
    if q.get("hint"):
        fora["dica"] = q["hint"]
    if q.get("audio"):
        fora["audio"] = q["audio"]

    if tipo in ("escolha", "escutar") and q.get("choices"):
        fora["certa"] = q["choices"][q["answer"]]
        fora["erradas"] = [x for i, x in enumerate(q["choices"]) if i != q["answer"]]
        usados |= {"choices", "answer"}
    elif tipo == "vf":
        fora["certa"] = bool(q.get("answer")); usados.add("answer")
    elif tipo == "digitar":
        fora["aceitas"] = q.get("valid", []); fora["exemplo"] = q.get("placeholder", "")
        usados |= {"valid", "placeholder"}
    elif tipo == "ordenar":
        fora["palavras"] = q.get("words", [])
        fora["sequencia"] = str(q.get("answer", "")).split()
        usados |= {"words", "answer"}
    elif tipo == "ligar":
        fora["pares"] = q.get("pairs", []); usados.add("pairs")

    if q.get("ok"):
        fora["explicacao"] = q["ok"]
    if q.get("bad"):
        fora["explicacaoErro"] = q["bad"]
    usados |= {"ok", "bad"}

    sobra = {k: v for k, v in q.items() if k not in usados}
    if sobra:
        fora["extra"] = sobra
    return fora


def main():
    assert CHROME, "Chrome não encontrado"
    d = despejar()
    reservatorios = {"baseQuestionPool": d["base"], "unit5Pool": d["unit5"], "extraPool": d["extra"]}

    # A que missões cada questão estática pertence, pelos filtros de hoje.
    pertence = {}
    for missao, (nome_res, padrao) in FILTROS.items():
        rx = re.compile(padrao)
        for i, q in enumerate(reservatorios[nome_res]):
            if rx.search(q.get("stage", "")):
                pertence.setdefault((nome_res, i), []).append(missao)

    questoes = []
    for nome_res, lista in reservatorios.items():
        for i, q in enumerate(lista):
            questoes.append(converter(q, pertence.get((nome_res, i), []), nome_res))

    jogo = {
        "id": "ingles-4ano", "materia": "Inglês", "titulo": "Time Travel English",
        "motor": "ingles",
        "missoes": [{"id": k, "nome": v["title"]} for k, v in d["meta"].items()
                    if k not in ("all", "review")],
        "trilhas": [{"id": k, "nome": t["name"],
                     "etapas": [e["cat"] for e in t["steps"]]}
                    for k, t in d["trilhas"].items()],
        "verbos": d["verbos"],
        "questoes": questoes,
    }
    destino = os.path.join(RAIZ, "conteudo", "ingles-4ano.json")
    io.open(destino, "w", encoding="utf-8").write(
        json.dumps(jogo, ensure_ascii=False, indent=1) + "\n")

    com_missao = sum(1 for q in questoes if q["missoes"])
    derivadas = sum(1 for q in questoes if q["origem"] == "derivada")
    print("  ingles-4ano      %d questões (%d com missão explícita, %d derivadas), "
          "%d verbos, %d missões" % (len(questoes), com_missao, derivadas,
                                     len(d["verbos"]), len(jogo["missoes"])))


if __name__ == "__main__":
    main()
