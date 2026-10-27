# Beta fechado

O cadastro só aceita quem tem **código de convite** e marca o aceite dos
termos. Quem já tinha conta continua entrando normalmente. A cerca está no
banco (migração `20261030000000_beta_fechado.sql`), não só na tela: a chave
pública está no HTML, e qualquer um poderia chamar o cadastro direto.

## Antes de mandar o primeiro convite

Na ordem. Nenhum destes passos o código faz por você.

1. **Trocar a senha que está no `.env`.** Ela já esteve na máquina fora do
   cofre; troque no serviço de origem e não a guarde no repositório.
2. **Preencher o responsável** em `build/legal.py` (`RESPONSAVEL`: nome ou
   razão social, CPF ou CNPJ, e-mail, cidade) e rodar `sh build/rebuild.sh`.
   Enquanto houver colchetes, o build avisa "preencher …". As páginas
   `termos.html` e `privacidade.html` são um ponto de partida escrito para
   o que o código faz hoje; **antes de abrir ao público, passe por um
   advogado**.
3. **Supabase no plano pago (Pro).** O gratuito pausa o projeto depois de
   uma semana sem uso e corta a função em 150 s, que um jogo de 200
   questões pode passar.
4. **Ligar a confirmação de e-mail**: **Authentication → Sign In / Providers
   → Email → Confirm email**. Sem ela, qualquer um com um convite cria conta
   com o e-mail de outra pessoa. Confira o **Site URL** (passo 5 do
   `CONTA.md`), senão o link de confirmação cai em localhost.
5. **Limite de gasto mensal na Anthropic** (passo 3 do `GERAR.md`). É a
   única cerca que vale mesmo se a função tiver um defeito.
6. **Aplicar a migração e publicar**, nesta ordem:

   ```sh
   supabase db push
   sh build/rebuild.sh
   supabase functions deploy gerar
   ```

   e publicar o site (o GitHub Pages serve o que estiver na `main`).

7. **Testar com um convite seu**, numa janela anônima: criar a conta,
   confirmar o e-mail, criar um jogo, ligar o link e abri-lo em outro
   aparelho sem conta.

## Criar convites

No **SQL Editor** do Supabase:

```sql
select novo_convite('Família da Ana');        -- um uso
select novo_convite('Turma 4B, prof. Rui', 30); -- até 30 contas
```

Devolve o código (`A1B2-C3D4E5`). Mande junto o endereço do site e diga
para tocar em **Conta → Criar conta**.

Para ver quem usou o quê, e desligar um código:

```sql
select c.codigo, c.nota, c.usos, c.max_usos, c.ativo, count(k.conta) contas
  from convites c left join cadastros k on k.convite = c.codigo
 group by c.codigo order by c.criado desc;

update convites set ativo = false where codigo = 'A1B2-C3D4E5';
```

Desligar um código não apaga as contas criadas com ele.

## Como se comporta

- **Criar conta** pede o código, o e-mail, a senha e o aceite. O banco
  confere o código e a versão do aceite e registra os dois em `cadastros`;
  código errado, esgotado ou desligado desfaz o cadastro.
- O Supabase não diz por que o banco recusou; a tela diz "Conta nova só com
  código de convite válido".
- **Google** não tem onde pôr o código: conta **nova** pelo Google é
  recusada com a mesma mensagem. Quem criou a conta por e-mail entra depois
  pelo Google com o mesmo endereço.
- **Adicionar usuário pelo painel** do Supabase também passa pelo gatilho e
  falha. Para pôr alguém à mão, crie um convite e mande.
- **Mudou o texto dos termos de verdade?** Troque a versão nos três lugares:
  `VERSAO` em `build/legal.py`, `TERMOS_VERSAO` em `build/_conta.js` e
  `create or replace function termos_versao()` numa migração nova. O
  build recusa se as três não baterem.

## O link de jogar sem conta

Em **Meus jogos**, **Compartilhar** liga um link `jogar.html?l=…` para o
jogo. Quem tem o link joga sem entrar, no aparelho dele; não edita, e do
material vê só os trechos que cada questão cita. É para a criança jogar no próprio celular sem a senha da conta,
ou para mandar a um colega.

- O link é um código ao acaso, não o id do jogo. **Desligar link** o apaga:
  o endereço para de abrir, e o jogo guardado no aparelho de quem o abriu
  também deixa de abrir na próxima vez que houver internet.
- Ligar de novo cria um endereço novo.
- Quem abre pelo link tem progresso próprio, separado do da conta.
- Por baixo: a coluna `jogos.link` e a função `jogo_por_link`, que lê por
  cima da RLS só aquela linha, e só título, matéria e conteúdo.

## O que ainda falta para abrir ao público

Fora do beta, de propósito: cobrança, página de apresentação, progresso
dos jogos criados sincronizado entre aparelhos, monitoramento de erro e
domínio próprio. E a revisão jurídica dos termos e da política.
