# -*- coding: utf-8 -*-
"""Os passos da lição de Ciências — Mundo microscópico (livro, pp. 72-101).

A maquinaria está em licao.py. Os passos miram onde a Anne errou na folha de
revisão de 20/10: fungo "faz fotossíntese e tem flagelos", o comum a todos os
seres vivos respondido como "núcleo e citoplasma" (a bactéria não tem núcleo),
e o protozoário da doença de Chagas trocado por "infecção parasitária".
"""
import os, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from licao import montar


def svg_celulas():
    """A célula vegetal, com parede e cloroplastos, ao lado da animal."""
    return ('<svg id="fgCel" data-estado="vegetal" viewBox="0 0 480 170" role="img" '
      'aria-label="Célula vegetal com parede celular, cloroplastos, núcleo e citoplasma; '
      'célula animal só com núcleo e citoplasma">'
      '<style>#fgCel .rot{stroke:var(--texto-3)}#fgCel[data-estado="vegetal"] .zv,#fgCel[data-estado="animal"] .za'
      '{fill:var(--materia);opacity:.28}</style>'
      '<rect class="z zv" x="10" y="8" width="220" height="134" rx="14"/>'
      '<rect class="z za" x="250" y="8" width="220" height="134" rx="14"/>'
      # vegetal: parede dupla, núcleo, cloroplastos
      '<rect class="rot" x="50" y="24" width="140" height="100" rx="6" style="stroke-width:5"/>'
      '<rect class="rot" x="58" y="32" width="124" height="84" rx="4"/>'
      '<circle class="marca" cx="96" cy="70" r="14"/>'
      '<ellipse class="rot" cx="150" cy="52" rx="12" ry="7"/><ellipse class="rot" cx="152" cy="92" rx="12" ry="7"/>'
      '<ellipse class="rot" cx="80" cy="102" rx="11" ry="6"/>'
      # animal: redonda, só núcleo
      '<circle class="rot" cx="360" cy="74" r="54"/>'
      '<circle class="marca" cx="350" cy="70" r="14"/>'
      '<text class="forte" x="120" y="162" text-anchor="middle">célula vegetal</text>'
      '<text class="forte" x="360" y="162" text-anchor="middle">célula animal</text>'
      '</svg>')


def svg_microscopios():
    """Ótico: a imagem no próprio aparelho. Eletrônico: no computador."""
    return ('<svg id="fgMic" data-estado="otico" viewBox="0 0 480 150" role="img" '
      'aria-label="No microscópio ótico a luz passa pelas lentes e a imagem aparece no '
      'aparelho; no eletrônico a imagem aparece num computador">'
      '<style>#fgMic .rot{stroke:var(--texto-3)}#fgMic[data-estado="otico"] .zo,#fgMic[data-estado="eletronico"] .ze'
      '{fill:var(--materia);opacity:.28}</style>'
      '<rect class="z zo" x="10" y="8" width="220" height="110" rx="14"/>'
      '<rect class="z ze" x="250" y="8" width="220" height="110" rx="14"/>'
      # ótico: tubo, lente, platina, luz
      '<path class="rot" d="M100 24v40M92 24h16M80 70h60M110 70v30M70 100h80"/>'
      '<path class="rot" d="m100 98-6 -10M100 98l6-10" style="stroke-dasharray:3 3"/>'
      '<circle class="marca" cx="100" cy="62" r="5"/>'
      # eletrônico: coluna e tela
      '<path class="rot" d="M300 20v74M290 94h20"/>'
      '<rect class="rot" x="350" y="40" width="80" height="54" rx="6"/>'
      '<circle class="marca" cx="390" cy="67" r="9"/>'
      '<text class="fraca" x="120" y="112" text-anchor="middle">luz e lentes</text>'
      '<text class="fraca" x="360" y="112" text-anchor="middle">imagem no computador</text>'
      '<text class="forte" x="120" y="140" text-anchor="middle">ótico</text>'
      '<text class="forte" x="360" y="140" text-anchor="middle">eletrônico</text>'
      '</svg>')


