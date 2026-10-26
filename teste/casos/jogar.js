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
             q("celula", 3), q("fungos", 1), q("fungos", 2), q("fungos", 3, {icone: "planta"})]};

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

fim({ok: !falhas.length, detalhes: falhas, resumo: vistas + " questões montadas no navegador"});
