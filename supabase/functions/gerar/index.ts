/* Função de servidor da esteira. Existe por um motivo só: a chave da API não
   pode ir para o navegador. Ela guarda a chave, cobra o limite antes de
   gastar e registra o custo depois.

   Ações, no corpo do POST:
     {acao:"ler", arquivos:[{nome, tipo, dados}], inicio?, leitura?}
                                                   — foto ou PDF em base64
                                                     vira texto por página,
                                                     para a pessoa conferir;
                                                     até 10 páginas a partir
                                                     de `inicio`, e `leitura`
                                                     prende a continuação à
                                                     primeira chamada
     {acao:"abrir", total}                          — abre um jogo: é o que
                                                     conta no limite do dia
     {acao:"planejar", criacao, material, materia, ano, total}
                                                   — divide em missões
     {acao:"gerar", criacao, material, titulo, materia, ano, quantidade,
                    missoes, alvo}                 — uma missão do plano
     {acao:"licao", criacao, material, materia, ano, missoes, alvo}
                                                   — os passos da lição
                                                     de uma missão
     {acao:"medir", material, missoes, questoes}   — reconfere o que a
                                                     revisão editou; não
                                                     chama modelo, não custa
     {acao:"criar", material, titulo, materia, cor, ano, total, automatico,
                    paginas?}                      — abre o jogo e o põe na
                                                     fila: o servidor conduz
                                                     daqui (_esteira/fila.ts)
     {acao:"tentar", fila, tipo, alvo}             — a tarefa que falhou
                                                     volta à fila
     {acao:"trabalhar", cadeias?}                  — interna, com o cabeçalho
                                                     x-trabalho: faz uma
                                                     tarefa da fila e chama
                                                     a próxima

   Montagem e deploy em GERAR.md. */

import Anthropic from "npm:@anthropic-ai/sdk@0.133.0";
import { createClient } from "npm:@supabase/supabase-js@2.117.0";
import { conferirEntrada, conferirPlano, custo, ErroEsteira, gerar, LIMITES, planejar, remedir,
         type Modelo, type Uso } from "../_esteira/esteira.ts";
import { ICONES } from "../_esteira/icones.ts";
import { conferirArquivos, expandir, ler, LIMITES_LEITURA, type Arquivo } from "../_esteira/leitura.ts";
import { escreverLicao } from "../_esteira/licao.ts";
import { PARALELO, TENTATIVAS, trabalhar, type Banco, type PedidoCriacao } from "../_esteira/fila.ts";
import { PDFDocument } from "npm:pdf-lib@1.17.1";

const MODELO = "claude-opus-5-5";

/* As cercas, ajustáveis sem novo deploy: `supabase secrets set`.
   LIMITE_POR_DIA conta jogos; um jogo é o plano mais, por missão, uma parte
   e uma lição, até MAX_PARTES pedidos (200 questões são ~17 missões: o
   plano, 34 pedidos e folga para tentar de novo). */
const LIMITE_POR_DIA = Number(Deno.env.get("LIMITE_POR_DIA") ?? 3);
const LIMITE_LEITURAS = Number(Deno.env.get("LIMITE_LEITURAS") ?? 10);
const MAX_PARTES = Number(Deno.env.get("MAX_PARTES") ?? 60);
const TETO_DIA_USD = Number(Deno.env.get("TETO_DIA_USD") ?? 15);
/* Quanto uma geração em curso pesa no teto antes de se saber o custo real.
   Material no limite, vinte questões e duas rodadas ficam abaixo disto. */
const ESTIMATIVA_USD = 0.6;

/* O plano grátis corta a função em 150 s. Regerar só começa se sobrar folga
   para a troca terminar; a chamada ao modelo desiste antes do corte, para o
   custo ainda ser registrado. */
const SO_REGERA_ATE_MS = 75_000;
const ESPERA_MAXIMA_MS = 140_000;

const anthropic = new Anthropic({ timeout: ESPERA_MAXIMA_MS, maxRetries: 1 });
const admin = createClient(Deno.env.get("SUPABASE_URL")!,
                           Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
                           { auth: { persistSession: false } });

