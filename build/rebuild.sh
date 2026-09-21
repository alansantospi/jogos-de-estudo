#!/bin/sh
# Reconstrói os quatro jogos a partir da última versão anterior ao redesenho
# (commit 3ef9591), que é a fonte confiável: /tmp some.
set -e
cd "$(dirname "$0")/.."
for g in historia artes exploradores-do-ceu time-travel-english; do
  git show 3ef9591:$g.html > $g.html
done
python3 build/aplicar.py > /dev/null
python3 build/letras.py
python3 build/ilustracao.py
python3 build/ingles.py
python3 build/trilha.py
python3 build/aviso.py
