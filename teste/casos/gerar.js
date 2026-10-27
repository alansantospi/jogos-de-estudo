/* A tela de revisão da esteira, com a função de servidor trocada por um
   dublê: o que se cobra é o lado da pessoa — aprovar, editar, descartar —
   e que o arquivo baixado esteja no esquema de conteudo/. */
const falhas = [];
localStorage.clear();
await espere(() => typeof mostrar === "function");

const pedidos = [];
let proximoMedir = null;
window.chamarFuncao = async corpo => {
  pedidos.push(corpo);
  if (corpo.acao !== "medir") throw new Error("o caso só espera medir");
  return proximoMedir ? proximoMedir(corpo) : {problemas: corpo.questoes.map(() => []), lote: null};
};

const base = {missao: "setores", icone: "trabalho", explicacao: "A indústria transforma.",
  certa: "Transforma matéria-prima", erradas: ["Retira da natureza", "Vende na loja", "Presta serviço"],
  trecho: "O setor secundário transforma a matéria-prima em produtos", rodada: 0, problemas: []};
mostrar({
  missoes: [{id: "setores", nome: "Os três setores"}],
  questoes: [
    {...base, enunciado: "O que faz o setor secundário?"},
    {...base, enunciado: "Questão com defeito", erradas: ["Transforma matéria-prima", "Vende na loja", "Presta serviço"],
     problemas: [{grave: true, texto: "A resposta certa aparece também entre as erradas."}]},
    {...base, enunciado: "<img src=x onerror=\"window.__xss=1\">Pergunta com HTML",
     problemas: [{grave: false, texto: "A certa é bem mais longa que as outras: quem escolhe a maior acerta sem saber."}]},
  ],
  lote: {n: 3, sempreAMaior: 33.3, sempreAMenor: 0, eliminarAbsolutos: 33.3, seguirOEco: 25,
         amostraPequena: true, fora: []},
  custo_usd: 0.1834, restantes: 9, rodadas: 1,
}, {titulo: "Os três setores", materia: "Geografia", ano: "4º ano", quantidade: 3,
    material: "O setor secundário transforma a matéria-prima em produtos nas indústrias."});

const cartas = () => [...document.querySelectorAll("#lista .carta")];
const botao = (i, rotulo) => [...cartas()[i].querySelectorAll("button")].find(b => b.textContent === rotulo);

/* 1. o que chegou aparece, e o que é grave não se aprova */
if (cartas().length !== 3) falhas.push("esperava 3 cartas, vieram " + cartas().length);
if (!botao(1, "Aprovar").disabled) falhas.push("questão com problema grave pode ser aprovada");
if (botao(2, "Aprovar").disabled) falhas.push("aviso que não é grave impediu aprovar");
if (!/aparece também entre as erradas/.test(cartas()[1].innerText)) falhas.push("o problema grave não aparece na carta");
if (!/Do material/.test(cartas()[0].innerText)) falhas.push("a carta não mostra o trecho de origem");
if (!/US\$ 0,18 · restam 9 hoje/.test($("resumo").innerText)) falhas.push("custo e limite não aparecem: " + $("resumo").innerText);
if (!/ainda é ruído/.test($("resumo").innerText)) falhas.push("amostra pequena não é explicada");

/* 2. o texto do modelo entra como texto, nunca como HTML */
if (document.querySelector("#lista img") || window.__xss) falhas.push("HTML vindo do modelo foi interpretado");
if (!/<img src=x/.test(cartas()[2].innerText)) falhas.push("o texto com sinais de HTML sumiu da carta");

/* 3. aprovar reconfere e conta */
botao(0, "Aprovar").click();
await espere(() => pedidos.length === 1);
await espere(() => /e jogar \(1\)/.test($("salvar").textContent));
if ($("baixar").disabled) falhas.push("com uma aprovada, baixar continua desligado");

/* 4. editar: a pessoa corrige e a carta passa pela mesma conferência */
botao(1, "Editar").click();
const f = cartas()[1];
if (f.tagName !== "FORM") falhas.push("editar não abriu o formulário");
f.elements.errada0.value = "Retira da natureza";
f.querySelector("button[type=submit]").click();
await espere(() => pedidos.length === 2);
await espere(() => cartas()[1].tagName === "ARTICLE");
if (botao(1, "Aprovar").disabled) falhas.push("depois de corrigida, a questão continua sem poder aprovar");
if (estado.questoes[1].erradas[0] !== "Retira da natureza") falhas.push("a edição não foi guardada");

