
/* ---------- conta e sincronização ---------- */
/* A conta é da família; os perfis são os alunos dentro dela. Assim a criança
   não precisa de senha e o pai sincroniza uma vez só.

   Enquanto CONTA.url estiver vazio, tudo funciona igual — só sem sincronizar.
   Os dois valores abaixo são os de um projeto Supabase; a chave `anon` é
   pública por desenho, e quem protege os dados é a política de acesso por
   linha (RLS), não o segredo da chave. As instruções estão em CONTA.md. */
const CONTA = {
  /* Project Settings > Data API > Project URL.
     Só a base: SEM o /rest/v1 que a documentação mostra. */
  url: "https://bjlbfstuossmxnaqblih.supabase.co",     /* https://xxxxxxxx.supabase.co */
  /* Project Settings > API Keys > "publishable key" (sb_publishable_...).
     Em projeto antigo pode ser a legada "anon public" (começa com eyJ). */
  chave: "sb_publishable_lOr07N705_pZp6UQZmQLQg_EGjIAwgY",
};
const CONTA_LIB = "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.117.0/+esm";

let _sb = null, _sessao = null;

/* O Supabase devolve a sessão no fragmento da URL (#access_token=...). Como
   este índice usa o fragmento para navegar entre abas, a primeira troca de
   aba apagaria o token antes de a biblioteca — que carrega sob demanda — ter
   chance de vê-lo. Então o fragmento é lido e limpo AGORA, no início do
   script, e a sessão é montada à mão depois. */
const _VOLTA = (function(){
  const h = location.hash || "";
  if(h.indexOf("access_token=") < 0 && h.indexOf("error=") < 0
     && h.indexOf("error_code=") < 0) return null;
  const p = new URLSearchParams(h.slice(1));
  try{ history.replaceState(null, "", location.pathname + location.search); }catch(e){}
  return {token: p.get("access_token"), refresh: p.get("refresh_token"),
          erro: p.get("error_description") || p.get("error_code") || p.get("error")};
})();

function contaLigada(){ return !!(CONTA.url && CONTA.chave); }

/* Os dois enganos que a interface do Supabase induz: colar a URL com
   /rest/v1 no fim, e colar a chave secreta no lugar da pública. */
function _conferirConfig(){
  const u = CONTA.url.trim(), k = CONTA.chave.trim();
  if(/\/rest\/v1/.test(u))
    return "A URL veio com /rest/v1 no fim. Deixe só https://xxxx.supabase.co";
  if(!/^https:\/\/[a-z0-9-]+\.supabase\.co\/?$/.test(u))
    return "A URL não parece a do projeto. Deve ser https://xxxx.supabase.co";
  if(k.indexOf("sb_secret_") === 0)
    return "Essa é a chave SECRETA. Use a publishable (sb_publishable_...) — a secreta nunca vai para o navegador.";
  if(k.indexOf("sb_publishable_") !== 0 && k.indexOf("eyJ") !== 0)
    return "A chave não parece a publishable nem a anon legada.";
  return null;
}

async function _cliente(){
  if(_sb) return _sb;
  const {createClient} = await import(CONTA_LIB);
  _sb = createClient(CONTA.url, CONTA.chave);
  return _sb;
}

/* Tudo o que vale a pena levar de um aparelho para outro. */
function _tudo(){
  const d = {perfis: lerPerfis(), progresso: {}, historico: {}};
  lerPerfis().forEach(p => {
    Object.entries(BASES).forEach(([j, b]) => {
      const v = ler(b + ":" + p.id);
      if(v) (d.progresso[p.id] = d.progresso[p.id] || {})[j] = v;
    });
    const h = ler(HIST_CHAVE + ":" + p.id);
    if(h) d.historico[p.id] = h;
  });
  return d;
}

/* O histórico é só acrescentado, nunca reescrito: fundir por carimbo de
   tempo evita que jogar no celular apague o que foi feito no tablet. */
