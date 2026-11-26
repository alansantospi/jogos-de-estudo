/* ---------- meus jogos ---------- */

/* Portas para a conta, trocadas pelo teste. */
async function listarJogosConta(){
  const sb = await cliente();
  const {data, error} = await sb.from("jogos").select("id,titulo,materia,questoes,link,criado,atualizado,cor:conteudo->>cor")
    .order("atualizado", {ascending: false});
  if(error) throw new Error(error.message);
  return data;
}
async function lerJogoConta(id){
  const sb = await cliente();
  const {data, error} = await sb.from("jogos").select("id,titulo,materia,ano,material,conteudo").eq("id", id).single();
  if(error) throw new Error(error.message);
  return data;
}
/* Ligar o link sorteia um endereço novo; desligar o apaga. Quem abre o
   link lê pela função jogo_por_link, que não precisa de conta. */
async function mudarLinkConta(id, link){
  const sb = await cliente();
  const {error} = await sb.from("jogos").update({link}).eq("id", id);
  if(error) throw new Error(error.message);
}
async function apagarJogoConta(id){
  const sb = await cliente();
  const {error} = await sb.from("jogos").delete().eq("id", id);
  if(error) throw new Error(error.message);
}

const quando = t => t ? new Date(t).toLocaleDateString("pt-BR", {day: "2-digit", month: "2-digit", year: "numeric"}) : "";

async function listarMeus(){
  const caixa = $("listaMeus");
  let lista = lerDe("jogos_criados_v1");
  if(lista) pintarMeus(lista);
  else caixa.replaceChildren(el("div", {class: "esqueleto", style: "height:5rem"}), el("div", {class: "esqueleto", style: "height:5rem"}));
  try{
    lista = await listarJogosConta();
    guardarEm("jogos_criados_v1", lista);
    pintarMeus(lista);
  }catch(e){
    if(!lista) caixa.replaceChildren(el("p", {class: "nota"}, "Não consegui buscar os jogos: " + e.message));
  }
}

/* Apagar e trocar o rascunho pedem um segundo toque no próprio botão. */
const segundoToque = new Map();
function confirmar(chave, botao, texto){
  if(segundoToque.has(chave)){ clearTimeout(segundoToque.get(chave)); segundoToque.delete(chave); return true; }
  const antes = botao.textContent;
  botao.textContent = texto;
  segundoToque.set(chave, setTimeout(() => { segundoToque.delete(chave); botao.textContent = antes; }, 4000));
  return false;
}

function pintarMeus(lista){
  const caixa = $("listaMeus");
  if(!lista.length) return caixa.replaceChildren(el("div", {class: "vazio-meus"},
    el("p", {style: "margin:0 0 1rem"}, "Nenhum jogo ainda."),
    el("button", {class: "botao primario", type: "button", onclick: () => novoJogo()}, "Criar o primeiro")));
  caixa.replaceChildren(...lista.map(j => {
    const apagar = el("button", {class: "botao discreto perigo", type: "button"}, "Apagar");
    apagar.addEventListener("click", () => { if(confirmar("apagar" + j.id, apagar, "Toque de novo para apagar")) apagarJogo(j.id); });
    const editarB = el("button", {class: "botao secundario", type: "button"}, "Editar");
    editarB.addEventListener("click", () => editarJogo(j.id, editarB));
    const meta = [j.materia, j.questoes != null ? plural(j.questoes, "questão", "questões") : null,
                  "atualizado em " + quando(j.atualizado || j.criado)].filter(Boolean).join(" · ");
    const compartilhar = j.link ? null
      : el("button", {class: "botao secundario", type: "button"}, "Compartilhar");
    if(compartilhar) compartilhar.addEventListener("click", () => mudarLink(j, crypto.randomUUID(), compartilhar));
    return el("article", {class: "jogo-linha" + (estado && estado.jogoId === j.id ? " aberto" : ""), "data-id": j.id},
      el("div", {class: "nome-jogo"}, el("span", {class: "ponto", style: "--c:" + CORES_JOGO[corDoJogo(j)].valor, "aria-hidden": "true"}),
        el("div", {}, el("strong", {}, j.titulo), el("span", {class: "meta"}, meta))),
      el("div", {class: "acoes"},
        el("a", {class: "botao primario", href: "jogar.html?id=" + encodeURIComponent(j.id)}, "Jogar"),
        editarB, compartilhar, apagar),
      j.link ? linhaDoLink(j) : null);
  }));
}

