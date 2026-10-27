# -*- coding: utf-8 -*-
"""Monta `termos.html` e `privacidade.html`.

Quem responde pelo serviço aparece nas duas páginas, e o cadastro registra
o aceite de uma versão (`VERSAO`, igual a TERMOS_VERSAO em `_conta.js` e a
termos_versao() na migração beta_fechado). Os dados do responsável moram
AQUI, num lugar só: enquanto houver [colchetes], o build avisa.

Este texto é um ponto de partida para o beta fechado, escrito para o que o
código faz hoje. Antes de abrir o cadastro ao público, ele precisa da
leitura de um advogado.
"""
import io, os, re, sys

RAIZ = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

RESPONSAVEL = {
    "nome": "[NOME COMPLETO OU RAZÃO SOCIAL]",
    "documento": "[CPF OU CNPJ]",
    "email": "[E-MAIL DE CONTATO]",
    "cidade": "[CIDADE/UF]",
}
VERSAO = "2026-10-27"
VERSAO_TEXTO = "27 de outubro de 2026"

conta = io.open(os.path.join(RAIZ, "build", "_conta.js"), encoding="utf-8").read()
if 'const TERMOS_VERSAO = "%s";' % VERSAO not in conta:
    raise SystemExit("build/legal.py: VERSAO não bate com TERMOS_VERSAO em build/_conta.js")
# A versão que o banco exige é a da migração mais nova que redefine
# termos_versao(): termos novos pedem migração nova, não edição da velha.
PASTA = os.path.join(RAIZ, "supabase", "migrations")
banco = None
for nome in sorted(os.listdir(PASTA)):
    m = re.search(r"function termos_versao\(\).*?select '([^']+)'",
                  io.open(os.path.join(PASTA, nome), encoding="utf-8").read(), re.S)
    if m:
        banco = m.group(1)
if banco != VERSAO:
    raise SystemExit("build/legal.py: VERSAO %s não bate com termos_versao() das migrações (%s)" % (VERSAO, banco))

R = RESPONSAVEL
QUEM = "%s (%s), de %s" % (R["nome"], R["documento"], R["cidade"])
CONTATO = '<a href="mailto:%s">%s</a>' % (R["email"], R["email"])

TERMOS = """
<h1>Termos de uso</h1>
<p class="versao">Versão de {versao}. Teste fechado.</p>

<h2>1. O que é</h2>
<p>Jogos de Estudo é um conjunto de jogos de revisão para alunos do Ensino
Fundamental. Os jogos prontos são abertos a qualquer pessoa, sem conta. A
<b>conta</b> serve para sincronizar o progresso entre aparelhos e para
<b>criar jogos</b> a partir de material de estudo enviado por quem a usa.
O serviço é oferecido por {quem}. Contato: {contato}.</p>

<h2>2. Teste fechado</h2>
<p>O cadastro está aberto só a quem recebeu um código de convite. É uma
fase de teste: o serviço pode mudar, ficar fora do ar, ter limites diários
diferentes ou ser encerrado. Enquanto durar o teste, ele é gratuito. Se
passar a ser pago, isso será avisado antes, e nada será cobrado sem a sua
concordância.</p>

<h2>3. Quem pode ter conta</h2>
<p>A conta é de um <b>adulto</b>: o responsável pela criança ou o
professor. A criança joga dentro da conta, num perfil com o nome ou apelido
que o adulto escolher, sem e-mail nem senha própria. Ao criar a conta, você
declara ter 18 anos ou mais.</p>

<h2>4. O material que você envia</h2>
<ul>
<li>Você só deve enviar material que tenha o direito de usar: o seu
próprio resumo, a folha de revisão da escola, páginas do livro que o aluno
usa, para estudo dele.</li>
<li>Os jogos criados são para <b>uso pessoal ou de sala de aula</b>. Não
os venda nem os publique abertamente se o material for de terceiros, como
um livro didático.</li>
<li>O <b>link de compartilhar</b> deixa qualquer pessoa que o tenha jogar
aquele jogo. Mande-o só a quem vai jogar, e desligue-o quando não precisar
mais. Você responde pelo que compartilha.</li>
<li>Não envie fotos de pessoas, documentos, dados de saúde nem nada além
do conteúdo a estudar.</li>
</ul>

<h2>5. As questões são feitas por inteligência artificial</h2>
<p>As questões e a lição de um jogo criado são escritas por um modelo de
inteligência artificial a partir do material enviado, e conferidas
automaticamente contra ele. Ainda assim, <b>podem conter erros</b>. Por
isso cada questão passa pela sua revisão antes de entrar no jogo: aprovar
é responsabilidade de quem cria.</p>

<h2>6. Limites de uso</h2>
<p>Cada conta pode criar um número limitado de jogos por dia, e há um teto
de gasto para todas as contas juntas. É proibido tentar contornar esses
limites, usar o serviço de forma automatizada, ou enviar material com
instruções para o modelo fazer outra coisa que não questões de estudo.
Contas que fizerem isso podem ser suspensas.</p>

<h2>7. Encerrar a conta</h2>
<p>Você pode apagar qualquer jogo a qualquer momento, em Meus jogos. Para
apagar a conta inteira, escreva para {contato}; os dados saem em até 15
dias, como diz a <a href="privacidade.html">política de privacidade</a>.
Nós podemos encerrar o teste ou uma conta que viole estes termos, com aviso
por e-mail quando possível.</p>

<h2>8. Responsabilidade</h2>
<p>O serviço é oferecido como está, durante um teste. Não garantimos que
fique sempre no ar nem que o conteúdo gerado esteja livre de erros. Os
jogos são um apoio ao estudo, não substituem a escola nem o professor.</p>

<h2>9. Mudanças</h2>
<p>Quando estes termos mudarem de forma relevante, avisaremos por e-mail
ou na própria página, e a data no topo muda.</p>

<h2>10. Lei e foro</h2>
<p>Valem as leis do Brasil, incluindo o Código de Defesa do Consumidor e a
Lei Geral de Proteção de Dados (Lei 13.709/2018).</p>
"""

