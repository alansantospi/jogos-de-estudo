# Criar jogo sem burocracia

Pedido original:

- escolher a cor do jogo, padronizar de acordo com a matéria/assunto
- sugerir o nome do jogo com base no conteúdo
- depois de criado, limpar os campos pra próxima criação
- ao alternar de perfil, mudar a tela e ir pra outra página
- a criação de jogo está burocrática, a UX deve ser premium, vai virar um app depois

## O problema

Criar um jogo hoje é preencher formulário: três etapas, um parágrafo
explicando cada uma, e na segunda um bloco de campos soltos (texto do
material, nome, matéria, ano, quantidade) que parece cadastro. O pai faz
isso no celular, à noite, entre outras coisas. Cada campo a mais é um
motivo para largar no meio.

O que muda é a ordem das coisas: **primeiro o jogo, depois o detalhe.** A
etapa 2 deixa de ser formulário e vira a capa do jogo que vai sair — nome,
matéria e cor desenhados como o card que aparece na página inicial — com o
resto à mão, mas fora do caminho.

## 1. A cor do jogo

- Oito cores, as mesmas dos jogos feitos à mão, mais turquesa. Nada de
  verde nem vermelho: no jogo eles já querem dizer certo e errado.
- **A cor segue a matéria** até alguém escolher outra. Matéria vazia ou
  desconhecida olha o nome do jogo; sem nada, fica o anil da casa.
  "Ciências", "ciencias" e "Ciências (Mundo microscópico)" dão a mesma.
- Escolheu, fica. Um toque em "Voltar à cor da matéria" desfaz.
- Guarda-se a **chave** da cor (`conteudo.cor = "laranja"`), nunca o valor
  CSS: o jogo é montado com texto que vem do banco, e o valor sai sempre da
  tabela do código.
- A tabela mora num lugar só, `build/_montar_jogo.js`, e o build a recorta
  para `gerar.html` e `index.html`. Jogo antigo, sem `cor`, sai na cor da
  matéria, como antes.
- O card de "Meus jogos" na página inicial usa a cor do jogo.

## 2. O nome sugerido

Já existe: a leitura de foto sugere pelo título impresso, e o plano sugere
na hora de gerar. Falta:

- **Texto colado também sugere na hora**, sem gastar nada: a primeira linha,
  quando parece um título (curta, sem ponto final), vira o nome. Só ocupa
  campo vazio ou que ainda tem a sugestão anterior.
- O nome que o plano sugeriu aparece na revisão **num campo editável**,
  junto com matéria e cor — hoje só jogo reaberto deixa renomear. Quem não
  gostou do nome muda antes de salvar, sem voltar etapas.

## 3. Limpar depois de criar

Salvou, os campos de criação esvaziam: material, texto colado, leitura,
nome, matéria, cor e quantidade (que volta a "o material decide"). O ano
fica, porque é o mesmo aluno.

O jogo salvo continua aberto na revisão, para "Atualizar e jogar" seguir
funcionando. Ele sai de cena quando começa um material novo ou quando se
toca em "Novo jogo": já está na conta, e volta por "Meus jogos".

## 4. Trocar de perfil leva aos jogos

Tocar no avatar de um aluno, na tela "Quem está jogando?", troca o perfil
**e** vai para a aba Jogos. Hoje troca e fica parado na mesma tela, sem
sinal de que algo aconteceu. Renomear e apagar continuam na tela de perfis.

## 5. Criação premium

O critério: menos decisões à vista, nenhuma tela que pareça cadastro, e um
botão principal que está sempre no polegar.

**Material**
- Título "Novo jogo", uma linha de apoio.
- Texto colado: contador ao vivo e "Continuar" só liga com o mínimo, em vez
  de reclamar depois do toque. ⌘/Ctrl+Enter continua.
- Colar (⌘V) na etapa: foto vira arquivo escolhido; texto vai para a aba
  de texto.

**Jogo** (era "Conferir")
- No topo, a **capa**: um card na cor do jogo com matéria e nome editáveis
  no próprio card, e as cores logo abaixo. É o que a pessoa está criando,
  à vista desde o primeiro segundo.
- Páginas lidas logo abaixo, como hoje (marcar e desmarcar é a conferência).
- Quantas questões e ano numa linha só.
- O texto do material fica recolhido em "Ver e editar o texto", com o
  tamanho no resumo. Abre sozinho quando há problema (curto demais ou
  longo demais).
- O botão de gerar fica numa barra presa ao pé, com a estimativa ao lado.

**Revisar**
- Nome, matéria e cor editáveis no topo (ver item 2).
- Depois de salvo, a barra do pé oferece "Novo jogo".

**Lembrado entre criações:** o ano.

## Fora do escopo

- Mudar a função de servidor ou o prompt do plano: tudo aqui é da tela.
- Cor personalizada livre (seletor de cor): oito cores bastam e passam no
  contraste.
- Dark mode da capa diferente do resto: a capa usa a cor sólida com texto
  branco, como a faixa do jogo.

## Como saber que funcionou

`teste/casos/gerar.js` e `teste/casos/perfis.js` cobram:

- matéria "História" dá laranja; escolher roxo fica roxo mesmo trocando a
  matéria; voltar à da matéria desfaz; o conteúdo salvo leva `cor`;
- texto colado com primeira linha de título preenche o nome;
- depois de salvar, material, nome e matéria vazios, ano mantido, e
  salvar de novo ainda atualiza o mesmo jogo;
- tocar no avatar de outro aluno vai para `#jogos`.

`teste/esteira/montar_jogo.test.ts` cobra que a cor guardada chega ao jogo
montado e que uma cor que não está na tabela não chega.


- possiveis nomes:
    - apprend
    - brinxs
    - brinks