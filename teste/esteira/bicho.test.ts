/* O bichinho (motor/bicho.js): o escolhido só aparece se já estiver aberto. */
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import vm from "node:vm";

const RAIZ = new URL("../../", import.meta.url).pathname;
const guardado: Record<string, string> = {};
const ctx = vm.createContext({ localStorage: {
  getItem: (k: string) => guardado[k] ?? null, setItem: (k: string, v: string) => { guardado[k] = v; } } });
vm.runInContext(readFileSync(RAIZ + "motor/bicho.js", "utf8")
  + ";this.api={bichoEscolhido,guardarBicho,bichoSvg,BICHOS};", ctx);
const { bichoEscolhido, guardarBicho, bichoSvg, BICHOS } = (ctx as any).api;

test("sem escolha, a Bolinha; escolhido e aberto, ele", () => {
  assert.equal(bichoEscolhido(0), "bolinha");
  guardarBicho("gato");
  assert.equal(bichoEscolhido(0), "gato");
});

test("trancado (poucas figurinhas) volta para a Bolinha", () => {
  guardarBicho("robo");
  const robo = BICHOS.find((b: any) => b.id === "robo");
  assert.equal(bichoEscolhido(robo.min - 1), "bolinha");
  assert.equal(bichoEscolhido(robo.min), "robo");
});

test("cada desenho tem id próprio e já vem vestido", () => {
  const s = bichoSvg("bicho-dino", "dino", 3, "feliz");
  assert.match(s, /id="bicho-dino" data-bicho="dino" data-nivel="3"/);
  assert.match(s, /class="mascote feliz"/);
  assert.equal((s.match(/id="/g) || []).length, 1);
});
