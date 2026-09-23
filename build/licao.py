# -*- coding: utf-8 -*-
"""Maquinaria das lições em passos curtos, compartilhada pelas matérias.

Cada matéria traz só os seus passos, como dado, e chama `montar`. Daqui saem
os dois modos — passo a passo e resumo — e é por isso que eles não podem
divergir: escrever o resumo à mão seria manter a mesma matéria em dois lugares.

Três mecânicas dão conta de tudo, por delegação de clique e guiadas por data-*:

    escolher  tocar a opção certa — serve também para tocar a palavra na frase
    revelar   tocar o cartão para abrir a resposta
    maquina   um ou dois eixos de escolha que compõem um resultado

Um passo é um dicionário:

    missao   id da missão, para o botão "Treinar isto agora"
    titulo   o título do passo
    ideia    a regra, em uma ou duas frases
    fig      um desenho (opcional), com `legenda`
    revs     pares título → resposta, com `revs_cap` e `revs_oculto`
    maq      dict(eixos, saidas, notas, ident, cap, rotular)
    alerta   a pegadinha; aparece nos dois modos
    quiz     dict(p, o, r, frase) — a checagem, só no passo a passo

Duas armadilhas do motor, já pisadas: todo <svg> é tratado como ícone
(fill:none, stroke:currentColor), então <text> dentro de um infográfico precisa
de stroke:none; e todo <button> é inline-flex de 3rem com lábio de sombra.
"""
import io, json, os, sys

RAIZ = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