def svg_locomocao():
    """Os quatro jeitos de um protozoário se mover; acende o escolhido."""
    css = "".join('#fgLoc[data-estado="%s"] .c%d{fill:var(--materia);opacity:.28}' % (e, i + 1)
                  for i, e in enumerate(("flagelados", "ciliados", "rizopodes", "esporozoarios")))
    p = ['<svg id="fgLoc" data-estado="flagelados" viewBox="0 0 480 140" role="img" '
         'aria-label="Flagelados com flagelo, ciliados com cílios, rizópodes com '
         'pseudópodes e esporozoários sem estrutura de locomoção"><style>#fgLoc .rot{stroke:var(--texto-3)}%s</style>' % css]
    for i in range(4):
        p.append('<rect class="z c%d" x="%d" y="8" width="108" height="100" rx="12"/>'
                 % (i + 1, 8 + i * 118))
    # flagelado: gota com cauda
    p.append('<ellipse class="rot" cx="54" cy="58" rx="22" ry="14"/>'
             '<path class="rot" d="M76 58c10-12 18 10 28-4"/>')
    # ciliado: elipse com pelinhos
    p.append('<ellipse class="rot" cx="180" cy="58" rx="32" ry="16"/>'
             + "".join('<path class="rot" d="M%d 40v-6M%d 76v6"/>' % (x, x)
                       for x in range(158, 206, 8)))
    # rizópode: corpo com braços
    p.append('<path class="rot" d="M280 58c0-20 14-8 20-24 8 12 26 6 22 24 14 4 6 22-8 18 '
             '0 14-20 12-22 2-14 6-24-8-12-20z"/>')
    # esporozoário: gota lisa
    p.append('<path class="rot" d="M416 30c16 14 18 40 0 56-18-16-16-42 0-56z"/>')
    for i, (nome, oque) in enumerate((("flagelados", "flagelo"), ("ciliados", "cílios"),
                                      ("rizópodes", "pseudópodes"),
                                      ("esporozoários", "não se movem"))):
        x = 62 + i * 118
        p.append('<text class="forte" x="%d" y="124" text-anchor="middle">%s</text>' % (x, nome))
        p.append('<text class="fraca" x="%d" y="100" text-anchor="middle">%s</text>' % (x, oque))
    p.append('</svg>')
    return "".join(p)


def svg_oxigenio():
    """De cada cinco partes do oxigênio do planeta, quatro vêm do fitoplâncton."""
    p = ['<svg viewBox="0 0 480 110" role="img" aria-label="Quatro de cada cinco partes do '
         'oxigênio do planeta vêm do fitoplâncton">']
    for i in range(5):
        p.append('<rect class="bolha%s" x="%d" y="20" width="80" height="44" rx="10"/>'
                 % (" on" if i < 4 else "", 20 + i * 90))
        p.append('<text class="forte" x="%d" y="48" text-anchor="middle">%s</text>'
                 % (60 + i * 90, "fitoplâncton" if i < 4 else "o resto"))
    p.append('<text class="fraca" x="240" y="92" text-anchor="middle">'
             '4/5 do oxigênio vêm de algas que só o microscópio mostra</text></svg>')
    return "".join(p)


