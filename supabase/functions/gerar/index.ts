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
                    missoes, alvo, tipos?}         — uma missão do plano
     {acao:"licao", criacao, material, materia, ano, missoes, alvo}
                                                   — os passos da lição
                                                     de uma missão
     {acao:"medir", material, missoes, questoes}   — reconfere o que a
                                                     revisão editou; não
                                                     chama modelo, não custa
     {acao:"criar", material, titulo, materia, cor, ano, total, automatico,
                    paginas?, tipos?}              — abre o jogo e o põe na
                                                     fila: o servidor conduz
                                                     daqui (_esteira/fila.ts)
     {acao:"tentar", fila, tipo, alvo}             — a tarefa que falhou
                                                     volta à fila
     {acao:"trabalhar", cadeias?}                  — interna, com o cabeçalho
                                                     x-trabalho: faz uma
                                                     tarefa da fila e chama
                                                     a próxima

   Montagem e deploy em GERAR.md. */

import { PARALELO } from "../_esteira/fila.ts";
import { admin, TRABALHO_SEGREDO } from "./config.ts";
import { abrir, criacaoDe, gerarParte, lerArquivos, licao, medir, planejarJogo } from "./acoes.ts";
import { acordar, cadeia, criar, tentar } from "./criacao.ts";
import { CORS, erro, responder } from "./http.ts";

/* Onde mora cada parte:
     config.ts   ambiente, cercas e prazos
     http.ts     resposta JSON com CORS
     modelo.ts   a chamada à API da Anthropic
     banco.ts    reserva, registro do custo e o `Banco` da fila
     criacao.ts  a criação na fila e as cadeias de trabalho
     acoes.ts    as ações que a tela chama
     pdf.ts      dividir o PDF em páginas */

declare const EdgeRuntime: { waitUntil(p: Promise<unknown>): void };

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

  const conta = quem.user.id;

  if (corpo.acao === "medir") return medir(corpo);
  if (corpo.acao === "ler") return await lerArquivos(conta, corpo);
  if (corpo.acao === "criar") return await criar(conta, corpo);
  if (corpo.acao === "tentar") return await tentar(conta, corpo);
  if (corpo.acao === "abrir") return await abrir(conta, corpo);
  const criacao = criacaoDe(corpo);
  if (criacao === null) return erro(400, "criacao", "Falta abrir o jogo antes de gerar.");
  if (corpo.acao === "planejar") return await planejarJogo(conta, corpo, criacao);
  if (corpo.acao === "licao") return await licao(conta, corpo, criacao);
  if (corpo.acao !== "gerar") return erro(400, "acao", "Ação desconhecida.");
  return await gerarParte(conta, corpo, criacao);
});
