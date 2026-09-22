# -*- coding: utf-8 -*-
"""Perfis: quem está jogando.

Até aqui o progresso era um só por aparelho — trocar de aluno era apagar o
do anterior. Agora cada perfil tem a sua chave, e a lista de perfis é
compartilhada pelos quatro jogos.

A conta (ver `build/conta.py`) é da família; os perfis são os alunos dentro
dela. Assim a criança não precisa de senha nenhuma e o pai sincroniza uma
vez só.
"""
import io, re, sys
sys.path.insert(0, "build")
import icons

JOGOS = ("historia.html", "artes.html", "exploradores-do-ceu.html",
         "time-travel-english.html")

# Uma cor por perfil, das mesmas que as alternativas usam.
JS = r'''
/* ---------- perfis ---------- */
/* A lista de perfis é a mesma nos quatro jogos e na página inicial. Cada
   perfil tem a sua chave de progresso: trocar de aluno não apaga o do outro. */
const PERFIS_CHAVE = "jogos_perfis_v1";
const PERFIL_ATUAL = "jogos_perfil_atual";
const CORES_PERFIL = ["--alt-1", "--alt-2", "--alt-3", "--alt-4"];

function lerPerfis(){
  try{ return JSON.parse(localStorage.getItem(PERFIS_CHAVE)) || []; }
  catch(e){ return []; }
}
function gravarPerfis(lista){
  try{ localStorage.setItem(PERFIS_CHAVE, JSON.stringify(lista)); }catch(e){}
}
function perfilAtual(){
  const lista = lerPerfis();
  if(!lista.length) return null;
  let id;
  try{ id = localStorage.getItem(PERFIL_ATUAL); }catch(e){}
  return lista.find(p => p.id === id) || lista[0];
}
function trocarPerfil(id){
  try{ localStorage.setItem(PERFIL_ATUAL, id); }catch(e){}
}
function criarPerfil(nome){
  const lista = lerPerfis();
  const p = {id: "p" + Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
             nome: String(nome).trim().slice(0, 16) || "Aluno",
             cor: CORES_PERFIL[lista.length % CORES_PERFIL.length],
             criado: Date.now()};
  lista.push(p); gravarPerfis(lista); trocarPerfil(p.id);
  return p;
}
function inicialDe(nome){ return (nome || "?").trim().charAt(0).toUpperCase(); }

/* A chave de progresso passa a levar o perfil. Sem perfil escolhido, o jogo
   usa a chave antiga — é o progresso que já existia neste aparelho. */
function chaveProgresso(base){
  const p = perfilAtual();
  return p ? base + ":" + p.id : base;
}

/* Primeira vez com perfis: o que já estava salvo vira o perfil inicial, em
   vez de a criança perder tudo o que fez. */
function migrarProgresso(base){
  try{
    const antigo = localStorage.getItem(base);
    if(!antigo) return;
    if(!lerPerfis().length) criarPerfil("Aluno");
    const nova = chaveProgresso(base);
    if(!localStorage.getItem(nova)) localStorage.setItem(nova, antigo);
  }catch(e){}
}
'''

TROCADOR = '''
/* ---------- seletor de perfil no cabeçalho ---------- */
function pintarPerfil(){
  const b = document.getElementById("btnPerfil");
  if(!b) return;
  const p = perfilAtual();
  b.textContent = p ? inicialDe(p.nome) : "?";
  b.style.background = p ? "var(" + p.cor + ")" : "";
  b.setAttribute("aria-label", p ? "Perfil: " + p.nome + ". Trocar de aluno"
                                 : "Escolher quem está jogando");
  b.title = p ? p.nome : "Escolher aluno";
}
function abrirPerfis(){ location.href = "index.html#perfis"; }
addEventListener("DOMContentLoaded", pintarPerfil);
'''

BOTAO = ('<button id="btnPerfil" class="pill perfil-btn" onclick="abrirPerfis()"'
         ' aria-label="Perfil"></button>')

CSS = """
/* ---------- perfil ---------- */
.perfil-btn{
  display:grid;place-items:center;min-width:2.5rem;min-height:2.5rem;padding:0;
  border:2px solid rgba(255,255,255,.55);border-radius:999px;
  background:var(--alt-1);color:#fff;
  font-family:var(--display);font-size:var(--t-md);font-weight:700;line-height:1}
.perfil-btn:hover{border-color:#fff}
"""


def aplicar(arq):
    s = io.open(arq, encoding="utf-8").read()

    # a chave de progresso passa a considerar o perfil
    m = re.search(r'const (STORE(?:_KEY)?)="([^"]+)"', s)
    assert m, "%s: nao achei a chave de progresso" % arq
    nome, valor = m.group(1), m.group(2)
    s = (s[:m.start()]
         + 'const %s_BASE="%s";\nconst %s=(migrarProgresso("%s"), chaveProgresso("%s"))'
           % (nome, valor, nome, valor, valor)
         + s[m.end():])

    # o botão de perfil, junto dos outros do cabeçalho
    m = re.search(r'<button id="btnTela".*?</button>', s, re.S)
    assert m, "%s: nao achei o botao de tela cheia" % arq
    s = s[:m.end()] + BOTAO + s[m.end():]

    s = s.replace("</style>", CSS + "</style>", 1)

    # o JS de perfil precisa vir ANTES da declaração da chave
    m = re.search(r'<script>\n(?=const FORMAS)', s)
    assert m, "%s: nao achei o inicio do script" % arq
    s = s[:m.end()] + JS + s[m.end():]

    ancora = "</script>\n</body>" if "</script>\n</body>" in s else "</script></body>"
    s = s.replace(ancora, TROCADOR + ancora)

    io.open(arq, "w", encoding="utf-8").write(s)
    print("  %-24s perfis" % arq.replace(".html", ""))


for arq in JOGOS:
    aplicar(arq)
