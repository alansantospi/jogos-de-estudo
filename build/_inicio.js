/* ---------- perfis ---------- */
const PERFIS_CHAVE = "jogos_perfis_v1";
const PERFIL_ATUAL = "jogos_perfil_atual";
const HIST_CHAVE = "jogos_historico_v1";
const CORES_PERFIL = ["--alt-1", "--alt-2", "--alt-3", "--alt-4"];
const BASES = {ing: "ttg_progress_v1", cien: "sky_progress_v1",
               hist: "historia_progress_v1", arte: "artes_progress_v1"};
const MATERIA = {ing: "Inglês", cien: "Ciências", hist: "História", arte: "Arte"};
const PAGINA = {ing: "time-travel-english.html", cien: "exploradores-do-ceu.html",
                hist: "historia.html", arte: "artes.html"};

const ler = k => { try { return JSON.parse(localStorage.getItem(k)); } catch(e) { return null; } };
const gravar = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch(e) {} };

function lerPerfis(){ return ler(PERFIS_CHAVE) || []; }
function perfilAtual(){
  const l = lerPerfis(); if(!l.length) return null;
  let id; try{ id = localStorage.getItem(PERFIL_ATUAL); }catch(e){}
  return l.find(p => p.id === id) || l[0];
}
function trocarPerfil(id){ try{ localStorage.setItem(PERFIL_ATUAL, id); }catch(e){} desenhar(); }
function inicialDe(n){ return (n || "?").trim().charAt(0).toUpperCase(); }
function criarPerfil(nome){
  const l = lerPerfis();
  const p = {id: "p" + Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
             nome: String(nome).trim().slice(0, 16) || "Aluno",
             cor: CORES_PERFIL[l.length % CORES_PERFIL.length], criado: Date.now()};
  l.push(p); gravar(PERFIS_CHAVE, l); trocarPerfil(p.id); return p;
}
function adicionarPerfil(){
  const c = document.getElementById("novoNome");
  if(!c.value.trim()) return c.focus();
  criarPerfil(c.value); c.value = ""; ir("jogos");
}
function renomearPerfil(id){
  const l = lerPerfis(); const p = l.find(x => x.id === id);
  if(!p) return;
  const novo = prompt("Nome do aluno:", p.nome);
  if(novo === null) return;
  p.nome = String(novo).trim().slice(0, 16) || p.nome;
  gravar(PERFIS_CHAVE, l); desenhar();
}
/* Apagar não destrói: guarda na lixeira. Meses de estudo não podem sumir
   atrás de um clique e um "ok" — foi exatamente o que aconteceu uma vez. */
const LIXO_CHAVE = "jogos_lixeira_v1";
const LIXO_DIAS = 60;

function apagarPerfil(id){
  const p = lerPerfis().find(x => x.id === id);
  if(!p) return;
  const resumo = _quantoTem(id);
  const pergunta = "Apagar o perfil de " + p.nome + "?\n\n" + resumo
    + "\n\nFica na lixeira por " + LIXO_DIAS + " dias e dá para trazer de volta."
    + "\n\nPara confirmar, escreva o nome do aluno:";
  const digitado = prompt(pergunta, "");
  if(digitado === null) return;
  if(digitado.trim().toLowerCase() !== p.nome.trim().toLowerCase()){
    alert("O nome não confere. Nada foi apagado.");
    return;
  }
  const guardado = {};
  try{
    Object.values(BASES).forEach(b => {
      const v = localStorage.getItem(b + ":" + id);
      if(v !== null){ guardado[b + ":" + id] = v; localStorage.removeItem(b + ":" + id); }
    });
    const h = localStorage.getItem(HIST_CHAVE + ":" + id);
    if(h !== null){ guardado[HIST_CHAVE + ":" + id] = h; localStorage.removeItem(HIST_CHAVE + ":" + id); }
    const lixo = (ler(LIXO_CHAVE) || [])
      .filter(l => Date.now() - l.quando < LIXO_DIAS * 864e5);
    lixo.push({id, nome: p.nome, cor: p.cor, quando: Date.now(), dados: guardado});
    gravar(LIXO_CHAVE, lixo);
  }catch(e){}
  gravar(PERFIS_CHAVE, lerPerfis().filter(x => x.id !== id));
  desenhar();
}

