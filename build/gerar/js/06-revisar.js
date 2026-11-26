/* ---------- 3. revisar ---------- */

function mostrar(r, pedido){
  editandoAgora = null;
  estado = {pedido, missoes: r.missoes, lote: r.lote, aviso: r.aviso || "",
            custo: r.custo_usd, restantes: r.restantes,
            questoes: r.questoes.map(q => ({...q, estado: "pendente"}))};
  cota(r.restantes);
  filtro = "todas";
  guardar();
  irPara(3);
  pintar();
}

const grave = q => (q.problemas || []).some(p => p.grave);
const comAviso = q => (q.problemas || []).length > 0;
const vivas = () => estado.questoes.filter(q => q.estado !== "descartada");
const aprovadas = () => estado.questoes.filter(q => q.estado === "aprovada");
const limpasPendentes = () => estado.questoes.filter(q => q.estado === "pendente" && !comAviso(q));
/* O que vai para o jogo num toque: o aprovado e o pendente SEM AVISO. O
   aviso mais comum é a certa se entregar pelo tamanho, e jogo gerado não
   passa pelo medidor do build (PRODUCT.md, "A questão precisa ser
   honesta"): com aviso, espera alguém olhar. Revisar o resto é opcional. */
const prontas = () => estado.questoes.filter(q => q.estado === "aprovada" || (q.estado === "pendente" && !comAviso(q)));
const comAvisoPendentes = () => estado.questoes.filter(q => q.estado === "pendente" && comAviso(q));

const REGRAS = [["sempreAMaior", "Quem escolhe sempre a maior"],
                ["sempreAMenor", "Quem escolhe sempre a menor"],
                ["eliminarAbsolutos", "Quem descarta “sempre”, “nunca”, “só”"],
                ["seguirOEco", "Quem segue as palavras do enunciado"]];

/* Nome, matéria e cor ficam editáveis na revisão: o nome que o plano
   sugeriu muda aqui, sem voltar etapas. O bloco é feito uma vez e
   sobrevive às repinturas — as missões chegam enquanto se digita. */
let identidade = null;
function pintarIdentidade(c){
  if(!identidade){
    const campo = (k, rotulo) => el("label", {}, rotulo, el("input", {"data-k": k, autocomplete: "off",
      oninput: ev => { estado.pedido[k] = ev.target.value; guardar(); corDaRevisao(); }}));
    const mudar = k => { estado.pedido.cor = k; guardar(); corDaRevisao(); };
    identidade = el("div", {class: "identidade"},
      el("div", {class: "editando-jogo"}, campo("titulo", "Nome do jogo"), campo("materia", "Matéria")));
    identidade.cor = seletorCor("corRevisao", mudar, () => mudar(""));
    identidade.append(identidade.cor);
  }
  identidade.querySelectorAll("input[data-k]").forEach(i => {
    if(document.activeElement !== i) i.value = estado.pedido[i.dataset.k] || ""; });
  corDaRevisao();
  if(identidade.parentNode !== c) c.prepend(identidade);
}
function corDaRevisao(){
  const p = estado.pedido;
  identidade.cor.atualizar(Object.hasOwn(CORES_JOGO, p.cor) ? p.cor : corSugerida(p.materia, p.titulo), !p.cor);
}

/* O atalho do verdadeiro ou falso: se quase todas são verdadeiras, quem
   chuta "verdadeiro" acerta sem saber. Com poucas, a proporção é ruído. */
function desequilibrioVF(qs){
  const vf = qs.filter(q => tipoDe(q) === "vf"), n = vf.length;
  if(n < 6) return "";
  const v = vf.filter(q => q.verdadeira === true).length, mais = Math.max(v, n - v);
  if(mais / n <= 0.7) return "";
  return "Das " + n + " de verdadeiro ou falso, " + mais + " são " + (v >= n - v ? "verdadeiras" : "falsas")
    + ": quem chuta sempre \"" + (v >= n - v ? "verdadeiro" : "falso") + "\" acerta quase todas. Troque ou descarte algumas.";
}

