# -*- coding: utf-8 -*-
"""Navegação: trilha de migalhas no topo e a tela guardada na URL.

Dois buracos que só pioram com o app crescendo. Não havia volta para o
índice de jogos — de dentro de Ciências, chegar em História exigia o botão
do navegador. E nenhuma tela estava na URL: o botão voltar do celular saía
do jogo em vez de recuar uma tela, recarregar jogava a criança no início, e
não dava para guardar o link de uma missão.

Agora cada tela tem endereço (`#missoes`, `#missao/moon`, `#trilha/earth`)
e as funções de navegação só escrevem esse endereço — quem age é o
roteador, ouvindo `hashchange`. Assim o botão voltar recua uma tela, e
recarregar volta para onde estava.
"""
import io, re

JOGOS = {
    "time-travel-english.html":  ("Inglês",   "lesson1"),
    "exploradores-do-ceu.html":  ("Ciências", "lesson1"),
    "historia.html":             ("História", "lesson1"),
    "artes.html":                ("Arte",     "lesson1"),
}

BARRA = '''<nav class="migalhas" aria-label="Você está em">
<a href="index.html"><svg viewBox="0 0 24 24" aria-hidden="true"><use href="#i-casa"/></svg>Jogos</a>
<span class="migalha-sep" aria-hidden="true">/</span>
<a href="#inicio">%s</a>
<span id="migalhaAqui"></span>
</nav>'''

ROTEADOR = '''
/* ---------- rotas: a tela mora na URL ---------- */
/* As funções públicas só escrevem o endereço; quem muda de tela é o
   roteador. É o que faz o botão voltar do celular recuar uma tela em vez
   de sair do jogo, e recarregar cair de volta onde estava. */
const _PRIMEIRA_LICAO = "%(licao)s";
const ROTAS = {
  inicio:  function(){ _goHome(); },
  licao:   function(a){ _openLesson(a || _PRIMEIRA_LICAO); },
  missoes: function(){ _openCategories(); },
  missao:  function(a){ a ? _startCategory(a) : _openCategories(); },
  trilha:  function(a){ a ? _startTrail(a) : _openCategories(); }
};

function irPara(r){
  // Mesmo endereço não dispara hashchange: refaz a rota (rejogar a missão).
  if(location.hash === "#" + r) rota(); else location.hash = r;
}
function rota(){
  const bruto = (location.hash || "#inicio").slice(1);
  const barra = bruto.indexOf("/");
  const tipo  = barra < 0 ? bruto : bruto.slice(0, barra);
  const arg   = barra < 0 ? ""    : decodeURIComponent(bruto.slice(barra + 1));
  (ROTAS[tipo] || ROTAS.inicio)(arg);
}
function goHome(){ irPara("inicio"); }
function openCategories(){ irPara("missoes"); }
function openLesson(id){ irPara("licao/" + id); }
function startCategory(c){ irPara("missao/" + encodeURIComponent(c)); }
function startTrail(t){ irPara("trilha/" + encodeURIComponent(t)); }
addEventListener("hashchange", rota);

/* ---------- trilha de migalhas ---------- */
const _AQUI = {lesson:"Lição", categories:"Missões", quiz:null, end:"Resultado"};
function migalhas(id){
  const el = document.getElementById("migalhaAqui");
  if(!el) return;
  let nome = _AQUI[id];
  if(id === "quiz"){
    // Na partida, a última migalha é a missão ou a trilha em curso.
    nome = activeTrail ? (trails[activeTrail] && trails[activeTrail].name)
                       : _nomeDaMissao(currentCategory);
    el.innerHTML = ' <span class="migalha-sep" aria-hidden="true">/</span> '
                 + '<a href="#missoes">Missões</a>'
                 + ' <span class="migalha-sep" aria-hidden="true">/</span> '
                 + '<b>' + (nome || "Missão") + '</b>';
    return;
  }
  el.innerHTML = nome
    ? ' <span class="migalha-sep" aria-hidden="true">/</span> <b>' + nome + '</b>'
    : "";
}
'''

# Cada motor guarda o nome legível da missão num lugar diferente.
NOME_MISSAO = {
    "time-travel-english.html": '''
function _nomeDaMissao(c){
  const m = missionMeta && missionMeta[c];
  return m ? m.title : c;
}
''',
    "_ceu": '''
function _nomeDaMissao(c){ return (typeof nomes !== "undefined" && nomes[c]) || c; }
''',
}

RENOMEAR = ["goHome", "openCategories", "openLesson", "startCategory", "startTrail"]


def aplicar(arq):
    rotulo, licao = JOGOS[arq]
    s = io.open(arq, encoding="utf-8").read()

    # 1. as implementações passam a ter nome interno
    for f in RENOMEAR:
        padrao = r"\bfunction\s+%s\s*\(" % f
        n = len(re.findall(padrao, s))
        assert n == 1, "%s: %s definida %d vez(es)" % (arq, f, n)
        s = re.sub(padrao, "function _%s(" % f, s)

    # 2. a barra, logo antes do conteúdo
    ancora_barra = '<div class="wrap">'
    assert s.count(ancora_barra) == 1, "%s: nao achei .wrap" % arq
    s = s.replace(ancora_barra, BARRA % rotulo + "\n" + ancora_barra, 1)

    # 3. o roteador e as migalhas, no fim do script principal
    corpo = ROTEADOR % {"licao": licao}
    corpo += NOME_MISSAO.get(arq, NOME_MISSAO["_ceu"])
    ancora = "</script>\n</body>" if "</script>\n</body>" in s else "</script></body>"
    assert s.count(ancora) == 1, "%s: nao achei o fim do script" % arq
    s = s.replace(ancora, corpo +
                  "\nif(document.readyState !== 'loading') rota();"
                  "\nelse addEventListener('DOMContentLoaded', rota);\n" + ancora)

    # 4. o motor de inglês apagava o hash a cada troca de tela — com a tela
    #    morando na URL, isso desliga o botão voltar.
    limpa = """  // Remove qualquer alvo CSS (#categories) para evitar que a tela de categorias
  // continue visível atrás/antes do desafio no mobile.
  // Em file:// o replaceState pode lancar. O fallback antigo era location.hash="",
  // que em alguns navegadores Android recarrega a pagina e zera a partida
  // justamente ao iniciar a missao. Falhar aqui e inofensivo: ignoramos.
  try{
    history.replaceState(null,"",location.pathname+location.search);
  }catch(e){}

"""
    curta = ('  try{ history.replaceState(null,"",'
             'location.pathname+location.search); }catch(e){}\n')
    achou = 0
    for t in (limpa, curta):
        if t in s:
            s = s.replace(t, ""); achou += 1
    if arq == "time-travel-english.html":
        assert achou == 2, "%s: esperava 2 limpezas de hash, achei %d" % (arq, achou)
    assert "replaceState" not in s, "%s: sobrou replaceState" % arq

    # 5. show() atualiza as migalhas
    padrao = r"(function show\(id\)\{)"
    assert len(re.findall(padrao, s)) == 1, arq
    s = re.sub(r"(function show\(id\)\{)", r"\1migalhas(id);", s, count=1)

    io.open(arq, "w", encoding="utf-8").write(s)
    print("  %-24s rotas + migalhas" % arq.replace(".html", ""))


for arq in JOGOS:
    aplicar(arq)