def svg_bacterias():
    """Os quatro formatos de bactéria."""
    css = "".join('#fgBac[data-estado="%s"] .c%d{fill:var(--materia);opacity:.28}' % (e, i + 1)
                  for i, e in enumerate(("coco", "bacilo", "espirilo", "vibriao")))
    p = ['<svg id="fgBac" data-estado="coco" viewBox="0 0 480 130" role="img" '
         'aria-label="Coco em forma de bola, bacilo em bastão, espirilo em espiral e '
         'vibrião em vírgula"><style>#fgBac .rot{stroke:var(--texto-3)}%s</style>' % css]
    for i in range(4):
        p.append('<rect class="z c%d" x="%d" y="8" width="108" height="84" rx="12"/>'
                 % (i + 1, 8 + i * 118))
    p.append('<circle class="rot" cx="48" cy="50" r="10"/><circle class="rot" cx="70" cy="50" r="10"/>'
             '<circle class="rot" cx="59" cy="32" r="10"/>')
    p.append('<rect class="rot" x="150" y="40" width="58" height="20" rx="10"/>')
    p.append('<path class="rot" d="M262 50c6-16 12 16 18 0s12 16 18 0 12 16 18 0"/>')
    p.append('<path class="rot" d="M400 34c24 0 30 22 12 34"/>')
    for i, nome in enumerate(("coco", "bacilo", "espirilo", "vibrião")):
        p.append('<text class="forte" x="%d" y="116" text-anchor="middle">%s</text>'
                 % (62 + i * 118, nome))
    p.append('</svg>')
    return "".join(p)


def svg_nucleo():
    """Célula com núcleo ao lado da bactéria, de material genético solto."""
    return ('<svg viewBox="0 0 480 140" role="img" aria-label="A célula de um protozoário, '
      'fungo ou alga tem núcleo; a bactéria tem o material genético espalhado no citoplasma">'
      '<ellipse class="bolha" cx="120" cy="60" rx="90" ry="44"/>'
      '<circle class="marca" cx="120" cy="60" r="16"/>'
      '<ellipse class="bolha on" cx="360" cy="60" rx="90" ry="44"/>'
      '<path class="rot" d="M310 52c10-10 18 10 28 0s18 10 28 0M330 72c8-8 16 8 24 0s16 8 24 0"'
      ' style="stroke:var(--materia)"/>'
      '<text class="forte" x="120" y="126" text-anchor="middle">com núcleo</text>'
      '<text class="forte" x="360" y="126" text-anchor="middle">bactéria: sem núcleo</text>'
      '</svg>')


def svg_ciclo():
    """Produtor, consumidor, decompositor e os nutrientes voltando."""
    css = "".join('#fgCic[data-estado="%s"] .c%d{fill:var(--materia);opacity:.28}' % (e, i + 1)
                  for i, e in enumerate(("produtor", "consumidor", "decompositor")))
    p = ['<svg id="fgCic" data-estado="produtor" viewBox="0 0 480 150" role="img" '
         'aria-label="O produtor faz o alimento, o consumidor come, o decompositor recicla '
         'os restos e os nutrientes voltam ao produtor"><style>%s</style>' % css]
    for i, (nome, oque) in enumerate((("produtor", "faz o alimento"), ("consumidor", "come outro ser"),
                                      ("decompositor", "recicla os restos"))):
        x = 10 + i * 162
        p.append('<rect class="z c%d" x="%d" y="20" width="138" height="62" rx="14"/>' % (i + 1, x))
        p.append('<rect class="bolha" x="%d" y="20" width="138" height="62" rx="14" fill="none"/>' % x)
        p.append('<text class="forte" x="%d" y="48" text-anchor="middle">%s</text>' % (x + 69, nome))
        p.append('<text class="fraca" x="%d" y="68" text-anchor="middle">%s</text>' % (x + 69, oque))
        if i < 2:
            p.append('<path class="rot" d="M%d 51h20"/><path class="rot" d="m%d 45 6 6-6 6"/>'
                     % (x + 140, x + 154))
    p.append('<path class="rot" d="M403 84v24H79V88"/><path class="rot" d="m73 94 6-8 6 8"/>'
             '<text class="fraca" x="240" y="128" text-anchor="middle">'
             'os nutrientes voltam para o solo</text></svg>')
    return "".join(p)


P = []