/* 5. descartada sai da medida */
botao(2, "Descartar").click();
await espere(() => pedidos.length === 3);
if (pedidos[2].questoes.length !== 2) falhas.push("a descartada ainda foi medida: " + pedidos[2].questoes.length);

/* 6. se a reconferência achar problema grave, a aprovação cai */
proximoMedir = c => ({problemas: c.questoes.map((q, k) => k === 0
  ? [{grave: true, texto: "O trecho citado não está no material, ou é curto demais para conferir."}] : []), lote: null});
botao(1, "Aprovar").click();
await espere(() => pedidos.length === 4);
await espere(() => estado.questoes[0].estado === "pendente");
proximoMedir = null;

/* 7. o rascunho sobrevive a um recarregar */
const guardado = lerRascunho();
if (!guardado || guardado.questoes.length !== 3) falhas.push("o rascunho não ficou no aparelho");

/* 8. o que se baixa está no esquema de conteudo/ */
const c = montarConteudo();
if (c.id !== "os-tres-setores-4-ano") falhas.push("id do jogo: " + c.id);
for (const k of ["id", "materia", "titulo", "missoes", "trilhas", "questoes"])
  if (!(k in c)) falhas.push("o conteúdo não tem " + k);
if (c.questoes.length !== 1) falhas.push("esperava só a aprovada, vieram " + c.questoes.length);
const ids = new Set(c.missoes.map(m => m.id));
for (const e of c.trilhas[0].etapas)
  if (e !== "all" && !ids.has(e)) falhas.push("a trilha aponta para missão inexistente " + e);
for (const q of c.questoes) {
  for (const k of ["tipo", "icone", "enunciado", "origem", "certa", "erradas", "explicacao", "trecho"])
    if (!(k in q)) falhas.push("questão sem " + k);
  if (!ids.has(q.missao)) falhas.push("questão em missão fora da lista");
  if (q.origem !== "derivada") falhas.push("origem deveria ser derivada");
  if (q.erradas.includes(q.certa)) falhas.push("a certa está entre as erradas");
  if ("problemas" in q || "estado" in q || "rodada" in q) falhas.push("campo da revisão vazou para o conteúdo");
}

/* 9. foto grande sobe reduzida, em JPEG */
const tela = document.createElement("canvas");
tela.width = 3000; tela.height = 2000;
tela.getContext("2d").fillRect(0, 0, 10, 10);
const png = await new Promise(ok => tela.toBlob(ok, "image/png"));
const pronta = await prepararArquivo(new File([png], "IMG_2598.png", {type: "image/png"}));
if (pronta.tipo !== "image/jpeg") falhas.push("a foto não virou JPEG: " + pronta.tipo);
const volta = await createImageBitmap(await (await fetch("data:image/jpeg;base64," + pronta.dados)).blob());
if (Math.max(volta.width, volta.height) !== 1568) falhas.push("a foto subiu com " + volta.width + "x" + volta.height);

/* 10. a leitura: o ilegível fica desmarcado e avisado, a letra de mão fora */
const TEXTO1 = "A célula é a menor unidade que forma os seres vivos.";
const TEXTO2 = "Os fungos não fazem fotossíntese e se alimentam de matéria orgânica.";
mostrarLeitura({aviso: "1 de 3 páginas não deram para ler e ficaram desmarcadas.", custo_usd: 0.05, restantes: 8,
  paginas: [
    {arquivo: 0, nome: "IMG_2598.jpg", pagina: 1, legivel: "sim", motivo: "", texto: TEXTO1, manuscrito: ""},
    {arquivo: 1, nome: "IMG_2599.jpg", pagina: 1, legivel: "nao", motivo: "Foto tremida.", texto: "", manuscrito: ""},
    {arquivo: 2, nome: "folha.pdf", pagina: 2, legivel: "parcial", motivo: "Rodapé cortado.", texto: TEXTO2,
     manuscrito: "fungos produzem fotossíntese"},
  ]});
