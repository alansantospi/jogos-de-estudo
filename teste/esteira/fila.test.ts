/* A fila da criação, com o banco em memória e um modelo de mentira. O que se
   cobra (conteudo/spec-criar-em-um-toque.md): o plano antes de tudo, as
   missões antes das lições, uma tentativa automática e não mais, o custo de
   cada tarefa somando o que foi pago, e o jogo salvo uma vez só, com as
   questões sem aviso. A escolha da tarefa (quatro por criação, prazo
   vencido) é do banco, em `pegar_tarefa`; aqui o dublê só respeita a ordem. */
import { test } from "node:test";
import assert from "node:assert/strict";
import { custo, ErroEsteira, type Modelo, type Pedido } from "../../supabase/functions/_esteira/esteira.ts";
import { ICONES } from "../../supabase/functions/_esteira/icones.ts";
import { fechar, trabalhar, TENTATIVAS, type Banco, type Criacao, type Fim, type Nova, type PedidoCriacao,
         type Tarefa } from "../../supabase/functions/_esteira/fila.ts";

const MATERIAL = `O setor primário reúne as atividades que retiram da natureza os recursos,
como a agricultura, a pecuária, a pesca e o extrativismo. O setor secundário transforma
a matéria-prima em produtos nas indústrias, como a fábrica que transforma o algodão em tecido.
O setor terciário é o comércio e a prestação de serviços, como o trabalho do professor,
do médico e do vendedor da loja. Os três setores dependem uns dos outros: a indústria precisa
da matéria-prima do campo, e o comércio vende o que a indústria produz.`;
const TRECHO = "O setor secundário transforma\na matéria-prima em produtos nas indústrias";
const USO = { modelo: "claude-opus-5-5", entrada: 1000, saida: 2000, cacheLeitura: 0, cacheEscrita: 0 };
const UM = custo([USO]);

const PLANO = [{ id: "a", nome: "Missão A", descricao: "", quantidade: 2 },
               { id: "b", nome: "Missão B", descricao: "", quantidade: 2 },
               { id: "c", nome: "Missão C", descricao: "", quantidade: 2 }];
const questao = (alvo: string, k: number, o = {}) => ({
  missao: alvo, icone: "trabalho", enunciado: `Pergunta ${alvo}${k}: o que faz o setor secundário?`,
  certa: "Transforma matéria-prima em produtos",
  erradas: ["Retira recursos direto da natureza", "Vende produtos prontos na loja", "Presta serviço de saúde e ensino"],
  explicacao: "A indústria transforma: o algodão vira tecido.", trecho: TRECHO, ...o });
const passo = (alvo: string) => ({
  titulo: "Passo " + alvo, ideia: "A indústria <b>transforma</b>.", trecho: TRECHO, revs: [], revs_cap: "",
  maq: [{ rotulo: "x", saida: "y", nota: "z" }, { rotulo: "x2", saida: "y2", nota: "z2" }], maq_cap: "Toque.",
  alerta: "", quiz: { pergunta: "O que faz?", certa: "Transforma", erradas: ["a", "b", "c"], retorno: "Isso." } });

/* O modelo: responde pelo tipo do pedido; `falhar(tipo, alvo)` decide quando dar erro. */
function modeloDe(falhar: (tipo: string, alvo: string, vez: number) => Error | null = () => null,
                  questoesDe = (alvo: string) => [questao(alvo, 1), questao(alvo, 2)]) {
  const pedidos: { tipo: string; alvo: string }[] = [];
  const modelo: Modelo = async (p: Pedido) => {
    const req = (p.esquema as any).required as string[];
    const u = String(p.usuario);
    const tipo = req.includes("titulo") ? "planejar" : req.includes("passos") ? "licao" : "missao";
    const alvo = tipo === "planejar" ? "" : tipo === "licao"
      ? PLANO.find(m => u.includes(`só da missão "${m.nome}"`))!.id
      : /só da missão "([^"]+)"/.exec(u)![1];
    const vez = pedidos.filter(x => x.tipo === tipo && x.alvo === alvo).length;
    pedidos.push({ tipo, alvo });
    const e = falhar(tipo, alvo, vez);
    if (e) { if (e instanceof ErroEsteira) e.uso = [USO]; throw e; }
    const saida = tipo === "planejar" ? { titulo: "Os três setores", materia: "Geografia", missoes: PLANO }
      : tipo === "licao" ? { passos: [passo(alvo)] }
      : { missoes: PLANO, questoes: questoesDe(alvo) };
    return { saida, uso: USO };
  };
  return { modelo, pedidos };
}

