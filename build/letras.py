# -*- coding: utf-8 -*-
"""Marcador de LETRA nas alternativas (A, B, C, D), cada uma em sua cor.

Antes eram círculo, triângulo, quadrado e losango — que não é inspiração no
Kahoot, é a assinatura dele. A letra faz o mesmo trabalho de identificar a
resposta de relance, é a convenção que a criança já usa na escola ("a letra
B") e não é de ninguém."""

FORMAS = ('const FORMAS=["A","B","C","D"];\n'
          'const NOMES_FORMA=FORMAS;\n')
import io
CEU_DE="""  q.choices.forEach((c,i)=>{
    const b=document.createElement('button');
    b.className='answer';b.type='button';b.textContent=c;"""
CEU_PARA="""  q.choices.forEach((c,i)=>{
    const b=document.createElement('button');
    b.className='answer';b.type='button';
    const marca=document.createElement('span');
    marca.className='letra';marca.textContent=FORMAS[i%4];
    const txt=document.createElement('span');txt.textContent=c;
    b.append(marca,txt);"""
TF_DE="""    b.className='answer tf-btn';b.type='button';b.textContent=label;"""
TF_PARA="""    b.className='answer tf-btn';b.type='button';
    const mk=document.createElement('span');mk.className='letra';mk.textContent=FORMAS[i%4];
    const tx=document.createElement('span');tx.textContent=label;b.append(mk,tx);"""
EN_DE="""    const b=document.createElement("button");
    b.className="answer";
    b.textContent=c;"""
EN_PARA="""    const b=document.createElement("button");
    b.className="answer";b.type="button";
    const marca=document.createElement("span");
    marca.className="letra";marca.textContent=FORMAS[i%4];
    const txt=document.createElement("span");txt.textContent=c;
    b.append(marca,txt);"""
for arq in ("historia.html","artes.html","exploradores-do-ceu.html"):
    s=io.open(arq,encoding="utf-8").read()
    assert s.count(CEU_DE)==1 and s.count(TF_DE)==1, arq
    s=s.replace(CEU_DE,CEU_PARA).replace(TF_DE,TF_PARA)
    s=s.replace("<script>\nconst SVG_SOM=","<script>\n"+FORMAS+"const SVG_SOM=",1)
    s=s.replace("""    b.setAttribute('aria-label',`Alternativa ${i+1}: ${c}`);""",
                """    b.setAttribute('aria-label',`Alternativa ${NOMES_FORMA[i%4]}: ${c}`);""")
    io.open(arq,"w",encoding="utf-8").write(s)
s=io.open("time-travel-english.html",encoding="utf-8").read()
assert s.count(EN_DE)==1
s=s.replace(EN_DE,EN_PARA)
s=s.replace("<script>\nconst SVG_SOM=","<script>\n"+FORMAS+"const SVG_SOM=",1)
io.open("time-travel-english.html","w",encoding="utf-8").write(s)
print("  ok  letras nas alternativas")
