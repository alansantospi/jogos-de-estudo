/* Percorre todas as trilhas do jogo e cobra o que já quebrou antes:
   - "undefined" na tela (campo renomeado e leitor esquecido: aconteceu duas vezes)
   - alternativa vazia ou sem letra (a troca das formas do Kahoot por letras)
   - questão sem ícone (a migração de emoji para desenho)
   - erro de JS em qualquer ponto */
const falhas = [];
let vistas = 0, etapas = 0;
const LETRAS = ["A", "B", "C", "D"];

await espere(() => typeof trails !== "undefined" && Object.keys(trails).length);

for (const t of Object.keys(trails)) {
  _startTrail(t);
  for (let k = 0; k < 90; k++) {
    if (index >= questions.length) {
      const antes = trailStep;
      renderQuestion();
      if (trailStep === antes) break;      // trilha acabou
      etapas++;
      continue;
    }
    const q = questions[index];
    vistas++;

    if (!q.ic) falhas.push("questão sem ícone na trilha " + t + ": " + (q.q || "").slice(0, 50));

    if (q.choices) {
      q.choices.forEach((c, i) => {
        if (!String(c).trim()) falhas.push("alternativa vazia: " + (q.q || "").slice(0, 50));
      });
      const botoes = [...document.querySelectorAll(".answers .answer")];
      botoes.forEach((b, i) => {
        const m = b.querySelector(".letra");
        if (!m) falhas.push("alternativa sem letra: " + (q.q || "").slice(0, 40));
        else if (m.textContent !== LETRAS[i % 4])
          falhas.push("letra fora de ordem (" + m.textContent + " na posição " + i + ")");
      });
    }

    if (document.body.innerText.includes("undefined"))
      falhas.push("'undefined' na tela, questão: " + (q.q || "").slice(0, 50));

    index++;
    if (index < questions.length) renderQuestion();
  }
}

if (vistas < 20) falhas.push("percorri só " + vistas + " questões; esperava bem mais");

fim({ ok: falhas.length === 0, detalhes: falhas,
      resumo: vistas + " questões, " + etapas + " etapas" });
