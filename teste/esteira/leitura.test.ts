/* A leitura de foto e PDF, com um modelo de mentira. O que se cobra é o que
   o PLANO pede do pedaço 2: o aviso claro quando o material não deu para
   ler, e que nada inventado ou escrito à mão chegue ao material. */
import { test } from "node:test";
import assert from "node:assert/strict";
import { ErroEsteira, type Modelo, type Pedido } from "../../supabase/functions/_esteira/esteira.ts";
import { conferirArquivos, expandir, ler, LIMITES_LEITURA, organizar, paginasDoArquivo,
         type Arquivo } from "../../supabase/functions/_esteira/leitura.ts";

const USO = { modelo: "claude-opus-5-5", entrada: 4000, saida: 1500, cacheLeitura: 0, cacheEscrita: 0 };
const b64 = (s: string) => Buffer.from(s, "latin1").toString("base64");
const FOTO: Arquivo = { nome: "IMG_2598.jpg", tipo: "image/jpeg", dados: b64("\xff\xd8\xff foto") };
const PDF: Arquivo = { nome: "unidade.pdf", tipo: "application/pdf", dados: b64("%PDF-1.4 tres paginas") };
/* Divisor de mentira: "%PDF ... N paginas" vira N páginas. */
const dividir = async (dados: string) => {
  const t = Buffer.from(dados, "base64").toString("latin1");
  if (!t.startsWith("%PDF")) throw new Error("não é PDF");
  const n = { uma: 1, tres: 3, vinte: 20 }[t.split(" ")[1]] ?? 1;
  return Array.from({ length: n }, (_, k) => b64("%PDF pagina " + (k + 1)));
};

const TEXTO = "A célula é a menor unidade que forma os seres vivos. Bactérias não têm núcleo.";
const pagina = (o = {}) => ({ pagina: 1, legivel: "sim", motivo: "", texto: TEXTO, manuscrito: "", ...o });

/* Responde a cada pedido com o que `responder` disser para aquele arquivo. */
function roteiro(responder: (nome: string) => unknown | Error) {
  const pedidos: Pedido[] = [];
  const modelo: Modelo = async p => {
    pedidos.push(p);
    const nome = ((p.usuario as any[])[0].text as string).replace("Arquivo: ", "");
    const r = responder(nome);
    if (r instanceof Error) throw r;
    return { saida: r, uso: USO };
  };
  return { modelo, pedidos };
}

test("um pedido por página, cada um só com o seu arquivo", async () => {
  const arquivos = await expandir([FOTO, PDF], dividir) as Arquivo[];
  assert.equal(arquivos.length, 4, "uma foto e três páginas de PDF");
  const { modelo, pedidos } = roteiro(() => ({ paginas: [pagina()] }));
  const r = await ler(arquivos, modelo);
  assert.equal(pedidos.length, 4);
  assert.deepEqual((pedidos[0].usuario as any[]).map(b => b.type), ["text", "image", "text"]);
  assert.deepEqual((pedidos[1].usuario as any[]).map(b => b.type), ["text", "document", "text"]);
  assert.equal((pedidos[0].usuario as any[])[1].source.data, FOTO.dados);
  assert.equal(pedidos[0].esforco, "low");
  assert.deepEqual(r.paginas.map(p => [p.nome, p.pagina]),
    [["IMG_2598.jpg", 1], ["unidade.pdf", 1], ["unidade.pdf", 2], ["unidade.pdf", 3]],
    "a página do PDF leva o número de lá, não o 1 que o modelo vê");
  assert.equal(r.aviso, undefined);
  assert.equal(r.uso.length, 4, "todos os pedidos entram na conta");
});

test("PDF demais ou que não abre é recusado antes de custar", async () => {
  const vinte = { ...PDF, dados: b64("%PDF-1.4 vinte paginas") };
  assert.match(await expandir([vinte], dividir) as string, /mais de 12 páginas/);
  assert.match(await expandir([{ ...PDF, dados: b64("lixo") }], dividir) as string, /Não consegui abrir/);
});

