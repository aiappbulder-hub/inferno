#!/usr/bin/env python3
"""INFERNO concept mockups — procedural pixel art.

Renders four screens at the game's internal grid (320x180), upscaled 4x
with nearest-neighbor to 1280x720. Palettes come from
design/04-art-audio-bible.md.

Usage: python3 generate.py [outdir]
"""
import math
import random
import sys
from pathlib import Path

from PIL import Image, ImageDraw

W, H = 320, 180
SCALE = 4
OUT = Path(sys.argv[1]) if len(sys.argv) > 1 else Path(__file__).parent


def hx(s):
    s = s.lstrip('#')
    return tuple(int(s[i:i + 2], 16) for i in (0, 2, 4))


def shade(c, f):
    return tuple(max(0, min(255, int(v * f))) for v in c)


def R(d, x, y, w, h, c):
    if w > 0 and h > 0:
        d.rectangle([x, y, x + w - 1, y + h - 1], fill=c)


def speckle(d, x, y, w, h, c, density=0.06, seed=1):
    rnd = random.Random(seed)
    for _ in range(int(w * h * density)):
        d.point((x + rnd.randrange(w), y + rnd.randrange(h)), c)


def glow(img, cx, cy, r, color, alpha=70):
    ov = Image.new('RGBA', img.size, (0, 0, 0, 0))
    od = ImageDraw.Draw(ov)
    for rr in range(r, 0, -2):
        a = int(alpha * (1 - rr / r) ** 1.4) + 6
        od.ellipse([cx - rr, cy - rr, cx + rr, cy + rr], fill=color + (a,))
    out = Image.alpha_composite(img.convert('RGBA'), ov).convert('RGB')
    img.paste(out)
    return img


SKIN = hx('C9986B')
SOUL = hx('9AA0A6')
DANTE_COAT = hx('3A3F4A')
VIRGIL_GRAY = hx('6E6E73')
CREAM = hx('EFE3C0')


def person(d, x, y, h, coat, skin=SKIN, hair=(43, 43, 43), cap=None,
           pants=None, jump=False):
    """x = center, y = feet baseline, h = total height."""
    hw = max(2, round(h * 0.18))
    head_h = max(3, round(h * 0.26))
    leg_h = max(2, round(h * 0.25))
    body_h = h - head_h - leg_h
    top = y - h
    hh = max(1, round(h * 0.13))
    R(d, x - hh, top, hh * 2, head_h, skin)
    if cap:
        R(d, x - hh - 1, top, hh * 2 + 2, 2, cap)
    else:
        R(d, x - hh, top, hh * 2, 2, hair)
    R(d, x - hw, top + head_h, hw * 2, body_h, coat)
    pants = pants or shade(coat, 0.55)
    lw = max(1, hw - 1)
    if jump:
        R(d, x - hw - 1, y - leg_h + 1, lw, leg_h - 1, pants)
        R(d, x + hw - lw + 2, y - leg_h - 2, lw, leg_h - 1, pants)
    else:
        R(d, x - hw, y - leg_h, lw, leg_h, pants)
        R(d, x + hw - lw, y - leg_h, lw, leg_h, pants)


def blown_person(d, x, y, coat, skin=SKIN):
    """A soul tumbling horizontally in the gale."""
    R(d, x, y, 9, 4, coat)          # body streaming sideways
    R(d, x + 9, y - 1, 4, 4, skin)  # head leading
    R(d, x - 4, y + 1, 4, 2, shade(coat, 0.55))  # legs trailing
    R(d, x - 8, y, 4, 1, shade(coat, 0.7))       # coat tail


FONT = {
    'A': ["010", "101", "111", "101", "101"],
    'B': ["110", "101", "110", "101", "110"],
    'C': ["011", "100", "100", "100", "011"],
    'E': ["111", "100", "110", "100", "111"],
    'H': ["101", "101", "111", "101", "101"],
    'I': ["111", "010", "010", "010", "111"],
    'L': ["100", "100", "100", "100", "111"],
    'M': ["10001", "11011", "10101", "10001", "10001"],
    'O': ["010", "101", "101", "101", "010"],
    'R': ["110", "101", "110", "101", "101"],
    'S': ["011", "100", "010", "001", "110"],
    'T': ["111", "010", "010", "010", "010"],
    'U': ["101", "101", "101", "101", "111"],
    'Y': ["101", "101", "010", "010", "010"],
}


