#!/bin/sh
# Reconstrói os quatro jogos a partir das cópias pré-design em /tmp.
set -e
cd "$(dirname "$0")/.."
cp /tmp/historia.html /tmp/artes.html /tmp/exploradores-do-ceu.html /tmp/time-travel-english.html .
python3 build/aplicar.py > /dev/null
python3 build/letras.py
