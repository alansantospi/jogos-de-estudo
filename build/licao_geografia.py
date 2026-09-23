# -*- coding: utf-8 -*-
"""Os dez passos da lição de Geografia. A maquinaria está em licao.py."""
import os, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from licao import montar, fig, maquina, revelar, checar


def svg_setores(ident):
    """Os três setores encadeados; acende o que o passo estiver tratando."""
    css = "".join(
        '#%s[data-estado="%s"] .c%d{fill:var(--materia);opacity:.28}'
        '#%s[data-estado="%s"] .r%d{fill:var(--texto);font-weight:800}'
        % (ident, e, i + 1, ident, e, i + 1)
        for i, e in enumerate(("primario", "secundario", "terciario")))
    caixas = (("primário", "tira da natureza"), ("secundário", "transforma"),
              ("terciário", "vende e serve"))
    p = ['<svg id="%s" data-estado="primario" viewBox="0 0 480 130" role="img" '
         'aria-label="Os três setores: o primário tira da natureza, o secundário '
         'transforma, o terciário vende e serve"><style>%s</style>' % (ident, css)]
    for i, (nome, oque) in enumerate(caixas):
        x = 10 + i * 162
        p.append('<rect class="z c%d" x="%d" y="30" width="138" height="62" rx="14"/>'
                 % (i + 1, x))
        p.append('<rect class="bolha" x="%d" y="30" width="138" height="62" rx="14" '
                 'fill="none"/>' % x)
        p.append('<text class="forte r%d" x="%d" y="58" text-anchor="middle">%s</text>'
                 % (i + 1, x + 69, nome))
        p.append('<text class="fraca" x="%d" y="78" text-anchor="middle">%s</text>'
                 % (x + 69, oque))
        if i < 2:
            p.append('<path class="rot" d="M%d 61h20"/><path class="rot" d="m%d 55 6 6-6 6"/>'
                     % (x + 140, x + 154))
    p.append('<text class="fraca" x="240" y="118" text-anchor="middle">'
             'o que um produz, o outro usa</text></svg>')
    return "".join(p)


def svg_pasto():
    """Pecuária extensiva e intensiva, lado a lado."""
    return ('<svg id="fgPasto" data-estado="extensiva" viewBox="0 0 480 140" role="img" '
      'aria-label="Pecuária extensiva no pasto aberto e intensiva no confinamento">'
      '<style>#fgPasto[data-estado="extensiva"] .ze,'
      '#fgPasto[data-estado="intensiva"] .zi{fill:var(--materia);opacity:.28}</style>'
      '<rect class="z ze" x="10" y="18" width="220" height="86" rx="14"/>'
      '<rect class="z zi" x="250" y="18" width="220" height="86" rx="14"/>'
      # pasto aberto: três animais espalhados
      '<path class="rot" d="M40 74h160"/>'
      '<circle class="rot" cx="65" cy="58" r="9"/><circle class="rot" cx="120" cy="62" r="9"/>'
      '<circle class="rot" cx="178" cy="56" r="9"/>'
      '<text class="fraca" x="120" y="96" text-anchor="middle">pasto aberto</text>'
      # confinamento: grade e animais juntos
      '<path class="rot" d="M280 44v40M300 44v40M320 44v40M340 44v40M360 44v40M380 44v40"/>'
      '<path class="rot" d="M272 44h116M272 84h116"/>'
      '<circle class="rot" cx="410" cy="58" r="8"/><circle class="rot" cx="432" cy="58" r="8"/>'
      '<circle class="rot" cx="421" cy="76" r="8"/>'
      '<text class="fraca" x="360" y="96" text-anchor="middle">confinamento</text>'
      '<text class="forte" x="120" y="128" text-anchor="middle">extensiva</text>'
      '<text class="forte" x="360" y="128" text-anchor="middle">intensiva</text>'
      '</svg>')