CSS = """<style>
/* ---------- lição em passos curtos ----------
   Um passo = uma ideia, um infográfico, uma checagem. O motor já mostra um
   .lesson-part por vez; aqui cada passo é um deles, e o endereço (#licao/
   lessonN) guarda onde a criança parou. */
.mic-topo{display:flex;align-items:center;gap:var(--s-3);margin-bottom:var(--s-3)}
.mic-barra{flex:1;height:6px;background:var(--risco);border-radius:999px;overflow:hidden}
.mic-barra i{display:block;height:100%;background:var(--materia);border-radius:999px}
.mic-ideia{font-size:var(--t-md);line-height:1.5;color:var(--texto-2);
  margin:0 0 var(--s-4);max-width:42ch}
.mic-ideia b{color:var(--texto)}

/* quadro do infográfico */
.mic-fig{background:var(--carta);border:2px solid var(--risco);border-radius:var(--r-g);
  padding:var(--s-4);margin:var(--s-4) 0}
.mic-fig figcaption{font-size:var(--t-xs);color:var(--texto-3);margin-top:var(--s-3);
  font-weight:600;text-align:center}
.mic-fig svg{display:block;width:100%;height:auto;max-width:34rem;margin:0 auto}

/* peças do desenho que mudam de estado */
.mic-fig .z{fill:var(--risco);stroke:none;opacity:.35;transition:opacity .25s var(--saida)}
.mic-fig .rot{stroke:var(--risco);stroke-width:2;fill:none}
.mic-fig .marca{fill:var(--materia);stroke:none;transition:transform .35s var(--saida)}
/* o motor dá stroke a todo svg, para os ícones; texto precisa desligar */
.mic-fig text{fill:var(--texto-2);stroke:none;font-family:var(--corpo);font-size:13px;font-weight:700}
.mic-fig text.forte{fill:var(--texto);font-family:var(--display);font-size:15px}
.mic-fig text.fraca{fill:var(--texto-3);font-size:12px;font-weight:600}
.mic-fig .bolha{fill:var(--carta);stroke:var(--risco);stroke-width:2}
.mic-fig .bolha.on{fill:var(--materia-clara);stroke:var(--materia)}

/* máquina de duas entradas */
.mic-maq{display:flex;align-items:center;justify-content:center;gap:var(--s-2);
  flex-wrap:wrap;margin-top:var(--s-3)}
.mic-eixo{display:flex;gap:var(--s-2);flex-wrap:wrap;justify-content:center}
.mic-eixo button{background:var(--carta);border:2px solid var(--risco);border-radius:999px;
  padding:var(--s-2) var(--s-3);font-family:var(--display);font-size:var(--t-sm);
  font-weight:600;color:var(--texto-2);cursor:pointer;transition:all .18s var(--saida)}
.mic-eixo button:hover{border-color:var(--materia);color:var(--materia)}
.mic-eixo button[aria-pressed="true"]{background:var(--materia-solida);
  border-color:var(--materia-solida);color:var(--sobre-materia)}
.mic-sinal{font-family:var(--display);font-size:var(--t-lg);color:var(--texto-3);font-weight:700}
.mic-res{display:inline-block;min-width:7rem;text-align:center;
  background:var(--materia-clara);border:2px solid var(--materia-borda);border-radius:var(--r);
  padding:var(--s-2) var(--s-4);font-family:var(--display);font-size:var(--t-lg);
  font-weight:700;color:var(--materia-forte)}
.mic-res s{opacity:.45;font-weight:600}
.mic-nota{font-size:var(--t-sm);color:var(--texto-2);text-align:center;
  margin-top:var(--s-3);min-height:1.4em;line-height:1.45}
.mic-nota b{color:var(--texto)}

/* revelar */
.mic-revs{display:grid;grid-template-columns:repeat(auto-fit,minmax(9.5rem,1fr));
  gap:var(--s-2);margin-top:var(--s-3)}
/* o motor faz de todo button um inline-flex de 3rem com lábio; aqui é cartão */
.mic-rev{display:block;min-height:0;box-shadow:none;
  background:var(--carta);border:2px solid var(--risco);border-radius:var(--r);
  padding:var(--s-3);text-align:left;cursor:pointer;font:inherit;color:var(--texto-2);
  transition:all .18s var(--saida)}
.mic-rev:hover{border-color:var(--materia)}
.mic-rev b{display:block;font-family:var(--display);font-size:var(--t-sm);
  color:var(--texto);margin-bottom:var(--s-1)}
.mic-rev i{display:block;font-style:normal;font-size:var(--t-sm);color:var(--texto-3)}
.mic-rev[aria-expanded="true"]{background:var(--materia-clara);border-color:var(--materia-borda)}
.mic-rev[aria-expanded="true"] i{color:var(--materia-forte);font-weight:700}

/* checagem */
.mic-q{background:var(--carta);border:2px solid var(--risco);border-radius:var(--r-g);
  padding:var(--s-4);margin:var(--s-4) 0}
.mic-ask{font-family:var(--display);font-size:var(--t-md);font-weight:600;
  margin:0 0 var(--s-3);color:var(--texto)}
.mic-ops{display:flex;flex-wrap:wrap;gap:var(--s-2)}
.mic-ops button{background:var(--fundo);border:2px solid var(--risco);border-radius:var(--r);
  padding:var(--s-2) var(--s-3);font-family:var(--corpo);font-size:var(--t-sm);
  font-weight:700;color:var(--texto);cursor:pointer;transition:all .18s var(--saida)}
.mic-ops button:hover:not([data-feito]){border-color:var(--materia)}
.mic-ops button.certo{background:var(--certo-claro);border-color:var(--certo);color:var(--texto)}
.mic-ops button.errado{background:var(--errado-claro);border-color:var(--errado);color:var(--texto)}
/* a mesma mecânica dentro de uma frase: tocar a palavra */
.mic-ops.frase{gap:var(--s-1);align-items:baseline}
.mic-ops.frase button{border-color:transparent;background:none;box-shadow:none;
  min-height:0;padding:var(--s-1) var(--s-2);font-size:var(--t-md);font-weight:600}
.mic-ops.frase button:hover:not([data-feito]){background:var(--materia-clara)}
.mic-fb{margin:var(--s-3) 0 0;font-size:var(--t-sm);line-height:1.5;color:var(--texto-2)}
.mic-fb b{color:var(--texto)}

/* alternar entre os dois modos */
.mic-modo{min-height:0;box-shadow:none;padding:var(--s-1) var(--s-3);
  background:none;border:2px solid var(--risco);border-radius:999px;
  font-family:var(--display);font-size:var(--t-xs);font-weight:600;
  color:var(--texto-3);white-space:nowrap}
.mic-modo:hover{border-color:var(--materia);color:var(--materia)}

/* modo resumo: tudo numa página, para reler na véspera */
.mic-secao{font-family:var(--display);font-size:var(--t-lg);font-weight:700;
  color:var(--materia);margin:var(--s-6) 0 var(--s-3);
  padding-bottom:var(--s-2);border-bottom:2px solid var(--risco)}
.mic-bloco{margin:var(--s-4) 0 var(--s-5)}
.mic-titulo{display:flex;width:100%;min-height:0;box-shadow:none;
  justify-content:space-between;align-items:baseline;gap:var(--s-3);
  background:none;border:0;border-radius:0;padding:0 0 var(--s-1);
  font-family:var(--display);font-size:var(--t-md);font-weight:700;
  color:var(--texto);text-align:left}
.mic-titulo span{font-size:var(--t-xs);font-weight:600;color:var(--texto-3);
  opacity:0;transition:opacity .18s var(--saida)}
.mic-titulo:hover{color:var(--materia)}
.mic-titulo:hover span,.mic-titulo:focus-visible span{opacity:1}
.mic-regra{margin:0 0 var(--s-3);font-size:var(--t-sm);line-height:1.5;
  color:var(--texto-2);max-width:60ch}
.mic-regra b{color:var(--texto)}
.mic-bloco .content-grid{margin:var(--s-3) 0}
.mic-bloco .mini{padding:var(--s-3)}
.mic-bloco .example{margin:var(--s-2) 0;font-weight:600}

/* rodapé do passo */
.mic-nav{display:flex;align-items:center;gap:var(--s-2);flex-wrap:wrap;margin-top:var(--s-5)}
.mic-nav .cresce{flex:1}
.mic-treinar{background:var(--materia-solida);color:var(--sobre-materia);border:2px solid var(--materia-solida)}
.mic-treinar:hover{filter:brightness(1.08);color:var(--sobre-materia)}
@media(max-width:34rem){
  .mic-maq{gap:var(--s-1)} .mic-res{min-width:5.5rem;font-size:var(--t-md)}
  .mic-nav .cresce{flex-basis:100%;order:9}
}
</style>"""