let conferenciaAberta = false;
function pintarResumo(){
  const l = estado.lote, c = $("resumo"), qs = estado.questoes;
  [...c.childNodes].forEach(x => { if(x !== identidade) x.remove(); });
  pintarIdentidade(c);
  if(estado.jogoId){
    // Jogo salvo, reaberto: o que mudar aqui vale no próximo "Atualizar".
    c.append(el("div", {class: "acoes", style: "margin:0 0 1rem"},
        el("button", {class: "botao secundario", type: "button", disabled: gerando, onclick: comecarAcrescentar},
           icone("mais"), "Acrescentar questões"),
        // Sem material guardado, não há contra o que conferir a lição.
        !temLicao() && estado.pedido.material ? el("button", {class: "botao secundario", type: "button",
          disabled: gerando, title: "Conta como um jogo do dia", onclick: criarLicao}, icone("livro"), "Criar a lição") : null,
        el("a", {class: "botao discreto", href: "jogar.html?id=" + encodeURIComponent(estado.jogoId)}, "Jogar a versão salva")));
  }
  const n = k => qs.filter(q => q.estado === k).length;
  c.append(el("p", {class: "contas"},
    el("span", {}, el("b", {}, String(qs.length)), "questões"),
    el("span", {}, el("b", {}, String(n("aprovada"))), n("aprovada") === 1 ? "aprovada" : "aprovadas"),
    el("span", {}, el("b", {}, String(qs.filter(comAviso).length)), "com aviso"),
    n("descartada") ? el("span", {}, el("b", {}, String(n("descartada"))), "descartadas") : null));
  if(estado.aviso) c.append(el("div", {class: "aviso"}, icone("alerta"), el("span", {}, estado.aviso)));
  const vf = desequilibrioVF(vivas());
  if(vf) c.append(el("div", {class: "aviso"}, icone("alerta"), el("span", {}, vf)));
  if(estado.plano) c.append(pintarPlano());
  if(estado.licao && Object.keys(estado.licao).length) c.append(pintarLicao());
  if(l){
    // As medidas são para quem quer conferir: recolhidas, com o veredito no resumo.
    const det = el("details", {class: "conferencia", ontoggle: ev => { conferenciaAberta = ev.target.open; }},
      el("summary", {}, "Detalhes da conferência",
        el("small", {}, l.fora.length ? plural(l.fora.length, "atalho fora da faixa", "atalhos fora da faixa")
                                      : "atalhos dentro da faixa")));
    det.open = conferenciaAberta;
    c.append(det);
    det.append(el("ul", {class: "medida", "aria-label": "Quanto acerta quem chuta por atalho"}, REGRAS.map(([k, nome]) =>
      el("li", {class: l.fora.includes(k) ? "fora" : ""}, el("span", {}, nome),
         el("b", {}, l[k].toFixed(0) + "%"),
         el("span", {class: "regua", "aria-hidden": "true"},
            el("i", {style: "left:" + Math.min(100, Math.max(0, l[k])) + "%"}))))));
    det.append(el("p", {class: "nota"}, l.amostraPequena
      ? "O acaso puro acerta 25%. Com " + l.n + " questões a média ainda é ruído, então ela não reprova: "
        + "o que conta são os avisos em cada questão. No jogo montado, o build mede de novo."
      : "O acaso puro acerta 25%; a faixa verde, de 15% a 35%, é a aceita. Medido sobre as " + l.n
        + " questões que não estão descartadas nem com problema grave."));
  }
  const partes = [];
  if(estado.custo != null) partes.push((estado.plano ? "Este jogo custou " : "Esta geração custou ") + dinheiro(estado.custo));
  if(estado.restantes != null) partes.push("restam " + estado.restantes + " hoje");
  if(partes.length) c.append(el("p", {class: "nota"}, partes.join(" · ") + "."));
}

