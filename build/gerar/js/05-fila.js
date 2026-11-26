/* ---------- a criação na fila ----------
   O servidor conduz (_esteira/fila.ts): a tela só olha, de tempos em
   tempos, o que mudou desde a última olhada. Fechou e voltou, retoma. */

let INTERVALO_FILA = 3000;
const esperar = ms => new Promise(ok => setTimeout(ok, ms));

/* Porta para o banco, trocada pelo teste. */
async function lerCriacao(id, desde){
  const sb = await cliente();
  // O pedido leva o material inteiro: vem só na primeira olhada.
  const c = await sb.from("criacoes").select("id,geracao,estado,plano,jogo,erro,titulo:pedido->>titulo,materia:pedido->>materia"
    + (desde ? "" : ",pedido")).eq("id", id).single();
  if(c.error) throw new Error(c.error.message);
  let q = sb.from("tarefas").select("id,tipo,alvo,estado,resultado,erro,custo_usd,atualizado")
    .eq("criacao", id).order("atualizado");
  if(desde) q = q.gte("atualizado", desde);
  const t = await q;
  if(t.error) throw new Error(t.error.message);
  return {criacao: c.data, tarefas: t.data};
}

const SITUACAO_FILA = {fila: "aguardando", fazendo: "escrevendo", falhou: "falhou"};
const filaTerminou = () => estado && ["pronta", "falhou"].includes(estado.filaEstado);

/* O que chegou entra no rascunho de sempre: as missões em `partes`, as
   lições em `licao`, as questões na revisão. Questão só entra uma vez. */
function aplicarCriacao({criacao: c, tarefas}){
  const e = estado;
  e.pedido = {...e.pedido, ...(c.pedido || {})};
  if(c.titulo) e.pedido.titulo = c.titulo;
  if(c.materia) e.pedido.materia = c.materia;
  e.criacao = c.geracao;
  if(c.plano && !e.plano){
    e.plano = c.plano;
    e.missoes = c.plano.map(({id, nome}) => ({id, nome}));
    e.partes = Object.fromEntries(c.plano.map(m => [m.id, {estado: "aguardando"}]));
    e.licao = Object.fromEntries(c.plano.map(m => [m.id, {estado: "aguardando"}]));
    // Nome e matéria em branco: o plano sugeriu.
    if(!$("titulo").value.trim()) $("titulo").value = e.pedido.titulo || "";
    if(!$("materia").value.trim()) $("materia").value = e.pedido.materia || "";
    guardarMaterial();
  }
  for(const t of tarefas){
    if(!e.visto || t.atualizado > e.visto) e.visto = t.atualizado;
    e.custos[t.id] = Number(t.custo_usd) || 0;
    if(t.tipo === "planejar") continue;
    const onde = t.tipo === "missao" ? e.partes : e.licao;
    if(t.estado !== "feita"){ onde[t.alvo] = {estado: SITUACAO_FILA[t.estado], erro: t.erro || ""}; continue; }
    if(e.recebidas.includes(t.id)) continue;
    e.recebidas.push(t.id);
    const r = t.resultado || {};
    if(t.tipo === "missao"){
      e.questoes.push(...(r.questoes || []).map(q => ({...q, estado: "pendente"})));
      onde[t.alvo] = {estado: "pronta", n: (r.questoes || []).length, aviso: r.aviso || ""};
    }else onde[t.alvo] = {estado: "pronta", aviso: r.aviso || "", passos: r.passos || []};
  }
  e.custo = Object.values(e.custos).reduce((a, b) => a + b, 0);
  e.filaEstado = c.estado;
  e.filaErro = c.erro || "";
  // O servidor salvou: o que estava pronto foi para o jogo, como em "Pronto, jogar".
  if(c.jogo && e.jogoId !== c.jogo){
    e.jogoId = c.jogo;
    prontas().forEach(q => { q.estado = "aprovada"; });
    lembrarJogo(c.jogo, montarConteudo());
    limparCriacao();
  }
}

