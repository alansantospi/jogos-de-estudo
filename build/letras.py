# -*- coding: utf-8 -*-
"""Marcador de letra (A, B, C, D) nas alternativas, nos dois motores."""
import io
CEU_DE="""  q.choices.forEach((c,i)=>{
    const b=document.createElement('button');
    b.className='answer';b.type='button';b.textContent=c;"""
CEU_PARA="""  q.choices.forEach((c,i)=>{
    const b=document.createElement('button');
    b.className='answer';b.type='button';
    const marca=document.createElement('span');
    marca.className='letra';marca.textContent='ABCD'[i]||String(i+1);
    const txt=document.createElement('span');txt.textContent=c;
    b.append(marca,txt);"""
TF_DE="""    b.className='answer tf-btn';b.type='button';b.textContent=label;"""
TF_PARA="""    b.className='answer tf-btn';b.type='button';
    const mk=document.createElement('span');mk.className='letra';mk.textContent='AB'[i];
    const tx=document.createElement('span');tx.textContent=label;b.append(mk,tx);"""
EN_DE="""    const b=document.createElement("button");
    b.className="answer";
    b.textContent=c;"""
EN_PARA="""    const b=document.createElement("button");
    b.className="answer";b.type="button";
    const marca=document.createElement("span");
    marca.className="letra";marca.textContent="ABCD"[i]||String(i+1);
    const txt=document.createElement("span");txt.textContent=c;
    b.append(marca,txt);"""
for arq in ("historia.html","artes.html","exploradores-do-ceu.html"):
    s=io.open(arq,encoding="utf-8").read()
    assert s.count(CEU_DE)==1 and s.count(TF_DE)==1, arq
    io.open(arq,"w",encoding="utf-8").write(s.replace(CEU_DE,CEU_PARA).replace(TF_DE,TF_PARA))
s=io.open("time-travel-english.html",encoding="utf-8").read()
assert s.count(EN_DE)==1
io.open("time-travel-english.html","w",encoding="utf-8").write(s.replace(EN_DE,EN_PARA))
print("  ok  marcadores A/B/C/D aplicados")