function _fundir(local, remoto){
  const perfis = [...local.perfis];
  (remoto.perfis || []).forEach(r => { if(!perfis.some(p => p.id === r.id)) perfis.push(r); });
  const historico = {};
  new Set([...Object.keys(local.historico), ...Object.keys(remoto.historico || {})])
    .forEach(id => {
      const vistos = new Set();
      historico[id] = [...(local.historico[id] || []), ...((remoto.historico || {})[id] || [])]
        .filter(x => { const k = x.q + "|" + x.j + "|" + x.m; 
                       if(vistos.has(k)) return false; vistos.add(k); return true; })
        .sort((a, b) => a.q - b.q);
    });
  /* No progresso não dá para fundir contagem sem inventar: fica o maior
     número de acertos e de erros por item, que é o mais fiel aos dois lados. */
  const progresso = {};
  new Set([...Object.keys(local.progresso), ...Object.keys(remoto.progresso || {})])
    .forEach(id => {
      progresso[id] = {};
      const L = local.progresso[id] || {}, R = (remoto.progresso || {})[id] || {};
      new Set([...Object.keys(L), ...Object.keys(R)]).forEach(j => {
        const a = L[j] || {}, b = R[j] || {};
        const itens = {};
        new Set([...Object.keys(a.items || {}), ...Object.keys(b.items || {})]).forEach(k => {
          const x = (a.items || {})[k] || {e:0,h:0}, y = (b.items || {})[k] || {e:0,h:0};
          itens[k] = {e: Math.max(x.e, y.e), h: Math.max(x.h, y.h)};
        });
        progresso[id][j] = {...a, ...b, items: itens,
          missions: {...(a.missions||{}), ...(b.missions||{})},
          trails: {...(a.trails||{}), ...(b.trails||{})}};
      });
    });
  return {perfis, progresso, historico};
}

function _aplicar(d){
  gravar(PERFIS_CHAVE, d.perfis || []);
  Object.entries(d.progresso || {}).forEach(([id, jogos]) =>
    Object.entries(jogos).forEach(([j, v]) => gravar(BASES[j] + ":" + id, v)));
  Object.entries(d.historico || {}).forEach(([id, h]) => gravar(HIST_CHAVE + ":" + id, h));
}

/* As mensagens do Supabase vêm em inglês e não dizem o que fazer. */
function _emPortugues(msg){
  const m = String(msg || "");
  if(/link is invalid|otp_expired|expired/i.test(m))
    return "O link do e-mail expirou ou já foi usado. Entre abaixo com o mesmo e-mail e senha.";
  if(/access_denied/i.test(m))
    return "O link não foi aceito. Entre abaixo com o mesmo e-mail e senha.";
  if(/email not confirmed/i.test(m))
    return "A conta existe, mas falta confirmar o e-mail: abra o link que chegou nele (veja também o spam).";
  if(/invalid login/i.test(m))
    return "E-mail ou senha não conferem.";
  if(/already registered|user already/i.test(m))
    return "Já existe conta com esse e-mail. Confira a senha.";
  if(/password.*(6|8|short|least)/i.test(m))
    return "A senha é curta demais. Use pelo menos 8 caracteres.";
  if(/rate limit|too many/i.test(m))
    return "Muitas tentativas seguidas. Espere um minuto.";
  if(/fetch|network/i.test(m))
    return "Sem resposta do servidor. Verifique a internet.";
  /* O gatilho do convite (migração beta_fechado) derruba o cadastro, e o
     Supabase devolve só isto, sem dizer qual regra foi. Pelo Google não há
     onde pôr o código, então a conta nova pelo Google cai aqui também. */
  if(/database error saving new user|unexpected_failure|server_error/i.test(m))
    return "Conta nova só com código de convite válido. Use Criar conta, com o código que você recebeu. "
      + "Pelo Google dá para entrar depois, com o mesmo e-mail.";
  return m;
}

/* Muda quando o texto dos termos ou da política mudar de verdade; tem de
   bater com termos_versao() na migração beta_fechado, que recusa o cadastro
   com outra versão. */
