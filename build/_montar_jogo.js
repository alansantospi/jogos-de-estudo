/* Monta um jogo no navegador: o mesmo que `build/montar.py` faz no build,
   para o jogo que a tela de gerar salvou na conta.

   O molde é o mesmo motor dos jogos feitos à mão (`motor/ceu.molde.html`),
   chegando aqui com o sprite já preenchido e as fendas do conteúdo vazias.
   O banco, os nomes e as trilhas saem do JSON como em `build/conteudo.py`; a
   capa e os cartões, que nos jogos à mão são escritos para cada um, saem de
   um modelo único. A lição sai de `jogo.licao`, nos passos de
   `build/licao.py` sem o desenho, que lá é escrito à mão para cada passo.

   `teste/esteira/montar_jogo.test.ts` cobra que o banco montado aqui seja o
   mesmo que o Python monta, sobre os jogos de `conteudo/`. */

const MJ_FIXAS = [["all", "Desafio misto"], ["review", "Revisão dos meus erros"]];
const MJ_TIPOS = {vf: "tf", digitar: "text", ordenar: "order", ligar: "match", bussola: "compass"};

/* Literal JavaScript para dentro de um script: JSON serve, mas a barra
   seguida de "script" num enunciado fecharia a tag. (Este arquivo vai
   inteiro para dentro de uma tag script: nem o comentário pode trazê-la.) */