/* O banco em memória, com o mesmo contrato das funções SQL. */
function bancoDe(pedido: Partial<PedidoCriacao> = {}) {
  const criacao: Criacao & { estado: string; erro?: string } = {
    id: 1, conta: "conta-1", geracao: 100, plano: null, jogo: null, estado: "planejando",
    pedido: { titulo: "", materia: "", cor: "", ano: "4º ano", total: 6, automatico: false,
              material: MATERIAL, ...pedido } };
  type Linha = Tarefa & { estado: string; ordem: number; resultado?: any; erro?: string; custo: number };
  const tarefas: Linha[] = [{ id: 1, criacao: 1, tipo: "planejar", alvo: "", tentativas: 0, estado: "fila",
                              ordem: 0, custo: 0 }];
  const salvos: { conteudo: any }[] = [], registros: { estado: string; custo: number }[] = [];
  const reservas: string[] = [];
  const banco: Banco = {
    async pegar() {
      const t = tarefas.filter(x => x.estado === "fila").sort((a, b) => a.ordem - b.ordem || a.id - b.id)[0];
      if (!t) return null;
      t.estado = "fazendo"; t.tentativas++;
      return { tarefa: { ...t }, criacao: structuredClone(criacao) };
    },
    async planejada(_c, p, plano, novas: Nova[]) {
      criacao.pedido = p; criacao.plano = plano; criacao.estado = "escrevendo";
      for (const n of novas)
        tarefas.push({ id: tarefas.length + 1, criacao: 1, tipo: n.tipo, alvo: n.alvo, ordem: n.ordem,
                       tentativas: 0, estado: "fila", custo: 0 });
    },
    async terminar(t, fim: Fim) {
      const l = tarefas.find(x => x.id === t.id)!;
      Object.assign(l, { estado: fim.estado, resultado: fim.resultado, erro: fim.erro, custo: l.custo + fim.custo });
    },
    async desistir(_id, erro) { criacao.estado = "falhou"; criacao.erro = erro; },
    async concluir() {
      if (!["planejando", "escrevendo"].includes(criacao.estado)) return [];
      if (tarefas.some(x => x.estado === "fila" || x.estado === "fazendo")) return [];
      criacao.estado = "montando";
      return [{ criacao: structuredClone(criacao), tarefas: tarefas.map(x => ({ ...x })) }];
    },
    async salvarJogo(_c, conteudo) { salvos.push({ conteudo }); return "jogo-" + salvos.length; },
    async pronta(_id, jogo, erro) { criacao.estado = "pronta"; criacao.jogo = jogo; criacao.erro = erro; },
    async reservar(_conta, tipo) { reservas.push(tipo); return { id: reservas.length, restantes: 2 }; },
    async registrar(_id, estado, usos) { registros.push({ estado, custo: custo(usos) }); },
  };
  return { banco, criacao, tarefas, salvos, registros, reservas };
}

async function esvaziar(banco: Banco, modelo: Modelo) {
  const feitas: Tarefa[] = [];
  for (let r; (r = await trabalhar(banco, modelo, ICONES, () => false)).tarefa;) feitas.push(r.tarefa!);
  return feitas;
}

