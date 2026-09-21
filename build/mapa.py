# -*- coding: utf-8 -*-
"""Mapeia cada ilustração antiga (emoji) para um ícone desenhado.
Conceitos próximos compartilham o mesmo ícone de propósito."""

MAPA = {
 # escrever / texto
 "✍️":"escrever","✏️":"escrever","📝":"escrever","🔤":"letras","⌨️":"teclado",
 "📜":"pergaminho","📖":"livro","📚":"livro","📗":"livro","📰":"jornal","🗞️":"jornal",
 "📆":"calendario","📅":"calendario","🗓️":"calendario",
 # marcas de resposta
 "✅":"check","❎":"check","❌":"xis","❌❓":"xis","🚫":"xis","⚠️":"alerta","❓":"pergunta","🤔":"pergunta",
 "🔗":"elos","🧩":"peca","🎯":"alvo","⭐":"estrela","🌟":"estrela","✨":"estrela","✳️":"estrela",
 "🏆":"trofeu","🎲":"dado","🩹":"remendo",
 # tempo
 "⏳":"ampulheta","⏱️":"relogio","⏰":"relogio","🕐":"relogio","🕑":"relogio","🕔":"relogio",
 "🕕":"relogio","🕖":"relogio","🕘":"relogio","🕛":"relogio","🕜":"relogio","🕝":"relogio","🕰️":"relogio",
 "🔄":"ciclo","🔁":"ciclo","♾️":"ciclo","🌀":"ciclo",
 # céu
 "☀️":"sol","🌞":"sol","🌅":"sol","🌇":"sol","🌙":"lua","🌗":"lua","🌓":"lua","🌑":"lua","🌕":"lua",
 "🌍":"globo","🌎":"globo","🌏":"globo","🌐":"globo","🪐":"planeta","🛰️":"satelite","🌌":"estrela",
 "🔭":"luneta","🧭":"bussola","🌊":"ondas-agua","🌡️":"termometro","☁️":"nuvem","🌦️":"nuvem","🧊":"nuvem",
 "🍂":"planta","🌸":"planta","🌾":"planta","💨":"vento","💧":"gota","🌹":"rosa-ventos","🇧🇷":"bandeira",
 # setas e direções
 "⬆️":"seta-cima","⬇️":"seta-baixo","↔️":"seta-dupla","↗️":"seta-diagonal","↘️":"seta-diagonal","↙️":"seta-diagonal","↖️":"seta-diagonal",
 "🔙":"voltar","➕":"mais","➖":"menos","✌️":"numeros","📍":"pino","🗺️":"mapa","🏔️":"montanha",
 # comunicação
 "✉️":"carta","📮":"carta","📬":"carta","☎️":"telefone","📱":"celular","📡":"antena",
 "📻":"radio","📺":"tv","💻":"computador","🖨️":"prensa","🔌":"tomada","⚡":"raio","🚦":"semaforo",
 "📶":"sinal","🏗️":"servidor","📂":"pasta","🌐 ":"globo","🔔":"sino","💬":"fala","🗣️":"fala","👥":"pessoas",
 "👆":"mao","⠿":"braille","🤟":"sinais","👀":"olho","👁️":"olho","🔎":"lupa","🎧":"fone","🎦":"camera",
 "🎬":"camera","🎥":"camera","📷":"camera","📸":"camera","🎞️":"filme","📼":"filme",
 # pessoas e papéis
 "🧠":"cabeca","🙋":"pessoa","👧":"pessoa","👦":"pessoa","🧒":"pessoa","👫":"pessoas","👤":"pessoa",
 "👑":"coroa","🤴":"coroa","👸":"coroa","🗿":"escultura","👷":"trabalho","💃":"movimento","🧗":"movimento",
 "🤝":"mao","🤲":"mao","🙆":"pessoa","🧍":"pessoa","🏃":"movimento","🏊":"movimento","🏋️":"movimento",
 "😴":"dormir","😭":"triste","😢":"triste","😞":"triste",
 # objetos e lugares
 "⛵":"barco","🚢":"barco","🚲":"bicicleta","🚗":"carro","🛩️":"aviao","🚀":"foguete","🐎":"animal","🐇":"animal",
 "🏛️":"templo","⛪":"templo","🏰":"castelo","🕌":"templo","🏺":"vaso","🗼":"torre","🧱":"parede","🪜":"escada",
 "🏠":"casa","🏪":"predios","🏙️":"predios","🚪":"porta","🛏️":"cama","🪑":"cadeira","🚿":"chuveiro",
 "🧹":"vassoura","🍳":"comida","🍕":"comida","🥐":"comida","🍽️":"comida","🍲":"comida","🫖":"bebida","🥤":"bebida",
 "🛍️":"sacola","🧳":"mala","🎟️":"bilhete","🧲":"ima","⚖️":"balanca","📏":"regua","📐":"regua",
 "🧪":"tubo","💡":"lampada","🔋":"tomada","⚙️":"engrenagem","✂️":"tesoura","🎮":"controle","🪞":"espelho",
 "🎣":"anzol","🛑":"parar","⚔️":"espadas","🧰":"caixa-ferramentas","🔢":"numeros","💔":"quebrado",
 # arte e música
 "🎵":"nota","🎶":"nota","🎼":"partitura","🎸":"instrumento","🎹":"instrumento","🎻":"instrumento","🥁":"instrumento","🎤":"microfone",
 "🎨":"pincel","✝️":"cruzeiro","🇫🇷":"bandeira","🇮🇹":"bandeira",
 # esporte
 "⚽":"bola",
 # números soltos usados como ilustração
 "4️⃣0️⃣":"numeros","5️⃣0️⃣":"numeros","9️⃣":"numeros","2️⃣1️⃣":"numeros","1️⃣4️⃣":"numeros",
}
MAPA["🌃"]="predios"; MAPA["🕶️"]="olho"
PADRAO = "estrela"
# Sem mapa explícito: 🌃 e 🕶️ caem no padrão.

def nome(emoji: str) -> str:
    return MAPA.get(emoji, PADRAO)
