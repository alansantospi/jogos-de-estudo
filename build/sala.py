# -*- coding: utf-8 -*-
"""Sala em rede: um aparelho vira telão, os outros entram por um código.

No espírito do Kahoot: o telão mostra a pergunta e o cronômetro, e cada
jogador só vê os botões A/B/C/D no próprio celular. Quem acerta mais rápido
leva mais ponto.

A conexão é direta entre os aparelhos, por WebRTC (PeerJS). Não há servidor
para manter nem conta para criar — só um intermediário público para os
aparelhos se acharem. Em compensação **este modo exige internet**, ao
contrário do resto do jogo, que roda do arquivo baixado; a tela diz isso.

O código da sala tem quatro dígitos e o identificador é compartilhado com
qualquer pessoa no mundo que use a mesma biblioteca. Para um quiz de
família o risco é um estranho entrar numa sala; não trafega nada além de
nome, letra escolhida e pontos.
"""
import io, re, sys
sys.path.insert(0, "build")
import icons

JOGOS = {
    "historia.html": "hist",
    "artes.html": "arte",
    "exploradores-do-ceu.html": "cien",
    "time-travel-english.html": "ing",
}

TELA = '''
<section id="sala" class="screen">
  <div class="hero">
    <h2>Jogar com outras pessoas</h2>
    <p>Um aparelho vira o telão e mostra as perguntas. Os outros entram pelo
    código e respondem no próprio celular. <b>Este modo precisa de internet.</b></p>
  </div>

  <div id="salaEscolha" class="sala-escolha">
    <button type="button" class="primary" onclick="criarSala()">%(icone_telao)s Ser o telão</button>
    <button type="button" class="ghost" onclick="mostrarEntrada()">%(icone_entrar)s Entrar numa sala</button>
    <button type="button" class="ghost" onclick="goHome()">Voltar ao início</button>
  </div>

  <div id="salaEntrada" class="sala-caixa" hidden>
    <label class="sala-campo"><span>Código da sala</span>
      <input id="salaCodigo" type="text" inputmode="numeric" maxlength="4"
             autocomplete="off" placeholder="0000"></label>
    <label class="sala-campo"><span>Seu nome</span>
      <input id="salaNome" type="text" maxlength="12" autocomplete="off"
             placeholder="Anne"></label>
    <button type="button" class="primary" onclick="entrarSala()">Entrar</button>
    <button type="button" class="ghost" onclick="voltarEscolha()">Voltar</button>
  </div>

  <div id="salaAnfitriao" class="sala-caixa" hidden>
    <div class="sala-codigo"><span class="rot">Código da sala</span>
      <strong id="salaCodigoTela">----</strong></div>
    <p id="salaDica" class="sala-dica">Abra o mesmo endereço no celular de cada
    jogador, toque em <b>Entrar numa sala</b> e digite o código.</p>
    <div id="salaJogadores" class="sala-jogadores"></div>
    <label class="sala-campo"><span>Missão</span>
      <select id="salaMissao"></select></label>
    <button type="button" id="salaComecar" class="primary" onclick="comecarSala()" disabled>
      Começar</button>
    <button type="button" class="ghost" onclick="fecharSala()">Encerrar sala</button>
  </div>

  <div id="salaJogo" class="sala-caixa" hidden>
    <div class="sala-topo"><span id="salaProgresso"></span>
      <span id="salaTempo" class="sala-tempo">20</span></div>
    <div id="salaPergunta" class="question"></div>
    <div id="salaOpcoes" class="answers"></div>
    <div id="salaPlacar" class="sala-placar"></div>
  </div>

  <div id="salaJogador" class="sala-caixa" hidden>
    <div id="salaEstado" class="sala-estado">Esperando o telão começar...</div>
    <div id="salaBotoes" class="answers sala-botoes"></div>
    <div id="salaMeuPlacar" class="sala-placar"></div>
  </div>
</section>
'''

