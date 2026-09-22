# -*- coding: utf-8 -*-
"""O aviso de conquista e a virada de etapa.

Dois problemas: o aviso nascia colado no topo da janela, por cima do
cabeçalho, e usava a cor da matéria — a mesma do cabeçalho, 1,09:1, ou seja
invisível. E o fim de etapa chegava no mesmo balãozinho de "três seguidas",
sem dizer o que tinha acabado nem o que vinha.

Agora o aviso se mede contra o cabeçalho antes de aparecer, tem cor própria,
e o fim de etapa vira um cartão que nomeia a etapa fechada e a próxima —
com o nó correspondente da trilha piscando ao ficar verde.
"""
import io

CHECK = ('<svg class=\\"ic-txt\\" viewBox=\\"0 0 24 24\\" aria-hidden=\\"true\\">'
         '<use href=\\"#i-check\\"/></svg>')

# ---------------------------------------------------------------- inglês

EN_DE = '''function showAchievement(text){
  const pop=document.getElementById("achievementPop");
  if(!pop)return;
  pop.textContent=text;
  pop.classList.add("show");
  setTimeout(()=>pop.classList.remove("show"),1800);
}'''

EN_PARA = '''function posicionarAviso(pop){
  // Abaixo do painel de progresso, para a trilha — que é o que o aviso está
  // anunciando — continuar à vista. Fora da partida, abaixo do cabeçalho.
  const alvo=document.querySelector("#quiz.active .progress-panel")
          || document.querySelector("header");
  const y=alvo?alvo.getBoundingClientRect().bottom+12:12;
  pop.style.setProperty("--aviso-topo",Math.round(Math.max(y,12))+"px");
}

function marcarEtapaFechada(i){
  const n=document.querySelectorAll("#trailMap .trail-node")[i];
  if(!n) return;
  n.classList.add("fechou");
  setTimeout(()=>n.classList.remove("fechou"),700);
}

function showAchievement(text,etapa){
  const pop=document.getElementById("achievementPop");
  if(!pop)return;
  pop.classList.toggle("etapa",!!etapa);
  if(etapa) pop.innerHTML=text; else pop.textContent=text;
  posicionarAviso(pop);
  pop.classList.remove("show");
  void pop.offsetWidth;            // reinicia a animação se já estava na tela
  pop.classList.add("show");
  clearTimeout(pop._t);
  pop._t=setTimeout(()=>pop.classList.remove("show"),etapa?2800:1800);
}'''

EN_AV_DE = '''    trailStep++;
    sfx.etapa();
    showAchievement(`Etapa concluída! Próxima: ${trail.steps[trailStep].label}`);
    startTrailStep();
    return true;'''

EN_AV_PARA = '''    const fechada=trailStep;
    trailStep++;
    sfx.etapa();
    showAchievement(
      `<span class="aviso-t">%s Etapa ${fechada+1} de ${trail.steps.length} concluída</span>`+
      `<span class="aviso-s">Agora: ${trail.steps[trailStep].label}</span>`, true);
    startTrailStep();
    marcarEtapaFechada(fechada);
    return true;''' % CHECK

# ------------------------------------------------------------------ céu

CEU_DE = '''function mostrarConquista(txt){
  const p=document.getElementById("conquista");
  if(!p) return;
  p.textContent=txt;
  p.classList.add("show");
  clearTimeout(p._t);
  p._t=setTimeout(()=>p.classList.remove("show"),2200);
}'''

CEU_PARA = '''function posicionarAviso(p){
  // Abaixo do painel de progresso, para a trilha — que é o que o aviso está
  // anunciando — continuar à vista. Fora da partida, abaixo do cabeçalho.
  const alvo=document.querySelector("#quiz.active .progress-panel")
          || document.querySelector("header");
  const y=alvo?alvo.getBoundingClientRect().bottom+12:12;
  p.style.setProperty("--aviso-topo",Math.round(Math.max(y,12))+"px");
}

function marcarEtapaFechada(i){
  const n=document.querySelectorAll("#trailMap .node")[i];
  if(!n) return;
  n.classList.add("fechou");
  setTimeout(()=>n.classList.remove("fechou"),700);
}

function mostrarConquista(txt,etapa){
  const p=document.getElementById("conquista");
  if(!p) return;
  p.classList.toggle("etapa",!!etapa);
  if(etapa) p.innerHTML=txt; else p.textContent=txt;
  posicionarAviso(p);
  p.classList.remove("show");
  void p.offsetWidth;              // reinicia a animação se já estava na tela
  p.classList.add("show");
  clearTimeout(p._t);
  p._t=setTimeout(()=>p.classList.remove("show"),etapa?2800:2200);
}'''

CEU_AV_DE = '''      trailStep++;sfx.etapa();
      mostrarConquista(`Etapa concluída! Próxima: ${nomes[trails[activeTrail].steps[trailStep]]||''}`);
      startTrailStep();return;'''

CEU_AV_PARA = '''      const fechada=trailStep;
      trailStep++;sfx.etapa();
      const tr=trails[activeTrail];
      mostrarConquista(
        `<span class="aviso-t">%s Etapa ${fechada+1} de ${tr.steps.length} concluída</span>`+
        `<span class="aviso-s">Agora: ${nomes[tr.steps[trailStep]]||''}</span>`, true);
      startTrailStep();marcarEtapaFechada(fechada);return;''' % CHECK


def aplicar(arq, pares):
    s = io.open(arq, encoding="utf-8").read()
    for de, para in pares:
        assert s.count(de) == 1, "%s: ancora aparece %d vez(es)\n%s" % (
            arq, s.count(de), de[:80])
        s = s.replace(de, para)
    io.open(arq, "w", encoding="utf-8").write(s)


aplicar("time-travel-english.html", [(EN_DE, EN_PARA), (EN_AV_DE, EN_AV_PARA)])
for arq in ("historia.html", "artes.html", "exploradores-do-ceu.html"):
    aplicar(arq, [(CEU_DE, CEU_PARA), (CEU_AV_DE, CEU_AV_PARA)])
print("  ok  aviso posicionado e virada de etapa explicita")
