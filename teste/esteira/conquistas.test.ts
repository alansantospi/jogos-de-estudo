/* Dias seguidos e figurinhas (`motor/conquistas.js`): saem do histórico de
   partidas, e a criança vê o resultado. Errar aqui é dar figurinha que não
   ganhou, ou dizer que a sequência acabou quando não acabou. */
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import vm from "node:vm";

const RAIZ = new URL("../../", import.meta.url).pathname;
const ctx = vm.createContext({});
vm.runInContext(readFileSync(RAIZ + "motor/conquistas.js", "utf8")
  + ";this.api={diasSeguidos,figurinhasDe,novidadesDa,FIGURINHAS,ACESSORIOS,nivelDoMascote};", ctx);
const { diasSeguidos, figurinhasDe, novidadesDa, FIGURINHAS, ACESSORIOS, nivelDoMascote } = (ctx as any).api;

// Meio-dia local de um dia do mês: longe da meia-noite e do horário de verão.
const dia = (d: number, h = 12) => new Date(2026, 10, d, h).getTime();
const partida = (d: number, extra: Record<string, unknown> = {}) =>
  ({ q: dia(d), j: "mat", m: "all", a: 3, n: 5, p: 50, c: 2, ...extra });

test("sem partidas, nenhum dia e nenhuma figurinha", () => {
  assert.deepEqual({ ...diasSeguidos([], dia(10)) }, { atual: 0, melhor: 0, jogouHoje: false });
  assert.deepEqual([...figurinhasDe([])], []);
});

test("dias seguidos contam até hoje, e até ontem se ainda não jogou hoje", () => {
  const h = [partida(7), partida(8), partida(8), partida(9)];
  assert.deepEqual({ ...diasSeguidos(h, dia(9, 20)) }, { atual: 3, melhor: 3, jogouHoje: true });
  assert.deepEqual({ ...diasSeguidos(h, dia(10, 8)) }, { atual: 3, melhor: 3, jogouHoje: false });
  // Um dia inteiro sem jogar: a sequência acabou, a melhor fica.
  assert.deepEqual({ ...diasSeguidos(h, dia(11)) }, { atual: 0, melhor: 3, jogouHoje: false });
});

test("a meia-noite separa os dias", () => {
  const h = [{ ...partida(7), q: dia(7, 23) }, { ...partida(8), q: dia(8, 0) + 60e3 }];
  assert.equal(diasSeguidos(h, dia(8)).atual, 2);
});

test("cada figurinha pede exatamente o que diz", () => {
  assert.deepEqual([...figurinhasDe([partida(1)])], ["primeira"]);
  // 90% só vale em partida de 5 questões ou mais; 4 de 4 não é gabarito.
  assert.ok(!figurinhasDe([partida(1, { a: 4, n: 4 })]).includes("gabarito"));
  assert.ok(figurinhasDe([partida(1, { a: 9, n: 10 })]).includes("tres"));
  assert.ok(!figurinhasDe([partida(1, { a: 9, n: 10 })]).includes("gabarito"));
  assert.ok(figurinhasDe([partida(1, { a: 5, n: 5 })]).includes("gabarito"));
  assert.ok(figurinhasDe([partida(1, { c: 5 })]).includes("seq5"));
  assert.ok(!figurinhasDe([partida(1, { c: 9 })]).includes("seq10"));
  // Partida antiga, de antes de guardar a sequência, não quebra a conta.
  const { c, ...semC } = partida(1);
  assert.deepEqual([...figurinhasDe([semC])], ["primeira"]);
  const tresJogos = ["mat", "geo", "ing"].map(j => partida(1, { j }));
  assert.ok(figurinhasDe(tresJogos).includes("explorador"));
  assert.ok(figurinhasDe(Array.from({ length: 5 }, () => partida(3))).includes("maratona"));
  assert.ok(figurinhasDe([partida(1, { p: 600 }), partida(2, { p: 400 })]).includes("mil"));
  assert.ok(figurinhasDe([1, 2, 3].map(d => partida(d))).includes("dias3"));
  assert.ok(!figurinhasDe([1, 2, 4].map(d => partida(d))).includes("dias3"));
});

test("toda figurinha tem nome, descrição e desenho, sem id repetido", () => {
  const ids = FIGURINHAS.map((f: any) => f.id);
  assert.equal(new Set(ids).size, ids.length);
  for (const f of FIGURINHAS) assert.ok(f.nome && f.desc && f.ic, f.id);
});

test("novidades: só o que esta partida trouxe", () => {
  const antes = [partida(7), partida(8)];
  const depois = [...antes, partida(9, { a: 5, n: 5 })];
  const nov = novidadesDa(antes, depois, dia(9));
  assert.deepEqual([...nov.novas.map((f: any) => f.id)], ["tres", "dias3", "gabarito"]);
  assert.equal(nov.dias, 3);
  assert.equal(nov.diasSubiu, true);
  // Segunda partida do mesmo dia: a sequência não sobe de novo.
  const outra = novidadesDa(depois, [...depois, partida(9)], dia(9));
  assert.equal(outra.novas.length, 0);
  assert.equal(outra.diasSubiu, false);
});

test("o mascote ganha um acessório a cada 3 figurinhas, até o álbum completo", () => {
  assert.deepEqual([0, 2, 3, 5, 6, 9, 11, 12].map(nivelDoMascote), [0, 0, 1, 1, 2, 3, 3, 4]);
  // O último acessório é para o álbum inteiro.
  assert.equal(ACESSORIOS[ACESSORIOS.length - 1].min, FIGURINHAS.length);
});
