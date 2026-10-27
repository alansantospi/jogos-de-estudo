/* O jogo criado na conta, montado no navegador pelo mesmo motor dos jogos
   feitos à mão. O caso guarda um jogo no aparelho (como se já tivesse sido
   aberto uma vez) e cobra que ele monte, mostre as missões, rode a trilha
   inteira, e que texto vindo do modelo não vire HTML nem feche o script. */
const falhas = [];
const ID = "0f8e9a2b-1c3d-4e5f-8a9b-0c1d2e3f4a5b";
const q = (missao, n, extra = {}) => ({tipo: "escolha", missao, icone: "lupa", origem: "derivada",
  enunciado: "Pergunta " + missao + n + "?", certa: "Certa " + n, erradas: ["Errada um", "Errada dois", "Errada três"],
  explicacao: "Porque sim.", fonte: {tipo: "foto", detalhe: "IMG_1.jpg, p.1"}, trecho: "um trecho qualquer", ...extra});
const JOGO = {id: "teste-4-ano", materia: "Ciências", titulo: "Mundo <b>teste</b>", motor: "ceu",
  missoes: [{id: "celula", nome: "A célula"}, {id: "fungos", nome: "Os \"fungos\""}],
  trilhas: [{id: "tudo", nome: "Todas as missões", etapas: ["celula", "fungos", "all"]}],
  questoes: [q("celula", 1), q("celula", 2, {enunciado: "Fecha <\/script><img src=x onerror=window.__xss=1> aqui?"}),
             q("celula", 3), q("fungos", 1), q("fungos", 2), q("fungos", 3, {icone: "planta"})],
  licao: [
    {missao: "celula", titulo: "A menor parte", ideia: "A célula é a <b>menor unidade</b> dos seres vivos.",
     trecho: "x", revs: [{titulo: "Núcleo", resposta: "guarda a informação"}, {titulo: "Membrana", resposta: "envolve a célula"}],
     revs_cap: "Toque cada parte.", maq: [], maq_cap: "", alerta: "<img src=x onerror=window.__xss=2>Não confunda.",
     quiz: {pergunta: "O que é a célula?", certa: "A menor unidade", erradas: ["Um órgão", "Um tecido", "Um osso"],
            retorno: "É a menor parte viva."}},
    {missao: "fungos", titulo: "Fungo não é planta", ideia: "Fungos <b>não fazem</b> fotossíntese.",
     trecho: "x", revs: [], revs_cap: "", alerta: "",
     maq: [{rotulo: "fungo", saida: "absorve alimento", nota: "Não tem <b>clorofila</b>."},
           {rotulo: "planta", saida: "faz o próprio alimento", nota: "Tem clorofila."}], maq_cap: "Toque um.",
     quiz: {pergunta: "O fungo faz fotossíntese?", certa: "Não", erradas: ["Sim", "Só de dia", "Só no verão"],
            retorno: "Ele absorve o alimento."}}]};

localStorage.setItem("jogo_gerado_" + ID, JSON.stringify(JOGO));
history.replaceState(null, "", location.pathname + "?id=" + ID);
await abrir();
await espere(() => typeof trails !== "undefined" && document.getElementById("gradeMissoes"));

if (window.__xss || document.querySelector("img[src=x]")) falhas.push("texto do jogo virou HTML");
if (!/Mundo <b>teste<\/b>/.test(document.title)) falhas.push("título do jogo: " + document.title);
const cats = [...document.querySelectorAll("#gradeMissoes [data-cat]")].map(b => b.dataset.cat);
if (cats.join() !== "review,all,celula,fungos") falhas.push("cartões das missões: " + cats.join());
if (!/Os "fungos"/.test(document.getElementById("gradeMissoes").innerText)) falhas.push("nome da missão com aspas se perdeu");
if (!document.querySelector('[data-cat="fungos"] use[href="#i-planta"], [data-cat="fungos"] use[href="#i-lupa"]'))
  falhas.push("a missão ficou sem desenho");
if (!document.querySelector("#i-planta")) falhas.push("o sprite não tem os desenhos que uma questão gerada pode pedir");

/* a lição: dois passos, os botões na capa, as três mecânicas, o resumo */
if (!document.querySelector('#start [onclick*="lesson1"]')) falhas.push("a capa não oferece a lição");
openLesson("lesson1");
await espere(() => !document.getElementById("lesson").hidden || getComputedStyle(document.getElementById("lesson")).display !== "none");
const p1 = document.getElementById("lesson1"), p2 = document.getElementById("lesson2");
if (!p1 || !p2 || document.getElementById("lesson3")) falhas.push("a lição não tem os dois passos");
else {
  if (p1.querySelector(".mic-ideia b")?.textContent !== "menor unidade") falhas.push("o negrito da ideia não veio");
  const rev = p1.querySelector(".mic-rev"); rev.click();
  if (rev.querySelector("i").textContent !== "guarda a informação") falhas.push("o cartão não revelou");
  const certa = p1.querySelector('.mic-ops button[data-ok="1"]'); certa.click();
  if (!certa.classList.contains("certo") || p1.querySelector(".mic-fb").hidden) falhas.push("a checagem não respondeu");
  if (p1.querySelector(".mic-ops button") !== certa) falhas.push("no primeiro passo a certa devia vir primeiro, como em licao.py");
  await espere(() => p2.querySelector(".mic-res").textContent !== "—");
  if (p2.querySelector(".mic-res").textContent !== "absorve alimento") falhas.push("a máquina não abriu na primeira opção");
  p2.querySelectorAll(".mic-eixo button")[1].click();
  if (p2.querySelector(".mic-res").textContent !== "faz o próprio alimento") falhas.push("a máquina não trocou");
  if (!/Treinar isto agora/.test(p2.innerText) || !p2.querySelector('[onclick="startCategory(\'fungos\')"]'))
    falhas.push("o passo não leva à missão dele");
  const res = document.getElementById("resumo");
  if (!res || !/A célula/.test(res.innerText) || !/Núcleo/.test(res.innerText)) falhas.push("o resumo não junta os passos");
}
if (window.__xss || document.querySelector("img[src=x]")) falhas.push("texto da lição virou HTML");
goHome();

let vistas = 0;
_startTrail("tudo");
for (let k = 0; k < 40; k++) {
  if (index >= questions.length) {
    const antes = trailStep;
    renderQuestion();
    if (trailStep === antes) break;
    continue;
  }
  vistas++;
  if (document.body.innerText.includes("undefined")) falhas.push("'undefined' na tela: " + questions[index].q);
  index++;
  if (index < questions.length) renderQuestion();
}
if (vistas < 6) falhas.push("a trilha passou por só " + vistas + " questões");
if (!/^gerado_0f8e9a2b1c3d_progress_v1/.test(STORE)) falhas.push("chave do progresso: " + STORE);

fim({ok: !falhas.length, detalhes: falhas, resumo: vistas + " questões e a lição montadas no navegador"});
