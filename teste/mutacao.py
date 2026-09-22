# -*- coding: utf-8 -*-
"""Confere que a suíte morde: reinjeta defeitos reais e cobra que falhe.

Suíte que passa não prova nada — precisa quebrar quando o código quebra.
Cada mutação aqui é um defeito que este projeto teve de verdade.
"""
import io, os, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import executar

MUTACOES = [
    ("artes.html", "fim", "leitor do ícone apontando para o campo antigo",
     '''q.ic ? '<svg class="ic-txt"''', '''q.i ? '<svg class="ic-txt"'''),
    ("artes.html", "conteudo", "letra fora de ordem nas alternativas",
     "marca.textContent=FORMAS[i%4]", "marca.textContent=FORMAS[(i+1)%4]"),
    ("artes.html", "navegacao", "motor limpando o endereço a cada tela",
     "function show(id){migalhas(id);",
     'function show(id){migalhas(id);try{history.replaceState(null,"",location.pathname)}catch(e){}'),
    ("index.html", "perfis", "apagar destruindo em vez de ir para a lixeira",
     "const guardado = {};",
     'const guardado = {}; if(true){ Object.values(BASES).forEach(b => '
     'localStorage.removeItem(b + ":" + id)); gravar(PERFIS_CHAVE, '
     'lerPerfis().filter(x => x.id !== id)); desenhar(); return; }'),
]

RAIZ = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
frouxas = 0
for arquivo, caso, descricao, de, para in MUTACOES:
    orig = io.open(os.path.join(RAIZ, arquivo), encoding="utf-8").read()
    if de not in orig:
        print("  ?     %-46s trecho sumiu; a mutação precisa ser refeita" % descricao)
        frouxas += 1
        continue
    tmp = os.path.join(RAIZ, arquivo.replace(".html", "__mutante.html"))
    io.open(tmp, "w", encoding="utf-8").write(orig.replace(de, para, 1))
    js = io.open(os.path.join(RAIZ, "teste", "casos", caso + ".js"), encoding="utf-8").read()
    try:
        r = executar.rodar(os.path.basename(tmp), js, tempo=12000)
    finally:
        os.path.exists(tmp) and os.unlink(tmp)
    pegou = not r.get("ok")
    if not pegou:
        frouxas += 1
    print("  %-6s %-46s %s" % ("pegou" if pegou else "PASSOU",
          descricao, (r.get("detalhes") or ["o teste não reclamou"])[0][:56]))

print("\n%s" % ("a suíte morde em todas" if not frouxas
                else "%d mutação(ões) passaram: a suíte tem buraco" % frouxas))
sys.exit(1 if frouxas else 0)
