# -*- coding: utf-8 -*-
"""Busca e agrupamento na lista de missões.

A lista do inglês já tinha 2143px — três telas de celular — com 18 missões,
e a cada prova entram mais. Duas coisas resolvem em direções diferentes:
o agrupamento ajuda a percorrer, a busca ajuda a achar. A busca é a que
escala sozinha: conteúdo novo entra sem manutenção nenhuma.
"""
import io, re

# Ordem e títulos dos grupos. A chave é a categoria (data-cat); cartões não
# listados ficam no fim, sem grupo — assim conteúdo novo nunca some da tela.
GRUPOS = {
    "time-travel-english.html": [
        ("Atalhos",        ["review", "all"]),
        ("Verbos",         ["vocabulary", "movement", "daily_actions", "results_actions"]),
        ("Regras do -ING", ["ing_add", "ing_drop_e", "ing_double"]),
        ("Gramática",      ["be", "affirmative", "negative_questions", "contractions"]),
        ("Temas da prova", ["clock_routine", "time_numbers", "world", "ticket"]),
        ("Escuta",         ["listening"]),
    ],
    "exploradores-do-ceu.html": [
        ("Atalhos",     ["review", "all"]),
        ("Terra e Sol", ["earth", "sun", "hemispheres"]),
        ("Orientação",  ["orientation", "instruments"]),
        ("Céu",         ["stars", "moon", "calendars"]),
    ],
    "historia.html": [("Atalhos", ["review", "all"])],
    "artes.html":    [("Atalhos", ["review", "all"])],
}

CAMPO = ('<div class="busca">'
         '<svg viewBox="0 0 24 24" aria-hidden="true"><use href="#i-lupa"/></svg>'
         '<input type="search" id="buscaMissao" autocomplete="off"'
         ' placeholder="Buscar assunto..." aria-label="Buscar missão"'
         ' aria-controls="gradeMissoes">'
         '</div>')

FILTRO = '''
/* ---------- busca de missão ---------- */
/* Sem acento e sem caixa: a criança digita "relogio" e acha "Que horas são".
   Filtra por título e descrição, esconde grupo que ficou vazio. */
function _chave(t){
  return (t || "").normalize("NFD").replace(/[\\u0300-\\u036f]/g, "").toLowerCase();
}
function filtrarMissoes(){
  const campo = document.getElementById("buscaMissao");
  const raiz  = document.getElementById("categories");
  if(!campo || !raiz) return;
  const q = _chave(campo.value.trim());
  let achou = 0;
  raiz.querySelectorAll(".category-card, .trail-card").forEach(c => {
    const bate = !q || _chave(c.textContent).includes(q);
    c.hidden = !bate;
    if(bate) achou++;
  });
  // Um título — de seção ou de grupo — só aparece se sobrou cartão embaixo.
  raiz.querySelectorAll("h2, h3.grupo").forEach(h => {
    let vivo = false;
    for(let n = h.nextElementSibling; n && !_ehTitulo(n); n = n.nextElementSibling){
      if(_ehCartao(n)){ if(!n.hidden){ vivo = true; break; } continue; }
      if(n.querySelector && n.querySelector(".category-card:not([hidden]), .trail-card:not([hidden])")){
        vivo = true; break;
      }
    }
    h.hidden = !vivo;
  });
  const vazio = document.getElementById("semResultado");
  if(vazio) vazio.hidden = achou > 0;
}
function _ehTitulo(n){ return n.tagName === "H2" || n.classList.contains("grupo"); }
function _ehCartao(n){
  return n.classList.contains("category-card") || n.classList.contains("trail-card");
}

'''


def _fecha_div(s, i):
    """Posição do </div> que fecha a div já aberta em i, contando aninhamento."""
    nivel = 1
    for m in re.finditer(r"<(/?)div\b", s[i:]):
        nivel += -1 if m.group(1) else 1
        if nivel == 0:
            return i + m.start()
    raise AssertionError("div sem fechamento")


def aplicar(arq):
    s = io.open(arq, encoding="utf-8").read()

    # 1. a grade recebe id, para a busca e o aria-controls
    m = re.search(r'<div class="category-grid"', s)
    assert m, "%s: nao achei a grade de missoes" % arq
    s = s[:m.end()] + ' id="gradeMissoes"' + s[m.end():]

    # 2. reordena os cartões em grupos
    ini = s.index('<div class="category-grid"')
    ini = s.index(">", ini) + 1
    fim = _fecha_div(s, ini)   # cartões têm <div> dentro: contar é obrigatório
    # cada cartão é um <button ...>...</button> de primeiro nível
    miolo = s[ini:fim]
    cartoes = re.findall(r'<button\b.*?</button>', miolo, re.S)
    assert cartoes, "%s: nenhum cartao de missao" % arq
    resto = re.sub(r'<button\b.*?</button>', "", miolo, flags=re.S).strip()
    assert not resto, "%s: sobrou markup fora dos cartoes: %r" % (arq, resto[:80])

    por_cat = {}
    for c in cartoes:
        m = re.search(r'data-cat="([^"]*)"', c)
        por_cat[m.group(1) if m else c[:20]] = c

    novo, usados = [], set()
    for titulo, cats in GRUPOS[arq]:
        bloco = [por_cat[c] for c in cats if c in por_cat]
        if not bloco:
            continue
        novo.append('<h3 class="grupo">%s</h3>' % titulo)
        novo.extend(bloco)
        usados.update(c for c in cats if c in por_cat)

    sobra = [c for k, c in por_cat.items() if k not in usados]
    if sobra:
        novo.append('<h3 class="grupo">Conteúdos</h3>')
        novo.extend(sobra)
    novo.append('<p id="semResultado" class="sem-resultado" hidden>'
                'Nenhuma missão com esse nome.</p>')

    s = s[:ini] + "\n" + "\n".join(novo) + "\n" + s[fim:]

    # 3. o campo de busca vem antes de TUDO que ele filtra — trilhas
    #    inclusive. Embaixo das trilhas, buscar faria sumir coisa acima dele.
    import re as _re
    m = _re.search(r'<h2[^>]*>Trilhas</h2>', s)
    assert m, "%s: nao achei o titulo das trilhas" % arq
    s = s[:m.start()] + CAMPO + s[m.start():]

    # 4. o filtro, e limpar a busca ao entrar na tela
    assert s.count("function _openCategories(") == 1, arq
    s = s.replace(FILTRO.strip(), "")  # idempotência
    s = s.replace("function _openCategories(", FILTRO + "\nfunction _openCategories(", 1)
    s = re.sub(r'(<input type="search" id="buscaMissao")',
               r'\1 oninput="filtrarMissoes()"', s, count=1)

    io.open(arq, "w", encoding="utf-8").write(s)
    print("  %-24s %d missoes em %d grupos" % (
        arq.replace(".html", ""), len(cartoes), len(GRUPOS[arq]) + (1 if sobra else 0)))


for arq in GRUPOS:
    aplicar(arq)
