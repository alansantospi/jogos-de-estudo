# -*- coding: utf-8 -*-
"""Faz os dois motores chamarem as mesmas coisas pelos mesmos nomes.

Enquanto divergem, cada passo de build precisa de dois caminhos e cada
esquecimento vira defeito em produção — foi assim que a entrada na sala
travou em "Conectando..." por chamar `showAchievement` num motor que a
batiza de `mostrarConquista`.

O de inglês é um arquivo; os do céu são três. Por isso quem se move é o
inglês.
"""
import io, os, re

RAIZ = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
ARQ = "time-travel-english.html"

# nome do inglês -> nome comum (o do motor do céu)
RENOMES = {
    "showAchievement": "mostrarConquista",
    "buildCategoryPool": "makeQuestions",
    "buildQuestionPool": "makeTodasQuestions",
}


def aplicar():
    s = io.open(os.path.join(RAIZ, ARQ), encoding="utf-8").read()

    for velho, novo in RENOMES.items():
        n = len(re.findall(r"\b%s\b" % velho, s))
        assert n, "nomes: %s não aparece" % velho
        s = re.sub(r"\b%s\b" % velho, novo, s)

    # `makeQuestions` do céu aceita um limite; o do inglês devolvia tudo.
    # Aceitar o limite deixa as duas assinaturas iguais sem mudar quem chama.
    velho = "function makeQuestions(category){"
    assert s.count(velho) == 1, "nomes: assinatura de makeQuestions mudou"
    s = s.replace(velho, "function makeQuestions(category, limite){\n"
                         "  const _corta = l => limite ? l.slice(0, limite) : l;")
    # o `return shuffle(...)` de cada caso passa pelo corte
    s = re.sub(r"(function makeQuestions\(category, limite\)\{.*?\n\}\n)",
               lambda m: m.group(1).replace("return shuffle(", "return _corta(shuffle("),
               s, flags=re.S, count=1)
    # fecha os parênteses que o corte abriu
    def _fechar(m):
        corpo = m.group(1)
        return corpo.replace("return _corta(shuffle(", "return _corta(shuffle(")
    s = re.sub(r"(return _corta\(shuffle\((?:[^;]|\n)*?)\);", r"\1));", s)

    # `mostrarConquista` do céu tem um segundo parâmetro (etapa); o do inglês
    # também passou a ter quando a virada de etapa ganhou cartão próprio.
    io.open(os.path.join(RAIZ, ARQ), "w", encoding="utf-8").write(s)
    print("  %-24s %d nomes convergidos" % ("time-travel-english", len(RENOMES)))


if __name__ == "__main__":
    aplicar()
