# -*- coding: utf-8 -*-
"""Sprite de ícones de linha, 24x24, traço 1.6, currentColor.
Substituem os emojis nos cards de missão e trilha."""

_P = {
 "prensa":'<path d="M5 4h14v6H5z"/><path d="M7 10v3h10v-3"/><path d="M4 16h16"/><path d="M8 20h8"/><path d="M12 16v4"/>',
 "jornal":'<path d="M4 6h13v13H4z"/><path d="M17 9h3v8a2 2 0 0 1-2 2h-1"/><path d="M7 9h7M7 12h7M7 15h4"/>',
 "carta":'<path d="M3 6h18v12H3z"/><path d="m3 7 9 6 9-6"/>',
 "camera":'<path d="M3 8h4l1.5-2h7L17 8h4v11H3z"/><circle cx="12" cy="13" r="3.5"/>',
 "globo":'<circle cx="12" cy="12" r="8.5"/><path d="M3.5 12h17"/><path d="M12 3.5a13 13 0 0 1 0 17a13 13 0 0 1 0-17z"/>',
 "pontos":'<circle cx="9" cy="6.5" r="1.3"/><circle cx="9" cy="12" r="1.3"/><circle cx="9" cy="17.5" r="1.3"/><circle cx="15" cy="6.5" r="1.3"/><circle cx="15" cy="17.5" r="1.3"/>',
 "nota":'<path d="M9 18V5l10-2v13"/><ellipse cx="6.5" cy="18" rx="2.5" ry="2"/><ellipse cx="16.5" cy="16" rx="2.5" ry="2"/>',
 "ondas":'<path d="M3 12c2.5-6 4.5 6 7 0s4.5 6 7 0 2.5-3 4-3"/>',
 "parede":'<path d="M3 5h18v14H3z"/><path d="M3 9.7h18M3 14.3h18"/><path d="M9 5v4.7M15 9.7v4.6M9 14.3V19"/>',
 "arco":'<path d="M5 20V11a7 7 0 0 1 14 0v9"/><path d="M3 20h18"/><path d="M12 20v-6"/>',
 "terra":'<circle cx="12" cy="12" r="8.5"/><path d="M4 9.5c3 1.5 5 .5 7 1.5s1.5 3.5 3 4 3-1 4.5-.5"/>',
 "sol":'<circle cx="12" cy="12" r="4"/><path d="M12 2.5v2.5M12 19v2.5M2.5 12H5M19 12h2.5M5.2 5.2l1.8 1.8M17 17l1.8 1.8M18.8 5.2 17 7M7 17l-1.8 1.8"/>',
 "bussola":'<circle cx="12" cy="12" r="8.5"/><path d="m15 9-2 4.5L8.5 15l2-4.5z"/>',
 "lua":'<path d="M20 13.5A8.5 8.5 0 1 1 10.5 4a7 7 0 0 0 9.5 9.5z"/>',
 "calendario":'<path d="M4 6h16v14H4z"/><path d="M4 10h16"/><path d="M8 3.5V6M16 3.5V6"/><path d="M8 14h3"/>',
 "luneta":'<path d="m3 14 13-8 3 5-13 8z"/><path d="m8 16 2 4.5"/><path d="m14.5 12 4 2"/>',
 "estrela":'<path d="m12 3.5 2.6 5.6 6 .8-4.4 4.2 1.1 6-5.3-2.9-5.3 2.9 1.1-6L3.4 9.9l6-.8z"/>',
 "livro":'<path d="M4 5.5A2 2 0 0 1 6 4h6v15H6a2 2 0 0 0-2 1.5z"/><path d="M20 5.5A2 2 0 0 0 18 4h-6v15h6a2 2 0 0 1 2 1.5z"/>',
 "lapis":'<path d="m15.5 4.5 4 4L8 20l-4.5.5L4 16z"/><path d="m13.5 6.5 4 4"/>',
 "fone":'<path d="M4 14v-2a8 8 0 0 1 16 0v2"/><path d="M4 13h3v6H5.5A1.5 1.5 0 0 1 4 17.5z"/><path d="M20 13h-3v6h1.5a1.5 1.5 0 0 0 1.5-1.5z"/>',
 "balao":'<path d="M4 5h16v11H9l-5 4z"/><path d="M8.5 10.5h7"/>',
 "bilhete":'<path d="M3 7h18v3.5a1.8 1.8 0 0 0 0 3.5V17H3v-3a1.8 1.8 0 0 0 0-3.5z"/><path d="M13 7v10"/>',
 "relogio":'<circle cx="12" cy="12" r="8.5"/><path d="M12 7v5.2l3.3 2"/>',
 "numeros":'<path d="M6.5 15V9l-2 1.4"/><path d="M11 10a2.2 2.2 0 1 1 3.8 1.5L11 15h4.2"/><path d="M18 9h2.5l-1.6 2.4a2.1 2.1 0 1 1-1.5 3.3"/>',
 "pessoa":'<circle cx="13" cy="5" r="2"/><path d="m8 21 2.5-6.5L9 12l-3 2"/><path d="m13 9-2.5 1 2 3.5L17 16l1.5 5"/><path d="m14 10 4 .5"/>',
 "casa":'<path d="m3.5 11 8.5-7 8.5 7"/><path d="M6 10v10h12V10"/><path d="M10 20v-6h4v6"/>',
 "trofeu":'<path d="M8 4h8v5a4 4 0 0 1-8 0z"/><path d="M8 5.5H5.5v1A3.5 3.5 0 0 0 8 10M16 5.5h2.5v1A3.5 3.5 0 0 1 16 10"/><path d="M12 13v3.5M9 20h6"/>',
 "tesoura":'<circle cx="7" cy="18" r="2.2"/><circle cx="17" cy="18" r="2.2"/><path d="M8.5 16.2 18 4M15.5 16.2 6 4"/>',
 "engrenagem":'<circle cx="12" cy="12" r="3.2"/><path d="M12 3v2.4M12 18.6V21M4.2 7.5l2 1.2M17.8 15.3l2 1.2M4.2 16.5l2-1.2M17.8 8.7l2-1.2"/>',
 "dado":'<path d="M4 4h16v16H4z"/><circle cx="8.8" cy="8.8" r="1.2"/><circle cx="15.2" cy="15.2" r="1.2"/><circle cx="12" cy="12" r="1.2"/>',
 "remendo":'<path d="M20 12a8 8 0 1 1-2.6-5.9"/><path d="M20 4v4.5h-4.5"/>',
 "rota":'<circle cx="5.5" cy="18.5" r="2"/><circle cx="18.5" cy="5.5" r="2"/><path d="M7.5 18.5h6a4 4 0 0 0 0-8h-3a4 4 0 0 1 0-8h6" transform="translate(0 1.5)"/>',
 "som":'<path d="M4 9.5h3.5L12 5.5v13L7.5 14.5H4z"/><path d="M15.5 9.5a4 4 0 0 1 0 5"/><path d="M18 7a7.5 7.5 0 0 1 0 10"/>',
 "mudo":'<path d="M4 9.5h3.5L12 5.5v13L7.5 14.5H4z"/><path d="m16 10 4 4M20 10l-4 4"/>',
}

def sprite(nomes=None) -> str:
    itens = nomes or list(_P)
    corpo = "".join(
        f'<symbol id="i-{n}" viewBox="0 0 24 24">{_P[n]}</symbol>' for n in itens if n in _P)
    return ('<svg aria-hidden="true" focusable="false" '
            'style="position:absolute;width:0;height:0;overflow:hidden" '
            'fill="none" stroke="currentColor" stroke-width="1.6" '
            'stroke-linecap="round" stroke-linejoin="round">'
            f'<defs>{corpo}</defs></svg>')

def uso(nome, classe="", tamanho=22) -> str:
    c = f' class="{classe}"' if classe else ""
    return (f'<svg{c} width="{tamanho}" height="{tamanho}" viewBox="0 0 24 24" '
            f'aria-hidden="true" focusable="false"><use href="#i-{nome}"/></svg>')