P.append(dict(missao="celula", titulo="Tudo que vive é feito de células",
  ideia="O que <b>todo</b> ser vivo tem em comum é ser formado por <b>células</b>, "
        "a menor parte viva de um organismo.",
  fig=svg_celulas(), legenda="A célula vegetal tem duas coisas a mais que a animal.",
  maq=dict(eixos=[[("vegetal", "célula vegetal"), ("animal", "célula animal")],
                  [("parede", "parede celular"), ("cloro", "cloroplastos"), ("nucleo", "núcleo"),
                   ("cito", "citoplasma")]],
    saidas={"vegetal|nucleo": "tem núcleo", "vegetal|cito": "tem citoplasma",
            "vegetal|parede": "tem parede", "vegetal|cloro": "tem cloroplastos",
            "animal|nucleo": "tem núcleo", "animal|cito": "tem citoplasma",
            "animal|parede": "<s>sem parede</s>", "animal|cloro": "<s>sem cloroplastos</s>"},
    notas={"vegetal|nucleo": "O núcleo <b>controla</b> a célula.",
           "vegetal|cito": "No citoplasma ocorrem <b>várias funções</b>.",
           "vegetal|parede": "A parede dá <b>sustentação</b>.",
           "vegetal|cloro": "Os cloroplastos <b>produzem o alimento</b>.",
           "animal|nucleo": "Nas duas células o núcleo controla tudo.",
           "animal|cito": "As duas têm citoplasma.",
           "animal|parede": "Parede celular é só da <b>vegetal</b>.",
           "animal|cloro": "Cloroplasto é só da <b>vegetal</b>."},
    ident="fgCel", cap="Escolha a célula e a parte."),
  alerta="“Núcleo e citoplasma” não é o que todos têm em comum: a <b>bactéria não tem "
         "núcleo</b>. O que é de todos é a <b>célula</b>.",
  quiz=dict(p="Todos os seres vivos têm algo em comum. O quê?",
    o=[("São formados por células", True), ("Todos têm núcleo", False),
       ("Todos fazem fotossíntese", False), ("Todos têm parede celular", False)],
    r="A célula é a unidade de todo ser vivo.")))

P.append(dict(missao="unimulti", titulo="Uma célula só, ou muitas",
  ideia="<b>Unicelular</b> tem uma única célula, que faz todas as funções. "
        "<b>Multicelular</b> tem muitas, e cada uma tem um trabalho.",
  revs=[("Paramécio", "unicelular"), ("Bactéria", "unicelular"), ("Levedura", "unicelular"),
        ("Cogumelo", "multicelular"), ("Camelo", "multicelular"), ("Arbusto", "multicelular")],
  revs_cap="Pense, e toque para conferir.", revs_oculto="uni ou multi?",
  alerta="Se dá para ver <b>sem microscópio</b>, é multicelular — o cogumelo e o bolor "
         "também.",
  quiz=dict(p="Por que os unicelulares são chamados de microrganismos?",
    o=[("Só podem ser vistos com microscópio", True), ("Vivem só no mar", False),
       ("Têm muitas células pequenas", False), ("Todos causam doenças", False)],
    r="Micro quer dizer muito pequeno.")))

P.append(dict(missao="microscopio", titulo="Dois microscópios",
  ideia="O microscópio <b>amplia a imagem</b>. Foi depois dele que os seres unicelulares "
        "foram descobertos.",
  fig=svg_microscopios(), legenda="O que muda é por onde a imagem passa e onde ela aparece.",
  maq=dict(eixos=[[("otico", "ótico"), ("eletronico", "eletrônico")]],
    saidas={"otico": "imagem no próprio aparelho", "eletronico": "imagem no computador"},
    notas={"otico": "A <b>luz</b> atravessa a amostra e passa pelas <b>lentes</b>.",
           "eletronico": "Mostra <b>ainda mais detalhes</b> — é o único que mostra os vírus."},
    ident="fgMic", cap="Toque um microscópio."),
  alerta="Escreve-se <b>ótico</b> ou <b>óptico</b>. “Opitico” não existe.",
  quiz=dict(p="Qual microscópio mostra a imagem num computador?",
    o=[("O eletrônico", True), ("O ótico", False), ("A lupa", False), ("Os dois", False)],
    r="O eletrônico, mais potente.")))