/* A autorização vai no cabeçalho, não em cookie: liberar qualquer origem
   não abre nada que o token não abra. */
const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};
const responder = (status: number, corpo: unknown) =>
  new Response(JSON.stringify(corpo), {
    status, headers: { ...CORS, "Content-Type": "application/json; charset=utf-8" } });
const erro = (status: number, codigo: string, mensagem: string, extra = {}) =>
  responder(status, { erro: codigo, mensagem, ...extra });

const modelo: Modelo = async ({ sistema, usuario, esquema, esforco = "high" }) => {
  let msg;
  try {
    msg = await anthropic.beta.messages.stream({
      model: MODELO,
      max_tokens: 32000,
      // Recusa de um classificador é refeita em outro modelo, no servidor.
      betas: ["server-side-fallback-2026-07-01"],
      fallbacks: "default",
      thinking: { type: "adaptive" },
      // Distrator plausível é o trabalho difícil daqui: esforço alto, salvo
      // quando o pedido diz outro (a leitura).
      output_config: { effort: esforco, format: { type: "json_schema", schema: esquema } },
      system: sistema,
      messages: [{ role: "user", content: usuario as any }],
    }).finalMessage();
  } catch (e) {
    if (e instanceof Anthropic.AuthenticationError || e instanceof Anthropic.PermissionDeniedError)
      throw new ErroEsteira("configuracao", "A chave da API não foi aceita. Veja o passo 3 de GERAR.md.");
    if (e instanceof Anthropic.RateLimitError)
      throw new ErroEsteira("ocupado", "O serviço de geração está ocupado. Tente de novo em um minuto.");
    if (e instanceof Anthropic.APIConnectionError)
      throw new ErroEsteira("rede", "O serviço de geração demorou demais ou não respondeu.");
    if (e instanceof Anthropic.APIError)
      throw new ErroEsteira("modelo", `O serviço de geração recusou o pedido (${e.status}).`);
    throw e;
  }

  const uso: Uso = { modelo: msg.model, entrada: msg.usage.input_tokens,
                     saida: msg.usage.output_tokens,
                     cacheLeitura: msg.usage.cache_read_input_tokens ?? 0,
                     cacheEscrita: msg.usage.cache_creation_input_tokens ?? 0 };
  const falha = (codigo: string, texto: string) => {
    const x = new ErroEsteira(codigo, texto);
    x.uso = [uso];
    return x;
  };
  if (msg.stop_reason === "refusal")
    throw falha("recusa", "O modelo se recusou a gerar a partir deste material.");
  if (msg.stop_reason === "max_tokens")
    throw falha("longo", "A resposta não coube. Peça menos questões ou um material menor.");
  const texto = msg.content.flatMap(b => b.type === "text" ? [b.text] : []).join("");
  try {
    return { saida: JSON.parse(texto), uso };
  } catch {
    throw falha("formato", "O modelo devolveu algo fora do formato combinado.");
  }
};

