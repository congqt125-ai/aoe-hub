"""Build design tokens from game data (Bước 3.2 in PLAN.md).

Reads screen descriptors + palettes from raw/ and curated images from assets/ui/,
writes tokens/design-tokens.json and a visual preview demo/tokens/index.html.

Token sources:
- Screen / dialog themes: bevel_colors, text/focus/state colors, shade_amount from
  the game's screen descriptor files (500xx, 53000), resolved through their palette.
- Faction styles (5): sampled from the in-game HUD bottom bars.
- Player colors (8): palette 50500, ramp of 10 shades starting at index 16 * N.
- Semantic / status colors: picked from palette 50500 so they stay in-game.
"""

from __future__ import annotations

import argparse
import html
import json
import struct
from pathlib import Path
import sys
from typing import Any

from PIL import Image

# Themes on the hub's own copyright-free artwork: key -> (game theme the colors come from, image, treatment).
# treatment = sweet-spot values found with the demo tuner (demo/shared/tuner.js, "Chép giá trị"),
# e.g. {"--aoe-bg-brightness": "0.85", "--aoe-bg-vignette": "0.6"}; empty = picture unchanged.
HUB_THEMES = {
    "screens": {
        # Pictures supplied by the user (vendor/hub-art, tools/import_hub_art.py) replace scr1 / scr2.
        # Sweet spots picked by the user with the tuner (12/11).
        "hub-temple": ("scr1", "assets/hub/bg/temple-sunset-logo.webp", {
            "--aoe-bg-brightness": "1.05", "--aoe-bg-saturate": "0.9", "--aoe-bg-scrim": "0.11",
            "--aoe-bg-vignette": "0.36", "--aoe-bg-y": "46%",
        }),
        "hub-village": ("scr2", "assets/hub/bg/village-sunset.webp", {"--aoe-bg-saturate": "0.95", "--aoe-bg-scrim": "0.34"}),
    },
    "dialogs": {
        "hub-wood": ("dlg6_3", "assets/hub/dialog/wood.png", {}),
    },
}

SCREEN_DESCRIPTORS = {
    # descriptor id: theme key
    50051: "scr1", 50052: "scr2", 50053: "scr3", 50054: "scr4", 50055: "scr5",
    50057: "scr7", 50058: "scr8", 50060: "scr9", 50061: "scr10",
}
DIALOG_DESCRIPTORS = {
    50001: "dlg1", 50002: "dlg2", 50003: "dlg3", 50004: "dlg4", 50005: "dlg5",
    50006: "dlg6_0", 50007: "dlg6_1", 50008: "dlg6_2", 50009: "dlg6_3", 53000: "dlg6_4",
    50010: "dlg10", 50011: "dlg11", 50012: "dlg12", 50013: "dlg13",
}
GAME_PALETTE_ID = 50500

FACTIONS = {
    "egyptian": "Egyptian",
    "greek": "Greek",
    "babylonian": "Babylonian",
    "asian": "Asian",
    "roman": "Roman",
}
PLAYER_NAMES = ["blue", "red", "yellow", "brown", "orange", "green", "grey", "cyan"]

# The dlg6 dialog family has one variant per faction (texture matches the faction's HUD).
DLG6_BY_FACTION = {
    "egyptian": "dlg6_0",    # sandstone 50210
    "greek": "dlg6_1",       # marble 50212
    "babylonian": "dlg6_2",  # brick 50214
    "asian": "dlg6_3",       # wood 50216
    "roman": "dlg6_4",       # dark stone 53003
}
# Hub default theme chosen by the user (PLAN.md "Đã chốt"); every other theme is secondary.
DEFAULTS = {
    "screen": "scr2",
    "dialog": "dlg6_0",
}

# Palette 50500 indices for semantic colors (verified in the palette table).
SEMANTIC_INDICES = {
    "success": 77,   # #00bb37
    "warning": 177,  # #ffb32b
    "danger": 36,    # #ff2f2f
    "info": 20,      # #577bb3
}
STATUS_MAP = {
    "online": "success",
    "away": "warning",
    "busy": "danger",
    "in-game": "info",
    "offline": None,  # neutral grey, palette index 117
}
OFFLINE_INDEX = 117  # #8f8f8f


def hex_rgb(c: tuple[int, int, int]) -> str:
    return "#%02x%02x%02x" % c


def load_palette(raw_dir: Path, pal_id: int) -> list[tuple[int, int, int]]:
    for path in raw_dir.glob(f"*/{pal_id}.pal"):
        lines = [l.split() for l in path.read_text(encoding="ascii", errors="ignore").splitlines()[3:]]
        return [tuple(int(v) for v in parts[:3]) for parts in lines if len(parts) >= 3]  # type: ignore[misc]
    raise FileNotFoundError(f"palette {pal_id} not found in {raw_dir}")


def parse_descriptor(path: Path) -> dict[str, list[str]]:
    kv: dict[str, list[str]] = {}
    for line in path.read_text(encoding="ascii", errors="ignore").splitlines():
        parts = line.split()
        if parts:
            kv[parts[0]] = parts[1:]
    return kv


def rel_luminance(c: tuple[int, int, int]) -> float:
    def ch(v: int) -> float:
        s = v / 255
        return s / 12.92 if s <= 0.03928 else ((s + 0.055) / 1.055) ** 2.4

    r, g, b = c
    return 0.2126 * ch(r) + 0.7152 * ch(g) + 0.0722 * ch(b)


def contrast(a: tuple[int, int, int], b: tuple[int, int, int]) -> float:
    la, lb = sorted((rel_luminance(a), rel_luminance(b)), reverse=True)
    return (la + 0.05) / (lb + 0.05)


def mean_color(img: Image.Image) -> tuple[int, int, int]:
    raw = img.convert("RGBA").resize((64, 64)).tobytes()
    px = [tuple(raw[i : i + 4]) for i in range(0, len(raw), 4) if raw[i + 3] > 0]
    n = max(len(px), 1)
    return tuple(int(sum(p[i] for p in px) / n) for i in range(3))  # type: ignore[return-value]


def shade(c: tuple[int, int, int], percent: int) -> tuple[int, int, int]:
    k = 1 - percent / 100
    return tuple(int(v * k) for v in c)  # type: ignore[return-value]


def rgb_list(values: list[str]) -> tuple[int, int, int]:
    return tuple(int(v) for v in values[:3])  # type: ignore[return-value]