PRIVACIDADE = """
<h1>Política de privacidade</h1>
<p class="versao">Versão de {versao}. Teste fechado.</p>

<p>Esta política diz quais dados o Jogos de Estudo trata, para quê, com
quem eles são compartilhados e como você os apaga. O controlador dos dados
é {quem}. Para qualquer pedido sobre os seus dados, inclusive os previstos
no artigo 18 da LGPD: {contato}.</p>

<h2>Sem conta</h2>
<p>Quem só joga, sem conta, não envia nada a ninguém: o progresso e os
perfis ficam no próprio aparelho (no armazenamento do navegador). Não
usamos cookies de publicidade nem ferramentas de rastreamento.</p>

<h2>Com conta: o que guardamos</h2>
<table>
<thead><tr><th>dado</th><th>para quê</th><th>base legal</th></tr></thead>
<tbody>
<tr><td>E-mail e senha (a senha guardada cifrada)</td><td>entrar na conta</td><td>execução do contrato</td></tr>
<tr><td>Código de convite usado, versão e data do aceite destes termos</td><td>provar o aceite e controlar o teste</td><td>execução do contrato</td></tr>
<tr><td>Nomes ou apelidos dos perfis, progresso e histórico de acertos e erros</td><td>sincronizar entre aparelhos</td><td>execução do contrato; para os dados da criança, o consentimento do responsável (art. 14 da LGPD)</td></tr>
<tr><td>Material enviado (texto, fotos, PDF) e os jogos criados</td><td>gerar as questões, e reconferir a questão que você edita</td><td>execução do contrato</td></tr>
<tr><td>Registro de cada geração: data, tamanho do material, custo, erro</td><td>aplicar os limites diários e cuidar do custo</td><td>legítimo interesse</td></tr>
</tbody>
</table>

<h2>Dados de crianças</h2>
<p>A conta é sempre de um adulto. O perfil da criança é só um nome ou
apelido, escolhido por ele, e não precisa ser o nome verdadeiro; não
pedimos idade, escola, foto, nem contato da criança. O que se guarda dela
é o desempenho nos jogos, para o próprio responsável acompanhar. Esses
dados nunca são usados para publicidade nem vendidos.</p>

<h2>Com quem compartilhamos</h2>
<ul>
<li><b>Supabase</b>, onde ficam a conta e o banco de dados.</li>
<li><b>Anthropic</b>, que fornece o modelo de inteligência artificial. O
material que você envia para criar um jogo vai para a Anthropic, nos
Estados Unidos, só para gerar as questões. Pela política comercial dela,
esse conteúdo não é usado para treinar modelos. É uma transferência
internacional de dados (art. 33 da LGPD), feita para executar o serviço que
você pediu.</li>
<li><b>Google</b>, só se você escolher entrar com a conta Google.</li>
<li>Quem tiver o <b>link de compartilhar</b> de um jogo vê as questões e a
lição daquele jogo, com os trechos do material que cada uma cita, e nada
mais: nem o material inteiro, nem a conta.</li>
</ul>
<p>Não vendemos dados e não os passamos a mais ninguém, salvo por ordem
judicial.</p>

<h2>Por quanto tempo</h2>
<p>Enquanto a conta existir. Apagar um jogo o apaga do banco na hora. Ao
pedir para apagar a conta, a conta, os perfis, o progresso, os jogos e o
material saem em até 15 dias. O registro de gerações e de aceite pode ser
guardado por até 6 meses depois, para cumprir obrigação legal ou defender
direitos.</p>

<h2>Seus direitos</h2>
<p>Você pode pedir a qualquer momento: confirmação de que tratamos seus
dados, acesso a eles, correção, cópia, apagamento, e revogar o
consentimento. Escreva para {contato}; respondemos em até 15 dias. Você
também pode reclamar à Autoridade Nacional de Proteção de Dados (ANPD).</p>

<h2>Segurança</h2>
<p>O acesso é por conta, e o banco só entrega a cada conta as linhas dela.
A chave do modelo de inteligência artificial fica no servidor, nunca no
navegador. Nenhum sistema é infalível: se houver um incidente que afete os
seus dados, avisaremos você e a ANPD, como a lei manda.</p>

<h2>Mudanças</h2>
<p>Quando esta política mudar de forma relevante, avisaremos por e-mail ou
na própria página, e a data no topo muda.</p>
"""

molde = io.open(os.path.join(RAIZ, "build", "_legal.html"), encoding="utf-8").read()


def pagina(nome, titulo, corpo):
    corpo = corpo.format(versao=VERSAO_TEXTO, quem=QUEM, contato=CONTATO)
    html = molde.replace("%TITULO%", titulo).replace("%CORPO%", corpo)
    io.open(os.path.join(RAIZ, nome), "w", encoding="utf-8").write(html)
    return html


pagina("termos.html", "Termos de uso", TERMOS)
pagina("privacidade.html", "Política de privacidade", PRIVACIDADE)
falta = "preencher " + ", ".join(k for k, v in R.items() if re.match(r"^\[.*\]$", v)) \
    if any(re.match(r"^\[.*\]$", v) for v in R.values()) else "responsável preenchido"
print("  %-24s termos e privacidade (%s)" % ("legal", falta))