const SITUACAO = {aguardando: "Na fila", escrevendo: "Escrevendo", pronta: "Pronta", falhou: "Não veio"};
function pintarPlano(){
  const pronto = Object.values(estado.partes).every(p => p.estado === "pronta");
  const linhas = estado.plano.map(m => {
    const p = estado.partes[m.id] || {estado: "falhou", erro: ""};
    // Menos que o previsto é o modelo recusando inventar: o trecho não dava.
    const qtd = p.estado !== "pronta" ? m.quantidade + " previstas"
      : p.n < m.quantidade ? p.n + " de " + m.quantidade + " previstas" : plural(p.n, "questão", "questões");
    return el("li", {class: "missao " + p.estado},
      el("span", {class: "nome-missao"}, m.nome),
      el("span", {class: "qtd"}, qtd),
      el("span", {class: "situacao"}, SITUACAO[p.estado]),
      p.estado === "falhou" ? el("p", {class: "erro-missao"}, p.erro || "",
        el("button", {class: "botao secundario", type: "button",
                      onclick: () => tentarDeNovo(m.id)}, "Tentar de novo")) : null,
      p.aviso ? el("p", {class: "erro-missao cuidado"}, p.aviso) : null);
  });
  // Pedir 30 e ver 23 parece defeito: é o material que não sustentava mais,
  // e o modelo é instruído a não inventar.
  const vieram = estado.plano.reduce((t, m) => t + ((estado.partes[m.id] || {}).n || 0), 0);
  const curto = pronto && estado.pedidas && vieram < estado.pedidas;
  // Com tudo pronto, o plano vira referência: fecha, mas continua à mão.
  return el("div", {},
    curto ? el("p", {class: "nota", id: "notaCurto"}, "Você pediu " + estado.pedidas + "; o material sustentou "
      + vieram + ". As questões só saem do que está no material, e ele não tinha assunto para mais. "
      + "Para ter mais, salve e depois use Acrescentar questões com outras páginas.") : null,
    el("details", {class: "plano", open: !pronto},
      el("summary", {}, plural(estado.plano.length, "missão", "missões") + (pronto ? "" : " · gerando")),
      el("ul", {}, linhas)));
}

/* <b> é a única marcação que a lição usa. Vira nó, não innerHTML: o texto
   veio do modelo. */
function rico(t){
  let negrito = false;
  return String(t || "").split(/(<\/?b>)/i).flatMap(pedaco => {
    if(/^<b>$/i.test(pedaco)){ negrito = true; return []; }
    if(/^<\/b>$/i.test(pedaco)){ negrito = false; return []; }
    return pedaco ? [negrito ? el("b", {}, pedaco) : pedaco] : [];
  });
}

const temLicao = () => Object.values(estado.licao || {}).some(l => (l.passos || []).length);

function cartaPasso(x, mid, k){
  const missao = (estado.missoes.find(m => m.id === mid) || {}).nome || mid;
  const grave = x.problemas.some(p => p.grave);
  const alternar = () => { x.fora = !x.fora; guardar(); pintar(); };
  return el("article", {class: "carta passo" + (x.fora ? " fora" : ""), "aria-label": "Passo da lição: " + x.titulo},
    el("div", {class: "topo"}, el("span", {}, "Lição · " + missao + (k ? " · passo " + (k + 1) : "")),
       el("span", {class: "selo"}, x.fora ? "Fora da lição" : "Na lição")),
    el("div", {class: "enunciado"}, x.titulo),
    el("p", {class: "ideia"}, rico(x.ideia)),
    x.revs.length ? [el("span", {class: "rotulo"}, x.revs_cap || "Cartões de tocar"),
      el("ul", {class: "pares"}, x.revs.map(r => el("li", {}, el("b", {}, r.titulo), " → ", r.resposta)))] : null,
    x.maq.length ? [el("span", {class: "rotulo"}, x.maq_cap || "Escolhas"),
      el("ul", {class: "pares"}, x.maq.map(o => el("li", {}, el("b", {}, o.rotulo), " → ", rico(o.saida),
        o.nota ? [" — ", rico(o.nota)] : null)))] : null,
    x.alerta ? el("div", {class: "aviso"}, icone("alerta"), el("span", {}, rico(x.alerta))) : null,
    el("span", {class: "rotulo"}, "Checagem do fim do passo"),
    el("p", {class: "ideia"}, x.quiz.pergunta),
    el("ul", {class: "ops"},
       el("li", {class: "certa"}, icone("check"), el("span", {}, el("span", {class: "so-leitor"}, "Certa: "), x.quiz.certa)),
       x.quiz.erradas.map(e => el("li", {}, icone("xis"), el("span", {}, e)))),
    el("p", {class: "explica"}, x.quiz.retorno),
    el("p", {class: "origem"}, el("b", {}, "Do material: "), "“" + x.trecho + "”"),
    x.problemas.length ? el("ul", {class: "problemas"}, x.problemas.map(p =>
      el("li", {class: p.grave ? "grave" : ""}, icone("alerta"), el("span", {}, p.texto)))) : null,
    el("div", {class: "acoes"}, el("button", {class: "botao " + (x.fora ? "secundario" : "discreto"), type: "button",
      disabled: grave, title: grave ? "Sem trecho conferido, este passo não entra" : false, onclick: alternar},
      x.fora ? "Pôr de volta na lição" : "Tirar da lição")));
}

