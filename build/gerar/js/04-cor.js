/* ---------- a cor do jogo ---------- */

/* As cores, como bolinhas: rádio de verdade, para a seta do teclado andar
   entre elas. `atualizar` marca a atual sem refazer o grupo, para não
   tirar o foco de quem está escolhendo. */
function seletorCor(nome, aoEscolher, aoVoltar){
  const grupo = el("div", {class: "cores", role: "radiogroup", "aria-label": "Cor do jogo"},
    Object.entries(CORES_JOGO).map(([k, c]) => el("label", {class: "amostra", style: "--c:" + c.valor, title: c.nome},
      el("input", {type: "radio", name: nome, value: k, onchange: () => aoEscolher(k)}),
      el("span", {class: "so-leitor"}, c.nome), icone("check"))));
  const dica = el("p", {class: "cor-dica", "aria-live": "polite"});
  const caixa = el("div", {class: "escolha-cor"}, grupo, dica);
  caixa.atualizar = (k, auto) => {
    grupo.querySelectorAll("input").forEach(r => { r.checked = r.value === k; r.parentNode.classList.toggle("on", r.checked); });
    dica.replaceChildren(auto ? "" : el("button", {class: "link", type: "button", onclick: aoVoltar}, "Voltar à cor da matéria"));
  };
  return caixa;
}

/* Em branco, a cor segue a matéria (ou o nome); escolhida, fica. */
const corAtual = () => $("cor").value || corSugerida($("materia").value, $("titulo").value);
let corPedido = null;
function pintarCapa(){
  if(!corPedido) return;
  const k = corAtual();
  $("app").style.setProperty("--tom", CORES_JOGO[k].valor);
  corPedido.atualizar(k, !$("cor").value);
}
function escolherCor(k){ $("cor").value = k; pintarCapa(); guardarMaterial(); }

function pintarPaginas(){
  const caixa = $("paginas");
  caixa.replaceChildren();
  if(!leitura) return;
  if(leitura.aviso){
    const nada = leitura.paginas.every(p => p.legivel === "nao");
    caixa.append(el("div", {class: "aviso" + (nada ? " grave" : "")}, icone("alerta"), el("span", {}, leitura.aviso)));
  }
  const selo = {sim: "Lida", parcial: "Lida em parte", nao: "Não deu para ler"};
  caixa.append(el("div", {class: "paginas"}, leitura.paginas.map((p, i) => el("div", {class: "pagina " + p.legivel},
    el("input", {type: "checkbox", id: "pg" + i, checked: p.marcada, disabled: !p.texto,
      onchange: ev => { p.marcada = ev.target.checked; guardarLeitura(); aplicarPaginas(); }}),
    el("label", {for: "pg" + i}, p.nome + (p.pagina > 1 || /\.pdf$/i.test(p.nome) ? ", página " + p.pagina : "")),
    el("span", {class: "selo"}, selo[p.legivel]),
    p.motivo ? el("p", {class: "motivo"}, p.motivo) : null,
    p.texto ? el("details", {}, el("summary", {}, "Ver o texto lido"), el("pre", {}, p.texto)) : null,
    p.manuscrito ? el("p", {class: "mao"}, el("b", {}, "Escrito à mão, fica de fora: "), "“" + p.manuscrito + "”") : null))));
  const partes = [];
  if(leitura.custo != null) partes.push("A leitura custou " + dinheiro(leitura.custo));
  if(leitura.restantes != null) partes.push("restam " + leitura.restantes + " hoje");
  caixa.append(el("div", {class: "acoes", style: "margin-top:.5rem"},
    partes.length ? el("span", {class: "custo"}, partes.join(" · ") + ".") : null,
    el("button", {class: "botao discreto empurra", type: "button", onclick: () => {
      leitura = null; guardarLeitura(); pintarPaginas(); $("material").value = ""; contar(); guardarMaterial(); irPara(1);
    }}, "Descartar a leitura")));
}

