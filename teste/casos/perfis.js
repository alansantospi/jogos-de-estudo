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

/* 5. tocar no avatar troca o aluno e leva aos jogos */
ir("perfis");
const outro = lerPerfis().find(p => p.id !== perfilAtual().id);
const avatar = document.querySelector('#listaPerfis .avatar[onclick*="' + (outro || {}).id + '"]');
if (!avatar) falhas.push("sem avatar do outro aluno: " + document.getElementById("listaPerfis").innerHTML.slice(0, 200)
                          + " / perfis: " + JSON.stringify(lerPerfis()));
else avatar.click();
if (perfilAtual().id !== outro.id) falhas.push("tocar no avatar não trocou o aluno");
if (location.hash !== "#jogos" || document.getElementById("v-jogos").hidden)
  falhas.push("trocar de aluno ficou parado na tela de perfis: " + location.hash);

// Os jogos criados na conta aparecem no índice, mesmo sem rede.
localStorage.setItem("jogos_criados_v1", JSON.stringify([{id: "abc-1", titulo: "Mundo <i>x</i>", materia: "Ciências",
                                                         criado: "2026-10-27T10:00:00Z", cor: "laranja"},
  {id: "abc-2", titulo: "Sem cor", materia: "História", criado: "2026-10-27T10:00:00Z", cor: "x;}body{display:none"}]));
contaSemSessao = false;
pintarMeusJogos();
const cartoes = [...document.querySelectorAll("#gradeMeus li")];
if (!cartoes.every(li => li.style.getPropertyValue("--cor-jogo") === CORES_JOGO.laranja.valor))
  falhas.push("o card do jogo criado não está na cor do jogo: " + cartoes.map(li => li.getAttribute("style")).join(" | "));
if (document.getElementById("meusJogos").hidden) falhas.push("os jogos criados não aparecem no índice");
if (!document.querySelector('#gradeMeus a[href="jogar.html?id=abc-1"]')) falhas.push("o cartão não leva ao jogo criado");
if (document.querySelector("#gradeMeus i")) falhas.push("título do jogo criado virou HTML");
// Conferido que não há sessão, os jogos guardados não aparecem como se estivesse dentro.
contaSemSessao = true;
pintarMeusJogos();
if (document.querySelector('#gradeMeus a[href^="jogar.html"]') || !/Entre na conta/.test(document.getElementById("gradeMeus").innerText))
  falhas.push("sem sessão, Meus jogos continua mostrando os jogos como se estivesse dentro");
contaSemSessao = false;
localStorage.removeItem("jogos_criados_v1");
// O jogo que o servidor ainda cria aparece como card "Criando…", mesmo sem outro jogo.
emCriacao = {id: 9, titulo: "Novo <b>x</b>", materia: "Geografia", cor: ""};
pintarMeusJogos();
{
  const primeiro = document.querySelector("#gradeMeus li");
  if (document.getElementById("meusJogos").hidden || !primeiro || !primeiro.classList.contains("criando"))
    falhas.push("o jogo em criação não aparece no índice");
  else {
    if (primeiro.querySelector("a").getAttribute("href") !== "gerar.html#criando") falhas.push("o card em criação não leva à tela de criar");
    if (!/Criando/.test(primeiro.innerText) || primeiro.querySelector("b")) falhas.push("o card em criação: " + primeiro.innerHTML);
  }
}
emCriacao = null;
pintarMeusJogos();
if (document.querySelector("#gradeMeus li.criando")) falhas.push("acabada a criação, o card continua");

// Do índice se chega à tela de criar jogo, pela mesma fila de abas.
if (!document.querySelector('.abas a[href="gerar.html"]')) falhas.push("o índice não leva a criar jogo");

fim({ ok: falhas.length === 0, detalhes: falhas,
      resumo: "isolamento, lixeira e restauração conferidos" });
