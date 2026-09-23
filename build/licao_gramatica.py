# -*- coding: utf-8 -*-
"""Os catorze passos da lição de Gramática. A maquinaria está em licao.py."""
import os, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from licao import montar, fig, maquina, revelar, checar, svg_linha

def svg_fluxo():
    """Sujeito → verbo → complemento, com reto e oblíquo nos lugares."""
    return ('<svg viewBox="0 0 480 120" role="img" '
      'aria-label="Eu chamei ela: o reto é o sujeito, o oblíquo é o complemento">'
      '<rect class="bolha on" x="8" y="34" width="120" height="46" rx="12"/>'
      '<text class="forte" x="68" y="62" text-anchor="middle">EU</text>'
      '<text class="fraca" x="68" y="98" text-anchor="middle">caso reto</text>'
      '<text class="fraca" x="68" y="24" text-anchor="middle">quem faz</text>'
      '<path class="rot" d="M136 57h52"/><path class="rot" d="m181 51 8 6-8 6"/>'
      '<rect class="bolha" x="196" y="34" width="96" height="46" rx="12"/>'
      '<text class="forte" x="244" y="62" text-anchor="middle">chamei</text>'
      '<text class="fraca" x="244" y="98" text-anchor="middle">verbo</text>'
      '<path class="rot" d="M300 57h52"/><path class="rot" d="m345 51 8 6-8 6"/>'
      '<rect class="bolha on" x="360" y="34" width="112" height="46" rx="12"/>'
      '<text class="forte" x="416" y="62" text-anchor="middle">-A</text>'
      '<text class="fraca" x="416" y="98" text-anchor="middle">caso oblíquo</text>'
      '<text class="fraca" x="416" y="24" text-anchor="middle">quem recebe</text>'
      '</svg>')

def svg_distancia():
    """Régua do este/esse/aquele: onde está o objeto."""
    return ('<svg id="fgDist" data-estado="este" viewBox="0 0 480 172" role="img" '
      'aria-label="Quanto mais longe o objeto, mais muda o pronome">'
      '<style>'
      '#fgDist .obj{opacity:0}'
      '#fgDist[data-estado="este"] .o1,'
      '#fgDist[data-estado="esse"] .o2,'
      '#fgDist[data-estado="aquele"] .o3{opacity:1}'
      '#fgDist[data-estado="este"] .z1,'
      '#fgDist[data-estado="esse"] .z2,'
      '#fgDist[data-estado="aquele"] .z3{fill:var(--materia);opacity:.28}'
      '</style>'
      '<rect class="z z1" x="14" y="48" width="140" height="86" rx="14"/>'
      '<rect class="z z2" x="170" y="48" width="140" height="86" rx="14"/>'
      '<rect class="z z3" x="326" y="48" width="140" height="86" rx="14"/>'
      # três figuras
      '<circle class="rot" cx="60" cy="84" r="11"/>'
      '<path class="rot" d="M44 118a16 16 0 0 1 32 0"/>'
      '<circle class="rot" cx="216" cy="84" r="11"/>'
      '<path class="rot" d="M200 118a16 16 0 0 1 32 0"/>'
      '<path class="rot" d="M380 118V92M368 92h24l-12-18z"/>'
      '<text class="fraca" x="60" y="152" text-anchor="middle">quem fala</text>'
      '<text class="fraca" x="216" y="152" text-anchor="middle">quem ouve</text>'
      '<text class="fraca" x="380" y="152" text-anchor="middle">longe dos dois</text>'
      # o objeto, em cada zona
      '<g class="obj o1"><circle class="marca" cx="104" cy="92" r="12"/>'
      '<text class="forte" x="104" y="30" text-anchor="middle">este</text></g>'
      '<g class="obj o2"><circle class="marca" cx="260" cy="92" r="12"/>'
      '<text class="forte" x="260" y="30" text-anchor="middle">esse</text></g>'
      '<g class="obj o3"><circle class="marca" cx="424" cy="92" r="12"/>'
      '<text class="forte" x="424" y="30" text-anchor="middle">aquele</text></g>'
      '</svg>')
