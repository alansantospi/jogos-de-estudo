/* ---------- mascote ----------
   Uma bolinha que reage à partida: sorri no acerto, faz "ops" no erro e
   pega fogo na sequência. É enfeite: sem o elemento, nada acontece, e o
   jogo nunca quebra por causa dela. Os sons chamam `mascote`, então toda
   forma de questão reage sem cada uma precisar lembrar. */
const _FALAS = {
  oi:    ["Vamos lá!", "Bora!", "Estou com você!"],
  feliz: ["Isso!", "Boa!", "Acertou!", "Mandou bem!", "Show!"],
  fogo:  ["Pegando fogo!", "Ninguém segura!", "Que sequência!", "Uau!"],
  ops:   ["Quase!", "Ops!", "A próxima vem!", "Errar faz parte."]
};
let _mascoteT = 0, _mascoteFogo = false;

function _poeMascote(){
  const quiz = document.getElementById("quiz");
  if(!quiz || document.getElementById("mascote")) return;
  let topo = quiz.querySelector(".quiz-top");
  if(!topo){ topo = document.createElement("div"); topo.className = "quiz-top"; quiz.prepend(topo); }
  const m = document.createElement("div");
  m.className = "mascote-linha";
  m.innerHTML = '<p id="mascoteFala" class="mascote-fala"></p>' + _MASCOTE_SVG;
  topo.appendChild(m);
  _vestir(m.querySelector("svg"));
}

/* Os acessórios dependem das figurinhas do perfil: vão num atributo à
   parte, para a troca de cara (que reescreve a classe) não tirá-los. */
function _figurinhasAgora(){
  try{ return figurinhasDe(_historicoDoPerfil()).length; }catch(e){ return 0; }
}
function _vestir(svg, nivel){
  if(!svg) return;
  const n = _figurinhasAgora();
  svg.setAttribute("data-nivel", nivel === undefined ? nivelDoMascote(n) : nivel);
  svg.setAttribute("data-bicho", bichoEscolhido(n));
}
addEventListener("DOMContentLoaded", _poeMascote);

function mascote(estado){
  try{
    const m = document.getElementById("mascote"); if(!m) return;
    const f = document.getElementById("mascoteFala");
    if(estado === "fogo") _mascoteFogo = true;
    else if(estado === "ops" || estado === "oi") _mascoteFogo = false;
    const fogo = _mascoteFogo ? " em-fogo" : "";
    m.setAttribute("class", "mascote " + estado + fogo);
    void m.getBoundingClientRect();        // reinicia o pulo se ainda estava pulando
    m.classList.add("pula");
    const l = _FALAS[estado];
    if(f && l){
      f.textContent = l[Math.floor(Math.random() * l.length)];
      f.classList.remove("on"); void f.offsetWidth; f.classList.add("on");
    }
    clearTimeout(_mascoteT);
    _mascoteT = setTimeout(() => {
      m.setAttribute("class", "mascote" + fogo);
      if(f) f.classList.remove("on");
    }, 1700);
  }catch(e){}
}

/* ---------- novidades do fim da partida ----------
   Dias seguidos e figurinha nova, na tela de fim, embaixo da frase. */
function _plim(quando){
  if(typeof nota !== "function") return;
  [1319, 1760, 2637].forEach((f, i) => nota(f, 0.2, 0.02, "sine", quando + i * 0.07));
}

