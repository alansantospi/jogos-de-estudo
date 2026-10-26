/* A esteira inteira, com um modelo de mentira: sem chave, sem rede, sem
   custo. O que se cobra é o que o PLANO pede dela — cita o trecho, mede,
   regera só o que reprovou, e não perde o que já foi pago. */
import { test } from "node:test";
import assert from "node:assert/strict";
import { conferirEntrada, custo, ErroEsteira, gerar, remedir,
         type Entrada, type Modelo, type Pedido } from "../../supabase/functions/_esteira/esteira.ts";
import { ICONES } from "../../supabase/functions/_esteira/icones.ts";

const MATERIAL = `O setor primário reúne as atividades que retiram da natureza os recursos,
como a agricultura, a pecuária, a pesca e o extrativismo. O setor secundário transforma
a matéria-prima em produtos nas indústrias, como a fábrica que transforma o algodão em tecido.
O setor terciário é o comércio e a prestação de serviços, como o trabalho do professor,
do médico e do vendedor da loja. Os três setores dependem uns dos outros: a indústria precisa
da matéria-prima do campo, e o comércio vende o que a indústria produz.`;

const ENTRADA: Entrada = { material: MATERIAL, titulo: "Os três setores", materia: "Geografia",
                           ano: "4º ano", quantidade: 3 };
const USO = { modelo: "claude-opus-5-5", entrada: 1000, saida: 2000, cacheLeitura: 0, cacheEscrita: 0 };

const boa = (n: number) => ({
  missao: "setores", icone: "trabalho",
  enunciado: `Pergunta ${n}: o que faz o setor secundário?`,
  certa: "Transforma matéria-prima em produtos",
  erradas: ["Retira recursos direto da natureza", "Vende produtos prontos na loja", "Presta serviço de saúde e ensino"],
  explicacao: "A indústria transforma: o algodão vira tecido.",
  trecho: "O setor secundário transforma a matéria-prima em produtos nas indústrias",
});

/* Responde na ordem dada e guarda o que lhe pediram. */
function roteiro(...respostas: (unknown | Error)[]) {
  const pedidos: Pedido[] = [];
  const modelo: Modelo = async p => {
    pedidos.push(p);
    const r = respostas.shift();
    if (r instanceof Error) throw r;
    return { saida: r, uso: USO };
  };
  return { modelo, pedidos };
}

const MISSOES = [{ id: "setores", nome: "Os três setores" }];

test("questões boas passam numa chamada só, sem regerar", async () => {
  const { modelo, pedidos } = roteiro({ missoes: MISSOES, questoes: [boa(1), boa(2), boa(3)] });
  const r = await gerar(ENTRADA, modelo, ICONES);
  assert.equal(pedidos.length, 1);
  assert.equal(r.rodadas, 0);
  assert.deepEqual(r.questoes.map(q => q.problemas), [[], [], []]);
  assert.equal(r.lote!.n, 3);
  assert.equal(r.lote!.amostraPequena, true, "três questões não bastam para reprovar pela média");
  assert.match(pedidos[0].usuario, /<material>\n[\s\S]*<\/material>$/, "o material vai delimitado, como dado");
});

test("regera só as que reprovaram, dizendo por quê", async () => {
  const inventada = { ...boa(2), trecho: "O Big Ben é um relógio famoso de Londres, na Inglaterra" };
  const longa = { ...boa(3), certa: "Transforma a matéria-prima em produtos nas indústrias, como o algodão que vira tecido na fábrica" };
  const { modelo, pedidos } = roteiro(
    { missoes: MISSOES, questoes: [boa(1), inventada, longa] },
    { questoes: [boa(4), boa(5)] });
  const r = await gerar(ENTRADA, modelo, ICONES);

  assert.equal(pedidos.length, 2);
  assert.match(pedidos[1].usuario, /As 2 questões abaixo reprovaram/);
  assert.match(pedidos[1].usuario, /trecho citado não está no material/);
  assert.match(pedidos[1].usuario, /bem mais longa/);
  assert.doesNotMatch(pedidos[1].usuario, /Pergunta 1:/, "a que passou não volta ao modelo");
  assert.deepEqual(r.questoes.map(q => q.enunciado.slice(0, 11)), ["Pergunta 1:", "Pergunta 4:", "Pergunta 5:"]);
  assert.deepEqual(r.questoes.map(q => q.rodada), [0, 1, 1]);
  assert.equal(r.rodadas, 1);
  assert.equal(r.uso.length, 2, "as duas chamadas entram na conta");
});

test("substituta pior não toma o lugar, e as rodadas têm fim", async () => {
  const ruim = { ...boa(2), trecho: "frase que não existe no material de jeito nenhum" };
  const pior = { ...ruim, erradas: ["só isso"], missao: "inexistente" };
  const { modelo, pedidos } = roteiro(
    { missoes: MISSOES, questoes: [boa(1), ruim] }, { questoes: [pior] }, { questoes: [pior] });
  const r = await gerar({ ...ENTRADA, quantidade: 2 }, modelo, ICONES, 2);
  assert.equal(pedidos.length, 3, "uma inicial e duas rodadas, nunca mais");
  assert.equal(r.questoes[1].trecho, ruim.trecho, "ficou a original, que tinha menos problema");
  assert.equal(r.questoes[1].problemas.length, 1);
  assert.equal(r.lote!.n, 1, "a que tem problema grave fica fora da medida do lote");
});

