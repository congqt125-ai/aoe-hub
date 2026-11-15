"""Generate the hub's own artwork (no game asset involved): backgrounds and dialog textures.

Part of PLAN.md "Asset tự làm": copyright-free replacements in the mood of the game screens.
Everything is drawn procedurally from a fixed seed, so re-running gives byte-identical files.
Nothing reads raw/ or assets/ui/; the output may be committed and shipped.

Output (default assets/hub/):
  dialog/wood.png                 tileable wood grain, 8-bit look (like the dlg6_3 material)
  bg/temple-dusk.webp (+ -1920)   classical colonnade at sunset (mood of scr1)
  bg/village-dusk.webp (+ -1920)  thatched-hut village at dusk (mood of scr2)
"""

from __future__ import annotations

import argparse
import math
from pathlib import Path
import random
import sys
from typing import Callable

from PIL import Image, ImageDraw, ImageFilter

W, H = 2560, 1440

RGB = tuple[int, int, int]


# ---------------------------------------------------------------- helpers

def value_noise(rng: random.Random, size: tuple[int, int], cells: tuple[int, int], tile: bool = False) -> Image.Image:
    """Smooth grayscale noise: random cells upscaled bicubic. tile=True makes it seamless (wraps)."""
    cw, ch = cells
    small = Image.new("L", (cw, ch))
    small.putdata([rng.randrange(256) for _ in range(cw * ch)])
    if not tile:
        return small.resize(size, Image.BICUBIC)
    # Seamless: upscale a 3x3 tiling, keep the middle tile.
    big = Image.new("L", (cw * 3, ch * 3))
    for i in range(3):
        for j in range(3):
            big.paste(small, (i * cw, j * ch))
    up = big.resize((size[0] * 3, size[1] * 3), Image.BICUBIC)
    return up.crop((size[0], size[1], size[0] * 2, size[1] * 2))


def fractal(rng: random.Random, size: tuple[int, int], base: tuple[int, int], octaves: int = 4, tile: bool = False) -> Image.Image:
    """Sum of value-noise octaves (each twice as fine, half as strong)."""
    out = value_noise(rng, size, base, tile)
    weight = 0.5
    for o in range(1, octaves):
        layer = value_noise(rng, size, (base[0] << o, base[1] << o), tile)
        out = Image.blend(out, layer, weight / (1 + weight))
        weight *= 0.5
    return out


