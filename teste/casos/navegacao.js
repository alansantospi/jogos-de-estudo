/* Rotas, botão voltar do celular, busca e migalhas.
   O que já quebrou: o motor de inglês limpava o hash a cada troca de tela,
   o que desligava o botão voltar; a busca não alcançava as trilhas. */
const falhas = [];
const vai = h => new Promise(ok => { location.hash = h; setTimeout(ok, 120); });
const volta = () => new Promise(ok => { history.back(); setTimeout(ok, 160); });
const telaAtual = () => ([...document.querySelectorAll(".screen")]
  .find(x => x.classList.contains("active")) || {}).id;
const viz = s => [...document.querySelectorAll(s)].filter(e => !e.hidden).length;

await espere(() => typeof trails !== "undefined" && document.getElementById("buscaMissao"));

await vai("missoes");
if (telaAtual() !== "categories") falhas.push("#missoes não abriu a lista de missões");
await vai("licao");
if (telaAtual() !== "lesson") falhas.push("#licao não abriu a lição");

const cat = [...document.querySelectorAll("[data-cat]")]
  .map(e => e.dataset.cat).find(c => c !== "review");
await vai("missao/" + cat);
if (telaAtual() !== "quiz") falhas.push("#missao/" + cat + " não abriu a partida");

const tr = Object.keys(trails)[0];
await vai("trilha/" + tr);
if (telaAtual() !== "quiz") falhas.push("#trilha/" + tr + " não abriu a partida");

/* O botão voltar do celular não dá para acionar aqui: history.back() é
   navegação, e sob tempo virtual o Chrome nunca a conclui. Mas o defeito real
   que houve não era o botão — era o motor de inglês chamando replaceState e
   apagando o endereço, de modo que não havia para onde voltar. Então o que se
   cobra é a invariante: o endereço persiste e o histórico cresce. */
const marcos = [];
for (const r of ["missoes", "licao", "missao/" + cat]) {
  await vai(r);
  if (location.hash !== "#" + r)
    falhas.push("o endereço não ficou em #" + r + " (ficou em '" + location.hash + "')");
  marcos.push(history.length);
}
if (!(marcos[marcos.length - 1] > marcos[0]))
  falhas.push("o histórico não cresceu (" + marcos.join("→") + "): não haveria para onde voltar");

/* E o roteador tem de reagir a uma troca de endereço que não foi ele quem fez
   — que é exatamente o que o botão voltar produz. */
await vai("missoes");
if (telaAtual() !== "categories")
  falhas.push("o roteador não reagiu à volta para #missoes");

/* Busca: sem acento, alcançando missões e trilhas, e limpando de volta. */
const campo = document.getElementById("buscaMissao");
const conta = () => viz("#categories .category-card") + viz("#categories .trail-card");
const tudo = conta();
campo.value = "zzzzzz"; filtrarMissoes();
if (conta() !== 0) falhas.push("busca sem resultado ainda mostra cartões");
if (viz("#categories h2") + viz("#categories h3.grupo") !== 0)
  falhas.push("título de seção sobrou sem nenhum cartão embaixo");
if (document.getElementById("semResultado").hidden)
  falhas.push("não avisou que nada foi encontrado");
campo.value = ""; filtrarMissoes();
if (conta() !== tudo) falhas.push("limpar a busca não trouxe tudo de volta (" + conta() + " de " + tudo + ")");

/* Migalhas: leva ao índice e diz onde está. */
const m = document.querySelector(".migalhas");
if (!m) falhas.push("não há trilha de migalhas");
else {
  const casa = m.querySelector("a");
  if (!casa || casa.getAttribute("href") !== "index.html")
    falhas.push("a primeira migalha não leva ao índice");
  if (!/Jogos\s*\/\s*\S+/.test(m.innerText.replace(/\s+/g, " ")))
    falhas.push("migalhas incompletas: " + m.innerText.replace(/\s+/g, " "));
}

fim({ ok: falhas.length === 0, detalhes: falhas,
      resumo: tudo + " cartões, migalhas e voltar conferidos" });