/* Diz em português o que se perde, antes de perguntar. */
function _quantoTem(id){
  let missoes = 0, questoes = 0;
  Object.values(BASES).forEach(b => {
    const p = ler(b + ":" + id);
    if(!p) return;
    missoes += Object.values(p.missions || {}).filter(m => m && m.concluidas).length;
    questoes += Object.keys(p.items || {}).length;
  });
  const partidas = (ler(HIST_CHAVE + ":" + id) || []).length;
  const partes = [];
  if(missoes) partes.push(missoes + (missoes === 1 ? " missão concluída" : " missões concluídas"));
  if(questoes) partes.push(questoes + (questoes === 1 ? " questão" : " questões") + " com histórico");
  if(partidas) partes.push(partidas + (partidas === 1 ? " partida" : " partidas"));
  return partes.length ? "Tem " + partes.join(", ") + "." : "Não há progresso guardado.";
}

function restaurarDaLixeira(i){
  const lixo = ler(LIXO_CHAVE) || [];
  const l = lixo[i];
  if(!l) return;
  const perfis = lerPerfis();
  if(!perfis.some(p => p.id === l.id))
    perfis.push({id: l.id, nome: l.nome, cor: l.cor, criado: l.quando});
  gravar(PERFIS_CHAVE, perfis);
  Object.entries(l.dados || {}).forEach(([k, v]) => { try{ localStorage.setItem(k, v); }catch(e){} });
  gravar(LIXO_CHAVE, lixo.filter((_, n) => n !== i));
  trocarPerfil(l.id);
}

/* ---------- leitura do que os jogos salvaram ---------- */
/* Mesma origem, então a página inicial lê o progresso dos quatro. */
function sufixo(){ const p = perfilAtual(); return p ? ":" + p.id : ""; }
function progressoDe(jogo){ return ler(BASES[jogo] + sufixo()) || {items:{}, missions:{}, trails:{}}; }
function historico(){ return ler(HIST_CHAVE + sufixo()) || []; }

let DIAS = 30;
function periodo(d){ DIAS = d; desenhar(); }
function noPeriodo(l){
  if(!DIAS) return l;
  const corte = Date.now() - DIAS * 864e5;
  return l.filter(x => x.q >= corte);
}
const pct = (a, n) => n ? Math.round(a / n * 100) : 0;
const dia = q => new Date(q).toLocaleDateString("pt-BR", {day: "2-digit", month: "2-digit"});
const nomeMissao = (j, m) => (MISSOES[j] && MISSOES[j][m]) || m;

/* ---------- desenho ---------- */
function desenhar(){
  const p = perfilAtual();
  const chip = document.getElementById("chipPerfil");
  chip.textContent = p ? inicialDe(p.nome) : "+";
  chip.style.background = p ? "var(" + p.cor + ")" : "var(--texto-2)";
  chip.title = p ? p.nome : "Escolher aluno";
  document.getElementById("subtitulo").textContent = p
    ? "Jogando como " + p.nome + ". O progresso fica salvo neste aparelho."
    : "Escolha quem está jogando para o progresso ficar separado.";
  pintarPerfis(); pintarJogos(); pintarHistorico(); pintarConta();
}

function pintarPerfis(){
  const c = document.getElementById("listaPerfis");
  const atual = perfilAtual();
  const l = lerPerfis();
  c.innerHTML = l.map(p =>
    '<div class="perfil' + (atual && atual.id === p.id ? " atual" : "") + '">'
    + '<button class="avatar" style="background:var(' + p.cor + ')" onclick="trocarPerfil(\'' + p.id + '\')">'
    + inicialDe(p.nome) + "</button>"
    + '<button class="perfil-nome" onclick="renomearPerfil(\'' + p.id + '\')"'
    + ' aria-label="Renomear ' + esc(p.nome) + '">' + esc(p.nome) + "</button>"
    + '<button class="apagar" onclick="apagarPerfil(\'' + p.id + '\')" aria-label="Apagar ' + esc(p.nome) + '">remover</button>'
    + "</div>").join("")
    || '<p class="vazio">Nenhum aluno ainda. Crie o primeiro abaixo.</p>';

  const lixo = (ler(LIXO_CHAVE) || []).filter(l => Date.now() - l.quando < LIXO_DIAS * 864e5);
  const cx = document.getElementById("lixeira");
  cx.innerHTML = lixo.length
    ? "<h3>Na lixeira</h3>" + lixo.map((l, i) =>
        '<div class="lixo-item"><b>' + esc(l.nome) + "</b>"
        + "<span>apagado em " + new Date(l.quando).toLocaleDateString("pt-BR") + "</span>"
        + '<button class="fantasma" onclick="restaurarDaLixeira(' + i + ')">Trazer de volta</button>'
        + "</div>").join("")
    : "";
}
function esc(t){ return String(t).replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c])); }

