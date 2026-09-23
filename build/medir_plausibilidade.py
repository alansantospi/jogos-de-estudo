# -*- coding: utf-8 -*-
"""Mede atalhos que não dependem de saber a matéria.

Comprimento não é o único jeito de a alternativa certa se entregar. Estas
são as regras que uma criança esperta descobre sozinha em duas partidas:

  absolutos   — "apenas", "sempre", "nunca", "somente", "todos" quase nunca
                aparecem na resposta certa. Eliminar quem os tem já reduz o
                chute a duas opções.
  eco         — a certa costuma repetir as palavras do enunciado.
  gramática   — num enunciado terminado em "...", só a certa encaixa.

Cada regra é medida do mesmo jeito que o comprimento: quanto acerta quem
joga só por ela. O acaso puro acerta 25%.
"""
import io, json, os, re, sys, unicodedata

# A lista de jogos sai da tabela do montador, não de uma cópia aqui. Antes era
# uma lista fixa, repetida em dois medidores: a Gramática entrou e passou sem
# ser medida, porque ninguém lembrou de acrescentá-la nos dois lugares.
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import montar
ARQUIVOS = {a: p["conteudo"] for a, p in montar.JOGOS.items()}
ARQUIVOS["time-travel-english.html"] = "ingles-4ano"   # motor próprio, fora da tabela

CERTA = re.compile(r'(?<![a-z])c:"((?:[^"\\]|\\.)*)"')
ERRADAS = re.compile(r'(?<![a-z])d:\[(.*?)\]')
PERG = re.compile(r'(?<![a-z])q:"((?:[^"\\]|\\.)*)"')
STR = re.compile(r'"((?:[^"\\]|\\.)*)"')

ABSOLUTOS = {"apenas", "somente", "sempre", "nunca", "todos", "todas", "nenhum",
             "nenhuma", "so", "unico", "unica", "exatamente", "totalmente",
             "completamente", "qualquer", "jamais", "inteiramente"}

VAZIAS = {"o", "a", "os", "as", "um", "uma", "de", "do", "da", "dos", "das",
          "em", "no", "na", "nos", "nas", "que", "e", "ou", "para", "por",
          "com", "se", "ao", "aos", "as", "e", "é", "qual", "quais", "como",
          "quando", "onde", "quem", "porque", "por que", "mais", "menos",
          "seu", "sua", "ser", "esta", "este", "isso", "the", "of"}

PISO, TETO = 15.0, 35.0


def chave(t):
    t = unicodedata.normalize("NFD", t.lower())
    return "".join(c for c in t if not unicodedata.combining(c))


def palavras(t):
    return {p for p in re.findall(r"[a-z0-9]+", chave(t)) if p not in VAZIAS and len(p) > 2}


def tem_absoluto(t):
    return bool(palavras(t) & ABSOLUTOS) or re.search(r"\bs[óo]\b", chave(t))


def questoes(arq):
    """As questões de escolha, lidas do conteúdo — não mais do HTML.

    Enquanto estava tudo dentro do HTML, medir exigia regex sobre código. Com
    o conteúdo em `conteudo/*.json`, é leitura direta: menos jeito de errar e
    o mesmo medidor serve para questão gerada, que nunca vai passar por HTML.
    """
    caminho = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))),
                           "conteudo", ARQUIVOS[arq] + ".json")
    if not os.path.exists(caminho):
        return []
    jogo = json.load(io.open(caminho, encoding="utf-8"))
    return [(q["enunciado"], q["certa"], q["erradas"])
            for q in jogo["questoes"] if q["tipo"] in ("escolha", "escutar")]


def pontua(it, escolhe):
    """Quanto acerta quem segue a regra, dividindo o acaso entre os empates."""
    p = 0.0
    for q, c, d in it:
        cand = escolhe(q, [c] + d)
        if not cand:
            cand = list(range(1 + len(d)))
        if 0 in cand:
            p += 1.0 / len(cand)
    return 100 * p / len(it)


def sem_absolutos(q, ops):
    r = [i for i, o in enumerate(ops) if not tem_absoluto(o)]
    return r if 0 < len(r) < len(ops) else None


def maior_eco(q, ops):
    pq = palavras(q)
    n = [len(palavras(o) & pq) for o in ops]
    return [i for i, x in enumerate(n) if x == max(n)] if max(n) else None


def condicional(it, escolhe):
    """A mesma conta, mas só nas questões em que a pista existe de fato.

    Diluir numa média com as questões onde a regra nem dispara esconde o
    tamanho do atalho: o que importa é o que ela entrega quando aparece.
    """
    p, n = 0.0, 0
    for q, c, d in it:
        cand = escolhe(q, [c] + d)
        if cand is None or len(cand) == 1 + len(d):
            continue
        n += 1
        if 0 in cand:
            p += 1.0 / len(cand)
    return (100 * p / n if n else float("nan")), n


def relatorio(arq):
    it = questoes(arq)
    if not it:
        return
    abs_c = sum(1 for _, c, _ in it if tem_absoluto(c))
    abs_e = sum(1 for _, _, d in it for x in d if tem_absoluto(x))
    n_e = sum(len(d) for _, _, d in it)
    linhas = [
        ("eliminar absolutos", pontua(it, sem_absolutos)),
        ("seguir o eco do enunciado", pontua(it, maior_eco)),
    ]
    print("  %s (n=%d)" % (arq.replace(".html", ""), len(it)))
    for (nome, v), regra in zip(linhas, (sem_absolutos, maior_eco)):
        cv, cn = condicional(it, regra)
        print("     %-28s %5.1f%%   %s   (onde a pista existe: %.0f%% em %d questões)"
              % (nome, v, "ok" if PISO <= v <= TETO else "ATALHO", cv, cn))
    print("     %-28s certa %4.1f%%  errada %4.1f%%"
          % ("carregam um absoluto", 100 * abs_c / len(it), 100 * abs_e / n_e))
    return max(v for _, v in linhas)


if __name__ == "__main__":
    ruim = 0
    for arq in sorted(ARQUIVOS):
        v = relatorio(arq)
        if v is not None and not (PISO <= v <= TETO):
            ruim += 1
    print("  (acaso puro: 25%%. Faixa aceita: %g%% a %g%%)" % (PISO, TETO))
    sys.exit(1 if ruim else 0)
