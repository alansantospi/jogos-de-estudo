/* O jogo criado, no esquema de `conteudo/` (o mesmo que `build/esquema.py`
   valida). Mora aqui porque dois lados o montam: a fila, no servidor, quando
   a última tarefa termina, e `gerar.html`, quando a pessoa salva a revisão.
   `build/gerar.py` recorta o bloco abaixo para a página, sem os `export`.

   JavaScript, não TypeScript: entra como está numa página sem build. */

/*CONTEUDO>*/
export function slug(t){
  return String(t || "").toLowerCase().normalize("NFD").replace(/\p{M}/gu, "")
    .replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "") || "jogo";
}

/* O trecho foi conferido contra o material, que é a soma das páginas: a
   página que o contém é a procedência da questão. A comparação ignora
   espaço e aspas, como a conferência do servidor. */
const semAspas = t => String(t || "").toLowerCase().replace(/[“”"'‘’«»]/g, "").replace(/\s+/g, " ").trim();
export function fonteDe(q, p){
  const t = semAspas(q.trecho);
  const pg = (p.paginas || []).find(x => semAspas(x.texto).includes(t));
  return pg ? {tipo: /\.pdf$/i.test(pg.nome) ? "pdf" : "foto", detalhe: pg.nome + ", p." + pg.pagina}
            : {tipo: "material", detalhe: p.titulo};
}

/* `questoes` são as que vão para o jogo, já escolhidas; `licao` é por
   missão, {id: {passos}}. `cor` é a chave da tabela de cores: sem ela, o
   jogo sai na cor da matéria. */
export function conteudoDoJogo({pedido: p, missoes, questoes: qs, licao, cor}){
  const usadas = missoes.filter(m => qs.some(q => q.missao === m.id)).map(({id, nome}) => ({id, nome}));
  const c = {
    id: slug(p.titulo) + "-" + slug(p.ano), materia: p.materia, titulo: p.titulo, motor: "ceu",
    missoes: usadas,
    trilhas: [{id: "tudo", nome: "Todas as missões", etapas: [...usadas.map(m => m.id), "all"]}],
    // A lição das missões que ficaram no jogo; `problemas` e `fora` são da revisão.
    licao: usadas.flatMap(m => ((licao || {})[m.id] || {}).passos || [])
      .filter(x => !x.fora).map(({problemas, fora, ...x}) => x),
    questoes: qs.map(q => ({tipo: "escolha", missao: q.missao, icone: q.icone,
      enunciado: q.enunciado, certa: q.certa, erradas: q.erradas, explicacao: q.explicacao,
      // Veio de material que não é nosso: serve para estudar, não para vender.
      // A página lida vence; sem ela, fica a procedência que a questão já tinha.
      origem: "derivada", fonte: fonteDe(q, p).tipo === "material" && q.fonte ? q.fonte : fonteDe(q, p),
      trecho: q.trecho})),
  };
  if(cor) c.cor = cor;
  return c;
}
/*<CONTEUDO*/
