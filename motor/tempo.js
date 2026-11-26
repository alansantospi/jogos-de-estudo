/* ---------- quando foi, em palavras ----------
   "há 5 min", "ontem", "há 3 semanas": quem lê quer saber quão longe ficou,
   não fazer conta com uma data. `agora` é parâmetro para o teste não
   depender do relógio. */
function haQuanto(t, agora){
  if(!t) return "";
  const a = agora === undefined ? Date.now() : agora, q = new Date(t).getTime();
  const min = Math.floor(Math.max(0, a - q) / 6e4);
  if(min < 1) return "agora há pouco";
  if(min < 60) return "há " + min + " min";
  const meia = x => { const d = new Date(x); return new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime(); };
  const dias = Math.round((meia(a) - meia(q)) / 864e5);
  const n = (v, um, varios) => v + " " + (v === 1 ? um : varios);
  if(dias === 0){ const h = Math.floor(min / 60); return "há " + n(h, "hora", "horas"); }
  if(dias === 1) return "ontem";
  if(dias < 7) return "há " + dias + " dias";
  if(dias < 30) return "há " + n(Math.floor(dias / 7), "semana", "semanas");
  if(dias < 365) return "há " + n(Math.floor(dias / 30), "mês", "meses");
  return "há " + n(Math.floor(dias / 365), "ano", "anos");
}
