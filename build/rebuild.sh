#!/bin/sh
# Monta os quatro jogos a partir do motor, do conteúdo e das partes próprias.
#
# Até a Fase 3 isto restaurava o HTML de um commit antigo e aplicava vinte
# remendos que casavam trechos literais do fonte — 19 âncoras que quebraram
# três vezes só numa semana. Agora o motor é fonte e montar é preencher fendas.
#
# O caminho antigo ficou em build/rebuild-antigo.sh, para consulta.
set -e
cd "$(dirname "$0")/.."

echo "== conteúdo"
python3 build/esquema.py
python3 build/documentos.py

echo "== montagem"
python3 build/montar.py

echo "== conferências"
python3 build/medir_alternativas.py
python3 build/medir_plausibilidade.py
python3 build/verificar.py
python3 build/conferir_conteudo.py

echo "== página inicial"
python3 build/inicio.py
