#!/usr/bin/env python3
"""INFERNO concept mockups — Another World (1991) visual language.

Big flat color planes, banded gradients with dithered seams, heavy
silhouettes, slender flat-shaded figures, rim light, banded light cones.
Palettes from design/04-art-audio-bible.md, darkened toward AW contrast.

Renders at the game's internal grid (320x180), upscaled 4x to 1280x720.

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


def bands(d, y0, y1, colors, x0=0, x1=W):
    """Horizontal gradient bands with a dithered seam — the AW sky."""
    n = len(colors)
    for i, c in enumerate(colors):
        ya = y0 + (y1 - y0) * i // n
        yb = y0 + (y1 - y0) * (i + 1) // n
        R(d, x0, ya, x1 - x0, yb - ya, c)
        if i:  # checker-dither the seam upward
            for x in range(x0, x1, 2):
                d.point((x + (ya % 2), ya - 1), c)


def speckle(d, x, y, w, h, c, density=0.06, seed=1):
    rnd = random.Random(seed)
    for _ in range(int(w * h * density)):
        d.point((x + rnd.randrange(w), y + rnd.randrange(h)), c)


def poly_a(img, pts, color, a):
    ov = Image.new('RGBA', img.size, (0, 0, 0, 0))
    ImageDraw.Draw(ov).polygon(pts, fill=color + (a,))
    img.paste(Image.alpha_composite(img.convert('RGBA'), ov).convert('RGB'))


def glow(img, cx, cy, r, color, alpha=70):
    ov = Image.new('RGBA', img.size, (0, 0, 0, 0))
    od = ImageDraw.Draw(ov)
    for rr in range(r, 0, -2):
        a = int(alpha * (1 - rr / r) ** 1.4) + 4
        od.ellipse([cx - rr, cy - rr, cx + rr, cy + rr], fill=color + (a,))
    img.paste(Image.alpha_composite(img.convert('RGBA'), ov).convert('RGB'))


SKIN = hx('C9986B')
DANTE_COAT = hx('2A2F38')
VIRGIL_GRAY = hx('565B63')
CREAM = hx('EFE3C0')


def figure(d, x, y, h, shirt, pants=None, skin=SKIN, hair=(20, 20, 20),
           cap=None, pose='stand', rim=None, rim_side=1):
    """Slender AW-proportioned figure. x center, y feet, h total height."""
    pants = pants or shade(shirt, 0.55)
    head = max(3, int(h * 0.16))
    legs = int(h * 0.46)
    torso = h - head - legs
    top = y - h
    hw = max(1, int(h * 0.07))
    R(d, x - hw, top, hw * 2 + 1, head, skin)
    if cap:
        R(d, x - hw - 1, top - 1, hw * 2 + 3, 2, cap)
    else:
        R(d, x - hw, top, hw * 2 + 1, max(1, head // 3), hair)
    tw = max(2, int(h * 0.11))
    d.polygon([(x - tw, top + head), (x + tw, top + head),
               (x + tw - 1, top + head + torso), (x - tw + 1, top + head + torso)],
              fill=shirt)
    lw = max(1, int(h * 0.05))
    ly = y - legs
    if pose == 'walk':
        d.polygon([(x - 1, ly), (x + 1, ly), (x - tw - 2, y), (x - tw - 3, y)],
                  fill=pants)
        d.polygon([(x - 1, ly), (x + 1, ly), (x + tw + 2, y), (x + tw + 1, y)],
                  fill=pants)
    else:
        R(d, x - tw + 1, ly, lw + 1, legs, pants)
        R(d, x + tw - lw - 1, ly, lw + 1, legs, pants)
    if rim:  # one lit edge — the AW rim light
        d.line([(x + rim_side * tw, top + head),
                (x + rim_side * (tw - 1), top + head + torso)], fill=rim)


def silhouette(d, x, y, h, c, pose='stand', hunch=False):
    if hunch:
        d.polygon([(x - int(h * .22), y), (x - int(h * .12), y - int(h * .6)),
                   (x + int(h * .1), y - h), (x + int(h * .25), y - int(h * .5)),
                   (x + int(h * .18), y)], fill=c)
    else:
        figure(d, x, y, h, c, pants=c, skin=c, hair=c, pose=pose)


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


def label(d, cx, y, s, c=CREAM, sc=1):
    """Austere AW title: plain letterspaced caps with a hard shadow."""
    x = cx - text_width(s, sc) // 2
    text_px(d, x + 1, y + 1, s, (0, 0, 0), sc)
    text_px(d, x, y, s, c, sc)


def cable(d, x0, x1, y0, sag, c):
    for x in range(x0, x1):
        t = (x - x0) / max(1, x1 - x0)
        y = y0 + sag * math.sin(math.pi * t)
        d.point((x, int(y)), c)
        d.point((x, int(y) + 1), c)


def canvas(bg):
    img = Image.new('RGB', (W, H), bg)
    return img, ImageDraw.Draw(img)


def save(img, name):
    OUT.mkdir(parents=True, exist_ok=True)
    img.resize((W * SCALE, H * SCALE), Image.NEAREST).save(OUT / name)
    print(name)


# -------------------------------------------------------------- Acheron ----
def scene_acheron():
    img, d = canvas(hx('050A07'))
    bands(d, 0, 115, [hx('030604'), hx('050A07'), hx('081009'), hx('0A140B')])

    # angular ceiling mass
    d.polygon([(0, 0), (W, 0), (W, 10), (250, 16), (180, 9), (90, 18),
               (40, 11), (0, 16)], fill=(2, 4, 3))
    for (x0, x1, y0, sag) in [(0, 130, 6, 30), (100, 250, 2, 40),
                              (200, 320, 8, 26)]:
        cable(d, x0, x1, y0, sag, (2, 4, 3))

    # far pillar slabs, barely lighter than the dark
    for px in (48, 122, 208, 284):
        d.polygon([(px, 18), (px + 10, 18), (px + 8, 112), (px - 2, 112)],
                  fill=hx('0B150C'))

    # dead departures board, three dim glyphs still burning
    R(d, 20, 22, 64, 14, (3, 6, 4))
    for gx in (26, 44, 66):
        R(d, gx, 27, 6, 2, hx('4A5713'))

    # the lamp: point, halo, banded cone falling on the deck
    lx, ly = 131, 82
    glow(img, lx, ly, 40, hx('E8A33D'), alpha=60)
    d = ImageDraw.Draw(img)
    poly_a(img, [(lx - 2, ly), (lx + 3, ly), (lx + 26, 112), (lx - 26, 112)],
           hx('E8A33D'), 34)
    poly_a(img, [(lx - 1, ly), (lx + 2, ly), (lx + 14, 112), (lx - 14, 112)],
           hx('F2CE7A'), 30)
    d = ImageDraw.Draw(img)

    # black water
    R(d, 0, 112, W, 68, (2, 5, 4))
    rnd = random.Random(5)
    for _ in range(36):
        x, y = rnd.randrange(W), 116 + rnd.randrange(60)
        d.line([(x, y), (x + rnd.randrange(6, 18), y)], fill=hx('0F2C1F'))
    for i, y in enumerate(range(114, 142, 4)):     # lamp reflection
        w = 18 - i * 2
        d.line([(lx - w // 2, y), (lx + w // 2, y)], fill=hx('6E5713'))

    # drowned turnstiles
    for tx in (30, 262, 300):
        d.polygon([(tx, 98), (tx + 5, 98), (tx + 4, 114), (tx + 1, 114)],
                  fill=hx('141B18'))
        d.line([(tx - 6, 101), (tx + 11, 99)], fill=hx('1C2620'))

    # the flat-car: black slab, one lamplit rim
    d.polygon([(82, 104), (214, 104), (218, 114), (78, 114)], fill=(3, 5, 4))
    d.line([(96, 104), (176, 104)], fill=hx('6E5713'))

    # ferried souls, hunched silhouettes with a breath of rim light
    for sx, sh in ((100, 13), (114, 15), (127, 12)):
        silhouette(d, sx, 104, sh, hx('10151A'), hunch=True)
        d.point((sx + 3, 104 - sh), fill=hx('3A4148'))

    # Virgil raising the lamp; Dante balancing beside him
    figure(d, 138, 104, 26, VIRGIL_GRAY, cap=hx('2A2F36'),
           rim=hx('E8A33D'), rim_side=-1)
    d.line([(135, 90), (131, 84)], fill=VIRGIL_GRAY, width=2)
    R(d, lx - 2, ly - 1, 4, 5, hx('E8A33D'))
    d.point((lx, ly - 2), fill=hx('F2E3B3'))
    figure(d, 158, 104, 26, DANTE_COAT, pose='walk', rim=hx('B37A2E'),
           rim_side=-1)

    # CHARON — a tall angular silhouette, two coals for eyes
    cx = 194
    d.polygon([(cx - 3, 58), (cx + 5, 58), (cx + 9, 88), (cx + 12, 104),
               (cx - 10, 104), (cx - 6, 84)], fill=(4, 7, 5))
    d.polygon([(cx - 6, 58), (cx + 8, 58), (cx + 5, 54), (cx - 3, 54)],
              fill=(4, 7, 5))                       # peaked cap
    d.line([(cx - 6, 62), (cx - 9, 102)], fill=hx('141B18'))  # rim of robe
    d.point((cx, 60), fill=hx('E8A33D'))            # the eyes
    d.point((cx + 3, 60), fill=hx('E8A33D'))
    d.line([(cx + 7, 70), (cx + 27, 130)], fill=(2, 4, 3), width=2)  # pole

    # a hand of the drowned at the deck edge
    d.polygon([(76, 112), (84, 108), (86, 112)], fill=hx('10151A'))

    speckle(d, 100, 46, 66, 56, hx('6E5713'), 0.010, seed=3)  # motes
    return img


# ---------------------------------------------------------------- Limbo ----
def scene_limbo():
    img, d = canvas(hx('5E1A0F'))
    bands(d, 0, 70, [hx('47130B'), hx('531710'), hx('5E1A0F'), hx('6B2013')])

    # black ceiling structure
    d.polygon([(0, 0), (W, 0), (W, 8), (0, 8)], fill=(12, 3, 2))
    for bx in (60, 160, 260):
        d.polygon([(bx - 2, 8), (bx + 2, 8), (bx + 6, 18), (bx - 6, 18)],
                  fill=(12, 3, 2))

    # the ghost train: flat planes, no detail but the burning windows
    R(d, 0, 58, W, 50, hx('236872'))
    R(d, 0, 58, W, 6, hx('194C54'))
    R(d, 0, 100, W, 8, hx('0F2A30'))
    wins = list(range(10, W, 56))
    for x in wins:
        R(d, x, 68, 26, 18, hx('E8D9A0'))
        if (x // 56) % 2 == 0:                       # a passenger, seated
            R(d, x + 7, 74, 5, 12, hx('194C54'))
            R(d, x + 8, 71, 3, 4, hx('194C54'))
    for x in (122, 262):                             # sealed doors
        R(d, x, 64, 16, 44, hx('1B535C'))
        d.line([(x + 8, 64), (x + 8, 107)], fill=hx('0F2A30'))

    # window light falling across the platform — banded pools
    for x in wins:
        poly_a(img, [(x - 1, 87), (x + 27, 87), (x + 36, 113), (x - 12, 113)],
               hx('E8D9A0'), 26)
        poly_a(img, [(x + 3, 87), (x + 23, 87), (x + 28, 113), (x - 3, 113)],
               hx('E8D9A0'), 20)
    d = ImageDraw.Draw(img)

    # platform slab and the cutaway dark below
    R(d, 0, 108, W, 20, hx('8E2B1C'))
    d.line([(0, 108), (W, 108)], fill=hx('B33A26'))
    R(d, 0, 128, W, 52, (16, 4, 2))
    d.polygon([(0, 128), (W, 128), (W, 132), (240, 130), (150, 134),
               (60, 130), (0, 133)], fill=(16, 4, 2))  # ragged cut edge
    speckle(d, 0, 132, W, 46, (35, 9, 5), 0.05, seed=7)
    # stairwell down — rose light of the next circle rising
    R(d, 250, 128, 40, 52, (7, 2, 1))
    glow(img, 270, 184, 30, hx('C4788A'), alpha=80)
    d = ImageDraw.Draw(img)
    for i, sx in enumerate(range(254, 286, 8)):
        R(d, sx, 140 + i * 9, 32 - (sx - 254), 3, hx('471523'))

    # the waiting damned — backlit silhouettes facing the train
    rnd = random.Random(4)
    dark = hx('200906')
    for px in (58, 70, 96, 106, 150, 161, 172, 216, 227, 252, 300):
        h = 22 + rnd.randrange(5)
        silhouette(d, px, 126, h, dark)
        d.point((px + 2, 126 - h + 1), fill=hx('B37A2E'))   # window rim
    # the bride, the one pale figure on the platform
    figure(d, 188, 126, 24, hx('D8CFC0'), pants=hx('D8CFC0'),
           hair=(225, 218, 205))

    # Dante and Virgil walking the platform edge
    figure(d, 24, 126, 26, DANTE_COAT, pose='walk', rim=hx('E8D9A0'))
    figure(d, 42, 126, 27, VIRGIL_GRAY, cap=hx('33383F'), pose='walk',
           rim=hx('E8D9A0'))
    R(d, 47, 114, 3, 4, hx('4A4438'))                # doused lamp

    # foreground column silhouettes, cropped by the frame
    d.polygon([(0, 0), (16, 0), (13, 180), (0, 180)], fill=(10, 2, 1))
    d.polygon([(W, 0), (W - 14, 0), (W - 11, 180), (W, 180)], fill=(10, 2, 1))

    label(d, 160, 22, 'LIMBO', sc=2)
    return img


# ----------------------------------------------------------------- Lust ----
def scene_lust():
    img, d = canvas(hx('542E3F'))
    bands(d, 0, 180, [hx('241019'), hx('301622'), hx('3F2230'),
                      hx('542E3F'), hx('643850')])

    # colossal duct mouths, pure silhouette
    d.ellipse([-40, 26, 66, 132], fill=(18, 8, 14))
    d.ellipse([-30, 36, 56, 122], fill=(7, 3, 6))
    d.ellipse([264, 56, 386, 178], fill=(18, 8, 14))
    d.ellipse([276, 68, 374, 166], fill=(7, 3, 6))
    for ang in (0.4, 2.5, 4.6):                      # dead fan
        d.line([(13, 79), (13 + int(30 * math.cos(ang)),
                           79 + int(30 * math.sin(ang)))],
               fill=(3, 1, 3), width=5)

    # the gale — long unbroken streaks riding the whole frame
    rnd = random.Random(9)
    for i in range(9):
        y0 = 16 + i * 17 + rnd.randrange(6)
        amp = rnd.randrange(4, 10)
        ph = rnd.random() * 6
        for x in range(0, W):
            if (x + i * 7) % 90 < 62:
                y = y0 + amp * math.sin(x / 40 + ph)
                d.point((x, int(y)), fill=hx('9C6A7C'))
    for _ in range(16):                              # letters on the wind
        x, y = rnd.randrange(W), 12 + rnd.randrange(120)
        R(d, x, y, 3, 2, hx('D9D3C8'))

    # souls blown two by two — elongated silhouettes
    arc = [(52, 46), (92, 33), (134, 28), (176, 33), (216, 46), (250, 64)]
    for (x, y) in arc:
        d.polygon([(x - 8, y + 2), (x + 6, y - 1), (x + 11, y + 1),
                   (x + 6, y + 4), (x - 12, y + 5)], fill=(24, 11, 18))
        R(d, x + 9, y - 2, 3, 3, (24, 11, 18))       # head leading
        d.line([(x - 8, y + 2), (x + 6, y - 1)], fill=hx('9C6A7C'))  # rim

    # walkways: black slabs, one lit edge
    d.polygon([(0, 120), (128, 120), (132, 130), (0, 130)], fill=(12, 5, 9))
    d.line([(0, 120), (128, 120)], fill=hx('8A5A6C'))
    d.polygon([(186, 136), (320, 136), (320, 146), (182, 146)], fill=(12, 5, 9))
    d.line([(186, 136), (320, 136)], fill=hx('8A5A6C'))
    for x in (30, 80, 210, 260, 300):
        yt = 130 if x < 180 else 146
        R(d, x, yt, 2, 180 - yt, (12, 5, 9))

    # Dante mid-jump, blown off his line; coat streaming
    figure(d, 152, 112, 26, DANTE_COAT, pose='walk', rim=hx('C79AA8'),
           rim_side=-1)
    d.line([(144, 100), (138, 98)], fill=shade(DANTE_COAT, 0.8), width=2)

    # Virgil braced, hand to cap
    figure(d, 214, 136, 27, VIRGIL_GRAY, cap=hx('33383F'), rim=hx('C79AA8'),
           rim_side=-1)
    d.line([(208, 112), (212, 110)], fill=VIRGIL_GRAY)

    # Paolo & Francesca in the wind-shadow of the great duct
    d.polygon([(258, 128), (312, 128), (318, 140), (252, 140)], fill=(7, 3, 6))
    figure(d, 288, 174, 20, (30, 14, 22), pants=(30, 14, 22),
           hair=(20, 9, 15))
    figure(d, 295, 174, 21, (30, 14, 22), pants=(30, 14, 22),
           hair=(20, 9, 15))
    R(d, 290, 162, 3, 2, hx('D9D3C8'))               # the paperback
    d.line([(284, 158), (284, 166)], fill=hx('C79AA8'))  # one rim edge shared

    label(d, 160, 10, 'LUST', sc=2)
    return img


# ------------------------------------------------------------ Treachery ----
def scene_treachery():
    img, d = canvas(hx('42585F'))
    bands(d, 0, 148, [hx('222F35'), hx('2E4048'), hx('42585F'), hx('5A7680')])

    # wings: vast swept silhouettes owning the top corners
    d.polygon([(126, 40), (0, 0), (0, 66), (60, 58), (122, 62)], fill=(6, 9, 11))
    d.polygon([(194, 40), (320, 0), (320, 66), (260, 58), (198, 62)],
              fill=(6, 9, 11))
    for i in range(4):                               # blade cuts
        d.line([(6 + i * 28, 4 + i * 5), (122, 52)], fill=hx('222F35'), width=2)
        d.line([(314 - i * 28, 4 + i * 5), (198, 52)], fill=hx('222F35'), width=2)
    # shear off the wingtips
    rnd = random.Random(13)
    for _ in range(46):
        x, y = rnd.randrange(W), rnd.randrange(24, 150)
        d.line([(x, y), (x + rnd.randrange(8, 22), y)], fill=hx('C7DCE2'))

    # LUCIFER — one black mass fused into the seized machine
    d.polygon([(138, 22), (182, 22), (176, 14), (144, 14)], fill=(4, 6, 8))
    d.polygon([(130, 30), (190, 30), (208, 150), (112, 150)], fill=(4, 6, 8))
    d.polygon([(130, 30), (190, 30), (182, 22), (138, 22)], fill=(4, 6, 8))
    # seized gears, silhouette on silhouette
    for (gx, gy, gr) in [(106, 92, 13), (216, 82, 13), (102, 128, 10),
                         (220, 122, 11)]:
        d.ellipse([gx - gr, gy - gr, gx + gr, gy + gr], fill=(6, 9, 11))
        for ang in range(0, 360, 60):
            a = math.radians(ang)
            R(d, int(gx + (gr + 2) * math.cos(a)) - 1,
              int(gy + (gr + 2) * math.sin(a)) - 1, 3, 3, (6, 9, 11))
        d.ellipse([gx - 3, gy - 3, gx + 3, gy + 3], fill=(4, 6, 8))
    R(d, 92, 146, 136, 6, (6, 9, 11))                # drive housing

    # the three faces exist only as burning eyes and a breathing jaw
    for (ex, ey, ec) in [(152, 38, hx('B33A26')),    # crimson, forward
                         (138, 44, hx('8A8F96')),    # ashen, left
                         (176, 44, hx('C9B26B'))]:   # pale yellow, right
        R(d, ex, ey, 2, 2, ec)
        R(d, ex + 6, ey, 2, 2, ec)
        glow(img, ex + 4, ey + 1, 7, ec, alpha=70)
        d = ImageDraw.Draw(img)
        d.line([(ex - 1, ey + 10), (ex + 9, ey + 10)], fill=shade(ec, 0.55))
    # frost climbing the mass; ice crown
    speckle(d, 116, 96, 92, 54, hx('9FBEC7'), 0.05, seed=21)
    speckle(d, 112, 134, 104, 16, hx('C7DCE2'), 0.11, seed=22)
    speckle(d, 136, 14, 50, 10, hx('C7DCE2'), 0.16, seed=23)

    # the frozen lake, banded
    bands(d, 148, 180, [hx('8FAAB4'), hx('9FBEC7'), hx('AECAD3')])
    for _ in range(14):                              # cracks
        x0, y0 = rnd.randrange(W), 152 + rnd.randrange(24)
        for _ in range(4):
            x1 = x0 + rnd.randrange(-16, 18)
            y1 = y0 + rnd.randrange(-2, 4)
            d.line([(x0, y0), (x1, y1)], fill=hx('6E8B96'))
            x0, y0 = x1, y1
    # the damned sealed under the surface; one pair locked close
    for (sx, sy, sw) in [(34, 162, 15), (74, 170, 12), (248, 166, 14)]:
        R(d, sx, sy, sw, 3, hx('54707B'))
        R(d, sx + sw, sy - 1, 3, 3, hx('54707B'))
    R(d, 206, 168, 11, 3, hx('3C525C'))
    R(d, 216, 166, 11, 3, hx('3C525C'))

    # Dante climbing down the flank; Virgil waiting on the ice below
    figure(d, 206, 98, 15, DANTE_COAT, rim=hx('C7DCE2'), rim_side=1)
    d.line([(202, 88), (199, 90)], fill=SKIN)
    figure(d, 214, 148, 15, VIRGIL_GRAY, cap=hx('33383F'),
           rim=hx('C7DCE2'), rim_side=1)

    # foreground ice ridges framing the shot
    d.polygon([(0, 180), (0, 150), (28, 158), (58, 172), (74, 180)],
              fill=hx('16232A'))
    d.polygon([(320, 180), (320, 154), (296, 160), (270, 174), (258, 180)],
              fill=hx('16232A'))

    label(d, 160, 6, 'TREACHERY', sc=1)
    return img


if __name__ == '__main__':
    save(scene_acheron(), 'mockup-0-acheron.png')
    save(scene_limbo(), 'mockup-1-limbo.png')
    save(scene_lust(), 'mockup-2-lust.png')
    save(scene_treachery(), 'mockup-9-treachery.png')