def stretch(img: Image.Image) -> Image.Image:
    """Stretch grayscale levels to 0..255."""
    lo, hi = img.getextrema()
    if hi == lo:
        return img
    return img.point(lambda v: (v - lo) * 255 // (hi - lo))


def ramp(stops: list[tuple[float, RGB]]) -> Callable[[float], RGB]:
    """Piecewise-linear color ramp over 0..1."""

    def at(t: float) -> RGB:
        t = min(1.0, max(0.0, t))
        for (t0, c0), (t1, c1) in zip(stops, stops[1:]):
            if t <= t1:
                k = (t - t0) / (t1 - t0) if t1 > t0 else 0
                return tuple(round(a + (b - a) * k) for a, b in zip(c0, c1))  # type: ignore[return-value]
        return stops[-1][1]

    return at


def colorize(gray: Image.Image, color_at: Callable[[float], RGB]) -> Image.Image:
    """Map a grayscale image through a color ramp (256-entry lookup)."""
    lut = [color_at(v / 255) for v in range(256)]
    r = gray.point([c[0] for c in lut])
    g = gray.point([c[1] for c in lut])
    b = gray.point([c[2] for c in lut])
    return Image.merge("RGB", (r, g, b))


def vertical_gradient(size: tuple[int, int], color_at: Callable[[float], RGB]) -> Image.Image:
    h = size[1]
    col = Image.new("RGB", (1, h))
    col.putdata([color_at(y / (h - 1)) for y in range(h)])
    return col.resize(size, Image.BILINEAR)


def radial_glow(size: tuple[int, int], center: tuple[float, float], radius: float, strength: int = 255) -> Image.Image:
    """Soft radial mask (L), 255 at center fading to 0 at radius."""
    small = (size[0] // 8, size[1] // 8)
    m = Image.new("L", small)
    cx, cy, r = center[0] / 8, center[1] / 8, radius / 8
    m.putdata([
        max(0, round(strength * (1 - min(1.0, math.hypot(x - cx, y - cy) / r)) ** 2))
        for y in range(small[1]) for x in range(small[0])
    ])
    return m.resize(size, Image.BICUBIC)


def save_bg(img: Image.Image, out: Path, name: str) -> list[Path]:
    """Original 2560 + 1920 copy (scaled down only), lossy WebP like the game backgrounds."""
    out.mkdir(parents=True, exist_ok=True)
    big = out / f"{name}.webp"
    small = out / f"{name}-1920.webp"
    img.save(big, "WEBP", quality=88, method=6)
    img.resize((1920, 1080), Image.LANCZOS).save(small, "WEBP", quality=88, method=6)
    return [big, small]


# ---------------------------------------------------------------- wood texture

# Own wood palette (8 tones, dark -> light), in the warm brown range of the game's wood material.
WOOD_PALETTE: list[RGB] = [
    (58, 34, 16), (86, 54, 26), (108, 72, 38), (128, 88, 50),
    (146, 104, 64), (162, 118, 78), (178, 134, 94), (196, 154, 110),
]
WOOD_FLECKS: list[RGB] = [(134, 104, 40), (150, 120, 52), (112, 84, 34)]


def gen_wood(rng: random.Random, size: tuple[int, int] = (96, 144)) -> Image.Image:
    """Tileable vertical wood grain quantized to WOOD_PALETTE, with fine speckle like 8-bit game art."""
    w, h = size
    # Grain: fine noise stretched vertically (long fibres), wrapping on both axes; weak broad figure.
    fibres = value_noise(rng, size, (w // 2, h // 18), tile=True)
    bands = value_noise(rng, size, (w // 6, h // 24), tile=True)
    figure = value_noise(rng, size, (6, 4), tile=True)
    grain = Image.blend(Image.blend(fibres, bands, 0.3), figure, 0.15)
    # Keep the tone range narrow (the material reads as one even surface under text).
    grain = stretch(grain).point(lambda v: 70 + v * 120 // 255)
    px = grain.load()
    for y in range(h):
        for x in range(w):
            px[x, y] = max(0, min(255, px[x, y] + rng.randint(-40, 40)))
    # Short dark fibre streaks and a few light ones.
    draw = ImageDraw.Draw(grain)
    for _ in range(w * h // 180):
        x, y, ln = rng.randrange(w), rng.randrange(h), rng.randint(3, 9)
        tone = rng.choice([rng.randint(0, 40)] * 3 + [rng.randint(215, 255)])
        for k in range(ln):
            draw.point((x, (y + k) % h), fill=tone)
    idx = grain.point(lambda v: min(len(WOOD_PALETTE) - 1, v * len(WOOD_PALETTE) // 256))
    flat = [c for rgb in WOOD_PALETTE for c in rgb]
    out = Image.frombytes("P", size, idx.tobytes())
    out.putpalette(flat + [0] * (768 - len(flat)))
    out = out.convert("RGB")
    # Olive / gold flecks scattered through the grain.
    op = out.load()
    for _ in range(w * h // 14):
        op[rng.randrange(w), rng.randrange(h)] = rng.choice(WOOD_FLECKS)
    return out


# ---------------------------------------------------------------- shared sky

def sunset_sky(rng: random.Random, stops: list[tuple[float, RGB]], cloud_tint: RGB, sun: tuple[float, float, float], cloud_amount: float) -> Image.Image:
    sky = vertical_gradient((W, H), ramp(stops))
    # Clouds: horizontal streaky fractal noise, brighter near the sun.
    clouds = stretch(fractal(rng, (W, H), (6, 14), octaves=5))
    clouds = clouds.resize((W, H // 3), Image.BICUBIC).resize((W, H), Image.BICUBIC)  # flatten into streaks
    clouds = clouds.point(lambda v: max(0, v - 120) * 2)
    glow = radial_glow((W, H), (sun[0], sun[1]), sun[2])
    sky = Image.composite(Image.new("RGB", (W, H), (255, 214, 150)), sky, glow.point(lambda v: v * 6 // 10))
    tint = Image.new("RGB", (W, H), cloud_tint)
    return Image.composite(tint, sky, clouds.point(lambda v: round(v * cloud_amount)))


# ---------------------------------------------------------------- temple at sunset (mood of scr1)

STONE_LIT = ramp([(0.0, (46, 30, 20)), (0.35, (112, 80, 52)), (0.7, (196, 152, 100)), (1.0, (238, 200, 142))])


def stone_grain(rng: random.Random, size: tuple[int, int]) -> Image.Image:
    """Fine stone grain (L), close to 255 = no change; used with multiply()."""
    n = stretch(fractal(rng, size, (max(2, size[0] // 40), max(2, size[1] // 40)), octaves=3))
    return n.point(lambda v: 205 + v * 50 // 255)


def multiply(img: Image.Image, gray: Image.Image) -> Image.Image:
    """Darken img by a grayscale factor (255 = unchanged)."""
    return Image.composite(img, Image.new("RGB", img.size, (0, 0, 0)), gray)


def column_shaft(width: int, height: int, flutes: int = 12) -> Image.Image:
    """Fluted cylinder lit from the left: brightness by facet angle, flutes as cosine ripples."""
    row = []
    for x in range(width):
        u = (x + 0.5) / width  # 0..1 across the shaft
        theta = (u - 0.5) * math.pi  # surface normal angle
        light = max(0.0, math.cos(theta + 0.75))  # sun low on the left
        flute = 0.82 + 0.18 * math.cos(u * flutes * 2 * math.pi)
        row.append(STONE_LIT(min(1.0, 0.12 + 0.88 * light * flute)))
    strip = Image.new("RGB", (width, 1))
    strip.putdata(row)
    shaft = strip.resize((width, height), Image.NEAREST)
    # Darker toward the bottom (ambient occlusion near the steps).
    shade = vertical_gradient((width, height), ramp([(0, (255, 255, 255)), (0.75, (235, 235, 235)), (1, (170, 170, 170))])).convert("L")
    return multiply(shaft, shade)


def line_y(x: float, a: tuple[float, float], b: tuple[float, float]) -> float:
    return a[1] + (b[1] - a[1]) * (x - a[0]) / (b[0] - a[0])


def gen_temple(rng: random.Random) -> Image.Image:
    img = sunset_sky(
        rng,
        [(0.0, (110, 62, 50)), (0.3, (200, 124, 70)), (0.6, (244, 186, 112)), (1.0, (252, 214, 150))],
        cloud_tint=(168, 86, 60),
        sun=(W * 0.16, H * 0.6, W * 0.5),
        cloud_amount=0.5,
    )
    d = ImageDraw.Draw(img)

    # Distant hill with a small temple on the left, in warm haze.
    hill = [(0, H)] + [(W * 0.55 * i / 40, H * 0.70 - math.sin(i / 5) * 26 - rng.random() * 5) for i in range(41)] + [(W * 0.55, H)]
    d.polygon(hill, fill=(134, 88, 60))
    # Paved ground across the whole width under the temple.
    d.rectangle([0, H * 0.74, W, H], fill=(112, 76, 52))
    for k in range(9):
        y = H * 0.74 + (H * 0.26) * (k / 8) ** 1.6
        d.line([(0, y), (W, y)], fill=(96, 64, 44), width=2 + k // 2)
    tx, ty = W * 0.13, H * 0.655
    d.polygon([(tx - 160, ty - 46), (tx, ty - 104), (tx + 160, ty - 46)], fill=(118, 76, 52))
    d.rectangle([tx - 160, ty - 46, tx + 160, ty - 28], fill=(110, 70, 48))
    for k in range(8):
        cx = tx - 142 + k * 40
        d.rectangle([cx, ty - 28, cx + 15, ty + 44], fill=(106, 66, 44))
    d.rectangle([tx - 175, ty + 44, tx + 175, ty + 60], fill=(100, 62, 42))

    # Colonnade in perspective: far columns on the left, the nearest one cut by the right edge.
    # (center x, half width, top y, bottom y) as fractions of W / H.
    cols = [
        (0.455, 0.020, 0.405, 0.775), (0.505, 0.024, 0.380, 0.782), (0.565, 0.029, 0.350, 0.790),
        (0.640, 0.035, 0.310, 0.800), (0.735, 0.043, 0.255, 0.815), (0.860, 0.054, 0.180, 0.835),
        (1.025, 0.068, 0.080, 0.862),
    ]
    near, far = cols[-1], cols[0]

    # Cella wall behind the columns, deep in shadow.
    wall = Image.new("L", (W, H), 0)
    ImageDraw.Draw(wall).polygon([(W * 0.43, H * 0.40), (W * 1.05, H * 0.07), (W * 1.05, H * 0.86), (W * 0.43, H * 0.77)], fill=255)
    wall_col = multiply(vertical_gradient((W, H), ramp([(0, (64, 44, 30)), (1, (36, 24, 16))])), stone_grain(rng, (W, H)))
    img = Image.composite(wall_col, img, wall)

    # Steps (stylobate): lit treads, dark risers, following the column base line.
    base_a, base_b = (W * far[0], H * far[3]), (W * near[0], H * near[3])
    d = ImageDraw.Draw(img)
    for k in range(6):
        off = k * H * 0.028
        x0 = W * 0.30 - k * W * 0.03
        y_l, y_r = line_y(x0, base_a, base_b) + off, line_y(W, base_a, base_b) + off
        tread = (186 - k * 6, 142 - k * 6, 96 - k * 5)
        riser = (92 - k * 4, 64 - k * 4, 42 - k * 3)
        d.polygon([(x0, y_l), (W, y_r), (W, y_r + H * 0.010), (x0, y_l + H * 0.010)], fill=tread)
        d.polygon([(x0, y_l + H * 0.010), (W, y_r + H * 0.010), (W, y_r + H * 0.028), (x0, y_l + H * 0.028)], fill=riser)
        d.rectangle([x0 - 2, y_l, x0 + 6, y_l + H * 0.028], fill=(70, 48, 32))

    # Columns, far to near: shaft + echinus + abacus.
    for cx, hw, top, bot in cols:
        x0, x1 = int(W * (cx - hw)), int(W * (cx + hw))
        y0, y1 = int(H * top), int(H * bot)
        shaft = column_shaft(x1 - x0, y1 - y0)
        img.paste(multiply(shaft, stone_grain(rng, shaft.size)), (x0, y0))
        d = ImageDraw.Draw(img)
        cap_w, cap_h = W * hw * 0.32, W * hw * 0.42
        d.polygon([(x0 - cap_w * 0.5, y0), (x1 + cap_w * 0.5, y0), (x1 + cap_w, y0 - cap_h * 0.55), (x0 - cap_w, y0 - cap_h * 0.55)], fill=(150, 108, 70))
        d.rectangle([x0 - cap_w, y0 - cap_h, x1 + cap_w, y0 - cap_h * 0.55], fill=(206, 164, 112))
        d.line([(x1 + cap_w * 0.5, y0), (x1 + cap_w, y0 - cap_h * 0.55)], fill=(84, 58, 38), width=3)

    # Entablature over the capitals: architrave, frieze with triglyphs, cornice; soffit in shadow.
    a = (W * far[0], H * far[2] - W * far[1] * 0.42)
    b = (W * near[0], H * near[2] - W * near[1] * 0.42)
    left_x, right_x = a[0] - W * 0.035, W * 1.1
    ly, ry = line_y(left_x, a, b), line_y(right_x, a, b)
    ent = Image.new("RGB", (W, H))
    entm = Image.new("L", (W, H), 0)
    ed, em = ImageDraw.Draw(ent), ImageDraw.Draw(entm)
    layers = [  # (height at far end, height at near end, color)
        (H * 0.040, H * 0.085, (178, 136, 90)),
        (H * 0.050, H * 0.105, (140, 102, 66)),
        (H * 0.022, H * 0.045, (204, 162, 110)),
    ]
    y_l, y_r = ly, ry
    frieze_bottom = None
    for i, (hf, hn, col) in enumerate(layers):
        poly = [(left_x, y_l), (right_x, y_r), (right_x, y_r - hn), (left_x, y_l - hf)]
        ed.polygon(poly, fill=col)
        em.polygon(poly, fill=255)
        if i == 1:
            frieze_bottom = ((left_x, y_l), (right_x, y_r))
        y_l, y_r = y_l - hf, y_r - hn
    assert frieze_bottom
    for k in range(18):
        t = k / 17
        gx = left_x + (right_x - left_x) * t ** 1.35
        gy = line_y(gx, *frieze_bottom)
        gh = layers[1][0] + (layers[1][1] - layers[1][0]) * t
        ed.rectangle([gx, gy - gh, gx + 6 + 30 * t, gy], fill=(96, 68, 44))
    depth = W * 0.016
    soffit = [(left_x, ly), (right_x, ry), (right_x, ry + depth * 1.6), (left_x + depth, ly + depth * 0.6)]
    ed.polygon(soffit, fill=(62, 42, 28))
    em.polygon(soffit, fill=255)
    img = Image.composite(multiply(ent, stone_grain(rng, (W, H))), img, entm)
    return finish(img)


# ---------------------------------------------------------------- village at dusk (mood of scr2)

def conifer(d: ImageDraw.ImageDraw, rng: random.Random, x: float, base: float, height: float, color: RGB) -> None:
    """Conifer silhouette: stacked tiers that widen downward, each overlapping the one above (notched outline)."""
    tiers = rng.randint(4, 6)
    step = height * 0.85 / tiers
    for t in range(tiers):
        top = base - height + t * step
        bottom = top + step * 1.7
        wid = height * 0.07 * (t + 1.4) * rng.uniform(0.85, 1.15)
        edge = [(x - wid + 2 * wid * s / 6, bottom - rng.uniform(0, step * 0.35)) for s in range(7)]
        d.polygon([(x + rng.uniform(-2, 2), top)] + edge[::-1], fill=color)
    d.line([(x, base), (x, base - height * 0.2)], fill=color, width=max(2, int(height / 40)))


def bare_tree(d: ImageDraw.ImageDraw, rng: random.Random, x: float, y: float, angle: float, length: float, width: float, depth: int, color: RGB) -> None:
    if depth == 0 or length < 6:
        return
    x2, y2 = x + math.cos(angle) * length, y - math.sin(angle) * length
    d.line([(x, y), (x2, y2)], fill=color, width=max(1, int(width)))
    for _ in range(rng.randint(2, 3)):
        bare_tree(d, rng, x2, y2, angle + rng.uniform(-0.7, 0.7), length * rng.uniform(0.62, 0.78), width * 0.66, depth - 1, color)


def hut(img: Image.Image, rng: random.Random, cx: float, cy: float, r: float, fire_x: float) -> None:
    """Domed thatch hut: meridian straw strokes lit from the fire side, binding rings, doorway."""
    d = ImageDraw.Draw(img)
    rh = r * 0.78
    toward = 1 if fire_x > cx else -1
    d.ellipse([cx - r * 1.15, cy - r * 0.12, cx + r * 1.15, cy + r * 0.14], fill=(36, 16, 4))  # ground shadow
    d.pieslice([cx - r, cy - rh, cx + r, cy + rh], 180, 360, fill=(60, 34, 12))
    near_fire = 1 - min(1.0, abs(cx - fire_x) / (W * 0.55))
    strokes = int(r * 0.9)
    for s in range(strokes):
        u = -1 + 2 * (s + rng.random()) / strokes
        lit = 0.5 + 0.5 * u * toward
        k = 0.25 + 0.75 * lit * (0.5 + 0.5 * near_fire)
        tone = (int(60 + 150 * k + rng.randint(-12, 12)), int(34 + 92 * k + rng.randint(-8, 8)), int(10 + 34 * k))
        # Meridian of a dome: x spreads with sin(th), y follows the profile.
        pts = [(cx + r * u * math.sin(th) + rng.uniform(-1, 1), cy - rh * math.cos(th)) for th in [(i / 12) * math.pi / 2 for i in range(13)]]
        d.line(pts, fill=tone, width=2)
    for band in (0.3, 0.55, 0.8):
        th = band * math.pi / 2
        ry, rx = rh * math.cos(th), r * math.sin(th)
        d.arc([cx - rx, cy - ry - rx * 0.12, cx + rx, cy - ry + rx * 0.12], 0, 180, fill=(44, 24, 8), width=4)
    dw, dx = r * 0.2, toward * r * 0.15
    d.chord([cx - dw + dx, cy - r * 0.42, cx + dw + dx, cy + r * 0.05], 180, 360, fill=(16, 8, 2))
    d.rectangle([cx - dw + dx, cy - r * 0.19, cx + dw + dx, cy], fill=(16, 8, 2))


def grass_blade(d: ImageDraw.ImageDraw, x: float, length: float, bend: float, width: float, color: RGB) -> None:
    """Tapered, curving blade rising from below the bottom edge."""
    left, right = [], []
    for s in range(17):
        t = s / 16
        px = x + bend * length * 0.5 * t * t
        py = H + 8 - length * t + (abs(bend) * length * 0.25 * t ** 3 if abs(bend) > 0.6 else 0)
        w = width * (1 - t) ** 0.8
        left.append((px - w, py))
        right.append((px + w, py))
    d.polygon(left + right[::-1], fill=color)


def gen_village(rng: random.Random) -> Image.Image:
    img = sunset_sky(
        rng,
        [(0.0, (88, 40, 8)), (0.22, (150, 74, 14)), (0.40, (170, 86, 18)), (0.5, (60, 26, 6)), (1.0, (50, 22, 6))],
        cloud_tint=(64, 28, 6),
        sun=(W * 0.52, H * 0.40, W * 0.55),
        cloud_amount=0.62,
    )
    horizon = H * 0.43
    d = ImageDraw.Draw(img)

    # Far treeline (hazy) then near treeline (dark), and a bare tree on the left.
    for color, base_off, hmin, hmax in (((70, 34, 10), -14, 70, 140), ((18, 10, 4), 18, 110, 260)):
        x = -40.0
        while x < W + 60:
            hgt = rng.uniform(hmin, hmax)
            conifer(d, rng, x, horizon + base_off + rng.uniform(-6, 10), hgt, color)
            x += hgt * rng.uniform(0.22, 0.5)
        d.rectangle([0, horizon + base_off, W, horizon + base_off + 60], fill=color)
    bare_tree(d, rng, W * 0.24, horizon + 70, math.pi / 2 + 0.05, H * 0.17, 16, 7, (24, 13, 5))

    # Ground: warm dusk plain, glow around the fire, darker toward the viewer.
    ground = colorize(stretch(fractal(rng, (W, H), (10, 6), octaves=4)), ramp([(0, (78, 30, 6)), (1, (112, 46, 10))]))
    ground = multiply(ground, vertical_gradient((W, H), ramp([(0, (255, 255, 255)), (0.55, (240, 240, 240)), (1, (120, 120, 120))])).convert("L"))
    gmask = Image.new("L", (W, H), 0)
    pts = [(0, horizon + 74)] + [(i * W / 24, horizon + 66 + math.sin(i * 0.8) * 14) for i in range(25)] + [(W, H), (0, H)]
    ImageDraw.Draw(gmask).polygon(pts, fill=255)
    img = Image.composite(ground, img, gmask)
    fire = (W * 0.57, H * 0.70)
    img = Image.composite(Image.new("RGB", (W, H), (226, 120, 34)), img, radial_glow((W, H), fire, W * 0.30, 170))

    # Huts, back to front.
    for hx, hy, r in [(0.47, 0.60, 120), (0.66, 0.605, 135), (0.14, 0.64, 190), (0.36, 0.69, 280), (0.80, 0.72, 300)]:
        hut(img, rng, W * hx, H * hy, r, fire[0])

    # Campfire with logs.
    d = ImageDraw.Draw(img)
    fx, fy = fire
    d.line([(fx - 40, fy + 8), (fx + 34, fy - 4)], fill=(40, 20, 8), width=10)
    d.line([(fx - 30, fy - 4), (fx + 40, fy + 8)], fill=(52, 26, 10), width=10)
    d.polygon([(fx - 22, fy), (fx - 8, fy - 64), (fx, fy - 30), (fx + 12, fy - 78), (fx + 24, fy)], fill=(255, 158, 34))
    d.polygon([(fx - 10, fy), (fx + 2, fy - 38), (fx + 12, fy)], fill=(255, 232, 150))

    # Foreground grass framing both sides (the center stays free for dialogs).
    for side in (0, 1):
        for _ in range(34):
            x = rng.uniform(-60, W * 0.20) if side == 0 else rng.uniform(W * 0.74, W + 60)
            bend = rng.uniform(-1.1, 1.1) + (0.35 if side == 0 else -0.35)
            color = (10 + rng.randint(0, 10), 5 + rng.randint(0, 5), 2)
            grass_blade(d, x, rng.uniform(H * 0.25, H * 0.82), bend, rng.uniform(3, 9), color)
    return finish(img)


def finish(img: Image.Image) -> Image.Image:
    """Slight blur (painted look) + vignette so UI on top stays readable."""
    img = img.filter(ImageFilter.GaussianBlur(1.2))
    vig = radial_glow((W, H), (W / 2, H / 2), math.hypot(W, H) * 0.62)
    dark = Image.new("RGB", (W, H), (0, 0, 0))
    return Image.composite(img, Image.blend(dark, img, 0.55), vig.point(lambda v: min(255, v * 2)))


# ---------------------------------------------------------------- main

def main() -> int:
    parser = argparse.ArgumentParser(description="Generate the hub's own (copyright-free) backgrounds and textures.")
    parser.add_argument("--out", default="assets/hub", help="output folder (default assets/hub)")
    parser.add_argument("--seed", type=int, default=1997)
    parser.add_argument("--only", choices=["wood", "temple", "village"], help="generate one item")
    args = parser.parse_args()

    out = Path(args.out)
    jobs = {
        "wood": lambda rng: [save_png(gen_wood(rng), out / "dialog" / "wood.png")],
        "temple": lambda rng: save_bg(gen_temple(rng), out / "bg", "temple-dusk"),
        "village": lambda rng: save_bg(gen_village(rng), out / "bg", "village-dusk"),
    }
    written, errors = 0, 0
    for name, job in jobs.items():
        if args.only and name != args.only:
            continue
        try:
            # Each item has its own seeded stream so items stay identical when run alone.
            files = job(random.Random(f"{args.seed}-{name}"))
            written += len(files)
            for f in files:
                print(f"  {f}")
        except Exception as exc:  # keep going with the other items
            print(f"[ERROR] {name}: {exc}", file=sys.stderr)
            errors += 1
    print(f"Wrote {written} files, {errors} errors")
    return 1 if errors else 0


def save_png(img: Image.Image, path: Path) -> Path:
    path.parent.mkdir(parents=True, exist_ok=True)
    img.save(path, optimize=True)
    return path


if __name__ == "__main__":
    sys.exit(main())