test("página ilegível vem marcada, com motivo, e o aviso diz quantas", () => {
  const { paginas, aviso } = organizar([
    paginasDoArquivo({ paginas: [pagina()] }, 0, FOTO),
    paginasDoArquivo({ paginas: [pagina({ legivel: "nao", motivo: "Foto tremida.", texto: "" })] }, 1, FOTO),
  ], [FOTO, FOTO]);
  assert.equal(paginas[1].legivel, "nao");
  assert.equal(paginas[1].motivo, "Foto tremida.");
  assert.match(aviso!, /1 de 2 páginas não deram para ler/);
});

test("quase sem texto é ilegível, diga o modelo o que disser", () => {
  const [p] = paginasDoArquivo({ paginas: [pagina({ texto: "Unidade 4 [ilegível]" })] }, 0, FOTO);
  assert.equal(p.legivel, "nao");
  assert.ok(p.motivo, "ilegível sem motivo não diz o que fotografar de novo");
});

test("nada legível é aviso claro, não silêncio", () => {
  assert.match(organizar([paginasDoArquivo({ paginas: [pagina({ legivel: "nao", texto: "" })] }, 0, FOTO)],
                         [FOTO]).aviso!, /Nenhuma página deu para ler/);
  assert.match(organizar([[]], [FOTO]).aviso!, /Nenhuma página/);
});

test("arquivo sem página nenhuma aparece como ilegível, na ordem", () => {
  const { paginas } = organizar([[], paginasDoArquivo({ paginas: [pagina()] }, 1, FOTO)], [FOTO, FOTO]);
  assert.deepEqual(paginas.map(p => [p.arquivo, p.legivel]), [[0, "nao"], [1, "sim"]]);
  assert.match(paginas[0].motivo, /não devolveu nada/);
});

test("foto com duas páginas do livro aberto rende duas, em ordem", () => {
  const ps = paginasDoArquivo({ paginas: [pagina({ pagina: 2 }), pagina()] }, 0, FOTO);
  const { paginas } = organizar([ps], [FOTO]);
  assert.deepEqual(paginas.map(p => p.pagina), [1, 2]);
});

test("letra de mão fica fora do texto", () => {
  const [p] = paginasDoArquivo({ paginas: [pagina({ manuscrito: "  fungos fazem fotossíntese " })] }, 0, FOTO);
  assert.equal(p.manuscrito, "fungos fazem fotossíntese");
  assert.doesNotMatch(p.texto, /fotossíntese/);
});

test("uma página que falha não derruba as outras, e o que gastou conta", async () => {
  const outra = { ...FOTO, nome: "IMG_2599.jpg" };
  const recusa = new ErroEsteira("recusa", "O modelo se recusou.");
  recusa.uso = [USO];
  const { modelo } = roteiro(nome => nome === "IMG_2599.jpg" ? recusa : { paginas: [pagina()] });
  const r = await ler([FOTO, outra, { ...FOTO, nome: "IMG_2600.jpg" }], modelo);
  assert.deepEqual(r.paginas.map(p => p.legivel), ["sim", "nao", "sim"]);
  assert.match(r.paginas[1].motivo, /falhou: O modelo se recusou/);
  assert.equal(r.uso.length, 3);
  assert.match(r.aviso!, /1 de 3/);
});

test("se nada voltou é erro, e leva o gasto junto", async () => {
  await assert.rejects(ler([FOTO], roteiro(() => ({ outra: 1 })).modelo), (e: ErroEsteira) => {
    assert.equal(e.codigo, "formato");
    assert.equal(e.uso.length, 1);
    return true;
  });
  await assert.rejects(ler([FOTO, FOTO], roteiro(() => new Error("rede")).modelo), (e: ErroEsteira) =>
    e.codigo === "modelo" && e.uso.length === 0);
});

test("os limites seguram o custo antes de chamar o modelo", () => {
  assert.equal(conferirArquivos([FOTO, PDF]), null);
  assert.match(conferirArquivos([])!, /ao menos uma/);
  assert.match(conferirArquivos(Array(LIMITES_LEITURA.paginasMax + 1).fill(FOTO))!, /limite é 12/);
  assert.match(conferirArquivos([{ ...FOTO, tipo: "image/heic" }])!, /não é foto nem PDF/);
  assert.match(conferirArquivos([{ ...FOTO, dados: "não é base64!" }])!, /mal formado/);
  const grande = { ...FOTO, dados: "A".repeat(Math.ceil(LIMITES_LEITURA.bytesMax * 4 / 3) + 8) };
  assert.match(conferirArquivos([grande])!, /MB e o limite/);
});
