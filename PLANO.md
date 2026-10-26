# Plano técnico: de projeto de família a produto

Escrito em 22/09/2026. Revisado no mesmo dia, quando o modelo ficou
definido: **banco próprio + gerar questões do material que o usuário insere**.

Quem paga ainda não está decidido, então o que depende disso continua marcado.

Os números aqui foram medidos no repositório, não estimados.

---

## 1. Onde estamos

| | |
|---|---|
| Jogos | 4 arquivos HTML, 126 a 223 KB cada |
| Questões | 514 no banco, mais as geradas por regra no de inglês |
| Conteúdo | 95 KB de banco **dentro** dos HTML, como literais JavaScript |
| Motores | 2 (um serve Ciências/História/Artes, outro só Inglês) |
| Build | 13 scripts Python com **19 âncoras de trecho exato** |
| Testes versionados | 3 (viés de comprimento, de plausibilidade, nomes entre motores) |
| Testes não versionados | ~25 roteiros que vivem fora do repositório |
| Dados | `localStorage` por perfil; nuvem = 1 JSON por conta |

### O que já é bom e vale preservar

**O rigor das questões.** Dois medidores derrubam o build se o comprimento ou
a plausibilidade entregarem a resposta certa. Foi assim que se descobriu que
História dava 70% de acerto a quem só escolhesse a alternativa mais longa.
Produto de quiz quase nunca faz isso — é diferencial real, não higiene.

**Acessibilidade medida.** 44 pares de cor verificados em WCAG AA nos dois
temas, com o conversor OKLCH próprio em `build/contraste.py`.

**Funciona offline, de um arquivo só.** Não é limitação: é vantagem em escola
com internet ruim. Deve continuar sendo um **alvo de build**, não um acidente.

---

## 2. O que trava, em ordem de gravidade

### 2.1 Procedência do conteúdo — resolvida pelo modelo, não eliminada

220 das 514 questões declaram fonte no livro didático e nas folhas da escola
(`livro p.37`, `folha q18`). Com o modelo definido, isso deixa de ser um gate
e vira uma separação a fazer:

- **o banco que acompanha o produto** tem de ser originário. As questões
  derivadas ou saem, ou são reescritas, ou viram exemplo privado;
- **o que o usuário gera do próprio material** é responsabilidade dele, como
  em qualquer ferramenta de estudo — desde que o produto não redistribua
  isso para outros usuários.

Duas obrigações de engenharia decorrem disso, e nenhuma é opcional:

1. **Cada questão carrega a procedência.** O campo `src`, que hoje serve para
   a Anne reconhecer a página do livro, passa a marcar `propria` ou
   `derivada`, e de que material veio. Sem isso não dá para separar o que pode
   ser publicado do que não pode.
2. **Conteúdo gerado nasce privado.** Nada que sai do material de um usuário
   aparece para outro sem ele mandar. Compartilhar é escolha explícita, e aí
   a responsabilidade é de quem compartilha — o produto precisa registrar isso.

### 2.2 O conteúdo é código

O banco vive dentro do HTML. Matéria nova = arquivo novo escrito à mão por
quem sabe JavaScript. Nenhum dos três modelos de produto sobrevive a isso.

### 2.3 O build é cirurgia de texto

19 pontos que casam trechos literais do fonte (`assert s.count(velho)==1`).
Quebrou três vezes só na última semana:

- `showAchievement` chamado num motor que a batiza de `mostrarConquista` —
  travou a entrada na sala em "Conectando..." sem mensagem;
- chaves repetidas num dicionário literal engoliram 11 reescritas em silêncio;
- a âncora `</script>` mudou de forma e o passo parou de casar.

Funciona porque são 4 arquivos e um autor. Não sobrevive a 40 arquivos nem a
um segundo desenvolvedor.

### 2.4 Os dois motores divergiram