function mostrarNovidades(nov){
  try{
    let el = document.getElementById("novidades");
    if(!el){
      const ref = document.getElementById("endText"); if(!ref) return;
      el = document.createElement("div");
      el.id = "novidades"; el.className = "novidades";
      ref.insertAdjacentElement("afterend", el);
    }
    const dias = nov && nov.diasSubiu && nov.dias >= 2;
    if(!nov || (!dias && !nov.novas.length)){ el.hidden = true; el.innerHTML = ""; return; }
    const ic = n => '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><use href="#i-' + n + '"/></svg>';
    let h = "";
    if(dias)
      h += '<div class="novidade dias">' + ic("fogo") + "<span><b>" + nov.dias
        + " dias seguidos!</b> Sequência garantida hoje. Amanhã ela vira " + (nov.dias + 1) + "!</span></div>";
    const album = '<a href="index.html#album">Ver o álbum</a>';
    if(nov.novas.length === 1){
      const f = nov.novas[0];
      h += '<div class="novidade fig"><span class="fig-ic">' + ic(f.ic) + "</span><span><small>Figurinha nova</small><b>"
        + f.nome + "</b>" + f.desc + ". " + album + "</span></div>";
    }else if(nov.novas.length){
      // Várias de uma vez (a primeira partida costuma dar algumas): um cartão
      // só, com as figurinhas lado a lado, em vez de uma pilha de cartões.
      h += '<div class="novidade fig varias"><div><small>Figurinhas novas</small><b>' + nov.novas.length
        + " de uma vez!</b></div><ul>" + nov.novas.map(f => '<li title="' + f.desc + '"><span class="fig-ic">'
        + ic(f.ic) + "</span>" + f.nome + "</li>").join("") + "</ul>" + album + "</div>";
    }
    if(nov.novas.length){
      const n1 = _figurinhasAgora(), n0 = n1 - nov.novas.length, v1 = nivelDoMascote(n1);
      BICHOS.filter(b => b.min > n0 && b.min <= n1).forEach(b => {
        h += '<div class="novidade fig acessorio">' + bichoSvg("bichoNovo-" + b.id, b.id, v1, "feliz")
          + "<span><small>Bichinho novo</small><b>" + b.nome + " liberado!</b>"
          + '<a href="index.html#album">Escolher no álbum</a></span></div>';
      });
      if(v1 > nivelDoMascote(n0)){
        h += '<div class="novidade fig acessorio">' + bichoSvg("mascoteNovo", bichoEscolhido(n1), v1, "feliz")
          + "<span><small>Seu bichinho evoluiu</small><b>Ganhou " + ACESSORIOS[v1 - 1].nome + "!</b>"
          + "Agora ele aparece assim em todos os jogos.</span></div>";
        _vestir(document.getElementById("mascote"), v1);
      }
    }
    el.innerHTML = h; el.hidden = false;
    if(nov.novas.length) _plim(2.2);       // depois da fanfarra
  }catch(e){}
}

/* ---------- o próximo passo, na tela de fim ----------
   No fim da partida a vontade de jogar é a maior; uma lista de missões para
   escolher a desperdiça. O botão principal sugere uma coisa só:
   - na trilha: tentar de novo se perdeu, senão a próxima trilha por fazer;
   - sem estrela (perdeu as vidas): tentar de novo;
   - com 1 ou 2 estrelas: buscar as 3;
   - com 3: a próxima missão, na ordem, que ainda não tem 90%.
   `p.ordem` é a ordem das missões, `p.titulos` os nomes delas e `p.melhor(id)` o melhor acerto. */
function proximoPasso(p){
  if(p.trilha){
    if(p.perdeu) return {texto: "Tentar a trilha de novo", ir: () => startTrail(p.trilha)};
    const t = (p.trilhas || []).find(x => !x.feita && x.id !== p.trilha);
    if(t) return {texto: "Próxima trilha: " + t.nome, ir: () => startTrail(t.id)};
    return {texto: "Jogar a trilha de novo", ir: () => startTrail(p.trilha)};
  }
  if(!p.estrelas) return {texto: "Tentar de novo", ir: () => startCategory(p.atual)};
  if(p.estrelas < 3 && p.atual !== "review")
    return {texto: "Tentar 3 estrelas", ir: () => startCategory(p.atual)};
  const i = p.ordem.indexOf(p.atual);
  const resto = i < 0 ? p.ordem : p.ordem.slice(i + 1).concat(p.ordem.slice(0, i));
  const prox = resto.find(c => p.melhor(c) < 90);
  if(prox) return {texto: "Próxima: " + (p.titulos[prox] || prox), ir: () => startCategory(prox)};
  return {texto: "Jogar de novo", ir: () => startCategory(p.atual)};
}
function pintarProximo(p){
  try{
    const b = document.getElementById("btnProximo"); if(!b) return;
    const r = proximoPasso(p);
    b.textContent = r.texto + " →";
    b.onclick = r.ir;
    if(_avisoDoDesafio() && !p.trilha){
      b.textContent = "Pronto para o Desafio? →";
      b.onclick = () => { setPracticeMode(false); startCategory(p.atual); };
    }
    const l = _FALAS_FIM[p.estrelas] || _FALAS_FIM[0];
    mascoteParado(document.querySelector("#end .result"), "Fim",
      p.estrelas >= 3 ? "fogo" : p.estrelas ? "feliz" : "ops", l[Math.floor(Math.random() * l.length)]);
  }catch(e){}
}