/* A lição fica fechada: aberta, empurraria as questões para baixo. */
let licaoAberta = false;
function pintarLicao(){
  const ids = estado.missoes.map(m => m.id).filter(id => estado.licao[id]);
  const ls = ids.map(id => estado.licao[id]);
  const passos = ls.flatMap(l => l.passos || []), dentro = passos.filter(x => !x.fora).length;
  const andando = ls.some(l => l.estado === "aguardando" || l.estado === "escrevendo");
  const partes = [plural(dentro, "passo", "passos")];
  if(passos.length > dentro) partes.push(plural(passos.length - dentro, "fora", "fora"));
  if(andando) partes.push("escrevendo");
  if(ls.some(l => l.estado === "falhou")) partes.push("falta missão");
  const d = el("details", {class: "licao", open: licaoAberta, ontoggle: () => { licaoAberta = d.open; }},
    el("summary", {}, icone("livro"), "Lição", el("small", {}, partes.join(" · "))),
    el("div", {},
      el("p", {class: "nota"}, "Vem antes das questões no jogo: um passo por ideia, com uma checagem no fim. "
        + "Só entram os passos das missões que têm questão aprovada."),
      ids.flatMap(id => {
        const l = estado.licao[id], nome = (estado.missoes.find(m => m.id === id) || {}).nome || id;
        if(l.estado === "pronta") return [
          l.aviso ? el("p", {class: "erro-missao cuidado"}, l.aviso) : null,
          ...l.passos.map((x, k) => cartaPasso(x, id, k))];
        return [el("div", {class: "missao " + l.estado},
          el("span", {class: "nome-missao"}, nome), el("span", {}), el("span", {class: "situacao"}, SITUACAO[l.estado]),
          l.estado === "falhou" ? el("p", {class: "erro-missao"}, l.erro || "",
            el("button", {class: "botao secundario", type: "button", onclick: () => tentarLicao(id)}, "Tentar de novo")) : null)];
      })));
  return d;
}

const FILTROS = [["todas", "Todas", () => true], ["aviso", "Com aviso", comAviso],
                 ["pendentes", "Pendentes", q => q.estado === "pendente"],
                 ["aprovadas", "Aprovadas", q => q.estado === "aprovada"]];

function pintarFiltros(){
  const limpas = limpasPendentes().length;
  $("filtros").replaceChildren(...FILTROS.map(([k, nome, f]) =>
    el("button", {type: "button", "aria-pressed": String(filtro === k), onclick: () => { filtro = k; pintar(); }},
       nome + " · " + estado.questoes.filter(f).length)),
    ...(limpas ? [el("button", {type: "button", class: "lote", onclick: aprovarLimpas},
                         icone("check"), "Aprovar as " + limpas + " sem aviso")] : []));
}

function cartaLeitura(q, i){
  const missao = (estado.missoes.find(m => m.id === q.missao) || {}).nome || q.missao;
  const selo = {pendente: "Pendente", aprovada: "Aprovada", descartada: "Descartada"}[q.estado];
  const acoes = q.estado === "pendente"
    ? [el("button", {class: "botao primario", type: "button", disabled: grave(q), onclick: () => marcar(i, "aprovada"),
                     title: grave(q) ? "Corrija o problema antes de aprovar" : false}, "Aprovar"),
       el("button", {class: "botao secundario", type: "button", onclick: () => editar(i)}, "Editar"),
       el("button", {class: "botao discreto", type: "button", onclick: () => marcar(i, "descartada")}, "Descartar")]
    : [el("button", {class: "botao secundario", type: "button", onclick: () => marcar(i, "pendente")}, "Desfazer")];
  return el("article", {class: "carta " + q.estado, "data-i": i, "aria-label": "Questão " + (i + 1)},
    el("div", {class: "topo"}, el("span", {}, "Questão " + (i + 1) + " · " + missao + " · ",
       el("span", {class: "tipo-q"}, NOME_TIPO[tipoDe(q)])),
       el("span", {class: "selo"}, selo)),
    el("div", {class: "enunciado"}, q.enunciado),
    respostaLida(q),
    el("p", {class: "explica"}, q.explicacao),
    el("p", {class: "origem"}, el("b", {}, "Do material: "), "“" + q.trecho + "”"),
    (q.problemas || []).length ? el("ul", {class: "problemas"},
      q.problemas.map(p => el("li", {class: p.grave ? "grave" : ""}, icone("alerta"), el("span", {}, p.texto)))) : null,
    el("div", {class: "acoes"}, acoes));
}

