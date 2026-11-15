"""Recolor player-colored sprites into the 8 player colors (like the game engine's player color remap).

Part of Bước 4 in PLAN.md (PlayerChip / ProfileHeader need the pennant in each player color).
Sprites are exported in player 1 (blue): every pixel whose color is in the blue ramp is replaced by the
same step of player N's ramp from tokens/design-tokens.json. Other pixels (pole, shading) stay as they are.

Input:  assets/ui/hud/pennant.png + tokens/design-tokens.json
Output: assets/ui/hud/pennant-<1..8>.png
"""

from __future__ import annotations

import argparse
import json
from pathlib import Path
import sys

from PIL import Image

SPRITES = ["hud/pennant"]


def hex_rgb(h: str) -> tuple[int, int, int]:
    return int(h[1:3], 16), int(h[3:5], 16), int(h[5:7], 16)


def recolor(src: Path, dest: Path, base_ramp: list[str], ramp: list[str]) -> int:
    """Write dest with base_ramp colors swapped for ramp; returns the number of recolored pixels."""
    mapping = {hex_rgb(a): hex_rgb(b) for a, b in zip(base_ramp, ramp)}
    im = Image.open(src).convert("RGBA")
    px = im.load()
    changed = 0
    for y in range(im.height):
        for x in range(im.width):
            r, g, b, a = px[x, y]
            new = mapping.get((r, g, b))
            if a and new:
                px[x, y] = (*new, a)
                changed += 1
    dest.parent.mkdir(parents=True, exist_ok=True)
    im.save(dest, optimize=True)
    return changed


def main() -> int:
    parser = argparse.ArgumentParser(description="Recolor player-colored sprites into the 8 player colors.")
    parser.add_argument("--assets-dir", default="assets/ui")
    parser.add_argument("--tokens", default="tokens/design-tokens.json")
    args = parser.parse_args()

    assets = Path(args.assets_dir)
    players = json.loads(Path(args.tokens).read_text(encoding="utf-8"))["players"]
    base_ramp = players["player-1"]["ramp"]
    written, errors = 0, 0
    for sprite in SPRITES:
        src = assets / f"{sprite}.png"
        if not src.is_file():
            print(f"[ERROR] missing {src}", file=sys.stderr)
            errors += 1
            continue
        for key, p in players.items():
            n = key.split("-")[1]
            try:
                changed = recolor(src, assets / f"{sprite}-{n}.png", base_ramp, p["ramp"])
                written += 1
                if changed == 0:
                    print(f"[WARN] {sprite}-{n}: no pixel matched the player 1 ramp", file=sys.stderr)
            except OSError as exc:
                print(f"[ERROR] {sprite}-{n}: {exc}", file=sys.stderr)
                errors += 1
    print(f"Recolored {written} sprites, {errors} errors")
    return 1 if errors else 0


if __name__ == "__main__":
    sys.exit(main())