Mesmo conceito, nomes diferentes: `t` × `type`, `c`+`d` × `choices`+`answer`,
`nomes` × `missionMeta`, `items` × `verbs`, `mostrarConquista` ×
`showAchievement`, `makeQuestions` × `buildCategoryPool`. Cada passo de build
precisa de dois caminhos, e cada esquecimento vira defeito em produção.

### 2.5 O modelo de dados é de uma família

`familias(id uuid, dados jsonb)` — um blob por conta. Não há turma, professor,
papel nem cobrança. Serve hoje; não serve a nenhum produto.

---

## 3. Arquitetura de destino

```
conteudo/                 dados, versionados, validados por esquema
  ciencias-4ano.json
  ingles-4ano.json
  ...
motor/                    um motor só, em módulos de verdade
  quiz.js  progresso.js  sala.js  historico.js
  estilo.css  tokens.css
build/                    monta, valida e mede
  montar.py               gera cada jogo de motor + conteúdo
  esquema.py              valida o conteúdo antes de montar
  medir_*.py              os medidores de viés, já existentes
teste/                    o que hoje vive no rascunho
  navegacao.js  conteudo.js  sala.js  ...
```

O **alvo de build continua sendo um HTML por jogo**, autocontido. O que muda é
que ele passa a ser *gerado* de fontes separadas, não *emendado* por regex.

### Esquema do conteúdo, esboço

```json
{
  "id": "ciencias-4ano",
  "materia": "Ciências",
  "titulo": "Exploradores do Céu",
  "cor": "oklch(0.525 0.15 195)",
  "missoes": [
    {"id": "earth", "nome": "Movimento da Terra", "grupo": "Terra e Sol"}
  ],
  "trilhas": [
    {"id": "earth", "nome": "Terra em Movimento", "etapas": ["earth", "sun"]}
  ],
  "questoes": [
    {"tipo": "escolha", "missao": "earth", "icone": "terra",
     "fonte": {"texto": "livro p.37", "origem": "derivada"},
     "enunciado": "...", "certa": "...", "erradas": ["...", "...", "..."],
     "explicacao": "..."}
  ],
  "geradores": []
}
```

`geradores` é o que absorve o caso do inglês, que hoje fabrica questões por
regra a partir de um banco de verbos em vez de listá-las.

### A esteira de geração — o coração do produto

O usuário insere material (texto colado, foto de página, PDF) e recebe
questões no esquema acima. É exatamente o que eu fiz à mão para a Anne, lendo
as fotos do livro dela; agora vira funcionalidade.

```
material do usuário
   │
   ├─ extrair texto        (OCR na foto, texto do PDF)
   ├─ segmentar            trechos com sentido próprio
   ├─ gerar                questões + alternativas + explicação,
   │                       cada uma citando o trecho de origem
   ├─ MEDIR                os dois medidores que já existem,
   │                       agora dentro do fluxo
   ├─ regerar              só as que reprovaram
   └─ revisar              o usuário aprova, edita ou descarta
```

**O passo MEDIR é o diferencial.** Gerar questão com um modelo de linguagem
qualquer um faz; gerar e provar que a resposta certa não se entrega pelo
comprimento nem pela plausibilidade, não. `build/medir_alternativas.py` (70
linhas) e `build/medir_plausibilidade.py` (128 linhas) já fazem essa conta —
hoje sobre HTML, o que a Fase 1 resolve. Depois disso eles rodam sobre dados e
cabem num serviço.

**Isto tira o produto do estático.** Hoje não há servidor nosso: HTML no
GitHub Pages mais Supabase. Gerar exige chave de API, que não pode ir para o
navegador — então entra uma função de servidor (Supabase Edge Function serve),
que guarda a chave, limita uso e registra custo.

### O que aprendi gerando questão à mão, e que a esteira precisa respeitar

Três coisas custaram retrabalho neste projeto e viram requisito:

- **Toda questão cita o trecho de origem.** Escrevi que o Big Ben "é um
  relógio", vindo de uma folha de exercícios; o livro dizia "it's a bell!". Sem
  a citação não há como conferir, e questão errada ensina errado.
