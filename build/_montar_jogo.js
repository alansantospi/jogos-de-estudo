/* Monta um jogo no navegador: o mesmo que `build/montar.py` faz no build,
   para o jogo que a tela de gerar salvou na conta.

   O molde é o mesmo motor dos jogos feitos à mão (`motor/ceu.molde.html`),
   chegando aqui com o sprite já preenchido e as fendas do conteúdo vazias.
   O banco, os nomes e as trilhas saem do JSON como em `build/conteudo.py`; a
   capa e os cartões, que nos jogos à mão são escritos para cada um, saem de
   um modelo único. Não há lição: ela é feita à mão, por conteúdo.

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

function mjCapa(jogo){
  const assuntos = jogo.missoes.map(m => m.nome);
  const resumo = assuntos.length > 1 ? assuntos.slice(0, -1).join(", ") + " e " + assuntos.at(-1) : assuntos[0] || "";
  return '<section id="start" class="screen active"><div class="hero"><div class="icon"></div><h2>'
    + mjHtml(jogo.materia + " — " + jogo.titulo) + "</h2><p>" + mjHtml(resumo) + "</p>"
    + '<div id="startStats" class="chips"></div><div style="display:flex;gap:12px;justify-content:center;flex-wrap:wrap">'
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

/* A cor da matéria, a mesma dos jogos feitos à mão; matéria nova fica com
   o azul da casa. */
const MJ_CORES = {"ciências": "oklch(0.40 0.19 285)", "geografia": "oklch(0.46 0.12 245)",
  "história": "oklch(0.60 0.18 40)", "matemática": "oklch(0.52 0.22 298)",
  "gramática": "oklch(0.55 0.11 82)", "língua portuguesa": "oklch(0.55 0.11 82)",
  "português": "oklch(0.55 0.11 82)", "inglês": "oklch(0.55 0.20 265)", "arte": "oklch(0.56 0.22 330)"};

/* `id` é o da linha em `jogos`: dele saem a chave do progresso e a sala,
   para dois jogos gerados nunca dividirem progresso. */
function montarJogo(molde, jogo, id){
  const curto = String(id).replace(/[^a-z0-9]/gi, "").slice(0, 12).toLowerCase();
  const troca = {
    "%PATENTE%": "lives<=0&&!practiceMode?'Aprendiz':acc>=90?'Mestre':acc>=70?'Estudante':'Aprendiz'",
    "%COR%": MJ_CORES[String(jogo.materia).trim().toLowerCase()] || "oklch(0.55 0.20 265)",
    "%TITULO%": mjHtml(jogo.titulo), "%CHAVE%": "gerado_" + curto + "_progress_v1",
    "%MATERIA%": mjHtml(jogo.materia), "%SUBTITULO%": mjHtml(jogo.materia + " — " + jogo.titulo),
    "%SALA%": "jogosdeestudo-g" + curto + "-", "%SLUG%": "g_" + curto,
  };
  let s = molde
    .replace("<!--%HERO%-->", () => mjCapa(jogo))
    .replace("<!--%LICAO%-->", '<section id="lesson" class="screen"></section>')
    .replace("<!--%CARTOES%-->", () => mjCartoes(jogo))
    .replace("/*%BANK%*/", () => mjBank(jogo))
    .replace("/*%NOMES%*/", () => mjNomes(jogo))
    .replace("/*%TRAILS%*/", () => mjTrilhas(jogo));
  for(const [marca, valor] of Object.entries(troca)) s = s.split(marca).join(valor);
  const sobrou = s.match(/%[A-Z]+%/g);
  if(sobrou) throw new Error("fendas não preenchidas: " + [...new Set(sobrou)].join(", "));
  return s;
}
