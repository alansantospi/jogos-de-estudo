/* A lição do jogo criado, com um modelo de mentira. O que se cobra: que o
   passo sem citação conferível não passe como bom, que só <b> chegue ao
   jogo, e que a troca aconteça uma vez, só quando algo reprovou. */
import { test } from "node:test";
import assert from "node:assert/strict";
import { ErroEsteira, type Modelo, type Pedido } from "../../supabase/functions/_esteira/esteira.ts";
import { arrumarPassos, conferirPasso, escreverLicao } from "../../supabase/functions/_esteira/licao.ts";

const USO = { modelo: "claude-opus-5-5", entrada: 5000, saida: 1500, cacheLeitura: 0, cacheEscrita: 0 };
const MATERIAL = "Na pecuária extensiva os animais ficam soltos em grandes áreas de pastagem. " +
  "Na pecuária intensiva os animais ficam em espaços menores e recebem ração.";
const MISSOES = [{ id: "pecuaria", nome: "Pecuária", descricao: "extensiva e intensiva" },
                 { id: "pesca", nome: "Pesca", descricao: "a pesca no rio" }];
const ENTRADA = { material: MATERIAL, materia: "Geografia", ano: "4º ano", missoes: MISSOES, alvo: "pecuaria" };

const passo = (o = {}) => ({
  titulo: "Pasto aberto ou confinamento",
  ideia: "Pecuária é a <b>criação de animais</b>.",
  trecho: "os animais ficam soltos em grandes áreas de pastagem",
  revs: [], revs_cap: "",
  maq: [{ rotulo: "extensiva", saida: "pasto aberto", nota: "Animais <b>soltos</b>." },
        { rotulo: "intensiva", saida: "confinamento", nota: "Com <b>ração</b>." }],
  maq_cap: "Toque um tipo.", alerta: "",
  quiz: { pergunta: "Na intensiva, os animais:", certa: "Recebem ração",
          erradas: ["Ficam soltos", "Vivem no rio", "Não comem"], retorno: "Espaço menor, com ração." },
  ...o });

function roteiro(...respostas: unknown[]) {
  const pedidos: Pedido[] = [];
  const modelo: Modelo = async p => {
    pedidos.push(p);
    const r = respostas[Math.min(pedidos.length - 1, respostas.length - 1)];
    if (r instanceof Error) throw r;
    return { saida: r, uso: USO };
  };
  return { modelo, pedidos };
}

test("passo bom passa sem problema e sem troca", async () => {
  const { modelo, pedidos } = roteiro({ passos: [passo()] });
  const r = await escreverLicao(ENTRADA, modelo);
  assert.equal(pedidos.length, 1);
  assert.equal(r.rodadas, 0);
  assert.equal(r.passos[0].missao, "pecuaria", "o passo é da missão pedida, diga o modelo o que disser");
  assert.deepEqual(r.passos[0].problemas, []);
  assert.equal(pedidos[0].esforco, "medium");
  assert.match(pedidos[0].usuario as string, /Não ensine o assunto delas:\n- Pesca/);
});

test("trecho que não está no material reprova, e a troca diz por quê", async () => {
  const ruim = passo({ trecho: "os animais vivem felizes na fazenda de sempre" });
  const { modelo, pedidos } = roteiro({ passos: [ruim] }, { passos: [passo()] });
  const r = await escreverLicao(ENTRADA, modelo);
  assert.equal(pedidos.length, 2);
  assert.equal(r.rodadas, 1);
  assert.match(pedidos[1].usuario as string, /reprovou na conferência:\n- Pasto aberto ou confinamento: O trecho citado/);
  assert.deepEqual(r.passos[0].problemas, []);
});

test("a troca que não melhora fica com a primeira versão", async () => {
  const ruim = passo({ trecho: "nada disso está no material colado" });
  const { modelo } = roteiro({ passos: [ruim] }, { passos: [ruim, ruim] });
  const r = await escreverLicao(ENTRADA, modelo);
  assert.equal(r.passos.length, 1);
  assert.ok(r.passos[0].problemas.some(p => p.grave));
});

test("sem tempo, não troca e avisa", async () => {
  const { modelo, pedidos } = roteiro({ passos: [passo({ trecho: "curto" })] });
  const r = await escreverLicao(ENTRADA, modelo, () => false);
  assert.equal(pedidos.length, 1);
  assert.match(r.aviso!, /Faltou tempo/);
});

test("a checagem quebrada é grave", () => {
  const ps = arrumarPassos({ passos: [passo({ quiz: { pergunta: "P?", certa: "A", erradas: ["A", "B"], retorno: "" } })] }, "x");
  const probs = conferirPasso(ps[0], MATERIAL).map(p => p.texto).join(" | ");
  assert.match(probs, /três erradas/);
  assert.match(probs, /repete alternativa/);
});

test("só <b> chega ao jogo, e só onde o desenho o espera", () => {
  const [p] = arrumarPassos({ passos: [passo({
    titulo: "Gado <b>solto</b>",
    ideia: 'Pecuária <B>é</B> <img src=x onerror="alert(1)"><b onclick="x">criar</b> <script>x</script>animais.',
    revs: [{ titulo: "<i>Boi</i>", resposta: "<b>pasto</b>" }, { titulo: "Galinha", resposta: "granja" }],
  })] }, "pecuaria");
  assert.equal(p.titulo, "Gado solto");
  assert.equal(p.ideia, "Pecuária <b>é</b> criar</b> xanimais.");
  assert.deepEqual(p.revs[0], { titulo: "Boi", resposta: "pasto" });
});

test("interação de uma opção só não é interação; passa de dois passos, corta", () => {
  const ps = arrumarPassos({ passos: [passo({ maq: [{ rotulo: "só", saida: "x", nota: "" }], maq_cap: "Toque" }),
                                      passo(), passo()] }, "pecuaria");
  assert.equal(ps.length, 2);
  assert.deepEqual(ps[0].maq, []);
  assert.equal(ps[0].maq_cap, "");
});

test("resposta fora do formato é erro com o gasto junto", async () => {
  const { modelo } = roteiro({ outra: 1 });
  await assert.rejects(escreverLicao(ENTRADA, modelo), (e: ErroEsteira) => e.codigo === "formato" && e.uso.length === 1);
});