- **A revisão humana não é opcional.** Aprovar, editar ou descartar é parte do
  fluxo, não um extra.
- **Foto de celular falha.** Duas imagens chegaram com 0 byte neste projeto e
  só se descobriu depois. A esteira precisa avisar na hora quando não
  conseguiu ler o material.

---

## 4. Ordem do trabalho

Cada fase diz **o que quebra**, porque é isso que decide a ordem.

### Fase 0 — Congelar o comportamento em teste ✔ feita em 22/09/2026

Os ~25 roteiros de regressão vivem no meu rascunho e somem quando a sessão
acaba. Viram testes versionados, rodando num comando:

- percorre todas as trilhas dos 4 jogos (414 questões) e verifica: sem
  `undefined`, sem alternativa vazia, letra certa em cada botão, ícone
  presente, sem erro de JS;
- navegação: rotas, botão voltar, busca, migalhas;
- tela de fim: caixa de revisão, patentes, comemoração;
- perfis: isolamento entre alunos, migração, lixeira;
- os três medidores que já existem.

**Quebra:** nada. **Sem isto, todas as fases seguintes são às cegas.**

Entregue em `teste/`, com `sh teste/rodar.sh`. Nove execuções de caso mais os
três medidores, e um verificador de mutação que reinjeta quatro defeitos reais
do projeto e cobra que a suíte falhe — porque suíte que passa não prova nada.
Limites conhecidos estão em `teste/LEIA.md`: o botão voltar do navegador e a
sala em rede não dão para automatizar no tempo virtual.

### Fase 1 — Tirar o conteúdo do código ✔ feita em 22/09/2026 (3 de 4 jogos)

Extrair os bancos para `conteudo/*.json`, escrever o esquema e o validador. O
build passa a injetar o JSON. Saída byte a byte idêntica à de hoje, conferida
pelos testes da Fase 0.

**Quebra:** nada visível. Os medidores de viés passam a ler o JSON — ficam
mais simples, deixam de depender de regex sobre HTML.

**Destrava:** conteúdo revisável em pull request, por quem não programa;
contagem de procedência (2.1) virou consulta trivial — **117 derivadas de
313** nos três jogos extraídos.

Entregue em `conteudo/*.json`, com `build/esquema.py` validando e
`build/conferir_conteudo.py` cobrando que a ida e volta não perca nada. A
extração foi feita pelo próprio navegador (`build/extrair.py`), porque
escrever um analisador de JavaScript em Python seria inventar uma classe de
erro sem necessidade.

**Inglês ficou de fora, e isso é deliberado.** Naquele motor a questão vai
para a missão por expressão regular sobre o texto da fase, em três
reservatórios, mais geradores por regra. Desembaraçar é trabalho da Fase 2;
tentar aqui misturaria as duas e tiraria a garantia de "saída idêntica".

### Fase 2 — Unificar os dois motores ✔ feita em 22/09/2026

Normalizar os nomes divergentes, fundir num motor só, absorver o inglês como
`geradores`.

**Feito em 22/09/2026 — o lado do dado.** As 186 questões estáticas do inglês
e os 49 verbos saíram para `conteudo/ingles-4ano.json`, no mesmo esquema dos
outros. O mapeamento de questão para missão, que vivia como expressão regular
sobre o texto da fase dentro de um `switch`, virou campo explícito — e foi
conferido rodando os filtros antigos e comparando conjunto a conjunto: os
quatro filtros puros dão exatamente o mesmo. Com isso são **499 questões como
dado, 162 derivadas**, e os dois medidores de viés cobrem os quatro jogos.

**O lado do código, feito em seguida e em passo próprio.**

