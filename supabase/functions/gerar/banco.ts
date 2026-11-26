/* O que a função grava no banco: a reserva antes de gastar, o custo depois,
   e o `Banco` que a fila (_esteira/fila.ts) usa. */

import { custo, ErroEsteira, type Uso } from "../_esteira/esteira.ts";
import { LIMITES_LEITURA } from "../_esteira/leitura.ts";
import { PARALELO, TENTATIVAS, type Banco } from "../_esteira/fila.ts";
import { admin, ESTIMATIVA_USD, LIMITE_LEITURAS, LIMITE_POR_DIA, MAX_PARTES, PRAZO_S, TETO_DIA_USD }
  from "./config.ts";
import { erro } from "./http.ts";

export async function registrar(id: number, estado: string, usos: Uso[], extra: {
  entregues?: number; reprovadas?: number; rodadas?: number; erro?: string;
  motivos?: Record<string, number> } = {}) {
  const { error } = await admin.rpc("registrar_geracao", {
    p_id: id, p_estado: estado, p_modelo: usos.at(-1)?.modelo ?? null,
    p_entregues: extra.entregues ?? 0, p_reprovadas: extra.reprovadas ?? 0,
    p_rodadas: extra.rodadas ?? 0,
    p_tokens_entrada: usos.reduce((s, u) => s + u.entrada + u.cacheLeitura + u.cacheEscrita, 0),
    p_tokens_saida: usos.reduce((s, u) => s + u.saida, 0),
    p_custo_usd: custo(usos), p_erro: extra.erro ?? null,
    // O que de `tokens_entrada` veio do cache: é como se vê se ele pega.
    p_cache_leitura: usos.reduce((s, u) => s + u.cacheLeitura, 0),
    p_cache_escrita: usos.reduce((s, u) => s + u.cacheEscrita, 0),
    p_motivos: extra.motivos ?? null });
  // Não derruba a resposta: a pessoa já pagou pelas questões. Fica no log.
  if (error) console.error("registrar_geracao", id, error.message);
}

/* Reserva antes de gastar. Quando uma cerca barra, devolve o motivo: a
   chamada da tela o responde, a fila o grava na tarefa. */
type Barrada = { status: number; codigo: string; mensagem: string };
async function reservarNoBanco(conta: string, tipo: string, caracteres: number, pedidas: number,
                               criacao: number | null = null)
  : Promise<{ id: number; restantes: number } | Barrada> {
  const { data, error } = await admin.rpc("reservar_geracao", {
    p_conta: conta, p_tipo: tipo, p_criacao: criacao, p_caracteres: caracteres, p_pedidas: pedidas,
    p_limite_jogos: LIMITE_POR_DIA, p_limite_leituras: LIMITE_LEITURAS, p_max_partes: MAX_PARTES,
    p_paginas_leitura: LIMITES_LEITURA.paginasMax,
    p_teto_dia_usd: TETO_DIA_USD, p_estimativa_usd: ESTIMATIVA_USD });
  if (!error) return data[0] as { id: number; restantes: number };
  const b = (status: number, codigo: string, mensagem: string) => ({ status, codigo, mensagem });
  if (/limite_conta/.test(error.message))
    return b(429, "limite", `Você já criou os ${LIMITE_POR_DIA} jogos de hoje. ` +
                            "A contagem é das últimas 24 horas.");
  if (/limite_leitura/.test(error.message))
    return b(429, "limite", `Você já fez as ${LIMITE_LEITURAS} leituras de hoje. ` +
                            "A contagem é das últimas 24 horas.");
  if (/limite_paginas/.test(error.message))
    return b(429, "partes", `Esta leitura já passou de ${LIMITES_LEITURA.paginasMax} páginas. Mande só as páginas da matéria.`);
  if (/limite_partes/.test(error.message))
    return b(429, "partes", "Este jogo já fez todos os pedidos que cabem nele. Revise o que veio, ou comece outro jogo.");
  if (/criacao_invalida/.test(error.message))
    return b(400, "criacao", "Este jogo expirou ou não é desta conta. Comece de novo pela etapa de conferir.");
  if (/teto_global/.test(error.message))
    return b(429, "teto", "A geração está pausada por hoje: o gasto de todas as contas " +
                          "chegou ao teto diário.");
  console.error("reservar_geracao", error.message);
  return b(500, "reserva", "Não consegui reservar a geração. Tente de novo.");
}
export async function reservar(conta: string, tipo: string, caracteres: number, pedidas: number,
                        criacao: number | null = null) {
  const r = await reservarNoBanco(conta, tipo, caracteres, pedidas, criacao);
  return "codigo" in r ? erro(r.status, r.codigo, r.mensagem) : r;
}