class TokenBuilder:
    def __init__(self, raw_dir: Path, assets_dir: Path):
        self.raw_dir = raw_dir
        self.assets_dir = assets_dir
        self.palettes: dict[int, list[tuple[int, int, int]]] = {}
        self.warnings: list[str] = []

    def pal(self, pal_id: int) -> list[tuple[int, int, int]]:
        if pal_id not in self.palettes:
            self.palettes[pal_id] = load_palette(self.raw_dir, pal_id)
        return self.palettes[pal_id]

    def find_bg(self, theme: str) -> str | None:
        """Master background for a screen theme (assets/ui/bg/<theme>.webp)."""
        p = self.assets_dir / "bg" / f"{theme}.webp"
        return p.relative_to(self.assets_dir).as_posix() if p.is_file() else None

    def texture_for(self, bg_id: int) -> str | None:
        """Raw PNG of a dialog texture SLP (relative to raw/)."""
        p = self.raw_dir / "interfac" / f"{bg_id}.png"
        return p.relative_to(self.raw_dir).as_posix() if p.is_file() else None

    def build_theme(self, desc_id: int, key: str, kind: str) -> dict[str, Any] | None:
        path = self.raw_dir / "interfac" / f"{desc_id}.txt"
        if not path.is_file():
            self.warnings.append(f"missing descriptor {desc_id}")
            return None
        kv = parse_descriptor(path)
        pal_id = int(kv["palette_file"][1])
        palette = self.pal(pal_id)
        bevel_idx = [int(v) for v in kv["bevel_colors"]]
        bevel = [hex_rgb(palette[i]) for i in bevel_idx]
        text = rgb_list(kv["text_color1"])
        text_shadow = rgb_list(kv["text_color2"])
        focus = rgb_list(kv["focus_color1"])
        state = rgb_list(kv["state_color1"])
        shade_pct = int(kv["shade_amount"][1])
        bg_id = int(kv["background1_files"][2])

        theme: dict[str, Any] = {
            "kind": kind,
            "descriptor": desc_id,
            "palette": pal_id,
            "bevel": bevel,
            "bevelIndices": bevel_idx,
            "text": hex_rgb(text),
            "textShadow": hex_rgb(text_shadow),
            "focus": hex_rgb(focus),
            "state": hex_rgb(state),
            "shade": shade_pct,
            "background": hex_rgb(palette[int(kv["background_color"][0])]),
            "backgroundImageId": bg_id if bg_id > 0 else None,
            "buttonSpriteId": int(kv["button_file"][1]) if int(kv["button_file"][1]) > 0 else None,
        }

        # Surface the text sits on: background image (screen) or texture (dialog), darkened by shade.
        surface_img: Image.Image | None = None
        if kind == "screen":
            bg_rel = self.find_bg(key)
            theme["backgroundImage"] = f"assets/ui/{bg_rel}" if bg_rel else None
            if bg_rel:
                surface_img = Image.open(self.assets_dir / bg_rel)
        else:
            tex_rel = self.texture_for(bg_id) if bg_id > 0 else None
            theme["texture"] = f"raw/{tex_rel}" if tex_rel else None
            if tex_rel:
                surface_img = Image.open(self.raw_dir / tex_rel)

        if surface_img is not None:
            surface = shade(mean_color(surface_img), shade_pct)
        else:
            surface = palette[int(kv["background_color"][0])]
        theme["surfaceAverage"] = hex_rgb(surface)
        theme["contrast"] = {
            "text": round(contrast(text, surface), 2),
            "focus": round(contrast(focus, surface), 2),
            "passesAA": contrast(text, surface) >= 4.5,
        }
        return theme

    def derive_hub_theme(self, base: dict[str, Any], kind: str, image: str, base_key: str) -> dict[str, Any] | None:
        """Theme on the hub's own artwork (assets/hub, tools/gen_hub_art.py): colors / bevel / shade of a game theme,
        surface average and contrast measured again on the new image."""
        path = Path(image)
        if not path.is_file():
            self.warnings.append(f"missing hub art {image} (run tools/gen_hub_art.py)")
            return None
        theme = dict(base)
        theme.update({"kind": kind, "source": "hub", "basedOn": base_key, "backgroundImageId": None, "buttonSpriteId": None})
        theme["backgroundImage" if kind == "screen" else "texture"] = path.as_posix()
        surface = shade(mean_color(Image.open(path)), base["shade"])
        text, focus = hex_to_rgb(base["text"]), hex_to_rgb(base["focus"])
        theme["surfaceAverage"] = hex_rgb(surface)
        theme["contrast"] = {
            "text": round(contrast(text, surface), 2),
            "focus": round(contrast(focus, surface), 2),
            "passesAA": contrast(text, surface) >= 4.5,
        }
        return theme

    def build_factions(self) -> dict[str, Any]:
        out: dict[str, Any] = {}
        for key, label in FACTIONS.items():
            bar = self.assets_dir / "hud" / f"{key}-bottombar.png"
            if not bar.is_file():
                self.warnings.append(f"missing HUD bar for faction {key}")
                continue
            img = Image.open(bar).convert("RGB")
            # Skip the minimap diamond on the right; sample the relief area only.
            relief = img.crop((70, 10, int(img.width * 0.75), img.height - 10)).resize((96, 24))
            raw = relief.tobytes()
            px = sorted((tuple(raw[i : i + 3]) for i in range(0, len(raw), 3)), key=rel_luminance)
            n = len(px)
            dark, mid, light = px[int(n * 0.1)], px[n // 2], px[int(n * 0.9)]
            on_surface = (255, 255, 255) if contrast((255, 255, 255), mid) >= contrast((0, 0, 0), mid) else (0, 0, 0)
            out[key] = {
                "label": label,
                "surface": hex_rgb(mid),
                "surfaceLight": hex_rgb(light),
                "surfaceDark": hex_rgb(dark),
                "onSurface": hex_rgb(on_surface),
                "onSurfaceContrast": round(contrast(on_surface, mid), 2),
                "assets": {
                    "topbar": f"assets/ui/hud/{key}-topbar.png",
                    "bottombar": f"assets/ui/hud/{key}-bottombar.png",
                    "buttonBg": f"assets/ui/hud/{key}-button-bg-sheet.png",
                    "arrowCancel": f"assets/ui/hud/{key}-arrow-cancel-sheet.png",
                    "textButton": f"assets/ui/hud/{key}-text-button-<sm|md>-sheet.png",
                    "buildings": f"assets/ui/icon/{key}-buildings-sheet.png",
                },
            }
        return out

    def build_players(self) -> dict[str, Any]:
        game = self.pal(GAME_PALETTE_ID)
        out: dict[str, Any] = {}
        for n, name in enumerate(PLAYER_NAMES, start=1):
            ramp = [hex_rgb(game[16 * n + i]) for i in range(10)]
            out[f"player-{n}"] = {
                "name": name,
                "base": ramp[4],
                "light": ramp[1],
                "dark": ramp[7],
                "ramp": ramp,
                "paletteIndex": 16 * n,
            }
        return out

    def build_semantic(self) -> dict[str, Any]:
        game = self.pal(GAME_PALETTE_ID)
        semantic = {k: hex_rgb(game[i]) for k, i in SEMANTIC_INDICES.items()}
        status = {
            k: (semantic[v] if v else hex_rgb(game[OFFLINE_INDEX])) for k, v in STATUS_MAP.items()
        }
        return {"semantic": semantic, "status": status}

    def add_on_dark(self, players: dict[str, Any], colors: dict[str, Any], surface_hex: str) -> None:
        """Text-safe variants (WCAG AA 4.5:1) on the default dark screen surface.

        Players: the shade closest to `base` in the player's own ramp that passes.
        Semantic: same rule using the player ramp of matching hue for `info`.
        Badges: text color (black / white) with the better contrast on each fill.
        """
        surface = tuple(int(surface_hex[i : i + 2], 16) for i in (1, 3, 5))
        to_rgb = lambda h: tuple(int(h[i : i + 2], 16) for i in (1, 3, 5))  # noqa: E731

        def nearest_passing(ramp: list[str], base_idx: int) -> str:
            ok = [i for i, c in enumerate(ramp) if contrast(to_rgb(c), surface) >= 4.5]
            return ramp[min(ok, key=lambda i: abs(i - base_idx))] if ok else ramp[0]

        for p in players.values():
            p["onDark"] = nearest_passing(p["ramp"], 4)
        blue_ramp = players["player-1"]["ramp"]
        on_dark = {}
        for name, hex_ in colors["semantic"].items():
            on_dark[name] = hex_ if contrast(to_rgb(hex_), surface) >= 4.5 else nearest_passing(blue_ramp, 4)
        colors["semanticOnDark"] = on_dark
        colors["statusOnDark"] = {
            k: (on_dark[STATUS_MAP[k]] if STATUS_MAP[k] else v) for k, v in colors["status"].items()
        }
        colors["onSemantic"] = {
            name: ("#000000" if contrast((0, 0, 0), to_rgb(h)) >= contrast((255, 255, 255), to_rgb(h)) else "#ffffff")
            for name, h in colors["semantic"].items()
        }

    def build(self) -> dict[str, Any]:
        screens = {k: t for d, k in SCREEN_DESCRIPTORS.items() if (t := self.build_theme(d, k, "screen"))}
        dialogs = {k: t for d, k in DIALOG_DESCRIPTORS.items() if (t := self.build_theme(d, k, "dialog"))}
        for key, (base_key, image, treatment) in HUB_THEMES["screens"].items():
            if base_key in screens and (t := self.derive_hub_theme(screens[base_key], "screen", image, base_key)):
                screens[key] = {**t, "treatment": treatment} if treatment else t
        for key, (base_key, image, treatment) in HUB_THEMES["dialogs"].items():
            if base_key in dialogs and (t := self.derive_hub_theme(dialogs[base_key], "dialog", image, base_key)):
                dialogs[key] = {**t, "treatment": treatment} if treatment else t
        colors = self.build_semantic()
        players = self.build_players()
        self.add_on_dark(players, colors, screens[DEFAULTS["screen"]]["surfaceAverage"])
        return {
            "$schema": "aoe-ui-hub/design-tokens@1",
            "source": "Generated by tools/build_tokens.py from game screen descriptors and palettes. Do not edit by hand.",
            "bevel": {
                "description": (
                    "Borders are drawn by the game engine, not sprites. 6 colors light->dark. "
                    "Raised: top/left lines bevel[0] (outer), bevel[1], bevel[2] (inner); "
                    "bottom/right lines bevel[3] (inner), bevel[4], bevel[5] (outer). "
                    "Sunken: swap the two groups."
                ),
                "width": 3,
                "variants": ["raised", "sunken", "etched", "flat"],
            },
            "defaults": DEFAULTS,
            "dialogFamilies": {"dlg6": {"byFaction": DLG6_BY_FACTION, "note": "Secondary: optional per-faction dialog skins."}},
            "themes": {"screens": screens, "dialogs": dialogs},
            "factions": self.build_factions(),
            "players": players,
            "color": colors,
            "typography": {
                "fontFamily": {
                    "heading": ["Spectral SC", "serif"],
                    "body": ["Arimo", "Arial", "sans-serif"],
                },
                "fontFaces": [
                    {"family": "Spectral SC", "weight": 400, "src": "assets/ui/font/web/SpectralSC-400.ttf"},
                    {"family": "Spectral SC", "weight": 600, "src": "assets/ui/font/web/SpectralSC-600.ttf"},
                    {"family": "Spectral SC", "weight": 700, "src": "assets/ui/font/web/SpectralSC-700.ttf"},
                    {"family": "Arimo", "weight": 400, "src": "assets/ui/font/web/Arimo-400.ttf"},
                    {"family": "Arimo", "weight": 700, "src": "assets/ui/font/web/Arimo-700.ttf"},
                ],
                "gameFonts": {
                    "note": "Reference only, not used by the hub: no Unicode Vietnamese.",
                    "coprgtl.ttf": "Copperplate Gothic Light, Latin-1 only (commercial font).",
                    "vncoprgt.ttf": "TCVN3 (ABC) legacy encoding, not Unicode.",
                    "vnarial.ttf": "TCVN3 (ABC) legacy encoding, not Unicode.",
                    "vnarialb.ttf": "TCVN3 (ABC) legacy encoding, not Unicode.",
                },
                "textShadow": "1px 1px 0 var(--aoe-text-shadow)",
                "scale": {"xs": 11, "sm": 12, "md": 14, "lg": 16, "xl": 20, "2xl": 24, "3xl": 32},
            },
            "space": {"0": 0, "1": 4, "2": 8, "3": 12, "4": 16, "5": 20, "6": 24, "8": 32, "10": 40, "12": 48},
            "radius": {"none": 0},
            "zIndex": {"base": 0, "dropdown": 100, "sticky": 200, "overlay": 300, "modal": 400, "toast": 500, "tooltip": 600},
            "motion": {"fast": "100ms", "base": "150ms", "slow": "200ms", "easing": "steps(1, end)"},
        }


# ---------------------------------------------------------------- preview page

def bevel_shadow(bevel: list[str], sunken: bool = False) -> str:
    light, dark = bevel[:3], bevel[3:][::-1]  # dark: outer first
    if sunken:
        light, dark = dark, light
    parts = []
    for i in range(3):
        parts.append(f"inset {i + 1}px {i + 1}px 0 {light[i]}")
        parts.append(f"inset -{i + 1}px -{i + 1}px 0 {dark[i]}")
    return ", ".join(parts)


def hex_to_rgb(h: str) -> tuple[int, int, int]:
    return tuple(int(h[i : i + 2], 16) for i in (1, 3, 5))  # type: ignore[return-value]


def contrast_section(tokens: dict[str, Any], rel: Any) -> str:
    """Before/after contrast of every text color on the default dark surface and dialog texture."""
    scr = tokens["themes"]["screens"][tokens["defaults"]["screen"]]
    dlg = tokens["themes"]["dialogs"][tokens["defaults"]["dialog"]]
    surfaces = [
        ("Nền tối " + tokens["defaults"]["screen"], scr["surfaceAverage"], None),
        ("Texture " + tokens["defaults"]["dialog"] + f" + phủ {dlg['shade']}%", dlg["surfaceAverage"], dlg.get("texture")),
    ]
    col = tokens["color"]
    rows: list[tuple[str, str, str | None]] = [
        ("Chữ chính scr2", scr["text"], None),
        ("Chữ trắng (text dialog / state)", dlg["text"], None),
        ("Focus", scr["focus"], None),
    ]
    for name, base in col["semantic"].items():
        rows.append((name, base, col["semanticOnDark"][name]))
    for key, pl in tokens["players"].items():
        rows.append((f"{key} {pl['name']}", pl["base"], pl["onDark"]))

    def cell(fg: str, bg_hex: str, texture: str | None) -> str:
        ratio = contrast(hex_to_rgb(fg), hex_to_rgb(bg_hex))
        ok = ratio >= 4.5
        shade = dlg["shade"] / 100
        bg = f"background:{bg_hex};" + (
            f"background-image:linear-gradient(rgba(0,0,0,{shade}),rgba(0,0,0,{shade})),url('{rel(texture).as_posix()}');" if texture else "")
        return (f'<td><span class="sample" style="{bg}color:{fg}">Sảnh chờ 123</span> '
                f'<b class="{"pass" if ok else "fail"}">{ratio:.2f}</b></td>')

    body = []
    for label, base, on_dark in rows:
        tds = [cell(base, s_hex, tex) for _, s_hex, tex in surfaces]
        fixed = (cell(on_dark, surfaces[0][1], None) if on_dark and on_dark != base else
                 '<td class="muted">— không cần</td>' if on_dark else '<td class="muted">—</td>')
        body.append(f"<tr><th>{html.escape(label)}<br><code>{base}</code>{f' → <code>{on_dark}</code>' if on_dark and on_dark != base else ''}</th>{''.join(tds)}{fixed}</tr>")
    badges = "".join(
        f'<span class="badge-demo" style="background:{c};color:{col["onSemantic"][n]}">{n} '
        f'{contrast(hex_to_rgb(col["onSemantic"][n]), hex_to_rgb(c)):.2f}</span>'
        for n, c in col["semantic"].items()
    )
    head = "".join(f"<th>{html.escape(n)}<br><code>{h}</code></th>" for n, h, _ in surfaces)
    return f"""
<h2>Tương phản chữ (WCAG AA ≥ 4.5)</h2>
<p class="muted">Đo trên màu trung bình của nền. Cột cuối: biến thể <code>onDark</code> đã sửa (sắc độ gần nhất trong cùng dải màu game). Quy tắc: trên texture hộp thoại chỉ dùng chữ trắng.</p>
<div class="tablewrap"><table class="contrast"><thead><tr><th>Màu chữ</th>{head}<th>onDark trên nền tối</th></tr></thead><tbody>{''.join(body)}</tbody></table></div>
<p>Chữ trên badge (<code>onSemantic</code>): {badges}</p>"""


def render_preview(tokens: dict[str, Any], out_path: Path, root: Path) -> None:
    depth = len(out_path.resolve().parent.relative_to(root.resolve()).parts)
    rel = lambda p: Path(*([".."] * depth)) / p  # noqa: E731

    def theme_card(key: str, t: dict[str, Any]) -> str:
        img = t.get("backgroundImage") or t.get("texture")
        bg_css = f"background-image:url('{rel(img).as_posix()}');" if img else ""
        c = t["contrast"]
        badge = "ok" if c["passesAA"] else "bad"
        return f"""
<section class="card">
  <header><b>{html.escape(key)}</b> <span class="muted">desc {t['descriptor']} · pal {t['palette']} · shade {t['shade']}%</span>
    <span class="badge {badge}">chữ/nền {c['text']}:1</span></header>
  <div class="stage" style="{bg_css}background-color:{t['background']}">
    <div class="panel" style="--shade:{t['shade'] / 100};box-shadow:{bevel_shadow(t['bevel'])}">
      <div class="title" style="color:{t['text']};text-shadow:1px 1px 0 {t['textShadow']}">Sảnh chờ — Lobby</div>
      <div class="row">
        <button style="box-shadow:{bevel_shadow(t['bevel'])};color:{t['text']};text-shadow:1px 1px 0 {t['textShadow']}">Vào phòng</button>
        <button style="box-shadow:{bevel_shadow(t['bevel'])};color:{t['focus']};text-shadow:1px 1px 0 {t['textShadow']}">Hover</button>
        <button style="box-shadow:{bevel_shadow(t['bevel'], True)};color:{t['state']};text-shadow:1px 1px 0 {t['textShadow']}">Đang nhấn</button>
      </div>
      <div class="input" style="box-shadow:{bevel_shadow(t['bevel'], True)};color:{t['text']}">Ô nhập (viền lõm)</div>
    </div>
  </div>
  <div class="swatches">{''.join(f'<i title="bevel[{i}] {b}" style="background:{b}"></i>' for i, b in enumerate(t['bevel']))}
    <span class="muted">text <i style="background:{t['text']}"></i> focus <i style="background:{t['focus']}"></i> state <i style="background:{t['state']}"></i></span></div>
</section>"""

    def faction_card(key: str, f: dict[str, Any]) -> str:
        bar = rel(f"assets/ui/hud/{key}-bottombar.png").as_posix()
        return f"""
<section class="card">
  <header><b>{html.escape(f['label'])}</b> <span class="muted">{key}</span>
    <span class="badge {'ok' if f['onSurfaceContrast'] >= 4.5 else 'bad'}">chữ/nền {f['onSurfaceContrast']}:1</span></header>
  <div class="hud-top" style="background-image:url('{rel(f"assets/ui/hud/{key}-topbar.png").as_posix()}')"></div>
  <div class="hud-bottom" style="background-image:url('{bar}')"><div class="hud-cap" style="background-image:url('{bar}')"></div></div>
  <div class="swatches"><i style="background:{f['surfaceDark']}"></i><i style="background:{f['surface']}"></i><i style="background:{f['surfaceLight']}"></i>
    <span style="background:{f['surface']};color:{f['onSurface']};padding:2px 8px">Chữ trên nền phe</span></div>
</section>"""

    players = "".join(
        f'<div class="player"><i style="background:{p["base"]}"></i>{n} · {p["name"]} <span class="ramp">'
        + "".join(f'<i style="background:{c}"></i>' for c in p["ramp"])
        + "</span></div>"
        for n, p in tokens["players"].items()
    )
    semantic = "".join(
        f'<div class="player"><i style="background:{v}"></i>{k} {v}</div>'
        for group in (tokens["color"]["semantic"], tokens["color"]["status"])
        for k, v in group.items()
    )
    screens = "".join(theme_card(k, t) for k, t in tokens["themes"]["screens"].items())
    dialogs = "".join(theme_card(k, t) for k, t in tokens["themes"]["dialogs"].items())
    factions = "".join(faction_card(k, f) for k, f in tokens["factions"].items())
    font_faces = "\n".join(
        f'@font-face {{ font-family: "{f["family"]}"; font-weight: {f["weight"]}; src: url("{rel(f["src"]).as_posix()}"); }}'
        for f in tokens["typography"]["fontFaces"]
    )

    page = f"""<!doctype html>
<html lang="vi"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>AoE Design Tokens</title>
<style>
{font_faces}
:root {{ color-scheme: dark; }}
body {{ margin:0; padding:16px; background:#14110d; color:#d9d0b0; font:14px/1.4 Arimo, Arial, sans-serif; }}
h1,h2 {{ font-family:"Spectral SC", serif; font-weight:normal; }}
.grid {{ display:grid; grid-template-columns:repeat(auto-fill,minmax(360px,1fr)); gap:16px; }}
.card {{ background:#1f1a14; padding:10px; }}
.card header {{ display:flex; gap:8px; align-items:center; flex-wrap:wrap; margin-bottom:8px; }}
.muted {{ color:#8f8670; font-size:12px; }}
.badge {{ margin-left:auto; font-size:12px; padding:1px 6px; }}
.badge.ok {{ background:#0b4d1f; }} .badge.bad {{ background:#6b1010; }}
.stage {{ background-size:cover; background-position:center; padding:18px; }}
.panel {{ position:relative; padding:14px; background:rgba(0,0,0,var(--shade)); }}
.title {{ font-family:"Spectral SC", serif; font-weight:600; font-size:18px; margin-bottom:10px; }}
.row {{ display:flex; gap:8px; flex-wrap:wrap; margin-bottom:10px; }}
button {{ font:inherit; padding:7px 14px; background:transparent; border:0; cursor:pointer; }}
.input {{ padding:7px 10px; background:rgba(0,0,0,.35); }}
.swatches {{ display:flex; gap:4px; align-items:center; flex-wrap:wrap; margin-top:8px; }}
i {{ display:inline-block; width:18px; height:18px; vertical-align:middle; }}
.hud-top {{ height:20px; background-repeat:no-repeat; background-position:left top; }}
.hud-bottom {{ position:relative; height:126px; background-repeat:no-repeat; background-position:left top; overflow:hidden; }}
.hud-cap {{ position:absolute; right:0; top:0; width:280px; height:126px; background-repeat:no-repeat; background-position:right top; }}
.full {{ grid-template-columns:1fr; }}
.tablewrap {{ overflow-x:auto; }}
table.contrast {{ border-collapse:collapse; font-size:13px; }}
table.contrast th, table.contrast td {{ padding:6px 10px; border-bottom:1px solid #3b3024; text-align:left; vertical-align:middle; }}
table.contrast th {{ font-weight:normal; color:#d9d0b0; }}
.sample {{ display:inline-block; padding:4px 10px; font-weight:bold; text-shadow:1px 1px 0 #000; min-width:110px; }}
b.pass {{ color:#00bb37; }} b.fail {{ color:#ff2f2f; }}
.badge-demo {{ display:inline-block; padding:2px 8px; margin:0 4px; font-size:12px; font-weight:bold; }}
code {{ font-size:11px; color:#8f8670; }}
.player {{ display:flex; gap:8px; align-items:center; margin:4px 0; }}
.ramp i {{ width:12px; }}
</style></head><body>
<h1>AoE Design Tokens</h1>
<p class="muted">Sinh tự động bởi tools/build_tokens.py. Viền = bevel 3px dựng bằng box-shadow từ 6 màu bevel_colors của game. Tỉ lệ tương phản đo chữ chính trên màu trung bình của nền đã phủ tối (AA cần ≥ 4.5).</p>
{contrast_section(tokens, rel)}
<h2>Theme màn hình</h2><div class="grid">{screens}</div>
<h2>Theme hộp thoại</h2><div class="grid">{dialogs}</div>
<h2>5 phong cách phe (từ thanh HUD)</h2><p class="muted">Thanh HUD không scale: thanh trên neo trái; thanh dưới ghép 2 lớp (phần trái neo trái + 280px ô minimap neo phải). Thu/phóng cửa sổ để thử.</p><div class="grid full">{factions}</div>
<h2>Màu người chơi (palette 50500, index 16×N)</h2>{players}
<h2>Màu ngữ nghĩa và trạng thái</h2>{semantic}
</body></html>"""
    out_path.parent.mkdir(parents=True, exist_ok=True)
    out_path.write_text(page, encoding="utf-8")


def channels(hex_color: str) -> str:
    """'#rrggbb' -> 'r g b' for rgb(var(--x-rgb) / <alpha-value>) in Tailwind."""
    return " ".join(str(v) for v in hex_to_rgb(hex_color))


# Tone color slots shared by aoe-theme.css (.tone-*) and the Tailwind preset (colors.tone.*).
TONE_SLOTS = ["text", "focus", "state", "surface"] + [f"bevel-{i}" for i in range(6)]


CONTROLS = ["checkbox-off", "checkbox-on", "close", "arrow-up", "arrow-down", "arrow-down-alt", "blank", "blank-alt"]
# The wood checkbox blends into the wood texture (1.55:1); dlg6_3 borrows the sandstone checkbox (2.93:1).
CONTROL_OVERRIDES = {("dlg6_3", "checkbox-off"): "dlg6_0", ("dlg6_3", "checkbox-on"): "dlg6_0"}


def control_vars(prefix: str, key: str, root: Path, up: str) -> list[str]:
    """--<prefix>ctl-<control>-<normal|pressed>: url() of the theme's control sprite (skipped when the theme has none)."""
    lines = []
    for ctl in CONTROLS:
        src = CONTROL_OVERRIDES.get((key, ctl), key)
        for state in ("normal", "pressed"):
            path = f"assets/ui/button/{src}-{ctl}-{state}.png"
            if (root / path).is_file():
                lines.append(f'  --{prefix}ctl-{ctl}-{state}: url("{up}{path}");')
    return lines


def bevel_shadows() -> dict[str, str]:
    """Game frame style: {class name: box-shadow}; --b0..--b5 come from the active tone (light -> dark)."""
    rings = {"raised": [(0, 5), (1, 4), (2, 3)], "sunken": [(5, 0), (4, 1), (3, 2)]}
    rules: dict[str, str] = {}
    for variant, pairs in rings.items():
        for width in (1, 2, 3):
            parts = []
            for i, (a, b) in enumerate(pairs[:width], start=1):
                parts.append(f"inset {i}px {i}px 0 var(--b{a}), inset -{i}px -{i}px 0 var(--b{b})")
            name = f"bevel-{variant}" if width == 3 else f"bevel-{variant}-{width}"
            rules[name] = ", ".join(parts)
    rules["bevel-etched"] = "inset 1px 1px 0 var(--b5), inset -1px -1px 0 var(--b0)"
    rules["bevel-flat"] = "inset 0 0 0 1px var(--b5)"
    # Full-width bars (TopBar, LaunchBar): top and bottom edges only, no left / right border.
    rules["bevel-bar"] = "inset 0 1px 0 var(--b0), inset 0 -1px 0 var(--b5), inset 0 2px 0 var(--b1), inset 0 -2px 0 var(--b4)"
    rules["bevel-none"] = "none"
    return rules


# Try-out frame styles, chosen by data-frame on <html> (PLAN.md, Tokens): formulas override the game bevel.
# "modern" (kiểu B): the light steps of the game bevel (bevel[0] -> [1] -> [2], light outside, darker inward)
# run evenly round all 4 edges like a picture-frame molding, instead of light top-left / dark bottom-right.
# Raised (panels, buttons) also lift off the background with a drop shadow; sunken (inputs, pressed) reverses
# the steps (dark outside -> light inside) so it reads as a groove.
def _rings(*colors: str) -> str:
    """Even rings from the outside in: ring i is an inset spread of i px (the first listed paints on top)."""
    return ", ".join(f"inset 0 0 0 {i}px var(--b{c})" for i, c in enumerate(colors, start=1))


MODERN_SHADOWS = {
    "bevel-raised-1": f"{_rings('0')}, 0 1px 2px rgb(0 0 0 / 0.5)",
    "bevel-raised-2": f"{_rings('0', '1')}, 0 2px 3px rgb(0 0 0 / 0.6)",
    "bevel-raised": f"{_rings('0', '1', '2')}, 0 4px 12px rgb(0 0 0 / 0.55)",
    "bevel-sunken-1": _rings("1"),
    "bevel-sunken-2": _rings("1", "0"),
    "bevel-sunken": _rings("2", "1", "0"),
    "bevel-etched": _rings("1"),
    "bevel-bar": "inset 0 1px 0 var(--b0), inset 0 -1px 0 var(--b0), inset 0 2px 0 var(--b1), inset 0 -2px 0 var(--b1)",
}


def _lit(width: int) -> str:
    """Light from the top-left: bevel[0] on top / left, black on bottom / right (2 rings max, outer strongest)."""
    rings = [(0.95, 0.75), (0.4, 0.35)][:width]
    return ", ".join(
        f"inset {i}px {i}px 0 rgb(var(--t-bevel-0-rgb) / {lt}), inset -{i}px -{i}px 0 rgb(0 0 0 / {dk})"
        for i, (lt, dk) in enumerate(rings, start=1)
    )


# "lit" (kiểu A'): softened game bevel, one width (2px; the -1 classes 1px), and always lit from the top-left —
# raised and sunken alike (inputs, buttons, cards, pressed state), so every edge on screen agrees.
LIT_SHADOWS = {
    "bevel-raised-1": _lit(1), "bevel-raised-2": _lit(2), "bevel-raised": _lit(2),
    "bevel-sunken-1": _lit(1), "bevel-sunken-2": _lit(2), "bevel-sunken": _lit(2),
    "bevel-etched": _lit(1),
    "bevel-bar": "inset 0 1px 0 rgb(var(--t-bevel-0-rgb) / 0.95), inset 0 -1px 0 rgb(0 0 0 / 0.75), "
                 "inset 0 2px 0 rgb(var(--t-bevel-0-rgb) / 0.4), inset 0 -2px 0 rgb(0 0 0 / 0.35)",
}

FRAME_STYLES = {"lit": LIT_SHADOWS, "modern": MODERN_SHADOWS}


def bevel_rules() -> dict[str, str]:
    """Bevel utilities as {class name: box-shadow}. Each reads a --bv-* variable so the frame style can switch
    (game / modern) without touching components; the variables are set next to --b* in the tone rules."""
    return {name: "none" if shadow == "none" else f"var(--bv-{name.removeprefix('bevel-')})" for name, shadow in bevel_shadows().items()}


def frame_vars(style: str) -> str:
    shadows = bevel_shadows() | FRAME_STYLES.get(style, {})
    return " ".join(f"--bv-{n.removeprefix('bevel-')}: {s};" for n, s in shadows.items() if s != "none")


def tone_rule(selector: str, prefix: str) -> str:
    """Point the generic --b* / --t-* slots at one theme family (aoe- = screen, dlg- = dialog)."""
    decl = [f"--b{i}: var(--{prefix}bevel-{i});" for i in range(6)]
    decl += [f"--t-{slot}-rgb: var(--{prefix}{slot}-rgb);" for slot in TONE_SLOTS]
    decl += [f"--t-text-shadow: var(--{prefix}text-shadow);", f"--t-focus: var(--{prefix}focus);"]
    decl += [f"--t-ctl-{c}-{st}: var(--{prefix}ctl-{c}-{st});" for c in CONTROLS for st in ("normal", "pressed")]
    # Frame formulas live with the colors they use: a custom property resolves var() where it is declared.
    return f"{selector} {{ {' '.join(decl)} {frame_vars('game')} }}"


def render_theme_css(tokens: dict[str, Any], out_path: Path, root: Path) -> None:
    """tokens/aoe-theme.css: CSS variables per theme + font faces + Bevel / Surface utilities."""
    depth = len(out_path.resolve().parent.relative_to(root.resolve()).parts)
    up = "../" * depth

    def bevel_vars(prefix: str, t: dict[str, Any]) -> list[str]:
        return [f"  --{prefix}bevel-{i}: {c};" for i, c in enumerate(t["bevel"])] + [
            f"  --{prefix}text: {t['text']};",
            f"  --{prefix}text-shadow: {t['textShadow']};",
            f"  --{prefix}focus: {t['focus']};",
            f"  --{prefix}state: {t['state']};",
            f"  --{prefix}shade: {t['shade'] / 100};",
            f"  --{prefix}surface: {t['surfaceAverage']};",
        ] + [f"  --{prefix}{slot}-rgb: {channels(t[key])};" for slot, key in (("text", "text"), ("focus", "focus"), ("state", "state"), ("surface", "surfaceAverage"))] + [
            f"  --{prefix}bevel-{i}-rgb: {channels(c)};" for i, c in enumerate(t["bevel"])
        ]

    out: list[str] = ["/* Generated by tools/build_tokens.py from tokens/design-tokens.json. Do not edit by hand. */", ""]
    for f in tokens["typography"]["fontFaces"]:
        out.append(f'@font-face {{ font-family: "{f["family"]}"; font-weight: {f["weight"]}; font-display: swap; src: url("{up}{f["src"]}") format("truetype"); }}')
    out.append("")

    col = tokens["color"]
    root_vars = [":root {"]
    root_vars += [f"  --aoe-{k}: {v};" for k, v in col["semantic"].items()]
    root_vars += [f"  --aoe-{k}-on-dark: {v};" for k, v in col["semanticOnDark"].items()]
    root_vars += [f"  --aoe-on-{k}: {v};" for k, v in col["onSemantic"].items()]
    root_vars += [f"  --aoe-status-{k}: {v};" for k, v in col["statusOnDark"].items()]
    for key, p in tokens["players"].items():
        n = key.split("-")[1]
        root_vars += [f"  --aoe-player-{n}: {p['base']};", f"  --aoe-player-{n}-on-dark: {p['onDark']};"]
    root_vars += [
        f"  --aoe-font-heading: {', '.join(repr(x).replace(chr(39), chr(34)) if ' ' in x else x for x in tokens['typography']['fontFamily']['heading'])};",
        f"  --aoe-font-body: {', '.join(repr(x).replace(chr(39), chr(34)) if ' ' in x else x for x in tokens['typography']['fontFamily']['body'])};",
    ]
    root_vars += [f"  --aoe-{k}-rgb: {channels(v)};" for k, v in col["semantic"].items()]
    root_vars += [f"  --aoe-{k}-on-dark-rgb: {channels(v)};" for k, v in col["semanticOnDark"].items()]
    root_vars += [f"  --aoe-status-{k}-rgb: {channels(v)};" for k, v in col["statusOnDark"].items()]
    for key, p in tokens["players"].items():
        n = key.split("-")[1]
        root_vars += [f"  --aoe-player-{n}-rgb: {channels(p['base'])};", f"  --aoe-player-{n}-on-dark-rgb: {channels(p['onDark'])};"]
    root_vars += [f"  --aoe-motion-{k}: {v};" for k, v in tokens["motion"].items()]
    root_vars.append("}")
    out += root_vars + [""]

    defaults = tokens["defaults"]
    for key, t in tokens["themes"]["screens"].items():
        # :where() keeps the default at zero specificity so an explicit data-theme always wins.
        sel = f':where(:root), [data-theme="{key}"]' if key == defaults["screen"] else f'[data-theme="{key}"]'
        lines = [f"{sel} {{"] + bevel_vars("aoe-", t) + control_vars("aoe-", key, root, up)
        if t.get("backgroundImage"):
            img = t["backgroundImage"]
            small = img.replace(".webp", "-1920.webp")
            has_small = (root / small).is_file()
            lines.append(f'  --aoe-bg-image: url("{up}{small if has_small else img}");')
            lines.append(f'  --aoe-bg-image-large: url("{up}{img}");')
        lines += [f"  {k}: {v};" for k, v in t.get("treatment", {}).items()]
        lines.append("}")
        out += lines
    out.append("")
    for key, t in tokens["themes"]["dialogs"].items():
        sel = f':where(:root), [data-dialog-theme="{key}"]' if key == defaults["dialog"] else f'[data-dialog-theme="{key}"]'
        lines = [f"{sel} {{"] + bevel_vars("dlg-", t) + control_vars("dlg-", key, root, up)
        tex = t.get("texture")
        if tex:
            # curated texture name lives in assets/ui/dialog/<key>-*.png when available
            curated = sorted((root / "assets/ui/dialog").glob(f"{key}-*.png"))
            path = curated[0].relative_to(root).as_posix() if curated else tex
            lines.append(f'  --dlg-texture: url("{up}{path}");')
        lines += [f"  {k}: {v};" for k, v in t.get("treatment", {}).items()]
        lines.append("}")
        out += lines

    out.append("/* ---- Bevel: borders are drawn by the engine from 6 colors (light -> dark). Same rules as the Tailwind plugin. ---- */")
    out += [f".{name} {{ box-shadow: {shadow}; }}" for name, shadow in bevel_rules().items()]
    out.append("/* Tone: which theme family (screen / dialog) bevel and tone-* colors read from. */")
    out.append(tone_rule(":root, .tone-screen", "aoe-"))
    out.append(tone_rule(".tone-dialog", "dlg-"))
    out.append("/* Try-out frame styles (data-frame on <html>), see FRAME_STYLES in build_tokens.py. */")
    for style in FRAME_STYLES:
        sel = f':root[data-frame="{style}"]'
        out.append(f"{sel}, {sel} .tone-screen, {sel} .tone-dialog {{ {frame_vars(style)} }}")
    out.append("""
/* ---- Surface ---- */
/* Screen background on a fixed layer so the --aoe-bg-* treatment (filters, scrim, vignette, framing) never
   touches the content. Treatment defaults = picture unchanged; a theme or the demo tuner may set them. */
.surface-screen-bg { position: relative; isolation: isolate; background: #000; }
.surface-screen-bg::before {
  content: ""; position: fixed; z-index: -2; inset: calc(var(--aoe-bg-blur, 0px) * -2);
  background: var(--aoe-bg-image) var(--aoe-bg-x, 50%) var(--aoe-bg-y, 50%) / cover no-repeat;
  filter: brightness(var(--aoe-bg-brightness, 1)) contrast(var(--aoe-bg-contrast, 1)) saturate(var(--aoe-bg-saturate, 1)) blur(var(--aoe-bg-blur, 0px)); }
.surface-screen-bg::after {
  content: ""; position: fixed; z-index: -1; inset: 0; pointer-events: none;
  background: radial-gradient(ellipse at center, transparent 40%, rgb(0 0 0 / var(--aoe-bg-vignette, 0)) 100%), rgb(0 0 0 / var(--aoe-bg-scrim, 0)); }
@media (min-width: 1921px) { .surface-screen-bg::before { background-image: var(--aoe-bg-image-large); } }
/* Dialog texture darkened by the theme's shade_amount (contrast is measured on this). */
.surface-dialog {
  background-color: var(--dlg-surface);
  /* --dlg-shade-tune: review-only override from the demo tuner. */
  background-image: linear-gradient(rgba(0, 0, 0, var(--dlg-shade-tune, var(--dlg-shade))), rgba(0, 0, 0, var(--dlg-shade-tune, var(--dlg-shade)))), var(--dlg-texture);
  color: var(--dlg-text); text-shadow: 1px 1px 0 var(--dlg-text-shadow); }
/* Dark inset for colored text inside a dialog (semantic / player colors fail on the texture). */
.surface-well { background: rgba(0, 0, 0, .7); }
""")
    out += cursor_rules(root, up)
    out_path.parent.mkdir(parents=True, exist_ok=True)
    out_path.write_text("\n".join(out), encoding="utf-8")


def render_tailwind_preset(tokens: dict[str, Any], out_path: Path) -> None:
    """tokens/tailwind.preset.js: Tailwind 3 preset (colors via CSS variables so data-theme switches them) + bevel plugin."""

    def rgb(var: str) -> str:
        return f"rgb(var(--{var}-rgb) / <alpha-value>)"

    col = tokens["color"]
    colors: dict[str, Any] = {
        "inherit": "inherit", "current": "currentColor", "transparent": "transparent",
        "black": "#000000", "white": "#ffffff",
        # Active tone (screen or dialog, set by .tone-*): what components use by default.
        "tone": {slot: rgb(f"t-{slot}") for slot in TONE_SLOTS},
        "screen": {slot: rgb(f"aoe-{slot}") for slot in TONE_SLOTS},
        "dialog": {slot: rgb(f"dlg-{slot}") for slot in TONE_SLOTS},
        "status": {k: rgb(f"aoe-status-{k}") for k in col["statusOnDark"]},
        "player": {},
        "faction": {k: {"DEFAULT": f["surface"], "light": f["surfaceLight"], "dark": f["surfaceDark"], "on": f["onSurface"]}
                    for k, f in tokens["factions"].items()},
    }
    for k in col["semantic"]:
        colors[k] = {"DEFAULT": rgb(f"aoe-{k}"), "on-dark": rgb(f"aoe-{k}-on-dark"), "on": col["onSemantic"][k]}
    for key in tokens["players"]:
        n = key.split("-")[1]
        colors["player"][n] = {"DEFAULT": rgb(f"aoe-player-{n}"), "on-dark": rgb(f"aoe-player-{n}-on-dark")}

    typo = tokens["typography"]
    theme = {
        "colors": colors,
        "fontFamily": {"heading": typo["fontFamily"]["heading"], "body": typo["fontFamily"]["body"]},
        "fontSize": {k: [f"{v}px", {"lineHeight": "1.4"}] for k, v in typo["scale"].items()},
        "borderRadius": {"none": "0", "DEFAULT": "0", "full": "9999px"},
        "extend": {
            "zIndex": {k: str(v) for k, v in tokens["zIndex"].items()},
            "transitionDuration": {k: v for k, v in tokens["motion"].items() if k != "easing"},
            "transitionTimingFunction": {"step": tokens["motion"]["easing"]},
            # Stepped like the game: the hourglass flips 180deg every 600ms, no smooth rotation.
            "keyframes": {"aoe-flip": {"50%": {"transform": "rotate(180deg)"}}, "aoe-stripes": {"to": {"backgroundPosition": "24px 0"}}},
            "animation": {"flip": "aoe-flip 600ms steps(1, end) infinite", "stripes": "aoe-stripes 600ms linear infinite"},
        },
    }
    utilities = {f".{name}": {"boxShadow": shadow} for name, shadow in bevel_rules().items()}
    utilities.update({
        ".text-shadow-game": {"textShadow": "1px 1px 0 var(--t-text-shadow)"},
        ".text-shadow-none": {"textShadow": "none"},
        # Focus ring of the game: 1px dashed `focus` color drawn inside the 3px bevel.
        ".outline-game": {"outline": "1px dashed var(--t-focus)", "outlineOffset": "-5px"},
        ".outline-game-out": {"outline": "1px dashed var(--t-focus)", "outlineOffset": "2px"},
        ".pixelated": {"imageRendering": "pixelated"},
        ".tabular": {"fontVariantNumeric": "tabular-nums"},
    })
    js = [
        "// Generated by tools/build_tokens.py from tokens/design-tokens.json. Do not edit by hand.",
        "// Needs tokens/aoe-theme.css loaded first: colors are CSS variables so data-theme / data-dialog-theme switch them.",
        'import plugin from "tailwindcss/plugin";',
        "",
        f"const theme = {json.dumps(theme, indent=2, ensure_ascii=False)};",
        "",
        f"const utilities = {json.dumps(utilities, indent=2)};",
        "",
        "/** @type {import('tailwindcss').Config} */",
        "export default {",
        "  theme,",
        "  plugins: [plugin(({ addUtilities }) => addUtilities(utilities))],",
        "};",
        "",
    ]
    out_path.write_text("\n".join(js), encoding="utf-8")


# Game cursor -> CSS fallback keyword. PNG (not .cur) so Safari / WebKit shows them too.
# No "pointer": that frame of the game sheet is the question-mark (help) cursor — the user ruled it out of the
# hub (12/11): never use it unless they ask. Clickable things keep the game arrow, like the game's own menus.
GAME_CURSORS = {"busy": "wait", "action": "pointer", "crosshair": "crosshair"}


def cursor_rules(root: Path, up: str) -> list[str]:
    """Game arrow as the UI default + cursor-game-* classes; data-cursor="system" on <html> turns all of them off."""
    on = ':root:not([data-cursor="system"])'

    def url(name: str, fallback: str) -> str | None:
        png = root / f"assets/ui/cursor/{name}.png"
        if not png.is_file():
            return None
        hx, hy = cursor_hotspot(png.with_suffix(".cur"))
        return f'url("{up}{png.relative_to(root).as_posix()}") {hx} {hy}, {fallback}'

    lines = ["", '/* ---- Cursor: game cursors (PNG + hotspot from the .cur). data-cursor="system" on <html> turns them off. ---- */']
    default = url("default", "auto")
    if default:
        lines.append(f"{on} {{ cursor: {default}; }}")
        # Every element keeps the game arrow, on hover too (user, 12/11): links, buttons, disabled controls and
        # text fields would otherwise get the browser's hand / arrow / I-beam. Only cursor-game-* changes it.
        lines.append(f"{on} *, {on} *::before, {on} *::after {{ cursor: inherit; }}")
        # Windows hides the pointer while typing and Chrome may not bring a CSS image cursor back on the next
        # mouse move. ThemeProvider flips data-cursor-nudge on the first move after a key press: same image,
        # other fallback keyword -> a new computed value, so the browser sets the cursor again.
        nudge = url("default", "default")
        lines.append(f'{on}[data-cursor-nudge="1"] {{ cursor: {nudge}; }}')
    for name, fallback in GAME_CURSORS.items():
        value = url(name, fallback)
        if value:
            lines.append(f".cursor-game-{name} {{ cursor: {fallback}; }}")
            lines.append(f"{on} .cursor-game-{name} {{ cursor: {value}; }}")
    return lines + [""]


def cursor_hotspot(cur_path: Path) -> tuple[int, int]:
    """Hotspot of the first image in a .cur file; (0, 0) when the file is missing."""
    if not cur_path.is_file():
        return 0, 0
    with open(cur_path, "rb") as f:
        head = f.read(14)
    return struct.unpack("<HH", head[10:14])


def main() -> int:
    parser = argparse.ArgumentParser(description="Build design tokens from AoE game data.")
    parser.add_argument("--raw-dir", default="raw")
    parser.add_argument("--assets-dir", default="assets/ui")
    parser.add_argument("--out", default="tokens/design-tokens.json")
    parser.add_argument("--preview", default="demo/tokens/index.html")
    args = parser.parse_args()

    root = Path.cwd()
    builder = TokenBuilder(Path(args.raw_dir), Path(args.assets_dir))
    tokens = builder.build()

    out = Path(args.out)
    out.parent.mkdir(parents=True, exist_ok=True)
    out.write_text(json.dumps(tokens, indent=2, ensure_ascii=False), encoding="utf-8")
    render_preview(tokens, Path(args.preview), root)
    render_theme_css(tokens, Path("tokens/aoe-theme.css"), root)
    render_tailwind_preset(tokens, Path("tokens/tailwind.preset.js"))

    screens = tokens["themes"]["screens"]
    dialogs = tokens["themes"]["dialogs"]
    failing = [k for k, t in {**screens, **dialogs}.items() if not t["contrast"]["passesAA"]]
    print(f"Themes: {len(screens)} screens, {len(dialogs)} dialogs; factions: {len(tokens['factions'])}; players: {len(tokens['players'])}")
    print("Contrast text/surface:", ", ".join(f"{k}={t['contrast']['text']}" for k, t in {**screens, **dialogs}.items()))
    print(f"Below AA 4.5: {', '.join(failing) or 'none'}")
    for w in builder.warnings:
        print(f"[WARN] {w}", file=sys.stderr)
    print(f"Wrote {out}, tokens/aoe-theme.css, tokens/tailwind.preset.js and {args.preview}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
