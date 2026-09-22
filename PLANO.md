# Plano técnico: de projeto de família a produto

Escrito em 22/09/2026, com o cliente ainda indefinido. Por isso trata só do
que precisa existir **nos três casos** (pais, escolas, ou ferramenta de
autoria) e marca explicitamente o que depende dessa escolha.

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

### 2.1 Procedência do conteúdo — decisão de negócio, não de engenharia

220 questões carregam a fonte declarada (`livro p.37`, `folha q18`) e derivam
das fotos do livro didático e das folhas da escola. Para o estudo de uma
criança, tudo bem. Para vender, é conteúdo derivado de obra de terceiro.

**Isto gate tudo o mais.** Não adianta refatorar por três meses e descobrir
que o banco não pode ir junto. Saídas: reescrever como conteúdo próprio
alinhado à BNCC, licenciar, ou mudar o modelo para que o conteúdo venha do
cliente (ver a opção "ferramenta de autoria").

Engenharia relacionada: manter o campo `src` de cada questão, que hoje serve
para a Anne reconhecer a página do livro, passa a servir de rastreamento de
procedência. Vale marcar cada questão como `propria` ou `derivada`.

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

---

## 4. Ordem do trabalho

Cada fase diz **o que quebra**, porque é isso que decide a ordem.

### Fase 0 — Congelar o comportamento em teste `~2 dias`

Os ~25 roteiros de regressão vivem no meu rascunho e somem quando a sessão
acaba. Viram testes versionados, rodando num comando:

- percorre todas as trilhas dos 4 jogos (414 questões) e verifica: sem
  `undefined`, sem alternativa vazia, letra certa em cada botão, ícone
  presente, sem erro de JS;
- navegação: rotas, botão voltar, busca, migalhas;
- tela de fim: caixa de revisão, patentes, comemoração;
- perfis: isolamento entre alunos, migração, lixeira;
- os três medidores que já existem.

**Quebra:** nada. **Sem isto, todas as fases seguintes são às cegas.** É a
única fase que eu faria mesmo que o produto não saia.

### Fase 1 — Tirar o conteúdo do código `~3 dias`

Extrair os bancos para `conteudo/*.json`, escrever o esquema e o validador. O
build passa a injetar o JSON. Saída byte a byte idêntica à de hoje, conferida
pelos testes da Fase 0.

**Quebra:** nada visível. Os medidores de viés passam a ler o JSON — ficam
mais simples, deixam de depender de regex sobre HTML.

**Destrava:** conteúdo revisável em pull request, por quem não programa;
contagem de procedência (2.1) vira consulta trivial.

### Fase 2 — Unificar os dois motores `~5 dias`

Normalizar os nomes divergentes, fundir num motor só, absorver o inglês como
`geradores`.

**Quebra:** o formato do progresso salvo muda. Precisa de migração — já
fizemos uma (perfis) e o risco conhecido é perder o progresso da criança, que
foi exatamente o que aconteceu uma vez. A migração tem de ser testada com
dados reais antes de subir.

**Destrava:** um caminho só em cada passo de build; fim da classe de defeito
"função existe num motor e não no outro".

### Fase 3 — Trocar o build `~4 dias`

Motor em módulos, conteúdo em dados, montagem de verdade. As 19 âncoras de
texto exato somem.

**Quebra:** tudo ao mesmo tempo — por isso vem depois da Fase 0 e da 1.

**Destrava:** um segundo desenvolvedor consegue trabalhar; jogo novo deixa de
exigir passo de build novo.

### Fase 4 — Modelo de dados `~4 dias, depende do cliente`

Contas → perfis → progresso, com papéis. Só faz sentido com o cliente
definido: turma e professor só existem no modelo B2B.

---

## 5. O que fica de fora de propósito

- **Cobrança, painel do professor, turmas** — dependem de quem paga.
- **Servidor TURN para a sala em rede.** Hoje a conexão usa STUN público e
  funciona na mesma rede; em dados móveis pode falhar. Custa dinheiro e só
  vale com cliente na mão.
- **Aplicativo nativo.** O que existe já instala como PWA se for preciso; não
  há motivo antes de haver demanda.
- **Mais conteúdo.** Enquanto 2.1 não se resolve, escrever mais questões
  derivadas do livro aumenta o passivo, não o produto.

---

## 6. Decisões que só você pode tomar

1. **Procedência do conteúdo.** É o gate. Antes de qualquer refatoração
   longa, decidir se o banco atual vai junto, é reescrito, ou vem do cliente.
2. **Quem paga.** Muda a Fase 4 inteira e a prioridade da ferramenta de
   autoria.
3. **O offline é promessa ou detalhe?** Se for promessa (escola sem internet),
   ele restringe as escolhas de arquitetura daqui para frente — e vale a pena,
   porque é diferencial.

---

## 7. Se fosse eu escolhendo

Faria a **Fase 0 agora**, independentemente de tudo. Os testes que garantem as
414 questões e a navegação hoje existem só na minha sessão de trabalho; quando
ela acabar, some a única rede de segurança que este código tem. É meio dia de
trabalho que protege tudo o mais.

Depois pararia e resolveria 2.1, porque é o que decide se as fases seguintes
valem alguma coisa.