P.append(dict(missao="fungos", titulo="Fungo não é planta",
  ideia="Fungos são <b>heterótrofos</b>: não produzem o próprio alimento. Eles absorvem a "
        "matéria orgânica do ambiente.",
  revs=[("Cogumelo", "multicelular, haste e chapéu"), ("Bolor", "multicelular, no pão"),
        ("Orelha-de-pau", "multicelular, nos troncos"), ("Levedura", "unicelular e redonda")],
  revs_cap="Os representantes do reino Fungi.", revs_oculto="como é?",
  alerta="Fungo <b>não faz fotossíntese</b>, nem quando é verde como o bolor, e "
         "<b>não tem flagelo</b>: ele se alastra pela superfície.",
  quiz=dict(p="Qual destas é uma característica dos fungos?",
    o=[("Não produzem o próprio alimento", True), ("Fazem fotossíntese", False),
       ("Têm flagelos para nadar", False), ("São sempre unicelulares", False)],
    r="Heterótrofos: dependem de outros seres para se alimentar.")))

P.append(dict(missao="fungos", titulo="Para que servem os fungos",
  ideia="Junto com as bactérias, os fungos são os principais <b>decompositores</b> do "
        "planeta. E também estão na cozinha e na farmácia.",
  maq=dict(eixos=[[("decompor", "na floresta"), ("queijo", "no queijo"), ("pao", "no pão e no vinho"),
                   ("remedio", "na farmácia"), ("doenca", "na pele")]],
    saidas={"decompor": "reciclam a matéria orgânica", "queijo": "dão gosto e aroma",
            "pao": "leveduras fazem a fermentação", "remedio": "alguns produzem antibióticos",
            "doenca": "causam micoses, como a frieira"},
    notas={"decompor": "A maioria é <b>saprófita</b>: come o que está se decompondo.",
           "queijo": "Alguns fungos entram na <b>fabricação</b> dos queijos.",
           "pao": "A <b>levedura</b> é o fermento: faz o pão crescer.",
           "remedio": "<b>Antibiótico</b> é remédio contra bactérias.",
           "doenca": "Esse é o lado <b>vilão</b> dos fungos."},
    cap="Toque um lugar onde há fungos."),
  quiz=dict(p="Todas são importâncias dos fungos, EXCETO:",
    o=[("Produzem alimento pela fotossíntese", True), ("Fazem a fermentação", False),
       ("Alguns produzem antibióticos", False), ("Decompõem a matéria orgânica", False)],
    r="Fungo não faz fotossíntese.")))

P.append(dict(missao="protozoarios", titulo="Como um protozoário se move",
  ideia="Protozoários são <b>unicelulares</b>, com núcleo, e se classificam pelo "
        "<b>jeito de se locomover</b>.",
  fig=svg_locomocao(), legenda="Quatro grupos, quatro jeitos.",
  maq=dict(eixos=[[("flagelados", "flagelados"), ("ciliados", "ciliados"),
                   ("rizopodes", "rizópodes"), ("esporozoarios", "esporozoários")]],
    saidas={"flagelados": "flagelo: o tripanossomo", "ciliados": "cílios: o paramécio",
            "rizopodes": "pseudópodes: a ameba", "esporozoarios": "não se locomovem"},
    notas={"flagelados": "<b>Flagelo</b> é longo e fino, como uma cauda.",
           "ciliados": "<b>Cílios</b> são curtos, como os cílios dos olhos.",
           "rizopodes": "<b>Pseudópodes</b> são falsos pés: o corpo se estende.",
           "esporozoarios": "Não têm <b>estrutura locomotora</b>."},
    ident="fgLoc", cap="Toque um grupo."),
  alerta="Atenção à escrita: <b>paramécio</b>, <b>ameba</b>, <b>flagelo</b>.",
  quiz=dict(p="Como a ameba se locomove?",
    o=[("Estendendo o corpo", True), ("Com cílios", False), ("Com flagelo", False),
       ("Ela não se move", False)],
    r="Pseudópodes: falsos pés.")))