async function registrar(id: number, estado: string, usos: Uso[], extra: {
  entregues?: number; reprovadas?: number; rodadas?: number; erro?: string } = {}) {
  const { error } = await admin.rpc("registrar_geracao", {
    p_id: id, p_estado: estado, p_modelo: usos.at(-1)?.modelo ?? null,
    p_entregues: extra.entregues ?? 0, p_reprovadas: extra.reprovadas ?? 0,
    p_rodadas: extra.rodadas ?? 0,
    p_tokens_entrada: usos.reduce((s, u) => s + u.entrada + u.cacheLeitura + u.cacheEscrita, 0),
    p_tokens_saida: usos.reduce((s, u) => s + u.saida, 0),
    p_custo_usd: custo(usos), p_erro: extra.erro ?? null });
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
async function reservar(conta: string, tipo: string, caracteres: number, pedidas: number,
                        criacao: number | null = null) {
  const r = await reservarNoBanco(conta, tipo, caracteres, pedidas, criacao);
  return "codigo" in r ? erro(r.status, r.codigo, r.mensagem) : r;
}

/* Erro depois da reserva: registra o que foi gasto e devolve a vez se nada foi. */
async function falhou(id: number, restantes: number, e: unknown) {
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

const deBase64 = (b64: string) => Uint8Array.from(atob(b64), c => c.charCodeAt(0));
function paraBase64(u: Uint8Array) {
  let s = "";
  for (let i = 0; i < u.length; i += 0x8000) s += String.fromCharCode(...u.subarray(i, i + 0x8000));
  return btoa(s);
}

/* Um PDF de uma página para cada página do original. */
async function dividirPdf(b64: string): Promise<string[]> {
  const doc = await PDFDocument.load(deBase64(b64));
  const partes: string[] = [];
  for (const k of doc.getPageIndices()) {
    const um = await PDFDocument.create();
    const [pg] = await um.copyPages(doc, [k]);
    um.addPage(pg);
    partes.push(paraBase64(await um.save()));
  }
  return partes;
}

/* ---------- a fila (conteudo/spec-criar-em-um-toque.md) ---------- */

/* Quem chama `trabalhar` prova que é a própria função ou o relógio do banco:
   o segredo mora nos secrets da função e no Vault (GERAR.md, "A fila"). */
const TRABALHO_SEGREDO = Deno.env.get("TRABALHO_SEGREDO") ?? "";
const ENDERECO = Deno.env.get("SUPABASE_URL") + "/functions/v1/gerar";
/* Até quando quem pegou a tarefa tem a vez: passa do corte de 150 s. */
const PRAZO_S = 180;

declare const EdgeRuntime: { waitUntil(p: Promise<unknown>): void };

const banco: Banco = {
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

/* Acorda `n` cadeias: cada chamada faz uma tarefa e chama a próxima. Só
   espera a resposta de "recebido", não o trabalho. */
async function acordar(n: number) {
  try {
    const r = await fetch(ENDERECO, {
      method: "POST", body: JSON.stringify({ acao: "trabalhar", cadeias: n }),
      headers: { "Content-Type": "application/json", "x-trabalho": TRABALHO_SEGREDO } });
    await r.body?.cancel();
  } catch (e) {
    // O relógio do banco acorda a fila em até um minuto.
    console.error("acordar", e);
  }
}

async function cadeia() {
  const inicio = Date.now();
  let r;
  try {
    r = await trabalhar(banco, modelo, ICONES, () => Date.now() - inicio < SO_REGERA_ATE_MS);
  } catch (e) {
    console.error("cadeia", e);
    return;
  }
  if (!r.tarefa) return;
  // O plano abre as outras cadeias: até PARALELO por criação.
  const mais = r.tarefa.tipo === "planejar" ? Math.max(0, Math.min(PARALELO, r.novas) - 1) : 0;
  await acordar(1 + mais);
}

const texto = (v: unknown, max: number) => String(v ?? "").trim().slice(0, max);

/* O pedido de `criar`, conferido como o de `planejar`; mal formado vira texto do erro. */
function pedidoDe(corpo: Record<string, unknown>): PedidoCriacao | string {
  const p: PedidoCriacao = {
    titulo: texto(corpo.titulo, 120), materia: texto(corpo.materia, 60), cor: texto(corpo.cor, 20),
    ano: texto(corpo.ano, 20), total: Number(corpo.total), automatico: corpo.automatico === true,
    material: String(corpo.material ?? "").trim() };
  const invalido = conferirPlano(p);
  if (invalido) return invalido;
  if (p.cor && !/^[a-z]+$/.test(p.cor)) return "A cor chegou mal formada.";
  if (corpo.paginas != null) {
    const ps = corpo.paginas as any[];
    if (!Array.isArray(ps) || ps.length > 60) return "As páginas lidas chegaram mal formadas.";
    p.paginas = ps.map(x => ({ nome: texto(x?.nome, 120), pagina: Number(x?.pagina) || 0,
                               texto: String(x?.texto ?? "").slice(0, 20000) }));
    if (p.paginas.reduce((s, x) => s + x.texto.length, 0) > LIMITES.materialMax * 1.5)
      return "As páginas lidas passam do tamanho do material.";
  }
  return p;
}

const EM_CURSO = ["planejando", "escrevendo", "montando"];

async function criar(conta: string, corpo: Record<string, unknown>) {
  // Sem o segredo, ninguém trabalharia a fila: melhor não abrir o jogo.
  if (!TRABALHO_SEGREDO)
    return erro(500, "configuracao", "A fila de criação não está configurada (TRABALHO_SEGREDO). Veja GERAR.md.");
  const pedido = pedidoDe(corpo);
  if (typeof pedido === "string") return erro(400, "entrada", pedido);
  const emCurso = async () => (await admin.from("criacoes").select("id,geracao")
    .eq("conta", conta).in("estado", EM_CURSO).maybeSingle()).data;
  // Uma por vez: com outra em curso, a tela passa a acompanhar aquela.
  const outra = await emCurso();
  if (outra) return erro(409, "em_curso", "Já há um jogo sendo criado nesta conta.",
                         { fila: outra.id, criacao: outra.geracao });
  const reserva = await reservar(conta, "jogo", 0, pedido.total);
  if (reserva instanceof Response) return reserva;
  const { data: c, error } = await admin.from("criacoes")
    .insert({ conta, geracao: reserva.id, pedido }).select("id").single();
  if (error) {
    // Duas criações ao mesmo tempo: o índice barra a segunda, e o jogo do
    // dia que ela reservou não chegou a gastar nada.
    await admin.from("geracoes").delete().eq("id", reserva.id);
    const ja = await emCurso();
    if (ja) return erro(409, "em_curso", "Já há um jogo sendo criado nesta conta.",
                        { fila: ja.id, criacao: ja.geracao });
    console.error("criar", error.message);
    return erro(500, "fila", "Não consegui pôr o jogo na fila. Tente de novo.");
  }
  const { error: e2 } = await admin.from("tarefas").insert({ criacao: c.id, tipo: "planejar" });
  if (e2) console.error("criar tarefa", e2.message);  // o relógio não acha tarefa; a criação fecha vazia
  EdgeRuntime.waitUntil(acordar(1));
  return responder(200, { fila: c.id, criacao: reserva.id, restantes: reserva.restantes });
}

async function tentar(conta: string, corpo: Record<string, unknown>) {
  const fila = Number(corpo.fila), tipo = String(corpo.tipo ?? ""), alvo = String(corpo.alvo ?? "");
  if (!Number.isInteger(fila) || !["missao", "licao"].includes(tipo) || !alvo)
    return erro(400, "entrada", "Pedido de tentar de novo mal formado.");
  const { data, error } = await admin.rpc("tentar_tarefa",
    { p_conta: conta, p_criacao: fila, p_tipo: tipo, p_alvo: alvo, p_tentativas: TENTATIVAS });
  if (error) { console.error("tentar_tarefa", error.message); return erro(500, "fila", "Não consegui tentar de novo."); }
  if (!data) return erro(409, "tentar", "Esta parte não está mais para tentar de novo.");
  EdgeRuntime.waitUntil(acordar(1));
  return responder(200, { ok: true });
}

Deno.serve(async req => {
  if (req.method === "OPTIONS") return new Response(null, { headers: CORS });
  if (req.method !== "POST") return erro(405, "metodo", "Use POST.");

  // A fila se trabalha sem sessão de ninguém: o segredo é a prova.
  const segredo = req.headers.get("x-trabalho");
  if (segredo !== null) {
    if (!TRABALHO_SEGREDO || segredo !== TRABALHO_SEGREDO) return erro(401, "trabalho", "Segredo errado.");
    let n = 1;
    try { n = Math.max(1, Math.min(PARALELO, Math.floor(Number((await req.json()).cadeias) || 1))); } catch { /* 1 */ }
    // Responde já; o trabalho segue depois da resposta, até o corte.
    for (let k = 1; k < n; k++) EdgeRuntime.waitUntil(acordar(1));
    EdgeRuntime.waitUntil(cadeia());
    return responder(202, { ok: true });
  }

  const token = (req.headers.get("Authorization") || "").replace(/^Bearer\s+/i, "");
  const { data: quem } = token ? await admin.auth.getUser(token) : { data: { user: null } };
  if (!quem?.user) return erro(401, "sessao", "Entre na conta para gerar questões.");

  let corpo: Record<string, unknown>;
  try { corpo = await req.json(); } catch { return erro(400, "corpo", "Pedido mal formado."); }

  if (corpo.acao === "medir") {
    const { material, missoes, questoes } = corpo as any;
    // Um jogo reaberto para acrescentar questões soma o material e as questões
    // de mais de uma geração: o teto é o da coluna `jogos.material`.
    if (typeof material !== "string" || material.length > LIMITES.materialMax * 3
        || !Array.isArray(missoes) || !Array.isArray(questoes) || questoes.length > LIMITES.totalMax * 2 + 20)
      return erro(400, "corpo", "Pedido de medida mal formado.");
    return responder(200, remedir(questoes, material, missoes, ICONES));
  }
  if (corpo.acao === "ler") {
    const brutos = corpo.arquivos as Arquivo[];
    const invalido = conferirArquivos(brutos);
    if (invalido) return erro(400, "entrada", invalido);
    // Dividir antes de reservar: PDF que não abre ou grande demais não custa a vez.
    const arquivos = await expandir(brutos.map(a => ({ nome: String(a.nome || "arquivo").slice(0, 120),
                                                       tipo: a.tipo, dados: a.dados })), dividirPdf);
    if (typeof arquivos === "string") return erro(400, "entrada", arquivos);
    // Um PDF longo é lido em pedaços: cada chamada lê as suas páginas e diz quantas há.
    const inicio = Number(corpo.inicio ?? 0);
    if (!Number.isInteger(inicio) || inicio < 0 || inicio >= arquivos.length)
      return erro(400, "entrada", "O pedaço pedido da leitura não existe.");
    const estas = arquivos.slice(inicio, inicio + LIMITES_LEITURA.paginasPorPedido);
    // A continuação não gasta outra leitura do dia: prende-se à primeira.
    const leitura = corpo.leitura == null ? null : Number(corpo.leitura);
    if (leitura !== null && (!Number.isInteger(leitura) || leitura <= 0))
      return erro(400, "entrada", "A leitura de onde esta continua não existe.");
    const reserva = await reservar(quem.user.id, "ler", 0, estas.length, leitura);
    if (reserva instanceof Response) return reserva;
    try {
      const r = await ler(estas, modelo);
      await registrar(reserva.id, "feita", r.uso, { entregues: r.paginas.length,
        reprovadas: r.paginas.filter(p => p.legivel === "nao").length, rodadas: 1 });
      return responder(200, { paginas: r.paginas, aviso: r.aviso, restantes: reserva.restantes,
                              total: arquivos.length, leitura: leitura ?? reserva.id,
                              custo_usd: Number(custo(r.uso).toFixed(4)) });
    } catch (e) {
      return await falhou(reserva.id, reserva.restantes, e);
    }
  }
  if (corpo.acao === "criar") return await criar(quem.user.id, corpo);
  if (corpo.acao === "tentar") return await tentar(quem.user.id, corpo);
  if (corpo.acao === "abrir") {
    const total = Number(corpo.total);
    if (!Number.isInteger(total) || total < LIMITES.totalMin || total > LIMITES.totalMax)
      return erro(400, "entrada", `Peça entre ${LIMITES.totalMin} e ${LIMITES.totalMax} questões.`);
    const reserva = await reservar(quem.user.id, "jogo", 0, total);
    if (reserva instanceof Response) return reserva;
    return responder(200, { criacao: reserva.id, restantes: reserva.restantes });
  }
  const criacao = Number(corpo.criacao);
  if (!Number.isInteger(criacao) || criacao <= 0)
    return erro(400, "criacao", "Falta abrir o jogo antes de gerar.");

  if (corpo.acao === "planejar") {
    const pedido = { material: String(corpo.material ?? "").trim(), materia: String(corpo.materia ?? ""),
                     ano: String(corpo.ano ?? ""), total: Number(corpo.total), automatico: corpo.automatico === true };
    const invalido = conferirPlano(pedido);
    if (invalido) return erro(400, "entrada", invalido);
    const reserva = await reservar(quem.user.id, "plano", pedido.material.length, pedido.total, criacao);
    if (reserva instanceof Response) return reserva;
    try {
      const r = await planejar(pedido, modelo);
      await registrar(reserva.id, "feita", r.uso, { entregues: r.missoes.length, rodadas: 1 });
      return responder(200, { missoes: r.missoes, total: r.total, titulo: r.titulo, materia: r.materia,
                              restantes: reserva.restantes,
                              custo_usd: Number(custo(r.uso).toFixed(4)) });
    } catch (e) {
      return await falhou(reserva.id, reserva.restantes, e);
    }
  }
  const missoesDoCorpo = Array.isArray(corpo.missoes)
    ? (corpo.missoes as any[]).map(m => ({ id: String(m?.id ?? ""), nome: String(m?.nome ?? ""),
                                                        descricao: String(m?.descricao ?? "").slice(0, 400) }))
    : undefined;

  if (corpo.acao === "licao") {
    const e = { material: String(corpo.material ?? "").trim(), materia: String(corpo.materia ?? ""),
                ano: String(corpo.ano ?? ""), missoes: missoesDoCorpo ?? [], alvo: String(corpo.alvo ?? "") };
    if (e.material.length < LIMITES.materialMin || e.material.length > LIMITES.materialMax)
      return erro(400, "entrada", "O material da lição está fora do tamanho.");
    if (!e.materia.trim()) return erro(400, "entrada", "Diga de que matéria é.");
    if (e.missoes.length > 20 || !e.missoes.some(m => m.id === e.alvo))
      return erro(400, "entrada", "A missão pedida não está no plano.");
    const reserva = await reservar(quem.user.id, "licao", e.material.length, 1, criacao);
    if (reserva instanceof Response) return reserva;
    const inicio = Date.now();
    try {
      const r = await escreverLicao(e, modelo, () => Date.now() - inicio < SO_REGERA_ATE_MS);
      await registrar(reserva.id, "feita", r.uso, { entregues: r.passos.length, rodadas: r.rodadas,
        reprovadas: r.passos.filter(p => p.problemas.some(x => x.grave)).length });
      return responder(200, { passos: r.passos, aviso: r.aviso, restantes: reserva.restantes,
                              custo_usd: Number(custo(r.uso).toFixed(4)) });
    } catch (e) {
      return await falhou(reserva.id, reserva.restantes, e);
    }
  }
  if (corpo.acao !== "gerar") return erro(400, "acao", "Ação desconhecida.");

  const entrada = { material: String(corpo.material ?? "").trim(), titulo: String(corpo.titulo ?? ""),
                    materia: String(corpo.materia ?? ""), ano: String(corpo.ano ?? ""),
                    quantidade: Number(corpo.quantidade),
                    missoes: missoesDoCorpo,
                    alvo: corpo.alvo == null ? undefined : String(corpo.alvo) };
  const invalida = conferirEntrada(entrada);
  if (invalida) return erro(400, "entrada", invalida);

  const reserva = await reservar(quem.user.id, "gerar", entrada.material.length, entrada.quantidade, criacao);
  if (reserva instanceof Response) return reserva;
  const { id, restantes } = reserva;

  const inicio = Date.now();
  try {
    const r = await gerar(entrada, modelo, ICONES, 2, () => Date.now() - inicio < SO_REGERA_ATE_MS);
    const reprovadas = r.questoes.filter(q => q.problemas.length).length;
    await registrar(id, "feita", r.uso, { entregues: r.questoes.length, reprovadas, rodadas: r.rodadas });
    return responder(200, { missoes: r.missoes, questoes: r.questoes, lote: r.lote,
                            rodadas: r.rodadas, aviso: r.aviso, restantes,
                            custo_usd: Number(custo(r.uso).toFixed(4)) });
  } catch (e) {
    return await falhou(id, restantes, e);
  }
});
