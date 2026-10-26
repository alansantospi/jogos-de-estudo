#!/bin/sh
# Roda tudo: os medidores de conteúdo e os casos no navegador.
set -e
cd "$(dirname "$0")/.."
echo "== medidores"
python3 build/medir_alternativas.py
python3 build/medir_plausibilidade.py
python3 build/verificar.py

# A esteira roda em Deno no servidor; aqui, em Node (>= 23.6 lê TypeScript).
echo "
== esteira"
N="node --disable-warning=MODULE_TYPELESS_PACKAGE_JSON"
$N teste/esteira/paridade.ts
$N --test --test-reporter=dot teste/esteira/esteira.test.ts
python3 teste/executar.py "$@"

if [ $# -eq 0 ]; then
  echo "
== a suíte morde?"
  python3 teste/mutacao.py
fi
