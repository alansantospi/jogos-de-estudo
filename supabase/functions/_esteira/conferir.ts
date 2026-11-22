/* O que uma questão gerada tem de cumprir antes de chegar à revisão.

   É o recorte de `build/esquema.py` para os tipos que a esteira gera, mais a
   citação, que o esquema não cobra e a esteira não dispensa. Os medidores de
   atalho só valem para `escolha`; o viés do `vf` (proporção de verdadeiras)
   se mede no lote, na tela de revisão. */

import { atalhos } from "./medir.ts";

/* Quem cria escolhe quais destes o jogo leva. `digitar` fica de fora até a
   correção aceitar variações sem frustrar a criança. */
export const TIPOS = ["escolha", "vf", "ligar", "ordenar"] as const;
export type Tipo = typeof TIPOS[number];

/* Um formato só para todos os tipos; o que não é do tipo fica vazio.
   `tipo` ausente é `escolha`: rascunhos e jogos de antes dos tipos. */
export type Questao = {
  tipo?: Tipo;
  missao: string; icone: string; enunciado: string;
  certa: string; erradas: string[];        // escolha
  verdadeira?: boolean;                    // vf: o enunciado é uma afirmação
  pares?: [string, string][];              // ligar
  sequencia?: string[];                    // ordenar, já na ordem certa
  explicacao: string; trecho: string;
};

/* O que o jogo usa de cada tipo. Abaixo do mínimo não há jogo; acima do
   máximo não cabe na tela do celular. Medido nos jogos feitos à mão. */
export const PARES = { min: 3, max: 5 };
export const SEQUENCIA = { min: 3, max: 6 };

export const tipoDe = (q: { tipo?: unknown }): Tipo =>
  (TIPOS as readonly string[]).includes(q.tipo as string) ? q.tipo as Tipo : "escolha";

/* Deixa a questão só com os campos do seu tipo, nos formatos certos. O
   modelo devolve todos os campos (o esquema é um só); a revisão edita. */
export function limpar<T extends Questao>(q: T): T {
  const tipo = tipoDe(q);
  const txt = (v: unknown) => typeof v === "string" ? v : "";
  const base = { ...q, tipo, certa: txt(q.certa), erradas: Array.isArray(q.erradas) ? q.erradas.map(txt) : [] };
  delete base.verdadeira; delete base.pares; delete base.sequencia;
  if (tipo === "vf") return { ...base, certa: "", erradas: [], verdadeira: q.verdadeira === true };
  if (tipo === "ligar") return { ...base, certa: "", erradas: [], pares: (Array.isArray(q.pares) ? q.pares : [])
    .map((p: any) => Array.isArray(p) ? [txt(p[0]), txt(p[1])] : [txt(p?.termo), txt(p?.par)]) as [string, string][] };
  if (tipo === "ordenar") return { ...base, certa: "", erradas: [],
    sequencia: (Array.isArray(q.sequencia) ? q.sequencia : []).map(txt) };
  return base;
}

/* Um problema grave impede aprovar: a questão quebraria o build ou não dá
   para conferir. Os outros são atalhos — a pessoa decide, mas fica sabendo. */
export type Problema = { grave: boolean; texto: string };

const vazio = (s: unknown) => typeof s !== "string" || !s.trim();
const igual = (a: string, b: string) =>
  a.trim().toLowerCase().replace(/\s+/g, " ") === b.trim().toLowerCase().replace(/\s+/g, " ");

/* Aspas curvas, travessões e espaços variam entre o PDF, o colar e o que o
   modelo devolve. Nada disso muda o que o trecho diz. */
export function normalizar(t: string): string {
  return t.normalize("NFC").toLowerCase()
    .replace(/[“”«»„"]/g, '"').replace(/[‘’`´']/g, "'")
    .replace(/[‐‑‒–—―]/g, "-").replace(/…/g, "...")
    .replace(/\s+/g, " ").trim();
}