P.append(dict(missao="algas", titulo="As algas que dão o oxigênio",
  ideia="As algas unicelulares formam o <b>fitoplâncton</b>, em mares, rios e lagos. Elas "
        "têm clorofila e fazem fotossíntese — mas <b>não são plantas</b>.",
  fig=svg_oxigenio(), legenda="Não são as árvores: é o fitoplâncton.",
  revs=[("Diatomáceas", "parede rígida em duas partes"), ("Dinoflagelados", "dois flagelos"),
        ("Euglenas", "flexíveis, sem parede rígida"), ("Algas douradas", "água doce, cor dourada")],
  revs_cap="Toque cada alga do fitoplâncton.", revs_oculto="o que tem?",
  alerta="Quando os dinoflagelados se multiplicam muito rápido vem a <b>maré vermelha</b>. "
         "Alguns ainda produzem luz: é a <b>bioluminescência</b>.",
  quiz=dict(p="Que parte do oxigênio do planeta vem do fitoplâncton?",
    o=[("Cerca de 4/5", True), ("Cerca de 1/10", False), ("Quase nada", False),
       ("Só metade", False)],
    r="Quatro de cada cinco partes.")))

P.append(dict(missao="bacterias", titulo="Os formatos das bactérias",
  ideia="Bactérias são <b>unicelulares</b> e vivem em todos os lugares, do gelo ao calor — "
        "até no nosso intestino. Elas se dividem pelo <b>formato</b>.",
  fig=svg_bacterias(), legenda="Os quatro formatos da página 86.",
  maq=dict(eixos=[[("coco", "coco"), ("bacilo", "bacilo"), ("espirilo", "espirilo"),
                   ("vibriao", "vibrião")]],
    saidas={"coco": "bola", "bacilo": "bastão", "espirilo": "espiral", "vibriao": "vírgula"},
    notas={"coco": "Os cocos são os que mais vivem <b>em grupo</b>.",
           "bacilo": "Bacilo lembra um <b>bastão</b>.",
           "espirilo": "Espirilo lembra uma <b>mola</b>.",
           "vibriao": "Vibrião lembra uma <b>vírgula</b>."},
    ident="fgBac", cap="Toque um formato."),
  quiz=dict(p="Que bactéria tem formato de vírgula?",
    o=[("Vibrião", True), ("Coco", False), ("Bacilo", False), ("Espirilo", False)],
    r="O vibrião.")))

P.append(dict(missao="bacterias", titulo="A célula sem núcleo",
  ideia="Protozoários, fungos e algas têm <b>núcleo</b>. A bactéria não: o material "
        "genético dela fica <b>espalhado no citoplasma</b>.",
  fig=svg_nucleo(), legenda="É assim que se reconhece uma bactéria.",
  alerta="A maioria das bactérias tem uma <b>cápsula protetora</b>, e muitas se movem "
         "com <b>flagelo</b>; algumas usam cílios.",
  quiz=dict(p="Unicelular, com material genético espalhado no interior. Quem é?",
    o=[("Uma bactéria", True), ("Um vírus", False), ("Um fungo", False), ("Uma alga", False)],
    r="Sem núcleo, material genético solto: bactéria.")))

P.append(dict(missao="virus", titulo="O vírus é diferente de todos",
  ideia="O vírus <b>não é formado por células</b>. Por isso muitos cientistas não o "
        "classificam como ser vivo.",
  revs=[("Tem células?", "Não."), ("Multiplica-se sozinho?", "Não: só dentro de células."),
        ("Fora das células?", "Fica inativo, desligado."),
        ("Que microscópio mostra?", "Só o eletrônico."),
        ("Vírus de planta pega em animal?", "Não: o vírus é seletivo."),
        ("O que a maioria faz?", "Causa doenças.")],
  revs_cap="Toque cada pergunta.", revs_oculto="resposta",
  quiz=dict(p="Qual é verdadeira sobre os vírus?",
    o=[("Só se multiplicam usando células", True), ("São seres unicelulares", False),
       ("Aparecem em qualquer microscópio", False), ("Multiplicam-se em qualquer lugar", False)],
    r="Sem células de outro ser, o vírus não faz nada.")))