const material = $("material").value;
if (material !== TEXTO1 + "\n\n" + TEXTO2) falhas.push("o material não é a soma das páginas lidas: " + JSON.stringify(material));
if (/produzem fotossíntese/.test(material)) falhas.push("a letra de mão entrou no material");
const pags = [...document.querySelectorAll("#paginas .pagina")];
if (pags.length !== 3) falhas.push("esperava 3 páginas, vieram " + pags.length);
else {
  if (pags[1].querySelector("input").checked) falhas.push("a página ilegível veio marcada");
  if (!/Foto tremida/.test(pags[1].innerText)) falhas.push("a página ilegível não diz por quê");
  if (!/Escrito à mão/.test(pags[2].innerText)) falhas.push("a letra de mão não aparece para conferir");
}
if (!/não deram para ler/.test($("paginas").innerText)) falhas.push("o aviso da leitura não aparece");
pags[0].querySelector("input").click();
if ($("material").value !== TEXTO2) falhas.push("desmarcar a página não a tirou do material");
if (!lerLeitura() || lerLeitura().paginas[0].marcada) falhas.push("a seleção das páginas não ficou guardada");

/* 11. a questão leva a página de onde veio */
const comFoto = {titulo: "Micro", paginas: [{nome: "IMG_2598.jpg", pagina: 1, texto: TEXTO1},
                                            {nome: "folha.pdf", pagina: 2, texto: TEXTO2}]};
const f2 = fonteDe({trecho: "não fazem  fotossíntese e se alimentam"}, comFoto);
if (f2.tipo !== "pdf" || f2.detalhe !== "folha.pdf, p.2") falhas.push("procedência errada: " + JSON.stringify(f2));
if (fonteDe({trecho: "frase que não está em página nenhuma"}, comFoto).tipo !== "material")
  falhas.push("trecho sem página deveria cair no material");

/* 12. a etapa mora na URL: o voltar recua uma etapa, e o que não se alcança não abre */
mostrar({missoes: [{id: "setores", nome: "Os três setores"}], questoes: [{...base, enunciado: "Outra"}],
         lote: null, custo_usd: 0.1, restantes: 8, rodadas: 0},
        {titulo: "T", materia: "M", ano: "4º ano", quantidade: 1, material: "x"});
if (location.hash !== "#revisar") falhas.push("revisar não ficou na URL: " + location.hash);
location.hash = "conferir";
await espere(() => etapa === 2);
if ($("pedido").hidden) falhas.push("#conferir não abriu a etapa de conferir");
if (!$("pe").hidden) falhas.push("a barra de baixar ficou fora da revisão");
estado = null; leitura = null; $("material").value = "";
location.hash = "revisar";
await espere(() => etapa === 1);
if (location.hash !== "#material") falhas.push("etapa sem conteúdo abriu pelo endereço: " + location.hash);

/* 13. o jogo grande: plano, missões em paralelo, a que falha tenta de novo */
const gerados = [], licoes = [];
let recusarB = true, recusarLicaoB = true;
// O passo da missão c chega sem trecho conferido: tem de entrar fora da lição.
const passoDe = alvo => ({missao: alvo, titulo: "Passo " + alvo, ideia: "A ideia de <b>" + alvo + "</b>.",
  trecho: base.trecho, revs: [{titulo: "Termo", resposta: "o que é"}, {titulo: "Outro", resposta: "outra coisa"}],
  revs_cap: "Toque cada um.", maq: [], maq_cap: "", alerta: "Cuidado com <b>isto</b>.",
  quiz: {pergunta: "Pergunta " + alvo + "?", certa: "certa", erradas: ["x", "y", "z"], retorno: "Porque sim."},
  problemas: alvo === "c" ? [{grave: true, texto: "O trecho citado não está no material."}] : []});