/* Erro depois da reserva: registra o que foi gasto e devolve a vez se nada foi. */
export async function falhou(id: number, restantes: number, e: unknown) {
  const usos = e instanceof ErroEsteira ? e.uso : [];
  await registrar(id, "falhou", usos, { erro: e instanceof Error ? e.message : String(e) });
  // A conta dos jogos que restam já sai de reservar_geracao, que não conta
  // jogo morto sem gasto; aqui não há o que devolver.
  // O que a falha gastou vai junto, para a tela somar o custo do jogo.
  const extra = { restantes, custo_usd: Number(custo(usos).toFixed(4)) };
  if (e instanceof ErroEsteira)
    return erro(e.codigo === "configuracao" ? 500 : 502, e.codigo, e.message, extra);
  console.error("gerar", e);
  return erro(500, "interno", "Erro inesperado.", extra);
}

export const banco: Banco = {
  async pegar() {
    const { data, error } = await admin.rpc("pegar_tarefa",
      { p_prazo_s: PRAZO_S, p_paralelo: PARALELO, p_tentativas: TENTATIVAS });
    if (error) throw new Error("pegar_tarefa: " + error.message);
    const t = (data as any[])[0];
    if (!t) return null;
    const { data: c, error: e2 } = await admin.from("criacoes")
      .select("id,conta,geracao,pedido,plano,jogo").eq("id", t.criacao).single();
    if (e2) throw new Error("criacoes: " + e2.message);
    return { tarefa: { id: t.id, criacao: t.criacao, tipo: t.tipo, alvo: t.alvo, tentativas: t.tentativas },
             criacao: c as any };
  },
  async planejada(c, pedido, plano, novas) {
    const { error } = await admin.rpc("planejar_criacao",
      { p_criacao: c.id, p_pedido: pedido, p_plano: plano, p_tarefas: novas });
    if (error) throw new Error("planejar_criacao: " + error.message);
  },
  async terminar(t, fim) {
    const { error } = await admin.rpc("terminar_tarefa", {
      p_id: t.id, p_estado: fim.estado, p_resultado: fim.resultado ?? null, p_erro: fim.erro ?? null,
      p_custo: Number(fim.custo.toFixed(4)) });
    if (error) console.error("terminar_tarefa", t.id, error.message);
  },
  async desistir(id, mensagem) {
    const { error } = await admin.from("criacoes").update({ estado: "falhou", erro: mensagem }).eq("id", id);
    if (error) console.error("desistir", id, error.message);
  },
  async concluir() {
    const { data, error } = await admin.rpc("concluir_criacoes");
    if (error) { console.error("concluir_criacoes", error.message); return []; }
    const prontas = [];
    for (const c of data as any[]) {
      const { data: ts, error: e2 } = await admin.from("tarefas")
        .select("tipo,alvo,estado,resultado").eq("criacao", c.id);
      if (e2) { console.error("tarefas", c.id, e2.message); continue; }
      prontas.push({ criacao: c, tarefas: ts as any[] });
    }
    return prontas;
  },
  async salvarJogo(c, conteudo) {
    // Com a chave de serviço não há auth.uid(): a conta vai explícita.
    const { data, error } = await admin.from("jogos").insert({
      conta: c.conta, titulo: String(conteudo.titulo), materia: String(conteudo.materia),
      ano: c.pedido.ano || "", material: c.pedido.material, conteudo }).select("id").single();
    if (error) throw new Error(error.message);
    return data.id as string;
  },
  async pronta(id, jogo, mensagem) {
    const { error } = await admin.from("criacoes")
      .update({ estado: "pronta", jogo, erro: mensagem ?? null }).eq("id", id);
    if (error) console.error("pronta", id, error.message);
  },
  async reservar(conta, tipo, caracteres, pedidas, criacao) {
    const r = await reservarNoBanco(conta, tipo, caracteres, pedidas, criacao);
    if ("codigo" in r) throw new ErroEsteira(r.codigo, r.mensagem);
    return r;
  },
  registrar,
};
