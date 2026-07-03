#!/usr/bin/env python3
"""INFERNO concept mockups — flat-vector, Another World remaster style.

Smooth flat polygon shapes, soft vertical gradients, heavy silhouettes,
rim light, no outlines. Palettes from design/04-art-audio-bible.md.

Scenes are authored in a 320x180 logical space, rendered supersampled at
8x and downscaled to 1280x720 for smooth vector-like edges.

Usage: python3 generate.py [outdir]
"""
import math
import random
import sys
from pathlib import Path

from PIL import Image, ImageDraw

LW, LH = 320, 180          # logical stage
RS = 8                     # supersample factor
FW, FH = 1280, 720         # final output
OUT = Path(sys.argv[1]) if len(sys.argv) > 1 else Path(__file__).parent


def hx(s):
    s = s.lstrip('#')
    return tuple(int(s[i:i + 2], 16) for i in (0, 2, 4))


def shade(c, f):
    return tuple(max(0, min(255, int(v * f))) for v in c)


def mix(c0, c1, t):
    return tuple(int(a + (b - a) * t) for a, b in zip(c0, c1))


def P(pts):
    return [(x * RS, y * RS) for x, y in pts]


def poly(d, pts, c):
    d.polygon(P(pts), fill=c)


def ell(d, x0, y0, x1, y1, c):
    d.ellipse([x0 * RS, y0 * RS, x1 * RS, y1 * RS], fill=c)


def box(d, x, y, w, h, c):
    d.rectangle([x * RS, y * RS, (x + w) * RS, (y + h) * RS], fill=c)


def rbox(d, x, y, w, h, r, c):
    d.rounded_rectangle([x * RS, y * RS, (x + w) * RS, (y + h) * RS],
                        radius=r * RS, fill=c)


def stroke(d, pts, c, w=1.0):
    d.line(P(pts), fill=c, width=max(1, int(w * RS)), joint='curve')


def vgrad(d, y0, y1, c0, c1, x0=0, x1=LW):
    ry0, ry1 = int(y0 * RS), int(y1 * RS)
    for ry in range(ry0, ry1):
        t = (ry - ry0) / max(1, ry1 - ry0)
        d.line([(x0 * RS, ry), (x1 * RS, ry)], fill=mix(c0, c1, t))


def overlay(img, fn):
    ov = Image.new('RGBA', img.size, (0, 0, 0, 0))
    fn(ImageDraw.Draw(ov))
    out = Image.alpha_composite(img.convert('RGBA'), ov).convert('RGB')
    img.paste(out)


def poly_a(img, pts, color, a):
    overlay(img, lambda od: od.polygon(P(pts), fill=color + (a,)))