O progresso salvo passou a ter um formato só: o de inglês guardava
`verbs:{base:{errors,hits}}` e `best.accuracy`, agora usa `items:{id:{e,h}}` e
`best.acc`, como os outros. **A migração é a parte perigosa**, e por isso tem
teste próprio (`teste/casos/migracao.js`) contra os cinco formatos que existem
num aparelho de verdade — o antigo, o novo, os dois misturados, o vazio e o
caminho completo de gravar e carregar. Na dúvida entre dois valores ela fica
com o maior: nunca descarta acerto.

Os nomes divergentes convergiram (`showAchievement` → `mostrarConquista`,
`buildCategoryPool` → `makeQuestions`, `buildQuestionPool` →
`makeTodasQuestions`), com as assinaturas alinhadas. `build/verificar.py`
derruba o build se algum voltar.

**O que não foi feito e por quê.** Os 12 geradores por regra do inglês
continuam código, não declaração no esquema. Fundir os quatro jogos num
arquivo de motor só depende da montagem de verdade — que é a Fase 3. O que a
Fase 2 entregou é o que ela precisava entregar: os dois motores falam a mesma
língua, então um passo de build deixa de precisar de dois caminhos.

**Quebra:** o formato do progresso salvo muda. Precisa de migração — já
fizemos uma (perfis) e o risco conhecido é perder o progresso da criança, que
foi exatamente o que aconteceu uma vez. A migração tem de ser testada com
dados reais antes de subir.

**Destrava:** um caminho só em cada passo de build; fim da classe de defeito
"função existe num motor e não no outro".

### Fase 3 — Trocar o build ✔ feita em 22/09/2026

Motor em módulos, conteúdo em dados, montagem de verdade. As 19 âncoras de
texto exato somem.

**Quebra:** tudo ao mesmo tempo — por isso vem depois da Fase 0 e da 1.

**Destrava:** um segundo desenvolvedor consegue trabalhar; jogo novo deixa de
exigir passo de build novo.

**As 19 âncoras viraram 0.** O motor agora é fonte (`motor/*.molde.html`), o
conteúdo é dado (`conteudo/*.json`), as partes próprias de cada jogo ficam em
`jogo/<id>/`, e `build/montar.py` preenche fendas. Os 17 scripts de remendo
foram para `build/aposentados/`, com o registro de por que existiram.

A separação foi medida antes de ser feita: os três jogos do céu compartilhavam
99,2% do script e 98,1% do estilo, e depois de parametrizar cor, título,
matéria, chave, prefixo da sala e patentes o molde ficou **idêntico** nos três.
A única divergência de lógica que restava — cada jogo formatava o rótulo de
procedência à sua maneira — sumiu normalizando o dado, que a Fase 1 tinha
tornado possível.

O verificador de ida e volta também mudou: antes comparava com uma referência
congelada em `/tmp`, que some entre sessões e acusa mudança deliberada de
formato como se fosse perda. Agora fecha o ciclo lendo o jogo montado e
comparando com o arquivo de conteúdo.

### Fase 4 — A esteira de geração `~8 dias`

A funcionalidade que define o produto. Depende da Fase 1 (o esquema é a saída
do gerador) e da Fase 0 (é o único jeito de saber que o gerado presta).

Em três pedaços, cada um entregável sozinho:

1. **Colar texto → questões** `~3 dias`. Nada de OCR ainda. Função de servidor
   com a chave, geração, os dois medidores no caminho, regeração do que
   reprovar, e a tela de revisão. Já é útil: professor cola o resumo da aula e
   sai com um jogo.
2. **Foto e PDF** `~3 dias`. OCR, segmentação, e o aviso claro quando o
   material não deu para ler.
3. **Biblioteca do usuário** `~2 dias`. O material inserido e as questões
   geradas ficam guardados, privados, com a procedência marcada.

**Quebra:** nada do que existe. É adição.

**Custo novo:** cada geração chama um modelo e custa. Precisa de limite por
conta desde o primeiro dia, ou a conta chega antes do cliente.

**Pedaço 1 publicado em 25/10/2026.** A função está em
`supabase/functions/gerar/`, a esteira em `supabase/functions/_esteira/`, e a
tela é `gerar.html`. Ligar está em `GERAR.md`. O que ficou decidido no
caminho:

