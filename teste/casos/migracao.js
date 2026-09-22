/* A migração do progresso salvo. É a parte mais perigosa da unificação: uma
   migração mal feita já apagou o progresso da Anne uma vez nesta semana.
   Aqui se cobra que os números atravessem, em cada formato que existe de
   verdade num aparelho. */
const falhas = [];
const igual = (a, b) => JSON.stringify(a) === JSON.stringify(b);

await espere(() => typeof migrarItens === "function" && typeof migrarMelhor === "function");

/* 1. formato antigo deste motor: verbs / errors / hits */
const antigo = {verbs: {cook: {errors: 3, hits: 1}, eat: {errors: 0, hits: 4}},
                best: {score: 880, accuracy: 92}};
const itens = migrarItens(antigo);
if (!igual(itens.cook, {e: 3, h: 1})) falhas.push("cook virou " + JSON.stringify(itens.cook));
if (!igual(itens.eat, {e: 0, h: 4})) falhas.push("eat virou " + JSON.stringify(itens.eat));
const melhor = migrarMelhor(antigo.best);
if (melhor.score !== 880) falhas.push("o recorde de pontos mudou: " + melhor.score);
if (melhor.acc !== 92) falhas.push("a precisão não migrou: " + JSON.stringify(melhor));

/* 2. formato novo: passa intacto */
const novo = {items: {cook: {e: 2, h: 5}}, best: {score: 100, acc: 70}};
if (!igual(migrarItens(novo).cook, {e: 2, h: 5})) falhas.push("o formato novo foi alterado");
if (migrarMelhor(novo.best).acc !== 70) falhas.push("a precisão nova foi alterada");

/* 3. os dois ao mesmo tempo: fica o maior, nunca se perde acerto */
const misto = {items: {cook: {e: 1, h: 9}}, verbs: {cook: {errors: 5, hits: 2}}};
const m = migrarItens(misto).cook;
if (m.e !== 5 || m.h !== 9) falhas.push("misto deveria dar {e:5,h:9}, deu " + JSON.stringify(m));

/* 4. vazio e ausente não explodem */
if (migrarItens({}) === null || Object.keys(migrarItens({})).length)
  falhas.push("progresso vazio não deu objeto vazio");
if (migrarItens(null) !== null) falhas.push("progresso ausente deveria dar null");
if (migrarMelhor(undefined) !== null) falhas.push("recorde ausente deveria dar null");

/* 5. o caminho de verdade: gravar no formato antigo e carregar */
const chave = STORE_KEY;
localStorage.setItem(chave, JSON.stringify(
  {verbs: {cook: {errors: 3, hits: 1}}, best: {score: 880, accuracy: 92},
   missions: {vocabulary: {iniciada: true, concluidas: 2, melhorAcc: 90}},
   trails: {essential: true}, practice: true, mudo: false}));
const p = loadProgress();
if (!p.items || !igual(p.items.cook, {e: 3, h: 1}))
  falhas.push("carregar não converteu: " + JSON.stringify(p.items));
if (p.best.acc !== 92) falhas.push("carregar perdeu a precisão");
if (!p.missions.vocabulary || p.missions.vocabulary.concluidas !== 2)
  falhas.push("carregar perdeu as missões");
if (!p.trails.essential) falhas.push("carregar perdeu as trilhas");

fim({ ok: falhas.length === 0, detalhes: falhas,
      resumo: "cinco formatos de progresso conferidos" });
