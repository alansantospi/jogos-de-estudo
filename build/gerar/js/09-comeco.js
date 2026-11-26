/* ---------- começo ---------- */

/* Quem entrou por último neste aparelho: sem sessão, a tela diz que ela
   expirou e já traz o e-mail, em vez de um login mudo. */
const ULTIMA_CONTA = "jogos_ultima_conta";
async function mostrarConta(sessao){
  $("entrar").hidden = !!sessao;
  $("app").hidden = !sessao;
  $("conta").hidden = !sessao;
  if(sessao){
    $("emailConta").textContent = sessao.user.email || "";
    try{ localStorage.setItem(ULTIMA_CONTA, sessao.user.email || ""); }catch(e){}
    return;
  }
  let ultima = "";
  try{ ultima = localStorage.getItem(ULTIMA_CONTA) || ""; }catch(e){}
  if(ultima){
    if(!$("email").value) $("email").value = ultima;
    recado("Sua sessão expirou. Entre de novo para continuar: o que estava em andamento ficou guardado.", true);
  }
}

/* A sessão muda fora desta página (expirou, saiu ou entrou em outra aba):
   a tela acompanha em vez de descobrir só na hora de gerar. */
const dentro = () => !$("app").hidden;
function vigiarSessao(sb){
  sb.auth.onAuthStateChange((evento, s) => { if(!!s !== dentro()) mostrarConta(s); });
  document.addEventListener("visibilitychange", async () => {
    if(document.hidden) return;
    try{ const {data} = await sb.auth.getSession(); if(!!data.session !== dentro()) mostrarConta(data.session); }catch(e){}
  });
}

async function entrar(ev){
  ev.preventDefault();
  const b = ev.submitter || ev.target.querySelector("button");
  b.classList.add("ocupado"); b.disabled = true;
  try{
    const sb = await cliente();
    const {data, error} = await sb.auth.signInWithPassword({email: $("email").value.trim(),
                                                          password: $("senha").value});
    if(error) return recado(/invalid login/i.test(error.message)
      ? "E-mail ou senha não conferem." : error.message, true);
    recado("");
    mostrarConta(data.session);
    irPara(etapa);
  }catch(e){ recado("Não consegui falar com a conta. Verifique a internet.", true); }
  finally{ b.classList.remove("ocupado"); b.disabled = false; }
}

async function entrarGoogle(){
  const b = $("botaoGoogle");
  b.classList.add("ocupado"); b.disabled = true;
  try{
    const sb = await cliente();
    // Sem o fragmento: o Supabase acrescenta o dele, e dois # não se leem.
    const {error} = await sb.auth.signInWithOAuth({provider: "google", options: {redirectTo: location.href.split("#")[0]}});
    if(error) throw error;
  }catch(e){
    recado(erroDoGoogle(e.message || String(e)), true);
    b.classList.remove("ocupado"); b.disabled = false;
  }
}

async function sair(){
  // Só deste aparelho: o padrão "global" derrubava os outros também.
  try{ await (await cliente()).auth.signOut({scope: "local"}); }catch(e){}
  try{ localStorage.removeItem(ULTIMA_CONTA); }catch(e){}
  mostrarConta(null);
}

