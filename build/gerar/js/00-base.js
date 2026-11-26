/*%CONTA%*/
/*%CORES%*/
const CONTA_LIB = "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.117.0/+esm";
/* O que custou fica guardado neste aparelho até a pessoa baixar ou
   descartar, para um recarregar de página não jogar fora. O material e os
   campos também: digitar de novo um resumo é o tipo de perda que faz
   desistir. */
const RASCUNHO = "jogos_geracao_v1";
const LEITURA = "jogos_leitura_v1";
const MATERIAL = "jogos_material_v1";
const MATERIAL_MAX = 40000, MATERIAL_MIN = 300;
// O material de um jogo salvo soma o de cada vez que se acrescentou questões
// (coluna `jogos.material`), e um jogo tem no máximo 200 questões.
const MATERIAL_JOGO_MAX = 120000, QUESTOES_JOGO_MAX = 400;
/* Quanto material cada questão pede. Medido num jogo real (26/10/2026):
   4.676 caracteres sustentaram 28 questões. É uma régua, não uma promessa:
   o plano decide pelo conteúdo, não pela contagem. */
const POR_QUESTAO = 170, TOTAL_MAX = 200, TOTAL_MIN = 10;
const sustenta = n => Math.floor(n / POR_QUESTAO);
/* "auto" é o padrão, como nos jogos feitos à mão: o plano recebe o teto e
   decide pelo material. Número escolhido é pedido. */
const automatico = () => $("quantidade").value === "auto";
/* Os tipos que o gerador sabe escrever, na ordem das pílulas. */
const TIPOS = ["escolha", "vf", "ligar", "ordenar"];
const NOME_TIPO = {escolha: "Múltipla escolha", vf: "Verdadeiro ou falso", ligar: "Ligar", ordenar: "Ordenar"};
const tiposEscolhidos = () => [...document.querySelectorAll("#pilulasTipos input:checked")].map(c => c.value);
const tipoDe = q => TIPOS.includes(q.tipo) ? q.tipo : "escolha";
/* Todos marcados é o padrão e não se diz; faltando um ou dois, diz o que falta. */
function resumoTipos(tipos){
  const nome = t => NOME_TIPO[t].toLowerCase(), faltam = TIPOS.filter(t => !tipos.includes(t));
  if(!tipos.length) return "nenhum tipo";
  if(!faltam.length) return "";
  return faltam.length <= 2 ? "sem " + faltam.map(nome).join(" e ") : "só " + tipos.map(nome).join(" e ");
}
const esperadas = n => Math.min(TOTAL_MAX, Math.max(TOTAL_MIN, sustenta(n)));
/* Quantas missões se escrevem ao mesmo tempo. Mais que isso esbarra no
   limite de pedidos simultâneos da API sem terminar mais cedo. */
const PARALELO = 4;
/* O lado maior que o modelo lê sem reamostrar; acima disso só pesa na subida. */
const FOTO_LADO = 1568;
/* Uma chamada da função lê até LOTE páginas (o que cabe nos 150 s dela); a
   leitura inteira vai até 30, em várias chamadas. Quem segura o tamanho do
   jogo é o material, MATERIAL_MAX: o que passar dele se desmarca na conferência. */
const ARQUIVOS_MAX = 30, LOTE = 10, PDF_BYTES_MAX = 8e6;

let estado = null, leitura = null, _sb = null;

/* A volta do Google traz a sessão no fragmento (#access_token=...), e esta
   tela usa o fragmento para as etapas: a primeira etapa o apagaria antes de
   a biblioteca carregar. É lido e limpo aqui, antes de tudo, como no índice. */
function lerVolta(h){
  if(!/access_token=|error=|error_code=/.test(h || "")) return null;
  const p = new URLSearchParams(String(h).slice(1));
  return {token: p.get("access_token"), refresh: p.get("refresh_token") || "",
          erro: p.get("error_description") || p.get("error_code") || p.get("error")};
}
const VOLTA = lerVolta(location.hash);
if(VOLTA) try{ history.replaceState(null, "", location.pathname + location.search); }catch(e){}

