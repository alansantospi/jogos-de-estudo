# -*- coding: utf-8 -*-
"""Os passos da lição de Inglês — Eating Out (livro, pp. 50-62).

A maquinaria está em licao.py. Os passos miram onde a Anne errou no livro:
A e AN trocados, "How much is the onion rings", $91.79 lido como "ninety
dollars", e "apple" no lugar de "apple pie".
"""
import os, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from licao import montar


def svg_cardapio():
    """As quatro partes do cardápio; acende a que estiver escolhida."""
    partes = (("sandwiches", "Sandwiches", "sanduíches"),
              ("sides", "Side orders", "acompanhamentos"),
              ("beverages", "Beverages", "bebidas"),
              ("desserts", "Desserts", "sobremesas"))
    css = "".join('#fgMenu[data-estado="%s"] .c%d{fill:var(--materia);opacity:.28}'
                  % (e, i + 1) for i, (e, _, _) in enumerate(partes))
    p = ['<svg id="fgMenu" data-estado="sandwiches" viewBox="0 0 480 150" role="img" '
         'aria-label="O cardápio em quatro partes: sandwiches, side orders, beverages '
         'e desserts"><style>%s</style>' % css]
    for i, (_, nome, pt) in enumerate(partes):
        x = 10 + (i % 2) * 235
        y = 12 + (i // 2) * 68
        p.append('<rect class="z c%d" x="%d" y="%d" width="225" height="58" rx="12"/>'
                 % (i + 1, x, y))
        p.append('<rect class="bolha" x="%d" y="%d" width="225" height="58" rx="12" '
                 'fill="none"/>' % (x, y))
        p.append('<text class="forte" x="%d" y="%d" text-anchor="middle">%s</text>'
                 % (x + 112, y + 26, nome))
        p.append('<text class="fraca" x="%d" y="%d" text-anchor="middle">%s</text>'
                 % (x + 112, y + 45, pt))
    p.append('</svg>')
    return "".join(p)


def svg_artigo():
    """A antes de som de consoante, AN antes de som de vogal."""
    return ('<svg id="fgArt" data-estado="hotdog" viewBox="0 0 480 140" role="img" '
      'aria-label="A antes de som de consoante, como a hot dog; AN antes de som de '
      'vogal, como an apple pie">'
      '<style>%s{fill:var(--materia);opacity:.28}</style>'
      % ",".join(['#fgArt[data-estado="%s"] .za' % e for e in ("hotdog", "soda", "cake")]
                 + ['#fgArt[data-estado="%s"] .zn' % e for e in ("apple", "orange", "ice")]) +
      '<rect class="z za" x="10" y="14" width="220" height="96" rx="14"/>'
      '<rect class="z zn" x="250" y="14" width="220" height="96" rx="14"/>'
      '<text class="forte" x="120" y="44" text-anchor="middle">A</text>'
      '<text x="120" y="68" text-anchor="middle">a hot dog</text>'
      '<text x="120" y="90" text-anchor="middle">a smoothie</text>'
      '<text class="forte" x="360" y="44" text-anchor="middle">AN</text>'
      '<text x="360" y="68" text-anchor="middle">an apple pie</text>'
      '<text x="360" y="90" text-anchor="middle">an orange juice</text>'
      '<text class="fraca" x="120" y="130" text-anchor="middle">som de consoante</text>'
      '<text class="fraca" x="360" y="130" text-anchor="middle">som de vogal: a e i o u</text>'
      '</svg>')


def svg_quantos():
    """Um prato só pede IS; vários pedem ARE."""
    return ('<svg id="fgQtd" data-estado="um" viewBox="0 0 480 140" role="img" '
      'aria-label="Um só: How much is it? It\'s. Vários: How much are they? They\'re">'
      '<style>#fgQtd[data-estado="um"] .zu,#fgQtd[data-estado="um2"] .zu,'
      '#fgQtd[data-estado="varios"] .zv,#fgQtd[data-estado="varios2"] .zv'
      '{fill:var(--materia);opacity:.28}</style>'
      '<rect class="z zu" x="10" y="14" width="220" height="100" rx="14"/>'
      '<rect class="z zv" x="250" y="14" width="220" height="100" rx="14"/>'
      '<circle class="rot" cx="120" cy="46" r="14"/>'
      '<circle class="rot" cx="326" cy="46" r="12"/><circle class="rot" cx="360" cy="46" r="12"/>'
      '<circle class="rot" cx="394" cy="46" r="12"/>'
      '<text class="forte" x="120" y="84" text-anchor="middle">is → It\'s</text>'
      '<text class="fraca" x="120" y="104" text-anchor="middle">the hot dog</text>'
      '<text class="forte" x="360" y="84" text-anchor="middle">are → They\'re</text>'
      '<text class="fraca" x="360" y="104" text-anchor="middle">the onion rings</text>'
      '<text class="fraca" x="240" y="134" text-anchor="middle">'
      'a pergunta e a resposta combinam</text></svg>')


def svg_preco():
    """Um preço se lê em duas partes: os dólares e os centavos."""
    return ('<svg viewBox="0 0 480 130" role="img" '
      'aria-label="91 ponto 79: ninety-one dollars and seventy-nine cents">'
      '<text class="forte" x="240" y="34" text-anchor="middle" style="font-size:26px">'
      '$91.79</text>'
      '<path class="rot" d="M222 44 130 70"/><path class="rot" d="M262 44 350 70"/>'
      '<rect class="bolha on" x="20" y="72" width="220" height="44" rx="12"/>'
      '<rect class="bolha" x="250" y="72" width="210" height="44" rx="12"/>'
      '<text class="forte" x="130" y="99" text-anchor="middle">ninety-one dollars</text>'
      '<text class="forte" x="355" y="99" text-anchor="middle">seventy-nine cents</text>'
      '</svg>')


def svg_conversa():
    """Quem fala o quê, de um lado e do outro do balcão."""
    falas = (("g", "How can I help you?"), ("c", "I'd like a hot dog, please."),
             ("g", "Here you are."), ("c", "How much is it?"),
             ("g", "It's one dollar and eighty-two cents."), ("c", "OK. Here it is."))
    p = ['<svg viewBox="0 0 480 252" role="img" aria-label="O diálogo no restaurante, '
         'alternando garçom e cliente">']
    for i, (quem, txt) in enumerate(falas):
        y = 8 + i * 37
        x = 10 if quem == "g" else 130
        p.append('<rect class="bolha%s" x="%d" y="%d" width="340" height="30" rx="12"/>'
                 % (" on" if quem == "g" else "", x, y))
        p.append('<text x="%d" y="%d">%s</text>' % (x + 14, y + 20, txt))
    p.append('<text class="fraca" x="240" y="246" text-anchor="middle">'
             'à esquerda o garçom, à direita o cliente</text></svg>')
    return "".join(p)


def svg_voz():
    """A voz sobe no sim-ou-não e desce nas perguntas com How, Where, What."""
    return ('<svg id="fgVoz" data-estado="sobe" viewBox="0 0 480 130" role="img" '
      'aria-label="Pergunta de sim ou não: a voz sobe. Pergunta com How, Where ou What: '
      'a voz desce">'
      '<style>#fgVoz[data-estado="sobe"] .zs,#fgVoz[data-estado="sobe2"] .zs,'
      '#fgVoz[data-estado="desce"] .zd,#fgVoz[data-estado="desce2"] .zd'
      '{fill:var(--materia);opacity:.28}</style>'
      '<rect class="z zs" x="10" y="10" width="220" height="90" rx="14"/>'
      '<rect class="z zd" x="250" y="10" width="220" height="90" rx="14"/>'
      '<path class="rot" d="M40 70c40 0 90 0 130-36"/><path class="rot" d="m160 32 12 0 -2 12"/>'
      '<path class="rot" d="M280 34c40 0 90 0 130 36"/><path class="rot" d="m398 72 12 0 -2-12"/>'
      '<text class="forte" x="120" y="92" text-anchor="middle">sobe ↗</text>'
      '<text class="forte" x="360" y="92" text-anchor="middle">desce ↘</text>'
      '<text class="fraca" x="120" y="122" text-anchor="middle">Are we in Hamburg?</text>'
      '<text class="fraca" x="360" y="122" text-anchor="middle">How much is it?</text>'
      '</svg>')


P = []

P.append(dict(missao="comidas", titulo="Um cardápio em quatro partes",
  ideia="O cardápio (<b>menu</b>) separa a comida em partes. Saber o nome da parte "
        "já diz o que tem dentro.",
  fig=svg_cardapio(), legenda="O cardápio da página 50, por partes.",
  maq=dict(eixos=[[("sandwiches", "Sandwiches"), ("sides", "Side orders"),
                   ("beverages", "Beverages"), ("desserts", "Desserts")]],
    saidas={"sandwiches": "cheeseburger, hamburger, hot dog",
            "sides": "French fries, onion rings, salad",
            "beverages": "orange juice, smoothie, soda",
            "desserts": "apple pie, chocolate cake, ice cream"},
    notas={"sandwiches": "<b>Sanduíches</b>: o prato principal.",
           "sides": "<b>Acompanhamentos</b>: vêm ao lado do sanduíche.",
           "beverages": "<b>Bebidas</b>.",
           "desserts": "<b>Sobremesas</b>: o que se come no fim."},
    ident="fgMenu", cap="Toque uma parte do cardápio."),
  quiz=dict(p="No cardápio, “Beverages” são:",
    o=[("As bebidas", True), ("As sobremesas", False), ("Os sanduíches", False),
       ("Os acompanhamentos", False)],
    r="Beverages = bebidas: orange juice, smoothie, soda.")))

P.append(dict(missao="comidas", titulo="Sanduíches e acompanhamentos",
  ideia="Muitos nomes se montam com <b>pedaços que você já conhece</b>: "
        "cheese é queijo, onion é cebola, rings são anéis.",
  revs=[("Hot dog", "cachorro-quente"), ("Hamburger", "hambúrguer"),
        ("Cheeseburger", "hambúrguer com queijo"), ("French fries", "batata frita"),
        ("Onion rings", "anéis de cebola"), ("Salad", "salada")],
  revs_cap="Toque cada comida para ver o que ela é.", revs_oculto="o que é?",
  alerta="Atenção à escrita: <b>cheeseburger</b> tem dois <b>e</b> no começo — "
         "<b>chee</b>se.",
  quiz=dict(p="O que o cheeseburger tem a mais que o hamburger?",
    o=[("Queijo", True), ("Cebola", False), ("Salsicha", False), ("Batata", False)],
    r="Cheese = queijo.")))

P.append(dict(missao="bebidas", titulo="O que tem para beber",
  ideia="<b>Juice</b> é suco: o que vem antes diz de quê. "
        "Orange juice é de laranja, lemon juice é de limão.",
  revs=[("Orange juice", "suco de laranja"), ("Lemon juice", "suco de limão"),
        ("Smoothie", "vitamina batida"), ("Soda", "refrigerante")],
  revs_cap="Toque cada bebida.", revs_oculto="o que é?",
  alerta="<b>Soda</b> não é soda limonada: em inglês é qualquer <b>refrigerante</b>.",
  quiz=dict(p="Qual destas é uma bebida?",
    o=[("Smoothie", True), ("Apple pie", False), ("Onion rings", False),
       ("Hot dog", False)],
    r="Smoothie é a vitamina batida.")))

P.append(dict(missao="sobremesas", titulo="A sobremesa tem nome inteiro",
  ideia="Nas sobremesas, a primeira palavra diz <b>o sabor</b> e a segunda diz "
        "<b>o que é</b>: apple <b>pie</b>, chocolate <b>cake</b>.",
  maq=dict(eixos=[[("apple", "apple"), ("chocolate", "chocolate"),
                   ("strawberry", "strawberry")],
                  [("pie", "pie"), ("cake", "cake"), ("ice", "ice cream")]],
    saidas={"apple|pie": "torta de maçã", "apple|cake": "bolo de maçã",
            "apple|ice": "sorvete de maçã",
            "chocolate|pie": "torta de chocolate", "chocolate|cake": "bolo de chocolate",
            "chocolate|ice": "sorvete de chocolate",
            "strawberry|pie": "torta de morango", "strawberry|cake": "bolo de morango",
            "strawberry|ice": "sorvete de morango"},
    notas={"apple": "Apple = <b>maçã</b>.", "chocolate": "Chocolate = <b>chocolate</b>.",
           "strawberry": "Strawberry = <b>morango</b>."},
    cap="Escolha o sabor e o tipo."),
  alerta="Só <b>apple</b> é maçã, a fruta. A sobremesa do cardápio é "
         "<b>apple pie</b> — sem o pie, ela não está no cardápio.",
  quiz=dict(p="Como se pede a torta de maçã do cardápio?",
    o=[("Apple pie", True), ("Apple", False), ("Apple cake", False), ("Pie apple", False)],
    r="Primeiro o sabor, depois o que é: apple pie.")))

P.append(dict(missao="artigos", titulo="A ou AN: escute o começo",
  ideia="Antes de <b>som de vogal</b> (a, e, i, o, u) se usa <b>AN</b>. "
        "Antes de som de consoante, <b>A</b>.",
  fig=svg_artigo(), legenda="Quem decide é o som do começo da palavra que vem depois.",
  maq=dict(eixos=[[("hotdog", "hot dog"), ("apple", "apple pie"), ("soda", "soda"),
                   ("orange", "orange juice"), ("ice", "ice cream"),
                   ("cake", "chocolate cake")]],
    saidas={"hotdog": "a hot dog", "apple": "an apple pie", "soda": "a soda",
            "orange": "an orange juice", "ice": "an ice cream",
            "cake": "a chocolate cake"},
    notas={"hotdog": "<b>h</b> é consoante: <b>A</b>.",
           "apple": "<b>a</b>pple começa com vogal: <b>AN</b>.",
           "soda": "<b>s</b> é consoante: <b>A</b>.",
           "orange": "<b>o</b>range começa com vogal: <b>AN</b>.",
           "ice": "<b>i</b>ce começa com vogal: <b>AN</b>.",
           "cake": "Quem conta é <b>ch</b>ocolate, a primeira palavra: <b>A</b>."},
    ident="fgArt", cap="Toque uma comida."),
  quiz=dict(p="Qual está certo?",
    o=[("an orange juice", True), ("a orange juice", False), ("an soda", False),
       ("an hot dog", False)],
    r="Orange começa com vogal: an.")))

P.append(dict(missao="artigos", titulo="A palavra que vem logo depois",
  ideia="O A ou AN olha <b>só para a palavra seguinte</b>. Em "
        "<b>an apple juice</b>, quem manda é apple, não juice.",
  revs=[("___ smoothie", "a smoothie"), ("___ apple juice", "an apple juice"),
        ("___ chocolate cake", "a chocolate cake"), ("___ ice cream", "an ice cream"),
        ("___ cheeseburger", "a cheeseburger")],
  revs_cap="Pense na resposta, depois toque para conferir.", revs_oculto="a ou an?",
  alerta="Na página 53 quase todas vão com <b>A</b>. Só duas pedem AN: "
         "<b>apple pie</b> e <b>orange juice</b>.",
  quiz=dict(p="I'd like ___ ice cream, please.",
    o=[("an", True), ("a", False), ("the two", False), ("is", False)],
    r="Ice começa com vogal: an ice cream.")))

P.append(dict(missao="preco", titulo="How much is ou How much are?",
  ideia="Uma coisa só: <b>How much is...? It's...</b> "
        "Mais de uma: <b>How much are...? They're...</b>",
  fig=svg_quantos(), legenda="Contar quantas são vem antes de escolher a palavra.",
  maq=dict(eixos=[[("um", "the hot dog"), ("varios", "the onion rings"),
                   ("um2", "the apple pie"), ("varios2", "the smoothies")]],
    saidas={"um": "How much is the hot dog? It's $5.50.",
            "varios": "How much are the onion rings? They're $2.45.",
            "um2": "How much is the apple pie? It's $3.15.",
            "varios2": "How much are the smoothies? They're $2.30."},
    notas={"um": "Um só: <b>is</b> e <b>It's</b>.",
           "varios": "Rings termina em <b>s</b>: são vários. <b>are</b> e <b>They're</b>.",
           "um2": "Uma torta: <b>is</b> e <b>It's</b>.",
           "varios2": "Smoothie<b>s</b>: vários. <b>are</b> e <b>They're</b>."},
    ident="fgQtd", cap="Toque um pedido."),
  alerta="<b>Onion rings</b> parece um prato só, mas são vários anéis: "
         "<b>How much are the onion rings? They're...</b>",
  quiz=dict(p="How much ___ the onion rings?",
    o=[("are", True), ("is", False), ("it's", False), ("am", False)],
    r="Onion rings está no plural: are.")))

P.append(dict(missao="numeros", titulo="As dezenas até cem",
  ideia="As dezenas terminam em <b>-ty</b>. Os números de 13 a 19 terminam "
        "em <b>-teen</b> — e é aí que mora a confusão.",
  maq=dict(eixos=[[("70", "70"), ("80", "80"), ("90", "90"), ("100", "100")]],
    saidas={"70": "seventy", "80": "eighty", "90": "ninety", "100": "a hundred"},
    notas={"70": "Cuidado: seven<b>teen</b> é 17.",
           "80": "Cuidado: eigh<b>teen</b> é 18.",
           "90": "Cuidado: nine<b>teen</b> é 19.",
           "100": "Também se diz <b>one hundred</b>."},
    cap="Toque uma dezena."),
  alerta="Entre as dezenas e as unidades vai um <b>tracinho</b>: "
         "ninety-one, seventy-nine, eighty-five.",
  quiz=dict(p="Como se escreve 90?",
    o=[("ninety", True), ("nineteen", False), ("nine", False), ("ninty", False)],
    r="90 = ninety; 19 = nineteen.")))

P.append(dict(missao="numeros", titulo="Um preço, duas partes",
  ideia="O preço se lê assim: <b>os dólares</b>, depois <b>and</b>, "
        "depois <b>os centavos</b>.",
  fig=svg_preco(), legenda="O ponto separa os dólares dos centavos.",
  revs=[("$5.70", "five dollars and seventy cents"),
        ("$1.75", "one dollar and seventy-five cents"),
        ("$82.85", "eighty-two dollars and eighty-five cents"),
        ("$100.99", "a hundred dollars and ninety-nine cents")],
  revs_cap="Leia em voz alta, depois toque para conferir.", revs_oculto="como se lê?",
  alerta="Não pare na dezena: <b>$91.79</b> é <b>ninety-one</b> dollars, "
         "não “ninety dollars”. E os centavos também entram.",
  quiz=dict(p="Como se lê $91.79?",
    o=[("ninety-one dollars and seventy-nine cents", True),
       ("ninety dollars and seventy-nine cents", False),
       ("nineteen dollars and seventy-nine cents", False),
       ("ninety-one dollars", False)],
    r="91 = ninety-one; 79 = seventy-nine.")))

P.append(dict(missao="pedido", titulo="A conversa no balcão",
  ideia="Pedir tem uma ordem: o garçom <b>oferece ajuda</b>, você <b>pede</b>, "
        "ele <b>entrega</b>, você <b>pergunta o preço</b> e <b>paga</b>.",
  fig=svg_conversa(), legenda="O diálogo da página 62, já em ordem.",
  revs=[("How can I help you?", "Como posso ajudar?"),
        ("I'd like..., please.", "Eu gostaria de..., por favor."),
        ("Here you are.", "Aqui está (o garçom entrega)."),
        ("Here it is.", "Aqui está (o cliente paga)."),
        ("Have a nice day!", "Tenha um bom dia!")],
  revs_cap="Toque cada frase.", revs_oculto="o que quer dizer?",
  alerta="Cada fala aparece <b>uma vez</b>. Ao numerar o diálogo, nenhum número "
         "se repete.",
  quiz=dict(p="O garçom entrega o hot dog. O que ele diz?",
    o=[("Here you are.", True), ("How much is it?", False),
       ("I'd like a hot dog, please.", False), ("OK. Here it is. Thanks.", False)],
    r="Here you are: aqui está.")))

P.append(dict(missao="cardapio", titulo="Ler o cardápio do Rubi's Diner",
  ideia="Um cardápio traz <b>o nome do restaurante</b>, <b>os pratos</b> e "
        "<b>os preços</b>. Não traz informação nutricional nem opinião.",
  maq=dict(eixos=[[("food", "Food"), ("bev", "Beverages"), ("des", "Desserts")]],
    saidas={"food": "hamburger $2.35 · cheeseburger $3.95 · salad $4.99",
            "bev": "orange juice $2.73 · lemon juice $2.83 · soda $1.99",
            "des": "strawberry ice cream $3.83 · apple pie $4.65 · chocolate cake $5.15"},
    notas={"food": "Seis comidas; a mais cara é a <b>salad</b>.",
           "bev": "Há suco de laranja <b>e</b> de limão.",
           "des": "<b>Três</b> opções de sobremesa — e nenhuma torta de limão."},
    cap="Toque uma parte do Kids' Menu."),
  alerta="Embaixo está escrito <b>All kids' meals come with a drink</b>: "
         "quem compra a refeição ganha a bebida.",
  quiz=dict(p="“All kids' meals come with a drink” quer dizer:",
    o=[("A refeição infantil já vem com bebida", True),
       ("Criança não pode pedir bebida", False),
       ("A bebida é vendida à parte", False),
       ("Só adultos ganham bebida", False)],
    r="Come with = vem com.")))

P.append(dict(missao="historia", titulo="De Hamburg para St. Louis",
  ideia="No quadrinho, Noah e Joanna descobrem que <b>Hamburg</b> é uma cidade "
        "da Alemanha — mas eles estão nos <b>EUA</b>, na feira de St. Louis, em 1904.",
  revs=[("Where's Hamburg?", "It's a city in Germany."),
        ("Are we in Hamburg?", "No. We're in the U.S."),
        ("What are these?", "Sandwich bags!"),
        ("Is that a sandwich?", "Yeah! My invention, a hamburger."),
        ("How much is it?", "For you, it's free, kids!")],
  revs_cap="Toque cada pergunta para ver a resposta do quadrinho.",
  revs_oculto="a resposta",
  alerta="Por que tantos diners parecem <b>vagão de trem</b>? Antigamente, "
         "alguns vagões eram usados como restaurante.",
  quiz=dict(p="Por que o hambúrguer saiu de graça para as crianças?",
    o=[("Elas devolveram os sacos perdidos do cozinheiro", True),
       ("Era o aniversário da Joanna", False),
       ("A feira dava comida para todos", False),
       ("Elas trabalhavam na lanchonete", False)],
    r="Excuse me, are these yours? — Oh, yes! Thank you! For you, it's free.")))

P.append(dict(missao="historia", titulo="A voz sobe ou desce",
  ideia="Pergunta de <b>sim ou não</b>: a voz <b>sobe</b> no fim. "
        "Pergunta com <b>How, Where, What</b>: a voz <b>desce</b>.",
  fig=svg_voz(), legenda="A entonação das perguntas do quadrinho, página 56.",
  maq=dict(eixos=[[("sobe", "Are we in Hamburg?"), ("sobe2", "Is that a sandwich?"),
                   ("desce", "Where's Hamburg?"), ("desce2", "How much is it?")]],
    saidas={"sobe": "sobe ↗", "sobe2": "sobe ↗", "desce": "desce ↘", "desce2": "desce ↘"},
    notas={"sobe": "A resposta é <b>sim ou não</b>: No, we're in the U.S.",
           "sobe2": "Resposta <b>sim ou não</b>: Yeah!",
           "desce": "Começa com <b>Where</b>: pede um lugar.",
           "desce2": "Começa com <b>How much</b>: pede um preço."},
    ident="fgVoz", cap="Toque uma pergunta."),
  quiz=dict(p="Em “What are these?”, a voz:",
    o=[("Desce no fim", True), ("Sobe no fim", False), ("Fica igual", False),
       ("Sobe no começo", False)],
    r="Começa com What: desce.")))

montar("restaurante", P)
