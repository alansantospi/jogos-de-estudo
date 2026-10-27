/* O cadastro do beta fechado, com o Supabase trocado por um dublê: criar
   conta pede convite e aceite, e manda os dois para o gatilho do banco;
   entrar não pede nenhum dos dois, e senha errada não vira cadastro. */
const falhas = [];
localStorage.clear();
await espere(() => typeof pintarConta === "function");

const chamadas = [];
let respostaCadastro = {data: {user: {}, session: null}, error: null};
window._cliente = async () => ({auth: {
  signUp: async x => { chamadas.push(["signUp", x]); return respostaCadastro; },
  signInWithPassword: async x => { chamadas.push(["signIn", x]); return {data: null, error: {message: "Invalid login credentials"}}; },
}});
const recado = () => document.getElementById("contaRecado").textContent;
const preencher = (email, senha) => { $c("contaEmail").value = email; $c("contaSenha").value = senha; };
const $c = id => document.getElementById(id);

_sessao = null; _modoConta = "entrar"; pintarConta();

/* 1. entrar: sem convite, e a senha errada não tenta cadastrar */
if ($c("contaConvite") || $c("contaAceite")) falhas.push("a porta de entrar pede convite ou aceite");
preencher("pai@exemplo.com", "senhaerrada");
await entrarConta(null);
if (chamadas.some(c => c[0] === "signUp")) falhas.push("senha errada virou tentativa de cadastro");
if (!/Criar conta/.test(recado())) falhas.push("senha errada não aponta o caminho do cadastro: " + recado());

/* 2. criar: convite e aceite, com links para os termos */
modoConta("criar");
if (!$c("contaConvite") || !$c("contaAceite")?.required) falhas.push("criar conta sem campo de convite ou aceite obrigatório");
if (!document.querySelector('#conta a[href="termos.html"]') || !document.querySelector('#conta a[href="privacidade.html"]'))
  falhas.push("o aceite não leva aos termos e à política");
if ($c("contaSenha").autocomplete !== "new-password") falhas.push("a senha do cadastro não é new-password");

chamadas.length = 0;
preencher("mae@exemplo.com", "senhaboa123");
$c("contaConvite").value = " abcd-12 34 56 ";
await entrarConta(null);
if (chamadas.length) falhas.push("cadastrou sem o aceite marcado");
if (!/aceitar os termos/.test(recado())) falhas.push("sem aceite, não diz por quê: " + recado());

$c("contaAceite").checked = true;
await entrarConta(null);
const cad = chamadas.find(c => c[0] === "signUp");
if (!cad) falhas.push("com convite e aceite, não chamou o cadastro");
else {
  const d = cad[1].options && cad[1].options.data || {};
  if (d.convite !== "ABCD-123456") falhas.push("o convite não foi normalizado: " + JSON.stringify(d.convite));
  if (d.aceite !== TERMOS_VERSAO) falhas.push("o aceite não leva a versão dos termos: " + d.aceite);
}
if (!/Conta criada/.test(recado())) falhas.push("sem sessão, não manda confirmar o e-mail: " + recado());
if (_modoConta !== "entrar") falhas.push("depois de criar, a tela não volta para entrar");

/* 3. o gatilho recusou: a mensagem do Supabase não diz o motivo, a tela diz */
modoConta("criar");
preencher("tio@exemplo.com", "senhaboa123");
$c("contaConvite").value = "ERRADO-0000"; $c("contaAceite").checked = true;
respostaCadastro = {data: null, error: {message: "Database error saving new user"}};
await entrarConta(null);
if (!/código de convite/.test(recado())) falhas.push("convite recusado sem explicação: " + recado());

/* 4. os links para termos e privacidade no rodapé */
if (!document.querySelector('footer a[href="termos.html"]')) falhas.push("o rodapé não leva aos termos");

fim({ok: !falhas.length, resumo: falhas.length ? "" : "entrar, criar com convite e aceite, convite recusado", detalhes: falhas});