/* O link é para a criança jogar no aparelho dela sem a senha da conta, ou
   para mandar a um colega. Quem tem o link joga; não edita, e do
   material vê só os trechos que as questões citam. */
const enderecoDoLink = link => new URL("jogar.html?l=" + link, location.href).href;
function linhaDoLink(j){
  const campo = el("input", {class: "campo-link", readonly: true, value: enderecoDoLink(j.link),
                             "aria-label": "Link de " + j.titulo, onfocus: e => e.target.select()});
  const copiar = el("button", {class: "botao secundario", type: "button"}, "Copiar");
  copiar.addEventListener("click", async () => {
    try{ await navigator.clipboard.writeText(campo.value); }
    catch(e){ campo.select(); document.execCommand("copy"); }
    copiar.textContent = "Copiado";
    setTimeout(() => { copiar.textContent = "Copiar"; }, 2000);
  });
  const qr = el("div", {class: "qr", hidden: true});
  const botaoQR = el("button", {class: "botao secundario", type: "button", "aria-expanded": "false"}, "QR code");
  botaoQR.addEventListener("click", async () => {
    const abrir = qr.hidden;
    qr.hidden = !abrir;
    botaoQR.setAttribute("aria-expanded", String(abrir));
    if(!abrir || qr.firstChild) return;
    qr.append(el("div", {class: "esqueleto", style: "height:12rem;width:12rem;margin:0"}));
    try{
      qr.replaceChildren(await desenharQR(campo.value));
    }catch(e){
      qr.replaceChildren(el("p", {}, "Não consegui desenhar o QR code. Copie o link e mande por mensagem."));
    }
  });
  const desligar = el("button", {class: "botao discreto", type: "button"}, "Desligar link");
  desligar.addEventListener("click", () => {
    if(confirmar("link" + j.id, desligar, "Toque de novo: o link para de abrir")) mudarLink(j, null, desligar);
  });
  return el("div", {class: "link-jogo"},
    el("p", {}, "Joga sem conta, não edita."),
    el("div", {class: "acoes"}, campo, copiar, botaoQR, desligar), qr);
}

/* O QR code do link: a biblioteca só carrega quando alguém pede. O desenho
   sai daqui, com elementos, e não do SVG em texto que ela oferece. */
const QR_LIB = "https://cdn.jsdelivr.net/npm/qrcode-generator@1.4.4/+esm";
async function carregarQR(){ return (await import(QR_LIB)).default; }
async function desenharQR(texto){
  const qrcode = await carregarQR();
  const q = qrcode(0, "M");
  q.addData(texto); q.make();
  const n = q.getModuleCount(), m = 3, lado = n + 2 * m;
  let d = "";
  for(let r = 0; r < n; r++) for(let c = 0; c < n; c++) if(q.isDark(r, c)) d += "M" + (c + m) + " " + (r + m) + "h1v1h-1z";
  const ns = "http://www.w3.org/2000/svg", svg = document.createElementNS(ns, "svg");
  svg.setAttribute("viewBox", "0 0 " + lado + " " + lado);
  svg.setAttribute("role", "img");
  svg.setAttribute("aria-label", "QR code do link do jogo");
  svg.setAttribute("shape-rendering", "crispEdges");
  const fundo = document.createElementNS(ns, "rect");
  fundo.setAttribute("width", lado); fundo.setAttribute("height", lado); fundo.setAttribute("fill", "#fff");
  const p = document.createElementNS(ns, "path");
  p.setAttribute("d", d); p.setAttribute("fill", "#000");
  svg.append(fundo, p);
  return svg;
}

async function mudarLink(j, link, botao){
  botao.classList.add("ocupado"); botao.disabled = true;
  try{
    await mudarLinkConta(j.id, link);
    const lista = (lerDe("jogos_criados_v1") || []).map(x => x.id === j.id ? {...x, link} : x);
    guardarEm("jogos_criados_v1", lista);
    pintarMeus(lista);
    if(estado && estado.jogoId === j.id){ estado.link = link; guardar(); if(etapa === 5) pintarCriando(); }
    recado(link ? "Link ligado. Copie e mande para quem vai jogar." : "Link desligado: o endereço antigo não abre mais.");
  }catch(e){
    recado("Não consegui mudar o link: " + e.message, true);
    botao.classList.remove("ocupado"); botao.disabled = false;
  }
}