/* A resposta de cada tipo, do jeito que a criança vai ver resolvida. */
function respostaLida(q){
  const certa = conteudo => el("li", {class: "certa"}, icone("check"),
    el("span", {}, el("span", {class: "so-leitor"}, "Certa: "), conteudo));
  const t = tipoDe(q);
  if(t === "vf") return el("ul", {class: "ops"},
    ["Verdadeiro", "Falso"].map((r, k) => (k === 0) === (q.verdadeira === true) ? certa(r)
      : el("li", {}, icone("xis"), el("span", {}, r))));
  if(t === "ligar") return el("ul", {class: "ops"}, (q.pares || []).map(([a, b]) =>
    certa([el("b", {}, a), el("span", {class: "seta", "aria-label": "liga com"}, "→"), b])));
  if(t === "ordenar") return el("ol", {class: "ops", "aria-label": "Na ordem certa"}, (q.sequencia || []).map((x, k) =>
    el("li", {class: "certa"}, el("span", {class: "num", "aria-hidden": "true"}, (k + 1) + "."), el("span", {}, x))));
  return el("ul", {class: "ops"}, certa(q.certa),
    q.erradas.map(e => el("li", {}, icone("xis"), el("span", {}, e))));
}

function cartaEdicao(q, i){
  const campo = (nome, rotulo, valor, area) => el("label", {}, rotulo,
    el(area ? "textarea" : "input", {name: nome, rows: area ? 3 : false, ...(area ? {} : {value: valor})}, area ? valor : null));
  const f = el("form", {class: "carta", "data-i": i, onsubmit: ev => { ev.preventDefault(); salvar(i, f); }},
    el("div", {class: "topo"}, el("span", {}, "Editando a questão " + (i + 1))),
    el("label", {}, "Missão", el("select", {name: "missao"}, estado.missoes.map(m =>
      el("option", {value: m.id, selected: m.id === q.missao}, m.nome)))),
    campo("enunciado", tipoDe(q) === "vf" ? "Afirmação" : "Enunciado", q.enunciado, true),
    camposResposta(q, campo),
    campo("explicacao", "Explicação", q.explicacao, true),
    campo("trecho", "Trecho do material, copiado letra por letra", q.trecho, true),
    el("div", {class: "acoes"}, el("button", {class: "botao primario", type: "submit"}, "Salvar"),
       el("button", {class: "botao discreto", type: "button", onclick: () => { editandoAgora = null; pintar(); }}, "Cancelar")));
  return f;
}

/* Os campos da resposta, por tipo. Par ou item deixado em branco sai ao salvar. */
function camposResposta(q, campo){
  const t = tipoDe(q);
  if(t === "vf") return el("label", {}, "A afirmação é", el("select", {name: "verdadeira"},
    el("option", {value: "sim", selected: q.verdadeira === true}, "Verdadeira"),
    el("option", {value: "nao", selected: q.verdadeira !== true}, "Falsa")));
  if(t === "ligar") return (q.pares || []).map(([a, b], k) => el("div", {class: "linha-par"},
    campo("termo" + k, "Termo " + (k + 1), a), campo("par" + k, "Liga com", b)));
  if(t === "ordenar") return (q.sequencia || []).map((x, k) => campo("item" + k, (k + 1) + "º", x));
  return [campo("certa", "Resposta certa", q.certa),
          ...q.erradas.map((e, k) => campo("errada" + k, "Errada " + (k + 1), e))];
}

/* `editandoAgora` sobrevive às repinturas: uma missão que chega no meio de
   uma edição não pode fechar o formulário e perder o que se digitou. */
