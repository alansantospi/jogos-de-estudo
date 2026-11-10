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

/* 5. convites: conta comum não vê o cartão; admin cria, copia e desliga */
let admin = false;
const rpcs = [];
const convites = [{codigo: "AAAA-111111", nota: "Família <b>Ana</b>", usos: 1, max_usos: 1, ativo: true,
                   criado: "2026-10-27T10:00:00Z", contas: ["ana@exemplo.com"]}];
window._cliente = async () => ({rpc: async (nome, args) => {
  rpcs.push([nome, args]);
  if (nome === "sou_admin") return {data: admin, error: null};
  if (!admin) return {data: null, error: {message: "so_admin"}};
  if (nome === "listar_convites") return {data: convites, error: null};
  if (nome === "criar_convite") {
    if (args.max_usos > 500) return {data: null, error: {message: "usos_invalidos"}};
    convites.unshift({codigo: "BBBB-222222", nota: args.nota, usos: 0, max_usos: args.max_usos, ativo: true, contas: []});
    return {data: "BBBB-222222", error: null};
  }
  if (nome === "mudar_convite") { convites.find(c => c.codigo === args.codigo).ativo = args.ativo; return {data: null, error: null}; }
}});
_sessao = {user: {id: "comum", email: "pai@exemplo.com"}};
pintarConta();
await espere(() => rpcs.some(r => r[0] === "sou_admin"));
await new Promise(r => setTimeout(r, 100));
if (document.getElementById("formConvite")) falhas.push("conta comum vê o cartão de convites");

admin = true; _sessao = {user: {id: "admin", email: "eu@exemplo.com"}};
pintarConta();
await espere(() => document.querySelector("#listaConvites li"));
if (document.querySelector("#listaConvites b")) falhas.push("a nota do convite virou HTML");
if (!/ana@exemplo\.com/.test($c("listaConvites").innerText)) falhas.push("não mostra quem usou o convite");
if (document.querySelector('#listaConvites [data-copiar="AAAA-111111"]')) falhas.push("convite esgotado ainda oferece copiar");
$c("conviteNota").value = "Turma 4B"; $c("conviteUsos").value = "30";
await criarConvite(new Event("submit"));
const criado = rpcs.find(r => r[0] === "criar_convite");
if (!criado || criado[1].nota !== "Turma 4B" || criado[1].max_usos !== 30) falhas.push("criar mandou: " + JSON.stringify(criado));
if (!/BBBB-222222/.test($c("conviteNovo").innerText)) falhas.push("o código novo não aparece");
if (!/#conta, toque em Criar conta e use o código BBBB-222222/.test(mensagemConvite("BBBB-222222"))) falhas.push("mensagem do convite: " + mensagemConvite("BBBB-222222"));
$c("conviteNota").value = "Escola"; $c("conviteUsos").value = "900";
await criarConvite(new Event("submit"));
if (!/1 a 500/.test($c("conviteRecado").textContent)) falhas.push("erro do banco sem tradução: " + $c("conviteRecado").textContent);
document.querySelector('#listaConvites [data-mudar="AAAA-111111"]').click();
await espere(() => rpcs.some(r => r[0] === "mudar_convite"));
await espere(() => /Religar/.test(document.querySelector('#listaConvites [data-mudar="AAAA-111111"]').textContent));

fim({ok: !falhas.length, resumo: falhas.length ? "" : "entrar, criar com convite e aceite, convite recusado, convites do admin", detalhes: falhas});
