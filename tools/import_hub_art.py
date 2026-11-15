"""Convert the hub's own background pictures (vendor/hub-art/*.png) into the WebP files the themes use.

Part of PLAN.md "Asset tự làm": pictures supplied by the user replace the game screens scr1 / scr2
(themes hub-temple / hub-village in tools/build_tokens.py). Source PNGs are kept in vendor/hub-art/.

Output: assets/hub/bg/<name>.webp at the source size (never upscaled) and, when the source is wider
than 1920px, a <name>-1920.webp copy scaled down, like the game backgrounds.
Title screens: the logo (vendor/hub-art/superage-logo.png, on black) is keyed out and placed like the
game's title logo on scr1 (top center), written as <name>-logo.webp next to the plain picture.
"""

from __future__ import annotations

import argparse
from pathlib import Path
import sys

from PIL import Image, ImageChops, ImageDraw, ImageFilter

PICTURES = ["temple-sunset", "village-sunset"]
# picture -> (logo file, logo width as a fraction of the picture width, top margin as a fraction of its height,
#             outline stroke in px at that size (0 = none), stroke color)
TITLE_LOGOS = {"temple-sunset": ("superage-logo.png", 0.42, 0.025, 2, (255, 255, 255))}  # 2px white stroke: user pick (12/11)


def save_webp(img: Image.Image, out_dir: Path, name: str) -> list[Path]:
    out_dir.mkdir(parents=True, exist_ok=True)
    big = out_dir / f"{name}.webp"
    img.save(big, "WEBP", quality=90, method=6)
    written = [big]
    if img.width > 1920:
        small = out_dir / f"{name}-1920.webp"
        img.resize((1920, round(img.height * 1920 / img.width)), Image.LANCZOS).save(small, "WEBP", quality=90, method=6)
        written.append(small)
    return written


def key_out_black(logo: Image.Image, dark: int = 24, min_hole: int = 400) -> Image.Image:
    """RGBA from a logo on pure black. Only the background is removed: near-black pixels connected to the
    image border, plus enclosed near-black holes of at least `min_hole` px (letter counters). Everything
    else stays opaque, so dark parts of the art (stone plate, outlines) do not let the picture show through."""
    rgb = logo.convert("RGB")
    r, g, b = rgb.split()
    brightest = ImageChops.lighter(ImageChops.lighter(r, g), b)
    work = brightest.point(lambda v: 255 if v < dark else 0)  # 255 = dark, not yet classified
    w, h = work.size
    BG, KEEP, PROBE = 128, 64, 200
    px = work.load()
    border = [(x, 0) for x in range(w)] + [(x, h - 1) for x in range(w)] + [(0, y) for y in range(h)] + [(w - 1, y) for y in range(h)]
    for p in border:
        if px[p] == 255:
            ImageDraw.floodfill(work, p, BG, thresh=0)
    # Enclosed dark regions: large ones are counters (background), small ones are part of the art.
    for y in range(0, h, 3):
        for x in range(0, w, 3):
            if px[x, y] == 255:
                ImageDraw.floodfill(work, (x, y), PROBE, thresh=0)
                area = work.histogram()[PROBE]
                ImageDraw.floodfill(work, (x, y), BG if area >= min_hole else KEEP, thresh=0)
    alpha = work.point(lambda v: 0 if v == BG else 255).filter(ImageFilter.GaussianBlur(0.8))
    out = rgb.copy()
    out.putalpha(alpha)
    return out


def place_logo(picture: Image.Image, logo_path: Path, width_frac: float, top_frac: float,
               stroke: int = 0, stroke_color: tuple[int, int, int] = (255, 255, 255)) -> Image.Image:
    """Logo centered at the top, with a soft dark halo behind it so it reads on a bright sky,
    and an optional outline stroke around the whole shape."""
    logo = key_out_black(Image.open(logo_path))
    w = round(picture.width * width_frac)
    logo = logo.resize((w, round(logo.height * w / logo.width)), Image.LANCZOS)
    x, y = (picture.width - logo.width) // 2, round(picture.height * top_frac)

    alpha = logo.getchannel("A")
    # Closed silhouette: cracks and specks inside the art filled (dilate then erode), letter counters stay open.
    solid = alpha.point(lambda v: 255 if v > 96 else 0)
    closed = solid.filter(ImageFilter.MaxFilter(7)).filter(ImageFilter.MinFilter(7))
    halo = closed.filter(ImageFilter.MaxFilter(5)).filter(ImageFilter.GaussianBlur(max(2, w // 120)))
    halo = halo.point(lambda v: v * 3 // 4)
    out = picture.convert("RGBA")
    shadow = Image.new("RGBA", logo.size, (0, 0, 0, 0))
    shadow.putalpha(halo)
    out.alpha_composite(shadow, (x + max(1, w // 400), y + max(1, w // 300)))
    if stroke > 0:
        # Outline: closed silhouette grown by `stroke` px, soft 1px edge; drawn under the art only.
        grown = closed.filter(ImageFilter.MaxFilter(2 * stroke + 1)).filter(ImageFilter.GaussianBlur(0.8))
        ring = Image.new("RGBA", logo.size, (*stroke_color, 0))
        ring.putalpha(grown)
        out.alpha_composite(ring, (x, y))
    # Black backing inside the silhouette, as on the logo's original black, so nothing shows through cracks.
    backing = Image.new("RGBA", logo.size, (0, 0, 0, 0))
    backing.putalpha(closed.filter(ImageFilter.GaussianBlur(0.6)))
    out.alpha_composite(backing, (x, y))
    out.alpha_composite(logo, (x, y))
    return out.convert("RGB")


def main() -> int:
    parser = argparse.ArgumentParser(description="Convert hub background pictures to WebP for the themes.")
    parser.add_argument("--src", default="vendor/hub-art", help="folder with <name>.png sources")
    parser.add_argument("--out", default="assets/hub/bg")
    args = parser.parse_args()

    src_dir, out_dir = Path(args.src), Path(args.out)
    written, errors = 0, 0
    for name in PICTURES:
        src = src_dir / f"{name}.png"
        try:
            picture = Image.open(src).convert("RGB")
            files = save_webp(picture, out_dir, name)
            if name in TITLE_LOGOS:
                logo_file, width_frac, top_frac, stroke, color = TITLE_LOGOS[name]
                logo_img = place_logo(picture, src_dir / logo_file, width_frac, top_frac, stroke, color)
                files += save_webp(logo_img, out_dir, f"{name}-logo")
            for f in files:
                with Image.open(f) as im:
                    print(f"  {f.as_posix()} {im.width}x{im.height}")
            written += len(files)
            if picture.width < 1920:
                print(f"[WARN] {name}: {picture.width}px wide, upscaled on screens wider than that", file=sys.stderr)
        except OSError as exc:
            print(f"[ERROR] {name}: {exc}", file=sys.stderr)
            errors += 1
    print(f"Wrote {written} files, {errors} errors")
    return 1 if errors else 0


if __name__ == "__main__":
    sys.exit(main())
