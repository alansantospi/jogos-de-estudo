# -*- coding: utf-8 -*-
"""Religa o motor de inglês depois da troca de emoji por ícone.

O `aplicar.py` renomeia o campo `icon:"<emoji>"` para `ic:"<nome-do-ícone>"`,
mas quem *lê* esse campo continuava em `.icon`: verbos, questões geradas,
mapa da trilha e cabeçalho da missão passaram a imprimir `undefined`.
"""
import io, re

A = "time-travel-english.html"
s = io.open(A, encoding="utf-8").read()


def conta(velho, esperado=None):
    n = s.count(velho)
    assert n, "nao achei %r" % velho
    if esperado is not None:
        assert n == esperado, "%r: esperava %d, achei %d" % (velho, esperado, n)
    return n


def svg(expr):
    """Marcação de um ícone do sprite a partir de uma expressão JS."""
    return ('<svg class="ic-txt" viewBox="0 0 24 24" aria-hidden="true">'
            '<use href="#i-${%s}"/></svg>' % expr)


# 1. mapa da trilha: nó concluído leva um ✓, os demais o ícone da etapa
velho = '${i<trailStep?"✓":s.icon}'
conta(velho, 1)
s = s.replace(velho, '${i<trailStep?"✓":`' + svg("s.ic") + '`}')

# 2. cabeçalho da missão: era `${meta.icon} Título — história`, em texto puro
velho = 'story.textContent=`${meta.icon} ${meta.title} — ${meta.story}`;'
conta(velho, 1)
s = s.replace(velho, 'story.innerHTML=`' + svg("meta.ic")
              + '<span><b>${meta.title}</b> — ${meta.story}</span>`;')

# 3. fichas dos verbos que ainda pedem atenção
velho = '<span class="missed-chip">${v.icon} <b>${v.base}</b>'
conta(velho, 1)
s = s.replace(velho, '<span class="missed-chip">' + svg("v.ic")
              + ' <b>${v.base}</b>')

# 4. makeChoice monta a questão: a chave precisa ser `ic`, que é o nome que o
#    renderizador da ilustração procura
velho = 'type:"choice",stage,icon,q,'
conta(velho, 1)
s = s.replace(velho, 'type:"choice",stage,ic:icon,q,')

# 5. questões montadas à mão a partir de um verbo
n4 = conta("icon:v.icon,")
s = s.replace("icon:v.icon,", "ic:v.ic,")

# 6. o que sobrou lendo o verbo: o argumento de makeChoice
n5 = conta("v.icon")
s = s.replace("v.icon", "v.ic")

io.open(A, "w", encoding="utf-8").write(s)

sem_css = re.sub(r"<style>.*?</style>", "", s, flags=re.S)
resta = re.findall(r"\.icon\b", sem_css)
assert not resta, "ainda ha %d leitura(s) de .icon no script" % len(resta)
print("  ok  motor de ingles religado (%d questoes, %d verbos)" % (n4, n5))