window.chamarFuncao = async corpo => {
  if (corpo.acao === "abrir") return {criacao: 7, restantes: 2};
  if (corpo.acao === "licao") {
    licoes.push(corpo);
    if (corpo.alvo === "b" && recusarLicaoB) {
      recusarLicaoB = false;
      throw Object.assign(new Error("A lição falhou."), {custo: 0.01});
    }
    return {restantes: 2, custo_usd: 0.02, passos: [passoDe(corpo.alvo)]};
  }
  if (corpo.acao === "planejar") return {total: 30, restantes: 2, custo_usd: 0.02, missoes: [
    {id: "a", nome: "Missão A", descricao: "", quantidade: 10},
    {id: "b", nome: "Missão B", descricao: "", quantidade: 10},
    {id: "c", nome: "Missão C", descricao: "", quantidade: 10}]};
  if (corpo.acao === "medir") return {problemas: corpo.questoes.map(() => []), lote: null};
  gerados.push(corpo);
  if (corpo.alvo === "b" && recusarB) {
    recusarB = false;
    throw Object.assign(new Error("O modelo se recusou."), {custo: 0.05});
  }
  // A primeira missão chega por último: a revisão tem de mostrar na ordem do plano mesmo assim.
  await new Promise(ok => setTimeout(ok, corpo.alvo === "a" ? 200 : 20));
  return {restantes: 2, custo_usd: 0.1, aviso: "", questoes: [1, 2].map(k =>
    ({...base, missao: corpo.alvo, enunciado: corpo.alvo + k, problemas: []}))};
};
estado = null; leitura = null;
$("material").value = base.trecho.repeat(8);
$("titulo").value = "Jogo grande"; $("materia").value = "Geografia"; $("quantidade").value = "30";
contar();
$("pedido").requestSubmit();
await espere(() => estado && estado.plano && !gerando && estado.partes.b.estado === "falhou"
                   && estado.licao.b.estado === "falhou", 4000);
if (licoes.length !== 3 || licoes.some(l => l.criacao !== 7 || l.missoes.length !== 3))
  falhas.push("a lição não foi pedida uma vez por missão, dentro da criação: " + licoes.length);
if (gerados.length !== 3) falhas.push("esperava 3 partes, vieram " + gerados.length);
if (gerados.some(g => g.criacao !== 7 || !g.missoes || g.missoes.length !== 3))
  falhas.push("a parte não levou a criação e o plano inteiro");
if (!/Não veio/.test($("resumo").innerText)) falhas.push("a missão que falhou não aparece no plano");
const ordem = () => [...document.querySelectorAll("#lista .enunciado")].map(e => e.textContent).join(",");
if (ordem() !== "a1,a2,c1,c2") falhas.push("fora da ordem do plano: " + ordem());
const deNovo = [...document.querySelectorAll("#resumo button")].find(b => b.textContent === "Tentar de novo");
if (!deNovo) falhas.push("a missão que falhou não oferece tentar de novo");
else {
  deNovo.click();
  await espere(() => estado.partes.b.estado === "pronta" && !gerando, 4000);
  if (ordem() !== "a1,a2,b1,b2,c1,c2") falhas.push("depois de tentar de novo: " + ordem());
}
if (!/2 restantes hoje/.test($("cota").textContent)) falhas.push("a cota de jogos não aparece: " + $("cota").textContent);
/* a lição: a de b falhou e tenta de novo; a de c chega fora; tirar e pôr de volta */
const licaoBox = () => $("resumo").querySelector("details.licao");
if (!licaoBox()) falhas.push("a revisão não mostra a lição");
else {
  licaoBox().open = true; licaoBox().dispatchEvent(new Event("toggle"));
  const deNovoL = [...licaoBox().querySelectorAll("button")].find(b => b.textContent === "Tentar de novo");
  if (!deNovoL) falhas.push("a lição que falhou não oferece tentar de novo");
  else { deNovoL.click(); await espere(() => estado.licao.b.estado === "pronta" && !gerando, 4000); }
}
const passoCarta = t => [...document.querySelectorAll("#resumo article.passo")].find(a => a.querySelector(".enunciado").textContent === t);
if (!passoCarta("Passo a")) falhas.push("a lição aberta não mostra os passos (ficou fechada na repintura?)");
else {
  if (passoCarta("Passo a").querySelector(".ideia b")?.textContent !== "a") falhas.push("o <b> da ideia não virou negrito");
  if (!estado.licao.c.passos[0].fora || !passoCarta("Passo c").querySelector(".acoes button").disabled)
    falhas.push("o passo sem trecho conferido não ficou fora da lição");
  passoCarta("Passo a").querySelector(".acoes button").click();
  if (!estado.licao.a.passos[0].fora) falhas.push("tirar da lição não tirou");
  passoCarta("Passo a").querySelector(".acoes button").click();
  if (estado.licao.a.passos[0].fora) falhas.push("pôr de volta não pôs");
}
// plano 0,02 + três partes de 0,10 + a recusa, que também foi paga: 0,05
// + três lições de 0,02 + a que falhou, 0,01
if (Math.abs(estado.custo - 0.44) > 1e-9) falhas.push("o custo do jogo não soma as partes e a lição: " + estado.custo);
// pediu 30, cada missão deu 2 das 10 previstas: a tela diz que foi o material
if (!/pediu 30; o material sustentou 6/.test(($("notaCurto") || {}).textContent || "")) falhas.push("vieram menos que o pedido e a tela não explica");
if (!/2 de 10 previstas/.test($("resumo").innerText)) falhas.push("a missão curta não mostra quantas de quantas");

