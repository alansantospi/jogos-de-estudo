/* ---------- etapas ---------- */

/* A etapa mora na URL, como as telas dos jogos (DESIGN.md, Navegação): o
   voltar do celular recua uma etapa em vez de sair da página, e recarregar
   cai de volta onde estava. */
const NOMES = {1: "material", 2: "conferir", 3: "revisar", 4: "meus", 5: "criando"};
const daUrl = () => Number(Object.keys(NOMES).find(k => "#" + NOMES[k] === location.hash)) || 0;
const melhor = () => estado ? (estado.fila ? 5 : 3) : (leitura || $("material").value.trim()) ? 2 : 1;

const alcanca = n => n === 1 || n === 4 || (n === 2 && (!!leitura || !!$("material").value.trim() || !!estado))
                            || (n === 3 && (!!estado || gerando)) || (n === 5 && (gerando || !!(estado && estado.fila)));

function irPara(n, focar = true){
  if(!alcanca(n)) n = melhor();
  etapa = n;
  if(location.hash !== "#" + NOMES[n]){
    // Primeira etapa da visita substitui, para o voltar não cair num endereço vazio.
    if(!location.hash) history.replaceState(null, "", "#" + NOMES[n]);
    else location.hash = NOMES[n];
  }
  document.querySelectorAll("[data-e]").forEach(s => { s.hidden = Number(s.dataset.e) !== n; });
  document.querySelectorAll("#etapas button").forEach(b => {
    const k = Number(b.dataset.etapa);
    b.disabled = !alcanca(k);
    b.toggleAttribute("aria-current", k === n);
    if(k === n) b.setAttribute("aria-current", "step");
    const feita = k < n || (k === 1 && leitura) || (k === 2 && estado);
    b.classList.toggle("feita", !!feita && k !== n);
    b.querySelector(".num").replaceChildren(feita && k !== n ? icone("check") : String(k));
  });
  $("pe").hidden = n !== 3 || !estado;
  // Meus jogos é outra vista, não uma etapa: some o indicador, troca a aba.
  if(n === 5) pintarCriando();
  $("voltarPronto").hidden = !(estado && estado.fila);
  $("abaMeus").classList.toggle("atual", n === 4);
  $("abaCriar").classList.toggle("atual", n !== 4);
  $("linkMeus").toggleAttribute("aria-current", n === 4);
  n === 4 ? $("abaMeus").setAttribute("aria-current", "page") : $("abaMeus").removeAttribute("aria-current");
  n !== 4 ? $("abaCriar").setAttribute("aria-current", "page") : $("abaCriar").removeAttribute("aria-current");
  pintarFaixas();
  if(n === 4) listarMeus();
  if(focar){
    const h = document.querySelector('[data-e="' + n + '"] h1');
    if(h) h.focus({preventScroll: true});
    window.scrollTo({top: 0});
  }
}

