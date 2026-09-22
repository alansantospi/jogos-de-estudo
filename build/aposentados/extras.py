# -*- coding: utf-8 -*-
"""Botões de tema e tela cheia, e os estímulos: foguinho, palmas e festa.

O tema seguia só o sistema. Agora tem botão de três estados — sistema, claro,
escuro — gravado no aparelho e aplicado antes da primeira pintura, senão a
tela pisca na cor errada ao abrir.

Os estímulos existiam só em som. O foguinho mostra a sequência crescendo na
própria pílula; as palmas e a festa entram no fim de uma missão bem-sucedida.
Tudo respeita o botão de mudo e `prefers-reduced-motion`.
"""
import io, re, sys
sys.path.insert(0, "build")
import icons

JOGOS = ("historia.html", "artes.html", "exploradores-do-ceu.html",
         "time-travel-english.html")

# Aplicado no <head>, antes de qualquer pintura, para a tela não piscar.
CEDO = ('<script>try{var t=localStorage.getItem("tema");'
        'if(t&&t!=="sistema")document.documentElement.dataset.tema=t;}catch(e){}</script>')

BOTOES = (
  '<button id="btnTema" class="pill som-btn" onclick="alternarTema()"'
  ' aria-label="Tema: seguir o sistema"></button>'
  '<button id="btnTela" class="pill som-btn" onclick="alternarTela()"'
  ' aria-label="Tela cheia" hidden></button>'
)

JS = r'''
/* ---------- tema: sistema, claro, escuro ---------- */
const TEMAS = ["sistema", "claro", "escuro"];
const _ICONE_TEMA = {sistema: '%(tema)s', claro: '%(sol)s', escuro: '%(lua)s'};
const _ROTULO_TEMA = {sistema: "Tema: seguir o sistema",
                      claro: "Tema: claro", escuro: "Tema: escuro"};
function temaAtual(){
  try{ return localStorage.getItem("tema") || "sistema"; }catch(e){ return "sistema"; }
}
function aplicarTema(t){
  if(t === "sistema") delete document.documentElement.dataset.tema;
  else document.documentElement.dataset.tema = t;
  try{ localStorage.setItem("tema", t); }catch(e){}
  const b = document.getElementById("btnTema");
  if(b){ b.innerHTML = _ICONE_TEMA[t]; b.setAttribute("aria-label", _ROTULO_TEMA[t]); }
}
function alternarTema(){
  aplicarTema(TEMAS[(TEMAS.indexOf(temaAtual()) + 1) %% TEMAS.length]);
  if(typeof sfx !== "undefined") sfx.toque();
}

/* ---------- tela cheia ---------- */
/* O iPhone não expõe requestFullscreen em elementos: lá o botão nem aparece,
   em vez de aparecer e não fazer nada. */
function _temTelaCheia(){
  return !!(document.documentElement.requestFullscreen);
}
function alternarTela(){
  try{
    if(document.fullscreenElement) document.exitFullscreen();
    else document.documentElement.requestFullscreen();
  }catch(e){}
}
function _pintarBotaoTela(){
  const b = document.getElementById("btnTela");
  if(!b) return;
  const cheia = !!document.fullscreenElement;
  b.innerHTML = cheia ? '%(encolher)s' : '%(expandir)s';
  b.setAttribute("aria-label", cheia ? "Sair da tela cheia" : "Tela cheia");
}

/* ---------- estímulos ---------- */
/* O foguinho troca o número da pílula de sequência por chama a partir de 3:
   a criança vê a sequência crescer sem precisar ler. */
function _acenderFoguinho(n){
  const p = document.getElementById("combo");
  if(!p) return;
  const caixa = p.closest(".pill");
  if(caixa) caixa.classList.toggle("em-chamas", n >= 3);
  // `hidden` é propriedade de HTMLElement, não de SVGElement: atribuir a
  // `.hidden` num <svg> cria uma propriedade solta e deixa o atributo no DOM.
  const fogo = document.getElementById("foguinho");
  if(fogo) fogo.toggleAttribute("hidden", n < 3);
}

function _ruido(dur, corte, vol){
  /* Palmas são ruído filtrado, não nota: um estalo curto e seco. */
  if(!audioCtx || mudo) return;
  const n = Math.floor(audioCtx.sampleRate * dur);
  const buf = audioCtx.createBuffer(1, n, audioCtx.sampleRate);
  const dados = buf.getChannelData(0);
  for(let i = 0; i < n; i++) dados[i] = (Math.random() * 2 - 1) * (1 - i / n);
  const src = audioCtx.createBufferSource(); src.buffer = buf;
  const f = audioCtx.createBiquadFilter(); f.type = "bandpass";
  f.frequency.value = corte; f.Q.value = 0.8;
  const g = audioCtx.createGain(); g.gain.value = vol;
  src.connect(f).connect(g).connect(audioCtx.destination);
  src.start();
}
function palmas(){
  /* Doze palmas com intervalo irregular: regular demais vira metrônomo. */
  try{
    if(typeof ensureAudio === "function") ensureAudio();
    for(let i = 0; i < 12; i++){
      const atraso = i * 95 + Math.random() * 55;
      setTimeout(() => _ruido(0.07, 1400 + Math.random() * 900, 0.16), atraso);
    }
  }catch(e){}
}

const _CORES_FESTA = ["--materia-solida", "--alt-1", "--alt-2", "--alt-3", "--alt-4", "--certo"];
function festa(quantidade){
  if(matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  const caixa = document.getElementById("festaBox");
  if(!caixa) return;
  const n = quantidade || 44;
  for(let i = 0; i < n; i++){
    const p = document.createElement("i");
    p.className = "confete";
    p.style.left = (Math.random() * 100) + "vw";
    p.style.background = "var(" + _CORES_FESTA[i %% _CORES_FESTA.length] + ")";
    p.style.animationDelay = (Math.random() * 0.45) + "s";
    p.style.animationDuration = (1.5 + Math.random() * 1.1) + "s";
    p.style.setProperty("--giro", (Math.random() * 720 - 360) + "deg");
    p.style.setProperty("--desvio", (Math.random() * 120 - 60) + "px");
    caixa.appendChild(p);
    setTimeout(() => p.remove(), 3000);
  }
}

/* Chamado no fim da partida: festa e palmas só quando houve o que comemorar. */
function comemorar(acertos, total){
  const pct = total ? acertos / total : 0;
  if(pct >= 0.9){ festa(70); palmas(); }
  else if(pct >= 0.6){ festa(36); }
}

addEventListener("DOMContentLoaded", () => {
  aplicarTema(temaAtual());
  const b = document.getElementById("btnTela");
  if(b && _temTelaCheia()){ b.hidden = false; _pintarBotaoTela(); }
  addEventListener("fullscreenchange", _pintarBotaoTela);
});
'''

