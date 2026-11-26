/* As ações que a tela chama, uma função por ação. Cada uma confere o
   pedido, reserva antes de gastar e registra o custo depois. `conta` é o
   id de quem está na sessão; `index.ts` já conferiu. */

import { conferirEntrada, conferirPlano, custo, gerar, LIMITES, planejar, remedir,
         type Entrada } from "../_esteira/esteira.ts";
import { ICONES } from "../_esteira/icones.ts";
import { conferirArquivos, expandir, ler, LIMITES_LEITURA, type Arquivo } from "../_esteira/leitura.ts";
import { escreverLicao } from "../_esteira/licao.ts";
import { SO_REGERA_ATE_MS } from "./config.ts";
import { falhou, registrar, reservar } from "./banco.ts";
import { erro, responder } from "./http.ts";
import { modelo } from "./modelo.ts";
import { dividirPdf } from "./pdf.ts";

type Corpo = Record<string, unknown>;

/* Reconfere o que a revisão editou; não chama modelo, não custa. */
export function medir(corpo: Corpo) {
  const { material, missoes, questoes } = corpo as any;
  // Um jogo reaberto para acrescentar questões soma o material e as questões
  // de mais de uma geração: o teto é o da coluna `jogos.material`.
  if (typeof material !== "string" || material.length > LIMITES.materialMax * 3
      || !Array.isArray(missoes) || !Array.isArray(questoes) || questoes.length > LIMITES.totalMax * 2 + 20)
    return erro(400, "corpo", "Pedido de medida mal formado.");
  return responder(200, remedir(questoes, material, missoes, ICONES));
}

export async function lerArquivos(conta: string, corpo: Corpo) {
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
  const reserva = await reservar(conta, "ler", 0, estas.length, leitura);
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

/* Abre um jogo: é o que conta no limite do dia. */
export async function abrir(conta: string, corpo: Corpo) {
  const total = Number(corpo.total);
  if (!Number.isInteger(total) || total < LIMITES.totalMin || total > LIMITES.totalMax)
    return erro(400, "entrada", `Peça entre ${LIMITES.totalMin} e ${LIMITES.totalMax} questões.`);
  const reserva = await reservar(conta, "jogo", 0, total);
  if (reserva instanceof Response) return reserva;
  return responder(200, { criacao: reserva.id, restantes: reserva.restantes });
}

/* As ações de dentro de um jogo já aberto: precisam do id da reserva dele. */
export function criacaoDe(corpo: Corpo): number | null {
  const criacao = Number(corpo.criacao);
  return Number.isInteger(criacao) && criacao > 0 ? criacao : null;
}

export async function planejarJogo(conta: string, corpo: Corpo, criacao: number) {
  const pedido = { material: String(corpo.material ?? "").trim(), materia: String(corpo.materia ?? ""),
                   ano: String(corpo.ano ?? ""), total: Number(corpo.total), automatico: corpo.automatico === true };
  const invalido = conferirPlano(pedido);
  if (invalido) return erro(400, "entrada", invalido);
  const reserva = await reservar(conta, "plano", pedido.material.length, pedido.total, criacao);
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

const missoesDe = (corpo: Corpo) => Array.isArray(corpo.missoes)
  ? (corpo.missoes as any[]).map(m => ({ id: String(m?.id ?? ""), nome: String(m?.nome ?? ""),
                                         descricao: String(m?.descricao ?? "").slice(0, 400) }))
  : undefined;

export async function licao(conta: string, corpo: Corpo, criacao: number) {
  const e = { material: String(corpo.material ?? "").trim(), materia: String(corpo.materia ?? ""),
              ano: String(corpo.ano ?? ""), missoes: missoesDe(corpo) ?? [], alvo: String(corpo.alvo ?? "") };
  if (e.material.length < LIMITES.materialMin || e.material.length > LIMITES.materialMax)
    return erro(400, "entrada", "O material da lição está fora do tamanho.");
  if (!e.materia.trim()) return erro(400, "entrada", "Diga de que matéria é.");
  if (e.missoes.length > 20 || !e.missoes.some(m => m.id === e.alvo))
    return erro(400, "entrada", "A missão pedida não está no plano.");
  const reserva = await reservar(conta, "licao", e.material.length, 1, criacao);
  if (reserva instanceof Response) return reserva;
  const inicio = Date.now();
  try {
    const r = await escreverLicao(e, modelo, () => Date.now() - inicio < SO_REGERA_ATE_MS);
    await registrar(reserva.id, "feita", r.uso, { entregues: r.passos.length, rodadas: r.rodadas,
      reprovadas: r.passos.filter(p => p.problemas.some(x => x.grave)).length, motivos: r.motivos });
    return responder(200, { passos: r.passos, aviso: r.aviso, restantes: reserva.restantes,
                            custo_usd: Number(custo(r.uso).toFixed(4)) });
  } catch (e) {
    return await falhou(reserva.id, reserva.restantes, e);
  }
}

export async function gerarParte(conta: string, corpo: Corpo, criacao: number) {
  const entrada = { material: String(corpo.material ?? "").trim(), titulo: String(corpo.titulo ?? ""),
                    materia: String(corpo.materia ?? ""), ano: String(corpo.ano ?? ""),
                    quantidade: Number(corpo.quantidade),
                    missoes: missoesDe(corpo),
                    alvo: corpo.alvo == null ? undefined : String(corpo.alvo),
                    tipos: corpo.tipos == null ? undefined : corpo.tipos as Entrada["tipos"] };
  const invalida = conferirEntrada(entrada);
  if (invalida) return erro(400, "entrada", invalida);

  const reserva = await reservar(conta, "gerar", entrada.material.length, entrada.quantidade, criacao);
  if (reserva instanceof Response) return reserva;
  const { id, restantes } = reserva;

  const inicio = Date.now();
  try {
    const r = await gerar(entrada, modelo, ICONES, 2, () => Date.now() - inicio < SO_REGERA_ATE_MS);
    const reprovadas = r.questoes.filter(q => q.problemas.length).length;
    await registrar(id, "feita", r.uso, { entregues: r.questoes.length, reprovadas, rodadas: r.rodadas,
                                          motivos: r.motivos });
    return responder(200, { missoes: r.missoes, questoes: r.questoes, lote: r.lote,
                            rodadas: r.rodadas, aviso: r.aviso, restantes,
                            custo_usd: Number(custo(r.uso).toFixed(4)) });
  } catch (e) {
    return await falhou(id, restantes, e);
  }
}
