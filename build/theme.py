# -*- coding: utf-8 -*-
"""Sistema visual compartilhado pelos jogos: tokens, tipografia e ícones.

Direção: o caderno da aluna. Papel levemente azulado (nunca creme), pauta
discreta, tinta como cor de ação. Registro de produto: uma escala fixa, cor
restrita e nenhum ornamento que não comunique estado.
"""

FONTS = ('<link rel="preconnect" href="https://fonts.googleapis.com">'
         '<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>'
         '<link rel="stylesheet" href="https://fonts.googleapis.com/css2?'
         'family=Source+Serif+4:opsz,wght@8..60,400;8..60,600;8..60,700&'
         'family=Atkinson+Hyperlegible:wght@400;700&display=swap">')

# Cor de cada matéria: caneta que um estudante realmente tem no estojo.
MATERIAS = {
    "ingles":   "oklch(0.47 0.15 258)",   # azul esferográfica
    "ciencias": "oklch(0.46 0.11 192)",   # verde-azulado
    "historia": "oklch(0.45 0.15 28)",    # vermelho-vinho
    "arte":     "oklch(0.47 0.16 312)",   # violeta
}

def css(materia: str) -> str:
    return """
:root{
  color-scheme:light dark;

  /* Papel: quase branco com um desvio de croma para o AZUL da tinta.
     Nunca creme — o caderno brasileiro é branco-azulado, não pergaminho. */
  --paper:        oklch(0.988 0.003 255);
  --paper-sunken: oklch(0.966 0.005 255);
  --surface:      oklch(1 0 0);
  --rule:         oklch(0.885 0.010 255);
  --rule-soft:    oklch(0.940 0.010 255);
  --pauta:        oklch(0.930 0.016 255);

  --ink:       oklch(0.26 0.021 262);   /* grafite escuro, levemente azul */
  --ink-soft:  oklch(0.46 0.018 262);   /* 4.9:1 no papel */
  --ink-faint: oklch(0.60 0.014 262);   /* só para texto grande */

  --materia:      %MATERIA%;
  --materia-tint: color-mix(in oklch, var(--materia) 9%, var(--surface));
  --materia-edge: color-mix(in oklch, var(--materia) 32%, var(--rule));

  --certo:       oklch(0.44 0.12 152);
  --certo-tint:  oklch(0.955 0.030 152);
  --errado:      oklch(0.48 0.17 25);
  --errado-tint: oklch(0.960 0.028 25);

  --sans:'Atkinson Hyperlegible',ui-sans-serif,system-ui,-apple-system,Segoe UI,Roboto,sans-serif;
  --serif:'Source Serif 4',ui-serif,Georgia,'Times New Roman',serif;

  /* Escala fixa, razão ~1.2 — registro de produto não usa tipografia fluida. */
  --t-xs:0.75rem; --t-sm:0.875rem; --t-md:1rem; --t-lg:1.125rem;
  --t-xl:1.375rem; --t-2xl:1.625rem; --t-3xl:2rem;

  --s-1:0.25rem; --s-2:0.5rem; --s-3:0.75rem; --s-4:1rem;
  --s-5:1.5rem; --s-6:2rem; --s-7:3rem; --s-8:4rem;

  --r-sm:3px; --r-md:6px; --r-lg:10px;
  --linha:cubic-bezier(0.22,1,0.36,1);

  --z-base:0; --z-sticky:10; --z-aviso:20;
}

@media (prefers-color-scheme:dark){
  :root{
    /* Ela estuda à noite, com abajur. O modo escuro é papel de grafite,
       não o azul-marinho espacial de antes. */
    --paper:        oklch(0.185 0.008 262);
    --paper-sunken: oklch(0.155 0.008 262);
    --surface:      oklch(0.225 0.009 262);
    --rule:         oklch(0.340 0.012 262);
    --rule-soft:    oklch(0.285 0.010 262);
    --pauta:        oklch(0.275 0.012 262);
    --ink:       oklch(0.945 0.006 262);
    --ink-soft:  oklch(0.760 0.012 262);
    --ink-faint: oklch(0.620 0.012 262);
    --materia:      color-mix(in oklch, %MATERIA% 62%, white);
    --materia-tint: color-mix(in oklch, %MATERIA% 22%, var(--surface));
    --materia-edge: color-mix(in oklch, %MATERIA% 45%, var(--rule));
    --certo:       oklch(0.78 0.15 152);
    --certo-tint:  color-mix(in oklch, oklch(0.55 0.13 152) 22%, var(--surface));
    --errado:      oklch(0.76 0.16 25);
    --errado-tint: color-mix(in oklch, oklch(0.55 0.17 25) 22%, var(--surface));
  }
}

*,*::before,*::after{box-sizing:border-box}
html{-webkit-text-size-adjust:100%}
body{
  margin:0;background:var(--paper);color:var(--ink);
  font-family:var(--sans);font-size:var(--t-md);line-height:1.6;
  -webkit-font-smoothing:antialiased;
  padding:env(safe-area-inset-top) env(safe-area-inset-right)
          calc(env(safe-area-inset-bottom) + var(--s-5)) env(safe-area-inset-left);
}
h1,h2,h3{font-family:var(--serif);font-weight:600;line-height:1.22;
  letter-spacing:-0.012em;text-wrap:balance;margin:0}
p{margin:0;text-wrap:pretty}
svg{display:block;flex:none}
:where(a){color:var(--materia)}

/* Foco visível e consistente em tudo que recebe teclado. */
:where(button,a,input,[tabindex]):focus-visible{
  outline:2px solid var(--materia);outline-offset:2px;border-radius:var(--r-sm)
}

.wrap{max-width:60rem;margin:0 auto;padding:var(--s-5) var(--s-4)}
.prosa{max-width:68ch}

/* ---------- cabeçalho ---------- */
.topo{
  display:flex;justify-content:space-between;align-items:flex-end;gap:var(--s-4);
  flex-wrap:wrap;padding-bottom:var(--s-3);
  border-bottom:2px solid var(--materia);margin-bottom:var(--s-5)
}
.topo h1{font-size:var(--t-2xl)}
.materia-label{
  font-size:var(--t-xs);font-weight:700;letter-spacing:0.09em;
  text-transform:uppercase;color:var(--materia);margin-bottom:var(--s-1)
}
.hud{display:flex;gap:var(--s-5);align-items:baseline}
.hud-item{display:flex;flex-direction:column;align-items:flex-end;line-height:1.1}
.hud-num{font-size:var(--t-lg);font-weight:700;font-variant-numeric:tabular-nums}
.hud-rot{font-size:var(--t-xs);color:var(--ink-soft);letter-spacing:0.03em}
.hud-som{
  background:none;border:1px solid var(--rule);border-radius:var(--r-md);
  color:var(--ink-soft);padding:var(--s-2);cursor:pointer;
  display:grid;place-items:center;min-width:2.25rem;min-height:2.25rem
}
.hud-som:hover{border-color:var(--materia);color:var(--materia)}

/* ---------- botões ---------- */
button{font:inherit;cursor:pointer}
.btn{
  display:inline-flex;align-items:center;justify-content:center;gap:var(--s-2);
  min-height:2.75rem;padding:var(--s-2) var(--s-4);
  border:1px solid var(--rule);border-radius:var(--r-md);
  background:var(--surface);color:var(--ink);font-weight:700;font-size:var(--t-sm);
  transition:background 160ms var(--linha),border-color 160ms var(--linha),color 160ms var(--linha)
}
.btn:hover{border-color:var(--materia);color:var(--materia)}
.btn:active{background:var(--paper-sunken)}
.btn[disabled]{opacity:.45;cursor:not-allowed}
.btn-forte{background:var(--materia);border-color:var(--materia);color:var(--surface)}
.btn-forte:hover{filter:brightness(1.12);color:var(--surface)}
.btn-texto{border-color:transparent;background:none;color:var(--ink-soft);
  text-decoration:underline;text-underline-offset:3px;min-height:2.25rem;padding:var(--s-1) var(--s-2)}
.btn-texto:hover{color:var(--errado)}

/* ---------- questão ---------- */
.painel{
  background:var(--surface);border:1px solid var(--rule);
  border-radius:var(--r-lg);padding:var(--s-5)
}
.andamento{display:flex;justify-content:space-between;align-items:baseline;
  font-size:var(--t-sm);color:var(--ink-soft);margin-bottom:var(--s-2)}
.andamento b{color:var(--ink);font-variant-numeric:tabular-nums}
.trilho{height:2px;background:var(--rule-soft);overflow:hidden}
.trilho span{display:block;height:100%;width:0;background:var(--materia);
  transition:width 240ms var(--linha)}

.etapa{font-size:var(--t-xs);font-weight:700;letter-spacing:0.09em;
  text-transform:uppercase;color:var(--materia);margin:var(--s-5) 0 var(--s-2)}
.enunciado{font-family:var(--serif);font-size:var(--t-xl);font-weight:600;
  line-height:1.35;max-width:46ch;margin-bottom:var(--s-4)}
.dica{font-size:var(--t-sm);color:var(--ink-soft);margin-bottom:var(--s-4);max-width:60ch}
.fonte{display:inline-block;font-size:var(--t-xs);font-weight:700;color:var(--ink-soft);
  border:1px dashed var(--rule);border-radius:var(--r-sm);padding:2px var(--s-2);margin-bottom:var(--s-3)}

/* Alternativas: linhas com marcador de letra, não pílulas em gradiente. */
.alts{display:flex;flex-direction:column;gap:var(--s-2);margin:0;padding:0;list-style:none}
.alt{
  display:flex;align-items:flex-start;gap:var(--s-3);width:100%;text-align:left;
  min-height:3rem;padding:var(--s-3);background:var(--surface);
  border:1px solid var(--rule);border-radius:var(--r-md);color:var(--ink);
  font-size:var(--t-md);font-weight:400;line-height:1.45;
  transition:border-color 150ms var(--linha),background 150ms var(--linha)
}
.alt:hover:not(.alt-certa):not(.alt-errada){border-color:var(--materia-edge);background:var(--materia-tint)}
.alt:active{transform:none}
.alt .letra{
  flex:none;width:1.65rem;height:1.65rem;display:grid;place-items:center;
  border:1px solid var(--rule);border-radius:var(--r-sm);
  font-size:var(--t-sm);font-weight:700;color:var(--ink-soft);
  font-variant-numeric:tabular-nums
}
.alt-certa{border-color:var(--certo);background:var(--certo-tint)}
.alt-certa .letra{border-color:var(--certo);background:var(--certo);color:var(--surface)}
.alt-errada{border-color:var(--errado);background:var(--errado-tint)}
.alt-errada .letra{border-color:var(--errado);background:var(--errado);color:var(--surface)}

/* Retorno: borda inteira e fundo tingido. Nunca filete lateral. */
.retorno{display:none;margin-top:var(--s-4);padding:var(--s-4);
  border:1px solid var(--rule);border-radius:var(--r-md);font-size:var(--t-sm);line-height:1.55}
.retorno.visivel{display:block}
.retorno strong{display:block;font-size:var(--t-sm);margin-bottom:var(--s-1);letter-spacing:0.02em}
.retorno.ok{border-color:var(--certo);background:var(--certo-tint)}
.retorno.ok strong{color:var(--certo)}
.retorno.nao{border-color:var(--errado);background:var(--errado-tint)}
.retorno.nao strong{color:var(--errado)}
.acoes{display:flex;justify-content:flex-end;margin-top:var(--s-4)}

/* ---------- lista de missões e trilhas ---------- */
.secao-tit{font-size:var(--t-lg);margin:var(--s-6) 0 var(--s-3)}
.lista{list-style:none;margin:0;padding:0;border-top:1px solid var(--rule)}
.lista>li{border-bottom:1px solid var(--rule)}
.linha{
  display:grid;grid-template-columns:auto 1fr auto;gap:var(--s-4);align-items:center;
  width:100%;padding:var(--s-4) var(--s-2);background:none;border:0;text-align:left;
  color:var(--ink);transition:background 150ms var(--linha)
}
.linha:hover{background:var(--materia-tint)}
.linha-ico{width:2.5rem;height:2.5rem;display:grid;place-items:center;
  border:1px solid var(--rule);border-radius:var(--r-md);color:var(--materia)}
.linha-tit{font-family:var(--serif);font-size:var(--t-lg);font-weight:600;display:block}
.linha-sub{font-size:var(--t-sm);color:var(--ink-soft);display:block;margin-top:2px;max-width:56ch}
.linha-dir{display:flex;flex-direction:column;align-items:flex-end;gap:var(--s-1);min-width:7.5rem}
.estado{font-size:var(--t-xs);font-weight:700;letter-spacing:0.02em;white-space:nowrap}
.estado.andamento{color:var(--ink-soft)}
.estado.concluida{color:var(--certo)}
.estado.dominada{color:var(--materia)}
.medida{width:7rem;height:2px;background:var(--rule-soft)}
.medida span{display:block;height:100%;width:0;background:var(--materia);transition:width 320ms var(--linha)}
.medida-rot{font-size:var(--t-xs);color:var(--ink-faint);font-variant-numeric:tabular-nums}

/* ---------- lição ---------- */
.licao{max-width:44rem}
.licao h2{font-size:var(--t-2xl);margin-bottom:var(--s-4)}
.licao h3{font-size:var(--t-lg);margin:var(--s-5) 0 var(--s-2)}
.licao p{margin-bottom:var(--s-3);max-width:68ch}
.termos{display:grid;grid-template-columns:repeat(auto-fit,minmax(15rem,1fr));
  gap:var(--s-1) var(--s-5);margin:var(--s-4) 0;list-style:none;padding:0}
.termos>li{padding:var(--s-3) 0;border-top:1px solid var(--rule-soft)}
.termos b{display:block;font-family:var(--serif);font-size:var(--t-md);margin-bottom:2px}
.termos span{font-size:var(--t-sm);color:var(--ink-soft)}
.nota{
  /* Pauta de caderno: só aqui, onde é observação à margem. */
  margin:var(--s-4) 0;padding:var(--s-3) var(--s-4);
  border:1px solid var(--rule);border-radius:var(--r-md);
  background:linear-gradient(var(--pauta) 1px,transparent 1px) 0 0/100% 1.6em;
  background-color:var(--surface);font-size:var(--t-sm);line-height:1.6em
}
.nota.atencao{border-color:var(--materia-edge);
  background-color:var(--materia-tint)}
.licao-nav{display:flex;justify-content:space-between;align-items:center;gap:var(--s-3);
  flex-wrap:wrap;margin-top:var(--s-6);padding-top:var(--s-4);border-top:1px solid var(--rule)}
.licao-cont{font-size:var(--t-sm);color:var(--ink-soft);font-variant-numeric:tabular-nums}

/* ---------- abertura e fim ---------- */
.abertura{max-width:40rem;padding:var(--s-7) 0}
.abertura h2{font-size:var(--t-3xl);margin-bottom:var(--s-3)}
.abertura p{color:var(--ink-soft);margin-bottom:var(--s-5);max-width:56ch}
.resumo{display:grid;grid-template-columns:repeat(auto-fit,minmax(7rem,1fr));
  gap:var(--s-5);margin:var(--s-5) 0;padding:var(--s-4) 0;
  border-top:1px solid var(--rule);border-bottom:1px solid var(--rule)}
.resumo div{display:flex;flex-direction:column}
.resumo b{font-size:var(--t-2xl);font-weight:700;font-variant-numeric:tabular-nums;line-height:1.1}
.resumo span{font-size:var(--t-xs);color:var(--ink-soft);margin-top:2px}
.indicadores{display:flex;gap:var(--s-5);flex-wrap:wrap;margin:var(--s-4) 0;
  font-size:var(--t-sm);color:var(--ink-soft)}
.indicadores b{color:var(--ink);font-variant-numeric:tabular-nums}

/* ---------- modo, aviso, especiais ---------- */
.modo{display:inline-flex;border:1px solid var(--rule);border-radius:var(--r-md);overflow:hidden}
.modo button{border:0;background:var(--surface);color:var(--ink-soft);
  padding:var(--s-2) var(--s-4);font-size:var(--t-sm);font-weight:700;min-height:2.75rem}
.modo button[aria-pressed="true"]{background:var(--materia);color:var(--surface)}
.modo-dica{font-size:var(--t-sm);color:var(--ink-soft);margin-top:var(--s-2);max-width:60ch}

.aviso{
  position:fixed;left:50%;top:var(--s-4);transform:translateX(-50%) translateY(-0.5rem);
  z-index:var(--z-aviso);background:var(--ink);color:var(--paper);
  padding:var(--s-3) var(--s-5);border-radius:var(--r-md);font-size:var(--t-sm);font-weight:700;
  opacity:0;pointer-events:none;transition:opacity 180ms var(--linha),transform 180ms var(--linha);
  max-width:92vw;text-align:center
}
.aviso.visivel{opacity:1;transform:translateX(-50%) translateY(0)}

.pontos{position:absolute;right:0;top:-0.5rem;font-size:var(--t-lg);font-weight:700;
  font-variant-numeric:tabular-nums;pointer-events:none;animation:sobe 900ms var(--linha) forwards}
.pontos.mais{color:var(--certo)} .pontos.menos{color:var(--errado)}
@keyframes sobe{from{opacity:0;transform:translateY(6px)}
  25%{opacity:1;transform:translateY(-2px)}to{opacity:0;transform:translateY(-1.75rem)}}
.enunciado-area{position:relative}

.campo{display:flex;gap:var(--s-2);flex-wrap:wrap;margin-top:var(--s-2)}
.campo input{flex:1 1 14rem;min-height:2.75rem;padding:var(--s-2) var(--s-3);
  font:inherit;font-size:16px;background:var(--surface);color:var(--ink);
  border:1px solid var(--rule);border-radius:var(--r-md)}
.campo input::placeholder{color:var(--ink-soft)}
.campo input:focus{outline:2px solid var(--materia);outline-offset:1px;border-color:var(--materia)}

.pares{display:grid;grid-template-columns:1fr 1fr;gap:var(--s-2);margin-top:var(--s-3)}
.par{display:flex;flex-direction:column;gap:var(--s-2)}
.par button{min-height:2.75rem;padding:var(--s-2) var(--s-3);text-align:left;
  border:1px solid var(--rule);border-radius:var(--r-md);background:var(--surface);
  color:var(--ink);font-size:var(--t-sm);line-height:1.35}
.par button:hover:not(.feito){border-color:var(--materia-edge)}
.par button.sel{border-color:var(--materia);background:var(--materia-tint)}
.par button.feito{border-color:var(--certo);background:var(--certo-tint);opacity:.72;cursor:default}
.par button.nao{border-color:var(--errado);background:var(--errado-tint)}

.sequencia{min-height:3rem;border:1px dashed var(--rule);border-radius:var(--r-md);
  padding:var(--s-3);display:flex;flex-wrap:wrap;gap:var(--s-2);align-items:center;margin-bottom:var(--s-3)}
.sequencia .vazio{font-size:var(--t-sm);color:var(--ink-soft)}
.ficha{border:1px solid var(--materia-edge);background:var(--materia-tint);
  border-radius:var(--r-sm);padding:var(--s-1) var(--s-3);font-size:var(--t-sm);font-weight:700}
.banco{display:flex;flex-wrap:wrap;gap:var(--s-2);margin-bottom:var(--s-3)}
.banco button{min-height:2.75rem;padding:var(--s-2) var(--s-3);border:1px solid var(--rule);
  border-radius:var(--r-md);background:var(--surface);color:var(--ink);font-size:var(--t-sm)}
.banco button:hover:not(:disabled){border-color:var(--materia-edge)}
.banco button:disabled{opacity:.3;cursor:default}

.rosa{display:grid;grid-template-columns:repeat(3,1fr);gap:var(--s-2);
  max-width:19rem;margin:var(--s-3) auto 0}
.rosa button{aspect-ratio:1;display:grid;place-items:center;border:1px solid var(--rule);
  border-radius:var(--r-md);background:var(--surface);color:var(--ink);
  font-weight:700;font-size:var(--t-sm);min-height:3.25rem}
.rosa button:hover:not(:disabled){border-color:var(--materia-edge);background:var(--materia-tint)}
.rosa button.eixo{color:var(--materia)}
.rosa button.centro{border-color:transparent;background:none;cursor:default;color:var(--ink-faint)}
.rosa button.alt-certa{border-color:var(--certo);background:var(--certo-tint)}
.rosa button.alt-errada{border-color:var(--errado);background:var(--errado-tint)}

.mapa{display:flex;align-items:center;gap:var(--s-1);overflow-x:auto;padding:var(--s-3) 0 var(--s-1)}
.passo{flex:none;width:1.65rem;height:1.65rem;border-radius:50%;display:grid;place-items:center;
  border:1px solid var(--rule);font-size:var(--t-xs);font-weight:700;color:var(--ink-soft)}
.passo.atual{border-color:var(--materia);color:var(--materia)}
.passo.feito{border-color:var(--certo);background:var(--certo-tint);color:var(--certo)}
.traco{flex:none;width:1rem;height:1px;background:var(--rule)}
.traco.feito{background:var(--certo)}

.tela{display:none}
.tela.ativa{display:block}

@media(max-width:44rem){
  .wrap{padding:var(--s-4) var(--s-3)}
  .topo{align-items:flex-start}
  .hud{width:100%;justify-content:space-between;gap:var(--s-3)}
  .linha{grid-template-columns:auto 1fr;gap:var(--s-3);padding:var(--s-4) var(--s-1)}
  .linha-dir{grid-column:1/-1;align-items:flex-start;flex-direction:row;
    justify-content:space-between;width:100%;min-width:0}
  .medida{width:100%;max-width:10rem}
  .pares{grid-template-columns:1fr}
  .enunciado{font-size:var(--t-lg)}
  .abertura{padding:var(--s-5) 0}
  .abertura h2{font-size:var(--t-2xl)}
}

@media (prefers-reduced-motion:reduce){
  *,*::before,*::after{animation-duration:0.01ms!important;animation-iteration-count:1!important;
    transition-duration:0.01ms!important;scroll-behavior:auto!important}
}
""".replace("%MATERIA%", MATERIAS[materia])
