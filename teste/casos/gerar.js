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
await espere(() => /1 aprovada\)/.test($("baixar").textContent));
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

fim({ok: !falhas.length, resumo: falhas.length ? "" : "aprovar, editar, descartar e baixar", detalhes: falhas});