P.append(dict(missao="natureza", titulo="Os recicladores da natureza",
  ideia="Os microrganismos estão em <b>todos os níveis</b> da cadeia alimentar. Os "
        "decompositores — quase todos fungos e bactérias — <b>reciclam os restos</b>.",
  fig=svg_ciclo(), legenda="Sem decompositor, o ciclo não fecha.",
  maq=dict(eixos=[[("produtor", "produtor"), ("consumidor", "consumidor"),
                   ("decompositor", "decompositor")]],
    saidas={"produtor": "as algas", "consumidor": "o peixe que come fitoplâncton",
            "decompositor": "os cogumelos do tronco caído"},
    notas={"produtor": "Fazem o alimento e liberam <b>oxigênio</b>.",
           "consumidor": "Come <b>outros seres</b>.",
           "decompositor": "O tronco se desfaz: é a <b>decomposição</b>."},
    ident="fgCic", cap="Toque um elo da cadeia."),
  alerta="Se os microrganismos sumissem, os <b>restos de seres mortos se acumulariam</b>: "
         "não haveria decomposição.",
  quiz=dict(p="Um tronco cheio de cogumelos está se desfazendo. Que processo é esse?",
    o=[("Decomposição", True), ("Fotossíntese", False), ("Fermentação", False),
       ("Maré vermelha", False)],
    r="Os cogumelos decompõem o tronco.")))

P.append(dict(missao="natureza", titulo="Ajudar ou atrapalhar",
  ideia="Os microrganismos vivem em <b>relações</b> com outros seres, e isso mantém o "
        "equilíbrio da natureza.",
  revs=[("Simbiose", "dois seres se ajudam"),
        ("Fungo na raiz do feijão", "leva ferro do solo para a semente"),
        ("Parasitismo", "um vive do outro"),
        ("Tripanossomo no barbeiro", "parasitismo, também uma relação")],
  revs_cap="Toque cada relação.", revs_oculto="o que é?",
  quiz=dict(p="O que é simbiose?",
    o=[("Dois seres vivos que se ajudam", True), ("Um ser que prejudica outro", False),
       ("Um fungo que faz fotossíntese", False), ("A morte de um ser vivo", False)],
    r="Os dois se auxiliam.")))

P.append(dict(missao="saude", titulo="Quem causa cada doença",
  ideia="Microrganismos podem ser <b>vilões</b>: alguns fungos, protozoários, bactérias e "
        "a maioria dos vírus causam doenças. Saber quem causa ajuda a prevenir.",
  maq=dict(eixos=[[("micose", "micose"), ("chagas", "doença de Chagas"),
                   ("toxo", "toxoplasmose"), ("giardia", "giardíase")]],
    saidas={"micose": "fungo", "chagas": "protozoário: Trypanosoma cruzi",
            "toxo": "protozoário: Toxoplasma gondii", "giardia": "protozoário flagelado"},
    notas={"micose": "Frieira e sapinho também são de <b>fungos</b>.",
           "chagas": "Transmitida pelo inseto <b>barbeiro</b>.",
           "toxo": "Evite <b>carne crua</b>; lave verduras e frutas.",
           "giardia": "Previne-se com <b>saneamento</b> e higiene pessoal."},
    cap="Toque uma doença."),
  alerta="“Infecção parasitária” não é o nome do protozoário. Na doença de Chagas, o "
         "protozoário é o <b>Trypanosoma cruzi</b>.",
  quiz=dict(p="Por que lavar as mãos antes de comer?",
    o=[("Para tirar microrganismos que não vemos", True),
       ("Porque a água tem vitaminas", False), ("Para a comida ficar mais gostosa", False),
       ("Para matar as algas das mãos", False)],
    r="Há microrganismos invisíveis, e alguns causam doenças.")))

montar("microscopico", P)
