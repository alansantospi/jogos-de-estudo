# -*- coding: utf-8 -*-
"""Tira o comprimento como pista da resposta certa.

Eu escrevia a alternativa certa como uma explicação completa e as erradas
como descartes curtos. O resultado media assim: em História a certa era a
mais longa em 70% das questões (o esperado sem viés é 25%), e tinha o dobro
do tamanho médio das erradas. Quem sempre escolhesse a maior acertava 70%
sem saber nada — o jogo premiava a habilidade errada.

O conserto é de conteúdo, não de código: a certa encolhe para o essencial
(o detalhe vai para a explicação, que já aparece no retorno) e as erradas
sobem para o mesmo registro. `build/medir_alternativas.py` confere.
"""
import io, re

REESCRITA = {
"artes.html": {
 "O que é uma melodia?": {
   "c": "Uma linha de notas organizadas em um ritmo",
   "d": ["O conjunto dos instrumentos juntos",
         "A cor do som de um instrumento tocado",
         "O volume com que a música é tocada"]},
 "O que é o ritmo de uma música?": {
   "c": "A ordem do tempo da música",
   "d": ["A cor única de cada instrumento",
         "A união de melodias diferentes",
         "O nome dado ao compositor"]},
 "O que é o timbre?": {
   "c": "A “cor” única de cada instrumento",
   "d": ["A velocidade da música",
         "O número de notas da melodia",
         "O nome que se dá a uma partitura"],
   "e": "É o timbre que faz um violino soar diferente de um piano tocando a mesma nota. O livro também o chama de voz única do instrumento."},
 "Como se chama a área de estudo que ensina a ouvir, ler e escrever música em uma partitura?": {
   "c": "Teoria musical",
   "d": ["Arranjo musical", "Harmonia vocal", "Escala sonora"]},
 "O que os compositores fazem com os sons dos instrumentos ao descrever o Rio Moldava, em Praga?": {
   "c": "Descrevem o movimento das águas",
   "d": ["Usam apenas o silêncio entre as notas",
         "Repetem sempre a mesma nota do início",
         "Cantam a letra que descreve o rio"]},
 "A palavra harmonia vem do grego e significa...": {
   "c": "união, concórdia ou ajuste",
   "d": ["velocidade, pressa e cadência", "cor, brilho e clareza", "força, volume e peso"]},
 "Quando dizemos que uma melodia está harmonizada?": {
   "c": "Quando outras melodias soam bem com ela",
   "d": ["Quando ela é tocada bem alto e rápido",
         "Quando um instrumento sozinho a toca",
         "Quando ela é escrita numa partitura certa"],
   "e": "Harmonia é o encaixe entre as partes: melodias diferentes soando bem junto com a principal."},
 "O que é um arranjo?": {
   "c": "Uma nova roupa para a mesma melodia",
   "d": ["O nome dado à nota mais aguda dela",
         "O tempo que a música inteira dura",
         "O título que a canção recebe no disco"],
   "e": "É uma nova maneira de organizar e vestir a mesma melodia: só com um violão, ou com coral, cordas, percussão e piano."},
 "Segundo o livro, o que pode acontecer se uma única nota ficar fora do lugar?": {
   "c": "Pode mudar a sensação da peça",
   "d": ["Nada muda na música que se ouve",
         "A música fica bem mais rápida",
         "O instrumento sai do tom sozinho"]},
 "O que é uma Pintura Mural?": {
   "c": "Uma arte feita numa parede ou num teto",
   "d": ["Um quadro pequeno pintado sobre uma tela",
         "Um desenho feito numa folha de papel",
         "Uma escultura talhada em pedra dura"],
   "e": "É arte de grande escala, em parede, teto ou grande painel, quase sempre em local público — obra permanente, pensada para embelezar espaços."},
 "Por que a Pintura Mural é considerada um ato de vocação e serviço?": {
   "c": "Porque o artista a cria para a comunidade",
   "d": ["Porque o artista ganha muito dinheiro",
         "Porque é mais fácil que pintar em tela",
         "Porque fica pronta em pouco tempo"],
   "e": "O artista não a cria para si, mas para a comunidade e para a história."},
 "Qual é a condição essencial da técnica do afresco?": {
   "c": "O gesso precisa estar úmido",
   "d": ["A parede precisa estar totalmente seca",
         "Só pode ser feita durante a noite",
         "A tinta precisa ser misturada com óleo"],
   "e": "A pintura só pode ser aplicada enquanto o gesso está úmido. Por isso a técnica exige preparação meticulosa e é uma corrida contra o tempo."},
 "A que altura ficava o teto da Capela Sistina?": {
   "c": "A mais de 20 metros",
   "d": ["A pouco mais de 3 metros", "A quase 100 metros", "A menos de 5 metros"]},
 "Como Michelangelo pintava o teto?": {
   "c": "Em pé sobre um andaime",
   "d": ["Deitado de costas no andaime",
         "Sentado em uma cadeira alta",
         "Pendurado por cordas"],
   "e": "É um engano comum imaginar que ele pintava deitado: pintava em pé, num andaime que ele mesmo projetou, com a cabeça inclinada para trás."},
 "Qual é o afresco mais famoso do teto da Capela Sistina?": {
   "c": "A Criação de Adão",
   "d": ["O Juízo Final", "A Última Ceia", "A Pietà"],
   "e": "Nela, Deus e Adão estendem as mãos. Faz parte dos três painéis centrais, que retratam a história de Adão e Eva."},
 "O que Michelangelo pintou na parede do altar da Capela Sistina?": {
   "c": "O Juízo Final",
   "d": ["A Criação de Adão", "A história de Noé", "A Última Ceia"]},
 "Por que a pintura da Capela Sistina é uma das obras mais importantes da história da arte?": {
   "c": "Pela inovação técnica e a extensão da obra",
   "d": ["Porque foi a pintura mais rápida já feita",
         "Porque usou tintas coloridas pela primeira vez",
         "Porque foi pintada por vários artistas juntos"],
   "e": "O livro aponta três motivos: a inovação técnica, a extensão da obra e o domínio em retratar a forma humana."},
},
"historia.html": {
 # --- a certa era a única alternativa afirmativa ---------------------------
 "Qual era uma das principais funções do Almanaque Laemmert?": {
   "c": "Divulgar informações úteis do dia a dia",
   "d": ["Publicar histórias de ficção para crianças", "Ensinar conteúdos religiosos",
         "Registrar acontecimentos de outros países"],
   "e": "Trazia calendários, endereços de lojas, nomes de autoridades e anúncios."},
 "Que tipos de texto a imprensa passou a produzir naquela época?": {
   "c": "Literatura, textos religiosos e registros",
   "d": ["Jornais diários do governo", "Livros escolares e cartilhas",
         "Documentos oficiais do governo"]},
 "Por que boa parte da população não se informava pelos jornais naquela época?": {
   "c": "Poucas pessoas sabiam ler e os jornais eram caros",
   "d": ["Os jornais circulavam pela corte", "A leitura era proibida aos moradores",
         "As pessoas preferiam as notícias faladas"]},
 "A Libras e o Braille são importantes tecnologias de comunicação porque...": {
   "c": "dão a surdos e cegos acesso à informação e à participação na sociedade",
   "d": ["servem para ensinar línguas estrangeiras",
         "substituem a escrita comum nas escolas",
         "foram criadas para uso dos professores"]},
 "Como a Libras e o Braille estão presentes no mundo digital?": {
   "c": "Em leitores de tela e em vídeos",
   "d": ["Em livros impressos em papel", "Em escolas especializadas",
         "Em legendas de filmes antigos"],
   "e": "Há programas que transformam texto em áudio e vídeos com tradutores de Libras."},
 "Antes da prensa de tipos móveis, como os livros eram produzidos?": {
   "c": "Copiados à mão, um a um, por escribas",
   "d": ["Impressos em máquinas a vapor", "Comprados prontos da Alemanha",
         "Gravados em placas de metal por máquinas"]},
 "O que são os tipos móveis?": {
   "c": "Peças de metal com uma letra em relevo",
   "d": ["Folhas de papel já impressas na Alemanha", "Tintas de várias cores para o papel",
         "Máquinas movidas a vapor e a carvão"]},
 "Antes de 1808, o que era proibido no Brasil Colônia?": {
   "c": "Ter máquinas de impressão",
   "d": ["Ler qualquer livro estrangeiro", "Escrever cartas para Portugal",
         "Falar português na rua"]},
 "Quem governava de fato Portugal, no lugar da rainha doente?": {
   "c": "O príncipe D. João",
   "d": ["O imperador D. Pedro I", "Napoleão Bonaparte", "O Papa Júlio II"]},
 "O que motivou a transferência da família real portuguesa para o Brasil?": {
   "c": "As guerras na Europa e a ameaça de invasão",
   "d": ["A falta de saneamento básico no Rio de Janeiro",
         "O Brasil já ser a capital do Reino Unido",
         "A vontade do rei de conhecer o Brasil"],
   "e": "As guerras na Europa e a ameaça de invasão por exércitos estrangeiros levaram a corte a atravessar o Atlântico."},
 "Quando a família real partiu do porto de Lisboa?": {
   "c": "Em 29 de novembro de 1807",
   "d": ["Em 8 de março de 1808", "Em 13 de maio de 1808", "Em 29 de dezembro de 1807"]},
 "Quando a família real chegou ao Rio de Janeiro?": {
   "c": "Em 8 de março de 1808",
   "d": ["Em 29 de novembro de 1807", "Em 13 de maio de 1814", "Em 7 de setembro de 1822"]},
 "O que foi a Impressão Régia?": {
   "c": "A primeira gráfica oficial do Brasil",
   "d": ["A primeira escola oficial do Brasil", "O primeiro jornal impresso do Brasil",
         "A primeira biblioteca pública do Brasil"]},
 "Qual foi uma consequência da criação da Impressão Régia?": {
   "c": "Livros e jornais passaram a ser impressos aqui",
   "d": ["A comunicação entre as pessoas passou a ser proibida",
         "Os livros deixaram de ser utilizados no Brasil",
         "As máquinas de impressão foram retiradas do Brasil"]},
 "Qual foi o primeiro jornal produzido no Brasil?": {
   "c": "A Gazeta do Rio de Janeiro",
   "d": ["O Jornal do Commercio do Rio", "O Spectador Brasileiro", "A Revista Tico-tico"]},
 "Qual famoso livro de poemas foi impresso naquela época?": {
   "c": "Marília de Dirceu, de Tomás Gonzaga",
   "d": ["Memórias Póstumas, de Machado de Assis", "Iracema, de José de Alencar",
         "Os Sertões, de Euclides da Cunha"]},
 "O que são fontes históricas?": {
   "c": "Materiais do passado que sobraram",
   "d": ["Livros escritos por historiadores hoje", "Apenas documentos oficiais do governo",
         "Somente fotografias muito antigas"],
   "e": "Jornais, cartas e almanaques ajudam a conhecer como as pessoas viviam."},
 "Segundo o glossário, o que é uma Gazeta?": {
   "c": "Uma revista com notícias",
   "d": ["Uma carta oficial do rei", "Um tipo de máquina de impressão",
         "Um livro de poemas antigos"]},
 "Segundo o glossário, o que envolve o saneamento básico?": {
   "c": "Água, esgoto e coleta de lixo",
   "d": ["Apenas a coleta de lixo das ruas", "Apenas a iluminação das ruas",
         "O transporte público da cidade"],
   "e": "Inclui ainda a limpeza urbana e as soluções contra alagamentos."},
 "No século XIX, o que passou a ser necessário para uma carta ser entregue?": {
   "c": "O pagamento de uma taxa, provado pelo selo",
   "d": ["A assinatura do rei no envelope", "Uma autorização da igreja",
         "Levar a carta pessoalmente"]},
 "Qual era a função do selo no sistema de correios?": {
   "c": "Comprovar o pagamento do envio",
   "d": ["Decorar o envelope da carta", "Indicar quem escreveu a carta",
         "Substituir o endereço do destino"]},
 "O que é o Código Morse?": {
   "c": "Um alfabeto de pontos e traços",
   "d": ["Um tipo de selo postal antigo", "Uma máquina de escrever",
         "Uma língua feita de sinais"]},
 "Antes do telégrafo, de que dependia a mensagem mais rápida do mundo?": {
   "c": "Da velocidade de um cavalo",
   "d": ["Da eletricidade das cidades", "Do rádio de ondas curtas", "Dos correios aéreos"]},
 "Quem inventou o telefone?": {
   "c": "Alexander Graham Bell",
   "d": ["Samuel Finley Morse", "Thomas Alva Edison", "Alberto Santos Dumont"]},
 "Qual foi a grande novidade do telefone em relação ao telégrafo?": {
   "c": "Permitia ouvir a voz da outra pessoa",
   "d": ["Era bem mais barato que o telégrafo", "Funcionava sem precisar de eletricidade",
         "Enviava imagens junto com o som"]},
 "Qual era a principal dificuldade dos primeiros telefones?": {
   "c": "Dependiam de fios que se rompiam",
   "d": ["Eram grandes demais para caber em casa", "Só funcionavam durante a noite",
         "Precisavam de selo para cada ligação"],
   "e": "Os fios também não alcançavam lugares muito distantes."},
 "O que é a radiotelegrafia?": {
   "c": "Código Morse pelo ar",
   "d": ["Enviar cartas por avião", "Transmitir imagens por cabo", "Gravar sons em disco"],
   "e": "São mensagens em Código Morse enviadas por ondas de rádio, sem fio nenhum."},
 "O prefixo “tele”, de telefone e televisão, vem do grego e significa...": {
   "c": "distância",
   "d": ["som", "imagem", "rapidez"]},
 "Qual descoberta científica foi essencial para o telégrafo, o rádio e a TV funcionarem?": {
   "c": "A eletricidade",
   "d": ["O telefone fixo", "A locomotiva", "A fotografia"]},
 "Em que período surgiu a câmera fotográfica?": {
   "c": "Entre 1827 e 1839",
   "d": ["No século XV, com Gutenberg", "No início do século XX", "Na década de 1950"],
   "e": "Foi na primeira metade do século XIX."},
 "Como o cinema criou a sensação de que as pessoas estavam se movendo na tela?": {
   "c": "Projetando fotos em sequência rápida",
   "d": ["Usando espelhos que giravam rápido", "Transmitindo sinais elétricos",
         "Desenhando quadro a quadro"]},
 "Qual é a diferença principal entre o cinema e a televisão?": {
   "c": "O cinema projeta; a TV transmite para casa",
   "d": ["O cinema é colorido e a TV é preto e branco",
         "A TV é bem mais antiga que o cinema", "O cinema não tem som e a TV tem"],
   "e": "O cinema projeta filmes numa tela grande; a TV leva som e imagem por sinais elétricos para dentro das casas."},
 "Quais dois elementos eram fundamentais para a televisão funcionar?": {
   "c": "Eletricidade e câmera de vídeo",
   "d": ["O papel e a tinta", "O selo e o serviço de correio",
         "O telefone e o rádio de pilha"]},
 "Quando surgiram os primeiros aparelhos de televisão, as “TVs de tubo”?": {
   "c": "Por volta de 1907",
   "d": ["Por volta de 1827", "Na década de 1960", "Na década de 1980"]},
 "Qual é a diferença entre a função da câmera de vídeo e a do televisor?": {
   "c": "A câmera grava; o televisor exibe",
   "d": ["As duas fazem exatamente a mesma coisa", "A câmera exibe e o televisor grava",
         "Nenhuma das duas precisa de eletricidade"]},
 "Até a década de 1950, como se fazia uma ligação telefônica?": {
   "c": "Falando com uma telefonista",
   "d": ["Digitando o número no celular", "Enviando um telegrama antes",
         "Chamando pelo rádio da cidade"],
   "e": "Era a telefonista que conectava manualmente os fios."},
 "O que surgiu a partir da década de 1960 e permitiu ligações entre cidades sem tantos fios?": {
   "c": "As micro-ondas entre torres",
   "d": ["Os satélites de GPS militares", "A fibra óptica dentro de casa",
         "O primeiro telefone celular"]},
 "Em que década e onde nasceu a internet?": {
   "c": "Na década de 1960, nos EUA",
   "d": ["Na década de 1950, no Brasil", "Na década de 1990, na Alemanha",
         "Na década de 1980, no Japão"]},
 "Qual era o objetivo original da internet?": {
   "c": "Manter os computadores conectados",
   "d": ["Vender produtos pela rede", "Transmitir programas de televisão",
         "Substituir o telefone fixo"],
   "e": "A ideia era que, se um computador parasse, os outros continuassem conectados."},
 "O que são os protocolos da internet?": {
   "c": "As regras de trânsito dos dados na rede",
   "d": ["Programas que criam imagens e vídeos", "Os cabos que ligam os computadores",
         "As antenas de celular das cidades"],
   "e": "São as regras que garantem que os dados cheguem ao destino correto."},
 "O que fazem os navegadores?": {
   "c": "Traduzem os códigos da rede",
   "d": ["Guardam os arquivos na nuvem", "Conectam os fios na central telefônica",
         "Transmitem sinais de micro-ondas"],
   "e": "Transformam os códigos da rede em imagens e textos que conseguimos ler."},
 "Por que o celular atual é chamado de “dispositivo convergente”?": {
   "c": "Porque reúne vários aparelhos em um",
   "d": ["Porque tem tela colorida e grande", "Porque funciona sem bateria",
         "Porque só serve para conversar"]},
 "O que significa a sigla GPS?": {
   "c": "Global Positioning System",
   "d": ["Grande Painel de Sinais", "Guia de Passagem Segura", "Global Phone Service"],
   "e": "Em português, Sistema de Posicionamento Global."},
 "O que é a “nuvem”?": {
   "c": "Dados guardados na internet",
   "d": ["Uma pasta dentro do celular", "Um tipo de cabo submarino",
         "Um programa de edição de fotos"],
   "e": "Ficam em servidores que podem ser acessados de qualquer lugar."},
 "Qual é a diferença entre um arquivo físico e um arquivo na nuvem?": {
   "c": "O de papel estraga; o da nuvem fica protegido",
   "d": ["O arquivo físico fica guardado na internet",
         "O da nuvem só é lido em dias de chuva",
         "Servidores são pessoas que entregam cartas"]},
 "O que são servidores?": {
   "c": "Computadores que guardam dados",
   "d": ["Pessoas que entregam encomendas", "Antenas de celular nas cidades",
         "Programas de edição de texto"]},
 "Como funciona o sistema Braille?": {
   "c": "Por pontos em relevo, lidos pelo tato",
   "d": ["Por gestos feitos com as mãos", "Por sons em sequência rápida",
         "Por cores diferentes no papel"],
   "e": "É um alfabeto de pontos em relevo, lidos pelo tato."},
 "Quando o Braille chegou ao Brasil e com a fundação de qual instituição?": {
   "c": "Em 1854, com o Instituto Benjamin Constant",
   "d": ["Em 1825, com a Impressão Régia do Rio",
         "Em 1857, com a Biblioteca Nacional de Portugal",
         "Em 2002, com a Lei de Libras no Brasil"]},
 "Em que ano começou a organização da Libras no Brasil?": {
   "c": "1857, ainda no Império",
   "d": ["1825, no Império", "1908, já na República", "2002, já na República"]},
 "O que eram as epístolas bíblicas?": {
   "c": "Cartas às comunidades cristãs",
   "d": ["Livros de leis do Império Romano", "Poemas escritos por Gutenberg",
         "Jornais impressos na Impressão Régia"]},
 "Quantas epístolas são atribuídas ao apóstolo Paulo?": {
   "c": "Treze",
   "d": ["Quinze", "Quatro", "Vinte e uma"]},
},
"exploradores-do-ceu.html": {
 # --- absolutos que eram só enchimento. Onde "sempre" é o próprio equívoco
 #     testado ("a sombra fica sempre igual"), ele fica.
 "Enquanto é dia no Brasil, do outro lado do planeta geralmente é...": {
   "d": ["dia também", "inverno", "verão"]},
 "Por volta do meio-dia, as sombras costumam ficar...": {
   "d": ["mais compridas", "do mesmo tamanho da manhã", "invisíveis no chão"]},
 "Olhar diretamente para o Sol...": {
   "c": "pode machucar os olhos",
   "d": ["é seguro com o céu nublado", "ajuda a enxergar melhor",
         "é perigoso ao entardecer"]},
 "No Brasil, a Lua Quarto Crescente aparece iluminada de que lado?": {
   "d": ["Do lado direito, com formato de “D”", "Por cima, como um arco",
         "Por baixo, como uma tigela"]},
 "No Hemisfério Sul, qual conjunto de estrelas pode servir como referência aproximada para orientação?": {
   "d": ["A Ursa Maior", "O Cinturão de Órion", "A Estrela Polar"]},
 "Os planetas, diferentemente das estrelas...": {
   "c": "não produzem luz própria",
   "d": ["são maiores que as estrelas", "brilham bem mais que o Sol",
         "ficam parados no céu"],
   "e": "Os planetas apenas refletem a luz do Sol."},
 "As estrelas de uma constelação estão realmente próximas umas das outras no espaço?": {
   "c": "Não: a proximidade é aparente",
   "d": ["Sim, estão bem coladas", "Sim, todas à mesma distância",
         "Sim, presas em uma esfera"],
   "e": "A proximidade é só o que se vê daqui da Terra."},
 # --- erradas plausíveis no lugar das caricatas ---------------------------
 "Por que o Sol parece se deslocar pelo céu ao longo do dia?": {
   "d": ["Porque o Sol gira ao redor da Terra todos os dias",
         "Porque a Terra se afasta do Sol durante a tarde",
         "Porque a inclinação do eixo muda ao longo do dia"]},
 "Se a Terra deixasse de girar em torno do próprio eixo, o que aconteceria?": {
   "c": "O dia e a noite não se alternariam",
   "d": ["Nada mudaria no planeta", "O ano ficaria bem mais curto que hoje",
         "As estações do ano deixariam de existir"]},
 "O que significa dizer que o movimento do Sol no céu é “aparente”?": {
   "c": "Quem gira é a Terra, não o Sol",
   "d": ["O Sol dá mesmo uma volta na Terra", "O Sol muda de tamanho durante o dia",
         "O Sol muda de posição em sua própria órbita"]},
 "Ao longo de um mesmo dia, a sombra de um poste...": {
   "d": ["fica sempre igual", "aponta sempre para o norte",
         "muda de posição, mas não de tamanho"]},
 "Qual é o formato da trajetória que a Terra faz ao redor do Sol?": {
   "d": ["Circular perfeita", "Espiral", "Ondulada"]},
 "A posição exata do nascer do Sol é idêntica todos os dias do ano?": {
   "c": "Não, ela muda ao longo do ano",
   "d": ["Sim, é sempre no mesmo ponto", "Muda só nos anos bissextos",
         "Muda só para quem mora perto dos polos"]},
 "De onde vem a luz que ilumina o dia na Terra?": {
   "d": ["Da Lua", "Das estrelas mais distantes", "Do brilho da própria atmosfera"]},
 "Quais duas direções o Sol ajuda a identificar com mais facilidade?": {
   "d": ["Norte e Sul", "Nordeste e Sudoeste", "Noroeste e Sudeste"]},
 "Quais são os quatro pontos cardeais principais?": {
   "d": ["Nordeste, Noroeste, Sudeste e Sudoeste",
         "Norte, Sul, Nordeste e Sudoeste", "Leste, Oeste, Sudeste e Noroeste"]},
 "Qual tecnologia usa sinais de satélites para ajudar na localização?": {
   "d": ["Bússola", "Radar", "Sonar"]},
 "Qual recurso representa lugares e ajuda a localizar posições e direções?": {
   "d": ["Gráfico", "Tabela", "Fotografia"]},
 "A bússola ajuda principalmente a identificar...": {
   "d": ["a fase da Lua", "a altitude do lugar", "a distância percorrida"]},
 "Montanhas, rios e prédios podem ser usados como...": {
   "d": ["pontos cardeais", "linhas imaginárias", "coordenadas geográficas"]},
 "O que é a rosa dos ventos?": {
   "c": "Um desenho que indica as direções",
   "d": ["Um instrumento com agulha magnética", "Um tipo de bússola eletrônica",
         "Uma constelação do hemisfério sul"]},
 "Antes da bússola e do GPS, os navegadores se orientavam bastante...": {
   "c": "pelo Sol e pelas estrelas",
   "d": ["por mapas do fundo do mar", "por satélites artificiais",
         "pela direção constante dos ventos"]},
 "Por que um mês lunar tem cerca de 29 dias?": {
   "c": "É o tempo de um ciclo completo de fases",
   "d": ["É o tempo da volta da Lua ao redor do Sol",
         "É o tempo que a Lua leva para girar no próprio eixo",
         "É o número fixo de dias de todos os meses"]},
 "Por que as estrelas parecem mudar de posição ao longo da noite?": {
   "d": ["Porque todas as estrelas orbitam a Terra em uma noite",
         "Porque as estrelas se movem rápido no espaço",
         "Porque a atmosfera desvia a luz delas"]},
 "Por que a Lua brilha no céu?": {
   "d": ["Porque produz luz própria como o Sol", "Porque é feita de rocha clara que brilha",
         "Porque é iluminada pelas estrelas distantes"]},
 "Qual instrumento ajuda a observar melhor os astros distantes?": {
   "d": ["O periscópio", "O microscópio", "O caleidoscópio"]},
 "Qual instrumento foi muito usado nas grandes navegações marítimas?": {
   "d": ["O telescópio de mão", "A bússola solar", "O barômetro de mercúrio"]},
 "O que a bússola e o sextante têm em comum?": {
   "c": "Os dois ajudam a se orientar",
   "d": ["Os dois usam ímãs", "Os dois medem distâncias", "Os dois precisam ver o céu"]},
 "Saber em que hemisfério você está ajuda a...": {
   "c": "escolher a referência certa no céu",
   "d": ["mudar a direção do norte magnético", "usar o mesmo mapa em qualquer lugar",
         "saber a hora exata do nascer do Sol"]},
 # --- a certa era a única alternativa afirmativa ---------------------------
 "Por que é útil conhecer mais de uma forma de se orientar?": {
   "c": "Porque cada recurso pode falhar",
   "d": ["Porque funcionam de maneiras iguais", "Porque a bússola é a mais confiável",
         "Porque orientar-se ficou mais simples hoje"]},
 "As estrelas são corpos celestes que...": {
   "c": "emitem sua própria luz",
   "d": ["refletem a luz da Lua", "recebem luz dos planetas",
         "brilham por causa da atmosfera"]},
 "A rotação é o movimento da Terra em torno de...": {
   "c": "seu próprio eixo",
   "d": ["do Sol e da Lua", "da Lua apenas", "do planeta Marte"]},
 "O eixo de rotação da Terra é...": {
   "c": "inclinado em relação à sua órbita",
   "d": ["perfeitamente vertical o ano todo", "sempre apontado para o Sol",
         "inexistente na prática"]},
 "As estações do ano estão relacionadas principalmente a...": {
   "c": "inclinação do eixo e translação",
   "d": ["distância da Terra até o Sol", "velocidade da rotação da Terra",
         "quantidade de estrelas visíveis"]},
 "Qual é a alternativa CORRETA sobre o Solstício?": {
   "c": "É o dia mais longo do verão",
   "d": ["Acontece a cada quatro anos, no calendário",
         "É quando a Terra fica mais longe do Sol",
         "O dia e a noite duram 12 horas cada"],
   "e": "No solstício o Sol fica mais tempo no céu: é o dia mais longo do verão e a noite mais longa do inverno."},
 "Qual é o principal evento que o movimento de translação ajuda a provocar e que organiza nosso ano?": {
   "c": "As quatro estações do ano",
   "d": ["O caminho do Sol no céu todo dia", "O ciclo das fases da Lua",
         "A existência do dia e da noite"],
   "e": "As estações nascem da translação somada à inclinação do eixo da Terra."},
 "Quando Maiara acorda às 6h no Brasil, sua amiga Ana já está jantando na Coreia do Sul. Por quê?": {
   "c": "Por causa da rotação da Terra",
   "d": ["Porque a Coreia do Sul fica mais perto do Sol",
         "Porque na Coreia do Sul o dia dura menos horas",
         "Porque a Lua ilumina a Coreia do Sul primeiro"],
   "e": "A rotação deixa cada região voltada para o Sol em momentos diferentes."},
 "Por que o Sol some do céu à noite?": {
   "c": "Porque nossa região virou de costas",
   "d": ["Porque ele se apaga à noite", "Porque ele vai para trás da Lua",
         "Porque ele para de brilhar até de manhã"]},
 "Além do Sol, o que também pode servir como referência natural de direção?": {
   "c": "Algumas estrelas e constelações",
   "d": ["As nuvens do fim da tarde", "O vento, que sopra sempre do mesmo lado",
         "A temperatura do ar à noite"]},
 "Em um dia muito nublado, dá para usar o Sol como referência de direção?": {
   "c": "Não, porque ele fica encoberto",
   "d": ["Sim, sempre com precisão total", "Sim, porque as nuvens apontam o leste",
         "Sim, porque o Sol muda de lugar"]},
 "A agulha da bússola se alinha principalmente por causa...": {
   "c": "do campo magnético da Terra",
   "d": ["da luz forte do Sol", "do peso da agulha de metal",
         "do vento que sopra no norte"]},
 "Para que serve a legenda de um mapa?": {
   "c": "Explicar o que os símbolos significam",
   "d": ["Indicar a data em que o mapa foi feito", "Mostrar o preço do mapa na loja",
         "Contar a história do lugar"]},
 "Um amigo diz que a parte escura da Lua é a sombra da Terra. Como corrigir essa informação?": {
   "c": "Ela não está voltada para o Sol",
   "d": ["Ele está certo: é a sombra da Terra", "É a sombra da própria Lua no céu",
         "É uma nuvem que cobre metade dela"]},
 "Quantas fases da Lua são identificadas ao todo?": {
   "c": "Oito ao todo",
   "d": ["Quatro no total", "Duas: cheia e nova", "Vinte e nove, uma por dia"],
   "e": "São oito, mas normalmente só quatro aparecem nos calendários."},
 "A Lua também gira em torno do próprio eixo?": {
   "c": "Sim, e dura o mesmo que a translação",
   "d": ["Não, a Lua não tem rotação", "Sim, e dura 24 horas como a da Terra",
         "Sim, mas dura apenas uma hora"]},
 "Por que o mesmo formato de Lua pode ter nomes diferentes no Brasil e nos Estados Unidos?": {
   "c": "Porque os hemisférios a veem invertida",
   "d": ["Porque a Lua muda de fase mais rápido no Norte",
         "Porque cada país escolheu um nome diferente",
         "Porque nos Estados Unidos a Lua é vista de cabeça para baixo o tempo todo"]},
 "Como se chama o movimento da Lua ao redor da Terra?": {
   "c": "Revolução",
   "d": ["Rotação", "Nutação", "Precessão"],
   "e": "Revolução — que o livro também chama de translação da Lua."},
 "Por que vemos sempre a mesma face da Lua?": {
   "c": "Porque rotação e revolução duram igual",
   "d": ["Porque a Lua não gira nunca", "Porque a Lua é achatada de um lado",
         "Porque a Terra segura a Lua bem parada"]},
 "Como era formado o ano do calendário egípcio?": {
   "c": "12 meses de 30 dias e 5 de festa",
   "d": ["10 meses de 36 dias e 5 de festa", "13 meses de 28 dias e 1 de festa",
         "12 meses de 31 dias, sem festa"]},
 "O que é uma constelação?": {
   "c": "Um agrupamento aparente de estrelas",
   "d": ["Um único planeta muito brilhante", "Uma nuvem que cobre as estrelas",
         "Um satélite artificial em órbita"]},
 "Qual ambiente favorece melhor a observação das estrelas?": {
   "c": "Um local escuro, longe das luzes",
   "d": ["Uma rua com muitos refletores", "Um shopping muito iluminado",
         "Um estádio com as luzes acesas"]},
 "Por que não enxergamos estrelas durante o dia?": {
   "c": "Porque a luz do Sol as ofusca",
   "d": ["Porque elas se apagam de dia", "Porque vão para o outro lado",
         "Porque a Lua as esconde"]},
 "O que ajuda a observar bem o céu noturno a olho nu?": {
   "c": "Céu limpo e local escuro",
   "d": ["Um dia bem ensolarado", "Muitas luzes acesas ao redor",
         "Um local fechado sem janelas"],
   "e": "Ajuda também dar alguns minutos para os olhos se acostumarem ao escuro."},
 "Por que as constelações visíveis mudam ao longo do ano?": {
   "c": "Porque a Terra muda de posição",
   "d": ["Porque as estrelas somem e voltam", "Porque as constelações trocam de nome",
         "Porque o céu muda de cor"],
   "e": "A Terra ocupa posições diferentes em sua órbita ao redor do Sol."},
 "Estrelas podem ter cores diferentes. Isso está relacionado principalmente...": {
   "c": "à temperatura de suas superfícies",
   "d": ["ao tamanho da Lua cheia", "à distância até o Brasil",
         "à quantidade de nuvens no céu"]},
 "Por que a Estrela Polar parece quase parada no céu durante a noite?": {
   "c": "Porque fica alinhada com o eixo",
   "d": ["Porque é a mais brilhante do céu", "Porque está muito perto da Terra",
         "Porque na verdade é um satélite"]},
 "O gnômon é basicamente...": {
   "c": "uma haste fincada no chão",
   "d": ["um tipo de bússola eletrônica", "um telescópio bem pequeno",
         "um mapa muito antigo"],
   "e": "É a haste que projeta sombra no chão."},
 "Em um dia totalmente nublado, o gnômon...": {
   "c": "não funciona, falta sombra",
   "d": ["funciona melhor que nunca", "passa a indicar o norte",
         "mostra as estrelas do céu"]},
 "Qual instrumento usa a sombra do Sol para mostrar as direções e ajudar a medir o tempo, como um relógio solar?": {
   "c": "O gnômon, que observa a sombra",
   "d": ["O astrolábio, com discos que seguem o Sol",
         "A bússola, com a sombra da agulha",
         "O sextante, que mede o ângulo da sombra"]},
 "A bússola funciona de forma diferente do astrolábio e do sextante. Qual é a principal diferença?": {
   "c": "A bússola usa o campo magnético",
   "d": ["Os outros medem a profundidade do oceano",
         "Os outros medem o tempo de viagem",
         "Os outros mostram todas as direções"],
   "e": "O astrolábio e o sextante usam a posição das estrelas; a bússola, o campo magnético da Terra."},
 "A linha do Equador divide a Terra em...": {
   "c": "Hemisfério Norte e Hemisfério Sul",
   "d": ["Hemisfério Leste e Hemisfério Oeste", "parte de dia e parte de noite",
         "lado de verão e lado de inverno"]},
 "Quem mora perto da linha do Equador percebe...": {
   "c": "pouca diferença na duração do dia",
   "d": ["seis meses de noite seguidos", "quatro estações muito marcadas",
         "o Sol a pino à meia-noite"]},
},
}

