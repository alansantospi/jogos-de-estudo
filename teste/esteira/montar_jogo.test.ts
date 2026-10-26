/* O jogo criado na conta é montado no navegador (`build/_montar_jogo.js`);
   os feitos à mão, no build (`build/conteudo.py`). Os dois escrevem o mesmo
   banco, os mesmos nomes e as mesmas trilhas, ou o mesmo conteúdo viraria
   jogos diferentes. Aqui se cobra isso sobre todo `conteudo/` do motor céu:
   cada lado monta, o resultado é avaliado, e os objetos têm de ser iguais. */
import { test } from "node:test";
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { readFileSync, readdirSync } from "node:fs";
import vm from "node:vm";

const RAIZ = new URL("../../", import.meta.url).pathname;
const ctx = vm.createContext({});
vm.runInContext(readFileSync(RAIZ + "build/_montar_jogo.js", "utf8"), ctx);
// Cada lado roda no seu contexto; JSON tira a diferença de protótipo.
const avaliar = (codigo: string) => JSON.parse(JSON.stringify(vm.runInNewContext(codigo + ";({bank, nomes, trails})")));

const arquivos = readdirSync(RAIZ + "conteudo").filter(f => f.endsWith(".json"))
  .filter(f => JSON.parse(readFileSync(RAIZ + "conteudo/" + f, "utf8")).motor === "ceu");

const PY = `
import json, sys
sys.path.insert(0, "build")
import conteudo as C
j = json.load(open(sys.argv[1], encoding="utf-8"))
print(C._bloco_bank(j) + "\\n" + C._bloco_nomes(j) + "\\n" + C._bloco_trilhas(j))
`;

for (const f of arquivos) {
  test("o navegador monta " + f + " como o build", () => {
    const jogo = JSON.parse(readFileSync(RAIZ + "conteudo/" + f, "utf8"));
    const py = execFileSync("python3", ["-c", PY, "conteudo/" + f], { cwd: RAIZ, encoding: "utf8" });
    ctx.jogo = jogo;
    const js = vm.runInContext("mjBank(jogo) + '\\n' + mjNomes(jogo) + '\\n' + mjTrilhas(jogo)", ctx);
    assert.deepEqual(avaliar(js), avaliar(py));
  });
}

test("id que não é identificador vai entre aspas, e o fecho de script não passa", () => {
  ctx.jogo = { missoes: [{ id: "a-b", nome: "x" }], trilhas: [], questoes: [
    { tipo: "escolha", missao: "a-b", icone: "lupa", enunciado: "</script>", certa: "c", erradas: ["d"] }] };
  const js = vm.runInContext("mjBank(jogo) + mjNomes(jogo)", ctx);
  assert.doesNotMatch(js, /<\/script/);
  assert.equal(avaliar(js + ";const trails={}").bank["a-b"][0].q, "</script>");
});