function pintarJogos(){
  /* Selo por matéria: quantas missões já foram concluídas. */
  document.querySelectorAll(".mini").forEach(e => {
    const g = e.dataset.jogo, pr = progressoDe(g);
    const feitas = Object.values(pr.missions || {}).filter(m => m.concluidas).length;
    const total = Object.keys(MISSOES[g] || {}).length;
    e.textContent = feitas ? feitas + " de " + total + " missões" : "";
  });

  /* Retomar: as últimas partidas quando existem; senão, as missões que
     ficaram começadas e não concluídas — que o progresso guarda desde
     sempre, mesmo sem nenhuma partida registrada. */
  let itens = historico().slice(-3).reverse().map(x => ({
    j: x.j, m: x.m, nota: pct(x.a, x.n) + "% em " + dia(x.q)}));
  if(!itens.length){
    Object.keys(BASES).forEach(j => {
      const ms = progressoDe(j).missions || {};
      Object.entries(ms).forEach(([m, d]) => {
        if(d && d.iniciada && !d.concluidas)
          itens.push({j, m, nota: "começada, ainda não concluída"});
      });
    });
    itens = itens.slice(0, 3);
  }
  const c = document.getElementById("retomar");
  c.innerHTML = itens.length
    ? '<h3>Continuar de onde parou</h3><div class="retomar">' + itens.map(x =>
        '<a class="retomar-item" href="' + PAGINA[x.j] + "#missao/" + encodeURIComponent(x.m) + '">'
        + '<b>' + esc(nomeMissao(x.j, x.m)) + "</b>"
        + '<span>' + MATERIA[x.j] + " · " + x.nota + "</span></a>").join("")
      + "</div>"
    : "";
}

