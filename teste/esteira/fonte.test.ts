/* rotuloFonte (motor/ceu.molde.html): nos jogos criados, o nome que a câmera
   dá ao arquivo não aparece para a criança. */
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import vm from "node:vm";

const RAIZ = new URL("../../", import.meta.url).pathname;
const molde = readFileSync(RAIZ + "motor/ceu.molde.html", "utf8");
const trecho = molde.slice(molde.indexOf("function rotuloDoArquivo"), molde.indexOf("function renderQuestion"));
const ctx = vm.createContext({});
vm.runInContext(trecho + ";this.rotuloFonte=rotuloFonte;", ctx);
const rotulo = (t: string, d: string) => (ctx as any).rotuloFonte({ t, d });

test("nome de câmera vira 'Sua foto' / 'Seu PDF'", () => {
  for (const d of ["1795373984072913093177844736037.jpg, p.1", "IMG_2041.JPG, p.1",
                   "WhatsApp Image 2026-11-02 at 10.31.22.jpeg, p.1", "PXL_20261101_123456.jpg, p.1"])
    assert.equal(rotulo("foto", d), "Sua foto");
  assert.equal(rotulo("pdf", "scan0001.pdf, p.2"), "Seu PDF, p.2");
});

test("nome escrito por gente fica, sem extensão; página só no PDF", () => {
  assert.equal(rotulo("pdf", "Capitulo_3_Ciencias.pdf, p.4"), "Capitulo 3 Ciencias, p.4");
  assert.equal(rotulo("foto", "resumo de historia.png, p.1"), "resumo de historia");
});

test("livro e folha da escola continuam como eram", () => {
  assert.equal((ctx as any).rotuloFonte({ t: "livro", d: "p.183" }), "Livro, p.183");
  assert.equal((ctx as any).rotuloFonte({ t: "folha", d: "q1" }), "Folha da escola, q1");
});