# Aspas simples em todo o JS: SVG e HTML entram
# em strings, e aspas duplas ja quebraram o script inteiro uma vez.
JS = """<script>
/* ---------- lição em passos curtos ----------
   Três mecânicas, todas por delegação, todas guiadas por data-*:
     escolher  tocar a opção certa (serve também para tocar a palavra na frase)
     revelar   tocar para abrir a resposta
     maquina   dois eixos de escolha que compõem um resultado
   Nada aqui depende do motor; o motor só mostra um .lesson-part por vez. */
(function(){
  'use strict';

  function mostrar(el){ if(el) el.hidden = false; }

  function aoEscolher(botao, caixa){
    if(botao.dataset.feito) return;
    var certo = botao.dataset.ok === '1';
    var ops = caixa.querySelectorAll('.mic-ops button');
    for(var i=0;i<ops.length;i++){
      ops[i].dataset.feito = '1';
      if(ops[i].dataset.ok === '1') ops[i].classList.add('certo');
    }
    if(!certo) botao.classList.add('errado');
    mostrar(caixa.querySelector('.mic-fb'));
    try{
      if(certo && typeof arpejo === 'function') arpejo([523,659,784]);
      else if(!certo && typeof nota === 'function') nota(196,0.18,0.045);
    }catch(e){}
  }

  function aoRevelar(botao){
    var aberto = botao.getAttribute('aria-expanded') === 'true';
    botao.setAttribute('aria-expanded', aberto ? 'false' : 'true');
    var alvo = botao.querySelector('i');
    if(alvo) alvo.textContent = aberto ? (botao.dataset.oculto || '\\u00b7 \\u00b7 \\u00b7')
                                       : botao.dataset.resp;
  }

  function aoCompor(botao, maq){
    var eixo = botao.parentNode;
    var irmaos = eixo.querySelectorAll('button');
    for(var i=0;i<irmaos.length;i++) irmaos[i].setAttribute('aria-pressed','false');
    botao.setAttribute('aria-pressed','true');
    atualizar(maq);
  }

  function atualizar(maq){
    var eixos = maq.querySelectorAll('.mic-eixo');
    var partes = [];
    for(var i=0;i<eixos.length;i++){
      var m = eixos[i].querySelector('button[aria-pressed=\\'true\\']');
      if(!m) return;
      partes.push(m.dataset.v);
    }
    var chave = partes.join('|');
    var saida = JSON.parse(maq.dataset.out || '{}');
    var notas = JSON.parse(maq.dataset.nota || '{}');
    var res = maq.querySelector('.mic-res');
    if(res) res.innerHTML = saida[chave] || '\\u2014';
    var nota = maq.parentNode.querySelector('.mic-nota');
    if(nota) nota.innerHTML = notas[chave] || '';
    var fig = maq.dataset.fig ? document.getElementById(maq.dataset.fig) : null;
    if(fig) fig.setAttribute('data-estado', partes[0]);
  }

  document.addEventListener('click', function(ev){
    var botao = ev.target.closest ? ev.target.closest('button') : null;
    if(!botao) return;
    var caixa = botao.closest('[data-mic=\\'escolher\\']');
    if(caixa && botao.closest('.mic-ops')){ aoEscolher(botao, caixa); return; }
    if(botao.classList.contains('mic-rev')){ aoRevelar(botao); return; }
    var maq = botao.closest('.mic-maq');
    if(maq && botao.dataset.v !== undefined){ aoCompor(botao, maq); return; }
  });

  /* Onde a criança parou. Microlearning só funciona se der para voltar. */
  var CHAVE = '%CHAVE%';
  function marcar(){
    var m = /#licao\\/lesson(\\d+)/.exec(location.hash || '');
    if(m){ try{ localStorage.setItem(CHAVE, m[1]); }catch(e){} }
    var volta = document.getElementById('micVoltar');
    if(!volta) return;
    var salvo = 0;
    try{ salvo = parseInt(localStorage.getItem(CHAVE) || '0', 10); }catch(e){}
    var noPrimeiro = !m || m[1] === '1';
    volta.hidden = !(noPrimeiro && salvo > 1);
    if(!volta.hidden){
      volta.textContent = 'Continuar do passo ' + salvo + ' \\u2192';
      volta.onclick = function(){ openLesson('lesson' + salvo); };
    }
  }
  addEventListener('hashchange', marcar);
  if(document.readyState === 'loading') addEventListener('DOMContentLoaded', marcar);
  else marcar();

  /* Estado inicial de cada máquina, para nenhum passo abrir vazio. */
  function iniciar(){
    var maqs = document.querySelectorAll('.mic-maq');
    for(var i=0;i<maqs.length;i++) atualizar(maqs[i]);
  }
  if(document.readyState === 'loading') addEventListener('DOMContentLoaded', iniciar);
  else iniciar();
})();
</script>"""