CSS = """
/* ---------- estímulos ---------- */
/* O foguinho substitui o número quando a sequência passa de três. */
.pill.em-chamas{background:color-mix(in oklch,var(--alt-2) 70%,var(--materia-solida));
  animation:pulsa-fogo 1.1s ease-in-out infinite}
.pill.em-chamas .rot{opacity:.95}
#foguinho{width:1.05rem;height:1.05rem;margin-right:2px}
@keyframes pulsa-fogo{0%,100%{transform:scale(1)}50%{transform:scale(1.06)}}
.festa{position:fixed;inset:0;pointer-events:none;z-index:30;overflow:hidden}
.confete{position:absolute;top:-14px;width:9px;height:14px;border-radius:2px;
  animation:cai linear forwards}
@keyframes cai{
  to{transform:translate(var(--desvio),105vh) rotate(var(--giro));opacity:.15}}
@media (prefers-reduced-motion:reduce){
  .pill.em-chamas{animation:none}
  .confete{display:none}
}
"""


def aplicar(arq):
    s = io.open(arq, encoding="utf-8").read()

    # 1. o tema, antes da primeira pintura
    assert s.count("</head>") == 1, arq
    s = s.replace("</head>", CEDO + "</head>", 1)

    # 2. os dois botões, ao lado do de som
    m = re.search(r'<button id="btnSom".*?</button>', s, re.S)
    assert m, "%s: nao achei o botao de som" % arq
    s = s[:m.end()] + BOTOES + s[m.end():]

    # 3. o foguinho dentro da pílula de sequência
    alvo = '<span id="combo">0</span>'
    assert s.count(alvo) == 1, arq
    s = s.replace(alvo, icons.uso("fogo", "", 17).replace("<svg", '<svg id="foguinho" hidden') + alvo)

    # 4. a camada dos confetes
    assert s.count('<div class="wrap">') == 1, arq
    s = s.replace('<div class="wrap">',
                  '<div id="festaBox" class="festa" aria-hidden="true"></div>\n<div class="wrap">', 1)

    # 5. o estilo e o script
    s = s.replace("</style>", CSS + "</style>", 1)
    corpo = JS % {"tema": icons.uso("tema", "", 20), "sol": icons.uso("sol", "", 20),
                  "lua": icons.uso("lua", "", 20), "expandir": icons.uso("expandir", "", 20),
                  "encolher": icons.uso("encolher", "", 20)}
    ancora = "</script>\n</body>" if "</script>\n</body>" in s else "</script></body>"
    assert s.count(ancora) == 1, arq
    s = s.replace(ancora, corpo + ancora)

    # 6. ligar os estímulos ao motor
    ceu = arq != "time-travel-english.html"

    # o foguinho acompanha o número da sequência, onde quer que ele seja escrito
    alvo = ("document.getElementById('combo').textContent=combo}" if ceu else
            '  const el=document.getElementById("combo");\n  if(el) el.textContent=combo;')
    assert s.count(alvo) == 1, "%s: nao achei a escrita do combo" % arq
    s = s.replace(alvo, (alvo[:-1] + ";_acenderFoguinho(combo)}") if ceu
                  else (alvo + "\n  _acenderFoguinho(combo);"))

    # a comemoração, no fim da partida
    assert s.count("function endGame(){") == 1, arq
    s = s.replace("function endGame(){",
                  "function endGame(){\n  setTimeout(() => comemorar(hits, %s), 260);"
                  % ("answered" if ceu else "answeredCount"), 1)

    io.open(arq, "w", encoding="utf-8").write(s)
    print("  %-24s tema, tela cheia e estimulos" % arq.replace(".html", ""))


for arq in JOGOS:
    aplicar(arq)
