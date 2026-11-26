/* haQuanto (motor/tempo.js): as datas da aplicação em palavras. */
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import vm from "node:vm";

const RAIZ = new URL("../../", import.meta.url).pathname;
const ctx = vm.createContext({});
vm.runInContext(readFileSync(RAIZ + "motor/tempo.js", "utf8") + ";this.haQuanto=haQuanto;", ctx);
const ha = (ctx as any).haQuanto;
const agora = new Date(2026, 10, 26, 15, 0).getTime();
const antes = (min: number) => agora - min * 6e4;

test("minutos e horas no mesmo dia", () => {
  assert.equal(ha(antes(0), agora), "agora há pouco");
  assert.equal(ha(antes(5), agora), "há 5 min");
  assert.equal(ha(antes(60), agora), "há 1 hora");
  assert.equal(ha(antes(14 * 60), agora), "há 14 horas");
});

test("dias pelo calendário, depois semanas, meses e anos", () => {
  assert.equal(ha(new Date(2026, 10, 25, 23, 0).getTime(), agora), "ontem");
  assert.equal(ha(new Date(2026, 10, 23, 9, 0).getTime(), agora), "há 3 dias");
  assert.equal(ha(new Date(2026, 10, 12).getTime(), agora), "há 2 semanas");
  assert.equal(ha(new Date(2026, 9, 25).getTime(), agora), "há 1 mês");
  assert.equal(ha(new Date(2024, 10, 1).getTime(), agora), "há 2 anos");
  assert.equal(ha("2026-11-26T14:00:00", agora), "há 1 hora");
  assert.equal(ha(0, agora), "");
});