def svg_elo():
    """Duas palavras e o elo que a preposição faz."""
    return ('<svg viewBox="0 0 480 100" role="img" '
      'aria-label="A preposição liga duas palavras e cria uma relação">'
      '<rect class="bolha" x="10" y="26" width="140" height="48" rx="12"/>'
      '<text class="forte" x="80" y="55" text-anchor="middle">bicicleta</text>'
      '<rect class="bolha on" x="188" y="30" width="104" height="40" rx="20"/>'
      '<text class="forte" x="240" y="55" text-anchor="middle">de</text>'
      '<path class="rot" d="M152 50h34M294 50h34"/>'
      '<rect class="bolha" x="330" y="26" width="140" height="48" rx="12"/>'
      '<text class="forte" x="400" y="55" text-anchor="middle">alumínio</text>'
      '<text class="fraca" x="240" y="90" text-anchor="middle">a relação nasce da ligação</text>'
      '</svg>')




# ============================================================================
# OS CATORZE PASSOS, COMO DADO
#
# Nada aqui é HTML pronto. Os dois modos — passo a passo e resumo — saem daqui,
# e é por isso que não podem divergir: escrever o resumo à mão seria manter a
# mesma gramática em dois lugares, e um dos dois envelheceria calado.
#
#   ideia    a regra, em uma ou duas frases
#   fig      um desenho (opcional)
#   revs     pares título → resposta: cartões no passo, .mini no resumo
#   maq      eixos de escolha e o que compõem
#   alerta   a pegadinha; aparece nos dois modos
#   quiz     a checagem; só no passo a passo
# ============================================================================
P = []

P.append(dict(missao="pessoais", titulo="Quem faz e quem recebe",
  ideia="O pronome do <b>caso reto</b> é quem pratica a ação. "
        "O do <b>caso oblíquo</b> é quem recebe.",
  fig=svg_fluxo(), legenda="Eu chamei-a. Reto na frente do verbo, oblíquo atrás.",
  revs=[("1ª singular","eu / me, mim, comigo"), ("2ª singular","tu / te, ti, contigo"),
        ("3ª singular","ele, ela / o, a, lhe, se"), ("1ª plural","nós / nos, conosco"),
        ("2ª plural","vós / vos, convosco"), ("3ª plural","eles, elas / os, as, lhes")],
  revs_cap="Toque cada pessoa para ver o par reto / oblíquo.",
  alerta="Depois de <b>com</b>, o oblíquo muda de cara: comigo, contigo, conosco, convosco.",
  quiz=dict(p="Complete: «___ chamei ___ para a festa.»",
    o=[("Eu / a", True), ("Mim / ela", False), ("Me / ti", False), ("Eu / tu", False)],
    r="<b>Eu</b> pratica (reto) e <b>-a</b> recebe (oblíquo): <i>Eu chamei-a</i>.")))

P.append(dict(missao="tratamento", titulo="Como se fala com cada um",
  ideia="Pronome de tratamento é o jeito respeitoso de se dirigir a alguém.",
  revs=[("Reis e rainhas","Vossa Majestade"), ("O Papa","Vossa Santidade"),
        ("Cardeais","Vossa Eminência"), ("Reitores","Vossa Magnificência"),
        ("Presidente, senadores","Vossa Excelência"),
        ("Príncipes, duquesas","Vossa Alteza")],
  revs_cap="Toque cada pessoa para ver como se fala com ela.",
  alerta="<b>Você</b> é o único pronome de tratamento usado em situação informal. "
         "Todos os outros são formais.",
  quiz=dict(p="Qual destes é usado em situação informal?",
    o=[("Você", True), ("Vossa Senhoria", False), ("Senhor", False),
       ("Vossa Excelência", False)],
    r="Todos os outros são formais. <b>Você</b> é a exceção da regra.")))

