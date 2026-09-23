// A lição da Gramática é interativa: três mecânicas guiadas por data-*.
// Sem teste, um erro de JS aqui só apareceria quando a criança tocasse — e
// calado, porque o motor continua funcionando ao redor.
const falhas = [];
const vai = h => new Promise(ok => { location.hash = h; setTimeout(ok, 120); });
const telaAtual = () => ([...document.querySelectorAll(".screen")]
  .find(x => x.classList.contains("active")) || {}).id;
const $ = s => document.querySelector(s);
const $$ = s => [...document.querySelectorAll(s)];

// --- todos os passos existem e estão bem formados ---------------------
// O resumo também é um .lesson-part, mas não é um passo.
const passos = $$(".lesson-part").filter(p => p.id !== "resumo");
if (passos.length < 10) falhas.push("só " + passos.length + " passos na lição");
for (const p of passos) {
  const q = p.querySelector('[data-mic="escolher"]');
  if (!q) { falhas.push(p.id + " não tem checagem"); continue; }
  const certas = q.querySelectorAll('.mic-ops button[data-ok="1"]').length;
  if (certas !== 1) falhas.push(p.id + " tem " + certas + " respostas certas");
  if (!p.querySelector(".mic-fig")) falhas.push(p.id + " não tem infográfico");
  if (!p.querySelector(".mic-treinar")) falhas.push(p.id + " não leva a treinar");
}

// --- a certa não fica sempre na mesma posição -------------------------
// Fora as checagens em forma de frase: ali a ordem é a da frase, e a posição
// da certa é o que é. Incluí-las mascarava a conferência por completo.
const posicoes = new Set();
for (const p of passos) {
  const ops = [...p.querySelectorAll('[data-mic="escolher"] .mic-ops:not(.frase) button')];
  const i = ops.findIndex(b => b.dataset.ok === "1");
  if (ops.length > 1 && i >= 0) posicoes.add(i);
}
if (posicoes.size < 2)
  falhas.push("a resposta certa fica sempre na posição " + [...posicoes][0]);

await vai("licao/lesson1");
if (telaAtual() !== "lesson") falhas.push("#licao/lesson1 não abriu a lição");

// --- escolher: errar acende a errada e revela a certa -----------------
const q1 = $('#lesson1 [data-mic="escolher"]');
const errada = [...q1.querySelectorAll(".mic-ops button")].find(b => b.dataset.ok !== "1");
errada.click();
if (!errada.classList.contains("errado")) falhas.push("a opção errada não ficou marcada");
if (!q1.querySelector('.mic-ops button[data-ok="1"]').classList.contains("certo"))
  falhas.push("a certa não foi revelada depois do erro");
if (q1.querySelector(".mic-fb").hidden) falhas.push("a explicação continuou escondida");

// --- revelar: abre e fecha -------------------------------------------
const comRev = passos.find(p => p.querySelector(".mic-rev"));
if (!comRev) falhas.push("nenhum passo tem cartão de revelar");
await vai("licao/" + comRev.id);
const rev = comRev.querySelector(".mic-rev");
const antes = rev.querySelector("i").textContent;
rev.click();
if (rev.getAttribute("aria-expanded") !== "true") falhas.push("revelar não abriu");
if (rev.querySelector("i").textContent !== rev.dataset.resp)
  falhas.push("revelar não mostrou a resposta");
rev.click();
if (rev.querySelector("i").textContent !== antes) falhas.push("revelar não fechou");
// O texto voltar não basta: quem usa leitor de tela ouve o aria-expanded.
if (rev.getAttribute("aria-expanded") !== "false")
  falhas.push("revelar fechou o texto mas continuou anunciando aberto");

// --- máquina: compor muda o resultado e o desenho ---------------------
// O passo com máquina e desenho: o primeiro que tiver os dois.
const comFig = passos.find(p => p.querySelector(".mic-maq[data-fig]"));
if (!comFig) falhas.push("nenhum passo liga máquina e desenho");
await vai("licao/" + comFig.id);
const maq = comFig.querySelector(".mic-maq");
const res = maq.querySelector(".mic-res");
const fig = document.getElementById(maq.dataset.fig);
const inicial = res.textContent;
if (!inicial || inicial === "—") falhas.push("a máquina abriu sem resultado");
const eixo1 = [...maq.querySelectorAll(".mic-eixo")[0].querySelectorAll("button")];
if (fig.getAttribute("data-estado") !== eixo1[0].dataset.v)
  falhas.push("o desenho não começou no estado inicial");
