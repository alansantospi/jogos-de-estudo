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
function apagarPerfil(id){
  const p = lerPerfis().find(x => x.id === id);
  if(!p || !confirm("Apagar o perfil de " + p.nome + " e todo o progresso dele?")) return;
  gravar(PERFIS_CHAVE, lerPerfis().filter(x => x.id !== id));
  try{
    Object.values(BASES).forEach(b => localStorage.removeItem(b + ":" + id));
    localStorage.removeItem(HIST_CHAVE + ":" + id);
  }catch(e){}
  desenhar();
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

  /* Retomar: as três últimas partidas, para continuar com um toque. */
  const ult = historico().slice(-3).reverse();
  const c = document.getElementById("retomar");
  c.innerHTML = ult.length
    ? '<h3>Continuar de onde parou</h3><div class="retomar">' + ult.map(x =>
        '<a class="retomar-item" href="' + PAGINA[x.j] + "#missao/" + encodeURIComponent(x.m) + '">'
        + '<b>' + esc(nomeMissao(x.j, x.m)) + "</b>"
        + '<span>' + MATERIA[x.j] + " · " + pct(x.a, x.n) + "% em " + dia(x.q) + "</span></a>").join("")
      + "</div>"
    : "";
}

function pintarHistorico(){
  const todas = noPeriodo(historico());
  /* Resumo por matéria — é o que a professora olha. */
  const porJogo = {};
  todas.forEach(x => {
    const d = porJogo[x.j] || (porJogo[x.j] = {a: 0, n: 0, partidas: 0});
    d.a += x.a; d.n += x.n; d.partidas++;
  });
  const res = document.getElementById("resumo");
  res.innerHTML = Object.keys(porJogo).length
    ? Object.entries(porJogo).map(([j, d]) =>
        '<div class="cartao-resumo ' + j + '"><b>' + MATERIA[j] + "</b>"
        + '<span class="grande">' + pct(d.a, d.n) + "%</span>"
        + "<span>" + d.partidas + (d.partidas === 1 ? " partida" : " partidas")
        + " · " + d.a + "/" + d.n + " acertos</span></div>").join("")
    : '<p class="vazio">Nenhuma partida neste período.</p>';

  /* Evolução: acerto por dia. Barras, não linha — são poucos pontos e dias
     sem jogo não devem virar uma reta inventada entre dois pontos. */
  const porDia = {};
  todas.forEach(x => {
    const k = new Date(x.q).toISOString().slice(0, 10);
    const d = porDia[k] || (porDia[k] = {a: 0, n: 0});
    d.a += x.a; d.n += x.n;
  });
  const dias = Object.keys(porDia).sort().slice(-14);
  const g = document.getElementById("grafico");
  if(!dias.length){ g.innerHTML = '<p class="vazio">Ainda sem partidas para comparar.</p>'; }
  else{
    const larg = 100 / dias.length;
    g.innerHTML = '<div class="barras">' + dias.map(k => {
      const v = pct(porDia[k].a, porDia[k].n);
      return '<div class="barra-col" style="width:' + larg + '%">'
        + '<div class="barra" style="height:' + Math.max(v, 3) + '%" title="' + v + '%"></div>'
        + '<span class="barra-v">' + v + "</span>"
        + '<span class="barra-d">' + k.slice(8) + "/" + k.slice(5, 7) + "</span></div>";
    }).join("") + "</div>";
  }

  /* O que ainda erra: por missão, onde o acerto está mais baixo. */
  const porMissao = {};
  todas.forEach(x => {
    const k = x.j + "|" + x.m;
    const d = porMissao[k] || (porMissao[k] = {j: x.j, m: x.m, a: 0, n: 0});
    d.a += x.a; d.n += x.n;
  });
  const fracos = Object.values(porMissao).filter(d => d.n >= 4 && pct(d.a, d.n) < 75)
                   .sort((x, y) => pct(x.a, x.n) - pct(y.a, y.n)).slice(0, 6);
  const f = document.getElementById("fracos");
  f.innerHTML = fracos.length
    ? fracos.map(d =>
        '<a class="fraco" href="' + PAGINA[d.j] + "#missao/" + encodeURIComponent(d.m) + '">'
        + '<span class="fraco-pct">' + pct(d.a, d.n) + "%</span>"
        + "<b>" + esc(nomeMissao(d.j, d.m)) + "</b>"
        + "<span>" + MATERIA[d.j] + " · revisar</span></a>").join("")
    : '<p class="vazio">Nada abaixo de 75% neste período. Bom sinal.</p>';

  /* Lista crua, a mais recente primeiro. */
  const l = document.getElementById("partidas");
  l.innerHTML = todas.length
    ? '<table class="tabela"><thead><tr><th>Quando</th><th>Matéria</th><th>Missão</th><th>Acerto</th></tr></thead><tbody>'
      + todas.slice().reverse().slice(0, 40).map(x =>
        "<tr><td>" + dia(x.q) + "</td><td>" + MATERIA[x.j] + "</td><td>"
        + esc(nomeMissao(x.j, x.m)) + "</td><td>" + pct(x.a, x.n) + "% <small>("
        + x.a + "/" + x.n + ")</small></td></tr>").join("")
      + "</tbody></table>"
    : "";
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
  const v = (location.hash || "#jogos").slice(1);
  ir(document.getElementById("v-" + v) ? v : "jogos");
});
