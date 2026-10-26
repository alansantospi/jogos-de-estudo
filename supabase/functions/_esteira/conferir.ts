/* O que uma questão gerada tem de cumprir antes de chegar à revisão.

   É o recorte de `build/esquema.py` que vale para o tipo `escolha` — o único
   que a esteira gera por enquanto, porque é onde os medidores mordem — mais
   a citação, que o esquema não cobra e a esteira não dispensa. */

import { atalhos } from "./medir.ts";

export type Questao = {
  missao: string; icone: string; enunciado: string;
  certa: string; erradas: string[]; explicacao: string;
  trecho: string;
};

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

export function conferir(q: Questao, material: string, missoes: Set<string>,
                         icones: Set<string>): Problema[] {
  const p: Problema[] = [];
  const grave = (texto: string) => p.push({ grave: true, texto });

  if (vazio(q.enunciado)) grave("Falta o enunciado.");
  if (vazio(q.certa)) grave("Falta a resposta certa.");
  if (vazio(q.explicacao)) grave("Falta a explicação, que é o que aparece no retorno.");
  if (!missoes.has(q.missao)) grave(`A missão "${q.missao}" não existe neste jogo.`);
  if (!icones.has(q.icone)) grave(`Não há desenho chamado "${q.icone}".`);

  const erradas = Array.isArray(q.erradas) ? q.erradas : [];
  if (erradas.length !== 3) grave(`São ${erradas.length} alternativas erradas; o jogo usa três.`);
  if (erradas.some(vazio)) grave("Há alternativa errada vazia.");
  if (!vazio(q.certa) && erradas.some(e => !vazio(e) && igual(e, q.certa)))
    grave("A resposta certa aparece também entre as erradas.");
  if (new Set(erradas.map(e => normalizar(String(e)))).size !== erradas.length)
    grave("Há alternativas erradas repetidas.");

  /* A lição do Big Ben: a folha dizia relógio, o livro dizia sino. Sem o
     trecho exato não há como conferir, e questão errada ensina errado. */
  if (vazio(q.trecho)) grave("Falta o trecho do material que sustenta a questão.");
  else if (!citacaoNoMaterial(q.trecho, material))
    grave("O trecho citado não está no material, ou é curto demais para conferir.");

  if (!p.length) for (const texto of atalhos(q)) p.push({ grave: false, texto });
  return p;
}