/* ---------- tela de entrada do jogo ----------
   Um caminho principal só, decidido pelo que a criança já fez:
   - nunca jogou e o jogo tem lição: a lição é o botão principal, e não há
     placar de zeros ("0/91" assusta quem chega);
   - já jogou (ou não há lição): "Jogar: <próxima trilha por fazer>", e a
     lição vira secundária;
   - todas as trilhas feitas: revisar os erros, ou escolher um desafio.
   "Ir aos desafios" é sempre secundário, e "apagar progresso" desce para o
   pé da tela, longe do polegar. As telas de entrada são escritas à mão em
   cada jogo; mexer aqui, na hora, vale para todas. */
function pintarEntrada(p){
  try{
    const inicio = document.getElementById("start");
    const hero = inicio && inicio.querySelector(".hero"); if(!hero) return;
    const stats = document.getElementById("startStats"); if(stats) stats.hidden = !p.jogou;
    const desafios = hero.querySelector('[onclick^="openCategories"]');
    const fila = desafios && desafios.parentElement; if(!fila) return;
    desafios.classList.remove("gold", "primary"); desafios.classList.add("secondary");
    fila.classList.add("acoes-entrada");
    const licoes = [...fila.querySelectorAll('[onclick^="openLesson"]')];
    let b = document.getElementById("btnComecar");
    if(!b){
      b = document.createElement("button");
      b.id = "btnComecar"; b.type = "button"; b.className = "gold";
      fila.prepend(b);
    }
    const apagar = hero.querySelector('[onclick^="resetProgress"]');
    if(apagar && apagar.parentElement !== inicio.lastElementChild){
      apagar.parentElement.classList.add("zona-apagar");
      inicio.appendChild(apagar.parentElement);
    }
    mascoteParado(hero, "Entrada", "oi", _falaDaEntrada(p.jogou));
    if(!p.jogou && licoes.length){
      b.hidden = true;
      licoes.forEach((l, i) => { l.classList.toggle("primary", !i); l.classList.toggle("secondary", !!i); });
      return;
    }
    licoes.forEach(l => { l.classList.remove("primary"); l.classList.add("secondary"); });
    b.hidden = false;
    const t = (p.trilhas || []).find(x => !x.feita);
    if(t){ b.textContent = "Jogar: " + t.nome + " →"; b.onclick = () => startTrail(t.id); }
    else if(p.fracos){ b.textContent = "Revisar meus erros →"; b.onclick = () => startCategory("review"); }
    else { b.textContent = "Escolher um desafio →"; b.onclick = () => openCategories(); }
  }catch(e){}
}
// A primeira contagem da tela de entrada roda antes deste script existir:
// redesenha quando a página termina de carregar.
addEventListener("DOMContentLoaded", () => {
  try{
    if(typeof renderStats === "function") renderStats();
    else if(typeof renderStartStats === "function") renderStartStats();
  }catch(e){}
});

/* ---------- mascote parado: entrada e fim ----------
   O mesmo bichinho da partida, nos dois momentos fortes: chegar ao jogo e
   ver o resultado. Fica à esquerda, com o balão à direita. */
function mascoteParado(onde, sufixo, estado, fala){
  try{
    if(!onde) return;
    let linha = onde.querySelector(".mascote-linha.parado");
    if(!linha){
      linha = document.createElement("div");
      linha.className = "mascote-linha parado";
      linha.innerHTML = '<p class="mascote-fala on"></p>'
        + _MASCOTE_SVG.replace('id="mascote"', 'id="mascote' + sufixo + '"');
      onde.prepend(linha);
    }
    _vestir(linha.querySelector("svg"));
    const m = linha.querySelector("svg");
    m.setAttribute("class", "mascote " + estado + (estado === "fogo" ? " em-fogo" : "") + " pula");
    linha.querySelector(".mascote-fala").textContent = fala;
  }catch(e){}
}

function _historicoDoPerfil(){
  try{
    const p = typeof perfilAtual === "function" ? perfilAtual() : null;
    return JSON.parse(localStorage.getItem(HIST_CHAVE + (p ? ":" + p.id : "")) || "[]");
  }catch(e){ return []; }
}

function _falaDaEntrada(jogou){
  if(!jogou) return "Oi! Vamos começar?";
  const d = diasSeguidos(_historicoDoPerfil());
  if(d.jogouHoje && d.atual >= 2) return "Já são " + d.atual + " dias seguidos!";
  if(!d.jogouHoje && d.atual >= 1) return "Bora manter a sequência?";
  return "Que bom te ver de novo!";
}