def _attr(d):
    return json.dumps(d, ensure_ascii=False).replace('"', "&quot;")

def fig(svg, legenda=""):
    cap = '<figcaption>%s</figcaption>' % legenda if legenda else ""
    return '<figure class="mic-fig">%s%s</figure>' % (svg, cap)

def maquina(eixos, saidas, notas=None, sinais=("+",), ident=None, legenda=""):
    """Dois (ou um) eixos de escolha que compõem um resultado."""
    p = ['<div class="mic-maq" data-out="%s" data-nota="%s"%s>'
         % (_attr(saidas), _attr(notas or {}),
            ' data-fig="%s"' % ident if ident else "")]
    for i, eixo in enumerate(eixos):
        if i:
            p.append('<span class="mic-sinal">%s</span>'
                     % (sinais[i-1] if i-1 < len(sinais) else "+"))
        p.append('<div class="mic-eixo">')
        for j, (v, rot) in enumerate(eixo):
            p.append('<button type="button" data-v="%s" aria-pressed="%s">%s</button>'
                     % (v, "true" if j == 0 else "false", rot))
        p.append('</div>')
    p.append('<span class="mic-sinal">=</span><output class="mic-res">—</output></div>')
    p.append('<p class="mic-nota"></p>')
    corpo = "".join(p)
    cap = '<figcaption>%s</figcaption>' % legenda if legenda else ""
    return '<figure class="mic-fig">%s%s</figure>' % (corpo, cap)

