#!/bin/sh
# Roda tudo: os medidores de conteúdo e os casos no navegador.
set -e
cd "$(dirname "$0")/.."
# As páginas não ficam no repositório: monta primeiro. O rebuild já roda os
# medidores de conteúdo.
sh build/rebuild.sh

# A esteira roda em Deno no servidor; aqui, em Node (>= 23.6 lê TypeScript).
echo "
== esteira"
N="node --disable-warning=MODULE_TYPELESS_PACKAGE_JSON"
$N teste/esteira/paridade.ts
$N --test --test-reporter=dot teste/esteira/esteira.test.ts teste/esteira/leitura.test.ts teste/esteira/licao.test.ts teste/esteira/montar_jogo.test.ts teste/esteira/fila.test.ts teste/esteira/tipos.test.ts
python3 teste/executar.py "$@"

if [ $# -eq 0 ]; then
  echo "
== a suíte morde?"
  python3 teste/mutacao.py
fi
