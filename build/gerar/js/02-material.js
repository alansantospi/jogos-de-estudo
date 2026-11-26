/* ---------- 1. material ---------- */

function aba(qual){
  const fotos = qual === "fotos";
  $("abaFotos").setAttribute("aria-selected", fotos);
  $("abaTexto").setAttribute("aria-selected", !fotos);
  $("painelFotos").hidden = !fotos;
  $("painelTexto").hidden = fotos;
}

const ACEITOS = /^(image\/(jpeg|png|webp|gif|heic|heif)|application\/pdf)$/;
function adicionar(lista){
  const novos = [...lista].filter(f => ACEITOS.test(f.type) || /\.(heic|heif)$/i.test(f.name));
  const fora = lista.length - novos.length;
  for(const f of novos){
    if(escolhidos.some(x => x.f.name === f.name && x.f.size === f.size)) continue;
    escolhidos.push({f, url: f.type.startsWith("image/") ? URL.createObjectURL(f) : null});
  }
  if(escolhidos.length > ARQUIVOS_MAX){
    escolhidos.splice(ARQUIVOS_MAX).forEach(x => x.url && URL.revokeObjectURL(x.url));
    recado("Ficaram os " + ARQUIVOS_MAX + " primeiros: o limite é " + ARQUIVOS_MAX + " páginas por leitura.", true);
  }else if(fora) recado(plural(fora, "arquivo não é foto nem PDF", "arquivos não são foto nem PDF") + " e ficou de fora.", true);
  else recado("");
  $("arquivos").value = ""; $("fotografar").value = "";
  pintarEscolhidos();
  // A última foto à vista, com o botão de ler logo abaixo dela.
  const ultima = $("miniaturas").lastElementChild;
  if(ultima && ultima.scrollIntoView) ultima.scrollIntoView({block: "nearest", behavior: "smooth"});
}

function tirar(i){
  const [x] = escolhidos.splice(i, 1);
  if(x.url) URL.revokeObjectURL(x.url);
  pintarEscolhidos();
}

function pintarEscolhidos(){
  const n = escolhidos.length;
  $("solta").classList.toggle("cheia", n > 0);
  const toque = window.matchMedia && matchMedia("(pointer:coarse)").matches;
  $("soltaTitulo").textContent = n ? "Adicionar mais" : toque ? "Ou escolha da galeria, ou um PDF" : "Escolha fotos ou um PDF";
  $("cameraRotulo").textContent = n ? "Mais uma página" : "Fotografar página";
  $("camera").classList.toggle("primario", !n);
  $("camera").classList.toggle("secundario", !!n);
  $("miniaturas").replaceChildren(...escolhidos.map((x, i) => el("li", {class: lendo ? "lendo" : ""},
    el("div", {class: "quadro"}, x.url ? el("img", {src: x.url, alt: ""}) : icone("livro"),
      el("button", {class: "tirar", type: "button", "aria-label": "Tirar " + x.f.name,
                    onclick: () => tirar(i)}, icone("xis"))),
    el("span", {class: "nome", title: x.f.name}, x.f.name))));
  $("botaoLer").disabled = !n || lendo;
  $("botaoLer").classList.toggle("ocupado", lendo);
  $("botaoLer").textContent = lendo ? "Lendo..." : $("conferirAntes").checked && n ? "Ler " + plural(n, "página", "páginas") : "Criar jogo";
}

const base64 = blob => new Promise((ok, falha) => {
  const r = new FileReader();
  r.onload = () => ok(String(r.result).replace(/^data:[^,]*,/, ""));
  r.onerror = () => falha(r.error);
  r.readAsDataURL(blob);
});

/* Foto de celular tem 3 a 5 MB; reduzida, ~300 KB. createImageBitmap já
   endireita pela orientação gravada na foto. */
async function prepararArquivo(f){
  if(f.type === "application/pdf"){
    if(f.size > PDF_BYTES_MAX) throw new Error("“" + f.name + "” tem " + (f.size / 1e6).toFixed(1)
      + " MB; o limite de PDF é 8 MB. Mande só as páginas da matéria.");
    return {nome: f.name, tipo: f.type, dados: await base64(f)};
  }
  let img;
  try{ img = await createImageBitmap(f); }
  catch(e){ throw new Error("Não consegui abrir “" + f.name + "”. Se for foto do iPhone (HEIC), "
                            + "exporte como JPEG ou mande pelo próprio celular."); }
  const k = Math.min(1, FOTO_LADO / Math.max(img.width, img.height));
  const c = document.createElement("canvas");
  c.width = Math.round(img.width * k); c.height = Math.round(img.height * k);
  c.getContext("2d").drawImage(img, 0, 0, c.width, c.height);
  img.close && img.close();
  const blob = await new Promise(ok => c.toBlob(ok, "image/jpeg", 0.85));
  return {nome: f.name, tipo: "image/jpeg", dados: await base64(blob)};
}

/* As fotos vão de LOTE em LOTE; cada PDF vai sozinho, e a resposta diz
   quantas páginas ele tem: as que passam de LOTE voltam à fila. */
function lotes(arquivos){
  const out = [];
  let fotos = [];
  for(const a of arquivos){
    if(a.tipo === "application/pdf"){
      if(fotos.length){ out.push(fotos); fotos = []; }
      out.push([a]);
    }else if(fotos.push(a) === LOTE){ out.push(fotos); fotos = []; }
  }
  if(fotos.length) out.push(fotos);
  return out;
}

