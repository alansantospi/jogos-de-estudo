# -*- coding: utf-8 -*-
"""Tira o banco de questões de dentro do HTML, uma vez só.

Quem analisa o JavaScript é o próprio JavaScript: a página é carregada num
Chrome sem cabeça e o banco sai por JSON.stringify. Escrever um analisador
de JS em Python para isto seria inventar uma classe de erro sem necessidade.

Roda uma vez. Depois quem manda é `conteudo/*.json`.
"""
import io, json, os, re, subprocess, sys, tempfile

RAIZ = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
CHROME = next((c for c in [
    "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
    "/usr/bin/google-chrome", "/usr/bin/chromium"] if os.path.exists(c)), None)

JOGOS = {
    "exploradores-do-ceu.html": ("ciencias-4ano", "Ciências", "Exploradores do Céu"),
    "historia.html":            ("historia-4ano", "História", "Linhas do Tempo"),
    "artes.html":               ("artes-4ano",    "Arte",     "Ateliê"),
}

# Tipo interno do motor -> nome no esquema.
TIPOS = {"choice": "escolha", "tf": "vf", "text": "digitar",
         "order": "ordenar", "match": "ligar", "compass": "bussola"}


def despejar(arquivo):
    """Devolve {bank, nomes, trails} como o navegador os enxerga."""
    fonte = io.open(os.path.join(RAIZ, arquivo), encoding="utf-8").read()
    js = """<script>addEventListener("load",()=>{
      const p=document.createElement("pre"); p.id="__dados";
      p.textContent=JSON.stringify({bank:bank, nomes:nomes, trails:trails});
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
    m = re.search(r'<pre id="__dados">(.*?)</pre>', saida, re.S)
    assert m, "%s: o banco não saiu" % arquivo
    import html as _h
    return json.loads(_h.unescape(m.group(1)))


def converter(q, missao):
    """Do formato do motor para o do esquema, sem perder campo nenhum."""
    tipo = TIPOS[q.get("t", "choice")]
    fora = {"tipo": tipo, "missao": missao, "icone": q["ic"], "enunciado": q["q"]}
    if q.get("src"):
        fora["fonte"] = q["src"]
        # Marcação de procedência: o que cita livro ou folha da escola é
        # derivado. Decide o que pode ser publicado com o produto.
        fora["origem"] = "derivada" if re.search(r"livro|folha", q["src"], re.I) else "propria"
    else:
        fora["origem"] = "propria"
    if tipo == "escolha":
        fora["certa"] = q["c"]; fora["erradas"] = q["d"]
    elif tipo == "vf":
        fora["certa"] = bool(q["c"])
    elif tipo == "digitar":
        fora["aceitas"] = q["valid"]; fora["exemplo"] = q.get("ph", "")
    elif tipo == "ordenar":
        fora["sequencia"] = q["seq"]
    elif tipo == "ligar":
        fora["pares"] = q["pairs"]
    elif tipo == "bussola":
        fora["alvo"] = q["target"]
    if q.get("e"):
        fora["explicacao"] = q["e"]
    return fora


def main():
    assert CHROME, "Chrome não encontrado"
    for arquivo, (ident, materia, titulo) in JOGOS.items():
        d = despejar(arquivo)
        questoes = []
        for missao, lista in d["bank"].items():
            for q in lista:
                questoes.append(converter(q, missao))
        jogo = {
            "id": ident, "materia": materia, "titulo": titulo, "motor": "ceu",
            "missoes": [{"id": k, "nome": v} for k, v in d["nomes"].items()
                        if k not in ("all", "review")],
            "trilhas": [{"id": k, "nome": t["name"], "etapas": t["steps"]}
                        for k, t in d["trails"].items()],
            "questoes": questoes,
        }
        destino = os.path.join(RAIZ, "conteudo", ident + ".json")
        io.open(destino, "w", encoding="utf-8").write(
            json.dumps(jogo, ensure_ascii=False, indent=1) + "\n")
        derivadas = sum(1 for q in questoes if q["origem"] == "derivada")
        print("  %-16s %3d questões (%d derivadas), %d missões, %d trilhas"
              % (ident, len(questoes), derivadas, len(jogo["missoes"]), len(jogo["trilhas"])))


if __name__ == "__main__":
    main()