/* Rascunho com questões que ainda não estão num jogo salvo custou dinheiro:
   trocá-lo por outro pede o segundo toque. */
const rascunhoSolto = () => estado && estado.questoes && estado.questoes.length && !estado.jogoId;

async function editarJogo(id, botao){
  if(estado && estado.jogoId !== id && rascunhoSolto()
     && !confirmar("editar" + id, botao, "Toque de novo: descarta o rascunho atual")) return;
  botao.classList.add("ocupado");
  try{
    const j = await lerJogoConta(id);
    const c = j.conteudo;
    editandoAgora = null; filtro = "todas";
    estado = {jogoId: j.id, lote: null, aviso: "", custo: null, restantes: estado ? estado.restantes : null,
              pedido: {titulo: j.titulo, materia: j.materia, ano: j.ano || "", material: j.material || "", paginas: [],
                       cor: Object.hasOwn(CORES_JOGO, c.cor) && c.cor !== corSugerida(j.materia, j.titulo) ? c.cor : ""},
              missoes: c.missoes.map(({id, nome}) => ({id, nome})),
              licao: (c.licao || []).reduce((o, x) => {
                (o[x.missao] ||= {estado: "pronta", passos: []}).passos.push({...x, problemas: [], fora: false});
                return o; }, {}),
              // Tipo que a revisão não edita (digitar, de jogo feito à mão) fica de fora.
              questoes: c.questoes.map(questaoDoConteudo).filter(Boolean)
                .map(q => ({...q, problemas: [], estado: "aprovada"}))};
    guardar();
    irPara(3);
    // Sem o material (jogo salvo antes de ele ser guardado), conferir o trecho
    // reprovaria tudo: fica sem reconferência.
    if(estado.pedido.material) await remedir(); else pintar();
  }catch(e){
    recado("Não consegui abrir o jogo: " + e.message, true);
  }finally{ botao.classList.remove("ocupado"); }
}

async function apagarJogo(id){
  try{
    await apagarJogoConta(id);
    try{
      localStorage.removeItem("jogo_gerado_" + id);
      guardarEm("jogos_criados_v1", (lerDe("jogos_criados_v1") || []).filter(j => j.id !== id));
    }catch(e){}
    // O rascunho aberto continua, agora sem jogo: salvar cria outro.
    if(estado && estado.jogoId === id){ estado.jogoId = null; guardar(); }
    recado("Jogo apagado.");
    listarMeus();
  }catch(e){
    recado("Não consegui apagar: " + e.message, true);
  }
}

function novoJogo(){
  if(estado && estado.acrescentar){ estado.acrescentar = false; guardar(); }
  largarSalvo();
  irPara(1);
}

/* Acrescentar: o material novo entra pelas etapas de sempre; as questões
   que o jogo já tem esperam na revisão e não são tocadas. */
function comecarAcrescentar(){
  estado.acrescentar = true;
  guardar();
  leitura = null; guardarLeitura(); pintarPaginas();
  $("material").value = ""; $("textoColado").value = "";
  $("titulo").value = estado.pedido.titulo; $("materia").value = estado.pedido.materia;
  $("cor").value = estado.pedido.cor || "";
  if(estado.pedido.ano) $("ano").value = estado.pedido.ano;
  contar(); guardarMaterial();
  irPara(1);
}

function pintarFaixas(){
  const ac = estado && estado.acrescentar;
  ["faixa1", "faixa2"].forEach(id => {
    const f = $(id);
    f.hidden = !ac;
    if(!ac) return;
    f.replaceChildren(icone("mais"), el("span", {}, "Acrescentando a “" + estado.pedido.titulo + "”"),
      el("button", {class: "botao discreto empurra", type: "button", style: "margin-left:auto",
                    onclick: () => { estado.acrescentar = false; guardar(); irPara(3); }}, "Cancelar"));
  });
}

/* Descartar pede um segundo toque, no próprio botão: a geração já foi paga
   e não volta, mas um diálogo por cima da tela seria peso demais. */
let confirmando = null;
function recomecar(){
  const b = $("recomecar");
  if(!confirmando){
    b.textContent = "Toque de novo para descartar";
    confirmando = setTimeout(() => { confirmando = null; b.textContent = "Descartar"; }, 4000);
    return;
  }
  clearTimeout(confirmando); confirmando = null; b.textContent = "Descartar";
  estado = null; guardar();
  irPara(2);
}