function pintar(){
  if(!estado) return;
  if(etapa === 5) pintarCriando();
  const editando = editandoAgora;
  pintarResumo();
  pintarFiltros();
  const passa = FILTROS.find(([k]) => k === filtro)[2];
  // Na ordem das missões, sem mexer no índice de cada questão.
  const pos = id => { const k = estado.missoes.findIndex(m => m.id === id); return k < 0 ? 99 : k; };
  const cartas = estado.questoes.map((q, i) => [q, i])
    .sort((a, b) => pos(a[0].missao) - pos(b[0].missao) || a[1] - b[1])
    .filter(([q, i]) => i === editando || passa(q))
    .map(([q, i]) => i === editando ? cartaEdicao(q, i) : cartaLeitura(q, i));
  $("lista").replaceChildren(...(cartas.length ? cartas
    : estado.fila && !filaTerminou() ? Array.from({length: 3}, () => el("div", {class: "esqueleto"}))
    : [el("p", {class: "nota"}, "Nenhuma questão neste filtro.")]));
  const n = aprovadas().length, pend = estado.questoes.filter(q => q.estado === "pendente").length;
  $("baixar").disabled = !n;
  const vao = prontas().length, soltas = vao - n;
  $("salvar").disabled = !vao || gerando;
  $("salvar").querySelector("span").textContent = !vao ? "Nada para jogar ainda"
    : soltas ? "Pronto, jogar (" + vao + ")"
    : (estado.jogoId ? "Atualizar e jogar" : "Salvar e jogar") + " (" + n + ")";
  $("salvar").title = soltas ? "Aprova as " + soltas + " pendentes sem aviso e salva" : "";
  const esperam = comAvisoPendentes().length;
  $("resumoPe").textContent = esperam ? plural(esperam, "questão com aviso fica", "questões com aviso ficam") + " fora até você olhar."
    : pend ? plural(pend, "questão pendente", "questões pendentes") : "Tudo revisado.";
  // No celular o pé esconde o resumo; este aviso aparece mesmo assim.
  $("resumoPe").classList.toggle("importa", !!esperam);
  // Salvo, o jogo está na conta: descartar não faz sentido, começar outro faz.
  $("recomecar").hidden = !!estado.jogoId;
  $("outroJogo").hidden = !estado.jogoId;
  $("pe").hidden = etapa !== 3;
}

function editar(i){
  editandoAgora = i;
  pintar();
  const f = $("lista").querySelector("form");
  f && f.querySelector("textarea").focus();
}

function marcar(i, novo){
  if(novo === "aprovada" && grave(estado.questoes[i])) return;
  estado.questoes[i].estado = novo;
  guardar();
  remedir();
}

function aprovarLimpas(){
  limpasPendentes().forEach(q => { q.estado = "aprovada"; });
  guardar();
  remedir();
}

async function salvar(i, f){
  const v = n => f.elements[n].value.trim();
  const q = estado.questoes[i];
  editandoAgora = null;
  const t = tipoDe(q);
  Object.assign(q, {missao: v("missao"), enunciado: v("enunciado"),
                    explicacao: v("explicacao"), trecho: v("trecho"), estado: "pendente"});
  if(t === "escolha") Object.assign(q, {certa: v("certa"), erradas: q.erradas.map((_, k) => v("errada" + k))});
  if(t === "vf") q.verdadeira = v("verdadeira") === "sim";
  if(t === "ligar") q.pares = q.pares.map((_, k) => [v("termo" + k), v("par" + k)]).filter(([a, b]) => a || b);
  if(t === "ordenar") q.sequencia = q.sequencia.map((_, k) => v("item" + k)).filter(Boolean);
  guardar();
  await remedir();
}

/* A edição passa pela mesma conferência que o modelo passou. Sem servidor,
   a carta fica sem veredito em vez de parecer aprovada pela máquina. */
async function remedir(){
  const vs = vivas();
  pintar();
  try{
    const r = await chamarFuncao({acao: "medir", material: estado.pedido.material,
                                  missoes: estado.missoes, questoes: vs});
    vs.forEach((q, k) => { q.problemas = r.problemas[k]; if(grave(q) && q.estado === "aprovada") q.estado = "pendente"; });
    estado.lote = r.lote;
    recado("");
  }catch(e){
    recado("Não consegui reconferir: " + e.message, true);
  }
  guardar();
  pintar();
}

