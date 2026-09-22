/* A tela de resultado. Foi aqui que passou duas vezes um "undefined": a caixa
   de revisão lia o campo antigo do ícone. Os testes de então percorriam as
   trilhas mas nunca chegavam ao fim da partida — este chega. */
const falhas = [];
const ceu = typeof allItems !== "undefined";

await espere(() => typeof endGame === "function");

/* Marca alguns itens como errados, para a caixa de revisão ter o que mostrar. */
if (ceu) {
  allItems.slice(0, 5).forEach(q => { record(q, false); record(q, false); });
  if (typeof renderMissed === "function") renderMissed();
} else {
  verbBank.slice(0, 5).forEach(v => { const e = verbStat(v.base); e.errors = 3; e.hits = 0; });
  if (typeof renderMissedList === "function") renderMissedList();
}

const caixa = document.getElementById("missed") ||
              (document.querySelector(".missed-chips") || {}).parentElement;
if (!caixa) falhas.push("não achei a caixa de conteúdos a revisar");
else {
  const linhas = caixa.querySelectorAll("li, .missed-chip").length;
  const icones = caixa.querySelectorAll("svg use").length;
  if (!linhas) falhas.push("a caixa de revisão não listou nada");
  if (icones < linhas) falhas.push("linha sem ícone na caixa (" + icones + " para " + linhas + " linhas)");
  if (caixa.innerText.includes("undefined"))
    falhas.push("'undefined' na caixa de revisão");
}

endGame();
const fimTela = document.getElementById("end");
if (!fimTela) falhas.push("não achei a tela de fim");
else {
  const t = fimTela.innerText;
  if (t.includes("undefined")) falhas.push("'undefined' na tela de fim");
  /* Patente tem de ser da matéria: História e Artes já herdaram "Mestre do
     Céu" de uma cópia do motor de Ciências. */
  const arquivo = location.pathname.split("/").pop();
  if (/historia|artes/.test(arquivo) && /do Céu|Celeste/.test(t))
    falhas.push("patente de Ciências vazando: " + t.match(/\S+ do Céu|\S+ Celeste/));
}

fim({ ok: falhas.length === 0, detalhes: falhas,
      resumo: "caixa de revisão e tela de fim conferidas" });