P.append(dict(missao="possessivos", titulo="De quem é a coisa",
  ideia="O possessivo diz de quem é. Troque o dono e a coisa e veja o que muda.",
  maq=dict(eixos=[[("eu","eu"), ("tu","tu"), ("nós","nós"), ("eles","eles")],
                  [("bola","a bola"), ("livros","os livros"), ("casa","a casa")]],
    saidas={"eu|bola":"minha bola", "eu|livros":"meus livros", "eu|casa":"minha casa",
            "tu|bola":"tua bola", "tu|livros":"teus livros", "tu|casa":"tua casa",
            "nós|bola":"nossa bola", "nós|livros":"nossos livros", "nós|casa":"nossa casa",
            "eles|bola":"sua bola", "eles|livros":"seus livros", "eles|casa":"sua casa"},
    notas={"eu|livros":"O dono é um só, mas o possessivo foi para o <b>plural</b>: "
                       "quem manda é a coisa.",
           "nós|bola":"Vários donos, mas a bola é uma: <b>nossa</b>, no singular.",
           "eles|casa":"Eles e ela usam <b>seu, sua</b> — os mesmos da 3ª pessoa."},
    cap="Escolha o dono e a coisa."),
  alerta="O possessivo concorda com <b>a coisa possuída</b>, não com o dono: "
         "<i>minha bola</i>, <i>meus livros</i> — quem fala é o mesmo.",
  quiz=dict(p="Muitos donos, uma coisa só: como fica?",
    o=[("Nossa escola", True), ("Nossas escola", False), ("Nosso escola", False),
       ("Minhas escola", False)],
    r="A escola é <b>uma</b> e é <b>feminina</b>, então: nossa escola.")))

P.append(dict(missao="demonstrativos", titulo="Perto, aí, ou lá longe",
  ideia="O demonstrativo diz <b>onde está</b> o objeto: comigo, com você, "
        "ou longe dos dois.",
  fig=svg_distancia(), legenda="Mova o objeto e veja o pronome mudar.",
  maq=dict(eixos=[[("este","comigo"), ("esse","com você"), ("aquele","longe dos dois")]],
    saidas={"este":"este, esta, isto", "esse":"esse, essa, isso",
            "aquele":"aquele, aquela, aquilo"},
    notas={"este":"A palavra <b>aqui</b> pede este. <i>Este documento aqui.</i>",
           "esse":"A palavra <b>aí</b> pede esse. <i>Esse caderno aí.</i>",
           "aquele":"A palavra <b>lá</b> pede aquele. <i>Aquele guarda-chuva lá.</i>"},
    ident="fgDist", cap="Onde está o objeto?"),
  alerta="Isto, isso e aquilo são <b>invariáveis</b>: não têm masculino, feminino "
         "nem plural.",
  quiz=dict(p="«Ricardo, é seu ___ caderno aí perto da sua carteira?»",
    o=[("esse", True), ("este", False), ("aquele", False), ("aquilo", False)],
    r="O caderno está com <b>Ricardo</b>, a pessoa com quem se fala: esse.")))

P.append(dict(missao="indefinidos", titulo="Quando não se diz qual",
  ideia="O indefinido substitui o substantivo de modo <b>vago</b>. "
        "Uns mudam de forma, outros não.",
  revs=[("algum, alguma","variável"), ("nenhum, nenhuns","variável"),
        ("muito, muitas","variável"), ("ninguém","invariável"),
        ("tudo","invariável"), ("nada","invariável")],
  revs_cap="Toque para ver se a palavra muda de forma.", revs_oculto="varia?",
  alerta="Eles ficam sempre na <b>3ª pessoa</b> do discurso — o nome já diz que "
         "não definem de quem se fala.",
  quiz=dict(p="Em «Há poucos erros na redação», o indefinido é:",
    o=[("poucos", True), ("erros", False), ("redação", False), ("há", False)],
    r="<b>Poucos</b> diz uma quantidade imprecisa. E varia: pouco, pouca, poucas.")))

