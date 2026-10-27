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

/* A lição: o passo e o bloco do resumo, desenhados dos dois lados sobre os
   mesmos passos. O Python recebe os passos no formato das lições à mão
   (pares, eixos); o navegador, no formato salvo. Os dois escapam diferente
   — o Python confia no texto, o navegador não —, então a comparação é
   depois de desfeitas as entidades: o que a tela mostra tem de ser o mesmo. */
const PASSOS = [
  { missao: "pecuaria", titulo: "Pasto aberto ou confinamento", ideia: "Pecuária é a <b>criação de animais</b>.",
    trecho: "x", revs: [], revs_cap: "", alerta: "Não é <b>extrativismo</b>.",
    maq: [{ rotulo: "extensiva", saida: "grandes pastagens", nota: "Animais <b>soltos</b>." },
          { rotulo: "intensiva", saida: "espaços menores", nota: "Com <b>ração</b>." }], maq_cap: "Toque um tipo.",
    quiz: { pergunta: "Na intensiva, os animais:", certa: "Recebem ração",
            erradas: ["Ficam soltos", "Vivem no rio", "Não comem"], retorno: "Espaço menor, com ração." } },
  { missao: "primario", titulo: "O que vem direto da natureza", ideia: "Tirado <b>direto da natureza</b>.",
    trecho: "x", revs: [{ titulo: "Agricultura", resposta: "cultivar plantas" }, { titulo: "Pesca", resposta: "retirar peixes" }],
    revs_cap: "Toque cada atividade.", maq: [], maq_cap: "", alerta: "",
    quiz: { pergunta: "Qual NÃO é primário?", certa: "Refino", erradas: ["Pesca", "Agricultura", "Mineração"],
            retorno: "Refinar é transformar." } },
];
const PY_LICAO = `
import json, sys
sys.path.insert(0, "build")
import licao as L
passos = json.loads(sys.stdin.read())
L.ICONE = {"pecuaria": "vaca", "primario": "folha"}
out = []
for i, g in enumerate(passos, 1):
    p = dict(missao=g["missao"], titulo=g["titulo"], ideia=g["ideia"],
             quiz=dict(p=g["quiz"]["pergunta"], r=g["quiz"]["retorno"],
                       o=[(g["quiz"]["certa"], True)] + [(e, False) for e in g["quiz"]["erradas"]]))
    if g["revs"]:
        p.update(revs=[(r["titulo"], r["resposta"]) for r in g["revs"]], revs_cap=g["revs_cap"])
    if g["maq"]:
        v = ["o%d" % (k + 1) for k in range(len(g["maq"]))]
        p["maq"] = dict(eixos=[[(v[k], o["rotulo"]) for k, o in enumerate(g["maq"])]],
                        saidas={v[k]: o["saida"] for k, o in enumerate(g["maq"])},
                        notas={v[k]: o["nota"] for k, o in enumerate(g["maq"])}, cap=g["maq_cap"])
    if g["alerta"]:
        p["alerta"] = g["alerta"]
    out.append(L.passo(p, i, len(passos)))
    out.append(L._bloco(p, g["missao"]))
print(json.dumps(out))
`;
const desfazer = (s: string) => s.replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&lt;/g, "<")
  .replace(/&gt;/g, ">").replace(/&amp;/g, "&");

test("o passo e o resumo da lição saem como os de licao.py", () => {
  // `checar` gira a certa a partir do contador global: cada processo começa do zero.
  const py: string[] = JSON.parse(execFileSync("python3", ["-c", PY_LICAO],
    { cwd: RAIZ, encoding: "utf8", input: JSON.stringify(PASSOS) }));
  ctx.passos = PASSOS;
  const js: string[] = vm.runInContext(`passos.flatMap((p, k) => [mjPasso(p, k + 1, passos.length),
    mjBloco(p, {pecuaria: "vaca", primario: "folha"}[p.missao])])`, ctx);
  assert.equal(js.length, py.length);
  js.forEach((h, k) => assert.equal(desfazer(h), desfazer(py[k]), "peça " + k));
});

test("texto do modelo na lição não vira marcação", () => {
  const mau = { ...PASSOS[0], titulo: "<img src=x onerror=alert(1)>", ideia: "<b>ok</b><script>x()</script>",
    maq: [{ rotulo: "a", saida: "<img src=x>", nota: "<b>n</b>" }, { rotulo: "b", saida: "s", nota: "" }] };
  ctx.mau = mau;
  const h: string = vm.runInContext("mjPasso(mau, 1, 1)", ctx);
  assert.doesNotMatch(h, /<img|<script/);
  assert.match(h, /<p class="mic-ideia"><b>ok<\/b>&lt;script&gt;/);
  // No atributo, o que o navegador vai pôr em innerHTML continua escapado depois de desfeitas as entidades.
  const out = /data-out="([^"]*)"/.exec(h)![1];
  assert.doesNotMatch(desfazer(out), /<img/);
});

test("o jogo com lição ganha os botões de estudar; sem lição, não", () => {
  const molde = readFileSync(RAIZ + "motor/ceu.molde.html", "utf8").replace("<!--%SPRITE%-->", "");
  const jogo = { titulo: "Pecuária", materia: "Geografia", missoes: [{ id: "pecuaria", nome: "Pecuária" },
    { id: "primario", nome: "Primário" }], trilhas: [{ id: "tudo", nome: "Todas", etapas: ["pecuaria", "primario", "all"] }],
    questoes: [{ tipo: "escolha", missao: "pecuaria", icone: "vaca", enunciado: "q", certa: "c", erradas: ["d", "e", "f"] }],
    licao: [PASSOS[1], PASSOS[0], { ...PASSOS[0], missao: "sumiu" }] };
  ctx.args = { molde, jogo, pecas: { css: "<style>/*%CHAVE%*/</style>", js: "<script>'%CHAVE%'</script>" } };
  const com: string = vm.runInContext("montarJogo(args.molde, args.jogo, 'abc-123', args.pecas)", ctx);
  assert.match(com, /Estudar passo a passo/);
  assert.match(com, /'gerado_abc123_licao_v1'/);
  // Na ordem das missões, e o passo de missão que saiu do jogo fica de fora.
  assert.match(com, /id="lesson1"[\s\S]*Pasto aberto[\s\S]*id="lesson2"[\s\S]*direto da natureza/);
  assert.doesNotMatch(com, /id="lesson3"/);
  ctx.args.jogo = { ...jogo, licao: [] };
  const sem: string = vm.runInContext("montarJogo(args.molde, args.jogo, 'abc-123', args.pecas)", ctx);
  assert.doesNotMatch(sem, /Estudar passo a passo/);
});
