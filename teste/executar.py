# -*- coding: utf-8 -*-
"""Roda os casos de teste num Chrome de verdade e cobra o resultado.

Por que um navegador real e não um DOM simulado: os defeitos que mais doeram
neste projeto só aparecem no navegador. `svg.hidden = false` não remove o
atributo porque SVGElement não é HTMLElement; `<use>` não herda `fill` do
`<svg>` de origem; um `<svg>` sem tamanho dentro de uma linha de texto estica
até 425px. Um stub teria passado em todos.

Cada caso é um script que chama `fim({ok, detalhes})`. O corredor injeta o
script na página, roda o Chrome sem cabeça e lê o resultado do DOM.
"""
import io, json, os, re, subprocess, sys, tempfile

RAIZ = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
CASOS = os.path.join(RAIZ, "teste", "casos")

CHROME = next((c for c in [
    "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
    "/usr/bin/google-chrome", "/usr/bin/chromium",
] if os.path.exists(c)), None)

# Da tabela do montador, mais o inglês, que tem motor próprio. Lista fixa aqui
# significa jogo novo entrando sem que a suíte o toque.
sys.path.insert(0, os.path.join(RAIZ, "build"))
import montar
JOGOS = sorted(montar.JOGOS) + ["time-travel-english.html"]

# Cada caso diz em que página roda: os quatro jogos, ou só o índice.
ALVOS = {
    "conteudo": JOGOS,
    "navegacao": JOGOS,
    "fim": JOGOS,
    "perfis": ["index.html"],
    "migracao": ["time-travel-english.html"],
    # Os jogos com lição em passos curtos. Quem entrar depois entra aqui.
    "licao": ["gramatica.html", "geografia.html"],
}

# Injetado antes de cada caso: entrega o resultado e captura erro de JS.
PREAMBULO = """
<script>
window.__erros = [];
addEventListener("error", e => window.__erros.push(e.message));
addEventListener("unhandledrejection", e => window.__erros.push("promessa: " + e.reason));
window.fim = function(r){
  r.erros = window.__erros;
  const p = document.createElement("pre");
  p.id = "__resultado";
  p.textContent = JSON.stringify(r);
  document.body.appendChild(p);
};
window.espere = (f, ms) => new Promise((ok, no) => { const t0 = Date.now();
  (function q(){ let v; try{ v = f(); }catch(e){}
    if(v) return ok(v);
    if(Date.now() - t0 > (ms || 8000)) return no(new Error("esperei demais por: " + f));
    setTimeout(q, 80); })(); });
</script>
"""


def rodar(pagina, caso_js, tempo=20000):
    fonte = io.open(os.path.join(RAIZ, pagina), encoding="utf-8").read()
    corpo = PREAMBULO + "<script>\n(async () => {\ntry{\n" + caso_js \
        + "\n}catch(e){ fim({ok:false, detalhes:['exceção: ' + e.message]}); }\n})();\n</script>"
    with tempfile.NamedTemporaryFile("w", suffix=".html", dir=RAIZ,
                                     delete=False, encoding="utf-8") as f:
        f.write(fonte.replace("</body>", corpo + "</body>"))
        caminho = f.name
    try:
        saida = subprocess.run(
            [CHROME, "--headless", "--disable-gpu", "--no-first-run",
             "--virtual-time-budget=%d" % tempo, "--dump-dom", caminho],
            capture_output=True, text=True, timeout=90).stdout
    except subprocess.TimeoutExpired:
        return {"ok": False, "detalhes": ["o Chrome não respondeu em 90 s"]}
    finally:
        os.unlink(caminho)
    m = re.search(r'<pre id="__resultado">(.*?)</pre>', saida, re.S)
    if not m:
        return {"ok": False, "detalhes": ["o caso não chegou a dar resultado "
                                          "(erro cedo demais ou espera longa demais)"]}
    import html as _h
    return json.loads(_h.unescape(m.group(1)))


def main():
    if not CHROME:
        print("  Chrome não encontrado. Os testes precisam dele.")
        return 2
    quais = sys.argv[1:] or sorted(
        f[:-3] for f in os.listdir(CASOS) if f.endswith(".js"))
    falhas = 0
    for nome in quais:
        js = io.open(os.path.join(CASOS, nome + ".js"), encoding="utf-8").read()
        print("\n== %s" % nome)
        for pagina in ALVOS.get(nome, JOGOS):
            r = rodar(pagina, js)
            erros = r.get("erros") or []
            ok = r.get("ok") and not erros
            print("  %-4s %-26s %s" % ("ok" if ok else "FALHA",
                                       pagina.replace(".html", ""),
                                       r.get("resumo", "")))
            if not ok:
                falhas += 1
                for d in (r.get("detalhes") or [])[:8]:
                    print("        %s" % d)
                for e in erros[:3]:
                    print("        erro de JS: %s" % e)
    print("\n%s" % ("todos passaram" if not falhas else "%d falha(s)" % falhas))
    return 1 if falhas else 0


if __name__ == "__main__":
    sys.exit(main())