P.append(dict(missao="interrogativos", titulo="As palavras que perguntam",
  ideia="O interrogativo abre a pergunta — direta ou indireta.",
  maq=dict(eixos=[[("quem","quem"), ("que","que"), ("qual","qual"), ("quanto","quanto")]],
    saidas={"quem":"Quem chegou?", "que":"Que horas são?",
            "qual":"Qual / quais?", "quanto":"Quanto / quantos?"},
    notas={"quem":"<b>Invariável</b>: nunca vira quens.",
           "que":"<b>Invariável</b>: nunca vira ques.",
           "qual":"<b>Variável</b>: qual, quais.",
           "quanto":"<b>Variável</b>: quanto, quanta, quantos, quantas."},
    cap="Toque um pronome e veja se ele muda de forma."),
  alerta="Também aparece em pergunta indireta, sem ponto de interrogação: "
         "<i>Não sei <b>quem</b> chegou.</i>",
  quiz=dict(p="Em «Quantos ainda não votaram?», o pronome é:",
    o=[("interrogativo variável", True), ("interrogativo invariável", False),
       ("indefinido invariável", False), ("demonstrativo", False)],
    r="Abre pergunta, logo é interrogativo. E <b>quanto</b> varia em gênero e número.")))

P.append(dict(missao="verbo", titulo="Ação, estado ou fenômeno",
  ideia="O verbo indica uma <b>ação</b>, um <b>estado</b> ou um <b>fenômeno da "
        "natureza</b>. Só essas três.",
  revs=[("O feirante vendeu tudo","ação"), ("Clarita está feliz","estado"),
        ("Nevou no Sul do Brasil","fenômeno"), ("Quero dormir mais","duas ações")],
  revs_cap="Toque cada frase para ver o que o verbo indica.", revs_oculto="o que é?",
  alerta="Ele flexiona em <b>modo</b>, <b>tempo</b>, <b>número</b> e <b>pessoa</b> — "
         "mas nunca em gênero.",
  quiz=dict(p="Toque no verbo da frase.",
    o=[("O", False), ("feirante", False), ("vendeu", True), ("todas", False),
       ("as", False), ("verduras", False)],
    r="<b>Vendeu</b> é o que o feirante fez: é ação, é verbo.", frase=True)))

P.append(dict(missao="modos", titulo="A atitude de quem fala",
  ideia="O modo mostra <b>como o falante encara</b> o que diz: com certeza, "
        "com dúvida, ou mandando.",
  revs=[("Estudei muito para a prova","indicativo — certeza"),
        ("Pode ser que eu estude hoje","subjuntivo — dúvida"),
        ("Se eu fosse você, estudaria","subjuntivo — hipótese"),
        ("Não sejas indisciplinado!","imperativo — ordem")],
  revs_cap="Toque cada frase para ver o modo.", revs_oculto="qual modo?",
  alerta="São três e só três: <b>indicativo</b>, <b>subjuntivo</b> e <b>imperativo</b>.",
  quiz=dict(p="«Devolvam tudo, nós lhes suplicamos.» O modo é:",
    o=[("imperativo", True), ("indicativo", False), ("subjuntivo", False),
       ("infinitivo", False)],
    r="<b>Devolvam</b> é uma ordem — ou um pedido forte. Isso é imperativo.")))

P.append(dict(missao="tempos", titulo="Antes, agora, depois",
  ideia="O tempo verbal diz <b>quando</b> a ação acontece em relação ao momento "
        "da fala.",
  fig=svg_linha("fgTempo", ["preterito","presente","futuro"],
                ["pretérito","presente","futuro"],
                "Linha do tempo: pretérito, presente e futuro"),
  legenda="A fala acontece no meio da linha.",
  maq=dict(eixos=[[("preterito","ontem"), ("presente","hoje"), ("futuro","amanhã")]],
    saidas={"preterito":"A diretora estava bonita.",
            "presente":"A diretora está bonita.",
            "futuro":"A diretora estará bonita."},
    notas={"preterito":"<b>Pretérito</b>: aconteceu antes da fala.",
           "presente":"<b>Presente</b>: acontece no momento da fala.",
           "futuro":"<b>Futuro</b>: vai acontecer depois da fala."},
    ident="fgTempo", cap="Escolha o momento."),
  quiz=dict(p="«Damião estudará a lição» está no:",
    o=[("futuro", True), ("presente", False), ("pretérito", False),
       ("imperativo", False)],
    r="A terminação <b>-rá</b> entrega: a ação ainda vai acontecer.")))

