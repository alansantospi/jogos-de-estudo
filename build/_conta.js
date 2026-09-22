
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
  url: "",     /* https://xxxxxxxx.supabase.co */
  /* Project Settings > API Keys > "publishable key" (sb_publishable_...).
     Em projeto antigo pode ser a legada "anon public" (começa com eyJ). */
  chave: "",
};
const CONTA_LIB = "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.117.0/+esm";

let _sb = null, _sessao = null;

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

async function entrarConta(ev){
  if(ev) ev.preventDefault();
  const email = document.getElementById("contaEmail").value.trim();
  const senha = document.getElementById("contaSenha").value;
  const sb = await _cliente();
  let {data, error} = await sb.auth.signInWithPassword({email, password: senha});
  if(error && /invalid login/i.test(error.message)){
    ({data, error} = await sb.auth.signUp({email, password: senha}));
    if(!error) _recado("Conta criada. Confirme o e-mail se for pedido e entre de novo.");
  }
  if(error) return _recado("Não entrou: " + error.message);
  _sessao = data.session; await sincronizar(); desenhar();
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
    : '<form class="cartao" onsubmit="entrarConta(event)"><h2>Entrar na conta</h2>'
      + '<p>Para o progresso ser o mesmo no celular, no tablet e no notebook.</p>'
      + '<label class="campo"><span>E-mail</span><input id="contaEmail" type="email" required autocomplete="email"></label>'
      + '<label class="campo"><span>Senha</span><input id="contaSenha" type="password" required autocomplete="current-password" minlength="8"></label>'
      + '<button class="primario" type="submit">Entrar ou criar conta</button>'
      + '<button class="fantasma" type="button" onclick="entrarGoogle()">Entrar com Google</button>'
      + '<p id="contaRecado" class="recado"></p></form>';
}

/* Se voltou de um login do Google, a sessão já existe. */
if(contaLigada()){
  _cliente().then(sb => sb.auth.getSession()).then(r => {
    _sessao = r && r.data && r.data.session;
    if(_sessao){ sincronizar().then(desenhar); }
  }).catch(() => {});
}