CSS = """
/* ---------- sala em rede ---------- */
.sala-escolha{display:grid;gap:var(--s-3);max-width:24rem}
.sala-caixa{display:grid;gap:var(--s-4);max-width:32rem;
  background:var(--carta);border:2px solid var(--risco);border-radius:var(--r-g);
  padding:var(--s-5);box-shadow:0 var(--labio) 0 var(--risco)}
.sala-campo{display:grid;gap:var(--s-1);font-size:var(--t-sm);font-weight:700;color:var(--texto-2)}
.sala-campo input,.sala-campo select{
  min-height:3rem;padding:var(--s-2) var(--s-3);
  background:var(--fundo);color:var(--texto);
  border:2px solid var(--risco);border-radius:var(--r);
  font-family:var(--corpo);font-size:var(--t-md);font-weight:700;-webkit-appearance:none}
.sala-campo input:focus-visible,.sala-campo select:focus-visible{
  outline:3px solid var(--materia);outline-offset:2px}
#salaCodigo{font-family:var(--display);font-size:var(--t-2xl);letter-spacing:.35em;text-align:center}
.sala-codigo{display:grid;gap:2px;justify-items:center;padding:var(--s-4);
  background:var(--materia-clara);border-radius:var(--r)}
.sala-codigo strong{font-family:var(--display);font-size:var(--t-3xl);
  letter-spacing:.3em;color:var(--materia-forte);font-variant-numeric:tabular-nums}
.sala-dica{margin:0;font-size:var(--t-sm);color:var(--texto-2)}
.sala-jogadores{display:flex;flex-wrap:wrap;gap:var(--s-2);min-height:2.5rem}
.sala-jogador{display:inline-flex;align-items:center;gap:var(--s-1);
  background:var(--materia-clara);color:var(--materia-forte);
  border-radius:999px;padding:var(--s-1) var(--s-3);
  font-family:var(--display);font-weight:600;font-size:var(--t-sm)}
.sala-topo{display:flex;justify-content:space-between;align-items:center;
  font-size:var(--t-sm);font-weight:700;color:var(--texto-2)}
.sala-tempo{font-family:var(--display);font-size:var(--t-2xl);color:var(--materia-forte);
  font-variant-numeric:tabular-nums}
.sala-tempo.urgente{color:var(--errado-solida);animation:pulsa-fogo .7s ease-in-out infinite}
.sala-placar{display:grid;gap:var(--s-2)}
.sala-linha{display:grid;grid-template-columns:1.5rem 1fr auto auto;gap:var(--s-3);
  align-items:center;padding:var(--s-2) var(--s-3);
  background:var(--fundo);border-radius:var(--r);font-weight:700}
.sala-linha b{font-family:var(--display)}
.sala-linha .ganho{color:var(--certo-solida);font-variant-numeric:tabular-nums}
.sala-linha.errou .ganho{color:var(--texto-3)}
.sala-estado{font-family:var(--display);font-size:var(--t-xl);text-align:center;
  padding:var(--s-5) 0}
.sala-botoes .answer{min-height:5.5rem;justify-content:center;font-size:var(--t-xl)}
.sala-botoes .answer .letra{width:3rem;height:3rem;font-size:var(--t-xl)}
.sala-botoes .answer.escolhida{border-color:var(--materia);box-shadow:0 0 0 3px var(--materia-borda)}
@media(max-width:44rem){ .sala-caixa{padding:var(--s-4)} }
"""