const mjJs = v => JSON.stringify(v).replace(/<\//g, "<\\/");
const mjHtml = t => String(t).replace(/[&<>"']/g, c =>
  ({"&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"})[c]);

function mjQuestao(q){
  const p = ["ic:" + mjJs(q.icone)];
  if(q.fonte){
    const f = q.fonte;
    p.push("src:" + mjJs(f && typeof f === "object" ? {t: f.tipo, d: f.detalhe} : f));
  }
  if(MJ_TIPOS[q.tipo]) p.push("t:" + mjJs(MJ_TIPOS[q.tipo]));
  p.push("q:" + mjJs(q.enunciado));
  if(q.tipo === "escolha"){ p.push("c:" + mjJs(q.certa)); p.push("d:" + mjJs(q.erradas)); }
  else if(q.tipo === "vf") p.push("c:" + (q.certa ? "true" : "false"));
  else if(q.tipo === "digitar"){ p.push("valid:" + mjJs(q.aceitas)); p.push("ph:" + mjJs(q.exemplo || "")); }
  else if(q.tipo === "ordenar") p.push("seq:" + mjJs(q.sequencia));
  else if(q.tipo === "ligar") p.push("pairs:" + mjJs(q.pares));
  else if(q.tipo === "bussola") p.push("target:" + mjJs(q.alvo));
  if(q.explicacao) p.push("e:" + mjJs(q.explicacao));
  return "{" + p.join(",") + "}";
}

/* O id da missão vira chave de objeto sem aspas: só identificador passa. */
const mjId = id => /^[A-Za-z_$][\w$]*$/.test(id) ? id : mjJs(id);

function mjBank(jogo){
  const por = new Map();
  for(const q of jogo.questoes){
    if(!por.has(q.missao)) por.set(q.missao, []);
    por.get(q.missao).push(q);
  }
  return "const bank={\n" + [...por].map(([m, l]) =>
    mjId(m) + ":[\n" + l.map(mjQuestao).join(",\n") + "]").join(",\n") + "\n};";
}

function mjNomes(jogo){
  const itens = [...MJ_FIXAS, ...jogo.missoes.map(m => [m.id, m.nome])];
  return "const nomes={" + itens.map(([k, v]) => mjId(k) + ":" + mjJs(v)).join(",") + "};";
}

function mjTrilhas(jogo){
  return "const trails={" + jogo.trilhas.map(t =>
    mjId(t.id) + ":{name:" + mjJs(t.nome) + ",steps:" + mjJs(t.etapas) + "}").join(",") + "};";
}

/* O desenho de uma missão é o mais usado nas questões dela. */
function mjIconeDa(jogo, id){
  const conta = {};
  jogo.questoes.filter(q => q.missao === id).forEach(q => { conta[q.icone] = (conta[q.icone] || 0) + 1; });
  return Object.keys(conta).sort((a, b) => conta[b] - conta[a])[0] || "livro";
}

const mjSvg = n => '<svg width="22" height="22" viewBox="0 0 24 24" aria-hidden="true" focusable="false"><use href="#i-'
  + mjHtml(n) + '"/></svg>';

function mjCapa(jogo, comLicao){
  const assuntos = jogo.missoes.map(m => m.nome);
  const resumo = assuntos.length > 1 ? assuntos.slice(0, -1).join(", ") + " e " + assuntos.at(-1) : assuntos[0] || "";
  return '<section id="start" class="screen active"><div class="hero"><div class="icon"></div><h2>'
    + mjHtml(jogo.materia + " — " + jogo.titulo) + "</h2><p>" + mjHtml(resumo) + "</p>"
    + '<div id="startStats" class="chips"></div><div style="display:flex;gap:12px;justify-content:center;flex-wrap:wrap">'
    + (comLicao ? '<button class="primary" onclick="openLesson(\'lesson1\')">Estudar passo a passo</button>'
                + '<button class="secondary" onclick="openLesson(\'resumo\')">Ver o resumo</button>' : "")
    + '<button class="gold" onclick="openCategories()">Ir aos desafios</button>'
    + '<button type="button" class="ghost sala-abrir" onclick="irPara(\'sala\')"><svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true" focusable="false"><use href="#i-pessoas"/></svg> Jogar com outras pessoas</button>'
    + '</div><div style="margin-top:10px"><button class="link-btn" onclick="resetProgress()">apagar progresso salvo</button></div></div></section>';
}

function mjCartoes(jogo){
  const nome = id => (jogo.missoes.find(m => m.id === id) || {}).nome || id;
  const trilhas = jogo.trilhas.map((t, i) =>
    '<button class="trail-card' + (i ? "" : " recommended") + '" data-trail="' + mjHtml(t.id)
    + '" onclick="startTrail(' + mjHtml(mjJs(t.id)) + ')">' + mjSvg(mjIconeDa(jogo, t.etapas[0]))
    + "<strong>" + mjHtml(t.nome) + '<span class="trail-done">✓ concluída</span></strong><small>'
    + mjHtml(t.etapas.map(e => e === "all" ? "Desafio misto" : nome(e)).join(" → ")) + ".</small></button>").join("");
  const missoes = jogo.missoes.map(m => {
    const n = jogo.questoes.filter(q => q.missao === m.id).length;
    return '<button class="category-card" data-cat="' + mjHtml(m.id) + '" onclick="startCategory('
      + mjHtml(mjJs(m.id)) + ')">' + mjSvg(mjIconeDa(jogo, m.id)) + "<strong>" + mjHtml(m.nome)
      + "</strong><small>" + n + (n === 1 ? " questão" : " questões")
      + '</small><div class="mini-bar"><span></span></div><div class="mini-txt"></div></button>';
  }).join("");
  return '<div class="trail-grid">' + trilhas + '</div><h2 style="margin-top:24px">Ou escolha um conteúdo</h2>'
    + '<div class="category-grid" id="gradeMissoes"><h3 class="grupo">Atalhos</h3>'
    + '<button class="category-card" data-cat="review" onclick="startCategory(\'review\')">' + mjSvg("remendo")
    + '<strong>Revisar meus erros</strong><small>Só o que você vem errando, para atacar o ponto fraco.</small><span class="review-count"></span></button>'
    + '<button class="category-card" data-cat="all" onclick="startCategory(\'all\')">' + mjSvg("dado")
    + '<strong>Tudo misturado</strong><small>Todos os conteúdos em uma única partida.</small><div class="mini-bar"><span></span></div><div class="mini-txt"></div></button>'
    + '<h3 class="grupo">Conteúdos</h3>' + missoes
    + '<p id="semResultado" class="sem-resultado" hidden>Nenhuma missão com esse nome.</p></div>';
}

/* ---------- a lição ----------
   O mesmo HTML que `passo` e `resumo` de `build/licao.py` escrevem, que o
   CSS e o JS de lá (vindos em `pecas`) fazem funcionar. Uma diferença: lá o
   texto é escrito à mão e entra cru; aqui veio do modelo, e é escapado —
   só <b> volta a ser marcação, nos campos em que a lição o usa.
   `teste/esteira/montar_jogo.test.ts` cobra os dois lados iguais. */

const mjRico = t => mjHtml(t).replace(/&lt;(\/?)b&gt;/g, "<$1b>");
const mjMissao = id => String(id).replace(/[^\w$]/g, "");
/* Atributo com JSON dentro, com o espaçamento do json.dumps do Python. O
   que sai dele vai para innerHTML: escapar de novo é o que impede o texto
   de virar tag depois que o navegador desfaz as entidades do atributo. */
const mjAttr = d => mjHtml("{" + Object.entries(d).map(([k, v]) => JSON.stringify(k) + ": " + JSON.stringify(v)).join(", ") + "}");
const mjFig = (corpo, legenda) => '<figure class="mic-fig">' + corpo
  + (legenda ? "<figcaption>" + mjHtml(legenda) + "</figcaption>" : "") + "</figure>";

function mjMaquina(p){
  const v = k => "o" + (k + 1);
  const saidas = {}, notas = {};
  p.maq.forEach((o, k) => { saidas[v(k)] = mjRico(o.saida); notas[v(k)] = mjRico(o.nota); });
  return mjFig('<div class="mic-maq" data-out="' + mjAttr(saidas) + '" data-nota="' + mjAttr(notas) + '">'
    + '<div class="mic-eixo">' + p.maq.map((o, k) => '<button type="button" data-v="' + v(k) + '" aria-pressed="'
      + (k ? "false" : "true") + '">' + mjHtml(o.rotulo) + "</button>").join("") + "</div>"
    + '<span class="mic-sinal">=</span><output class="mic-res">—</output></div><p class="mic-nota"></p>', p.maq_cap);
}

function mjRevelar(p){
  const oculto = "toque para ver";
  return mjFig('<div class="mic-revs">' + p.revs.map(r => '<button type="button" class="mic-rev" aria-expanded="false" '
    + 'data-resp="' + mjHtml(r.resposta) + '" data-oculto="' + oculto + '"><b>' + mjHtml(r.titulo) + "</b><i>"
    + oculto + "</i></button>").join("") + "</div>", p.revs_cap);
}

/* A certa gira de posição a cada passo, como em `checar`. */
function mjChecar(q, giro){
  const ops = q.erradas.map(e => [e, false]);
  ops.splice(giro % (ops.length + 1), 0, [q.certa, true]);
  return '<div class="mic-q" data-mic="escolher"><p class="mic-ask">' + mjHtml(q.pergunta) + "</p>"
    + '<div class="mic-ops">' + ops.map(([t, ok]) => '<button type="button"' + (ok ? ' data-ok="1"' : "") + ">"
      + mjHtml(t) + "</button>").join("") + '</div><p class="mic-fb" hidden>' + mjHtml(q.retorno) + "</p></div>";
}

const mjAlternar = (para, rotulo) => '<button type="button" class="mic-modo" onclick="openLesson(\'' + para + '\')">'
  + rotulo + "</button>";

function mjPasso(p, i, n){
  const corpo = [];
  if(p.revs && p.revs.length) corpo.push(mjRevelar(p));
  if(p.maq && p.maq.length) corpo.push(mjMaquina(p));
  if(p.alerta) corpo.push('<div class="example warning">' + mjRico(p.alerta) + "</div>");
  corpo.push(mjChecar(p.quiz, i - 1));
  const nav = [];
  if(i > 1) nav.push('<button class="secondary" onclick="openLesson(\'lesson' + (i - 1) + '\')">← Voltar</button>');
  nav.push('<button class="mic-treinar" onclick="startCategory(\'' + mjMissao(p.missao) + '\')">Treinar isto agora</button>');
  nav.push('<span class="cresce"></span>');
  nav.push(i < n ? '<button class="primary" onclick="openLesson(\'lesson' + (i + 1) + '\')">Próximo →</button>'
                 : '<button class="gold" onclick="openCategories()">Ir aos desafios →</button>');
  const volta = i === 1 ? '<button type="button" id="micVoltar" class="link-btn" hidden></button>' : "";
  return '<div id="lesson' + i + '" class="lesson-part"><div class="lesson-card">'
    + '<div class="mic-topo"><span class="lesson-tag">Passo ' + i + " de " + n + "</span>"
    + '<span class="mic-barra"><i style="width:' + Math.round(i * 100 / n) + '%"></i></span>' + volta
    + mjAlternar("resumo", "Ver resumo") + "</div>"
    + "<h2>" + mjHtml(p.titulo) + '</h2><p class="mic-ideia">' + mjRico(p.ideia) + "</p>" + corpo.join("")
    + '<div class="mic-nav">' + nav.join("") + "</div></div></div>";
}

/* Um passo no resumo, como `_bloco`: a regra, os cartões, as escolhas, o alerta. */
function mjBloco(p, icone){
  const out = ['<p class="mic-regra">' + mjRico(p.ideia) + "</p>"];
  if(p.revs && p.revs.length)
    out.push('<div class="content-grid">' + p.revs.map(r => '<div class="mini"><div class="pic"><svg width="26" height="26" '
      + 'viewBox="0 0 24 24" aria-hidden="true" focusable="false"><use href="#i-' + mjHtml(icone) + '"/></svg></div>'
      + "<strong>" + mjHtml(r.titulo) + "</strong><span>" + mjHtml(r.resposta) + "</span></div>").join("") + "</div>");
  if(p.maq && p.maq.length)
    out.push('<div class="example">' + p.maq.map(o => "<b>" + mjHtml(o.rotulo) + "</b> → " + mjRico(o.saida))
      .join(" &nbsp;·&nbsp; ") + "</div>");
  if(p.alerta) out.push('<div class="example warning">' + mjRico(p.alerta) + "</div>");
  return out.join("");
}

function mjResumo(jogo, passos){
  const por = new Map();
  passos.forEach(p => { if(!por.has(p.missao)) por.set(p.missao, []); por.get(p.missao).push(p); });
  const vistas = new Set(), out = [];
  const varias = jogo.trilhas.length > 1;
  for(const t of jogo.trilhas){
    // Com uma trilha só, o título dela ("Todas as missões") não separa nada.
    if(varias) out.push('<h3 class="mic-secao">' + mjHtml(t.nome) + "</h3>");
    for(const e of t.etapas){
      if(!por.has(e) || vistas.has(e)) continue;
      vistas.add(e);
      const nome = (jogo.missoes.find(m => m.id === e) || {}).nome || e;
      out.push('<div class="mic-bloco"><button type="button" class="mic-titulo" onclick="startCategory(\''
        + mjMissao(e) + '\')">' + mjHtml(nome) + "<span>treinar →</span></button>"
        + por.get(e).map(p => mjBloco(p, mjIconeDa(jogo, e))).join("") + "</div>");
    }
  }
  const n = vistas.size;
  return '<div id="resumo" class="lesson-part"><div class="lesson-card">'
    + '<div class="mic-topo"><span class="lesson-tag">Resumo</span>'
    + '<span class="mic-barra"><i style="width:100%"></i></span>' + mjAlternar("lesson1", "Ir ao passo a passo") + "</div>"
    + "<h2>" + mjHtml(jogo.titulo) + ', tudo numa página</h2><p class="mic-ideia">'
    + (n === 1 ? "O conteúdo do jogo" : "Os " + n + " conteúdos do jogo")
    + ", para reler de ponta a ponta. Cada título leva às questões daquele conteúdo.</p>" + out.join("")
    + '<div class="mic-nav"><button class="secondary" onclick="openLesson(\'lesson1\')">← Passo a passo</button>'
    + '<span class="cresce"></span><button class="gold" onclick="openCategories()">Ir aos desafios →</button></div>'
    + "</div></div>";
}

/* Os passos na ordem das missões do jogo; passo de missão que saiu do jogo
   não entra, porque "Treinar isto agora" levaria a uma missão vazia. */
function mjPassos(jogo){
  const ordem = jogo.missoes.map(m => m.id);
  return (jogo.licao || []).filter(p => ordem.includes(p.missao))
    .map((p, k) => [p, k]).sort((a, b) => ordem.indexOf(a[0].missao) - ordem.indexOf(b[0].missao) || a[1] - b[1])
    .map(([p]) => p);
}

function mjLicao(jogo, pecas, chave){
  const passos = mjPassos(jogo);
  if(!passos.length || !pecas) return '<section id="lesson" class="screen"></section>';
  return '<section id="lesson" class="screen">' + pecas.css.split("%CHAVE%").join(chave)
    + passos.map((p, k) => mjPasso(p, k + 1, passos.length)).join("") + mjResumo(jogo, passos)
    + pecas.js.split("%CHAVE%").join(chave) + "</section>";
}

/* A cor da matéria, a mesma dos jogos feitos à mão; matéria nova fica com
   o azul da casa. */
const MJ_CORES = {"ciências": "oklch(0.40 0.19 285)", "geografia": "oklch(0.46 0.12 245)",
  "história": "oklch(0.60 0.18 40)", "matemática": "oklch(0.52 0.22 298)",
  "gramática": "oklch(0.55 0.11 82)", "língua portuguesa": "oklch(0.55 0.11 82)",
  "português": "oklch(0.55 0.11 82)", "inglês": "oklch(0.55 0.20 265)", "arte": "oklch(0.56 0.22 330)"};

/* `id` é o da linha em `jogos`: dele saem a chave do progresso e a sala,
   para dois jogos gerados nunca dividirem progresso. `pecas` é o CSS e o JS
   da lição, de `build/licao.py`; sem elas, o jogo sai sem lição. */
function montarJogo(molde, jogo, id, pecas){
  const curto = String(id).replace(/[^a-z0-9]/gi, "").slice(0, 12).toLowerCase();
  const troca = {
    "%PATENTE%": "lives<=0&&!practiceMode?'Aprendiz':acc>=90?'Mestre':acc>=70?'Estudante':'Aprendiz'",
    "%COR%": MJ_CORES[String(jogo.materia).trim().toLowerCase()] || "oklch(0.55 0.20 265)",
    "%TITULO%": mjHtml(jogo.titulo), "%CHAVE%": "gerado_" + curto + "_progress_v1",
    "%MATERIA%": mjHtml(jogo.materia), "%SUBTITULO%": mjHtml(jogo.materia + " — " + jogo.titulo),
    "%SALA%": "jogosdeestudo-g" + curto + "-", "%SLUG%": "g_" + curto,
  };
  const licao = mjLicao(jogo, pecas, "gerado_" + curto + "_licao_v1");
  let s = molde
    .replace("<!--%HERO%-->", () => mjCapa(jogo, /mic-topo/.test(licao)))
    .replace("<!--%LICAO%-->", () => licao)
    .replace("<!--%CARTOES%-->", () => mjCartoes(jogo))
    .replace("/*%BANK%*/", () => mjBank(jogo))
    .replace("/*%NOMES%*/", () => mjNomes(jogo))
    .replace("/*%TRAILS%*/", () => mjTrilhas(jogo));
  for(const [marca, valor] of Object.entries(troca)) s = s.split(marca).join(valor);
  const sobrou = s.match(/%[A-Z]+%/g);
  if(sobrou) throw new Error("fendas não preenchidas: " + [...new Set(sobrou)].join(", "));
  return s;
}
