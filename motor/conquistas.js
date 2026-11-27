/* ---------- dias seguidos e figurinhas ----------
   Tudo sai do histórico de partidas (jogos_historico_v1:<perfil>), que já é
   do perfil e já vai para a conta: não há nada novo a guardar nem a
   sincronizar, e o que a criança ganhou num aparelho aparece no outro.
   Funções puras: recebem a lista e o agora, para o teste não depender do
   relógio. Uma linha do histórico: {q: quando, j: jogo, m: missão,
   a: acertos, n: respondidas, p: pontos, c: melhor sequência}. */

// Dia do calendário local como número inteiro: meia-noite local dividida
// por um dia. O arredondamento absorve o fuso e o horário de verão.
function diaDe(q){
  const d = new Date(q);
  return Math.round(new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime() / 864e5);
}

/* atual: quantos dias seguidos até hoje (ou até ontem, se ainda não jogou
   hoje: a sequência só se perde quando o dia acaba). melhor: a maior que
   já houve. */
function diasSeguidos(hist, agora){
  const dias = new Set((hist || []).map(x => diaDe(x.q)));
  const hoje = diaDe(agora === undefined ? Date.now() : agora);
  const jogouHoje = dias.has(hoje);
  let atual = 0;
  for(let d = jogouHoje ? hoje : hoje - 1; dias.has(d); d--) atual++;
  let melhor = 0;
  dias.forEach(d => {
    if(dias.has(d - 1)) return;            // só conta a partir do começo de cada sequência
    let n = 0; while(dias.has(d + n)) n++;
    if(n > melhor) melhor = n;
  });
  return {atual, melhor, jogouHoje};
}

/* A ordem é a do álbum: das fáceis às difíceis. `ic` é um desenho do sprite;
   `cor`, o degradê do fundo; `raridade`, a moldura (comum, rara = prata,
   épica = ouro, lendária = holográfica). */
const FIGURINHAS = [
  {id: "primeira",   nome: "Primeiro passo",   ic: "bandeira",   desc: "Terminar a primeira partida",
   raridade: "comum", cor: ["#5eead4", "#0d9488"],
   tem: e => e.partidas >= 1},
  {id: "tres",       nome: "Três estrelas",    ic: "estrela",    desc: "90% ou mais numa partida de 5 questões",
   raridade: "rara", cor: ["#fde047", "#f59e0b"],
   tem: e => e.tresEstrelas},
  {id: "seq5",       nome: "Em chamas",        ic: "fogo",       desc: "Acertar 5 seguidas",
   raridade: "comum", cor: ["#fdba74", "#ea580c"],
   tem: e => e.combo >= 5},
  {id: "dez",        nome: "Dez partidas",     ic: "alvo",       desc: "Terminar 10 partidas",
   raridade: "comum", cor: ["#93c5fd", "#2563eb"],
   tem: e => e.partidas >= 10},
  {id: "dias3",      nome: "Três dias",        ic: "calendario", desc: "Jogar 3 dias seguidos",
   raridade: "rara", cor: ["#c4b5fd", "#7c3aed"],
   tem: e => e.dias >= 3},
  {id: "explorador", nome: "Explorador",       ic: "bussola",    desc: "Jogar 3 jogos diferentes",
   raridade: "comum", cor: ["#86efac", "#16a34a"],
   tem: e => e.jogos >= 3},
  {id: "gabarito",   nome: "Gabaritou",        ic: "coroa",      desc: "100% numa partida de 5 questões",
   raridade: "epica", cor: ["#f9a8d4", "#db2777"],
   tem: e => e.perfeita},
  {id: "seq10",      nome: "Relâmpago",        ic: "raio",       desc: "Acertar 10 seguidas",
   raridade: "epica", cor: ["#67e8f9", "#4f46e5"],
   tem: e => e.combo >= 10},
  {id: "maratona",   nome: "Maratona",         ic: "relogio",    desc: "5 partidas no mesmo dia",
   raridade: "rara", cor: ["#fca5a5", "#dc2626"],
   tem: e => e.noMesmoDia >= 5},
  {id: "mil",        nome: "Mil pontos",       ic: "planeta",    desc: "Somar 1000 pontos",
   raridade: "rara", cor: ["#a5b4fc", "#4338ca"],
   tem: e => e.pontos >= 1000},
  {id: "dias7",      nome: "Uma semana",       ic: "foguete",    desc: "Jogar 7 dias seguidos",
   raridade: "lendaria", cor: ["#fda4af", "#7c3aed"],
   tem: e => e.dias >= 7},
  {id: "cinquenta",  nome: "Cinquenta",        ic: "trofeu",     desc: "Terminar 50 partidas",
   raridade: "lendaria", cor: ["#fde68a", "#d97706"],
   tem: e => e.partidas >= 50}
];

