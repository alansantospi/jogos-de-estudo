/* Perfis: isolamento, migração e lixeira.
   A migração é o ponto de maior risco — o progresso da Anne já se perdeu uma
   vez. Aqui se cobra que o que existia antes dos perfis sobreviva. */
const falhas = [];
const BASE = "sky_progress_v1";
localStorage.clear();

await espere(() => typeof criarPerfil === "function");

/* 1. dois alunos não se misturam */
const a = criarPerfil("Anne"), b = criarPerfil("Bia");
trocarPerfil(a.id);
localStorage.setItem(BASE + ":" + a.id, JSON.stringify(
  {items: {x: {e: 1, h: 4}}, best: {score: 880}, missions: {earth: {concluidas: 2, melhorAcc: 92}}, trails: {earth: true}}));
localStorage.setItem("jogos_historico_v1:" + a.id, JSON.stringify(
  [{q: Date.now(), j: "cien", m: "earth", a: 7, n: 8, p: 150}]));
desenhar();
if (localStorage.getItem(BASE + ":" + b.id) !== null)
  falhas.push("o progresso da Anne vazou para a Bia");
trocarPerfil(b.id);
if (!/Nenhuma partida|Nenhum progresso/.test(document.getElementById("resumo").innerText))
  falhas.push("a Bia enxerga o histórico da Anne");
trocarPerfil(a.id);
if (!/Ciências/.test(document.getElementById("resumo").innerText))
  falhas.push("a Anne perdeu o próprio resumo ao voltar");

/* 2. o histórico funciona só com progresso, sem nenhuma partida registrada —
      foi assim que a tela apareceu vazia depois de restaurar */
localStorage.removeItem("jogos_historico_v1:" + a.id);
desenhar();
const resumo = document.getElementById("resumo").innerText;
if (!/Ciências/.test(resumo))
  falhas.push("sem partidas, o resumo ignorou o progresso: " + resumo.slice(0, 60));

/* 3. apagar não destrói: vai para a lixeira, e exige o nome certo */
const promptReal = window.prompt, alertReal = window.alert;
window.alert = () => {};
window.prompt = () => "nome errado";
apagarPerfil(a.id);
if (lerPerfis().length !== 2) falhas.push("nome errado apagou mesmo assim");
window.prompt = () => "anne";
apagarPerfil(a.id);
const lixo = JSON.parse(localStorage.getItem("jogos_lixeira_v1") || "[]");
if (!lixo.length) falhas.push("apagar não guardou nada na lixeira");
if (localStorage.getItem(BASE + ":" + a.id) !== null)
  falhas.push("a chave viva não foi removida");

/* 4. trazer de volta devolve perfil e progresso */
restaurarDaLixeira(0);
if (!lerPerfis().some(p => p.nome === "Anne")) falhas.push("o perfil não voltou");
if (localStorage.getItem(BASE + ":" + a.id) === null) falhas.push("o progresso não voltou");
window.prompt = promptReal; window.alert = alertReal;

fim({ ok: falhas.length === 0, detalhes: falhas,
      resumo: "isolamento, lixeira e restauração conferidos" });
