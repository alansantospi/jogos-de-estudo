# Jogos de Estudo

Jogos de revisão em HTML para a Anne, 10 anos, 4º ano do Ensino Fundamental.
Um jogo por matéria, montado a partir do livro didático e das folhas de
revisão da escola, e publicado em GitHub Pages.

## Register

**product** — são ferramentas de estudo. O design serve ao conteúdo; a página
inicial é só um lançador, não uma peça de marketing.

## Usuários e propósito

**Quem usa:** a Anne, sozinha, no celular ou no tablet. Às vezes no notebook.
Em geral na véspera da prova, à noite, no quarto, com o abajur aceso — cansada
e querendo a sensação de que dá conta.

**A tarefa em cada tela:** responder uma questão e entender por que errou.
Tudo o mais (pontos, trilhas, progresso) existe para sustentar isso.

**O que precisa acontecer:** ela reconhecer o conteúdo do livro dentro do jogo.
Por isso as questões carregam a página de origem: quando ela vê "Livro — p.49",
sabe que aquilo cai na prova.

**Segundo usuário:** o pai, que adiciona o material fotografado e acompanha o
que ela erra.

## A questão precisa ser honesta

A alternativa certa não pode se entregar pela forma. É fácil errar isso sem
perceber: eu escrevia a certa como explicação completa e as erradas como
descartes curtos, e o resultado media assim — em História a certa era a mais
longa em 70% das questões, com o dobro do tamanho médio das erradas. Quem
sempre escolhesse a maior acertaria 70% sem saber nada. O jogo premiava a
habilidade errada e dava à Anne uma falsa sensação de que sabia.

A regra: **quem responder só pelo comprimento tem de acertar como o acaso,
perto de 25%.** As quatro alternativas ficam no mesmo registro e no mesmo
tamanho aproximado; o detalhe que a certa não comporta vai para a explicação,
que aparece no retorno — onde ensina mais.

Comprimento não é o único atalho. `build/medir_plausibilidade.py` mede mais
dois, do mesmo jeito — quanto acerta quem joga só por eles:

- **eliminar absolutos**: "apenas", "sempre", "somente", "nunca" quase nunca
  aparecem na resposta certa. Em História havia 5 questões, e em Ciências 2,
  em que a certa era a **única alternativa afirmativa** — descarte puro,
  sobrou 1.
- **seguir o eco do enunciado**: a certa repetindo as palavras da pergunta.

Onde "sempre" é o próprio equívoco testado ("a sombra fica sempre igual"),
ele fica: o problema é o absoluto usado como enchimento.

O que **não** dá para medir é a caricatura: a alternativa que a criança
descarta por ser absurda, sem saber a matéria — "a nuvem só é lida em dias de
chuva", "uma flor que cresce só no norte". Essa parte é leitura e julgamento,
não número; 27 questões foram reescritas assim. O critério: a errada tem de
ser um engano que alguém poderia mesmo cometer.

Os dois medidores derrubam o build fora da faixa de 15% a 35%. Valem para
cada conteúdo novo.

## Alunos, histórico e conta

**Um perfil por aluno**, escolhido na página inicial. Cada um tem a própria
chave de progresso e o próprio histórico; trocar de aluno não apaga o do
outro. O que já estava salvo no aparelho vira o primeiro perfil, em vez de
se perder.

**A conta é da família, os perfis são os alunos.** Assim a criança nunca
precisa de senha e o pai sincroniza uma vez só. Ver `CONTA.md` — enquanto
não estiver ligada, tudo funciona igual, só sem passar de um aparelho para
outro.

**O histórico responde quatro perguntas**, que foi o que se pediu dele:
está melhorando, o que ainda erra, de onde retomar e o que mostrar para a
professora.

Ele bebe de **duas fontes com papéis diferentes**, e confundir as duas já
causou uma tela vazia para quem tinha meses de estudo:

- o **progresso** é o registro acumulado que os jogos sempre mantiveram —
  missões concluídas, melhor acerto por missão, questões dominadas. Não tem
  data, mas existe desde o primeiro dia.
- o **registro de partidas** só existe desde que o histórico foi criado, e é
  o único que tem data.

Resumo, "o que ainda erra" e "retomar" saem do progresso, e as partidas
afinam quando existem. Só o gráfico de evolução depende das partidas — e,
quando não há nenhuma, diz isso em vez de parecer que ninguém jogou.

## Escopo

A base é um modelo reaproveitável. Cada prova nova vira um jogo novo com o
mesmo motor: mesmos formatos de questão, mesmo modo Treino, mesmo progresso.

## Personalidade

**Três palavras:** lúdico, colorido, legível.

É um **jogo**, e precisa parecer um. Uma primeira versão tratou o material como
caderno impresso: ficou bonita e ilegível de tão séria — a própria aluna diria
que não dá vontade de abrir. Engajamento aqui é função, não enfeite.

**Referências concretas:** Kahoot (formas coloridas nas alternativas), Duolingo
(botão que afunda, barra de progresso gorda), Quizizz (cor saturada carregando
a tela), Quizlet (tipografia grande). O que se aproveita delas é cor, forma,
peso e retorno ao toque — nenhuma delas depende de emoji para ser divertida.

## Anti-referências

- **Emoji como ícone.** Nenhum, em lugar nenhum — mas *substituído* por
  desenho, não removido. Toda questão continua tendo sua ilustração.
- **Cara de IA.** Herói centralizado com emoji gigante, gradiente roxo-azul,
  eyebrow em caixa alta acima de cada seção, glassmorphism decorativo.
- **Gamificação barulhenta.** Confete, mascote, "Parabéns!!!".
- **Documento impresso.** Já tentamos: sério demais, não convida a jogar.
- **Dashboard corporativo.** Ela está estudando, não acompanhando KPI.

## Acessibilidade

- Contraste mínimo 4.5:1 no corpo de texto — ela lê à noite, cansada.
- Alvo de toque mínimo de 44px (a maior parte do uso é no celular).
- `prefers-reduced-motion` respeitado em toda animação.
- Navegação por teclado nas alternativas (já existe no jogo de inglês).
- O conteúdo de História cobre Braille e Libras: legibilidade aqui não é
  detalhe decorativo, é coerência com o que o jogo ensina.