const TERMOS_VERSAO = "2026-10-27";

/* Entrar e criar conta são duas portas: no beta, criar pede o convite e o
   aceite dos termos, e quem só errou a senha não deve ver nenhum dos dois. */
let _modoConta = "entrar";
function modoConta(m){ _modoConta = m; pintarConta(); }

async function entrarConta(ev){
  if(ev) ev.preventDefault();
  const email = document.getElementById("contaEmail").value.trim();
  const senha = document.getElementById("contaSenha").value;
  const criar = _modoConta === "criar";
  _recado(criar ? "Criando a conta..." : "Entrando...");
  let sb;
  try{ sb = await _cliente(); }
  catch(e){ return _recado("Não consegui carregar a biblioteca. Verifique a internet."); }

  let data, error;
  if(criar){
    const convite = document.getElementById("contaConvite").value.replace(/\s/g, "").toUpperCase();
    if(!document.getElementById("contaAceite").checked)
      return _recado("Para criar a conta, é preciso aceitar os termos e a política de privacidade.");
    ({data, error} = await sb.auth.signUp({email, password: senha,
      options: {data: {convite, aceite: TERMOS_VERSAO}, emailRedirectTo: location.href.split("#")[0]}}));
  }else{
    ({data, error} = await sb.auth.signInWithPassword({email, password: senha}));
  }
  if(error){
    if(!criar && /invalid login/i.test(error.message))
      return _recado("E-mail ou senha não conferem. Ainda não tem conta? Toque em Criar conta.");
    return _recado(_emPortugues(error.message));
  }

  /* Com confirmação de e-mail ligada, o cadastro não devolve sessão: a
     conta existe mas ainda não dá para entrar. Dizer isso é melhor do que
     redesenhar a tela como se nada tivesse acontecido. */
  if(!data || !data.session){
    if(criar) _modoConta = "entrar", desenhar();
    return _recado(criar
      ? "Conta criada. Confirme pelo link que chegou no e-mail e depois entre aqui."
      : "Não foi possível abrir a sessão. Tente de novo.");
  }
  _sessao = data.session;
  _modoConta = "entrar";
  await sincronizar();
  const recado = document.getElementById("contaRecado");
  const texto = recado ? recado.textContent : "";
  desenhar();
  _recado(texto || "Entrou.");
}
async function entrarGoogle(){
  const sb = await _cliente();
  await sb.auth.signInWithOAuth({provider: "google", options: {redirectTo: location.href}});
}
async function sairConta(){
  const sb = await _cliente(); await sb.auth.signOut(); _sessao = null; desenhar();
}

async function sincronizar(){
  if(!_sessao) return;
  const sb = await _cliente();
  const uid = _sessao.user.id;
  const {data} = await sb.from("familias").select("dados").eq("id", uid).maybeSingle();
  const juntos = _fundir(_tudo(), (data && data.dados) || {perfis: [], progresso: {}, historico: {}});
  _aplicar(juntos);
  await sb.from("familias").upsert({id: uid, dados: juntos, atualizado: new Date().toISOString()});
  _recado("Sincronizado agora.");
}

function _recado(t){ const e = document.getElementById("contaRecado"); if(e) e.textContent = t; }

