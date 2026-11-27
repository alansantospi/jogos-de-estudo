/* ---------- o bichinho ----------
   Um desenho só, com as partes de cada bicho escondidas por CSS: a cara
   (olhos, boca, os estados de feliz, ops e fogo) é a mesma em todos, então
   tudo o que reage na partida funciona igual para qualquer um. Qual aparece
   vem de data-bicho; os acessórios, de data-nivel. Fica guardado no perfil
   (que a conta já leva de um aparelho para outro). */
const _MASCOTE_SVG =
  '<svg id="mascote" class="mascote" viewBox="0 0 64 64" aria-hidden="true" focusable="false">'
  + '<circle class="m-brilho-aura" cx="32" cy="40" r="28"/>'
  + '<path class="m-fogo" d="M32 1c5 7 10 9 8 17-1 4-5 6-8 6s-7-2-8-6c-2-8 3-10 8-17z"/>'
  + '<g class="m-corpo">'
  + '<g class="b-parte b-gato"><path d="M12 31 15 9l14 13z"/><path d="M52 31 49 9 35 22z"/><path class="b-dentro" d="M16 26l1.5-11 7 7zM48 26l-1.5-11-7 7z"/></g>'
  + '<g class="b-parte b-coelho"><ellipse cx="23" cy="13" rx="5.5" ry="13" transform="rotate(-12 23 13)"/><ellipse cx="41" cy="13" rx="5.5" ry="13" transform="rotate(12 41 13)"/><ellipse class="b-dentro" cx="23" cy="13" rx="2.6" ry="9" transform="rotate(-12 23 13)"/><ellipse class="b-dentro" cx="41" cy="13" rx="2.6" ry="9" transform="rotate(12 41 13)"/></g>'
  + '<path class="b-parte b-dino b-espinho" d="M17 26l3-10 5 7 3-11 4 10 4-10 3 11 5-7 3 10z"/>'
  + '<g class="b-parte b-coruja"><path d="M15 26l1-10 9 6z"/><path d="M49 26l-1-10-9 6z"/><path class="b-asa" d="M10 38q-4 10 5 17 2-9-5-17zM54 38q4 10-5 17-2-9 5-17z"/></g>'
  + '<g class="b-parte b-robo"><path class="b-antena" d="M32 21V8"/><circle class="b-luz" cx="32" cy="7" r="3.4"/><rect x="5" y="35" width="6" height="10" rx="2"/><rect x="53" y="35" width="6" height="10" rx="2"/></g>'
  + '<ellipse class="m-pele" cx="32" cy="40" rx="23" ry="20"/>'
  + '<ellipse class="m-barriga" cx="32" cy="47" rx="12" ry="8"/>'
  + '<g class="m-chapeu"><path d="M25 23 35 4l7 18z"/><circle cx="35" cy="4" r="2.8"/></g>'
  + '<path class="m-coroa" d="M21 23V11l5.5 5.5L32 8l5.5 8.5L43 11v12z"/>'
  + '<g class="m-medalha"><path d="M28 48l4 4.5 4-4.5"/><circle cx="32" cy="56" r="4.6"/></g>'
  + '<g class="b-parte b-coruja b-frente"><circle class="b-disco" cx="24" cy="36" r="7.5"/><circle class="b-disco" cx="40" cy="36" r="7.5"/></g>'
  + '<g class="m-olhos"><ellipse cx="24" cy="36" rx="3.2" ry="4.2"/><ellipse cx="40" cy="36" rx="3.2" ry="4.2"/>'
  + '<circle class="m-brilho" cx="25.2" cy="34.4" r="1.1"/><circle class="m-brilho" cx="41.2" cy="34.4" r="1.1"/></g>'
  + '<path class="m-olhos-feliz" d="M20.5 37q3.5-5 7 0M36.5 37q3.5-5 7 0"/>'
  + '<path class="b-parte b-coruja b-bico" d="M29 40h6l-3 5z"/>'
  + '<circle class="m-bochecha" cx="16.5" cy="44" r="3.2"/><circle class="m-bochecha" cx="47.5" cy="44" r="3.2"/>'
  + '<path class="m-boca m-boca-normal" d="M28 45q4 3.5 8 0"/>'
  + '<path class="m-boca m-boca-feliz" d="M25.5 44q6.5 9 13 0z"/>'
  + '<ellipse class="m-boca m-boca-ops" cx="32" cy="47" rx="3" ry="3.6"/>'
  + '</g></svg>';

/* min: figurinhas para abrir. Os três primeiros já vêm abertos: escolher é
   a graça, e os outros são motivo para completar o álbum. */
const BICHOS = [
  {id: "bolinha", nome: "Bolinha", min: 0},
  {id: "gato",    nome: "Gato",    min: 0},
  {id: "coelho",  nome: "Coelho",  min: 0},
  {id: "dino",    nome: "Dino",    min: 4},
  {id: "coruja",  nome: "Coruja",  min: 7},
  {id: "robo",    nome: "Robô",    min: 10}
];
const BICHO_CHAVE = "jogos_bicho_v1";

function _perfilDoBicho(){ try{ return typeof perfilAtual === "function" ? perfilAtual() : null; }catch(e){ return null; } }

// O escolhido, se ainda estiver aberto com n figurinhas; senão, a Bolinha.
function bichoEscolhido(n){
  let id = null;
  const p = _perfilDoBicho();
  if(p && p.bicho) id = p.bicho;
  else try{ id = localStorage.getItem(BICHO_CHAVE); }catch(e){}
  const b = BICHOS.find(x => x.id === id);
  return b && n >= b.min ? b.id : "bolinha";
}

function guardarBicho(id){
  const p = _perfilDoBicho();
  if(p && typeof lerPerfis === "function" && typeof gravar === "function"){
    const l = lerPerfis(), q = l.find(x => x.id === p.id);
    if(q){ q.bicho = id; gravar(PERFIS_CHAVE, l); return; }
  }
  try{ localStorage.setItem(BICHO_CHAVE, id); }catch(e){}
}

// O desenho com outro id (há vários na mesma página) e já vestido.
function bichoSvg(id, bicho, nivel, classe){
  return _MASCOTE_SVG.replace('id="mascote"', 'id="' + id + '" data-bicho="' + bicho + '" data-nivel="' + (nivel || 0) + '"')
    .replace('class="mascote"', 'class="mascote ' + (classe || "") + '"');
}
