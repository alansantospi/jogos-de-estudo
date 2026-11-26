/* A única chamada à API da Anthropic: o pedido da esteira vira uma
   mensagem, e a resposta volta conferida, com o uso para a conta do custo. */

import Anthropic from "npm:@anthropic-ai/sdk@0.133.0";
import { ErroEsteira, type Modelo, type Uso } from "../_esteira/esteira.ts";
import { ESPERA_MAXIMA_MS, MODELO } from "./config.ts";

/* Sem repetição automática: o SDK repete também o pedido que esgotou o
   tempo, e essa segunda tentativa começa aos 140 s, é cortada junto com a
   função aos 150 s, paga a entrada e não chega a ser registrada. A
   repetição é à mão, em `modelo`, só para o erro rápido. */
const anthropic = new Anthropic({ timeout: ESPERA_MAXIMA_MS, maxRetries: 0 });
/* Erro que vale repetir na hora: ocupado, sobrecarga, falha do servidor ou
   conexão caída, desde que tenha chegado rápido. Tempo esgotado não: a
   fila tenta a tarefa de novo, com o relógio zerado. */
const REPETE_SE_FALHOU_EM_MS = 20_000;
const repetivel = (e: unknown) =>
  !(e instanceof Anthropic.APIConnectionTimeoutError) &&
  (e instanceof Anthropic.APIConnectionError ||
   (e instanceof Anthropic.APIError && [408, 409, 429].includes(e.status ?? 0)) ||
   (e instanceof Anthropic.APIError && (e.status ?? 0) >= 500));

export const modelo: Modelo = async ({ sistema, usuario, esquema, esforco = "high", material }) => {
  // O material vem primeiro e com marca de cache: sistema + esquema + material
  // são iguais em todos os pedidos de questões (e de lição) do jogo, e o
  // pedido seguinte lê isso do cache a uma fração do preço. Ver `Pedido`.
  const conteudo = material === undefined ? usuario : [
    { type: "text", text: `<material>\n${material}\n</material>`, cache_control: { type: "ephemeral" } },
    { type: "text", text: usuario as string },
  ];
  const pedir = () => anthropic.beta.messages.stream({
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
    messages: [{ role: "user", content: conteudo as any }],
  }).finalMessage();
  let msg;
  try {
    const inicio = Date.now();
    try {
      msg = await pedir();
    } catch (e) {
      if (!repetivel(e) || Date.now() - inicio > REPETE_SE_FALHOU_EM_MS) throw e;
      await new Promise(r => setTimeout(r, 1500 + Math.random() * 1500));
      msg = await pedir();
    }
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