def text_width(s, sc):
    return sum((len(FONT[ch][0]) + 1) * sc for ch in s) - sc


def text_px(d, x, y, s, c, sc=1):
    cx = x
    for ch in s:
        rows = FONT[ch]
        for j, row in enumerate(rows):
            for i, bit in enumerate(row):
                if bit == '1':
                    R(d, cx + i * sc, y + j * sc, sc, sc, c)
        cx += (len(rows[0]) + 1) * sc


def ribbon(d, cx, y, s, sc=2, fill=hx('E8D9A0'), tc=hx('7A2417')):
    tw = text_width(s, sc)
    pad = 7
    h = 5 * sc + 8
    w = tw + pad * 2
    x = cx - w // 2
    dk = shade(fill, 0.78)
    d.polygon([(x - 8, y + 2), (x, y + 2), (x, y + h - 3),
               (x - 8, y + h - 3), (x - 4, y + h // 2)], fill=dk)
    d.polygon([(x + w + 8, y + 2), (x + w, y + 2), (x + w, y + h - 3),
               (x + w + 8, y + h - 3), (x + w + 4, y + h // 2)], fill=dk)
    R(d, x, y, w, h, fill)
    d.rectangle([x, y, x + w - 1, y + h - 1], outline=shade(fill, 0.65))
    text_px(d, cx - tw // 2, y + 4, s, tc, sc)


def cable(d, x0, x1, y0, sag, c, lift=0):
    for x in range(x0, x1):
        t = (x - x0) / max(1, x1 - x0)
        y = y0 + sag * math.sin(math.pi * t) - lift * t
        d.point((x, int(y)), c)
        d.point((x, int(y) + 1), c)


def canvas(bg):
    img = Image.new('RGB', (W, H), bg)
    return img, ImageDraw.Draw(img)


def save(img, name):
    OUT.mkdir(parents=True, exist_ok=True)
    img.resize((W * SCALE, H * SCALE), Image.NEAREST).save(OUT / name)
    print(name)


# ---------------------------------------------------------------- Limbo ----
def scene_limbo():
    wall = hx('7A2417')
    img, d = canvas(wall)

    # upper frieze
    R(d, 0, 0, W, 14, hx('4A120B'))
    for x in range(10, W, 48):
        R(d, x, 4, 20, 6, shade(CREAM, 0.55))       # dead signage
        R(d, x + 3, 6, 14, 2, hx('4A120B'))
    # wall tiling
    for y in range(16, 60, 10):
        d.line([(0, y), (W, y)], fill=shade(wall, 0.85))
    for x in range(0, W, 22):
        d.line([(x, 16), (x, 60)], fill=shade(wall, 0.9))

    # the ghost train, idling forever
    teal, tdark = hx('2E7F8C'), hx('23616B')
    R(d, 0, 58, W, 55, teal)
    R(d, 0, 58, W, 5, tdark)                         # roof stripe
    R(d, 0, 105, W, 8, hx('16323A'))                 # undercarriage
    for x in range(6, W, 52):                        # lit windows
        R(d, x, 68, 24, 18, hx('1C4A52'))
        R(d, x + 2, 70, 20, 14, hx('E8D9A0'))
        # a silhouette seated inside, here and there
        if (x // 52) % 2 == 0:
            R(d, x + 6, 74, 5, 10, hx('1C4A52'))
            R(d, x + 7, 72, 3, 3, hx('1C4A52'))
    for x in (96, 250):                              # sealed doors
        R(d, x, 66, 18, 40, tdark)
        d.line([(x + 9, 66), (x + 9, 105)], fill=hx('16323A'))
        R(d, x + 2, 74, 4, 10, hx('E8D9A0'))
        R(d, x + 12, 74, 4, 10, hx('E8D9A0'))
    R(d, 0, 92, W, 3, hx('D0483A'))                  # livery stripe

    # platform floor
    floor = hx('B33A26')
    R(d, 0, 113, W, 15, floor)
    R(d, 0, 113, W, 2, hx('D9C8A0'))                 # warning strip
    for x in range(0, W, 16):
        d.line([(x, 116), (x, 127)], fill=hx('8E2B1C'))
    d.line([(0, 121), (W, 121)], fill=hx('8E2B1C'))

    # cutaway stratum below
    R(d, 0, 128, W, 52, hx('2B0B06'))
    speckle(d, 0, 128, W, 52, hx('451509'), 0.08, seed=7)
    speckle(d, 0, 132, W, 44, hx('1A0602'), 0.05, seed=8)
    # stairwell down to the next circle — rose light rising
    R(d, 246, 128, 46, 52, hx('140301'))
    for i, sx in enumerate(range(250, 288, 9)):
        R(d, sx, 138 + i * 9, 38 - (sx - 250), 4, hx('6E1F12'))
    img = glow(img, 268, 182, 30, hx('C4788A'), alpha=95)
    d = ImageDraw.Draw(img)

    # columns
    for cx in (38, 278):
        R(d, cx, 14, 10, 100, hx('D9C8A0'))
        R(d, cx + 7, 14, 3, 100, hx('B7A47E'))
        R(d, cx - 2, 14, 14, 4, hx('D9C8A0'))
        R(d, cx - 2, 109, 14, 4, hx('D9C8A0'))

    # the waiting damned — queues that never board
    rnd = random.Random(4)
    coats = [hx('5C4632'), hx('8C5A2B'), hx('4A3B58'), hx('7A2E2E'),
             hx('2E5C4A'), hx('6B7F4A'), hx('8C8C94'), hx('B08030')]
    for i, px in enumerate([120, 132, 143, 156, 200, 212, 224, 236, 305, 60]):
        h = 14 + rnd.randrange(4)
        person(d, px, 126, h, coats[i % len(coats)],
               hair=rnd.choice([(30, 30, 30), (90, 70, 40), (150, 150, 150)]))
    # a bride, from the reference cast
    person(d, 168, 126, 15, hx('E8E0D0'), hair=(240, 235, 220))

    # Dante and Virgil, walking the platform
    person(d, 74, 127, 17, DANTE_COAT, hair=(25, 25, 25))
    person(d, 92, 127, 18, VIRGIL_GRAY, cap=hx('3F454F'))
    R(d, 98, 118, 3, 4, hx('8A8578'))                # doused lamp in hand

    ribbon(d, 160, 22, 'LIMBO', sc=2)
    return img


# -------------------------------------------------------------- Acheron ----
def scene_acheron():
    img, d = canvas(hx('0D120C'))

    # tiled wall, barely lit
    for y in range(14, 100, 12):
        d.line([(0, y), (W, y)], fill=hx('141B12'))
    for x in range(0, W, 26):
        d.line([(x, 14), (x, 100)], fill=hx('10160E'))
    R(d, 0, 0, W, 14, hx('060906'))                  # ceiling
    # broken departures board, cycling garbage
    R(d, 18, 18, 74, 16, hx('0A0D09'))
    d.rectangle([18, 18, 91, 33], outline=hx('1A2418'))
    rnd = random.Random(11)
    for row in range(2):
        for i in range(9):
            if rnd.random() < 0.6:
                R(d, 23 + i * 7, 22 + row * 6, 4, 3, hx('3D5A2E'))

    # hanging dead cables
    for (x0, x1, y0, sag) in [(0, 120, 8, 26), (80, 230, 4, 34),
                              (190, 320, 10, 22), (140, 320, 2, 40)]:
        cable(d, x0, x1, y0, sag, hx('060906'))

    # lamp glow first, so everything sits in its light
    img = glow(img, 128, 78, 46, hx('E8A33D'), alpha=80)
    d = ImageDraw.Draw(img)

    # black water
    R(d, 0, 112, W, 68, hx('050D0A'))
    rnd = random.Random(5)
    for _ in range(60):
        x, y = rnd.randrange(W), 114 + rnd.randrange(62)
        d.line([(x, y), (x + rnd.randrange(4, 14), y)], fill=hx('123528'))
    # lamp reflection
    for i, y in enumerate(range(114, 150, 4)):
        w = 22 - i * 2
        d.line([(128 - w // 2, y), (128 + w // 2, y)], fill=hx('6E5713'))

    # drowned turnstiles breaking the surface
    for tx in (34, 262, 300):
        R(d, tx, 98, 5, 16, hx('3A4148'))
        R(d, tx - 6, 100, 6, 2, hx('55606A'))
        R(d, tx + 5, 96, 6, 2, hx('55606A'))

    # the flat-car
    R(d, 84, 104, 128, 6, hx('4A3B28'))
    for x in range(88, 210, 14):
        d.line([(x, 104), (x, 109)], fill=hx('30251A'))
    R(d, 84, 110, 128, 4, hx('2A2118'))
    R(d, 86, 98, 2, 6, hx('55606A'))                 # railing stubs
    R(d, 208, 98, 2, 6, hx('55606A'))

    # huddled souls being ferried
    for sx in (98, 112, 126):
        R(d, sx, 94, 8, 10, shade(SOUL, 0.5))
        R(d, sx + 2, 90, 5, 5, shade(SOUL, 0.62))
    # a drowned soul grabbing the deck edge
    R(d, 76, 106, 8, 3, shade(SOUL, 0.35))
    R(d, 80, 102, 4, 4, shade(SOUL, 0.4))

    # Dante balancing mid-deck; Virgil with the lamp raised
    person(d, 158, 104, 17, DANTE_COAT, hair=(25, 25, 25), jump=False)
    person(d, 138, 104, 18, VIRGIL_GRAY, cap=hx('3F454F'))
    d.line([(135, 93), (132, 89)], fill=VIRGIL_GRAY, width=2)  # raised arm
    R(d, 130, 83, 4, 6, hx('E8A33D'))                # the lamp
    d.point((131, 82), fill=hx('F2E3B3'))

    # CHARON — the graveyard-shift conductor
    cx = 192
    d.polygon([(cx - 5, 104), (cx + 6, 104), (cx + 4, 66), (cx - 3, 66)],
              fill=hx('14201A'))                     # robe
    R(d, cx - 2, 60, 6, 7, shade(SOUL, 0.55))        # gaunt face
    R(d, cx - 4, 58, 10, 3, hx('0B0F0D'))            # peaked cap
    d.point((cx, 63), fill=hx('E8A33D'))             # coal eyes
    d.point((cx + 3, 63), fill=hx('E8A33D'))
    d.line([(cx + 6, 70), (cx + 26, 128)], fill=hx('2A2118'), width=2)  # pole
    d.line([(cx + 4, 74), (cx + 8, 74)], fill=shade(SOUL, 0.5))  # hand

    # dust motes in the lamplight
    speckle(d, 100, 50, 70, 50, hx('6E5713'), 0.012, seed=3)
    return img


# ----------------------------------------------------------------- Lust ----
def scene_lust():
    img, d = canvas(hx('5C3140'))

    # smoke strata
    R(d, 0, 0, W, 40, hx('3F2230'))
    R(d, 0, 40, W, 30, hx('4B2938'))
    R(d, 0, 130, W, 50, hx('6B3A4C'))

    # vast duct mouths
    d.ellipse([-30, 30, 60, 120], fill=hx('2B1722'))
    d.ellipse([-22, 38, 52, 112], fill=hx('140A10'))
    d.ellipse([270, 60, 380, 170], fill=hx('2B1722'))
    d.ellipse([280, 70, 370, 160], fill=hx('140A10'))
    # fan silhouette in the left duct
    for ang in (0.3, 2.4, 4.5):
        x0, y0 = 15, 75
        d.line([(x0, y0), (x0 + int(28 * math.cos(ang)),
                           y0 + int(28 * math.sin(ang)))],
               fill=hx('0B0509'), width=5)

    # the gale — streaks and carried letters
    rnd = random.Random(9)
    for i in range(14):
        y0 = 18 + i * 11 + rnd.randrange(6)
        amp = rnd.randrange(3, 9)
        ph = rnd.random() * 6
        for x in range(0, W, 2):
            if (x // 14 + i) % 3:
                y = y0 + amp * math.sin(x / 34 + ph)
                d.point((x, int(y)), fill=hx('D9A7B4'))
    for _ in range(26):                              # ruined letters
        x, y = rnd.randrange(W), 12 + rnd.randrange(120)
        R(d, x, y, 3, 2, hx('D9D3C8'))
        d.point((x + 1, y + 2), fill=hx('B8AEA6'))

    # souls blown two by two
    arc = [(48, 44), (86, 32), (128, 28), (170, 34), (212, 46), (248, 62)]
    coats = [hx('7A4356'), hx('8C5A2B'), hx('4A3B58'),
             hx('2E5C4A'), hx('8C8C94'), hx('7A2E2E')]
    for (x, y), c in zip(arc, coats):
        blown_person(d, x, y, c)

    # walkways
    for (x0, w) in [(0, 132), (186, 134)]:
        y0 = 122 if x0 == 0 else 138
        R(d, x0, y0, w, 8, hx('3A2531'))
        R(d, x0, y0, w, 2, hx('55374A'))
        for x in range(x0 + 6, x0 + w, 16):
            d.point((x, y0 + 5), fill=hx('55374A'))
            R(d, x, y0 + 8, 2, 172 - y0 - 8, hx('2B1722'))  # struts

    # Dante mid-jump, drifting on the wind
    person(d, 156, 116, 17, DANTE_COAT, hair=(25, 25, 25), jump=True)
    R(d, 146, 106, 5, 2, shade(DANTE_COAT, 0.75))    # coat streaming

    # Virgil braced on the far walkway, holding his cap
    person(d, 210, 138, 18, VIRGIL_GRAY, cap=hx('3F454F'))
    R(d, 203, 122, 4, 2, hx('3F454F'))               # hand to cap

    # Paolo & Francesca in the wind-shadow alcove
    R(d, 262, 128, 46, 10, hx('2B1722'))             # sheltering duct lip
    person(d, 285, 172, 13, hx('7A4356'), hair=(60, 30, 40))
    person(d, 294, 172, 14, hx('4A3B58'), hair=(30, 30, 30))
    R(d, 288, 164, 4, 3, hx('D9D3C8'))               # the paperback

    ribbon(d, 160, 10, 'LUST', sc=2, fill=hx('E8D9A0'), tc=hx('5C3140'))
    return img


# ------------------------------------------------------------ Treachery ----
def scene_treachery():
    img, d = canvas(hx('6E8B96'))

    # cold gradient
    R(d, 0, 0, W, 50, hx('5A7680'))
    R(d, 0, 50, W, 40, hx('7C99A3'))
    R(d, 0, 90, W, 60, hx('98B4BD'))

    # wing turbines, filling the top corners
    dark = hx('1B242B')
    d.polygon([(120, 44), (0, 0), (0, 58), (118, 58)], fill=dark)
    d.polygon([(200, 44), (320, 0), (320, 58), (202, 58)], fill=dark)
    for i in range(4):                               # blade slats
        d.line([(10 + i * 26, 6 + i * 4), (116, 48)], fill=hx('12161A'), width=2)
        d.line([(310 - i * 26, 6 + i * 4), (204, 48)], fill=hx('12161A'), width=2)
    # wind shear off the wings
    rnd = random.Random(13)
    for _ in range(40):
        x, y = rnd.randrange(W), rnd.randrange(30, 150)
        d.line([(x, y), (x + rnd.randrange(6, 18), y)], fill=hx('D8E8EC'))

    # LUCIFER — fused into the machine heart
    body = hx('12161A')
    d.polygon([(132, 30), (188, 30), (204, 150), (116, 150)], fill=body)
    # machinery fused at the flanks
    for (gx, gy) in [(108, 90), (212, 80), (104, 124), (216, 118)]:
        d.ellipse([gx - 10, gy - 10, gx + 10, gy + 10], fill=hx('1B242B'))
        d.ellipse([gx - 4, gy - 4, gx + 4, gy + 4], fill=hx('12161A'))
        for ang in range(0, 360, 60):
            a = math.radians(ang)
            R(d, int(gx + 11 * math.cos(a)) - 1,
              int(gy + 11 * math.sin(a)) - 1, 3, 3, hx('1B242B'))
    R(d, 96, 146, 128, 6, hx('1B242B'))              # seized drive housing
    # frost creeping up the body
    speckle(d, 120, 90, 84, 60, hx('BFD5DB'), 0.05, seed=21)
    speckle(d, 116, 130, 92, 20, hx('BFD5DB'), 0.12, seed=22)

    # the three faces — sunken, jaw-heavy, half-machine
    faces = [(147, 26, 36, 26, hx('5C1414')),        # crimson, forward
             (130, 15, 44, 20, hx('232826')),        # ashen, left
             (175, 15, 44, 20, hx('9E8A4A'))]        # pale yellow, right
    for (fx, fw, fy, fh, fc) in faces:
        R(d, fx, fy, fw, fh, fc)
        R(d, fx, fy, fw, 2, shade(fc, 0.5))                  # heavy brow
        ew, eh = max(2, fw // 7), fh // 4
        R(d, fx + fw // 4 - ew // 2, fy + 4, ew, eh, hx('05070A'))  # hollow
        R(d, fx + 3 * fw // 4 - ew // 2, fy + 4, ew, eh, hx('05070A'))
        jy = fy + fh - fh // 3
        R(d, fx + 1, jy, fw - 2, fh // 3, hx('05070A'))      # open jaw
        for tx in range(fx + 2, fx + fw - 2, 4):
            R(d, tx, jy, 2, 2, shade(fc, 0.7))               # broken teeth
        d.line([(fx - 1, fy + 2), (fx - 1, fy + fh)], fill=hx('05070A'))
        d.line([(fx + fw, fy + 2), (fx + fw, fy + fh)], fill=hx('05070A'))
    # icicles hanging from the jaws
    for jx in (152, 164, 137, 182, 199):
        d.line([(jx, 60), (jx, 64 + jx % 3)], fill=hx('D8E8EC'))
    # a crown of ice
    speckle(d, 130, 30, 60, 8, hx('D8E8EC'), 0.2, seed=23)

    # the frozen lake
    ice = hx('BFD5DB')
    R(d, 0, 150, W, 30, ice)
    for _ in range(16):                              # cracks
        x0, y0 = rnd.randrange(W), 152 + rnd.randrange(24)
        for seg in range(4):
            x1 = x0 + rnd.randrange(-14, 16)
            y1 = y0 + rnd.randrange(-2, 4)
            d.line([(x0, y0), (x1, y1)], fill=hx('7FA0AB'))
            x0, y0 = x1, y1
    # the damned sealed under the surface — Ugolino and his enemy together
    for (sx, sy, sw) in [(30, 162, 14), (70, 170, 12), (250, 165, 13),
                         (288, 158, 12)]:
        R(d, sx, sy, sw, 4, hx('45606B'))
        R(d, sx + sw, sy - 1, 4, 4, hx('45606B'))
    R(d, 210, 168, 12, 4, hx('32444D'))
    R(d, 220, 166, 12, 4, hx('32444D'))              # the pair, locked close

    # Dante climbing down the flank; Virgil below
    person(d, 203, 96, 11, DANTE_COAT, hair=(25, 25, 25))
    d.line([(199, 88), (196, 90)], fill=SKIN)        # gripping hand
    person(d, 208, 128, 11, VIRGIL_GRAY, cap=hx('3F454F'))

    ribbon(d, 160, 6, 'TREACHERY', sc=1, fill=hx('D8E8EC'), tc=hx('12161A'))
    return img


if __name__ == '__main__':
    save(scene_acheron(), 'mockup-0-acheron.png')
    save(scene_limbo(), 'mockup-1-limbo.png')
    save(scene_lust(), 'mockup-2-lust.png')
    save(scene_treachery(), 'mockup-9-treachery.png')