- **Só `escolha`.** É o tipo em que os medidores mordem; `vf` tem viés
  próprio (proporção de verdadeiros) que ainda não se mede.
- **Os medidores existem duas vezes**, em Python no build e em TypeScript na
  função, e `teste/esteira/paridade.ts` cobra que deem o mesmo número sobre
  todo `conteudo/`. Cada regra ganhou uma versão por questão, que é o que
  decide o que regerar. Ela foi calibrada contra as 540 questões revisadas à
  mão: marca 19 delas (3,5%), como aviso, não bloqueio.
- **Limite em duas cercas**: gerações por conta por dia e teto de gasto de
  todas as contas por dia, reservado antes de chamar o modelo e sob trava.
- **A saída é um arquivo** no esquema de `conteudo/`, não um jogo pronto.
  Virar jogo ainda passa pelos passos de `conteudo/LEIA.md`. Jogar direto da
  tela de revisão é o que falta para "sair com um jogo" valer ao pé da letra.

**Pedaço 2 publicado em 26/10/2026.** É a ação `ler` da
mesma função, com o módulo em `supabase/functions/_esteira/leitura.ts`. O que
ficou decidido:

- **Ler e gerar são dois passos.** A leitura devolve o texto de cada página
  para a pessoa conferir e escolher; o que ela deixa marcado vira o
  `material` da geração. Assim a conferência do trecho continua a mesma: a
  questão cita o texto lido, e não a foto. Sem OCR à parte: o próprio modelo
  lê a imagem e o PDF.
- **Letra de mão fica fora.** A folha chega respondida pela criança, com
  erro. O texto escrito à mão vem num campo próprio, que a tela mostra e não
  põe no material. Foi o que aconteceu de verdade com a revisão de Ciências
  de 20/10.
- **"Não deu para ler" é veredito por página**, com o motivo para saber o que
  fotografar de novo. Página com quase nada de texto é marcada assim mesmo que
  o modelo diga que leu, e o arquivo que não rendeu página nenhuma também
  aparece. Ilegível vem desmarcada.
- **Um pedido por página, todos ao mesmo tempo.** Num pedido só, doze
  páginas de livro voltam como uns 30 mil tokens de texto, minutos de
  escrita, e a função é cortada em 150 s. O PDF é dividido no servidor em
  PDFs de uma página (pdf-lib) e segue como se fossem fotos. A página que
  falha vira "não deu para ler" com o motivo, sem derrubar as outras.
- **A foto é reduzida no aparelho** a 1568 px no lado maior antes de subir:
  ~300 KB em vez de 4 MB, e o mesmo que o modelo leria. Limites: 12 páginas
  (as do PDF contam uma a uma) e 12 MB por leitura.
- **A leitura gasta a mesma cota** da geração: um jogo a partir de fotos usa
  duas das dez vezes do dia. A tabela `geracoes` ganhou `tipo` para separar as
  duas no gasto.
- **A procedência sai mais fina.** Cada questão aprovada procura, entre as
  páginas lidas, a que contém o seu trecho, e o arquivo baixado leva
  `fonte: {tipo: "foto", detalhe: "IMG_2598.jpg, p.1"}`.

**Jogo grande, escrito em 27/10/2026.** O pedaço 1 parava em 20 questões
porque é o que um pedido escreve dentro dos 150 s da função; os jogos feitos
à mão têm cem. Agora um jogo é:

- **abrir** — a reserva que conta no limite do dia (3 jogos por conta).
  Plano e partes apontam para ela (`geracoes.criacao`); o teto de gasto de
  todas as contas continua contando cada pedido.
- **planejar** — o material vira missões que não se sobrepõem, cada uma com
  quantas questões comporta, no máximo 12. Se o material não sustenta o
  total pedido, o plano soma menos: melhor um jogo menor que um repetido.
