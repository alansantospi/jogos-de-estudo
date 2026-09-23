# -*- coding: utf-8 -*-
"""Gera jogo/gramatica/licao.html: a lição em catorze passos curtos.

Um passo por missão. Cada um traz uma ideia só, um infográfico com que dá
para mexer, uma checagem imediata e um botão que leva direto às questões
daquela missão — aprender um minuto, praticar em seguida.

O arquivo gerado é fonte para build/montar.py, como hero.html e cartoes.html.
Editar o HTML à mão não adianta: o rebuild passa por aqui antes.

Três mecânicas dão conta dos catorze passos, todas por delegação de clique e
guiadas por data-*:  escolher, revelar, maquina.
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
  var CHAVE = 'gramatica_licao_v1';
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
def svg_fluxo():
    """Sujeito → verbo → complemento, com reto e oblíquo nos lugares."""
    return ('<svg viewBox="0 0 480 120" role="img" '
      'aria-label="Eu chamei ela: o reto é o sujeito, o oblíquo é o complemento">'
      '<rect class="bolha on" x="8" y="34" width="120" height="46" rx="12"/>'
      '<text class="forte" x="68" y="62" text-anchor="middle">EU</text>'
      '<text class="fraca" x="68" y="98" text-anchor="middle">caso reto</text>'
      '<text class="fraca" x="68" y="24" text-anchor="middle">quem faz</text>'
      '<path class="rot" d="M136 57h52"/><path class="rot" d="m181 51 8 6-8 6"/>'
      '<rect class="bolha" x="196" y="34" width="96" height="46" rx="12"/>'
      '<text class="forte" x="244" y="62" text-anchor="middle">chamei</text>'
      '<text class="fraca" x="244" y="98" text-anchor="middle">verbo</text>'
      '<path class="rot" d="M300 57h52"/><path class="rot" d="m345 51 8 6-8 6"/>'
      '<rect class="bolha on" x="360" y="34" width="112" height="46" rx="12"/>'
      '<text class="forte" x="416" y="62" text-anchor="middle">-A</text>'
      '<text class="fraca" x="416" y="98" text-anchor="middle">caso oblíquo</text>'
      '<text class="fraca" x="416" y="24" text-anchor="middle">quem recebe</text>'
      '</svg>')

def svg_distancia():
    """Régua do este/esse/aquele: onde está o objeto."""
    return ('<svg id="fgDist" data-estado="este" viewBox="0 0 480 172" role="img" '
      'aria-label="Quanto mais longe o objeto, mais muda o pronome">'
      '<style>'
      '#fgDist .obj{opacity:0}'
      '#fgDist[data-estado="este"] .o1,'
      '#fgDist[data-estado="esse"] .o2,'
      '#fgDist[data-estado="aquele"] .o3{opacity:1}'
      '#fgDist[data-estado="este"] .z1,'
      '#fgDist[data-estado="esse"] .z2,'
      '#fgDist[data-estado="aquele"] .z3{fill:var(--materia);opacity:.28}'
      '</style>'
      '<rect class="z z1" x="14" y="48" width="140" height="86" rx="14"/>'
      '<rect class="z z2" x="170" y="48" width="140" height="86" rx="14"/>'
      '<rect class="z z3" x="326" y="48" width="140" height="86" rx="14"/>'
      # três figuras
      '<circle class="rot" cx="60" cy="84" r="11"/>'
      '<path class="rot" d="M44 118a16 16 0 0 1 32 0"/>'
      '<circle class="rot" cx="216" cy="84" r="11"/>'
      '<path class="rot" d="M200 118a16 16 0 0 1 32 0"/>'
      '<path class="rot" d="M380 118V92M368 92h24l-12-18z"/>'
      '<text class="fraca" x="60" y="152" text-anchor="middle">quem fala</text>'
      '<text class="fraca" x="216" y="152" text-anchor="middle">quem ouve</text>'
      '<text class="fraca" x="380" y="152" text-anchor="middle">longe dos dois</text>'
      # o objeto, em cada zona
      '<g class="obj o1"><circle class="marca" cx="104" cy="92" r="12"/>'
      '<text class="forte" x="104" y="30" text-anchor="middle">este</text></g>'
      '<g class="obj o2"><circle class="marca" cx="260" cy="92" r="12"/>'
      '<text class="forte" x="260" y="30" text-anchor="middle">esse</text></g>'
      '<g class="obj o3"><circle class="marca" cx="424" cy="92" r="12"/>'
      '<text class="forte" x="424" y="30" text-anchor="middle">aquele</text></g>'
      '</svg>')

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

def svg_elo():
    """Duas palavras e o elo que a preposição faz."""
    return ('<svg viewBox="0 0 480 100" role="img" '
      'aria-label="A preposição liga duas palavras e cria uma relação">'
      '<rect class="bolha" x="10" y="26" width="140" height="48" rx="12"/>'
      '<text class="forte" x="80" y="55" text-anchor="middle">bicicleta</text>'
      '<rect class="bolha on" x="188" y="30" width="104" height="40" rx="20"/>'
      '<text class="forte" x="240" y="55" text-anchor="middle">de</text>'
      '<path class="rot" d="M152 50h34M294 50h34"/>'
      '<rect class="bolha" x="330" y="26" width="140" height="48" rx="12"/>'
      '<text class="forte" x="400" y="55" text-anchor="middle">alumínio</text>'
      '<text class="fraca" x="240" y="90" text-anchor="middle">a relação nasce da ligação</text>'
      '</svg>')



P = []   # (missao, titulo, ideia, corpo)

# ------------------------------------------------------------------ 1
P.append(("pessoais", "Quem faz e quem recebe",
  "O pronome do <b>caso reto</b> é quem pratica a ação. O do <b>caso oblíquo</b> "
  "é quem recebe.",
  fig(svg_fluxo(), "Eu chamei-a. Reto na frente do verbo, oblíquo atrás.")
  + revelar([("1ª singular","eu / me, mim, comigo"), ("2ª singular","tu / te, ti, contigo"),
             ("3ª singular","ele, ela / o, a, lhe, se"), ("1ª plural","nós / nos, conosco"),
             ("2ª plural","vós / vos, convosco"), ("3ª plural","eles, elas / os, as, lhes")],
            "Toque cada pessoa para ver o par reto / oblíquo.")
  + checar("Complete: «___ chamei ___ para a festa.»",
           [("Eu / a", True), ("Mim / ela", False), ("Me / ti", False), ("Eu / tu", False)],
           "<b>Eu</b> pratica (reto) e <b>-a</b> recebe (oblíquo): <i>Eu chamei-a</i>.")))

# ------------------------------------------------------------------ 2
P.append(("tratamento", "Como se fala com cada um",
  "Pronome de tratamento é o jeito respeitoso de se dirigir a alguém. "
  "<b>Você</b> é o único informal.",
  revelar([("Reis e rainhas","Vossa Majestade"), ("O Papa","Vossa Santidade"),
           ("Cardeais","Vossa Eminência"), ("Reitores","Vossa Magnificência"),
           ("Presidente, senadores","Vossa Excelência"),
           ("Príncipes, duquesas","Vossa Alteza")],
          "Toque cada pessoa para ver como se fala com ela.")
  + checar("Qual destes é usado em situação informal?",
           [("Você", True), ("Vossa Senhoria", False), ("Senhor", False),
            ("Vossa Excelência", False)],
           "Todos os outros são formais. <b>Você</b> é a exceção da regra.")))

# ------------------------------------------------------------------ 3
P.append(("possessivos", "De quem é a coisa",
  "O possessivo concorda com <b>a coisa possuída</b>, não com o dono. "
  "Troque o dono e a coisa e veja.",
  maquina([[("eu","eu"), ("tu","tu"), ("nós","nós"), ("eles","eles")],
           [("bola","a bola"), ("livros","os livros"), ("casa","a casa")]],
          {"eu|bola":"minha bola", "eu|livros":"meus livros", "eu|casa":"minha casa",
           "tu|bola":"tua bola", "tu|livros":"teus livros", "tu|casa":"tua casa",
           "nós|bola":"nossa bola", "nós|livros":"nossos livros", "nós|casa":"nossa casa",
           "eles|bola":"sua bola", "eles|livros":"seus livros", "eles|casa":"sua casa"},
          {"eu|livros":"O dono é um só, mas o possessivo foi para o <b>plural</b>: "
                       "quem manda é a coisa.",
           "nós|bola":"Vários donos, mas a bola é uma: <b>nossa</b>, no singular.",
           "eles|casa":"Eles e ela usam <b>seu, sua</b> — os mesmos da 3ª pessoa."},
          ident=None, legenda="Escolha o dono e a coisa.")
  + checar("Muitos donos, uma coisa só: como fica?",
           [("Nossa escola", True), ("Nossas escola", False), ("Nosso escola", False),
            ("Minhas escola", False)],
           "A escola é <b>uma</b> e é <b>feminina</b>, então: nossa escola.")))

# ------------------------------------------------------------------ 4
P.append(("demonstrativos", "Perto, aí, ou lá longe",
  "O demonstrativo diz <b>onde está</b> o objeto: comigo, com você, ou longe dos dois.",
  fig(svg_distancia(), "Mova o objeto e veja o pronome mudar.")
  + maquina([[("este","comigo"), ("esse","com você"), ("aquele","longe dos dois")]],
            {"este":"este, esta, isto", "esse":"esse, essa, isso",
             "aquele":"aquele, aquela, aquilo"},
            {"este":"A palavra <b>aqui</b> pede este. <i>Este documento aqui.</i>",
             "esse":"A palavra <b>aí</b> pede esse. <i>Esse caderno aí.</i>",
             "aquele":"A palavra <b>lá</b> pede aquele. <i>Aquele guarda-chuva lá.</i>"},
            ident="fgDist", legenda="Onde está o objeto?")
  + checar("«Ricardo, é seu ___ caderno aí perto da sua carteira?»",
           [("esse", True), ("este", False), ("aquele", False), ("aquilo", False)],
           "O caderno está com <b>Ricardo</b>, a pessoa com quem se fala: esse.")))

# ------------------------------------------------------------------ 5
P.append(("indefinidos", "Quando não se diz qual",
  "O indefinido substitui o substantivo de modo <b>vago</b>. Uns mudam de forma, "
  "outros não.",
  revelar([("algum, alguma","variável"), ("nenhum, nenhuns","variável"),
           ("muito, muitas","variável"), ("ninguém","invariável"),
           ("tudo","invariável"), ("nada","invariável")],
          "Toque para ver se a palavra muda de forma.", oculto="varia?")
  + checar("Em «Há poucos erros na redação», o indefinido é:",
           [("poucos", True), ("erros", False), ("redação", False), ("há", False)],
           "<b>Poucos</b> diz uma quantidade imprecisa. E varia: pouco, pouca, poucas.")))

# ------------------------------------------------------------------ 6
P.append(("interrogativos", "As palavras que perguntam",
  "O interrogativo abre a pergunta — direta ou indireta. <b>Quem</b> e <b>que</b> "
  "não mudam; <b>qual</b> e <b>quanto</b> mudam.",
  maquina([[("quem","quem"), ("que","que"), ("qual","qual"), ("quanto","quanto")]],
          {"quem":"Quem chegou?", "que":"Que horas são?",
           "qual":"Qual / quais?", "quanto":"Quanto / quantos?"},
          {"quem":"<b>Invariável</b>: nunca vira quens.",
           "que":"<b>Invariável</b>: nunca vira ques.",
           "qual":"<b>Variável</b>: qual, quais.",
           "quanto":"<b>Variável</b>: quanto, quanta, quantos, quantas."},
          legenda="Toque um pronome e veja se ele muda de forma.")
  + checar("Em «Quantos ainda não votaram?», o pronome é:",
           [("interrogativo variável", True), ("interrogativo invariável", False),
            ("indefinido invariável", False), ("demonstrativo", False)],
           "Abre pergunta, logo é interrogativo. E <b>quanto</b> varia em gênero e número.")))

# ------------------------------------------------------------------ 7
P.append(("verbo", "Ação, estado ou fenômeno",
  "O verbo indica uma <b>ação</b>, um <b>estado</b> ou um <b>fenômeno da natureza</b>. "
  "Só essas três.",
  revelar([("O feirante vendeu tudo","ação"), ("Clarita está feliz","estado"),
           ("Nevou no Sul do Brasil","fenômeno"), ("Quero dormir mais","duas ações")],
          "Toque cada frase para ver o que o verbo indica.", oculto="o que é?")
  + checar("Toque no verbo da frase.",
           [("O", False), ("feirante", False), ("vendeu", True), ("todas", False),
            ("as", False), ("verduras", False)],
           "<b>Vendeu</b> é o que o feirante fez: é ação, é verbo.", frase=True)))

# ------------------------------------------------------------------ 8
P.append(("modos", "A atitude de quem fala",
  "O modo mostra <b>como o falante encara</b> o que diz: com certeza, com dúvida, "
  "ou mandando.",
  revelar([("Estudei muito para a prova","indicativo — certeza"),
           ("Pode ser que eu estude hoje","subjuntivo — dúvida"),
           ("Se eu fosse você, estudaria","subjuntivo — hipótese"),
           ("Não sejas indisciplinado!","imperativo — ordem")],
          "Toque cada frase para ver o modo.", oculto="qual modo?")
  + checar("«Devolvam tudo, nós lhes suplicamos.» O modo é:",
           [("imperativo", True), ("indicativo", False), ("subjuntivo", False),
            ("infinitivo", False)],
           "<b>Devolvam</b> é uma ordem — ou um pedido forte. Isso é imperativo.")))

# ------------------------------------------------------------------ 9
P.append(("tempos", "Antes, agora, depois",
  "O tempo verbal diz <b>quando</b> a ação acontece em relação ao momento da fala.",
  fig(svg_linha("fgTempo", ["preterito","presente","futuro"],
                ["pretérito","presente","futuro"],
                "Linha do tempo: pretérito, presente e futuro"),
      "A fala acontece no meio da linha.")
  + maquina([[("preterito","ontem"), ("presente","hoje"), ("futuro","amanhã")]],
            {"preterito":"A diretora estava bonita.",
             "presente":"A diretora está bonita.",
             "futuro":"A diretora estará bonita."},
            {"preterito":"<b>Pretérito</b>: aconteceu antes da fala.",
             "presente":"<b>Presente</b>: acontece no momento da fala.",
             "futuro":"<b>Futuro</b>: vai acontecer depois da fala."},
            ident="fgTempo", legenda="Escolha o momento.")
  + checar("«Damião estudará a lição» está no:",
           [("futuro", True), ("presente", False), ("pretérito", False),
            ("imperativo", False)],
           "A terminação <b>-rá</b> entrega: a ação ainda vai acontecer.")))

# ------------------------------------------------------------------ 10
P.append(("conjugacao", "A terminação diz o grupo",
  "Todo verbo pertence a um de três grupos, e quem decide é a terminação do "
  "<b>infinitivo</b>.",
  maquina([[("cantar","cantar"), ("vender","vender"), ("compor","compor"),
            ("partir","partir")]],
          {"cantar":"-ar → 1ª", "vender":"-er → 2ª", "compor":"-or → 2ª",
           "partir":"-ir → 3ª"},
          {"cantar":"Termina em <b>-ar</b>: primeira conjugação.",
           "vender":"Termina em <b>-er</b>: segunda conjugação.",
           "compor":"Termina em <b>-or</b>, que também é <b>segunda</b> — é a pegadinha.",
           "partir":"Termina em <b>-ir</b>: terceira conjugação."},
          legenda="Toque um verbo no infinitivo.")
  + checar("«Compusemos uma bela canção.» Que conjugação?",
           [("segunda", True), ("primeira", False), ("terceira", False),
            ("quarta", False)],
           "Leve ao infinitivo: <b>compor</b>, terminado em -or. Segunda conjugação.")))

# ------------------------------------------------------------------ 11
P.append(("nominais", "As três formas nominais",
  "Elas falam da ação sem marcar o tempo como os outros verbos: uma antes, "
  "uma durante, uma depois.",
  fig(svg_linha("fgNom", ["infinitivo","gerundio","participio"],
                ["infinitivo", "gerúndio", "particípio"],
                "Infinitivo, gerúndio e particípio ao longo da ação"),
      "O infinitivo nem começou; o particípio já acabou.")
  + maquina([[("infinitivo","-r"), ("gerundio","-ndo"), ("participio","-do")]],
            {"infinitivo":"brincar", "gerundio":"brincando", "participio":"brincado"},
            {"infinitivo":"<b>Infinitivo</b>: o nome do verbo, sem tempo marcado.",
             "gerundio":"<b>Gerúndio</b>: a ação está acontecendo agora.",
             "participio":"<b>Particípio</b>: a ação já foi concluída."},
            ident="fgNom", legenda="Toque uma terminação.")
  + checar("«Despedidos os funcionários, nada restava.» A forma é:",
           [("particípio", True), ("gerúndio", False), ("infinitivo", False),
            ("imperativo", False)],
           "<b>Despedidos</b> termina em -dos: a ação já tinha acabado.")))

# ------------------------------------------------------------------ 12
P.append(("preposicao", "A palavra que liga",
  "A preposição é <b>invariável</b> e sozinha não quer dizer nada. O sentido "
  "nasce da ligação que ela faz.",
  fig(svg_elo(), "Sem a preposição, as duas palavras ficam soltas.")
  + revelar([("a, ante, até, após","essenciais"), ("com, contra, de, desde","essenciais"),
             ("em, entre, para, por","essenciais"), ("conforme, durante","acidentais"),
             ("exceto, mediante","acidentais"), ("segundo, não obstante","acidentais")],
            "Toque para ver se a preposição é essencial ou acidental.", oculto="qual grupo?")
  + checar("Qual destas é preposição acidental?",
           [("segundo", True), ("ante", False), ("após", False), ("desde", False)],
           "<b>Segundo</b> também é numeral e adjetivo: virou preposição, é acidental.")))

# ------------------------------------------------------------------ 13
P.append(("relacoes", "Uma preposição, muitos sentidos",
  "A mesma palavrinha <b>de</b> muda de sentido conforme o que ela liga. "
  "É o contexto que decide.",
  revelar([("os olhos de Patrícia","posse"), ("uma casa de madeira","matéria"),
           ("veio de ônibus","meio"), ("falava de política","assunto"),
           ("chorou de alegria","causa"), ("feriu-se com o martelo","instrumento")],
          "Toque cada trecho para ver a relação.", oculto="que relação?")
  + checar("Em «Parou para abastecer o carro», a relação é de:",
           [("fim", True), ("causa", False), ("meio", False), ("lugar", False)],
           "<b>Para</b> mostra a finalidade: ele parou <i>com o objetivo de</i> abastecer.")))

# ------------------------------------------------------------------ 14
P.append(("contracao", "Quando a preposição gruda",
  "Grudando na palavra seguinte, a preposição pode <b>perder um som</b> "
  "(contração) ou só se juntar (combinação).",
  maquina([[("de","de"), ("em","em"), ("a","a"), ("por","por")],
           [("o","o"), ("as","as"), ("isso","isso"), ("aquela","aquela")]],
          {"de|o":"d<s>e</s>o → <b>do</b>", "de|as":"d<s>e</s>as → <b>das</b>",
           "de|isso":"d<s>e</s>isso → <b>disso</b>",
           "de|aquela":"d<s>e</s>aquela → <b>daquela</b>",
           "em|o":"e<s>m</s>o → <b>no</b>", "em|as":"e<s>m</s>as → <b>nas</b>",
           "em|isso":"e<s>m</s>isso → <b>nisso</b>",
           "em|aquela":"e<s>m</s>aquela → <b>naquela</b>",
           "a|o":"a + o → <b>ao</b>", "a|as":"a + as → <b>às</b>",
           "a|isso":"a + isso → <b>a isso</b>", "a|aquela":"a + aquela → <b>àquela</b>",
           "por|o":"por + o → <b>pelo</b>", "por|as":"por + as → <b>pelas</b>",
           "por|isso":"por + isso → <b>por isso</b>",
           "por|aquela":"por + aquela → <b>por aquela</b>"},
          {"a|o":"Aqui <b>não se perde nada</b>: a + o = ao. Isso é combinação.",
           "a|as":"A crase marca a união: <b>às</b>.",
           "a|isso":"Com <i>isso</i> não se usa a crase — a forma correta é "
                    "<b>a isso</b>. Nem toda junção acontece.",
           "por|isso":"<b>Por</b> não gruda em isso: continuam duas palavras.",
           "por|aquela":"<b>Por</b> também não gruda aqui.",
           "de|o":"O <b>e</b> some: houve perda de fonema. Isso é contração.",
           "em|aquela":"O <b>m</b> some e vira <b>n</b>: naquela."},
          legenda="Escolha a preposição e a palavra que vem depois.")
  + checar("«Saímos daquele local.» A palavra daquele é:",
           [("de + aquele", True), ("em + aquele", False), ("a + aquele", False),
            ("por + aquele", False)],
           "<b>De</b> mais <b>aquele</b>, perdendo o e: contração.")))

# ----------------------------------------------------------------- montagem
NOMES = {m: n for m, n in [
    ("pessoais","Pronomes pessoais"), ("tratamento","Pronomes de tratamento"),
    ("possessivos","Pronomes possessivos"), ("demonstrativos","Pronomes demonstrativos"),
    ("indefinidos","Pronomes indefinidos"), ("interrogativos","Pronomes interrogativos"),
    ("verbo","O que é verbo"), ("modos","Modos verbais"), ("tempos","Tempos verbais"),
    ("conjugacao","As três conjugações"), ("nominais","Formas nominais"),
    ("preposicao","O que é preposição"), ("relacoes","Relações de sentido"),
    ("contracao","Contração e combinação")]}

n = len(P)
out = ['<section id="lesson" class="screen">', CSS]
for i, (missao, titulo, ideia, corpo) in enumerate(P, 1):
    nav = []
    if i > 1:
        nav.append('<button class="secondary" onclick="openLesson(\'lesson%d\')">'
                   '← Voltar</button>' % (i-1))
    nav.append('<button class="mic-treinar" onclick="startCategory(\'%s\')">'
               'Treinar isto agora</button>' % missao)
    nav.append('<span class="cresce"></span>')
    if i < n:
        nav.append('<button class="primary" onclick="openLesson(\'lesson%d\')">'
                   'Próximo →</button>' % (i+1))
    else:
        nav.append('<button class="gold" onclick="openCategories()">'
                   'Ir aos desafios →</button>')
    volta = ('<button type="button" id="micVoltar" class="link-btn" hidden></button>'
             if i == 1 else '')
    out.append(
      '<div id="lesson%d" class="lesson-part"><div class="lesson-card">'
      '<div class="mic-topo"><span class="lesson-tag">Passo %d de %d</span>'
      '<span class="mic-barra"><i style="width:%d%%"></i></span>%s</div>'
      '<h2>%s</h2><p class="mic-ideia">%s</p>%s'
      '<div class="mic-nav">%s</div></div></div>'
      % (i, i, n, round(i*100/n), volta, titulo, ideia, corpo, "".join(nav)))
out.append(JS)
out.append('</section>')

io.open(os.path.join(RAIZ, "jogo", "gramatica", "licao.html"), "w", encoding="utf-8").write("".join(out))
print("  licao.html: %d passos, %d KB" % (n, len("".join(out))//1024))
for i,(m,t,_,_) in enumerate(P,1):
    print("    %2d  %-16s %s" % (i, m, t))