def svg_origem():
    """De onde vem cada extrativismo: da planta, do animal, do subsolo."""
    return ('<svg id="fgOrig" data-estado="vegetal" viewBox="0 0 480 140" role="img" '
      'aria-label="Extrativismo vegetal das plantas, animal dos animais, mineral do subsolo">'
      '<style>#fgOrig[data-estado="vegetal"] .z1,#fgOrig[data-estado="animal"] .z2,'
      '#fgOrig[data-estado="mineral"] .z3{fill:var(--materia);opacity:.28}</style>'
      '<rect class="z z1" x="10" y="14" width="146" height="86" rx="14"/>'
      '<rect class="z z2" x="167" y="14" width="146" height="86" rx="14"/>'
      '<rect class="z z3" x="324" y="14" width="146" height="86" rx="14"/>'
      # árvore
      '<path class="rot" d="M83 88V62"/><path class="rot" d="M83 62a18 18 0 1 1 .1 0"/>'
      # peixe
      '<path class="rot" d="M212 62c14-14 40-14 54 0-14 14-40 14-54 0z"/>'
      '<path class="rot" d="m266 62 14-10v20z"/>'
      # subsolo
      '<path class="rot" d="M340 58h124"/>'
      '<path class="rot" d="M356 80h20M392 76h22M428 84h16"/>'
      '<text class="fraca" x="83" y="118" text-anchor="middle">das plantas</text>'
      '<text class="fraca" x="240" y="118" text-anchor="middle">dos animais</text>'
      '<text class="fraca" x="397" y="118" text-anchor="middle">do solo e do subsolo</text>'
      '</svg>')


def svg_valor():
    """A agroindústria acrescentando valor à matéria-prima do campo."""
    return ('<svg viewBox="0 0 480 110" role="img" '
      'aria-label="O leite do campo passa pela indústria e vira queijo, com mais valor">'
      '<rect class="bolha" x="8" y="26" width="120" height="50" rx="12"/>'
      '<text class="forte" x="68" y="50" text-anchor="middle">leite</text>'
      '<text class="fraca" x="68" y="68" text-anchor="middle">do campo</text>'
      '<path class="rot" d="M136 51h38"/><path class="rot" d="m167 45 8 6-8 6"/>'
      '<rect class="bolha on" x="182" y="26" width="116" height="50" rx="12"/>'
      '<text class="forte" x="240" y="50" text-anchor="middle">indústria</text>'
      '<text class="fraca" x="240" y="68" text-anchor="middle">transforma</text>'
      '<path class="rot" d="M306 51h38"/><path class="rot" d="m337 45 8 6-8 6"/>'
      '<rect class="bolha" x="352" y="26" width="120" height="50" rx="12"/>'
      '<text class="forte" x="412" y="50" text-anchor="middle">queijo</text>'
      '<text class="fraca" x="412" y="68" text-anchor="middle">vale mais</text>'
      '<text class="fraca" x="240" y="100" text-anchor="middle">'
      'e dura mais, e viaja melhor</text></svg>')


P = []

P.append(dict(missao="atividades", titulo="O que move o campo e a cidade",
  ideia="Atividade econômica é <b>toda forma de trabalho</b> para produzir, "
        "distribuir e oferecer produtos e serviços.",
  fig=svg_setores("fgSet1"), legenda="Os três setores, na ordem em que o produto passa.",
  maq=dict(eixos=[[("primario","primário"), ("secundario","secundário"),
                   ("terciario","terciário")]],
    saidas={"primario":"agricultura, pecuária, pesca, extrativismo",
            "secundario":"indústria e construção",
            "terciario":"comércio e serviços"},
    notas={"primario":"Ligado <b>diretamente à natureza</b>.",
           "secundario":"<b>Transforma</b> as matérias-primas em novos produtos.",
           "terciario":"<b>Vende e atende</b> — é o maior setor do Brasil."},
    ident="fgSet1", cap="Toque um setor."),
  alerta="Os três estão <b>ligados</b>: o que um setor produz, o outro usa.",
  quiz=dict(p="Em quantos setores as atividades econômicas se organizam?",
    o=[("Três", True), ("Dois", False), ("Quatro", False), ("Cinco", False)],
    r="Primário, secundário e terciário.")))

P.append(dict(missao="primario", titulo="O que vem direto da natureza",
  ideia="O setor primário reúne o que é tirado <b>diretamente da natureza</b>.",
  revs=[("Agricultura","cultivar plantas"), ("Pecuária","criar animais"),
        ("Pesca","retirar peixes"), ("Extrativismo","retirar recursos naturais")],
  revs_cap="Toque cada atividade para ver o que ela faz.", revs_oculto="o que é?",
  alerta="Cuidado: <b>refinar petróleo não é</b> setor primário. Extrair é primário; "
         "refinar já é transformar, logo é secundário.",
  quiz=dict(p="Qual destas NÃO faz parte do setor primário?",
    o=[("Refino de petróleo", True), ("Agricultura de subsistência", False),
       ("Pesca comercial", False), ("Mineração de carvão", False)],
    r="Refinar é transformar: setor secundário.")))