function ligar(){
  $("pedido").addEventListener("submit", pedir);
  $("formEntrar").addEventListener("submit", entrar);
  $("botaoGoogle").addEventListener("click", entrarGoogle);
  $("sair").addEventListener("click", sair);
  ["material", "titulo", "materia", "ano"].forEach(k =>
    $(k).addEventListener("input", () => { contar(); guardarMaterial(); }));
  document.querySelectorAll("#pilulas input").forEach(r => r.addEventListener("change", () => {
    $("quantidade").value = r.value;
    contar(); guardarMaterial();
  }));
  document.querySelectorAll("#pilulasTipos input").forEach(c => c.addEventListener("change", () => {
    contar(); guardarMaterial();
  }));
  $("baixar").addEventListener("click", baixar);
  $("salvar").addEventListener("click", salvarJogo);
  $("recomecar").addEventListener("click", recomecar);
  $("botaoLer").addEventListener("click", lerArquivos);
  $("continuarTexto").addEventListener("click", continuarTexto);
  $("textoColado").addEventListener("input", pintarTexto);
  $("textoColado").addEventListener("keydown", ev => {
    if(ev.key === "Enter" && (ev.metaKey || ev.ctrlKey)){ ev.preventDefault(); continuarTexto(); } });
  // Colar na etapa do material: foto vira arquivo escolhido, texto vai para a aba de texto.
  document.addEventListener("paste", ev => {
    if(etapa !== 1 || $("app").hidden || /^(INPUT|TEXTAREA|SELECT)$/.test((ev.target || {}).tagName || "")) return;
    const arqs = [...(ev.clipboardData && ev.clipboardData.files || [])];
    const texto = ev.clipboardData && ev.clipboardData.getData("text/plain") || "";
    if(arqs.length){ ev.preventDefault(); aba("fotos"); adicionar(arqs); }
    else if(texto.trim()){
      ev.preventDefault(); aba("texto");
      $("textoColado").value = texto; pintarTexto(); $("textoColado").focus();
    }
  });
  corPedido = seletorCor("corPedido", escolherCor, () => escolherCor(""));
  $("escolhaCor").append(corPedido);
  $("outroJogo").addEventListener("click", novoJogo);
  $("voltar1").addEventListener("click", () => irPara(1));
  $("voltarPronto").addEventListener("click", () => irPara(5));
  $("conferirAntes").addEventListener("change", pintarEscolhidos);
  $("novoJogo").addEventListener("click", novoJogo);
  $("abaFotos").addEventListener("click", () => aba("fotos"));
  $("abaTexto").addEventListener("click", () => aba("texto"));
  $("arquivos").addEventListener("change", ev => adicionar(ev.target.files));
  $("fotografar").addEventListener("change", ev => adicionar(ev.target.files));
  document.querySelectorAll("#etapas button").forEach(b =>
    b.addEventListener("click", () => irPara(Number(b.dataset.etapa))));
  const solta = $("solta");
  ["dragenter", "dragover"].forEach(t => solta.addEventListener(t, ev => { ev.preventDefault(); solta.classList.add("sobre"); }));
  ["dragleave", "drop"].forEach(t => solta.addEventListener(t, () => solta.classList.remove("sobre")));
  solta.addEventListener("drop", ev => { ev.preventDefault(); adicionar(ev.dataTransfer.files); });
  // Soltar fora da área não pode abrir a foto no lugar da tela.
  window.addEventListener("dragover", ev => ev.preventDefault());
  window.addEventListener("drop", ev => ev.preventDefault());
  window.addEventListener("hashchange", () => { const n = daUrl(); if(n && n !== etapa) irPara(n); });
}

async function iniciar(){
  ligar();
  lerMaterial();
  leitura = lerLeitura();
  estado = lerRascunho();
  pintarPaginas();
  if(leitura && !$("material").value.trim()) aplicarPaginas();
  contar();
  pintarEscolhidos();
  pintarTexto();
  if(estado && !estado.fila)
    // O que o navegador conduzia quando a página fechou não volta mais.
    [...Object.values(estado.partes || {}), ...Object.values(estado.licao || {})].forEach(p => {
      if(p.estado === "aguardando" || p.estado === "escrevendo")
        Object.assign(p, {estado: "falhou", erro: "Interrompida: a página fechou antes de chegar."});
    });
  if(estado){ cota(estado.restantes); pintar(); }
  irPara(daUrl() || melhor(), false);
  try{
    const sb = await cliente();
    if(VOLTA && VOLTA.token)
      await sb.auth.setSession({access_token: VOLTA.token, refresh_token: VOLTA.refresh});
    const {data} = await sb.auth.getSession();
    mostrarConta(data.session);
    // A fila seguiu sem a tela: retoma de onde está.
    if(data.session && estado && estado.fila && !filaTerminou()) acompanhar();
    if(VOLTA && VOLTA.erro) recado(erroDoGoogle(VOLTA.erro), true);
    vigiarSessao(sb);
  }catch(e){
    mostrarConta(null);
    recado("Não consegui falar com a conta. Verifique a internet.", true);
  }
}
iniciar();
