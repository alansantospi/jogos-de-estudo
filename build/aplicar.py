# -*- coding: utf-8 -*-
import io,re,sys
sys.path.insert(0,"build")
import icons
from theme import FONTS, MATERIAS

TOKENS=io.open("build/_tokens.css",encoding="utf-8").read()
COMP=io.open("build/comp.css",encoding="utf-8").read()

# Só pictogramas. Setas (→ ↔ ←), sinais de conferido (✓ ✗) e formas geométricas
# ficam: são conteúdo, não decoração. Foi por não separar isso que a primeira
# varredura apagou 192 setas de explicações como "clean → cleaning".
_PICTO = ("\U0001F000-\U0001FAFF"                        # pictogramas, emoticons, transporte
          "\U0001F1E6-\U0001F1FF"                        # bandeiras
          "\u2600-\u26FF"                                # símbolos diversos: ☀ ☁ ⚡ ⛵
          "\u2700-\u2712\u2715\u2716\u2719-\u27BF"     # dingbats, menos ✓ ✔ ✗ ✘
          "\u2300-\u23FF"                                # ⌨ ⏳ ⏰
          "\u2B00-\u2BFF"                                # ⬆ ⭐
          "\u2049\u203C\u2122\u2139")                   # ⁉ ‼ ™ ℹ
EMOJI=re.compile("(?:[0-9#*]\uFE0F?\u20E3|[" + _PICTO + "]\uFE0F?\u200D?)+")

ICO={
 "ciencias":{"all":"dado","review":"remendo","earth":"terra","sun":"sol","orientation":"bussola",
   "moon":"lua","calendars":"calendario","hemispheres":"globo","instruments":"luneta","stars":"estrela"},
 "historia":{"all":"dado","review":"remendo","imprensa":"prensa","jornais":"jornal","distancia":"carta",
   "imagem":"camera","digital":"globo","inclusao":"pontos","comunicacao":"prensa"},
 "arte":{"all":"dado","review":"remendo","melodia":"nota","harmonia":"ondas","pintura":"parede",
   "michelangelo":"arco","musica":"nota"},
 "ingles":{"all":"dado","review":"remendo","vocabulary":"livro","ing_add":"lapis","ing_drop_e":"tesoura",
   "ing_double":"lapis","listening":"fone","contractions":"tesoura","clock_routine":"relogio",
   "be":"engrenagem","affirmative":"balao","negative_questions":"balao","ticket":"bilhete",
   "movement":"pessoa","daily_actions":"casa","results_actions":"trofeu","time_numbers":"numeros",
   "world":"globo","essential":"rota","verbs":"livro","grammar":"engrenagem"},
}

