/* O botão principal da tela de fim (`proximoPasso`, em motor/diversao.js):
   sugere uma coisa só, e tem de ser a certa para cada fim de partida. */
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import vm from "node:vm";

const RAIZ = new URL("../../", import.meta.url).pathname;
const ctx = vm.createContext({ addEventListener() {} });
vm.runInContext(readFileSync(RAIZ + "motor/diversao.js", "utf8") + ";this.proximoPasso=proximoPasso;", ctx);
const proximo = (p: Record<string, unknown>) => (ctx as any).proximoPasso({
  ordem: ["a", "b", "c"], titulos: { a: "Ângulos", b: "Bases", c: "Cubos" },
  melhor: () => 0, atual: "a", estrelas: 3, trilha: null, perdeu: false, trilhas: [], ...p }).texto;

test("sem estrela, tentar de novo; com 1 ou 2, buscar as 3", () => {
  assert.equal(proximo({ estrelas: 0 }), "Tentar de novo");
  assert.equal(proximo({ estrelas: 1 }), "Tentar 3 estrelas");
  assert.equal(proximo({ estrelas: 2 }), "Tentar 3 estrelas");
});

test("com 3 estrelas, a próxima missão que ainda não tem 90%", () => {
  assert.equal(proximo({}), "Próxima: Bases");
  assert.equal(proximo({ melhor: (c: string) => (c === "b" ? 95 : 0) }), "Próxima: Cubos");
  // Volta ao começo da lista.
  assert.equal(proximo({ atual: "c" }), "Próxima: Ângulos");
  assert.equal(proximo({ melhor: () => 100 }), "Jogar de novo");
  // Do misturado e da revisão, a primeira que falta.
  assert.equal(proximo({ atual: "all", melhor: (c: string) => (c === "a" ? 90 : 0) }), "Próxima: Bases");
  assert.equal(proximo({ atual: "review", estrelas: 2 }), "Próxima: Ângulos");
});

test("na trilha: de novo se perdeu, senão a próxima por fazer", () => {
  const trilhas = [{ id: "t1", nome: "Planas", feita: true }, { id: "t2", nome: "Sólidos", feita: false }];
  assert.equal(proximo({ trilha: "t1", perdeu: true, trilhas }), "Tentar a trilha de novo");
  assert.equal(proximo({ trilha: "t1", trilhas }), "Próxima trilha: Sólidos");
  assert.equal(proximo({ trilha: "t2", trilhas: [trilhas[0], { ...trilhas[1], feita: true }] }), "Jogar a trilha de novo");
});
