/* Os dois medidores de `build/`, para rodar dentro da esteira.

   `build/medir_alternativas.py` e `build/medir_plausibilidade.py` medem um
   jogo inteiro e derrubam o build. Aqui a mesma conta mede um lote recém-
   gerado, e cada regra ganha também uma versão por questão — é ela que diz
   QUAL questão regerar, porque a média de um lote de dez não aponta culpado.

   Duas cópias da mesma conta só são seguras se ninguém deixar de conferir:
   `teste/esteira/paridade.ts` roda as duas sobre todo `conteudo/` e cai se
   um número divergir. Mudou uma regra lá, muda aqui. */

export type Escolha = { enunciado: string; certa: string; erradas: string[] };

/* O acaso puro acerta 25% com quatro opções. Fora de 15% a 35%, a regra é
   atalho — acima, a criança pontua sem saber; abaixo, é pista invertida. */
export const PISO = 15;
export const TETO = 35;

/* Abaixo disto a média do lote é ruído: dez questões honestas passam de 35%
   por acaso uma vez em cinco. O número sai, mas não reprova. */
export const AMOSTRA_MINIMA = 20;

const ABSOLUTOS = new Set(["apenas", "somente", "sempre", "nunca", "todos", "todas",
  "nenhum", "nenhuma", "so", "unico", "unica", "exatamente", "totalmente",
  "completamente", "qualquer", "jamais", "inteiramente"]);

const VAZIAS = new Set(["o", "a", "os", "as", "um", "uma", "de", "do", "da", "dos", "das",
  "em", "no", "na", "nos", "nas", "que", "e", "ou", "para", "por",
  "com", "se", "ao", "aos", "as", "e", "é", "qual", "quais", "como",
  "quando", "onde", "quem", "porque", "por que", "mais", "menos",
  "seu", "sua", "ser", "esta", "este", "isso", "the", "of"]);

export function chave(t: string): string {
  return t.toLowerCase().normalize("NFD").replace(/\p{M}/gu, "");
}

export function palavras(t: string): Set<string> {
  return new Set((chave(t).match(/[a-z0-9]+/g) || [])
    .filter(p => !VAZIAS.has(p) && p.length > 2));
}

export function temAbsoluto(t: string): boolean {
  for (const p of palavras(t)) if (ABSOLUTOS.has(p)) return true;
  return /\bs[óo]\b/.test(chave(t));
}

/* Comprimento como o Python conta: por caractere, não por unidade UTF-16. */
const tam = (s: string) => [...s].length;

/* Quanto acerta quem sempre escolhe pelo comprimento, desempatando no acaso. */
function estrategia(it: Escolha[], escolher: (t: number[]) => number): number {
  let p = 0;
  for (const { certa, erradas } of it) {
    const t = [tam(certa), ...erradas.map(tam)];
    const alvo = escolher(t);
    if (t[0] === alvo) p += 1 / t.filter(x => x === alvo).length;
  }
  return 100 * p / it.length;
}

type Regra = (enunciado: string, ops: string[]) => number[] | null;

export const semAbsolutos: Regra = (_q, ops) => {
  const r = ops.map((o, i) => [o, i] as const).filter(([o]) => !temAbsoluto(o)).map(([, i]) => i);
  return r.length > 0 && r.length < ops.length ? r : null;
};

export const maiorEco: Regra = (q, ops) => {
  const pq = palavras(q);
  const n = ops.map(o => [...palavras(o)].filter(p => pq.has(p)).length);
  const m = Math.max(...n);
  return m ? n.flatMap((x, i) => x === m ? [i] : []) : null;
};

/* Quanto acerta quem segue a regra, dividindo o acaso entre os empates. */
function pontua(it: Escolha[], regra: Regra): number {
  let p = 0;
  for (const { enunciado, certa, erradas } of it) {
    let cand = regra(enunciado, [certa, ...erradas]);
    if (!cand || !cand.length) cand = [...Array(1 + erradas.length).keys()];
    if (cand.includes(0)) p += 1 / cand.length;
  }
  return 100 * p / it.length;
}

export type Lote = {
  n: number;
  sempreAMaior: number; sempreAMenor: number;
  eliminarAbsolutos: number; seguirOEco: number;
  mediaCerta: number; mediaErrada: number;
  amostraPequena: boolean;
  fora: string[];               // as regras fora da faixa, quando a amostra basta
};

export function medirLote(it: Escolha[]): Lote | null {
  if (!it.length) return null;
  const erradas = it.flatMap(q => q.erradas);
  const r = {
    n: it.length,
    sempreAMaior: estrategia(it, t => Math.max(...t)),
    sempreAMenor: estrategia(it, t => Math.min(...t)),
    eliminarAbsolutos: pontua(it, semAbsolutos),
    seguirOEco: pontua(it, maiorEco),
    mediaCerta: it.reduce((s, q) => s + tam(q.certa), 0) / it.length,
    mediaErrada: erradas.reduce((s, x) => s + tam(x), 0) / erradas.length,
    amostraPequena: it.length < AMOSTRA_MINIMA,
    fora: [] as string[],
  };
  if (!r.amostraPequena) {
    for (const k of ["sempreAMaior", "sempreAMenor", "eliminarAbsolutos", "seguirOEco"] as const)
      if (r[k] < PISO || r[k] > TETO) r.fora.push(k);
  }
  return r;
}

/* As mesmas regras, olhando uma questão só. Cada uma responde: quem jogasse
   só por esta pista acertaria esta questão com bem mais chance que o acaso?

   No comprimento não basta a certa ser a maior — isso acontece em uma de
   cada quatro questões honestas, e é o que deixa a média em 25%. Reprova a
   diferença que salta aos olhos: o caso que fez História medir 70%, com a
   certa escrita como explicação e as erradas como descarte. */
export function atalhos(q: Escolha): string[] {
  const ops = [q.certa, ...q.erradas];
  const achados: string[] = [];

  const c = tam(q.certa), outras = q.erradas.map(tam);
  const maior = Math.max(...outras), menor = Math.min(...outras);
  if (c > maior && c >= 1.3 * maior && c - maior >= 8)
    achados.push("A certa é bem mais longa que as outras: quem escolhe a maior acerta sem saber.");
  if (c < menor && c <= 0.7 * menor && menor - c >= 8)
    achados.push("A certa é bem mais curta que as outras: quem escolhe a menor acerta sem saber.");

  /* Absoluto só reprova no descarte puro: a certa é a única sem ele. Onde
     "sempre" é o próprio equívoco testado numa errada, ele fica. */
  const abs = semAbsolutos(q.enunciado, ops);
  if (abs && abs.length === 1 && abs[0] === 0)
    achados.push("Só a certa não tem palavra absoluta (sempre, nunca, só...): dá para eliminar as outras sem saber.");

  /* Uma palavra em comum com o enunciado é o assunto da pergunta, não pista.
     Medido sobre as 540 questões revisadas à mão: com uma palavra, a regra
     marcava 33 delas; pedir duas de vantagem deixa só o eco que salta. */
  const pq = palavras(q.enunciado);
  const ecos = ops.map(o => [...palavras(o)].filter(p => pq.has(p)).length);
  if (ecos[0] - Math.max(...ecos.slice(1)) >= 2)
    achados.push("A certa repete as palavras do enunciado bem mais que as erradas: dá para acertar pelo eco.");

  return achados;
}