test("o plano vem antes, as missões antes das lições, e o jogo sai salvo uma vez", async () => {
  const { banco, criacao, salvos, reservas } = bancoDe({ cor: "laranja" });
  const { modelo } = modeloDe();
  const feitas = await esvaziar(banco, modelo);
  assert.deepEqual(feitas.map(t => t.tipo + ":" + t.alvo),
    ["planejar:", "missao:a", "missao:b", "missao:c", "licao:a", "licao:b", "licao:c"]);
  assert.deepEqual(reservas, ["plano", "gerar", "gerar", "gerar", "licao", "licao", "licao"],
    "cada tarefa passa pelas cercas de reservar_geracao, dentro do mesmo jogo");
  assert.equal(salvos.length, 1);
  assert.equal(criacao.estado, "pronta");
  assert.equal(criacao.jogo, "jogo-1");
  const c = salvos[0].conteudo;
  assert.equal(c.titulo, "Os três setores", "nome em branco fica o do plano");
  assert.equal(c.materia, "Geografia");
  assert.equal(c.cor, "laranja");
  assert.deepEqual(c.missoes, [{ id: "a", nome: "Missão A" }, { id: "b", nome: "Missão B" }, { id: "c", nome: "Missão C" }]);
  assert.equal(c.questoes.length, 6);
  assert.deepEqual(c.licao.map((x: any) => x.missao), ["a", "b", "c"]);
  assert.ok(c.licao.every((x: any) => !("problemas" in x) && !("fora" in x)), "a lição salva não leva o estado da revisão");
  assert.equal(c.questoes[0].origem, "derivada");
});

test("o nome que a pessoa deu fica; questão com aviso fica fora do jogo", async () => {
  const { banco, salvos } = bancoDe({ titulo: "Meu jogo", materia: "Geo" });
  // A segunda de cada missão sai com a certa entre as erradas: grave.
  const { modelo } = modeloDe(() => null, alvo => [questao(alvo, 1),
    questao(alvo, 2, { erradas: ["Transforma matéria-prima em produtos", "Vende na loja", "Presta serviço"] })]);
  await esvaziar(banco, modelo);
  assert.equal(salvos[0].conteudo.titulo, "Meu jogo");
  assert.equal(salvos[0].conteudo.materia, "Geo");
  assert.equal(salvos[0].conteudo.questoes.length, 3);
  assert.ok(!("cor" in salvos[0].conteudo), "sem cor escolhida, o jogo sai na cor da matéria");
});

test("falha passageira tenta de novo uma vez; a segunda falha fica", async () => {
  const { banco, tarefas, salvos } = bancoDe();
  // b falha sempre; a lição de a falha só na primeira vez.
  const { modelo, pedidos } = modeloDe((tipo, alvo, vez) =>
    tipo === "missao" && alvo === "b" ? new ErroEsteira("rede", "Demorou demais.")
    : tipo === "licao" && alvo === "a" && vez === 0 ? new ErroEsteira("ocupado", "Ocupado.") : null);
  await esvaziar(banco, modelo);
  assert.equal(TENTATIVAS, 2);
  assert.equal(pedidos.filter(p => p.tipo === "missao" && p.alvo === "b").length, 2, "b tentou duas vezes, e não mais");
  const b = tarefas.find(t => t.tipo === "missao" && t.alvo === "b")!;
  assert.equal(b.estado, "falhou");
  assert.equal(b.erro, "Demorou demais.");
  assert.equal(tarefas.find(t => t.tipo === "licao" && t.alvo === "a")!.estado, "feita");
  // O que a falha gastou fica na tarefa: duas falhas pagas.
  assert.ok(Math.abs(b.custo - 2 * UM) < 1e-12, "custo da tarefa que falhou: " + b.custo);
  assert.equal(salvos.length, 1);
  assert.deepEqual(salvos[0].conteudo.missoes.map((m: any) => m.id), ["a", "c"], "a missão que não veio fica fora");
});

