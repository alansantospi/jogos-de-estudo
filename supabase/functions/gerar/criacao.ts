/* A criação conduzida pelo servidor (conteudo/spec-criar-em-um-toque.md):
   abrir o jogo, pô-lo na fila e manter as cadeias de trabalho acordadas. */

import { conferirPlano, conferirTipos, LIMITES } from "../_esteira/esteira.ts";
import { ICONES } from "../_esteira/icones.ts";
import { PARALELO, TENTATIVAS, trabalhar, type PedidoCriacao } from "../_esteira/fila.ts";
import { admin, ENDERECO, SO_REGERA_ATE_MS, TRABALHO_SEGREDO } from "./config.ts";
import { banco, reservar } from "./banco.ts";
import { erro, responder } from "./http.ts";
import { modelo } from "./modelo.ts";

declare const EdgeRuntime: { waitUntil(p: Promise<unknown>): void };

/* Acorda `n` cadeias: cada chamada faz uma tarefa e chama a próxima. Só
   espera a resposta de "recebido", não o trabalho. */
export async function acordar(n: number) {
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

export async function cadeia() {
  const inicio = Date.now();
  let r;
  try {
    r = await trabalhar(banco, modelo, ICONES, () => Date.now() - inicio < SO_REGERA_ATE_MS);
  } catch (e) {
    console.error("cadeia", e);
    return;
  }
  if (!r.tarefa) return;
  // O plano abre as outras cadeias: até PARALELO por criação. Mas só uma
  // tarefa de cada tipo roda até a primeira dele terminar (o cache, ver
  // `pegar_tarefa`): as cadeias que não acharam vez morreram, e quem termina
  // essa primeira acorda as que faltam.
  let mais = r.tarefa.tipo === "planejar" ? Math.max(0, Math.min(PARALELO, r.novas) - 1) : 0;
  if (r.tarefa.tipo !== "planejar") {
    const { count } = await admin.from("tarefas").select("id", { count: "exact", head: true })
      .eq("criacao", r.tarefa.criacao).eq("tipo", r.tarefa.tipo).in("estado", ["feita", "falhou"]);
    if (count === 1) mais = PARALELO - 1;
  }
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
  // Sem `tipos` (tela de antes deles), o jogo sai só de múltipla escolha, como era.
  if (corpo.tipos != null) {
    const invalidos = conferirTipos(corpo.tipos);
    if (invalidos) return invalidos;
    p.tipos = corpo.tipos as PedidoCriacao["tipos"];
  }
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

export async function criar(conta: string, corpo: Record<string, unknown>) {
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

export async function tentar(conta: string, corpo: Record<string, unknown>) {
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