let olhando = null;
function acompanhar(parar){
  if(olhando) return olhando;
  const fila = estado.fila;
  gerando = true; contar();
  if(etapa !== 3) irPara(5, false);
  pintar();
  olhando = (async () => {
    let semNoticia = 0;
    try{
      while(estado && estado.fila === fila){
        let r;
        try{
          r = await lerCriacao(fila, estado.visto);
          semNoticia = 0;
        }catch(e){
          if(++semNoticia >= 3) recado("Sem notícia do servidor (" + e.message + "). O jogo continua sendo criado; volte depois.", true);
          await esperar(INTERVALO_FILA * 2);
          continue;
        }
        if(!estado || estado.fila !== fila) break;
        aplicarCriacao(r);
        if(estado.plano && parar){ parar(); parar = null; }
        guardar();
        pintar();
        if(filaTerminou()) break;
        if(semNoticia === 0) recado("");
        await esperar(INTERVALO_FILA);
      }
    }finally{
      if(parar) parar();
      olhando = null;
      gerando = false;
      contar();
    }
    if(!estado || estado.fila !== fila) return;
    if(estado.filaEstado === "falhou" && !estado.plano){
      // O plano não veio: volta ao material, que continua lá.
      const erro = estado.filaErro || "O jogo não pôde ser criado.";
      estado = null; guardar();
      irPara(2);
      return recado(erro, true);
    }
    recado(estado.filaErro || "", !!estado.filaErro);
    await remedir();
  })();
  return olhando;
}

/* Criando: a capa do jogo e o andamento. Pronto: Jogar, e o resto como
   opção — compartilhar, revisar, tentar de novo o que não veio. */
function pintarCriando(){
  const e = estado;
  const p = e ? e.pedido : {titulo: $("titulo").value.trim(), materia: $("materia").value.trim(), cor: $("cor").value};
  const k = Object.hasOwn(CORES_JOGO, p.cor) ? p.cor : corSugerida(p.materia || "", p.titulo || "");
  $("criando").style.setProperty("--tom", CORES_JOGO[k].valor);
  $("prontaMateria").textContent = p.materia || "";
  $("prontaNome").textContent = p.titulo || "Seu jogo";
  const caixa = $("andamento");
  const missoes = e ? Object.entries(e.partes || {}) : [], licoes = e ? Object.entries(e.licao || {}) : [];
  if(!e || !filaTerminou()){
    const feitas = missoes.filter(([, x]) => x.estado === "pronta").length;
    const licoesFeitas = licoes.filter(([, x]) => x.estado === "pronta").length;
    const total = missoes.length + licoes.length, pronto = feitas + licoesFeitas;
    $("tituloCriando").textContent = "Criando o jogo";
    return caixa.replaceChildren(
      el("div", {class: "andamento" + (total ? "" : " indeterminado"), role: "progressbar", "aria-label": "Andamento",
                 "aria-valuemin": "0", "aria-valuemax": String(total || 1), "aria-valuenow": String(pronto)},
        el("span", {style: total ? "width:" + Math.round(100 * pronto / total) + "%" : ""})),
      el("p", {class: "andamento-texto"}, !e || !e.plano ? "Dividindo o material em missões..."
        : feitas < missoes.length ? feitas + " de " + plural(missoes.length, "missão", "missões")
        : "Escrevendo a lição"),
      el("p", {class: "pode-fechar"}, "Pode fechar. O jogo fica em Meus jogos quando ficar pronto."));
  }
  $("tituloCriando").textContent = "Jogo pronto";
  const naoVieram = [...missoes.filter(([, x]) => x.estado === "falhou").map(([id]) => ["missao", id]),
                     ...licoes.filter(([, x]) => x.estado === "falhou").map(([id]) => ["licao", id])];
  const nMissoes = naoVieram.filter(([t]) => t === "missao").length;
  const comAviso = comAvisoPendentes().length, novas = e.jogoId ? limpasPendentes().length : 0;
  let compartilhar = null;
  if(e.jogoId && !e.link){
    compartilhar = el("button", {class: "botao secundario", type: "button"}, "Compartilhar");
    compartilhar.addEventListener("click", () => mudarLink({id: e.jogoId, titulo: p.titulo}, crypto.randomUUID(), compartilhar));
  }
  // replaceChildren escreveria "null" como texto: as partes ausentes saem antes.
  caixa.replaceChildren(...[
    e.jogoId ? el("a", {class: "botao primario grande jogar", href: "jogar.html?id=" + encodeURIComponent(e.jogoId)}, "Jogar")
      : el("p", {class: "nota"}, e.filaErro || "Nenhuma questão passou sem aviso. Revise para montar o jogo."),
    el("div", {class: "acoes"}, compartilhar,
      el("button", {class: "botao " + (e.jogoId ? "secundario" : "primario"), type: "button", onclick: () => irPara(3)},
        comAviso ? "Revisar · " + comAviso + " com aviso" : "Revisar"),
      el("button", {class: "botao discreto", type: "button", onclick: novoJogo}, "Novo jogo")),
    e.jogoId && e.link ? linhaDoLink({id: e.jogoId, titulo: p.titulo, link: e.link}) : null,
    novas ? el("p", {class: "falta-pronto"}, plural(novas, "questão nova ficou", "questões novas ficaram") + " fora do jogo.",
      el("button", {class: "botao secundario", type: "button", onclick: salvarJogo}, "Pôr no jogo")) : null,
    naoVieram.length ? el("p", {class: "falta-pronto"},
      nMissoes ? plural(nMissoes, "missão não veio", "missões não vieram") + "." : "A lição de " + plural(naoVieram.length, "missão", "missões") + " não veio.",
      el("button", {class: "botao secundario", type: "button", onclick: tentarFaltas}, "Tentar de novo")) : null]
    .filter(Boolean));
}