def revelar(itens, legenda="", oculto="toque para ver"):
    p = ['<div class="mic-revs">']
    for titulo, resposta in itens:
        p.append('<button type="button" class="mic-rev" aria-expanded="false" '
                 'data-resp="%s" data-oculto="%s"><b>%s</b><i>%s</i></button>'
                 % (resposta, oculto, titulo, oculto))
    p.append('</div>')
    cap = '<figcaption>%s</figcaption>' % legenda if legenda else ""
    return '<figure class="mic-fig">%s%s</figure>' % ("".join(p), cap)

_giro = [0]

def checar(pergunta, opcoes, retorno, frase=False):
    """opcoes: lista de (texto, certa?). `frase` desenha como palavras soltas.

    A certa gira de posição a cada passo. Escrevi os catorze passos com a certa
    sempre em primeiro e só vi na tela: é o mesmo viés que o build mede no banco
    de questões, reproduzido à mão na lição.
    """
    if not frase:
        opcoes = list(opcoes)
        i = next(k for k, (_, ok) in enumerate(opcoes) if ok)
        certa = opcoes.pop(i)
        alvo = _giro[0] % (len(opcoes) + 1)
        opcoes.insert(alvo, certa)
        _giro[0] += 1
    p = ['<div class="mic-q" data-mic="escolher"><p class="mic-ask">%s</p>' % pergunta]
    p.append('<div class="mic-ops%s">' % (" frase" if frase else ""))
    for texto, ok in opcoes:
        p.append('<button type="button"%s>%s</button>'
                 % (' data-ok="1"' if ok else "", texto))
    p.append('</div><p class="mic-fb" hidden>%s</p></div>' % retorno)
    return "".join(p)

# ---------------------------------------------------------------- desenhos
def svg_linha(ident, marcas, rotulos, titulo):
    """Uma linha com três pontos que acendem conforme o estado."""
    css = "".join('#%s[data-estado="%s"] .p%d{fill:var(--materia);r:11}'
                  % (ident, m, i+1) for i, m in enumerate(marcas))
    css += "".join('#%s[data-estado="%s"] .t%d{fill:var(--texto);font-weight:800}'
                   % (ident, m, i+1) for i, m in enumerate(marcas))
    xs = (80, 240, 400)
    p = ['<svg id="%s" data-estado="%s" viewBox="0 0 480 104" role="img" '
         'aria-label="%s"><style>%s</style>' % (ident, marcas[0], titulo, css)]
    p.append('<path class="rot" d="M40 52h400"/>')
    p.append('<path class="rot" d="m432 46 8 6-8 6"/>')
    for i, (x, rot) in enumerate(zip(xs, rotulos)):
        p.append('<circle class="p%d" cx="%d" cy="52" r="7" fill="var(--risco)"/>' % (i+1, x))
        p.append('<text class="t%d" x="%d" y="30" text-anchor="middle">%s</text>'
                 % (i+1, x, rot))
    p.append('<text class="fraca" x="40" y="92">antes</text>')
    p.append('<text class="fraca" x="440" y="92" text-anchor="end">depois</text>')
    p.append('</svg>')
    return "".join(p)