function contar(){
  const n = $("material").value.trim().length;
  const fora = n > MATERIAL_MAX, curto = n < MATERIAL_MIN;
  $("contador").className = "contador" + (fora ? " fora" : "");
  $("contador").replaceChildren(
    el("span", {}, fora ? "Passou do limite: tire páginas ou divida em duas gerações."
                 : curto && n ? "Precisa de pelo menos " + MATERIAL_MIN + " caracteres." : ""),
    el("span", {}, n.toLocaleString("pt-BR") + " de " + MATERIAL_MAX.toLocaleString("pt-BR")));
  const marcadas = leitura ? leitura.paginas.filter(p => p.marcada).length : 0;
  $("resumoMaterial").textContent = n.toLocaleString("pt-BR") + " caracteres"
    + (leitura ? " de " + plural(marcadas, "página", "páginas") : "");
  // Recolhido quando está tudo bem; aberto quando é preciso mexer.
  if(fora || (curto && n)) $("caixaMaterial").open = true;
  const tipos = tiposEscolhidos();
  document.querySelectorAll("#pilulasTipos input").forEach(c => c.parentNode.classList.toggle("on", c.checked));
  $("botaoGerar").disabled = gerando || fora || curto || !tipos.length;
  const auto = automatico(), escolhida = Number($("quantidade").value) || 30;
  document.querySelectorAll("#pilulas input").forEach(r => {
    r.checked = r.value === $("quantidade").value;
    r.parentNode.classList.toggle("on", r.checked);
  });
  const cabem = sustenta(n), q = auto ? esperadas(n) : escolhida;
  const alem = !auto && !fora && n >= MATERIAL_MIN && q > cabem * 1.15;
  $("estimativa").className = "estimativa" + (alem ? " alem" : "");
  $("estimativa").textContent = fora || n < MATERIAL_MIN ? ""
    : auto ? "Umas " + q + " questões."
    : alem ? "Este material dá umas " + cabem + "."
    : "";
  $("botaoGerar").textContent = gerando ? "Criando..." : auto ? "Criar jogo" : "Criar jogo · " + q + " questões";
  $("resumoAjustar").textContent = [$("materia").value.trim(), auto ? "o material decide" : q + " questões", $("ano").value,
    resumoTipos(tipos)]
    .filter(Boolean).join(" · ");
  // Sem tipo marcado não há o que criar: o ajuste se abre para mostrar por quê.
  if(!tipos.length) $("ajustar").open = true;
  $("dicaGerar").textContent = estado && estado.acrescentar
      ? "Conta como outro jogo do dia."
    : estado && !estado.jogoId ? "Substitui as questões em revisão."
    : q > 20 ? (q > 100 ? "Uns 5 a 8 minutos." : q >= 60 ? "Uns 3 a 5 minutos." : "Uns 2 a 3 minutos.")
    : "";
  pintarCapa();
}

function guardarMaterial(){
  guardarEm(MATERIAL, {material: $("material").value, titulo: $("titulo").value, materia: $("materia").value,
                       cor: $("cor").value, ano: $("ano").value, quantidade: $("quantidade").value,
                       tipos: tiposEscolhidos()});
}
function lerMaterial(){
  const m = lerDe(MATERIAL);
  if(!m) return;
  ["material", "titulo", "materia", "cor", "ano", "quantidade"].forEach(k => { if(m[k] != null && m[k] !== "") $(k).value = m[k]; });
  if(!Object.hasOwn(CORES_JOGO, $("cor").value)) $("cor").value = "";
  // Os tipos são preferência de quem cria: ficam de um jogo para o outro.
  if(Array.isArray(m.tipos) && m.tipos.length)
    document.querySelectorAll("#pilulasTipos input").forEach(c => { c.checked = m.tipos.includes(c.value); });
}

/* Salvou: a próxima criação começa limpa. O ano fica, que é o mesmo aluno;
   o jogo salvo continua aberto na revisão, para "Atualizar" seguir valendo. */
function limparCriacao(){
  leitura = null; guardarLeitura();
  sugerido = {titulo: "", materia: ""};
  ["material", "textoColado", "titulo", "materia", "cor"].forEach(k => { $(k).value = ""; });
  $("quantidade").value = "auto";
  $("caixaMaterial").open = false;
  pintarPaginas(); pintarTexto(); contar();
  guardarMaterial();
}

