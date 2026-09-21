# -*- coding: utf-8 -*-
"""Converte OKLCH em sRGB e mede o contraste WCAG entre pares de tokens."""
import math, re

def oklch_srgb(L, C, h):
    a = C*math.cos(math.radians(h)); b = C*math.sin(math.radians(h))
    l_ = L + 0.3963377774*a + 0.2158037573*b
    m_ = L - 0.1055613458*a - 0.0638541728*b
    s_ = L - 0.0894841775*a - 1.2914855480*b
    l, m, s = l_**3, m_**3, s_**3
    r =  4.0767416621*l - 3.3077115913*m + 0.2309699292*s
    g = -1.2684380046*l + 2.6097574011*m - 0.3413193965*s
    bb = -0.0041960863*l - 0.7034186147*m + 1.7076147010*s
    def enc(x):
        x = max(0.0, min(1.0, x))
        return 12.92*x if x <= 0.0031308 else 1.055*x**(1/2.4) - 0.055
    return tuple(enc(v) for v in (r, g, bb))

def lum(rgb):
    def f(c): return c/12.92 if c <= 0.04045 else ((c+0.055)/1.055)**2.4
    r,g,b = (f(c) for c in rgb)
    return 0.2126*r + 0.7152*g + 0.0722*b

def razao(c1, c2):
    a, b = lum(c1), lum(c2)
    if a < b: a, b = b, a
    return (a+0.05)/(b+0.05)

def parse(v):
    if v.strip() in ("#fff","white"): return (1.0,1.0,1.0)
    m = re.match(r'oklch\(([\d.]+)\s+([\d.]+)\s+([\d.]+)\)', v.strip())
    if not m: return None
    return oklch_srgb(float(m.group(1)), float(m.group(2)), float(m.group(3)))

def mistura(a, b, pct):
    """Aproxima color-mix(in oklch, a pct%, b) interpolando em sRGB — suficiente
    para triagem de contraste."""
    return tuple(a[i]*pct + b[i]*(1-pct) for i in range(3))

def nota(r, grande=False):
    alvo = 3.0 if grande else 4.5
    return ("ok " if r >= alvo else "BAIXO") + f" {r:.2f}:1"