async function tentarFaltas(){
  const faltas = [...Object.entries(estado.partes).filter(([, x]) => x.estado === "falhou").map(([id]) => ["missao", id]),
                  ...Object.entries(estado.licao).filter(([, x]) => x.estado === "falhou").map(([id]) => ["licao", id])];
  for(const [tipo, id] of faltas) await tentarNaFila(tipo, id);
}

/* Tentar de novo dentro da fila: a tarefa volta, e a tela volta a olhar. */
async function tentarNaFila(tipo, id){
  const onde = tipo === "missao" ? estado.partes : estado.licao;
  onde[id] = {estado: "aguardando"};
  pintarResumo();
  try{
    await chamarFuncao({acao: "tentar", fila: estado.fila, tipo, alvo: id});
    estado.filaEstado = "escrevendo";
    guardar();
    acompanhar();
  }catch(e){
    onde[id] = {estado: "falhou", erro: e.message};
    pintar();
    recado(e.message, true);
  }
}

/* As missões saem em paralelo, de PARALELO em PARALELO, e cada uma entra
   na revisão assim que chega: dá para começar a revisar a primeira
   enquanto as outras se escrevem. A lição de cada missão é outro pedido da
   mesma fila, com o id "licao:<missão>". */
let filaAtual = null;
async function gerarPartes(ids){
  gerando = true; contar();
  const fila = filaAtual = [...ids], t0 = Date.now();
  const placar = () => {
    const ps = [...Object.values(estado.partes || {}), ...Object.values(estado.licao || {})];
    const prontas = ps.filter(p => p.estado === "pronta").length;
    recado("Escrevendo as missões e a lição: " + prontas + " de " + ps.length + " prontas · "
           + Math.round((Date.now() - t0) / 1000) + " s");
  };
  placar();
  const relogioPartes = setInterval(placar, 1000);
  const trabalhador = async () => {
    while(fila.length){ const id = fila.shift(); await (id.startsWith("licao:") ? gerarLicao(id.slice(6)) : gerarParte(id)); }
  };
  try{
    await Promise.all(Array.from({length: Math.min(PARALELO, ids.length)}, trabalhador));
  }finally{
    clearInterval(relogioPartes);
    filaAtual = null;
    gerando = false;
    contar();
  }
  const falhas = Object.values(estado.partes || {}).filter(p => p.estado === "falhou").length;
  const semLicao = Object.values(estado.licao || {}).filter(p => p.estado === "falhou").length;
  recado([falhas ? plural(falhas, "missão não veio", "missões não vieram") + ". Tente de novo na lista de missões, acima." : "",
          semLicao ? plural(semLicao, "lição de missão não veio", "lições de missão não vieram") + ". Tente de novo em Lição, acima." : ""]
         .filter(Boolean).join(" "), !!(falhas || semLicao));
  await remedir();
}