/* 14. salvar e jogar: vai para a conta, abre o jogo, e salvar de novo atualiza o mesmo */
const gravados = [], abertos = [];
window.gravarJogo = async (linha, id) => { gravados.push({linha, id}); return id || "11111111-2222-3333-4444-555555555555"; };
window.abrirJogo = id => abertos.push(id);
estado.questoes.forEach(x => { x.estado = "aprovada"; });
pintar();
if ($("salvar").disabled) falhas.push("com aprovadas, salvar continua desligado");
$("salvar").click();
await espere(() => abertos.length === 1);
if (gravados[0].id) falhas.push("o primeiro salvamento já veio com id");
if (gravados[0].linha.conteudo.questoes.length !== 6) falhas.push("o jogo salvo não leva as aprovadas: " + gravados[0].linha.conteudo.questoes.length);
if (gravados[0].linha.titulo !== "Jogo grande") falhas.push("título do jogo salvo: " + gravados[0].linha.titulo);
const licaoSalva = gravados[0].linha.conteudo.licao || [];
if (licaoSalva.map(x => x.missao).join() !== "a,b") falhas.push("a lição salva: " + licaoSalva.map(x => x.missao).join());
if (licaoSalva.some(x => "problemas" in x || "fora" in x)) falhas.push("a lição salva leva o estado da revisão");
if (!lerDe("jogo_gerado_" + abertos[0])) falhas.push("o jogo salvo não ficou no aparelho para abrir sem rede");
if (!(lerDe("jogos_criados_v1") || []).some(j => j.id === abertos[0])) falhas.push("o índice não fica sabendo do jogo novo");
await espere(() => !$("salvar").disabled);
if (!/Atualizar e jogar/.test($("salvar").textContent)) falhas.push("depois de salvo, o botão não diz que atualiza");
$("salvar").click();
await espere(() => abertos.length === 2);
if (gravados[1].id !== abertos[0]) falhas.push("salvar de novo criou outro jogo em vez de atualizar");

/* 15. meus jogos: lista, reabre para editar e renomear, acrescenta questões sem mexer nas que havia, apaga */
const OUTRO = "99999999-8888-7777-6666-555555555555";
const apagados = [];
window.listarJogosConta = async () => [
  {id: abertos[0], titulo: "Jogo grande", materia: "Geografia", questoes: 6, criado: "2026-10-20T12:00:00Z", atualizado: "2026-10-25T12:00:00Z"},
  {id: OUTRO, titulo: "Outro jogo", materia: "Ciências", questoes: 1, criado: "2026-10-21T12:00:00Z", atualizado: "2026-10-21T12:00:00Z"}];
window.lerJogoConta = async id => ({id, titulo: "Outro jogo", materia: "Ciências", ano: "4º ano",
  material: "Material antigo do outro jogo.", conteudo: {missoes: [{id: "a", nome: "Antiga"}], questoes: [
    {tipo: "escolha", missao: "a", icone: "livro", enunciado: "velha", certa: "c", erradas: ["x", "y", "z"],
     explicacao: "", trecho: "Material antigo", fonte: {tipo: "material"}}]}});
window.apagarJogoConta = async id => { apagados.push(id); };
location.hash = "#meus";
await espere(() => document.querySelectorAll("#listaMeus .jogo-linha").length === 2);
if (!$("etapas").hidden) falhas.push("em meus jogos, o indicador de etapas continua à vista");
if ($("abaMeus").getAttribute("aria-current") !== "page") falhas.push("a aba Meus jogos não fica marcada");
if (!document.querySelector('#listaMeus .jogo-linha[data-id="' + abertos[0] + '"]').classList.contains("aberto"))
  falhas.push("o jogo aberto na revisão não aparece marcado na lista");