P.append(dict(missao="conjugacao", titulo="A terminação diz o grupo",
  ideia="Todo verbo pertence a um de três grupos, e quem decide é a terminação "
        "do <b>infinitivo</b>.",
  maq=dict(eixos=[[("cantar","cantar"), ("vender","vender"), ("compor","compor"),
                   ("partir","partir")]],
    saidas={"cantar":"-ar → 1ª", "vender":"-er → 2ª", "compor":"-or → 2ª",
            "partir":"-ir → 3ª"},
    notas={"cantar":"Termina em <b>-ar</b>: primeira conjugação.",
           "vender":"Termina em <b>-er</b>: segunda conjugação.",
           "compor":"Termina em <b>-or</b>, que também é <b>segunda</b> — é a pegadinha.",
           "partir":"Termina em <b>-ir</b>: terceira conjugação."},
    cap="Toque um verbo no infinitivo."),
  alerta="<b>-or</b> também é segunda conjugação: compor, pôr, depor. É a pegadinha "
         "mais comum.",
  quiz=dict(p="«Compusemos uma bela canção.» Que conjugação?",
    o=[("segunda", True), ("primeira", False), ("terceira", False), ("quarta", False)],
    r="Leve ao infinitivo: <b>compor</b>, terminado em -or. Segunda conjugação.")))

P.append(dict(missao="nominais", titulo="As três formas nominais",
  ideia="Elas falam da ação sem marcar o tempo como os outros verbos: uma antes, "
        "uma durante, uma depois.",
  fig=svg_linha("fgNom", ["infinitivo","gerundio","participio"],
                ["infinitivo", "gerúndio", "particípio"],
                "Infinitivo, gerúndio e particípio ao longo da ação"),
  legenda="O infinitivo nem começou; o particípio já acabou.",
  maq=dict(eixos=[[("infinitivo","-r"), ("gerundio","-ndo"), ("participio","-do")]],
    saidas={"infinitivo":"brincar", "gerundio":"brincando", "participio":"brincado"},
    notas={"infinitivo":"<b>Infinitivo</b>: o nome do verbo, sem tempo marcado.",
           "gerundio":"<b>Gerúndio</b>: a ação está acontecendo agora.",
           "participio":"<b>Particípio</b>: a ação já foi concluída."},
    ident="fgNom", cap="Toque uma terminação."),
  alerta="O infinitivo pode virar substantivo: <i>O <b>caminhar</b> faz bem</i>.",
  quiz=dict(p="«Despedidos os funcionários, nada restava.» A forma é:",
    o=[("particípio", True), ("gerúndio", False), ("infinitivo", False),
       ("imperativo", False)],
    r="<b>Despedidos</b> termina em -dos: a ação já tinha acabado.")))

P.append(dict(missao="preposicao", titulo="A palavra que liga",
  ideia="A preposição é <b>invariável</b> e sozinha não quer dizer nada. "
        "O sentido nasce da ligação que ela faz.",
  fig=svg_elo(), legenda="Sem a preposição, as duas palavras ficam soltas.",
  revs=[("a, ante, até, após","essenciais"), ("com, contra, de, desde","essenciais"),
        ("em, entre, para, por","essenciais"), ("conforme, durante","acidentais"),
        ("exceto, mediante","acidentais"), ("segundo, não obstante","acidentais")],
  revs_cap="Toque para ver se a preposição é essencial ou acidental.",
  revs_oculto="qual grupo?",
  alerta="<b>Acidental</b> é a palavra de outra classe que virou preposição: "
         "segundo, durante, exceto.",
  quiz=dict(p="Qual destas é preposição acidental?",
    o=[("segundo", True), ("ante", False), ("após", False), ("desde", False)],
    r="<b>Segundo</b> também é numeral e adjetivo: virou preposição, é acidental.")))

