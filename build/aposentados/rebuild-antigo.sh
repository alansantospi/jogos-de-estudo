#!/bin/sh
# Reconstrói os quatro jogos a partir da última versão anterior ao redesenho
# (commit 3ef9591), que é a fonte confiável: /tmp some.
set -e
cd "$(dirname "$0")/.."
for g in historia artes exploradores-do-ceu time-travel-english; do
  git show 3ef9591:$g.html > $g.html
done
python3 build/aplicar.py > /dev/null
# O conteúdo dos três jogos do motor do céu vem de conteudo/*.json e
# sobrescreve o que veio do git. Entra antes do resto para que os passos
# seguintes trabalhem sobre o banco definitivo.
python3 build/esquema.py
python3 build/conteudo.py
python3 build/conteudo_ingles.py
python3 build/letras.py
python3 build/ilustracao.py
python3 build/ingles.py
python3 build/progresso.py
python3 build/trilha.py
python3 build/aviso.py
python3 build/texto.py
python3 build/navegacao.py
python3 build/busca.py
python3 build/alternativas.py
python3 build/medir_alternativas.py
python3 build/medir_plausibilidade.py
# Os remendos por motor já rodaram; daqui para frente é código compartilhado,
# então os nomes convergem primeiro.
python3 build/fonte.py
python3 build/nomes.py
python3 build/extras.py
python3 build/sala.py
python3 build/verificar.py
python3 build/perfil.py
python3 build/historico.py
python3 build/inicio.py
python3 build/conferir_conteudo.py