- **gerar**, uma missão por pedido, quatro ao mesmo tempo. Cada pedido sabe
  das outras missões e é instruído a não invadi-las; a questão que vier com
  a missão errada é posta na certa. A missão que falha aparece no plano com
  "Tentar de novo", e as que chegam já entram na revisão.

**Jogar sem build, escrito em 27/10/2026.** "Salvar e jogar" grava o
conteúdo aprovado na tabela `jogos` e abre `jogar.html?id=…`. A página leva
o motor inteiro e preenche as fendas no navegador (`build/_montar_jogo.js`),
como `montar.py` faz no build; `montar_jogo.test.ts` cobra que os dois
escrevam o mesmo banco sobre todo `conteudo/`. Capa e cartões saem de um
modelo único, e a lição fica de fora — é o passo 3. O índice lista os jogos
da conta. Falta: o progresso desses jogos não sincroniza entre aparelhos.

**Gerir, escrito em 27/10/2026.** `gerar.html#meus` lista os jogos da conta
com Jogar, Editar e Apagar. Editar reabre o jogo na revisão (renomear,
editar, descartar; salvar atualiza o mesmo). Acrescentar questões gera
missões novas só do material novo e as soma às do jogo, com ids que não
colidem. A tabela `jogos` passa a guardar o material e o ano.

### Fase 5 — Modelo de dados `~4 dias, depende do cliente`

Contas → perfis → progresso → biblioteca de material, com papéis. Turma e
professor só existem no modelo B2B; a biblioteca, em todos.

---

## 5. O que fica de fora de propósito

- **Cobrança, painel do professor, turmas** — dependem de quem paga.
- **Servidor TURN para a sala em rede.** Hoje a conexão usa STUN público e
  funciona na mesma rede; em dados móveis pode falhar. Custa dinheiro e só
  vale com cliente na mão.
- **Aplicativo nativo.** O que existe já instala como PWA se for preciso; não
  há motivo antes de haver demanda.
- **Escrever mais questões derivadas à mão.** Com a esteira, isso deixa de ser
  trabalho meu ou seu: passa a ser o que o produto faz. O banco próprio que
  acompanha o produto é a exceção, e esse precisa ser originário.
- **Gerar e publicar conteúdo de outros.** O que sai do material de um usuário
  fica privado a ele. Virar biblioteca pública é outro produto, com outro
  risco.

---

## 6. Decisões que só você pode tomar

1. **Quem paga.** Muda a Fase 5 inteira e a ordem dentro da Fase 4.
2. **O que acontece com as 220 questões derivadas.** Reescrever como próprias,
   tirar do banco publicado, ou deixar como exemplo privado da sua conta. É
   trabalho de conteúdo, não de código, e dá para fazer em paralelo.
3. **O offline é promessa ou detalhe?** Se for promessa (escola sem internet),
   restringe a arquitetura daqui para frente — e vale a pena, porque é
   diferencial. Note que a geração **não** funciona offline: jogar sim, criar
   não. Isso precisa estar claro na interface.
4. **Quanto custa deixar gerar.** Limite por conta, desde o primeiro dia.

---

## 7. Se fosse eu escolhendo

Faria a **Fase 0 agora**, independentemente de tudo. Os testes que garantem as
414 questões e a navegação hoje existem só na minha sessão de trabalho; quando
ela acabar, some a única rede de segurança que este código tem.

Depois **Fase 1 e o pedaço 1 da Fase 4**, nessa ordem, pulando a unificação
dos motores por enquanto. Motivo: "colar um texto e sair com um jogo jogável,
com as questões medidas" é a menor coisa que já prova a tese do produto. Dá
para mostrar a um professor e ver a cara dele. As Fases 2 e 3 são dívida
técnica real, mas dívida que só cobra juros quando houver um segundo
desenvolvedor — e nenhuma delas muda o que o cliente vê.

O risco de inverter essa ordem é conhecido: construir três semanas de
arquitetura bonita para uma tese que ninguém validou.