# ============================================================================
# OS DOIS MODOS
# ============================================================================
# Preenchido por `montar`. O ícone e o nome de cada missão, e a ordem das
# trilhas, saem do conteúdo — o resumo não inventa os seus.
NOMES, ICONE, TRILHAS = {}, {}, []


def _carregar(jogo):
    global NOMES, ICONE, TRILHAS
    d = json.load(io.open(os.path.join(RAIZ, "conteudo", jogo + "-4ano.json"),
                          encoding="utf-8"))
    NOMES = {m["id"]: m["nome"] for m in d["missoes"]}
    ICONE = {q["missao"]: q["icone"] for q in reversed(d["questoes"])}
    TRILHAS = d["trilhas"]
    return d


def alternar(para, rotulo):
    return ('<button type="button" class="mic-modo" onclick="openLesson(\'%s\')">'
            '%s</button>' % (para, rotulo))


def passo(p, i, n):
    """Modo passo a passo: uma ideia, um desenho, uma checagem."""
    corpo = []
    if p.get("fig"):
        corpo.append(fig(p["fig"], p.get("legenda", "")))
    if p.get("revs"):
        corpo.append(revelar(p["revs"], p.get("revs_cap", ""),
                             p.get("revs_oculto", "toque para ver")))
    if p.get("maq"):
        m = p["maq"]
        corpo.append(maquina(m["eixos"], m["saidas"], m.get("notas"),
                             ident=m.get("ident"), legenda=m.get("cap", "")))
    if p.get("alerta"):
        corpo.append('<div class="example warning">%s</div>' % p["alerta"])
    q = p["quiz"]
    corpo.append(checar(q["p"], q["o"], q["r"], frase=q.get("frase", False)))

    nav = []
    if i > 1:
        nav.append('<button class="secondary" onclick="openLesson(\'lesson%d\')">'
                   '← Voltar</button>' % (i - 1))
    nav.append('<button class="mic-treinar" onclick="startCategory(\'%s\')">'
               'Treinar isto agora</button>' % p["missao"])
    nav.append('<span class="cresce"></span>')
    if i < n:
        nav.append('<button class="primary" onclick="openLesson(\'lesson%d\')">'
                   'Próximo →</button>' % (i + 1))
    else:
        nav.append('<button class="gold" onclick="openCategories()">'
                   'Ir aos desafios →</button>')

    volta = ('<button type="button" id="micVoltar" class="link-btn" hidden></button>'
             if i == 1 else '')
    return ('<div id="lesson%d" class="lesson-part"><div class="lesson-card">'
            '<div class="mic-topo"><span class="lesson-tag">Passo %d de %d</span>'
            '<span class="mic-barra"><i style="width:%d%%"></i></span>%s%s</div>'
            '<h2>%s</h2><p class="mic-ideia">%s</p>%s'
            '<div class="mic-nav">%s</div></div></div>'
            % (i, i, n, round(i * 100 / n), volta,
               alternar("resumo", "Ver resumo"), p["titulo"], p["ideia"],
               "".join(corpo), "".join(nav)))


def _svg_mini(nome):
    return ('<div class="pic"><svg width="26" height="26" viewBox="0 0 24 24" '
            'aria-hidden="true" focusable="false"><use href="#i-%s"/></svg></div>'
            % nome)