const outro = eixo1[eixo1.length - 1];
outro.click();
if (res.textContent === inicial) falhas.push("compor não mudou o resultado");
if (fig.getAttribute("data-estado") !== outro.dataset.v)
  falhas.push("compor não mudou o desenho: " + fig.getAttribute("data-estado"));
if (outro.getAttribute("aria-pressed") !== "true") falhas.push("a escolha não ficou marcada");
if (!comFig.querySelector(".mic-nota").innerHTML.trim())
  falhas.push("a máquina não explicou a escolha");

// --- máquina de dois eixos, onde houver -------------------------------
const doisEixos = passos.find(p =>
  [...p.querySelectorAll(".mic-maq")].some(m => m.querySelectorAll(".mic-eixo").length === 2));
if (doisEixos) {
  await vai("licao/" + doisEixos.id);
  const m2 = [...doisEixos.querySelectorAll(".mic-maq")]
    .find(m => m.querySelectorAll(".mic-eixo").length === 2);
  const antesR = m2.querySelector(".mic-res").textContent;
  const segundo = m2.querySelectorAll(".mic-eixo")[1].querySelectorAll("button");
  segundo[segundo.length - 1].click();
  if (m2.querySelector(".mic-res").textContent === antesR)
    falhas.push("mexer no segundo eixo não mudou o resultado");
}

// --- modo resumo: os dois modos saem do mesmo dado --------------------
await vai("licao/resumo");
if (telaAtual() !== "lesson") falhas.push("#licao/resumo não abriu a lição");
const res14 = document.getElementById("resumo");
if (!res14) falhas.push("não há modo resumo");
else {
  if (res14.style.display === "none") falhas.push("o resumo não ficou visível");
  const blocos = res14.querySelectorAll(".mic-bloco");
  if (blocos.length !== passos.length)
    falhas.push("o resumo tem " + blocos.length + " conteúdos e a lição tem " + passos.length);
  // a regra de cada passo tem de aparecer igual nos dois modos, senão divergem
  for (const p of passos) {
    const regra = p.querySelector(".mic-ideia").innerHTML.trim();
    const achou = [...res14.querySelectorAll(".mic-regra")]
      .some(x => x.innerHTML.trim() === regra);
    if (!achou) falhas.push(p.id + ": a regra do passo não está no resumo");
  }
  // e todo alerta do passo a passo também
  for (const p of passos) {
    const al = p.querySelector(".example.warning");
    if (!al) continue;
    const achou = [...res14.querySelectorAll(".example.warning")]
      .some(x => x.innerHTML.trim() === al.innerHTML.trim());
    if (!achou) falhas.push(p.id + ": o alerta do passo não está no resumo");
  }
  if (!res14.querySelector(".mic-titulo")) falhas.push("o resumo não leva a treinar");
}

// --- o botão de alternar leva de um modo ao outro ---------------------
await vai("licao/lesson1");
const paraResumo = $("#lesson1 .mic-modo");
if (!paraResumo) falhas.push("o passo não oferece o resumo");
else {
  paraResumo.click();
  await new Promise(ok => setTimeout(ok, 150));
  if (document.getElementById("resumo").style.display === "none")
    falhas.push("o botão de resumo não abriu o resumo");
}

// --- guarda onde parou ------------------------------------------------
// O caso roda num arquivo temporário, então o nome do jogo não vem do
// endereço. A chave é a única que termina em _licao_v1.
let salvo = null;
try {
  const k = Object.keys(localStorage).find(x => x.endsWith("_licao_v1"));
  salvo = k ? localStorage.getItem(k) : null;
} catch (e) {}
if (salvo !== "1") falhas.push("não guardou o passo (guardou " + salvo + ")");
// O resumo não é passo: visitá-lo não pode mexer em onde a criança parou.

fim({ ok: !falhas.length, detalhes: falhas,
      nota: passos.length + " passos, checagem e máquinas conferidas" });
