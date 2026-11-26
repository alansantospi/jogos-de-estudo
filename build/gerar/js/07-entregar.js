/* ---------- entregar ---------- */

/*%CONTEUDO%*/

/* O jogo da revisão: as aprovadas, na cor escolhida ou na da matéria. */
function montarConteudo(){
  const p = estado.pedido;
  return conteudoDoJogo({pedido: p, missoes: estado.missoes, questoes: aprovadas(), licao: estado.licao,
                         cor: Object.hasOwn(CORES_JOGO, p.cor) ? p.cor : corSugerida(p.materia, p.titulo)});
}

function baixar(){
  const c = montarConteudo();
  const a = el("a", {href: URL.createObjectURL(new Blob([JSON.stringify(c, null, 1)],
    {type: "application/json"})), download: c.id + ".json"});
  document.body.append(a); a.click(); a.remove();
  recado("Baixado " + c.id + ".json, com " + plural(c.questoes.length, "questão", "questões")
    + ". Ele vai para conteudo/ e vira jogo pelos passos de conteudo/LEIA.md.");
}

/* O jogo vai para a conta e abre em `jogar.html`, montado no navegador com
   o mesmo motor dos jogos feitos à mão. Salvar de novo atualiza o mesmo
   jogo, em vez de criar uma cópia. As duas portas abaixo são trocadas pelo
   teste. */
async function gravarJogo(linha, id){
  const sb = await cliente();
  const r = id ? await sb.from("jogos").update({...linha, atualizado: new Date().toISOString()}).eq("id", id).select("id").single()
               : await sb.from("jogos").insert(linha).select("id").single();
  if(r.error) throw new Error(/jogos/.test(r.error.message) && /exist|schema/i.test(r.error.message)
    ? "A tabela de jogos ainda não existe: falta rodar supabase db push (GERAR.md)." : r.error.message);
  return r.data.id;
}
/* O jogo salvo já fica no aparelho, e o índice o mostra sem esperar a rede. */
function lembrarJogo(id, c){
  try{
    localStorage.setItem("jogo_gerado_" + id, JSON.stringify(c));
    const antes = (lerDe("jogos_criados_v1") || []).find(j => j.id === id);
    const lista = (lerDe("jogos_criados_v1") || []).filter(j => j.id !== id);
    lista.unshift({id, titulo: c.titulo, materia: c.materia, cor: c.cor, questoes: c.questoes.length,
                   criado: antes ? antes.criado : new Date().toISOString(), atualizado: new Date().toISOString()});
    localStorage.setItem("jogos_criados_v1", JSON.stringify(lista));
  }catch(e){}
}
function abrirJogo(id){ location.href = "jogar.html?id=" + encodeURIComponent(id); }

async function salvarJogo(){
  // Jogar já: o pendente sem aviso entra aprovado.
  prontas().forEach(q => { q.estado = "aprovada"; });
  guardar();
  const c = montarConteudo();
  const b = $("salvar");
  b.classList.add("ocupado"); b.disabled = true;
  try{
    estado.jogoId = await gravarJogo({titulo: c.titulo, materia: c.materia, ano: estado.pedido.ano || "",
                                      material: estado.pedido.material || "", conteudo: c}, estado.jogoId);
    guardar();
    lembrarJogo(estado.jogoId, c);
    limparCriacao();
    abrirJogo(estado.jogoId);
  }catch(e){
    recado("Não consegui salvar: " + e.message, true);
  }finally{
    b.classList.remove("ocupado");
    pintar();
  }
}