const linhaOutro = document.querySelector('#listaMeus .jogo-linha[data-id="' + OUTRO + '"]');
if (!/jogar\.html\?id=/.test(linhaOutro.querySelector("a").getAttribute("href"))) falhas.push("Jogar não leva ao jogar.html");
[...linhaOutro.querySelectorAll("button")].find(b => b.textContent === "Editar").click();
await espere(() => estado.jogoId === OUTRO && location.hash === "#revisar");
if (estado.questoes.length !== 1 || estado.questoes[0].estado !== "aprovada") falhas.push("o jogo reaberto não vem com as questões aprovadas");
const nome = [...$("resumo").querySelectorAll("label")].find(l => /Nome do jogo/.test(l.textContent));
if (!nome) falhas.push("o jogo reaberto não deixa renomear");
else { nome.querySelector("input").value = "Outro, renomeado"; nome.querySelector("input").dispatchEvent(new Event("input")); }
$("salvar").click();
await espere(() => gravados.length === 3);
if (gravados[2].id !== OUTRO) falhas.push("salvar o jogo reaberto não atualiza o mesmo");
if (gravados[2].linha.titulo !== "Outro, renomeado") falhas.push("o nome novo não foi salvo: " + gravados[2].linha.titulo);
if (gravados[2].linha.material !== "Material antigo do outro jogo.") falhas.push("o material não vai junto com o jogo");
if (![...$("resumo").querySelectorAll("button")].some(b => /Criar a lição/.test(b.textContent)))
  falhas.push("jogo salvo sem lição não oferece criar a lição");

/* acrescentar: só o material novo vai para as partes; a missão de id repetido ganha outro */
await espere(() => !gerando);
gerados.length = 0; licoes.length = 0;
[...$("resumo").querySelectorAll("button")].find(b => /Acrescentar/.test(b.textContent)).click();
await espere(() => location.hash === "#material");
if ($("faixa1").hidden) falhas.push("acrescentando, a etapa 1 não diz a que jogo");
if ($("titulo").value !== "Outro, renomeado") falhas.push("acrescentando, o título não vem do jogo");
$("material").value = "Material novo. ".repeat(30); contar();
$("pedido").requestSubmit();
await espere(() => estado && estado.plano && !gerando && Object.values(estado.partes).every(x => x.estado === "pronta"), 4000);
if (estado.jogoId !== OUTRO) falhas.push("acrescentar perdeu o jogo de onde veio");
if (estado.questoes.length !== 7 || estado.questoes[0].enunciado !== "velha" || estado.questoes[0].estado !== "aprovada")
  falhas.push("acrescentar mexeu nas questões que o jogo tinha");
if (Object.keys(estado.licao).join() !== "a_2,b,c") falhas.push("lição depois de acrescentar: " + Object.keys(estado.licao).join());
if (estado.missoes.map(m => m.id).join() !== "a,a_2,b,c") falhas.push("ids das missões: " + estado.missoes.map(m => m.id).join());
if (gerados.some(g => /antigo/.test(g.material))) falhas.push("as partes novas foram escritas também do material antigo");
if (licoes.map(l => l.alvo).join() !== "a_2,b,c" || licoes.some(l => /antigo/.test(l.material)))
  falhas.push("acrescentar pediu a lição errada: " + licoes.map(l => l.alvo).join());
if (!/antigo[\s\S]*novo/.test(estado.pedido.material)) falhas.push("o material salvo não soma o antigo e o novo");

/* apagar pede o segundo toque e limpa o aparelho */
location.hash = "#meus";
await espere(() => document.querySelectorAll("#listaMeus .jogo-linha").length === 2);
localStorage.setItem("jogo_gerado_" + OUTRO, "{}");
const apagar = () => [...document.querySelector('#listaMeus .jogo-linha[data-id="' + OUTRO + '"]').querySelectorAll("button")]
  .find(b => /apagar/i.test(b.textContent));
apagar().click();
if (apagados.length) falhas.push("apagou no primeiro toque");
apagar().click();
await espere(() => apagados.length === 1);
if (apagados[0] !== OUTRO) falhas.push("apagou o jogo errado");
if (localStorage.getItem("jogo_gerado_" + OUTRO)) falhas.push("o jogo apagado continuou no aparelho");
if (estado.jogoId) falhas.push("o rascunho continua apontando para o jogo apagado");

fim({ok: !falhas.length, resumo: falhas.length ? "" : "aprovar, editar, descartar, baixar e ler fotos, jogo grande, salvar e jogar, gerir", detalhes: falhas});