P.append(dict(missao="secundario", titulo="Onde a matéria-prima vira produto",
  ideia="O setor secundário <b>transforma</b> matérias-primas em produtos novos — "
        "pela indústria e pela construção.",
  maq=dict(eixos=[[("leite","leite"), ("cana","cana"), ("madeira","madeira"),
                   ("tomate","tomate")]],
    saidas={"leite":"queijo e iogurte", "cana":"açúcar",
            "madeira":"móveis", "tomate":"molho"},
    notas={"leite":"A matéria-prima veio da <b>pecuária</b>.",
           "cana":"Veio da <b>agricultura</b>.",
           "madeira":"Veio do <b>extrativismo vegetal</b>.",
           "tomate":"Veio da <b>agricultura</b> — e virou outro produto."},
    cap="Toque uma matéria-prima e veja no que ela vira."),
  alerta="A <b>construção civil</b> também é setor secundário: ela transforma "
         "materiais em moradias, prédios, estradas e pontes.",
  quiz=dict(p="Que fator é associado aos problemas do setor secundário em países em desenvolvimento?",
    o=[("Escassez de mão de obra qualificada", True),
       ("Alta produtividade e tecnologia avançada", False),
       ("Eficiência na gestão dos recursos naturais", False),
       ("Redução das desigualdades de renda", False)],
    r="Faltar gente preparada trava a indústria.")))

P.append(dict(missao="terciario", titulo="Comércio e serviços",
  ideia="O setor terciário <b>vende</b> e <b>atende</b>: é ele que liga os outros "
        "dois setores às pessoas.",
  revs=[("Loja, feira, shopping","comércio"), ("Professor","serviço"),
        ("Médico","serviço"), ("Motorista","serviço"),
        ("Vendedor","comércio"), ("Banco, turismo","serviço")],
  revs_cap="Toque para ver se é comércio ou serviço.", revs_oculto="o que é?",
  alerta="O terciário é o <b>principal setor econômico do Brasil</b>.",
  quiz=dict(p="Qual é o principal setor econômico do Brasil?",
    o=[("Terciário", True), ("Primário", False), ("Secundário", False),
       ("Extrativismo", False)],
    r="O comércio e os serviços são o maior setor da economia brasileira.")))

P.append(dict(missao="agricultura", titulo="Da enxada à máquina",
  ideia="A agricultura pode ser <b>tradicional</b> ou <b>moderna</b> — muda a técnica, "
        "o tamanho e para quem se produz.",
  maq=dict(eixos=[[("tradicional","tradicional"), ("moderna","moderna")]],
    saidas={"tradicional":"técnicas simples, trabalho familiar",
            "moderna":"máquinas, tecnologia, grandes áreas"},
    notas={"tradicional":"Produz sobretudo para o <b>próprio consumo</b> — é a "
                         "agricultura de subsistência.",
           "moderna":"Produz em grande escala, voltada ao <b>comércio</b>."},
    cap="Toque um tipo de agricultura."),
  quiz=dict(p="A agricultura de subsistência produz principalmente para:",
    o=[("O consumo da própria família", True), ("A exportação", False),
       ("As grandes indústrias", False), ("Os supermercados das cidades", False)],
    r="Subsistência é sustentar quem produz.")))

P.append(dict(missao="pecuaria", titulo="Pasto aberto ou confinamento",
  ideia="Pecuária é a <b>criação de animais</b>, e ela se divide pelo espaço e pelo "
        "controle.",
  fig=svg_pasto(), legenda="Muito espaço e pouco controle, ou pouco espaço e muito controle.",
  maq=dict(eixos=[[("extensiva","extensiva"), ("intensiva","intensiva")]],
    saidas={"extensiva":"grandes áreas de pastagem",
            "intensiva":"espaços menores, com ração"},
    notas={"extensiva":"Os animais ficam soltos, com <b>menos controle</b>.",
           "intensiva":"Há confinamento, alimentação com ração e <b>mais controle</b>."},
    ident="fgPasto", cap="Toque um tipo de pecuária."),
  quiz=dict(p="Na pecuária intensiva, os animais:",
    o=[("Ficam em espaços menores e recebem ração", True),
       ("Ficam soltos em grandes pastagens", False),
       ("Não recebem acompanhamento", False),
       ("Vivem dentro das fábricas", False)],
    r="Espaço menor, alimentação controlada e acompanhamento de perto.")))