P.append(dict(missao="relacoes", titulo="Uma preposição, muitos sentidos",
  ideia="A mesma palavrinha <b>de</b> muda de sentido conforme o que ela liga. "
        "É o contexto que decide.",
  revs=[("os olhos de Patrícia","posse"), ("uma casa de madeira","matéria"),
        ("veio de ônibus","meio"), ("falava de política","assunto"),
        ("chorou de alegria","causa"), ("feriu-se com o martelo","instrumento")],
  revs_cap="Toque cada trecho para ver a relação.", revs_oculto="que relação?",
  alerta="Outras relações que caem na prova: <b>companhia</b> (com as amigas), "
         "<b>fim</b> (para abastecer), <b>oposição</b> (contra o vento), "
         "<b>lugar</b> (em São Paulo).",
  quiz=dict(p="Em «Parou para abastecer o carro», a relação é de:",
    o=[("fim", True), ("causa", False), ("meio", False), ("lugar", False)],
    r="<b>Para</b> mostra a finalidade: ele parou <i>com o objetivo de</i> abastecer.")))

P.append(dict(missao="contracao", titulo="Quando a preposição gruda",
  ideia="Grudando na palavra seguinte, a preposição pode <b>perder um som</b> "
        "(contração) ou só se juntar (combinação).",
  maq=dict(eixos=[[("de","de"), ("em","em"), ("a","a"), ("por","por")],
                  [("o","o"), ("as","as"), ("isso","isso"), ("aquela","aquela")]],
    saidas={"de|o":"d<s>e</s>o → <b>do</b>", "de|as":"d<s>e</s>as → <b>das</b>",
            "de|isso":"d<s>e</s>isso → <b>disso</b>",
            "de|aquela":"d<s>e</s>aquela → <b>daquela</b>",
            "em|o":"e<s>m</s>o → <b>no</b>", "em|as":"e<s>m</s>as → <b>nas</b>",
            "em|isso":"e<s>m</s>isso → <b>nisso</b>",
            "em|aquela":"e<s>m</s>aquela → <b>naquela</b>",
            "a|o":"a + o → <b>ao</b>", "a|as":"a + as → <b>às</b>",
            "a|isso":"a + isso → <b>a isso</b>", "a|aquela":"a + aquela → <b>àquela</b>",
            "por|o":"por + o → <b>pelo</b>", "por|as":"por + as → <b>pelas</b>",
            "por|isso":"por + isso → <b>por isso</b>",
            "por|aquela":"por + aquela → <b>por aquela</b>"},
    notas={"a|o":"Aqui <b>não se perde nada</b>: a + o = ao. Isso é combinação.",
           "a|as":"A crase marca a união: <b>às</b>.",
           "a|isso":"Com <i>isso</i> não se usa crase — fica <b>a isso</b>. "
                    "Nem toda junção acontece.",
           "por|isso":"<b>Por</b> não gruda em isso: continuam duas palavras.",
           "por|aquela":"<b>Por</b> também não gruda aqui.",
           "de|o":"O <b>e</b> some: houve perda de fonema. Isso é contração.",
           "em|aquela":"O <b>m</b> some e vira <b>n</b>: naquela."},
    rotular=False, cap="Escolha a preposição e a palavra que vem depois."),
  alerta="<b>Contração</b> perde um som (de+o = do). <b>Combinação</b> só junta "
         "(a+o = ao, a+onde = aonde).",
  quiz=dict(p="«Saímos daquele local.» A palavra daquele é:",
    o=[("de + aquele", True), ("em + aquele", False), ("a + aquele", False),
       ("por + aquele", False)],
    r="<b>De</b> mais <b>aquele</b>, perdendo o e: contração.")))


montar("gramatica", P)