test("recusa não tenta de novo", async () => {
  const { banco, tarefas } = bancoDe();
  const { modelo, pedidos } = modeloDe((tipo, alvo) =>
    tipo === "missao" && alvo === "c" ? new ErroEsteira("recusa", "Recusou.") : null);
  await esvaziar(banco, modelo);
  assert.equal(pedidos.filter(p => p.alvo === "c" && p.tipo === "missao").length, 1);
  assert.equal(tarefas.find(t => t.alvo === "c" && t.tipo === "missao")!.estado, "falhou");
});

test("o custo das tarefas soma tudo o que foi pago", async () => {
  const { banco, tarefas, registros } = bancoDe();
  const { modelo, pedidos } = modeloDe((tipo, alvo, vez) =>
    tipo === "missao" && alvo === "a" && vez === 0 ? new ErroEsteira("formato", "Fora do formato.") : null);
  await esvaziar(banco, modelo);
  const soma = tarefas.reduce((s, t) => s + t.custo, 0);
  assert.ok(Math.abs(soma - pedidos.length * UM) < 1e-12, `tarefas ${soma}, pedidos ${pedidos.length}`);
  assert.ok(Math.abs(registros.reduce((s, r) => s + r.custo, 0) - soma) < 1e-12,
    "o que geracoes registra é o mesmo que as tarefas somam");
});

test("plano que não vem duas vezes desiste da criação, sem missão nenhuma", async () => {
  const { banco, criacao, tarefas, salvos } = bancoDe();
  const { modelo } = modeloDe(tipo => tipo === "planejar" ? new ErroEsteira("modelo", "Recusou o pedido (529).") : null);
  await esvaziar(banco, modelo);
  assert.equal(criacao.estado, "falhou");
  assert.equal(criacao.erro, "Recusou o pedido (529).");
  assert.equal(tarefas.length, 1);
  assert.equal(salvos.length, 0);
});

test("cerca que barra não tenta de novo nem gasta", async () => {
  const { banco, tarefas, registros } = bancoDe();
  banco.reservar = async () => { throw new ErroEsteira("teto", "A geração está pausada por hoje."); };
  const { modelo, pedidos } = modeloDe();
  await esvaziar(banco, modelo);
  assert.equal(pedidos.length, 0);
  assert.equal(registros.length, 0);
  assert.equal(tarefas[0].estado, "falhou");
  assert.equal(tarefas[0].tentativas, 1);
});

test("jogo já salvo não é salvo de novo quando uma tarefa tentada depois termina", async () => {
  const { banco, criacao, tarefas, salvos } = bancoDe();
  const { modelo } = modeloDe((tipo, alvo, vez) => tipo === "missao" && alvo === "b" && vez < 2
    ? new ErroEsteira("rede", "Demorou.") : null);
  await esvaziar(banco, modelo);
  assert.equal(salvos.length, 1);
  // "Tentar de novo" na tela: a tarefa volta à fila com uma vez só.
  Object.assign(tarefas.find(t => t.alvo === "b" && t.tipo === "missao")!, { estado: "fila", tentativas: TENTATIVAS - 1 });
  criacao.estado = "escrevendo";
  await esvaziar(banco, modelo);
  assert.equal(salvos.length, 1, "o que chegou depois vai pela revisão");
  assert.equal(criacao.estado, "pronta");
  assert.equal(criacao.jogo, "jogo-1");
});

test("sem questão limpa, a criação termina sem jogo", async () => {
  const { banco, criacao, salvos } = bancoDe();
  const { modelo } = modeloDe(() => null, alvo => [questao(alvo, 1, { trecho: "Isto não está no material de jeito nenhum." })]);
  await esvaziar(banco, modelo);
  assert.equal(salvos.length, 0);
  assert.equal(criacao.estado, "pronta");
  assert.equal(criacao.jogo, null);
});

test("fechar sozinho não toma criação com tarefa por fazer", async () => {
  const { banco, criacao } = bancoDe();
  await fechar(banco, ICONES);
  assert.equal(criacao.estado, "planejando");
});
