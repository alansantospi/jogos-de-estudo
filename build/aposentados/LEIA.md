# Aposentados

Estes scripts construíram o que hoje está em `motor/` e `jogo/`. Não rodam
mais.

Até a Fase 3, o build restaurava o HTML de um commit antigo e aplicava vinte
remendos que casavam **trechos literais do código-fonte** — 19 âncoras do tipo
`assert s.count(velho) == 1`. Funcionava com quatro arquivos e um autor, e
quebrou três vezes só na última semana:

- `showAchievement` chamado num motor que a batiza de `mostrarConquista` —
  travou a entrada na sala em "Conectando..." sem nenhuma mensagem;
- chaves repetidas num dicionário literal engoliram 11 reescritas em silêncio;
- a âncora `</script>` mudou de forma e o passo parou de casar.

Agora o motor é fonte (`motor/*.molde.html`), o conteúdo é dado
(`conteudo/*.json`) e montar é preencher fendas (`build/montar.py`).

Ficam aqui porque explicam como cada decisão do motor foi tomada — os
comentários deles são o registro de por que o design é como é. Para rodar
qualquer um, seria preciso antes restaurar os HTML do commit `3ef9591`, como
fazia `rebuild-antigo.sh`.
