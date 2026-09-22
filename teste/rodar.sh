#!/bin/sh
# Roda tudo: os medidores de conteúdo e os casos no navegador.
set -e
cd "$(dirname "$0")/.."
echo "== medidores"
python3 build/medir_alternativas.py
python3 build/medir_plausibilidade.py
python3 build/verificar.py
python3 teste/executar.py "$@"

if [ $# -eq 0 ]; then
  echo "
== a suíte morde?"
  python3 teste/mutacao.py
fi