async function pedir(ev){
  ev.preventDefault();
  // Nome e matéria podem ir em branco: o plano sugere os dois.
  // No automático, o teto vai para o plano, que decide pelo material.
  const auto = automatico(), total = auto ? TOTAL_MAX : Number($("quantidade").value);
  const pedido = {titulo: $("titulo").value.trim(), materia: $("materia").value.trim(), cor: $("cor").value,
                  ano: $("ano").value, total, material: $("material").value.trim(), tipos: tiposEscolhidos()};
  if(!pedido.tipos.length) return recado("Escolha pelo menos um tipo de questão.", true);
  // De que página veio cada questão: guardado agora, que a leitura pode mudar.
  if(leitura) pedido.paginas = leitura.paginas.filter(p => p.marcada)
    .map(p => ({nome: p.nome, pagina: p.pagina, texto: p.texto}));
  if(pedido.material.length > MATERIAL_MAX) return recado("O material passou do limite.", true);
  if(estado && estado.acrescentar){
    const ja = estado.questoes.filter(q => q.estado !== "descartada").length;
    const vem = auto ? esperadas(pedido.material.length) : total;
    if(estado.pedido.material.length + pedido.material.length > MATERIAL_JOGO_MAX || ja + vem > QUESTOES_JOGO_MAX)
      return recado("Este jogo já está no tamanho máximo. Crie um jogo novo para este material.", true);
  }

  gerando = true; contar();
  const anterior = estado;
  // Acrescentar: o jogo aberto continua, e as missões novas entram nele.
  const base = estado && estado.acrescentar ? estado : null;
  estado = null;
  if(!base){ irPara(5); pintarCriando(); }
  else irPara(3);
  $("resumo").replaceChildren();
  $("filtros").replaceChildren();
  $("lista").replaceChildren(...Array.from({length: 3}, () => el("div", {class: "esqueleto"})));
  $("pe").hidden = true;
  const parar = relogio("Dividindo em missões...", "");
  try{
    if(!base){
      // Jogo novo: o servidor conduz, e fechar a tela não para nada.
      let r;
      try{
        r = await chamarFuncao({acao: "criar", material: pedido.material, titulo: pedido.titulo,
                                materia: pedido.materia, cor: pedido.cor, ano: pedido.ano, total,
                                automatico: auto, paginas: pedido.paginas, tipos: pedido.tipos});
      }catch(e){
        // Outra criação em curso nesta conta: a tela passa a acompanhar aquela.
        if(e.codigo !== "em_curso" || !e.dados.fila) throw e;
        r = e.dados;
        recado("Já havia um jogo sendo criado nesta conta: é ele que aparece aqui.");
      }
      if(r.restantes != null) cota(r.restantes);
      estado = {pedido, fila: r.fila, criacao: r.criacao, plano: null, missoes: [], lote: null, aviso: "",
                custo: 0, custos: {}, recebidas: [], restantes: r.restantes, questoes: [], pedidas: auto ? null : total,
                partes: {}, licao: {}};
      filtro = "todas";
      guardar();
      await acompanhar(parar);
      return;
    }
    const ab = await chamarFuncao({acao: "abrir", total});
    cota(ab.restantes);
    const pl = await chamarFuncao({acao: "planejar", criacao: ab.criacao, material: pedido.material,
                                   materia: pedido.materia, ano: pedido.ano, total, automatico: auto});
    parar();
    if(!pedido.titulo){ pedido.titulo = pl.titulo || "Jogo sem nome"; $("titulo").value = pedido.titulo; }
    if(!pedido.materia){ pedido.materia = pl.materia || "Estudo"; $("materia").value = pedido.materia; }
    guardarMaterial();
    if(base){
      // Missão nova com id de uma que o jogo já tem viraria a mesma missão.
      const usados = new Set(base.missoes.map(m => m.id));
      pl.missoes.forEach(m => { let id = m.id, k = 2; while(usados.has(id)) id = m.id + "_" + k++; usados.add(id); m.id = id; });
      estado = {...base, acrescentar: false, fila: null, criacao: ab.criacao, plano: pl.missoes, materialNovo: pedido.material,
                pedido: {...base.pedido, titulo: pedido.titulo, materia: pedido.materia, cor: pedido.cor, ano: pedido.ano,
                         tipos: pedido.tipos,
                         material: (base.pedido.material ? base.pedido.material + "\n\n" : "") + pedido.material,
                         paginas: [...(base.pedido.paginas || []), ...(pedido.paginas || [])]},
                missoes: [...base.missoes, ...pl.missoes.map(({id, nome}) => ({id, nome}))],
                custo: (base.custo || 0) + pl.custo_usd, restantes: pl.restantes, lote: null, aviso: "", pedidas: auto ? null : total,
                partes: Object.fromEntries(pl.missoes.map(m => [m.id, {estado: "aguardando"}])),
                licao: {...(base.licao || {}), ...Object.fromEntries(pl.missoes.map(m => [m.id, {estado: "aguardando"}]))}};
    }else
    estado = {pedido, criacao: ab.criacao, plano: pl.missoes,
              missoes: pl.missoes.map(({id, nome}) => ({id, nome})), lote: null, aviso: "",
              custo: pl.custo_usd, restantes: pl.restantes, questoes: [], pedidas: auto ? null : total,
              partes: Object.fromEntries(pl.missoes.map(m => [m.id, {estado: "aguardando"}])),
              licao: Object.fromEntries(pl.missoes.map(m => [m.id, {estado: "aguardando"}]))};
    cota(pl.restantes);
    filtro = "todas";
    guardar();
    irPara(3, false);
    pintar();
    // As questões primeiro: são o que se revisa enquanto a lição se escreve.
    await gerarPartes([...pl.missoes.map(m => m.id), ...pl.missoes.map(m => "licao:" + m.id)]);
  }catch(e){
    parar();
    gerando = false;
    if(!estado) estado = anterior;
    contar();
    if(estado){ irPara(melhor(), false); pintar(); } else irPara(2);
    recado(e.message, true);
  }
}