/* Trecho curto demais casa em qualquer lugar e não prova nada. */
export const TRECHO_MINIMO = 20;

export function citacaoNoMaterial(trecho: string, material: string): boolean {
  const t = normalizar(trecho).replace(/^[\s.,;:!?"'-]+|[\s.,;:!?"'-]+$/g, "");
  return t.length >= TRECHO_MINIMO && normalizar(material).includes(t);
}

/* `tipos`: os que quem criou escolheu. Sem ele, vale qualquer um. */
export function conferir(bruta: Questao, material: string, missoes: Set<string>,
                         icones: Set<string>, tipos?: readonly string[]): Problema[] {
  const q = limpar(bruta), tipo = tipoDe(q);
  const p: Problema[] = [];
  const grave = (texto: string) => p.push({ grave: true, texto });
  const repetidos = (l: string[]) => new Set(l.map(x => normalizar(x))).size !== l.length;

  if (bruta.tipo != null && !(TIPOS as readonly string[]).includes(bruta.tipo as string))
    grave(`O jogo não tem questão do tipo "${bruta.tipo}".`);
  else if (tipos && !tipos.includes(tipo)) grave("Este tipo de questão não foi escolhido para o jogo.");
  if (vazio(q.enunciado)) grave(tipo === "vf" ? "Falta a afirmação." : "Falta o enunciado.");
  if (vazio(q.explicacao)) grave("Falta a explicação, que é o que aparece no retorno.");
  if (!missoes.has(q.missao)) grave(`A missão "${q.missao}" não existe neste jogo.`);
  if (!icones.has(q.icone)) grave(`Não há desenho chamado "${q.icone}".`);

  if (tipo === "escolha") {
    if (vazio(q.certa)) grave("Falta a resposta certa.");
    const erradas = q.erradas;
    if (erradas.length !== 3) grave(`São ${erradas.length} alternativas erradas; o jogo usa três.`);
    if (erradas.some(vazio)) grave("Há alternativa errada vazia.");
    if (!vazio(q.certa) && erradas.some(e => !vazio(e) && igual(e, q.certa)))
      grave("A resposta certa aparece também entre as erradas.");
    if (repetidos(erradas)) grave("Há alternativas erradas repetidas.");
  } else if (tipo === "ligar") {
    const pares = q.pares!;
    if (pares.length < PARES.min || pares.length > PARES.max)
      grave(`São ${pares.length} pares; o jogo usa de ${PARES.min} a ${PARES.max}.`);
    if (pares.some(([a, b]) => vazio(a) || vazio(b))) grave("Há par com um dos lados vazio.");
    // Lado repetido deixa duas ligações certas, e o jogo só aceita uma.
    if (repetidos(pares.map(x => x[0])) || repetidos(pares.map(x => x[1])))
      grave("Há dois pares com o mesmo termo de um lado: a ligação fica ambígua.");
  } else if (tipo === "ordenar") {
    const seq = q.sequencia!;
    if (seq.length < SEQUENCIA.min || seq.length > SEQUENCIA.max)
      grave(`São ${seq.length} itens para ordenar; o jogo usa de ${SEQUENCIA.min} a ${SEQUENCIA.max}.`);
    if (seq.some(vazio)) grave("Há item vazio na sequência.");
    if (repetidos(seq)) grave("Há itens repetidos na sequência.");
  }

  /* A lição do Big Ben: a folha dizia relógio, o livro dizia sino. Sem o
     trecho exato não há como conferir, e questão errada ensina errado. */
  if (vazio(q.trecho)) grave("Falta o trecho do material que sustenta a questão.");
  else if (!citacaoNoMaterial(q.trecho, material))
    grave("O trecho citado não está no material, ou é curto demais para conferir.");

  if (!p.length && tipo === "escolha") for (const texto of atalhos(q)) p.push({ grave: false, texto });
  return p;
}