test("se a regeração falha, entrega a rodada já paga e avisa", async () => {
  const ruim = { ...boa(2), trecho: "frase que não existe no material de jeito nenhum" };
  const recusa = new ErroEsteira("recusa", "o modelo recusou");
  recusa.uso = [USO];
  const { modelo } = roteiro({ missoes: MISSOES, questoes: [boa(1), ruim] }, recusa);
  const r = await gerar({ ...ENTRADA, quantidade: 2 }, modelo, ICONES);
  assert.equal(r.questoes.length, 2);
  assert.match(r.aviso!, /regeração falhou/);
  assert.equal(r.uso.length, 2, "o que a chamada recusada gastou também conta");
});

test("falha na primeira chamada leva junto o que foi gasto", async () => {
  const { modelo } = roteiro(new Error("rede caiu"));
  await assert.rejects(gerar(ENTRADA, modelo, ICONES), (e: ErroEsteira) => {
    assert.equal(e.codigo, "modelo");
    assert.deepEqual(e.uso, []);
    return true;
  });
  const fora = roteiro({ missoes: MISSOES, nada: [] });
  await assert.rejects(gerar(ENTRADA, fora.modelo, ICONES), (e: ErroEsteira) => {
    assert.equal(e.codigo, "formato");
    assert.equal(e.uso.length, 1);
    return true;
  });
});

test("id de missão vira identificador que o motor aceita", async () => {
  const { modelo } = roteiro({
    missoes: [{ id: "Água & Solo", nome: "Água e solo" }, { id: "all", nome: "Tudo" },
              { id: "3 setores", nome: "Os três setores" }],
    questoes: [{ ...boa(1), missao: "Água & Solo" }, { ...boa(2), missao: "3 setores" }],
  });
  const r = await gerar({ ...ENTRADA, quantidade: 2 }, modelo, ICONES);
  assert.deepEqual(r.missoes.map(m => m.id), ["agua_solo", "all_2", "m_3_setores"]);
  assert.deepEqual(r.questoes.map(q => q.missao), ["agua_solo", "m_3_setores"]);
  assert.deepEqual(r.questoes.map(q => q.problemas), [[], []]);
});

test("o trecho confere apesar de aspas, travessão e quebra de linha", async () => {
  const q = { ...boa(1), trecho: "Os três setores dependem uns dos outros:   a indústria precisa\nda matéria-prima do campo." };
  const { problemas } = remedir([q], MATERIAL, MISSOES, ICONES);
  assert.deepEqual(problemas[0], []);
  const curto = remedir([{ ...q, trecho: "setor primário" }], MATERIAL, MISSOES, ICONES);
  assert.match(curto.problemas[0][0].texto, /curto demais/);
});

test("a revisão reconfere o que a pessoa editou", () => {
  const editada = { ...boa(1), erradas: ["Retira recursos", "Transforma matéria-prima em produtos", "Vende"] };
  const { problemas } = remedir([editada], MATERIAL, MISSOES, ICONES);
  assert.ok(problemas[0].some(p => p.grave && /aparece também entre as erradas/.test(p.texto)));
});

test("a entrada tem limites que seguram o custo", () => {
  assert.equal(conferirEntrada({ ...ENTRADA, quantidade: 10 }), null);
  assert.match(conferirEntrada({ ...ENTRADA, material: "curto" })!, /pelo menos 300/);
  assert.match(conferirEntrada({ ...ENTRADA, material: "x".repeat(20001) })!, /limite é 20000/);
  assert.match(conferirEntrada({ ...ENTRADA, quantidade: 50 })!, /entre 5 e 20/);
  assert.match(conferirEntrada({ ...ENTRADA, titulo: " " })!, /título/);
});

test("o custo usa o preço do modelo que respondeu, e o mais caro se não souber", () => {
  assert.equal(custo([USO]), (1000 * 4 + 2000 * 20) / 1e6);
  assert.equal(custo([{ ...USO, modelo: "desconhecido" }]), (1000 * 10 + 2000 * 50) / 1e6);
});

test("sem tempo para regerar, entrega o que tem e avisa", async () => {
  const ruim = { ...boa(2), trecho: "frase que não existe no material de jeito nenhum" };
  const { modelo, pedidos } = roteiro({ missoes: MISSOES, questoes: [boa(1), ruim] });
  const r = await gerar({ ...ENTRADA, quantidade: 2 }, modelo, ICONES, 2, () => false);
  assert.equal(pedidos.length, 1);
  assert.equal(r.rodadas, 0);
  assert.match(r.aviso!, /Faltou tempo/);
});
