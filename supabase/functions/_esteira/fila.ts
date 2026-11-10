/* A criação conduzida pelo servidor: o jogo vira uma fila de tarefas no
   banco (plano, uma por missão, uma por lição), e a função trabalha a fila,
   uma tarefa por vez. Fechar a tela não para nada. Ver
   conteudo/spec-criar-em-um-toque.md.

   O banco entra como parâmetro, como o modelo na esteira: aqui não há SQL
   nem rede, e `teste/esteira/fila.test.ts` roda a fila inteira em memória.
   Quem escolhe a próxima tarefa (ordem, quatro por criação, prazo vencido)
   é `pegar_tarefa`, no banco; aqui é o que se faz com ela. */

import { custo, ErroEsteira, gerar, planejar, remedir, type Missao, type Modelo, type Uso }
  from "./esteira.ts";
import { escreverLicao } from "./licao.ts";
// @ts-ignore: JavaScript puro, compartilhado com gerar.html
import { conteudoDoJogo } from "./conteudo.js";

export type PedidoCriacao = { titulo: string; materia: string; cor: string; ano: string;
                              total: number; automatico: boolean; material: string;
                              paginas?: { nome: string; pagina: number; texto: string }[] };
export type Tipo = "planejar" | "missao" | "licao";
export type Tarefa = { id: number; criacao: number; tipo: Tipo; alvo: string; tentativas: number };
export type Criacao = { id: number; conta: string; geracao: number; pedido: PedidoCriacao;
                        plano: Missao[] | null; jogo: string | null };
export type Fim = { estado: "feita" | "fila" | "falhou"; resultado?: unknown; erro?: string; custo: number };
export type Nova = { tipo: Tipo; alvo: string; ordem: number };
export type Feita = { tipo: Tipo; alvo: string; estado: string; resultado: any };
export type Reserva = { id: number; restantes: number };

export interface Banco {
  /* A próxima tarefa que cabe, já marcada como `fazendo` e com a tentativa contada. */
  pegar(): Promise<{ tarefa: Tarefa; criacao: Criacao } | null>;
  /* O plano chegou: guarda-o na criação e enfileira as tarefas dele. */
  planejada(c: Criacao, pedido: PedidoCriacao, plano: Missao[], novas: Nova[]): Promise<void>;
  terminar(t: Tarefa, fim: Fim): Promise<void>;
  /* A criação não tem como seguir (o plano não veio). */
  desistir(criacao: number, erro: string): Promise<void>;
  /* Toma as criações sem tarefa por fazer, uma vez cada, com o que veio. */
  concluir(): Promise<{ criacao: Criacao; tarefas: Feita[] }[]>;
  salvarJogo(c: Criacao, conteudo: Record<string, unknown>): Promise<string>;
  pronta(criacao: number, jogo: string | null, erro?: string): Promise<void>;
  /* Lança ErroEsteira quando uma cerca de `reservar_geracao` barra. */
  reservar(conta: string, tipo: string, caracteres: number, pedidas: number, criacao: number): Promise<Reserva>;
  registrar(id: number, estado: string, usos: Uso[], extra?: Record<string, unknown>): Promise<void>;
}

/* Decisão de 10/11/2026: cada tarefa tenta no máximo duas vezes sozinha. */
export const TENTATIVAS = 2;
/* Falha que não muda tentando de novo: cerca, configuração, recusa. */
const NAO_REPETE = new Set(["configuracao", "limite", "teto", "partes", "criacao", "entrada", "recusa"]);
export const PARALELO = 4;

type Feito = { resultado: unknown; usos: Uso[] };

async function fazer(t: Tarefa, c: Criacao, banco: Banco, modelo: Modelo, icones: string[],
                     temTempo: () => boolean): Promise<Feito & { plano?: Awaited<ReturnType<typeof planejar>> }> {
  const p = c.pedido;
  if (t.tipo === "planejar") {
    const res = await banco.reservar(c.conta, "plano", p.material.length, p.total, c.geracao);
    try {
      const r = await planejar({ material: p.material, materia: p.materia, ano: p.ano, total: p.total,
                                 automatico: p.automatico }, modelo);
      await banco.registrar(res.id, "feita", r.uso, { entregues: r.missoes.length, rodadas: 1 });
      return { resultado: { missoes: r.missoes, total: r.total, titulo: r.titulo, materia: r.materia },
               usos: r.uso, plano: r };
    } catch (e) { await registrarFalha(banco, res.id, e); throw e; }
  }
  const plano = c.plano || [];
  const m = plano.find(x => x.id === t.alvo);
  if (!m) throw new ErroEsteira("entrada", "A missão pedida não está no plano.");
  if (t.tipo === "licao") {
    const res = await banco.reservar(c.conta, "licao", p.material.length, 1, c.geracao);
    try {
      const r = await escreverLicao({ material: p.material, materia: p.materia, ano: p.ano,
                                      missoes: plano, alvo: t.alvo }, modelo, temTempo);
      await banco.registrar(res.id, "feita", r.uso, { entregues: r.passos.length, rodadas: r.rodadas,
        reprovadas: r.passos.filter(x => x.problemas.some(y => y.grave)).length });
      // Passo que não se conferiu contra o material já chega fora da lição.
      return { resultado: { aviso: r.aviso || "",
                            passos: r.passos.map(x => ({ ...x, fora: x.problemas.some(y => y.grave) })) },
               usos: r.uso };
    } catch (e) { await registrarFalha(banco, res.id, e); throw e; }
  }
  const res = await banco.reservar(c.conta, "gerar", p.material.length, m.quantidade ?? 1, c.geracao);
  try {
    const r = await gerar({ material: p.material, titulo: p.titulo, materia: p.materia, ano: p.ano,
                            quantidade: m.quantidade ?? 1, missoes: plano, alvo: t.alvo },
                          modelo, icones, 2, temTempo);
    await banco.registrar(res.id, "feita", r.uso, { entregues: r.questoes.length, rodadas: r.rodadas,
      reprovadas: r.questoes.filter(q => q.problemas.length).length });
    return { resultado: { questoes: r.questoes, aviso: r.aviso || "" }, usos: r.uso };
  } catch (e) { await registrarFalha(banco, res.id, e); throw e; }
}