def glow(img, cx, cy, r, color, alpha=70):
    def fn(od):
        for rr in range(int(r * RS), 0, -RS // 2):
            a = int(alpha * (1 - rr / (r * RS)) ** 1.5) + 3
            od.ellipse([cx * RS - rr, cy * RS - rr,
                        cx * RS + rr, cy * RS + rr], fill=color + (a,))
    overlay(img, fn)


def dust(img, x, y, w, h, color, n, size=0.5, alpha=150, seed=1):
    rnd = random.Random(seed)
    def fn(od):
        for _ in range(n):
            px = (x + rnd.random() * w) * RS
            py = (y + rnd.random() * h) * RS
            s = size * RS * (0.5 + rnd.random())
            od.ellipse([px, py, px + s, py + s], fill=color + (alpha,))
    overlay(img, fn)


SKIN = hx('C9986B')
DANTE_COAT = hx('2A2F38')
VIRGIL_GRAY = hx('565B63')
CREAM = hx('EFE3C0')


def figure(d, x, y, h, shirt, pants=None, skin=SKIN, hair=(22, 20, 20),
           cap=None, pose='stand', rim=None, rim_side=1):
    """Flat-shape cutout figure. x center, y feet, h total height."""
    pants = pants or shade(shirt, 0.55)
    legs, torso = h * 0.46, h * 0.38
    hip, sh = y - legs, y - legs - torso
    # torso, shoulders wider than hips
    poly(d, [(x - h * .11, sh), (x + h * .11, sh),
             (x + h * .075, hip), (x - h * .075, hip)], shirt)
    # head + neck
    hr = h * 0.075
    hcy = sh - hr - h * 0.015
    box(d, x - h * .02, sh - h * .03, h * .04, h * .04, skin)
    ell(d, x - hr, hcy - hr * 1.15, x + hr, hcy + hr * 1.15, skin)
    if cap:
        d.pieslice([int((x - hr * 1.15) * RS), int((hcy - hr * 1.5) * RS),
                    int((x + hr * 1.15) * RS), int((hcy + hr * 0.9) * RS)],
                   180, 360, fill=cap)
        box(d, x - hr * 1.3, hcy - hr * 0.35, hr * 2.6, hr * 0.35, cap)
    else:
        d.pieslice([int((x - hr) * RS), int((hcy - hr * 1.2) * RS),
                    int((x + hr) * RS), int((hcy + hr * 0.7) * RS)],
                   180, 360, fill=hair)
    # legs
    st = h * 0.16 if pose == 'walk' else h * 0.045
    poly(d, [(x - h * .07, hip), (x - h * .005, hip),
             (x - st + h * .02, y), (x - st - h * .02, y)], pants)
    poly(d, [(x + h * .005, hip), (x + h * .07, hip),
             (x + st + h * .02, y), (x + st - h * .02, y)], pants)
    # near arm
    poly(d, [(x + rim_side * h * .06, sh + h * .02),
             (x + rim_side * h * .10, sh + h * .03),
             (x + rim_side * h * .075, hip - h * .01),
             (x + rim_side * h * .045, hip - h * .02)], shade(shirt, 0.85))
    if rim:
        stroke(d, [(x + rim_side * h * .105, sh + h * .01),
                   (x + rim_side * h * .07, hip)], rim, 0.45)


def hunched(d, x, y, h, c):
    poly(d, [(x - h * .3, y), (x - h * .18, y - h * .55),
             (x + h * .05, y - h), (x + h * .3, y - h * .45), (x + h * .22, y)], c)
    ell(d, x - h * .05, y - h * 1.08, x + h * .22, y - h * .82, c)


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


def label(d, cx, y, s, c=CREAM, sc=1.6):
    widths = [(len(FONT[ch][0]) + 1) * sc for ch in s]
    x = cx - (sum(widths) - sc) / 2
    for ch, wch in zip(s, widths):
        for j, row in enumerate(FONT[ch]):
            for i, bit in enumerate(row):
                if bit == '1':
                    box(d, x + i * sc + 0.3, y + j * sc + 0.3, sc, sc, (0, 0, 0))
                    box(d, x + i * sc, y + j * sc, sc, sc, c)
        x += wch


def cable(d, x0, x1, y0, sag, c, w=0.7):
    pts = []
    for x in range(x0, x1 + 1, 4):
        t = (x - x0) / max(1, x1 - x0)
        pts.append((x, y0 + sag * math.sin(math.pi * t)))
    stroke(d, pts, c, w)


def canvas(bg):
    img = Image.new('RGB', (LW * RS, LH * RS), bg)
    return img, ImageDraw.Draw(img)


def save(img, name):
    OUT.mkdir(parents=True, exist_ok=True)
    img.resize((FW, FH), Image.LANCZOS).save(OUT / name)
    print(name)


# -------------------------------------------------------------- Acheron ----
def scene_acheron():
    img, d = canvas(hx('050A07'))
    vgrad(d, 0, 112, hx('020503'), hx('0C1710'))

    # ceiling mass, ragged
    poly(d, [(0, 0), (LW, 0), (LW, 9), (250, 15), (180, 8), (90, 17),
             (40, 10), (0, 15)], (2, 4, 3))
    for (x0, x1, y0, sag) in [(0, 130, 5, 30), (100, 250, 1, 40),
                              (200, 320, 7, 26)]:
        cable(d, x0, x1, y0, sag, (2, 4, 3))

    # far pillar slabs
    for px in (48, 122, 208, 284):
        poly(d, [(px, 16), (px + 10, 16), (px + 8, 112), (px - 2, 112)],
             hx('0A130B'))

    # dead departures board
    rbox(d, 20, 21, 64, 14, 1, (3, 6, 4))
    for gx in (27, 45, 66):
        box(d, gx, 26.5, 6, 1.6, hx('4A5713'))

    # the lamp and its cone
    lx, ly = 131, 82
    glow(img, lx, ly, 42, hx('E8A33D'), alpha=58)
    poly_a(img, [(lx - 2, ly), (lx + 3, ly), (lx + 27, 112), (lx - 27, 112)],
           hx('E8A33D'), 30)
    poly_a(img, [(lx - 1, ly), (lx + 2, ly), (lx + 14, 112), (lx - 14, 112)],
           hx('F2CE7A'), 26)
    d = ImageDraw.Draw(img)

    # black water
    vgrad(d, 112, 180, (3, 7, 5), (1, 4, 3))
    rnd = random.Random(5)
    for _ in range(30):
        x, y = rnd.randrange(LW), 116 + rnd.randrange(60)
        stroke(d, [(x, y), (x + rnd.randrange(7, 20), y)], hx('0F2C1F'), 0.5)
    for i, y in enumerate(range(115, 143, 4)):       # lamp reflection
        w = 18 - i * 2.2
        stroke(d, [(lx - w / 2, y), (lx + w / 2, y)], hx('6E5713'), 0.6)

    # drowned turnstiles
    for tx in (30, 262, 300):
        poly(d, [(tx, 97), (tx + 5, 97), (tx + 4, 114), (tx + 1, 114)],
             hx('121A15'))
        stroke(d, [(tx - 6, 101), (tx + 11, 98.5)], hx('1B2620'), 0.8)

    # flat-car, one lamplit rim
    poly(d, [(82, 104), (214, 104), (218, 114), (78, 114)], (3, 5, 4))
    stroke(d, [(96, 104), (178, 104)], hx('6E5713'), 0.6)

    # ferried souls
    for sx, sh_ in ((100, 13), (114, 15), (127, 12)):
        hunched(d, sx, 104, sh_, hx('0E1318'))

    # Virgil raising the lamp; Dante balancing
    figure(d, 140, 104, 27, VIRGIL_GRAY, cap=hx('2A2F36'),
           rim=hx('E8A33D'), rim_side=-1)
    stroke(d, [(137, 91), (132, 84)], VIRGIL_GRAY, 1.1)
    rbox(d, lx - 2, ly - 2, 4, 5.5, 1, hx('E8A33D'))
    ell(d, lx - 0.8, ly - 3, lx + 0.8, ly - 1.6, hx('F2E3B3'))
    figure(d, 160, 104, 26, DANTE_COAT, pose='walk', rim=hx('B37A2E'),
           rim_side=-1)

    # CHARON — tall silhouette, two coals for eyes
    cx = 194
    poly(d, [(cx - 3, 57), (cx + 5, 57), (cx + 9, 86), (cx + 13, 104),
             (cx - 11, 104), (cx - 6, 82)], (4, 7, 5))
    poly(d, [(cx - 7, 58), (cx + 9, 58), (cx + 5, 53), (cx - 3, 53)], (4, 7, 5))
    ell(d, cx - 0.7, 59.3, cx + 0.7, 60.7, hx('E8A33D'))
    ell(d, cx + 2.3, 59.3, cx + 3.7, 60.7, hx('E8A33D'))
    glow(img, cx + 1.5, 60, 5, hx('E8A33D'), alpha=60)
    d = ImageDraw.Draw(img)
    stroke(d, [(cx + 7, 68), (cx + 28, 130)], (2, 4, 3), 1.1)

    # a hand of the drowned at the deck edge
    poly(d, [(76, 112), (84, 107), (86, 112)], hx('0E1318'))

    dust(img, 100, 46, 66, 56, hx('E8A33D'), 40, 0.35, 90, seed=3)
    return img


# ---------------------------------------------------------------- Limbo ----
def scene_limbo():
    img, d = canvas(hx('5E1A0F'))
    vgrad(d, 0, 70, hx('40100A'), hx('6B2013'))
    box(d, 0, 0, LW, 8, (12, 3, 2))
    for bx in (60, 160, 260):
        poly(d, [(bx - 2, 8), (bx + 2, 8), (bx + 6, 18), (bx - 6, 18)],
             (12, 3, 2))

    # the ghost train
    vgrad(d, 58, 108, hx('27717C'), hx('1D5660'))
    box(d, 0, 58, LW, 5, hx('194C54'))
    box(d, 0, 100, LW, 8, hx('0F2A30'))
    wins = list(range(10, LW, 56))
    for x in wins:
        rbox(d, x, 68, 26, 18, 2, hx('E8D9A0'))
        if (x // 56) % 2 == 0:                       # a passenger, seated
            ell(d, x + 7, 70.5, x + 12, 75.5, hx('194C54'))
            rbox(d, x + 6, 74, 7, 12, 1.5, hx('194C54'))
    for x in (122, 262):                             # sealed doors
        rbox(d, x, 64, 16, 44, 1.5, hx('1B535C'))
        stroke(d, [(x + 8, 64), (x + 8, 108)], hx('0F2A30'), 0.6)

    # window light pools on the platform
    for x in wins:
        poly_a(img, [(x - 1, 86), (x + 27, 86), (x + 38, 116), (x - 13, 116)],
               hx('E8D9A0'), 22)
        poly_a(img, [(x + 3, 86), (x + 23, 86), (x + 30, 116), (x - 4, 116)],
               hx('E8D9A0'), 16)
    d = ImageDraw.Draw(img)

    # platform slab and the dark below
    vgrad(d, 108, 128, hx('9A3220'), hx('792415'))
    stroke(d, [(0, 108), (LW, 108)], hx('C24630'), 0.6)
    poly(d, [(0, 128), (LW, 128), (LW, 180), (0, 180)], (16, 4, 2))
    poly(d, [(0, 128), (LW, 128), (LW, 131), (240, 129.5), (150, 133),
             (60, 129.5), (0, 132)], (20, 5, 3))
    dust(img, 0, 132, LW, 46, (60, 16, 9), 260, 0.4, 120, seed=7)
    d = ImageDraw.Draw(img)
    # stairwell down — the rose light of Lust rising
    box(d, 250, 128, 40, 52, (7, 2, 1))
    glow(img, 270, 186, 34, hx('C4788A'), alpha=80)
    d = ImageDraw.Draw(img)
    for i, sx in enumerate(range(254, 286, 8)):
        box(d, sx, 140 + i * 9, 32 - (sx - 254), 3, hx('471523'))

    # the waiting damned, backlit
    rnd = random.Random(4)
    dark = hx('200906')
    for px in (58, 70, 96, 106, 150, 161, 172, 216, 227, 252, 300):
        h = 22 + rnd.randrange(5)
        figure(d, px, 126, h, dark, pants=dark, skin=dark, hair=dark,
               rim=hx('B37A2E'), rim_side=1)
    # the bride
    figure(d, 188, 126, 24, hx('D8CFC0'), pants=hx('D8CFC0'),
           hair=(228, 221, 208))

    # Dante and Virgil walking the platform
    figure(d, 26, 126, 26, DANTE_COAT, pose='walk', rim=hx('E8D9A0'))
    figure(d, 45, 126, 27, VIRGIL_GRAY, cap=hx('33383F'), pose='walk',
           rim=hx('E8D9A0'))
    rbox(d, 50, 114, 3, 4.5, 1, hx('4A4438'))        # doused lamp

    # foreground columns crop the frame
    poly(d, [(0, 0), (17, 0), (13, 180), (0, 180)], (10, 2, 1))
    poly(d, [(LW, 0), (LW - 15, 0), (LW - 11, 180), (LW, 180)], (10, 2, 1))

    label(d, 160, 20, 'LIMBO', sc=2)
    return img


# ----------------------------------------------------------------- Lust ----
def scene_lust():
    img, d = canvas(hx('542E3F'))
    vgrad(d, 0, 180, hx('200E17'), hx('6B3A50'))

    # colossal duct mouths
    ell(d, -40, 26, 66, 132, (18, 8, 14))
    ell(d, -30, 36, 56, 122, (7, 3, 6))
    ell(d, 264, 56, 386, 178, (18, 8, 14))
    ell(d, 276, 68, 374, 166, (7, 3, 6))
    for ang in (0.4, 2.5, 4.6):                      # the dead fan
        stroke(d, [(13, 79), (13 + 30 * math.cos(ang),
                              79 + 30 * math.sin(ang))], (3, 1, 3), 3)

    # the gale
    rnd = random.Random(9)
    for i in range(9):
        y0 = 16 + i * 17 + rnd.randrange(6)
        amp = rnd.randrange(4, 10)
        ph = rnd.random() * 6
        pts = [(x, y0 + amp * math.sin(x / 40 + ph)) for x in range(0, LW, 5)]
        for k in range(0, len(pts) - 8, 12):
            stroke(d, pts[k:k + 9], hx('9C6A7C'), 0.45)
    for _ in range(16):                              # letters on the wind
        x, y = rnd.randrange(LW), 12 + rnd.randrange(120)
        a = rnd.random() * math.pi
        ca, sa = 1.6 * math.cos(a), 1.6 * math.sin(a)
        poly(d, [(x - ca, y - sa), (x + sa, y - ca), (x + ca, y + sa),
                 (x - sa, y + ca)], hx('D9D3C8'))

    # souls blown two by two
    arc = [(52, 46), (92, 33), (134, 28), (176, 33), (216, 46), (250, 64)]
    for (x, y) in arc:
        poly(d, [(x - 9, y + 2), (x + 6, y - 1.5), (x + 11, y + 1),
                 (x + 6, y + 4), (x - 13, y + 5)], (24, 11, 18))
        ell(d, x + 8, y - 3.5, x + 13, y + 1, (24, 11, 18))
        stroke(d, [(x - 8, y + 2), (x + 6, y - 1)], hx('9C6A7C'), 0.45)

    # walkways
    poly(d, [(0, 120), (128, 120), (132, 130), (0, 130)], (12, 5, 9))
    stroke(d, [(0, 120), (128, 120)], hx('8A5A6C'), 0.6)
    poly(d, [(186, 136), (320, 136), (320, 146), (182, 146)], (12, 5, 9))
    stroke(d, [(186, 136), (320, 136)], hx('8A5A6C'), 0.6)
    for x in (30, 80, 210, 260, 300):
        yt = 130 if x < 180 else 146
        box(d, x, yt, 2, 180 - yt, (12, 5, 9))

    # Dante mid-jump, drifting; coat streaming
    figure(d, 152, 112, 26, DANTE_COAT, pose='walk', rim=hx('C79AA8'),
           rim_side=-1)
    poly(d, [(147, 99), (140, 96.5), (141, 99.5), (147, 101)],
         shade(DANTE_COAT, 0.8))

    # Virgil braced, hand to cap
    figure(d, 214, 136, 27, VIRGIL_GRAY, cap=hx('33383F'), rim=hx('C79AA8'),
           rim_side=-1)
    stroke(d, [(209, 113), (213, 111)], VIRGIL_GRAY, 0.9)

    # Paolo & Francesca in the wind-shadow
    poly(d, [(256, 128), (312, 128), (318, 140), (250, 140)], (7, 3, 6))
    figure(d, 288, 174, 20, (32, 15, 24), pants=(32, 15, 24),
           hair=(20, 9, 15))
    figure(d, 296, 174, 21, (32, 15, 24), pants=(32, 15, 24),
           hair=(20, 9, 15))
    box(d, 290.5, 162, 3, 2, hx('D9D3C8'))           # the paperback
    stroke(d, [(283, 158), (283, 167)], hx('C79AA8'), 0.45)

    label(d, 160, 8, 'LUST', sc=2)
    return img


# ------------------------------------------------------------ Treachery ----
def scene_treachery():
    img, d = canvas(hx('42585F'))
    vgrad(d, 0, 148, hx('1D2930'), hx('5F7C87'))

    # wings owning the top corners
    poly(d, [(126, 40), (0, 0), (0, 66), (60, 58), (122, 62)], (6, 9, 11))
    poly(d, [(194, 40), (320, 0), (320, 66), (260, 58), (198, 62)], (6, 9, 11))
    for i in range(4):
        stroke(d, [(6 + i * 28, 4 + i * 5), (122, 52)], hx('222F35'), 1)
        stroke(d, [(314 - i * 28, 4 + i * 5), (198, 52)], hx('222F35'), 1)
    rnd = random.Random(13)
    for _ in range(40):                              # wind shear
        x, y = rnd.randrange(LW), rnd.randrange(24, 150)
        stroke(d, [(x, y), (x + rnd.randrange(8, 24), y)], hx('C7DCE2'), 0.4)

    # LUCIFER — one black mass fused into the seized machine
    poly(d, [(138, 22), (182, 22), (176, 13), (144, 13)], (4, 6, 8))
    poly(d, [(130, 30), (190, 30), (208, 150), (112, 150)], (4, 6, 8))
    poly(d, [(130, 30), (190, 30), (182, 22), (138, 22)], (4, 6, 8))
    for (gx, gy, gr) in [(106, 92, 13), (216, 82, 13), (102, 128, 10),
                         (220, 122, 11)]:
        ell(d, gx - gr, gy - gr, gx + gr, gy + gr, (6, 9, 11))
        for ang in range(0, 360, 45):
            a = math.radians(ang)
            tx, ty = gx + (gr + 1.5) * math.cos(a), gy + (gr + 1.5) * math.sin(a)
            ell(d, tx - 1.8, ty - 1.8, tx + 1.8, ty + 1.8, (6, 9, 11))
        ell(d, gx - 3, gy - 3, gx + 3, gy + 3, (4, 6, 8))
    box(d, 92, 146, 136, 6, (6, 9, 11))

    # three faces: only burning eyes and a breathing jaw
    for (ex, ey, ec) in [(152, 38, hx('B33A26')),
                         (138, 44, hx('8A8F96')),
                         (176, 44, hx('C9B26B'))]:
        ell(d, ex, ey, ex + 2, ey + 2, ec)
        ell(d, ex + 6, ey, ex + 8, ey + 2, ec)
        glow(img, ex + 4, ey + 1, 8, ec, alpha=65)
        d = ImageDraw.Draw(img)
        stroke(d, [(ex - 1, ey + 10), (ex + 9, ey + 10)], shade(ec, 0.5), 0.7)

    # frost climbing the mass; the ice crown
    dust(img, 116, 96, 92, 54, hx('C7DCE2'), 240, 0.4, 130, seed=21)
    dust(img, 112, 132, 104, 18, hx('C7DCE2'), 220, 0.5, 150, seed=22)
    dust(img, 136, 13, 50, 10, hx('C7DCE2'), 90, 0.5, 170, seed=23)
    d = ImageDraw.Draw(img)

    # the frozen lake
    vgrad(d, 148, 180, hx('8FAAB4'), hx('B4CFD8'))
    for _ in range(14):                              # cracks
        x0, y0 = rnd.randrange(LW), 152 + rnd.randrange(24)
        pts = [(x0, y0)]
        for _ in range(4):
            x0 += rnd.randrange(-16, 18)
            y0 += rnd.randrange(-2, 4)
            pts.append((x0, y0))
        stroke(d, pts, hx('6E8B96'), 0.4)
    # the damned sealed under the surface; one pair locked close
    for (sx, sy, sw) in [(34, 162, 15), (74, 170, 12), (248, 166, 14)]:
        rbox(d, sx, sy, sw, 2.6, 1, hx('54707B'))
        ell(d, sx + sw, sy - 1, sx + sw + 3.4, sy + 2.4, hx('54707B'))
    rbox(d, 206, 168, 11, 2.6, 1, hx('3C525C'))
    rbox(d, 216, 166, 11, 2.6, 1, hx('3C525C'))

    # Dante climbing the flank; Virgil below on the ice
    figure(d, 206, 98, 15, DANTE_COAT, rim=hx('C7DCE2'), rim_side=1)
    stroke(d, [(203, 88.5), (200, 90.5)], SKIN, 0.5)
    figure(d, 214, 148, 15, VIRGIL_GRAY, cap=hx('33383F'),
           rim=hx('C7DCE2'), rim_side=1)

    # foreground ice ridges
    poly(d, [(0, 180), (0, 150), (28, 158), (58, 172), (74, 180)],
         hx('141F26'))
    poly(d, [(320, 180), (320, 154), (296, 160), (270, 174), (258, 180)],
         hx('141F26'))

    label(d, 160, 5, 'TREACHERY', sc=1.2)
    return img


if __name__ == '__main__':
    save(scene_acheron(), 'mockup-0-acheron.png')
    save(scene_limbo(), 'mockup-1-limbo.png')
    save(scene_lust(), 'mockup-2-lust.png')
    save(scene_treachery(), 'mockup-9-treachery.png')