function pintarConta(){
  const c = document.getElementById("conta");
  const erro = contaLigada() ? _conferirConfig() : null;
  if(erro){
    c.innerHTML = '<div class="cartao"><h2>Conta</h2><p><b>Configuração incorreta.</b> '
      + esc(erro) + "</p><p>Corrija em <b>build/_conta.js</b> e rode "
      + "<code>sh build/rebuild.sh</code>.</p></div>";
    return;
  }
  if(!contaLigada()){
    c.innerHTML = '<div class="cartao">'
      + "<h2>Entrar na conta</h2>"
      + "<p>Ainda não há conta ligada. Hoje o progresso de cada aluno fica "
      + "<b>neste aparelho</b> — funciona sem internet, mas não passa para o celular.</p>"
      + "<p>Para sincronizar entre aparelhos falta criar um projeto gratuito e "
      + "colar dois valores no código. O passo a passo está em "
      + "<b>CONTA.md</b>, no repositório.</p></div>";
    return;
  }
  c.innerHTML = _sessao
    ? '<div class="cartao"><h2>Conta</h2><p>Entrou como <b>' + esc(_sessao.user.email) + "</b></p>"
      + '<button class="primario" onclick="sincronizar()">Sincronizar agora</button>'
      + '<button class="fantasma" onclick="sairConta()">Sair</button>'
      + '<p id="contaRecado" class="recado"></p></div>'
    : _modoConta === "criar"
    ? '<form class="cartao" onsubmit="entrarConta(event)"><h2>Criar conta</h2>'
      + '<p>Estamos em teste fechado: a conta nova precisa do código de convite que você recebeu.</p>'
      + '<label class="campo"><span>Código de convite</span><input id="contaConvite" required autocomplete="off" '
      + 'autocapitalize="characters" spellcheck="false" pattern="[A-Za-z0-9\\- ]{6,40}" placeholder="ABCD-123456"></label>'
      + '<label class="campo"><span>E-mail</span><input id="contaEmail" type="email" required autocomplete="email"></label>'
      + '<label class="campo"><span>Senha (pelo menos 8 caracteres)</span><input id="contaSenha" type="password" required autocomplete="new-password" minlength="8"></label>'
      + '<label class="aceite"><input id="contaAceite" type="checkbox" required> <span>Sou maior de idade e li e aceito os '
      + '<a href="termos.html" target="_blank">termos de uso</a> e a <a href="privacidade.html" target="_blank">política de privacidade</a>.</span></label>'
      + '<button class="primario" type="submit">Criar conta</button>'
      + '<button class="fantasma" type="button" onclick="modoConta(\'entrar\')">Já tenho conta</button>'
      + '<p id="contaRecado" class="recado" role="status"></p></form>'
    : '<form class="cartao" onsubmit="entrarConta(event)"><h2>Entrar na conta</h2>'
      + '<p>Para o progresso ser o mesmo no celular, no tablet e no notebook.</p>'
      + '<label class="campo"><span>E-mail</span><input id="contaEmail" type="email" required autocomplete="email"></label>'
      + '<label class="campo"><span>Senha</span><input id="contaSenha" type="password" required autocomplete="current-password"></label>'
      + '<button class="primario" type="submit">Entrar</button>'
      + '<button class="fantasma" type="button" onclick="entrarGoogle()">Entrar com Google</button>'
      + '<p class="trocar-modo">Recebeu um convite? <button class="link" type="button" onclick="modoConta(\'criar\')">Criar conta</button></p>'
      + '<p id="contaRecado" class="recado" role="status"></p></form>';
}

/* Volta de uma confirmação de e-mail ou de um login do Google. */
async function _retomarSessao(){
  if(!contaLigada()) return;
  let sb;
  try{ sb = await _cliente(); }catch(e){ return; }
  if(_VOLTA && _VOLTA.erro){
    desenhar();
    _recado(_emPortugues(_VOLTA.erro));
    return;
  }
  if(_VOLTA && _VOLTA.token){
    const {data, error} = await sb.auth.setSession(
      {access_token: _VOLTA.token, refresh_token: _VOLTA.refresh || ""});
    if(!error && data) _sessao = data.session;
  }
  if(!_sessao){
    const r = await sb.auth.getSession();
    _sessao = r && r.data && r.data.session;
  }
  if(_sessao){
    await sincronizar();
    desenhar();
    _recado("Conta confirmada e sincronizada.");
  }else if(_VOLTA && _VOLTA.token){
    /* Veio com token e mesmo assim não abriu sessão: quase sempre link já
       usado ou expirado. Sem isto, a tela de login aparece muda. */
    desenhar();
    _recado("O link de confirmação já foi usado ou expirou. "
      + "Entre abaixo com o mesmo e-mail e senha.");
  }
}
_retomarSessao().catch(() => {});
