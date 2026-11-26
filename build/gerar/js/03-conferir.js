/* ---------- 2. conferir ---------- */

function mostrarLeitura(r){
  largarSalvo();
  leitura = {aviso: r.aviso || "", custo: r.custo_usd, restantes: r.restantes,
             paginas: r.paginas.map(p => ({...p, marcada: p.legivel !== "nao"}))};
  cota(r.restantes);
  guardarLeitura();
  pintarPaginas();
  aplicarPaginas();
  irPara(2);
}

/* As páginas marcadas, na ordem, viram o material. A caixa continua
   editável; mexer na seleção reescreve o que estiver nela. */
function aplicarPaginas(){
  const marcadas = leitura.paginas.filter(p => p.marcada);
  $("material").value = marcadas.map(p => p.texto).join("\n\n");
  sugerirNome(marcadas);
  contar(); guardarMaterial();
}

/* O nome e a matéria que a leitura viu impressos nas páginas. Só ocupa
   campo vazio, ou que ainda tem a sugestão anterior: o que a pessoa
   escreveu fica. */
let sugerido = {titulo: "", materia: ""};
function sugerirNome(paginas){
  const titulo = (paginas.find(p => p.assunto) || {}).assunto || "";
  const conta = {};
  paginas.forEach(p => { if(p.materia) conta[p.materia] = (conta[p.materia] || 0) + 1; });
  const materia = Object.keys(conta).sort((a, b) => conta[b] - conta[a])[0] || "";
  aplicarSugestao(titulo, materia, "das páginas lidas");
}
function aplicarSugestao(titulo, materia, deOnde){
  const usou = [];
  [["titulo", titulo], ["materia", materia]].forEach(([k, v]) => {
    const campo = $(k);
    if(v && (!campo.value.trim() || campo.value === sugerido[k])){ campo.value = v; usou.push(k); }
    // A sugestão anterior que o material novo não sustenta sai junto.
    else if(!v && sugerido[k] && campo.value === sugerido[k]) campo.value = "";
    sugerido[k] = v;
  });
  pintarCapa();
}