async function registrarFalha(banco: Banco, id: number, e: unknown) {
  await banco.registrar(id, "falhou", e instanceof ErroEsteira ? e.uso : [],
                        { erro: e instanceof Error ? e.message : String(e) });
}

/* Uma tarefa, do começo ao fim. Devolve o que fez (null: fila vazia) e
   quantas tarefas novas entraram, para quem chamou acordar mais cadeias. */
export async function trabalhar(banco: Banco, modelo: Modelo, icones: string[],
                                temTempo: () => boolean = () => true)
  : Promise<{ tarefa: Tarefa | null; novas: number }> {
  const pego = await banco.pegar();
  if (!pego) { await fechar(banco, icones); return { tarefa: null, novas: 0 }; }
  const { tarefa: t, criacao: c } = pego;
  let novas = 0;
  try {
    const r = await fazer(t, c, banco, modelo, icones, temTempo);
    if (r.plano) {
      const pl = r.plano;
      // Nome e matéria em branco: ficam os do plano, como na tela.
      const pedido = { ...c.pedido, titulo: c.pedido.titulo || pl.titulo || "Jogo sem nome",
                       materia: c.pedido.materia || pl.materia || "Estudo" };
      // As questões primeiro: são o que se revisa enquanto a lição se escreve.
      const lista: Nova[] = [...pl.missoes.map(m => ({ tipo: "missao" as const, alvo: m.id, ordem: 1 })),
                             ...pl.missoes.map(m => ({ tipo: "licao" as const, alvo: m.id, ordem: 2 }))];
      // Antes de dar o plano por feito: senão a criação pareceria terminada sem missão.
      await banco.planejada(c, pedido, pl.missoes, lista);
      novas = lista.length;
    }
    await banco.terminar(t, { estado: "feita", resultado: r.resultado, custo: custo(r.usos) });
  } catch (e) {
    const usos = e instanceof ErroEsteira ? e.uso : [];
    const codigo = e instanceof ErroEsteira ? e.codigo : "interno";
    if (!(e instanceof ErroEsteira)) console.error("trabalhar", t.id, e);
    const mensagem = e instanceof ErroEsteira ? e.message : "Erro inesperado.";
    const deNovo = t.tentativas < TENTATIVAS && !NAO_REPETE.has(codigo);
    await banco.terminar(t, { estado: deNovo ? "fila" : "falhou", erro: mensagem, custo: custo(usos) });
    if (!deNovo && t.tipo === "planejar") await banco.desistir(c.id, mensagem);
  }
  await fechar(banco, icones);
  return { tarefa: t, novas };
}

/* A criação sem nada por fazer vira jogo: entram as questões sem aviso,
   como em "Pronto, jogar". Jogo já salvo (tentou de novo depois) não é
   salvo outra vez: o que chegou depois vai pela revisão. */
export async function fechar(banco: Banco, icones: string[]) {
  for (const { criacao: c, tarefas } of await banco.concluir()) {
    try {
      if (c.jogo) { await banco.pronta(c.id, c.jogo); continue; }
      // Plano que não veio e não chegou a ser dado por perdido.
      if (!c.plano) { await banco.desistir(c.id, "O plano do jogo não veio."); continue; }
      const plano = c.plano;
      const porAlvo = (tipo: Tipo, alvo: string) =>
        tarefas.find(x => x.tipo === tipo && x.alvo === alvo && x.estado === "feita")?.resultado;
      const questoes = plano.flatMap(m => porAlvo("missao", m.id)?.questoes || []);
      const { problemas } = remedir(questoes, c.pedido.material, plano, icones);
      const limpas = questoes.filter((_: unknown, k: number) => !problemas[k].length);
      if (!limpas.length) { await banco.pronta(c.id, null); continue; }
      const licao = Object.fromEntries(plano.map(m => [m.id, porAlvo("licao", m.id) || {}]));
      const cor = /^[a-z]{1,20}$/.test(c.pedido.cor || "") ? c.pedido.cor : undefined;
      const conteudo = conteudoDoJogo({ pedido: c.pedido, missoes: plano, questoes: limpas, licao, cor });
      await banco.pronta(c.id, await banco.salvarJogo(c, conteudo));
    } catch (e) {
      // A tela ainda tem tudo para salvar à mão; o erro fica dito na criação.
      console.error("fechar", c.id, e);
      await banco.pronta(c.id, null, "Não consegui salvar o jogo: " + (e instanceof Error ? e.message : String(e)));
    }
  }
}
