/* Os tipos de questão que quem cria escolhe antes de gerar. Cobra que a
   escolha chega ao modelo e o prende, que cada tipo tem a sua conferência,
   que os medidores de atalho continuam só na múltipla escolha, e que o jogo
   salvo volta à revisão sem perder questão. */
import { test } from "node:test";
import assert from "node:assert/strict";
import { conferirEntrada, gerar, remedir, type Entrada, type Modelo, type Pedido }
  from "../../supabase/functions/_esteira/esteira.ts";
import { conferir, limpar } from "../../supabase/functions/_esteira/conferir.ts";
// @ts-ignore: JavaScript puro
import { conteudoDoJogo, questaoDoConteudo } from "../../supabase/functions/_esteira/conteudo.js";
import { ICONES } from "../../supabase/functions/_esteira/icones.ts";

const MATERIAL = `A água dos rios e dos mares esquenta com o calor do Sol e evapora, virando vapor.
O vapor sobe, esfria e se condensa, formando as nuvens. Quando as gotas das nuvens ficam pesadas,
a água cai como chuva: é a precipitação. A chuva volta para os rios, os mares e o solo, e o ciclo recomeça.
A evaporação é a passagem do líquido para o vapor. A condensação é a passagem do vapor para o líquido.
A solidificação é a passagem do líquido para o sólido, como a água que vira gelo no congelador.`;

const USO = { modelo: "claude-opus-5-5", entrada: 1000, saida: 2000, cacheLeitura: 0, cacheEscrita: 0 };
const MISSOES = [{ id: "ciclo", nome: "O ciclo da água" }];
const ENTRADA: Entrada = { material: MATERIAL, titulo: "Ciclo da água", materia: "Ciências", ano: "4º ano",
                           quantidade: 4, tipos: ["escolha", "vf", "ligar", "ordenar"] };

/* Como o modelo devolve: todos os campos, os de fora do tipo vazios. */
const vazios = { certa: "", erradas: [], verdadeira: false, pares: [], sequencia: [] };
const comum = { missao: "ciclo", icone: "agua", explicacao: "É o que o texto diz sobre o ciclo da água." };
const escolha = { ...vazios, ...comum, tipo: "escolha", enunciado: "Como se chama a água que cai das nuvens?",
  certa: "Precipitação", erradas: ["Evaporação", "Condensação", "Solidificação"],
  trecho: "a água cai como chuva: é a precipitação" };
const vf = { ...vazios, ...comum, tipo: "vf", enunciado: "A condensação forma as nuvens.", verdadeira: true,
  trecho: "O vapor sobe, esfria e se condensa, formando as nuvens" };
const ligar = { ...vazios, ...comum, tipo: "ligar", enunciado: "Ligue cada mudança ao que acontece.",
  pares: [{ termo: "Evaporação", par: "Líquido vira vapor" }, { termo: "Condensação", par: "Vapor vira líquido" },
          { termo: "Solidificação", par: "Líquido vira sólido" }],
  trecho: "A evaporação é a passagem do líquido para o vapor" };
const ordenar = { ...vazios, ...comum, tipo: "ordenar", enunciado: "Coloque o ciclo da água em ordem.",
  sequencia: ["A água evapora", "O vapor forma nuvens", "A chuva cai"],
  trecho: "O vapor sobe, esfria e se condensa, formando as nuvens" };

function roteiro(...respostas: unknown[]) {
  const pedidos: Pedido[] = [];
  const modelo: Modelo = async p => { pedidos.push(p); return { saida: respostas.shift(), uso: USO }; };
  return { modelo, pedidos };
}
const enumTipo = (p: Pedido) => (p.esquema as any).properties.questoes.items.properties.tipo.enum;
const icone = ICONES.includes("agua") ? "agua" : ICONES[0];
[escolha, vf, ligar, ordenar].forEach(q => { q.icone = icone; });

test("os quatro tipos passam, cada um só com os seus campos", async () => {
  const { modelo, pedidos } = roteiro({ missoes: MISSOES, questoes: [escolha, vf, ligar, ordenar] });
  const r = await gerar(ENTRADA, modelo, ICONES);
  assert.equal(pedidos.length, 1, "nada reprovou, nada regerado");
  assert.deepEqual(r.questoes.map(q => q.problemas), [[], [], [], []]);
  assert.deepEqual(r.questoes.map(q => q.tipo), ["escolha", "vf", "ligar", "ordenar"]);
  const [e, v, l, o] = r.questoes;
  assert.equal(v.verdadeira, true);
  assert.equal(v.certa, "");
  assert.deepEqual(l.pares, [["Evaporação", "Líquido vira vapor"], ["Condensação", "Vapor vira líquido"],
                             ["Solidificação", "Líquido vira sólido"]]);
  assert.deepEqual(o.sequencia, ordenar.sequencia);
  assert.equal("pares" in e, false, "a múltipla escolha não leva os campos dos outros tipos");
  assert.equal(r.lote!.n, 1, "os medidores de atalho só contam a múltipla escolha");
});