/* A primeira chamada é a leitura do dia, e vai sozinha: dela sai o número
   a que as outras se prendem, para não gastar outra leitura. As outras vão
   de duas em duas. Lote que falha depois da primeira não derruba o resto:
   suas páginas chegam ilegíveis, com o motivo, como página que não deu. */
async function lerEmLotes(arquivos){
  const fila = lotes(arquivos).map((arqs, k) => ({arqs, k, inicio: 0}));
  const lidos = [];
  let leituraId = null, custo = 0, restantes = null;
  const ler = async t => {
    try{
      const r = await chamarFuncao({acao: "ler", arquivos: t.arqs, inicio: t.inicio, leitura: leituraId});
      custo += r.custo_usd || 0;
      if(r.restantes != null) restantes = r.restantes;
      lidos.push({t, paginas: r.paginas});
      if(t.inicio === 0) for(let i = LOTE; i < (r.total || 0); i += LOTE) fila.push({arqs: t.arqs, k: t.k, inicio: i, total: r.total});
      return r;
    }catch(e){
      custo += e.custo || 0;
      if(leituraId === null) throw e;
      const motivo = "A leitura deste lote falhou: " + e.message;
      const pdf = t.arqs[0].tipo === "application/pdf";
      const paginas = pdf
        ? Array.from({length: t.total ? Math.min(LOTE, t.total - t.inicio) : 1}, (_, j) => ({nome: t.arqs[0].nome, pagina: t.inicio + j + 1}))
        : t.arqs.map(a => ({nome: a.nome, pagina: 1}));
      lidos.push({t, paginas: paginas.map(p => ({...p, legivel: "nao", motivo, texto: "", manuscrito: ""}))});
    }
  };
  leituraId = (await ler(fila.shift())).leitura;
  const trabalhador = async () => { while(fila.length) await ler(fila.shift()); };
  await Promise.all([trabalhador(), trabalhador()]);

  const paginas = lidos.sort((a, b) => a.t.k - b.t.k || a.t.inicio - b.t.inicio).flatMap(x => x.paginas);
  const ruins = paginas.filter(p => p.legivel === "nao").length;
  return {paginas, custo_usd: custo, restantes,
    aviso: ruins === paginas.length ? "Nenhuma página deu para ler. Fotografe de novo, de frente, com luz e a página inteira no quadro."
         : ruins ? ruins + " de " + paginas.length + " páginas não deram para ler e ficaram desmarcadas." : ""};
}

async function lerArquivos(){
  if(!escolhidos.length || lendo) return;
  lendo = true;
  pintarEscolhidos();
  let parar = () => {};
  try{
    recado("Preparando as fotos...");
    const arquivos = [];
    for(const x of escolhidos) arquivos.push(await prepararArquivo(x.f));
    parar = relogio("Lendo as páginas...", "");
    const r = await lerEmLotes(arquivos);
    parar();
    recado("");
    escolhidos.forEach(x => x.url && URL.revokeObjectURL(x.url));
    escolhidos = [];
    mostrarLeitura(r);
    seguir();
  }catch(e){
    parar();
    recado(e.message, true);
  }finally{
    lendo = false;
    pintarEscolhidos();
  }
}

/* O botão só liga com o mínimo, em vez de reclamar depois do toque. */
function pintarTexto(){
  const n = $("textoColado").value.trim().length;
  $("continuarTexto").disabled = n < MATERIAL_MIN;
  $("contadorTexto").replaceChildren(
    el("span", {}, n && n < MATERIAL_MIN ? "Faltam " + (MATERIAL_MIN - n) + " caracteres para um jogo." : ""),
    el("span", {}, n ? n.toLocaleString("pt-BR") + " caracteres" : ""));
}

/* A primeira linha, quando tem cara de título: curta, sem pontuação no fim. */
function tituloDoTexto(t){
  const l = (String(t).split("\n").map(x => x.trim()).find(Boolean) || "").replace(/^#+\s*/, "");
  return l.length >= 3 && l.length <= 70 && l.split(/\s+/).length <= 10 && !/[.,;:!?]$/.test(l) ? l : "";
}

/* O jogo salvo já está na conta: material novo começa outro, sem ele. */
function largarSalvo(){
  if(estado && estado.jogoId && !estado.acrescentar){ estado = null; guardar(); }
}

function continuarTexto(){
  const t = $("textoColado").value.trim();
  if(t.length < MATERIAL_MIN) return recado("O texto tem " + t.length + " caracteres. Cole pelo menos "
    + MATERIAL_MIN + ": menos que isso não sustenta um jogo.", true);
  recado("");
  largarSalvo();
  leitura = null; guardarLeitura();
  $("material").value = t;
  aplicarSugestao(tituloDoTexto(t), "", "da primeira linha do texto");
  pintarPaginas(); contar(); guardarMaterial();
  irPara(2);
  seguir();
}

/* Um toque: lido o material, o jogo já vai para a fila. Fica na conferência
   quem pediu para conferir, e o material que não serve como está (nada
   lido, curto ou longo demais), que é onde dá para arrumar. */
function seguir(){
  const n = $("material").value.trim().length;
  if($("conferirAntes").checked || n < MATERIAL_MIN || n > MATERIAL_MAX) return;
  $("pedido").requestSubmit();
}