def aplicar(arq, materia):
    s=io.open(arq,encoding="utf-8").read()
    mapa=ICO[materia]; n={}

    # 1. a ilustração da questão deixa de ser emoji e vira nome de ícone
    from mapa import nome as icone_de
    c1=[0]; c2=[0]
    def _i(m): c1[0]+=1; return 'ic:"%s",' % icone_de(m.group(1))
    def _ic(m): c2[0]+=1; return '%s ic:"%s"' % (m.group(1), icone_de(m.group(2)))
    s=re.sub(r'\bi:"([^"]*)",', _i, s)
    s=re.sub(r'([,{])\s*icon:"([^"]*)"', _ic, s)
    n["ilustrações das questões"]=c1[0]+c2[0]

    # 2. ícone dos cards vira SVG, escolhido pela categoria/trilha do próprio botão
    def troca_ico(m):
        bloco=m.group(0)
        c=re.search(r'data-(?:cat|trail)="(\w+)"',bloco)
        nome=mapa.get(c.group(1) if c else "", "dado")
        return re.sub(r'<(?:div|span) class="(?:ico|category-icon|trail-icon)">[^<]*</(?:div|span)>',
                      icons.uso(nome,"",22), bloco)
    s,k=re.subn(r'<button[^>]*class="(?:category-card|trail-card)[^"]*"[^>]*>.*?</button>',
                troca_ico,s,flags=re.S);             n["ícones de card"]=k
    # o card de revisão não tem data-cat
    s=re.sub(r'(id="reviewCard"[^>]*>)\s*<(?:div|span) class="(?:ico|category-icon)">[^<]*</(?:div|span)>',
             r'\1'+icons.uso("remendo","",22),s)

    # 3. ícones das lições também viram desenho
    c3=[0]
    def _pic(m):
        c3[0]+=1
        return '<div class="pic">'+icons.uso(icone_de(m.group(1)),"",26)+'</div>'
    s=re.sub(r'<div class="pic">([^<]*)</div>', _pic, s)
    n["ilustrações das lições"]=c3[0]

    # 4. HUD com rótulos em texto
    for ident,rot in (("score","Pontos"),("lives","Vidas"),("combo","Sequência")):
        s=re.sub(r'<div class="pill">[^<]*<span id="%s">([^<]*)</span></div>'%ident,
                 '<div class="pill"><span id="%s">\\1</span><span class="rot">%s</span></div>'%(ident,rot),s)
    s=re.sub(r'<div class="pill">[^<]*<span id="modeLabel">([^<]*)</span></div>',
             '<div class="pill"><span id="modeLabel">\\1</span><span class="rot">Missão</span></div>',s)
    s=s.replace('>🔊</button>','>'+icons.uso("som","",20)+'</button>')

    # 5. textos com emoji dentro do JS
    s=s.replace('''b.textContent=mudo?"🔇":"🔊";''',
                '''b.innerHTML=mudo?SVG_MUDO:SVG_SOM;''')
    s=s.replace('''pontosVoando(practiceMode?"ops":"−1 ❤️",false)''',
                '''pontosVoando(practiceMode?"−":"−1 vida",false)''')
    s=re.sub(r'const MARCOS=\{[^}]*\}','const MARCOS={3:"Três seguidas",5:"Cinco seguidas",'
             '8:"Oito seguidas",12:"Doze seguidas — impressionante"}',s)
    s=re.sub(r'if\(combo===3\) showAchievement\("[^"]*"\)','if(combo===3) showAchievement("Três seguidas")',s)
    s=re.sub(r'if\(combo===5\) showAchievement\("[^"]*"\)','if(combo===5) showAchievement("Cinco seguidas")',s)
    s=re.sub(r'if\(combo===8\) showAchievement\("[^"]*"\)','if(combo===8) showAchievement("Oito seguidas")',s)

    # 6. retorno com rótulo em vez de emoji
    s=s.replace("""f.textContent=(ok?'✅ ':'⚠️ ')+msg;""",
      """f.innerHTML='<span class="rotulo">'+(ok?'Certo':'Ainda não')+'</span>';f.append(msg);""")
    s=s.replace("""box.textContent=(ok?(combo>=3?"🔥 ":"✅ "):"⚠️ ")+msg;""",
      """box.innerHTML='<span class="rotulo">'+(ok?(combo>=3?"Certo — "+combo+" seguidas":"Certo"):"Ainda não")+'</span>';box.append(msg);""")

    # 7. selo de origem sem emoji
    s=re.sub(r'`📖 Livro — \$\{([^}]*)\}`',r'`Livro, ${\1}`',s)
    s=re.sub(r'`📝 Folha de revisão — \$\{([^}]*)\}`',
             r'`Folha de revisão${(d=>d?", "+d:"")((\1).replace(/^[\\s\\/,-]+/,""))}`',s)
    s=re.sub(r'`📖 \$\{q\.src\}`',r'`Fonte: ${q.src}`',s)
    s=re.sub(r'`📖 Questão do livro — \$\{q\.src\}`',r'`Livro, ${q.src}`',s)
    s=re.sub(r'`📝 Questão da folha da escola\$\{([^}]*)\}`',r'`Folha da escola${\1}`',s)
    s=re.sub(r'`📖📝 Livro e folha da escola`',r'`Livro e folha da escola`',s)

    # 8. varredura final. Só consome espaço colado ao emoji — nunca espaço
    #    entre palavras, senão "</b> o erro" vira "</b>o erro".
    antes=len(EMOJI.findall(s))
    s=re.sub(r'(?<=>)\s*(?:'+EMOJI.pattern+r')\s*','',s)   # emoji logo após uma tag
    s=re.sub(r'(?<=")\s*(?:'+EMOJI.pattern+r')\s*','',s)   # emoji no início de string JS
    s=re.sub(r'(?:'+EMOJI.pattern+r')[ ]?','',s)            # o que sobrar, mais um espaço colado
    n["emojis removidos na varredura"]=antes

    # 9. visual: fontes, sprite e folha de estilo
    s=re.sub(r'<style>.*?</style>','<style>'+TOKENS.replace("%MATERIA%",MATERIAS[materia])+COMP+'</style>',s,flags=re.S)
    s=s.replace("</head>",FONTS+"</head>",1)
    usados=sorted(set(mapa.values())|{"som","mudo","check","casa","lupa","fogo","tema","sol","lua","expandir","encolher","palmas","festa"}|set(re.findall(r'href="#i-([a-z-]+)"',s))|
                  set(re.findall(r'\bic:"([a-z-]+)"',s)))
    s=re.sub(r'(<body[^>]*>)',r'\1'+icons.sprite(usados),s,count=1)
    s=s.replace("<script>",
      '<script>\nconst SVG_SOM=\'%s\',SVG_MUDO=\'%s\';\n'%(icons.uso("som","",20),icons.uso("mudo","",20)),1)

    io.open(arq,"w",encoding="utf-8").write(s)
    print(f"  {arq}")
    for k2,v in n.items():
        if v: print(f"      {k2}: {v}")
    resta=len(EMOJI.findall(s))
    print(f"      emojis restantes: {resta}")
    return resta

if __name__=="__main__":
    total=0
    for arq,mat in [("historia.html","historia"),("artes.html","arte"),
                    ("exploradores-do-ceu.html","ciencias"),("time-travel-english.html","ingles")]:
        total+=aplicar(arq,mat)
    print(f"\n  emojis restantes no total: {total}")