async function gerarParte(id){
  const m = estado.plano.find(x => x.id === id), p = estado.pedido;
  estado.partes[id] = {estado: "escrevendo"};
  pintarResumo();
  try{
    // Ao acrescentar, as missões novas saem só do material novo.
    const r = await chamarFuncao({acao: "gerar", criacao: estado.criacao, material: estado.materialNovo || p.material,
      titulo: p.titulo, materia: p.materia, ano: p.ano, quantidade: m.quantidade,
      missoes: estado.plano, alvo: id, tipos: p.tipos});
    estado.questoes.push(...r.questoes.map(q => ({...q, estado: "pendente"})));
    estado.custo = (estado.custo || 0) + (r.custo_usd || 0);
    if(r.restantes != null){ estado.restantes = r.restantes; cota(r.restantes); }
    estado.partes[id] = {estado: "pronta", n: r.questoes.length, aviso: r.aviso || ""};
  }catch(e){
    estado.custo = (estado.custo || 0) + (e.custo || 0);
    estado.partes[id] = {estado: "falhou", erro: e.message};
  }
  guardar();
  pintar();
}

async function gerarLicao(id){
  const p = estado.pedido;
  estado.licao[id] = {estado: "escrevendo"};
  pintarResumo();
  try{
    const r = await chamarFuncao({acao: "licao", criacao: estado.criacao, material: estado.materialNovo || p.material,
      materia: p.materia, ano: p.ano, missoes: estado.plano || estado.missoes, alvo: id});
    estado.custo = (estado.custo || 0) + (r.custo_usd || 0);
    if(r.restantes != null){ estado.restantes = r.restantes; cota(r.restantes); }
    // Passo que não se conferiu contra o material já chega fora da lição.
    estado.licao[id] = {estado: "pronta", aviso: r.aviso || "",
      passos: r.passos.map(x => ({...x, fora: x.problemas.some(y => y.grave)}))};
  }catch(e){
    estado.custo = (estado.custo || 0) + (e.custo || 0);
    estado.licao[id] = {estado: "falhou", erro: e.message};
  }
  guardar();
  pintar();
}

async function tentarLicao(id){
  if(estado.fila) return tentarNaFila("licao", id);
  estado.licao[id] = {estado: "aguardando"};
  pintarResumo();
  if(filaAtual) filaAtual.push("licao:" + id);
  else await gerarPartes(["licao:" + id]);
}

/* Jogo salvo sem lição (feito antes dela existir): ela é escrita agora,
   com o material guardado. Abre uma criação, e por isso conta no dia. */
async function criarLicao(){
  const total = Math.min(TOTAL_MAX, Math.max(TOTAL_MIN, vivas().length));
  try{
    const ab = await chamarFuncao({acao: "abrir", total});
    cota(ab.restantes);
    estado.criacao = ab.criacao;
    estado.fila = null;
    estado.restantes = ab.restantes;
    estado.licao = Object.fromEntries(estado.missoes.map(m => [m.id, {estado: "aguardando"}]));
    guardar();
    await gerarPartes(estado.missoes.map(m => "licao:" + m.id));
  }catch(e){
    recado(e.message, true);
  }
}

/* Com a fila andando, a missão volta para o fim dela; parada, abre outra. */
async function tentarDeNovo(id){
  if(estado.fila) return tentarNaFila("missao", id);
  estado.partes[id] = {estado: "aguardando"};
  pintarResumo();
  if(filaAtual) filaAtual.push(id);
  else await gerarPartes([id]);
}