JS = r'''
/* ---------- sala em rede ---------- */
/* WebRTC direto entre os aparelhos: nenhum servidor nosso no meio. O único
   intermediário é o broker público do PeerJS, e só para eles se acharem. */
const SALA_PREFIXO = "jogosdeestudo-%(slug)s-";
const SALA_PRAZO = 20000;       // por pergunta
const SALA_MAX = 8;
const SALA_LIB = "https://cdnjs.cloudflare.com/ajax/libs/peerjs/1.5.4/peerjs.min.js";

let _peer = null, _souTelao = false, _conexoes = [], _conAnfitriao = null;
let _jogadores = new Map();     // id -> {nome, pontos, respondeu, con}
let _perguntas = [], _iPergunta = -1, _tInicio = 0, _relogio = null;

function _tela(id){
  ["salaEscolha","salaEntrada","salaAnfitriao","salaJogo","salaJogador"]
    .forEach(x => { const e = document.getElementById(x); if(e) e.hidden = x !== id; });
}
function mostrarEntrada(){ _tela("salaEntrada"); }
function voltarEscolha(){ _tela("salaEscolha"); }

function _carregarPeer(){
  if(window.Peer) return Promise.resolve();
  return new Promise((ok, falha) => {
    const s = document.createElement("script");
    s.src = SALA_LIB;
    s.onload = ok;
    s.onerror = () => falha(new Error("sem rede"));
    document.head.appendChild(s);
  });
}

function _avisoSala(txt){
  const e = document.getElementById("salaEstado");
  if(e) e.textContent = txt;
  showAchievement ? showAchievement(txt) : null;
}

/* ---------- lado do telão ---------- */
async function criarSala(){
  _tela("salaAnfitriao");
  document.getElementById("salaCodigoTela").textContent = "....";
  try{ await _carregarPeer(); }
  catch(e){
    document.getElementById("salaCodigoTela").textContent = "!";
    document.getElementById("salaDica").innerHTML =
      "<b>Sem internet.</b> Este modo precisa de conexão; o resto do jogo funciona offline.";
    return;
  }
  _souTelao = true;
  _montarMissoes();
  _tentarCodigo(0);
}

function _tentarCodigo(tentativa){
  if(tentativa > 5){
    document.getElementById("salaDica").textContent =
      "Não consegui abrir uma sala agora. Tente de novo em alguns segundos.";
    return;
  }
  const codigo = String(Math.floor(1000 + Math.random() * 9000));
  if(_peer) try{ _peer.destroy(); }catch(e){}
  _peer = new Peer(SALA_PREFIXO + codigo);
  _peer.on("open", () => {
    document.getElementById("salaCodigoTela").textContent = codigo;
    location.hash = "sala/" + codigo;
  });
  // Código já em uso (ou por outra família): sorteia outro.
  _peer.on("error", err => {
    if(err && err.type === "unavailable-id") _tentarCodigo(tentativa + 1);
  });
  _peer.on("connection", con => {
    con.on("data", d => _doJogador(con, d));
    con.on("close", () => { _jogadores.delete(con.peer); _pintarJogadores(); });
  });
}

function _doJogador(con, d){
  if(d.t === "entrar"){
    if(_iPergunta >= 0){ con.send({t: "recusado", motivo: "A partida já começou."}); return; }
    if(_jogadores.size >= SALA_MAX){ con.send({t: "recusado", motivo: "A sala está cheia."}); return; }
    _jogadores.set(con.peer, {nome: (d.nome || "Jogador").slice(0, 12), pontos: 0, con});
    con.send({t: "aceito"});
    _pintarJogadores();
    if(typeof sfx !== "undefined") sfx.toque();
  }
  if(d.t === "resposta"){
    const j = _jogadores.get(con.peer);
    if(!j || j.respondeu || d.i !== _iPergunta) return;
    j.respondeu = true;
    const q = _perguntas[_iPergunta];
    const certo = d.escolha === q.answer;
    // Fórmula do Kahoot: acertar vale 1000, e a demora come até metade.
    j.ganho = certo ? Math.max(1, Math.round(1000 * (1 - (d.ms / SALA_PRAZO) / 2))) : 0;
    j.pontos += j.ganho;
    con.send({t: "recebido", certo});
    if([..._jogadores.values()].every(x => x.respondeu)) _fecharPergunta();
  }
}

function _pintarJogadores(){
  const c = document.getElementById("salaJogadores");
  c.innerHTML = [..._jogadores.values()]
    .map(j => '<span class="sala-jogador">' + _escapar(j.nome) + "</span>").join("")
    || '<span class="sala-dica">Ninguém entrou ainda.</span>';
  document.getElementById("salaComecar").disabled = _jogadores.size === 0;
}
function _escapar(t){
  return String(t).replace(/[&<>"]/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]));
}
function _enviarTodos(m){ _jogadores.forEach(j => { try{ j.con.send(m); }catch(e){} }); }

function _montarMissoes(){
  const sel = document.getElementById("salaMissao");
  sel.innerHTML = "";
  _catalogoMissoes().forEach(([id, nome]) => {
    const o = document.createElement("option");
    o.value = id; o.textContent = nome; sel.appendChild(o);
  });
}

function comecarSala(){
  const cat = document.getElementById("salaMissao").value;
  _perguntas = _perguntasSala(cat).filter(q => q.choices && q.answer != null).slice(0, 10);
  if(!_perguntas.length){ _avisoSala("Essa missão não tem perguntas de escolha."); return; }
  _iPergunta = -1;
  _tela("salaJogo");
  _proximaPergunta();
}

function _proximaPergunta(){
  _iPergunta++;
  if(_iPergunta >= _perguntas.length) return _fimSala();
  const q = _perguntas[_iPergunta];
  _jogadores.forEach(j => { j.respondeu = false; j.ganho = 0; });
  document.getElementById("salaProgresso").textContent =
    "Pergunta " + (_iPergunta + 1) + " de " + _perguntas.length;
  document.getElementById("salaPergunta").textContent = q.q;
  document.getElementById("salaOpcoes").innerHTML = q.choices.map((c, i) =>
    '<div class="answer"><span class="letra">' + FORMAS[i %% 4] + "</span><span>"
    + _escapar(c) + "</span></div>").join("");
  document.getElementById("salaPlacar").innerHTML = "";
  _enviarTodos({t: "pergunta", i: _iPergunta, n: q.choices.length, prazo: SALA_PRAZO});
  _tInicio = Date.now();
  _contar();
}

function _contar(){
  clearInterval(_relogio);
  const el = document.getElementById("salaTempo");
  const tique = () => {
    const resta = Math.max(0, SALA_PRAZO - (Date.now() - _tInicio));
    el.textContent = Math.ceil(resta / 1000);
    el.classList.toggle("urgente", resta <= 5000);
    if(resta <= 0) _fecharPergunta();
  };
  tique();
  _relogio = setInterval(tique, 250);
}

function _fecharPergunta(){
  clearInterval(_relogio);
  const q = _perguntas[_iPergunta];
  document.getElementById("salaOpcoes").querySelectorAll(".answer")
    .forEach((e, i) => e.classList.add(i === q.answer ? "correct" : "wrong"));
  const ordem = [..._jogadores.values()].sort((a, b) => b.pontos - a.pontos);
  document.getElementById("salaPlacar").innerHTML = ordem.map((j, i) =>
    '<div class="sala-linha' + (j.ganho ? "" : " errou") + '"><span>' + (i + 1)
    + "</span><b>" + _escapar(j.nome) + "</b><span class=\"ganho\">+" + (j.ganho || 0)
    + "</span><span>" + j.pontos + "</span></div>").join("");
  _enviarTodos({t: "resultado", certa: q.answer,
                placar: ordem.map(j => ({nome: j.nome, pontos: j.pontos, ganho: j.ganho || 0}))});
  if(typeof sfx !== "undefined") sfx.etapa();
  setTimeout(_proximaPergunta, 4000);
}

function _fimSala(){
  const ordem = [..._jogadores.values()].sort((a, b) => b.pontos - a.pontos);
  document.getElementById("salaProgresso").textContent = "Fim!";
  document.getElementById("salaTempo").textContent = "";
  document.getElementById("salaPergunta").textContent =
    ordem.length ? ordem[0].nome + " venceu!" : "Fim da partida";
  document.getElementById("salaOpcoes").innerHTML = "";
  _enviarTodos({t: "fim", placar: ordem.map(j => ({nome: j.nome, pontos: j.pontos}))});
  if(typeof festa === "function"){ festa(80); palmas(); }
}

function fecharSala(){
  clearInterval(_relogio);
  _enviarTodos({t: "encerrada"});
  try{ _peer && _peer.destroy(); }catch(e){}
  _peer = null; _souTelao = false; _jogadores.clear(); _iPergunta = -1;
  goHome();
}

/* ---------- lado do jogador ---------- */
async function entrarSala(){
  const codigo = (document.getElementById("salaCodigo").value || "").replace(/\D/g, "");
  const nome = (document.getElementById("salaNome").value || "").trim() || "Jogador";
  if(codigo.length !== 4){ showAchievement("O código tem 4 números."); return; }
  _tela("salaJogador");
  _avisoSala("Conectando...");
  try{ await _carregarPeer(); }
  catch(e){ _avisoSala("Sem internet. Este modo precisa de conexão."); return; }
  _peer = new Peer();
  _peer.on("open", () => {
    _conAnfitriao = _peer.connect(SALA_PREFIXO + codigo);
    _conAnfitriao.on("open", () => _conAnfitriao.send({t: "entrar", nome}));
    _conAnfitriao.on("data", d => _doTelao(d));
    _conAnfitriao.on("close", () => _avisoSala("O telão encerrou a sala."));
  });
  _peer.on("error", () => _avisoSala("Não achei essa sala. Confira o código."));
}

function _doTelao(d){
  const estado = document.getElementById("salaEstado");
  const botoes = document.getElementById("salaBotoes");
  const placar = document.getElementById("salaMeuPlacar");
  if(d.t === "aceito"){ _avisoSala("Você entrou! Esperando começar..."); }
  if(d.t === "recusado"){ _avisoSala(d.motivo); }
  if(d.t === "pergunta"){
    placar.innerHTML = "";
    estado.textContent = "Responda!";
    botoes.innerHTML = "";
    const t0 = Date.now();
    for(let i = 0; i < d.n; i++){
      const b = document.createElement("button");
      b.type = "button"; b.className = "answer";
      b.innerHTML = '<span class="letra">' + FORMAS[i %% 4] + "</span>";
      b.setAttribute("aria-label", "Alternativa " + FORMAS[i %% 4]);
      b.onclick = () => {
        botoes.querySelectorAll(".answer").forEach(x => { x.disabled = true; });
        b.classList.add("escolhida");
        estado.textContent = "Resposta enviada!";
        _conAnfitriao.send({t: "resposta", i: d.i, escolha: i, ms: Date.now() - t0});
        if(typeof sfx !== "undefined") sfx.toque();
      };
      botoes.appendChild(b);
    }
  }
  if(d.t === "recebido"){
    estado.textContent = d.certo ? "Acertou!" : "Dessa vez não.";
    if(typeof sfx !== "undefined") d.certo ? sfx.acerto() : sfx.erro();
  }
  if(d.t === "resultado" || d.t === "fim"){
    botoes.innerHTML = "";
    if(d.t === "fim"){
      estado.textContent = d.placar.length ? d.placar[0].nome + " venceu!" : "Fim";
      if(typeof festa === "function") festa(50);
    }
    placar.innerHTML = d.placar.map((j, i) =>
      '<div class="sala-linha"><span>' + (i + 1) + "</span><b>" + _escapar(j.nome)
      + '</b><span class="ganho">' + (j.ganho ? "+" + j.ganho : "") + "</span><span>"
      + j.pontos + "</span></div>").join("");
  }
  if(d.t === "encerrada"){ _avisoSala("O telão encerrou a sala."); }
}

/* ---------- entrada pela rota ---------- */
function abrirSala(codigo){
  show("sala");
  _tela(_souTelao ? "salaAnfitriao" : "salaEscolha");
  if(codigo && !_souTelao){
    mostrarEntrada();
    document.getElementById("salaCodigo").value = codigo;
  }
}
ROTAS.sala = abrirSala;
'''