function pintarHistorico(){
  /* Duas fontes, com papéis diferentes:
     - o PROGRESSO é o registro acumulado que os jogos sempre mantiveram:
       missões concluídas, melhor acerto por missão, questões dominadas;
     - o REGISTRO DE PARTIDAS só existe desde que o histórico foi criado, e
       é o único que tem data.
     Quem lia só o segundo mostrava tela vazia para quem tinha meses de
     progresso — foi o que aconteceu depois de restaurar. */
  const partidas = noPeriodo(historico());
  const jogos = Object.keys(BASES);

  /* ---- resumo por matéria: acumulado, sempre disponível ---- */
  const res = document.getElementById("resumo");
  const cartoes = jogos.map(j => {
    const pr = progressoDe(j);
    const ms = pr.missions || {};
    const feitas = Object.values(ms).filter(m => m && m.concluidas).length;
    const total = Object.keys(MISSOES[j] || {}).length;
    const accs = Object.values(ms).map(m => m && m.melhorAcc).filter(a => a > 0);
    const melhor = accs.length ? Math.round(accs.reduce((a, b) => a + b, 0) / accs.length) : null;
    const noPer = partidas.filter(x => x.j === j);
    if(!feitas && !accs.length && !noPer.length) return "";
    const a = noPer.reduce((s, x) => s + x.a, 0), n = noPer.reduce((s, x) => s + x.n, 0);
    return '<div class="cartao-resumo ' + j + '"><b>' + MATERIA[j] + "</b>"
      + '<span class="grande">' + (melhor !== null ? melhor + "%" : "—") + "</span>"
      + "<span>" + feitas + " de " + total + " missões</span>"
      + "<span>" + (noPer.length
          ? noPer.length + (noPer.length === 1 ? " partida" : " partidas") + " no período · " + pct(a, n) + "%"
          : "sem partidas no período") + "</span></div>";
  }).filter(Boolean);
  res.innerHTML = cartoes.length ? cartoes.join("")
    : '<p class="vazio">Nenhum progresso guardado para este aluno.</p>';

  /* ---- evolução: só o registro de partidas tem data ---- */
  const porDia = {};
  partidas.forEach(x => {
    const k = new Date(x.q).toISOString().slice(0, 10);
    const d = porDia[k] || (porDia[k] = {a: 0, n: 0});
    d.a += x.a; d.n += x.n;
  });
  const dias = Object.keys(porDia).sort().slice(-14);
  const g = document.getElementById("grafico");
  if(!dias.length){
    g.innerHTML = '<p class="vazio">O gráfico compara partida com partida, e só '
      + "conta as jogadas de agora em diante — o progresso antigo não guardava a data. "
      + "Depois de algumas partidas ele aparece aqui.</p>";
  }else{
    const larg = 100 / dias.length;
    g.innerHTML = '<div class="barras">' + dias.map(k => {
      const v = pct(porDia[k].a, porDia[k].n);
      return '<div class="barra-col" style="width:' + larg + '%">'
        + '<div class="barra" style="height:' + Math.max(v, 3) + '%" title="' + v + '%"></div>'
        + '<span class="barra-v">' + v + "</span>"
        + '<span class="barra-d">' + k.slice(8) + "/" + k.slice(5, 7) + "</span></div>";
    }).join("") + "</div>";
  }

  /* ---- o que ainda erra: do progresso, que é cumulativo ---- */
  const fracos = [];
  jogos.forEach(j => {
    const ms = progressoDe(j).missions || {};
    Object.entries(ms).forEach(([m, d]) => {
      if(d && d.iniciada && d.melhorAcc > 0 && d.melhorAcc < 75)
        fracos.push({j, m, acc: d.melhorAcc, fonte: "melhor acerto"});
    });
  });
  /* As partidas do período afinam, quando existem. */
  const porMissao = {};
  partidas.forEach(x => {
    const k = x.j + "|" + x.m;
    const d = porMissao[k] || (porMissao[k] = {j: x.j, m: x.m, a: 0, n: 0});
    d.a += x.a; d.n += x.n;
  });
  Object.values(porMissao).forEach(d => {
    if(d.n < 4) return;
    const p = pct(d.a, d.n);
    const ja = fracos.find(f => f.j === d.j && f.m === d.m);
    if(ja){ ja.acc = p; ja.fonte = "no período"; }
    else if(p < 75) fracos.push({j: d.j, m: d.m, acc: p, fonte: "no período"});
  });
  fracos.sort((a, b) => a.acc - b.acc);
  const f = document.getElementById("fracos");
  f.innerHTML = fracos.length
    ? fracos.slice(0, 6).map(d =>
        '<a class="fraco" href="' + PAGINA[d.j] + "#missao/" + encodeURIComponent(d.m) + '">'
        + '<span class="fraco-pct">' + d.acc + "%</span>"
        + "<b>" + esc(nomeMissao(d.j, d.m)) + "</b>"
        + "<span>" + MATERIA[d.j] + " · " + d.fonte + "</span></a>").join("")
    : '<p class="vazio">Nada abaixo de 75%. Bom sinal.</p>';

  /* ---- partidas: a lista crua ---- */
  const l = document.getElementById("partidas");
  l.innerHTML = partidas.length
    ? '<table class="tabela"><thead><tr><th>Quando</th><th>Matéria</th><th>Missão</th><th>Acerto</th></tr></thead><tbody>'
      + partidas.slice().reverse().slice(0, 40).map(x =>
        "<tr><td>" + dia(x.q) + "</td><td>" + MATERIA[x.j] + "</td><td>"
        + esc(nomeMissao(x.j, x.m)) + "</td><td>" + pct(x.a, x.n) + "% <small>("
        + x.a + "/" + x.n + ")</small></td></tr>").join("")
      + "</tbody></table>"
    : '<p class="vazio">Nenhuma partida registrada neste período.</p>';
}

/* ---------- navegação por aba ---------- */
function ir(v){
  location.hash = v;
  document.querySelectorAll(".vista").forEach(s => s.hidden = s.id !== "v-" + v);
  document.querySelectorAll(".aba").forEach(b => b.classList.toggle("atual", b.dataset.vista === v));
  scrollTo(0, 0);
}
addEventListener("hashchange", () => ir((location.hash || "#jogos").slice(1)));
addEventListener("DOMContentLoaded", () => {
  desenhar();
  const v = (typeof _VOLTA !== "undefined" && _VOLTA) ? "conta"
          : (location.hash || "#jogos").slice(1);
  ir(document.getElementById("v-" + v) ? v : "jogos");
});