test("a escolha chega ao modelo e o prende", async () => {
  const { modelo, pedidos } = roteiro({ missoes: MISSOES, questoes: [vf] });
  await gerar({ ...ENTRADA, tipos: ["vf", "ordenar"], quantidade: 1 }, modelo, ICONES);
  assert.deepEqual(enumTipo(pedidos[0]), ["vf", "ordenar"]);
  assert.match(String(pedidos[0].usuario), /verdadeiro ou falso \(vf\), pôr em ordem \(ordenar\)/);
  assert.doesNotMatch(String(pedidos[0].usuario), /múltipla escolha \(escolha\)/);
});

test("sem escolha de tipos, é só múltipla escolha, como antes", async () => {
  const { modelo, pedidos } = roteiro({ missoes: MISSOES, questoes: [escolha] });
  const { tipos: _, ...antiga } = ENTRADA;
  await gerar({ ...antiga, quantidade: 1 }, modelo, ICONES);
  assert.deepEqual(enumTipo(pedidos[0]), ["escolha"]);
});

test("tipo que não foi escolhido reprova e volta ao modelo", async () => {
  const { modelo, pedidos } = roteiro({ missoes: MISSOES, questoes: [escolha, ligar] }, { questoes: [vf] });
  const r = await gerar({ ...ENTRADA, tipos: ["escolha", "vf"], quantidade: 2 }, modelo, ICONES);
  assert.equal(pedidos.length, 2);
  assert.match(String(pedidos[1].usuario), /não foi escolhido/);
  assert.deepEqual(r.questoes.map(q => q.tipo), ["escolha", "vf"]);
});

test("cada tipo tem a sua conferência", () => {
  const ids = new Set(["ciclo"]), nomes = new Set(ICONES);
  const graves = (q: any) => conferir(q, MATERIAL, ids, nomes).filter(p => p.grave).map(p => p.texto);
  assert.match(graves({ ...ligar, pares: ligar.pares.slice(0, 2) }).join(), /São 2 pares/);
  assert.match(graves({ ...ligar, pares: [...ligar.pares.slice(0, 2), { termo: "Evaporação", par: "outro" }] }).join(),
               /ambígua/);
  assert.match(graves({ ...ordenar, sequencia: ["A", "B", "A"] }).join(), /repetidos/);
  assert.match(graves({ ...ordenar, sequencia: ["A", "B"] }).join(), /São 2 itens/);
  assert.match(graves({ ...vf, enunciado: "" }).join(), /Falta a afirmação/);
  assert.match(graves({ ...escolha, tipo: "digitar" }).join(), /não tem questão do tipo "digitar"/);
  assert.deepEqual(graves(vf), [], "verdadeiro ou falso não precisa de resposta em texto");
  // Atalho de comprimento é de alternativa: não se aplica a quem não tem.
  assert.deepEqual(conferir({ ...vf, explicacao: "x".repeat(300) } as any, MATERIAL, ids, nomes), []);
});

test("pedido com tipo desconhecido ou nenhum não passa", () => {
  const base = { ...ENTRADA, quantidade: 3 };
  assert.match(conferirEntrada({ ...base, tipos: [] })!, /pelo menos um tipo/);
  assert.match(conferirEntrada({ ...base, tipos: ["digitar"] as any })!, /pelo menos um tipo/);
  assert.equal(conferirEntrada(base), null);
});

test("a reconferência da revisão aceita os tipos e mede só a múltipla escolha", () => {
  const qs = [escolha, vf, ligar, ordenar].map(q => limpar(q as any));
  const r = remedir(qs, MATERIAL, MISSOES, ICONES);
  assert.deepEqual(r.problemas, [[], [], [], []]);
  assert.equal(r.lote!.n, 1);
});

test("o jogo salvo leva cada tipo no formato de conteudo/ e volta igual à revisão", () => {
  const qs = [escolha, vf, ligar, ordenar].map(q => limpar(q as any));
  const c = conteudoDoJogo({ pedido: { titulo: "Ciclo", ano: "4º ano", materia: "Ciências" },
                             missoes: MISSOES, questoes: qs });
  const [e, v, l, o] = c.questoes;
  assert.deepEqual([e.certa, e.erradas.length], ["Precipitação", 3]);
  assert.equal(v.certa, true, "vf guarda a resposta como booleano, como build/esquema.py pede");
  assert.deepEqual(l.pares[0], ["Evaporação", "Líquido vira vapor"]);
  assert.deepEqual(o.sequencia, ordenar.sequencia);
  for (const q of c.questoes) {
    assert.equal("verdadeira" in q, false);
    assert.equal(q.tipo === "escolha" || !("erradas" in q), true, "só a múltipla escolha leva erradas");
  }
  const volta = c.questoes.map(questaoDoConteudo);
  assert.deepEqual(volta.map((q: any) => q.tipo), ["escolha", "vf", "ligar", "ordenar"]);
  assert.equal(volta[1].verdadeira, true);
  assert.deepEqual(volta[2].pares, l.pares);
  assert.equal(questaoDoConteudo({ tipo: "digitar", aceitas: ["x"] }), null, "tipo que a revisão não edita fica fora");
});
