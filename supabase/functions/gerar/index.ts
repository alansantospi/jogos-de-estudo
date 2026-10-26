/* Função de servidor da esteira. Existe por um motivo só: a chave da API não
   pode ir para o navegador. Ela guarda a chave, cobra o limite antes de
   gastar e registra o custo depois.

   Duas ações, no corpo do POST:
     {acao:"gerar", material, titulo, materia, ano, quantidade}
     {acao:"medir", material, missoes, questoes}   — reconfere o que a
                                                     revisão editou; não
                                                     chama modelo, não custa

   Montagem e deploy em GERAR.md. */

import Anthropic from "npm:@anthropic-ai/sdk@0.133.0";
import { createClient } from "npm:@supabase/supabase-js@2.117.0";
import { conferirEntrada, custo, ErroEsteira, gerar, LIMITES, remedir,
         type Modelo, type Uso } from "../_esteira/esteira.ts";
import { ICONES } from "../_esteira/icones.ts";

const MODELO = "claude-opus-5-5";

/* As duas cercas, ajustáveis sem novo deploy: `supabase secrets set`. */
const LIMITE_POR_DIA = Number(Deno.env.get("LIMITE_POR_DIA") ?? 10);
const TETO_DIA_USD = Number(Deno.env.get("TETO_DIA_USD") ?? 5);
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

const modelo: Modelo = async ({ sistema, usuario, esquema }) => {
  let msg;
  try {
    msg = await anthropic.beta.messages.stream({
      model: MODELO,
      max_tokens: 32000,
      // Recusa de um classificador é refeita em outro modelo, no servidor.
      betas: ["server-side-fallback-2026-07-01"],
      fallbacks: "default",
      thinking: { type: "adaptive" },
      // Distrator plausível é o trabalho difícil daqui: esforço alto.
      output_config: { effort: "high", format: { type: "json_schema", schema: esquema } },
      system: sistema,
      messages: [{ role: "user", content: usuario }],
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

Deno.serve(async req => {
  if (req.method === "OPTIONS") return new Response(null, { headers: CORS });
  if (req.method !== "POST") return erro(405, "metodo", "Use POST.");

  const token = (req.headers.get("Authorization") || "").replace(/^Bearer\s+/i, "");
  const { data: quem } = token ? await admin.auth.getUser(token) : { data: { user: null } };
  if (!quem?.user) return erro(401, "sessao", "Entre na conta para gerar questões.");

  let corpo: Record<string, unknown>;
  try { corpo = await req.json(); } catch { return erro(400, "corpo", "Pedido mal formado."); }

  if (corpo.acao === "medir") {
    const { material, missoes, questoes } = corpo as any;
    if (typeof material !== "string" || material.length > LIMITES.materialMax
        || !Array.isArray(missoes) || !Array.isArray(questoes) || questoes.length > 40)
      return erro(400, "corpo", "Pedido de medida mal formado.");
    return responder(200, remedir(questoes, material, missoes, ICONES));
  }
  if (corpo.acao !== "gerar") return erro(400, "acao", "Ação desconhecida.");

  const entrada = { material: String(corpo.material ?? "").trim(), titulo: String(corpo.titulo ?? ""),
                    materia: String(corpo.materia ?? ""), ano: String(corpo.ano ?? ""),
                    quantidade: Number(corpo.quantidade) };
  const invalida = conferirEntrada(entrada);
  if (invalida) return erro(400, "entrada", invalida);

  const { data: reserva, error: barrada } = await admin.rpc("reservar_geracao", {
    p_conta: quem.user.id, p_caracteres: entrada.material.length, p_pedidas: entrada.quantidade,
    p_limite_dia: LIMITE_POR_DIA, p_teto_dia_usd: TETO_DIA_USD, p_estimativa_usd: ESTIMATIVA_USD });
  if (barrada) {
    if (/limite_conta/.test(barrada.message))
      return erro(429, "limite", `Você já fez as ${LIMITE_POR_DIA} gerações de hoje. ` +
                                 "A contagem é das últimas 24 horas.");
    if (/teto_global/.test(barrada.message))
      return erro(429, "teto", "A geração está pausada por hoje: o gasto de todas as contas " +
                               "chegou ao teto diário.");
    console.error("reservar_geracao", barrada.message);
    return erro(500, "reserva", "Não consegui reservar a geração. Tente de novo.");
  }
  const { id, restantes } = reserva[0];

  const inicio = Date.now();
  try {
    const r = await gerar(entrada, modelo, ICONES, 2, () => Date.now() - inicio < SO_REGERA_ATE_MS);
    const reprovadas = r.questoes.filter(q => q.problemas.length).length;
    await registrar(id, "feita", r.uso, { entregues: r.questoes.length, reprovadas, rodadas: r.rodadas });
    return responder(200, { missoes: r.missoes, questoes: r.questoes, lote: r.lote,
                            rodadas: r.rodadas, aviso: r.aviso, restantes,
                            custo_usd: Number(custo(r.uso).toFixed(4)) });
  } catch (e) {
    const usos = e instanceof ErroEsteira ? e.uso : [];
    await registrar(id, "falhou", usos, { erro: e instanceof Error ? e.message : String(e) });
    // Falha que não gastou nada não consome a vez (ver reservar_geracao).
    const extra = { restantes: custo(usos) > 0 ? restantes : restantes + 1 };
    if (e instanceof ErroEsteira)
      return erro(e.codigo === "configuracao" ? 500 : 502, e.codigo, e.message, extra);
    console.error("gerar", e);
    return erro(500, "interno", "Erro inesperado na geração.", extra);
  }
});
