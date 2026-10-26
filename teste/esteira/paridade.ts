/* As duas cópias dos medidores — Python no build, TypeScript na esteira —
   têm de dar o mesmo número sobre o mesmo conteúdo. Roda as duas sobre cada
   jogo de `conteudo/` e cai na primeira divergência.

   Sem isto, uma regra ajustada de um lado só faria a esteira aprovar o que
   o build reprova, e ninguém veria até o jogo montado medir viés. */
import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { medirLote, type Escolha } from "../../supabase/functions/_esteira/medir.ts";

const RAIZ = join(dirname(fileURLToPath(import.meta.url)), "..", "..");

const PY = `
import json, sys
sys.path.insert(0, "build")
import medir_alternativas as A, medir_plausibilidade as P
r = {}
for arq in sorted(A.ARQUIVOS):
    it = A.questoes(arq)
    if not it:
        continue
    r[A.ARQUIVOS[arq]] = dict(
        sempreAMaior=A.estrategia(it, max), sempreAMenor=A.estrategia(it, min),
        eliminarAbsolutos=P.pontua(it, P.sem_absolutos), seguirOEco=P.pontua(it, P.maior_eco))
print(json.dumps(r))
`;

const python = JSON.parse(execFileSync("python3", ["-c", PY], { cwd: RAIZ, encoding: "utf-8" }));
let falhas = 0;
for (const [conteudo, esperado] of Object.entries<Record<string, number>>(python)) {
  const jogo = JSON.parse(readFileSync(join(RAIZ, "conteudo", conteudo + ".json"), "utf-8"));
  const it: Escolha[] = jogo.questoes
    .filter((q: any) => q.tipo === "escolha" || q.tipo === "escutar")
    .map((q: any) => ({ enunciado: q.enunciado, certa: q.certa, erradas: q.erradas }));
  const veio = medirLote(it)!;
  const difs = Object.keys(esperado)
    .filter(k => Math.abs(esperado[k] - (veio as any)[k]) > 1e-9)
    .map(k => `${k}: Python ${esperado[k].toFixed(3)}, TypeScript ${(veio as any)[k].toFixed(3)}`);
  falhas += difs.length;
  console.log("  %s %s", (difs.length ? "FALHA" : "ok").padEnd(5), conteudo.padEnd(18),
    difs.length ? "" : `n=${it.length}, os quatro números batem`);
  for (const d of difs) console.log("        " + d);
}
console.log(falhas ? `\n${falhas} divergência(s) entre os medidores` : "\nos medidores dão o mesmo número nos dois lados");
process.exit(falhas ? 1 : 0);
