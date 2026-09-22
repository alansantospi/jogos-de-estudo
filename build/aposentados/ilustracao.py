# -*- coding: utf-8 -*-
"""Faz o motor desenhar a ilustração da questão (q.ic) no lugar do antigo emoji."""
import io

CEU_DE = """  document.getElementById('illustration').textContent=q.i;"""
CEU_PARA = """  const il=document.getElementById('illustration');
  il.innerHTML = q.ic
    ? '<svg viewBox="0 0 24 24" aria-hidden="true"><use href="#i-'+q.ic+'"/></svg>' : '';
  il.style.display = q.ic ? '' : 'none';"""

EN_DE = """  document.getElementById("illustration").textContent=q.icon || "";"""
EN_PARA = """  const il=document.getElementById("illustration");
  il.innerHTML = q.ic
    ? '<svg viewBox="0 0 24 24" aria-hidden="true"><use href="#i-'+q.ic+'"/></svg>' : "";
  il.style.display = q.ic ? "" : "none";"""

# A caixa "Conteúdos que ainda pedem atenção" também lia o campo antigo e
# imprimia "undefined" na frente de cada linha.
MISSED_DE = ("`<ul class=\"missed-list\">${w.map(q=>`<li>${q.i} ${q.q}</li>`)"
             ".join('')}</ul>`+")
MISSED_PARA = ("`<ul class=\"missed-list\">${w.map(q=>`<li>"
               "${q.ic ? '<svg class=\"ic-txt\" viewBox=\"0 0 24 24\" aria-hidden=\"true\">"
               "<use href=\"#i-'+q.ic+'\"/></svg>' : ''}"
               "<span>${q.q}</span></li>`).join('')}</ul>`+")

for arq in ("historia.html","artes.html","exploradores-do-ceu.html"):
    s=io.open(arq,encoding="utf-8").read()
    assert s.count(CEU_DE)==1, arq
    assert s.count(MISSED_DE)==1, "%s: a caixa de revisao mudou" % arq
    s=s.replace(CEU_DE,CEU_PARA).replace(MISSED_DE,MISSED_PARA)
    io.open(arq,"w",encoding="utf-8").write(s)
# No motor de inglês a linha antiga fica ANTES de clearZones(), que limpa a
# própria ilustração. Desenhar ali não adianta: tem de ser depois da limpeza.
s=io.open("time-travel-english.html",encoding="utf-8").read()
assert s.count(EN_DE)==1, "inglês"
s=s.replace(EN_DE+"\n","")
CHAMADA="  clearZones();\n"
assert s.count(CHAMADA)==1, "clearZones() nao esta onde eu esperava"
s=s.replace(CHAMADA, CHAMADA+EN_PARA+"\n")
io.open("time-travel-english.html","w",encoding="utf-8").write(s)
print("  ok  ilustração da questão desenhada pelo motor")