def resumo(P):
    """Modo resumo: tudo numa página, para reler na véspera.

    Sai do mesmo dado dos passos. Os pares de `revs` viram cartões; as saídas
    da `maq`, uma linha de combinações; o `alerta` continua alerta.
    """
    porMissao = {p["missao"]: p for p in P}
    out = ['<div id="resumo" class="lesson-part"><div class="lesson-card">'
           '<div class="mic-topo"><span class="lesson-tag">Resumo</span>'
           '<span class="mic-barra"><i style="width:100%"></i></span>'
           + alternar("lesson1", "Ir ao passo a passo") + '</div>'
           '<h2>Gramática do 4º ano, tudo numa página</h2>'
           '<p class="mic-ideia">Os catorze conteúdos da prova, para reler de '
           'ponta a ponta. Cada título leva às questões daquele conteúdo.</p>']

    for t in TRILHAS:
        out.append('<h3 class="mic-secao">%s</h3>' % t["nome"])
        for etapa in t["etapas"]:
            if etapa in ("all", "review"):
                continue
            p = porMissao[etapa]
            out.append('<div class="mic-bloco">')
            out.append('<button type="button" class="mic-titulo" '
                       'onclick="startCategory(\'%s\')">%s<span>treinar →</span>'
                       '</button>' % (etapa, NOMES[etapa]))
            out.append('<p class="mic-regra">%s</p>' % p["ideia"])

            if p.get("revs"):
                out.append('<div class="content-grid">')
                for titulo, resposta in p["revs"]:
                    out.append('<div class="mini">%s<strong>%s</strong>'
                               '<span>%s</span></div>'
                               % (_svg_mini(ICONE[etapa]), titulo, resposta))
                out.append('</div>')

            if p.get("maq"):
                m = p["maq"]
                if len(m["eixos"]) == 1:
                    itens = ["<b>%s</b> → %s" % (rot, m["saidas"].get(v, ""))
                             for v, rot in m["eixos"][0]]
                else:
                    # Com dois eixos a linha perde o pé sem o rótulo da esquerda
                    # — "minha bola  meus livros" não diz que o dono é "eu".
                    # A contração dispensa: a saída já mostra a conta inteira.
                    itens = []
                    for v1, r1 in m["eixos"][0]:
                        linha = [m["saidas"].get(v1 + "|" + v2, "")
                                 for v2, _ in m["eixos"][1]]
                        texto = " &nbsp; ".join(x for x in linha if x)
                        if m.get("rotular", True):
                            texto = "<b>%s</b> → %s" % (r1, texto)
                        itens.append(texto)
                cola = " &nbsp;·&nbsp; " if len(m["eixos"]) == 1 else "<br>"
                out.append('<div class="example">%s</div>' % cola.join(itens))

            if p.get("alerta"):
                out.append('<div class="example warning">%s</div>' % p["alerta"])
            out.append('</div>')

    out.append('<div class="mic-nav">'
               '<button class="secondary" onclick="openLesson(\'lesson1\')">'
               '← Passo a passo</button><span class="cresce"></span>'
               '<button class="gold" onclick="openCategories()">'
               'Ir aos desafios →</button></div>')
    out.append('</div></div>')
    return "".join(out)



def montar(jogo, P):
    """Escreve jogo/<jogo>/licao.html: os passos e o resumo."""
    _carregar(jogo)
    n = len(P)
    faltam = [p["missao"] for p in P if p["missao"] not in NOMES]
    assert not faltam, "%s: passos apontam para missões que não existem: %s" % (jogo, faltam)
    saida = ['<section id="lesson" class="screen">',
             CSS.replace("%CHAVE%", jogo + "_licao_v1")]
    for i, p in enumerate(P, 1):
        saida.append(passo(p, i, n))
    saida.append(resumo(P))
    saida.append(JS.replace("%CHAVE%", jogo + "_licao_v1"))
    saida.append('</section>')
    texto = "".join(saida)
    io.open(os.path.join(RAIZ, "jogo", jogo, "licao.html"), "w",
            encoding="utf-8").write(texto)
    print("  %-12s %d passos + resumo, %d KB" % (jogo, n, len(texto) // 1024))