const _FALAS_FIM = {
  3: ["Uau! Três estrelas!", "Você é demais!", "Perfeito!"],
  2: ["Quase as três!", "Tá voando!", "Boa!"],
  1: ["Missão cumprida!", "Cada vez melhor!", "Valeu o esforço!"],
  0: ["Tudo bem, bora de novo?", "Errar faz parte!", "Na próxima vai!"]
};

/* ---------- desafio que se destrava ----------
   O Desafio (com vidas, e o único que vale recorde) não é escolha para quem
   acabou de chegar: abre depois de 2 estrelas (70%) em alguma missão. Quem
   já tinha escolhido o Desafio continua com ele. */
function desafioAberto(prog){
  return !!prog && (prog.practice === false
    || Object.values(prog.missions || {}).some(m => m && m.melhorAcc >= 70));
}
function pintarDesafio(prog){
  try{
    const b = document.querySelector('.mode-opt[data-mode="desafio"]'); if(!b) return;
    const aberto = desafioAberto(prog);
    b.disabled = !aberto;
    b.classList.toggle("trancado", !aberto);
    const s = b.querySelector("small");
    if(s) s.textContent = aberto ? "5 vidas · vale recorde" : "abre com 2 estrelas";
    b.title = aberto ? "" : "Consiga 2 estrelas numa missão do Treino para abrir o Desafio";
  }catch(e){}
}

/* Na primeira tela de fim em que o Desafio está aberto e a criança ainda
   não foi avisada: aviso na lista de novidades e o botão principal convida. */
function _avisoDoDesafio(){
  const prog = typeof progress !== "undefined" ? progress : null;
  if(!prog || prog.avisoDesafio || !desafioAberto(prog)) return false;
  prog.avisoDesafio = true;
  if(typeof saveProgress === "function") saveProgress();
  if(prog.practice === false) return false;          // já estava no Desafio
  let el = document.getElementById("novidades");
  if(!el){
    const ref = document.getElementById("endText"); if(!ref) return false;
    el = document.createElement("div"); el.id = "novidades"; el.className = "novidades";
    ref.insertAdjacentElement("afterend", el);
  }
  el.insertAdjacentHTML("afterbegin", '<div class="novidade fig"><span class="fig-ic">'
    + '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><use href="#i-raio"/></svg></span>'
    + "<span><small>Destravado</small><b>Modo Desafio!</b>Com 5 vidas, e é o que vale recorde.</span></div>");
  el.hidden = false;
  return true;
}

/* ---------- avançar sozinho na sequência ----------
   Com 3 ou mais acertos seguidos a partida segue sozinha, para não quebrar
   o ritmo; tocar em "Próxima" adianta. Fora da sequência e no erro, espera:
   a explicação é para ser lida. */
let _avancoT = 0;
function avancarSozinho(posicao, proxima){
  clearTimeout(_avancoT);
  const era = posicao();
  _avancoT = setTimeout(() => {
    const q = document.getElementById("quiz"), b = document.getElementById("nextBtn");
    if(posicao() !== era || !q || !q.classList.contains("active") || !b || b.style.display === "none") return;
    proxima();
  }, 1600);
}

/* ---------- a última questão vale dobro ----------
   Um fecho com tensão: a partida termina numa questão que vale mais, avisada
   antes. Só a última da partida inteira (na trilha, a da última etapa). */
function questaoFinal(){
  try{
    if(typeof questions === "undefined" || questions.length < 5 || index !== questions.length - 1) return false;
    if(typeof activeTrail !== "undefined" && activeTrail && trailStep < trails[activeTrail].steps.length - 1) return false;
    return true;
  }catch(e){ return false; }
}
function marcarFinal(){
  try{
    const topo = document.querySelector("#quiz .quiz-top"); if(!topo) return;
    let a = topo.querySelector(".final-aviso");
    const sim = questaoFinal();
    if(!sim){ if(a) a.remove(); return; }
    if(a) return;
    a = document.createElement("span");
    a.className = "final-aviso";
    a.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><use href="#i-estrela"/></svg>Última questão · vale dobro!';
    topo.insertBefore(a, topo.querySelector(".mascote-linha"));
    const f = document.getElementById("mascoteFala");
    if(f){
      f.textContent = "Capricha nessa!";
      f.classList.remove("on"); void f.offsetWidth; f.classList.add("on");
      clearTimeout(_mascoteT);
      _mascoteT = setTimeout(() => f.classList.remove("on"), 1700);
    }
    if(typeof sfx !== "undefined" && sfx.etapa) sfx.etapa();
  }catch(e){}
}