def _sem_repetidas(pares):
    """Chave repetida num dicionário literal se sobrescreve em silêncio.
    Já engoliu 11 reescritas aqui; agora derruba o build."""
    visto = {}
    for k, v in pares:
        assert k not in visto, "pergunta repetida na tabela: %r" % k[:70]
        visto[k] = v
    return visto


PERG = re.compile(r'(?<![a-z])q:"((?:[^"\\]|\\.)*)"')


def _troca(linha, chave, valor):
    if chave == "d":
        novo = "d:[" + ",".join('"%s"' % v for v in valor) + "]"
        pad = re.compile(r'(?<![a-z])d:\[.*?\]')
    else:
        novo = '%s:"%s"' % (chave, valor)
        pad = re.compile(r'(?<![a-z])%s:"(?:[^"\\]|\\.)*"' % chave)
    assert len(pad.findall(linha)) == 1, "campo %s ambíguo em %r" % (chave, linha[:70])
    return pad.sub(lambda m: novo, linha, count=1)


# As tabelas são lidas de novo a partir do próprio arquivo para pegar chave
# repetida, que o interpretador já teria descartado em silêncio.
import ast as _ast
for _no in _ast.walk(_ast.parse(io.open(__file__, encoding='utf-8').read())):
    if isinstance(_no, _ast.Assign) and getattr(_no.targets[0], 'id', '') == 'REESCRITA':
        for _jogo, _tab in zip(_no.value.keys, _no.value.values):
            _sem_repetidas([(k.value, None) for k in _tab.keys])

for arq, tabela in REESCRITA.items():
    s = io.open(arq, encoding="utf-8").read()
    i = s.index("const bank="); j = s.index("\n};", i) + 3
    linhas = s[i:j].split("\n")
    feitos = set()
    for n, l in enumerate(linhas):
        m = PERG.search(l)
        if not m or m.group(1) not in tabela:
            continue
        for chave, valor in tabela[m.group(1)].items():
            l = _troca(l, chave, valor)
        linhas[n] = l
        feitos.add(m.group(1))
    faltam = set(tabela) - feitos
    assert not faltam, "%s: nao achei %d pergunta(s): %r" % (arq, len(faltam), list(faltam)[:2])
    io.open(arq, "w", encoding="utf-8").write(s[:i] + "\n".join(linhas) + s[j:])
    print("  %-24s %d questoes reescritas" % (arq.replace(".html", ""), len(feitos)))