/* Pelo Google não há onde pôr o convite: conta nova cai no gatilho do beta,
   e o Supabase devolve só um erro genérico de banco. */
function erroDoGoogle(m){
  if(/database error|unexpected_failure|server_error/i.test(m))
    return "Conta nova só com código de convite. Crie a sua na página inicial, em Conta, com o código que recebeu; "
      + "depois o Google entra com o mesmo e-mail.";
  if(/access_denied/i.test(m)) return "O Google não liberou a entrada. Tente de novo ou entre com e-mail e senha.";
  return "Não deu para entrar com o Google: " + m;
}
let escolhidos = [], etapa = 1, filtro = "todas", lendo = false, gerando = false, editandoAgora = null;
const $ = id => document.getElementById(id);

function guardarEm(k, v){ try{ v ? localStorage.setItem(k, JSON.stringify(v)) : localStorage.removeItem(k); }catch(e){} }
function lerDe(k){ try{ return JSON.parse(localStorage.getItem(k)); }catch(e){ return null; } }
const guardar = () => guardarEm(RASCUNHO, estado);
const lerRascunho = () => lerDe(RASCUNHO);
const guardarLeitura = () => guardarEm(LEITURA, leitura);
const lerLeitura = () => lerDe(LEITURA);

/* O que vem do modelo é texto, nunca HTML: tudo entra por textContent. */
function el(tag, props, ...filhos){
  const e = document.createElement(tag);
  Object.entries(props || {}).forEach(([k, v]) => {
    if(k === "class") e.className = v; else if(k.startsWith("on")) e.addEventListener(k.slice(2), v);
    else if(v !== false && v != null) e.setAttribute(k, v === true ? "" : v);
  });
  filhos.flat().forEach(f => f != null && e.append(f));
  return e;
}
function icone(nome){
  const s = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  s.setAttribute("aria-hidden", "true");
  const u = document.createElementNS("http://www.w3.org/2000/svg", "use");
  u.setAttribute("href", "#i-" + nome);
  s.append(u);
  return s;
}
const dinheiro = v => "US$ " + Number(v).toLocaleString("pt-BR", {minimumFractionDigits: 2, maximumFractionDigits: 2});
const plural = (n, um, varios) => n + " " + (n === 1 ? um : varios);

function recado(t, ruim){
  const r = $("recado");
  r.replaceChildren();
  r.className = ruim ? "ruim" : "";
  if(t) r.append(icone(ruim ? "alerta" : "relogio"), el("span", {}, t));
}

async function cliente(){
  if(_sb) return _sb;
  const {createClient} = await import(CONTA_LIB);
  return (_sb = createClient(CONTA.url, CONTA.chave));
}

/* Uma porta só para a função de servidor; o teste troca esta função. */
async function chamarFuncao(corpo){
  const sb = await cliente();
  const {data, error} = await sb.functions.invoke("gerar", {body: corpo});
  if(!error) return data;
  let r = null;
  try{ r = await error.context.json(); }catch(e){}
  const x = new Error(r && r.mensagem || "Sem resposta do servidor. Verifique a internet.");
  x.codigo = r && r.erro;
  x.custo = r && r.custo_usd || 0;
  x.dados = r || {};
  if(r && r.restantes != null) cota(r.restantes);
  throw x;
}

function cota(n){
  if(n == null) return;
  $("cota").hidden = false;
  $("cota").textContent = plural(n, "restante", "restantes") + " hoje";
}

/* Relógio de espera: diz quanto passou e quanto costuma levar. */
function relogio(texto, faixa){
  const t0 = Date.now();
  const passo = () => recado(texto + " " + Math.round((Date.now() - t0) / 1000) + " s" + (faixa ? ". " + faixa : ""));
  passo();
  const id = setInterval(passo, 1000);
  return () => clearInterval(id);
}