# Cada motor guarda missões e perguntas de um jeito; a sala fala com os dois
# por estas duas funções.
ADAPTADOR = {
 "ceu": """
function _catalogoMissoes(){
  return Object.keys(nomes).filter(c => c !== "review").map(c => [c, nomes[c]]);
}
function _perguntasSala(cat){ return makeQuestions(cat, 10); }
""",
 "ing": """
function _catalogoMissoes(){
  return Object.keys(missionMeta).filter(c => c !== "review")
         .map(c => [c, missionMeta[c].title]);
}
function _perguntasSala(cat){
  const qs = cat === "all" ? (buildQuestionPool(), questions.slice())
                           : buildCategoryPool(cat);
  return shuffle(qs).slice(0, 10);
}
""",
}

BOTAO = ('<button type="button" class="ghost sala-abrir" onclick="irPara(\'sala\')">'
         '%(icone)s Jogar com outras pessoas</button>')


def aplicar(arq, slug):
    s = io.open(arq, encoding="utf-8").read()

    # a tela nova, ao lado das outras
    m = re.search(r'<section id="end"[^>]*>', s)
    assert m, "%s: nao achei a tela de fim" % arq
    tela = TELA % {"icone_telao": icons.uso("tv", "", 20),
                   "icone_entrar": icons.uso("celular", "", 20)}
    s = s[:m.start()] + tela + s[m.start():]

    # o convite, na tela inicial, junto dos outros botões
    m = re.search(r'<button[^>]*onclick="(?:openCategories|irPara\(\'missoes\'\))\(\)"[^>]*>.*?</button>', s, re.S)
    if not m:
        m = re.search(r'<button[^>]*onclick="openCategories\(\)".*?</button>', s, re.S)
    assert m, "%s: nao achei o botao de desafios" % arq
    s = s[:m.end()] + BOTAO % {"icone": icons.uso("pessoas", "", 20)} + s[m.end():]

    s = s.replace("</style>", CSS + "</style>", 1)

    ancora = "</script>\n</body>" if "</script>\n</body>" in s else "</script></body>"
    assert s.count(ancora) == 1, arq
    motor = "ing" if arq == "time-travel-english.html" else "ceu"
    s = s.replace(ancora, (JS % {"slug": slug}) + ADAPTADOR[motor] + ancora)

    io.open(arq, "w", encoding="utf-8").write(s)
    print("  %-24s sala em rede" % arq.replace(".html", ""))


for arq, slug in JOGOS.items():
    aplicar(arq, slug)