function _estatisticas(hist){
  const h = hist || [];
  const porDia = {};
  h.forEach(x => { const d = diaDe(x.q); porDia[d] = (porDia[d] || 0) + 1; });
  const cheia = x => x.n >= 5;
  return {
    partidas: h.length,
    tresEstrelas: h.some(x => cheia(x) && x.a / x.n >= 0.9),
    perfeita: h.some(x => cheia(x) && x.a === x.n),
    combo: h.reduce((m, x) => Math.max(m, x.c || 0), 0),
    jogos: new Set(h.map(x => x.j)).size,
    noMesmoDia: Object.values(porDia).reduce((m, n) => Math.max(m, n), 0),
    pontos: h.reduce((s, x) => s + (x.p || 0), 0),
    dias: diasSeguidos(h, h.length ? h[h.length - 1].q : 0).melhor
  };
}

// Os ids das figurinhas que este histórico já ganhou, na ordem do álbum.
function figurinhasDe(hist){
  const e = _estatisticas(hist);
  return FIGURINHAS.filter(f => f.tem(e)).map(f => f.id);
}

/* O que a última partida trouxe de novo: compara o histórico sem ela e com
   ela. `diasSubiu` só quando esta foi a primeira partida do dia. */
function novidadesDa(antes, depois, agora){
  const tinha = new Set(figurinhasDe(antes)), tem = new Set(figurinhasDe(depois));
  const novas = FIGURINHAS.filter(f => !tinha.has(f.id) && tem.has(f.id));
  const d0 = diasSeguidos(antes, agora), d1 = diasSeguidos(depois, agora);
  return {novas, dias: d1.atual, diasSubiu: !d0.jogouHoje && d1.jogouHoje};
}

/* ---------- o mascote evolui com o álbum ----------
   A cada tantas figurinhas o bichinho ganha um acessório, que fica com ele
   em todos os jogos. É o progresso de longo prazo que se vê sem abrir nada. */
const ACESSORIOS = [
  {min: 3,  id: "chapeu",  nome: "um chapéu de festa"},
  {min: 6,  id: "medalha", nome: "uma medalha"},
  {min: 9,  id: "coroa",   nome: "uma coroa"},
  {min: 12, id: "brilho",  nome: "um brilho dourado"}
];
// Quantos acessórios já tem, com n figurinhas (0 a 4).
function nivelDoMascote(n){ return ACESSORIOS.filter(a => n >= a.min).length; }

/* ---------- a figurinha desenhada ----------
   Igual no álbum e na tela de fim: moldura branca recortada, fundo com raios
   na cor dela, o desenho grande e o selo da raridade. A que falta mostra só
   a silhueta. `extra` vai no pé (no álbum, a descrição). */
const RARIDADE_NOME = {comum: "Comum", rara: "Rara", epica: "Épica", lendaria: "Lendária"};
function figurinhaHtml(f, ganha, extra){
  const ic = '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><use href="#i-' + f.ic + '"/></svg>';
  if(!ganha) return '<div class="fig fig-falta"><span class="fig-arte">' + ic + "</span><b>?</b>" + (extra || "") + "</div>";
  return '<div class="fig r-' + f.raridade + '" style="--c1:' + f.cor[0] + ";--c2:" + f.cor[1] + '">'
    + '<span class="fig-arte">' + ic + "</span><b>" + f.nome + "</b><small>" + RARIDADE_NOME[f.raridade] + "</small>"
    + (extra || "") + "</div>";
}
