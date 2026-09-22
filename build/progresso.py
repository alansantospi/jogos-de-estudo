# -*- coding: utf-8 -*-
"""Unifica o formato do progresso salvo entre os dois motores.

O motor do céu guarda `items:{id:{e,h}}` e `best.acc`; o de inglês guardava
`verbs:{base:{errors,hits}}` e `best.accuracy` — mesma ideia, nomes
diferentes. Enquanto forem dois, cada passo de build precisa de dois caminhos
e cada esquecimento vira defeito.

O inglês passa a usar a forma do céu, e o que já estava salvo é convertido ao
carregar. **Esta é a parte perigosa**: migração mal feita já apagou o
progresso da Anne uma vez. Por isso a conversão preserva os números e o teste
`teste/casos/migracao.js` cobra isso contra o formato antigo de verdade.
"""
import io, os

RAIZ = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
ARQ = "time-travel-english.html"

TROCAS = [
    # o formato padrão
    ('return {verbs:{}, best:{score:0,accuracy:0}, trails:{}, missions:{}, practice:true, mudo:false};',
     'return {items:{}, best:{score:0,acc:0}, trails:{}, missions:{}, practice:true, mudo:false};'),

    # leitura do que está salvo, agora convertendo o formato antigo
    ('''    return {verbs:p.verbs||d.verbs, best:p.best||d.best, trails:p.trails||d.trails,
            missions:p.missions||d.missions,
            practice:typeof p.practice==="boolean"?p.practice:d.practice,
            mudo:!!p.mudo};''',
     '''    return {items:migrarItens(p)||d.items, best:migrarMelhor(p.best)||d.best,
            trails:p.trails||d.trails, missions:p.missions||d.missions,
            practice:typeof p.practice==="boolean"?p.practice:d.practice,
            mudo:!!p.mudo};'''),

    # quem lê e escreve item a item
    ('return progress.verbs[base] || (progress.verbs[base]={errors:0,hits:0});',
     'return progress.items[base] || (progress.items[base]={e:0,h:0});'),
    ('.filter(v=>{ const e=progress.verbs[v.base]; return e && e.errors>e.hits; })\n'
     '    .sort((a,b)=>(progress.verbs[b.base].errors-progress.verbs[b.base].hits)\n'
     '                -(progress.verbs[a.base].errors-progress.verbs[a.base].hits));',
     '.filter(v=>{ const t=progress.items[v.base]; return t && t.e>t.h; })\n'
     '    .sort((a,b)=>(progress.items[b.base].e-progress.items[b.base].h)\n'
     '                -(progress.items[a.base].e-progress.items[a.base].h));'),
    ('return verbBank.filter(v=>{ const e=progress.verbs[v.base]; return e && e.hits>=3 && e.hits>e.errors; });',
     'return verbBank.filter(v=>{ const t=progress.items[v.base]; return t && t.h>=3 && t.h>t.e; });'),

    # contagem de verbos dominados no cartão da missão
    ('const dominados=lista.filter(v=>{const t=progress.verbs[v.base];return t&&t.hits>=3&&t.hits>t.errors}).length;',
     'const dominados=lista.filter(v=>{const t=progress.items[v.base];return t&&t.h>=3&&t.h>t.e}).length;'),

    # peso do sorteio: é daqui que sai a repetição espaçada
    # peso do sorteio: é daqui que sai a repetição espaçada
    ('''  const e=progress.verbs[v.base];
  if(!e) return 3;                       // nunca visto: prioridade alta
  const net=e.errors-e.hits;
  if(net>0) return Math.min(12,3+net*3); // errando mais do que acerta
  if(e.hits>=3) return 1;                // dominado: aparece pouco''',
     '''  const t=progress.items[v.base];
  if(!t) return 3;                       // nunca visto: prioridade alta
  const net=t.e-t.h;
  if(net>0) return Math.min(12,3+net*3); // errando mais do que acerta
  if(t.h>=3) return 1;                   // dominado: aparece pouco'''),

    # registro de acerto e erro
    ('bases.forEach(b=>{ const e=verbStat(b); if(ok) e.hits++; else e.errors++; });',
     'bases.forEach(b=>{ const t=verbStat(b); if(ok) t.h++; else t.e++; });'),

    # o recorde de precisão
    ('if(acc>progress.best.accuracy) progress.best.accuracy=acc;',
     'if(acc>progress.best.acc) progress.best.acc=acc;'),
]

MIGRACAO = '''
/* ---------- migração do formato antigo ---------- */
/* Este motor guardava o progresso com outros nomes de campo. Agora usa a
   mesma forma do outro motor, e converter na leitura é o que impede um
   aparelho com progresso antigo de aparecer zerado.
   Nunca descarta: na dúvida entre dois valores, fica o maior. */
function migrarItens(p){
  if(!p) return null;
  const saida = Object.assign({}, p.items || {});
  Object.entries(p.verbs || {}).forEach(([k, v]) => {
    const atual = saida[k] || {e: 0, h: 0};
    saida[k] = {e: Math.max(atual.e | 0, v.errors | 0, v.e | 0),
                h: Math.max(atual.h | 0, v.hits | 0, v.h | 0)};
  });
  return saida;
}
function migrarMelhor(b){
  if(!b) return null;
  const acc = Math.max(b.acc | 0, b.accuracy | 0);
  return {score: b.score | 0, acc: acc};
}
'''


def aplicar():
    s = io.open(os.path.join(RAIZ, ARQ), encoding="utf-8").read()
    for de, para in TROCAS:
        assert s.count(de) == 1, "progresso: nao achei %r" % de[:60]
        s = s.replace(de, para)

    # As funções de migração precisam existir antes de loadProgress rodar.
    marca = "function loadProgress(){"
    assert s.count(marca) == 1
    s = s.replace(marca, MIGRACAO + "\n" + marca, 1)

    # Comentário citando o nome antigo não é uso: varre o código sem eles.
    import re as _re
    codigo = _re.sub(r"/\*.*?\*/", "", s, flags=_re.S)
    codigo = _re.sub(r"(^|[^:])//[^\n]*", r"\1", codigo)
    for antigo in ("progress.verbs", "e.hits", "e.errors", "best.accuracy"):
        n = codigo.count(antigo)
        assert n == 0, "sobraram %d uso(s) de %s" % (n, antigo)
    io.open(os.path.join(RAIZ, ARQ), "w", encoding="utf-8").write(s)
    print("  %-24s progresso no formato comum, com migração" % "time-travel-english")


if __name__ == "__main__":
    aplicar()