P.append(dict(missao="extrativismo", titulo="Tirar da natureza",
  ideia="Extrativismo é <b>retirar recursos diretamente da natureza</b>. "
        "São três tipos, pela origem.",
  fig=svg_origem(), legenda="É a origem que dá o nome ao extrativismo.",
  maq=dict(eixos=[[("vegetal","vegetal"), ("animal","animal"), ("mineral","mineral")]],
    saidas={"vegetal":"madeira, látex, castanha",
            "animal":"pesca, caça, mel",
            "mineral":"minérios, carvão, petróleo"},
    notas={"vegetal":"Retirado <b>das plantas</b>.",
           "animal":"Retirado <b>dos animais</b>, sem criá-los.",
           "mineral":"Retirado <b>do solo e do subsolo</b>."},
    ident="fgOrig", cap="Toque um tipo de extrativismo."),
  alerta="<b>Pecuária não é extrativismo.</b> Na pecuária o animal é criado; "
         "no extrativismo animal ele é retirado da natureza.",
  quiz=dict(p="A extração de petróleo é exemplo de extrativismo:",
    o=[("Mineral", True), ("Vegetal", False), ("Animal", False), ("Industrial", False)],
    r="Petróleo sai do subsolo: extrativismo mineral.")))

P.append(dict(missao="agroindustria", titulo="Quando o campo passa pela fábrica",
  ideia="A agroindústria liga a <b>produção do campo</b> à <b>atividade industrial</b>, "
        "acrescentando valor à matéria-prima.",
  fig=svg_valor(), legenda="O mesmo leite, depois da indústria, vale mais."
                           " E dura e viaja melhor.",
  alerta="Leite tirado da vaca e vendido <b>sem transformação</b> não é agroindústria. "
         "E ela <b>não precisa ser uma grande fábrica</b>.",
  quiz=dict(p="A transformação da cana-de-açúcar em açúcar mostra a relação entre:",
    o=[("O setor primário e o secundário", True),
       ("O primário e o terciário", False),
       ("O secundário e o terciário", False),
       ("Dois setores primários", False)],
    r="A cana vem do campo; o açúcar sai da indústria.")))

P.append(dict(missao="industrias", titulo="Dois tipos de indústria",
  ideia="A indústria fica quase sempre na <b>cidade</b>, e é de dois tipos.",
  revs=[("Indústria extrativa","prepara a matéria-prima"),
        ("Indústria de transformação","transforma em produto"),
        ("Construção civil","moradias, prédios, estradas e pontes")],
  revs_cap="Toque cada uma para ver o que faz.", revs_oculto="o que faz?",
  alerta="A construção civil é o que <b>ergue a estrutura</b> em que a cidade "
         "funciona — e também é setor secundário.",
  quiz=dict(p="As indústrias de transformação:",
    o=[("Transformam matérias-primas em produtos", True),
       ("Retiram recursos do solo", False),
       ("Vendem mercadorias ao consumidor", False),
       ("Constroem estradas e pontes", False)],
    r="É delas que saem os produtos prontos.")))

P.append(dict(missao="caminho", titulo="O caminho do leite até a mesa",
  ideia="Um mesmo produto costuma passar pelos <b>três setores</b> antes de chegar "
        "à nossa mesa.",
  fig=svg_setores("fgSet2"), legenda="Siga o leite pelos três setores.",
  maq=dict(eixos=[[("primario","na fazenda"), ("secundario","na indústria"),
                   ("terciario","no mercado")]],
    saidas={"primario":"a vaca é ordenhada",
            "secundario":"o leite vira queijo",
            "terciario":"o queijo é transportado e vendido"},
    notas={"primario":"Produção de <b>matéria-prima</b>: setor primário.",
           "secundario":"<b>Transformação</b> industrial: setor secundário.",
           "terciario":"<b>Transporte e venda</b>: setor terciário, duas vezes."},
    ident="fgSet2", cap="Toque cada etapa do caminho."),
  quiz=dict(p="O transporte e a venda do queijo no supermercado pertencem ao setor:",
    o=[("Terciário", True), ("Primário", False), ("Secundário", False),
       ("Quaternário", False)],
    r="Envolvem comércio e prestação de serviços.")))

montar("geografia", P)
