"""Organize, rename, and export curated game assets to assets/ui/.

Part of Bước 3.1 in PLAN.md:
- Curates assets from raw/ into assets/ui/ with meaningful semantic names.
- Splits button sprites into individual state frames (default / hover / pressed / disabled).
- Generates both .png and native .cur cursor files with accurate hotspots.
- Copies game TTF fonts to assets/ui/font/.
- Exports assets/ui/index.json mapping meaningful names to original DRS IDs.
"""

from __future__ import annotations

import argparse
import json
import os
from pathlib import Path
import re
import shutil
import struct
import sys
from typing import Any

from PIL import Image


# The 5 in-game architecture styles. Frame order of building icons is identical across styles.
ARCH_STYLES: dict[str, dict[str, Any]] = {
    "egyptian": {
        "label": "Egyptian",
        "buildings": 50704,
        "button_bg": 50713,
        "arrow_cancel": 50725,
        "text_buttons": {"sm": 50717, "md": 50747},
        "bars": {1366: (50733, "interfac"), 1600: (50737, "interfac"), 1920: (50741, "interfac"), 2560: (53210, "inter2k")},
    },
    "greek": {
        "label": "Greek",
        "buildings": 50705,
        "button_bg": 50714,
        "arrow_cancel": 50726,
        "text_buttons": {"sm": 50718, "md": 50748},
        "bars": {1366: (50734, "interfac"), 1600: (50738, "interfac"), 1920: (50742, "interfac"), 2560: (53211, "inter2k")},
    },
    "babylonian": {
        "label": "Babylonian",
        "buildings": 50706,
        "button_bg": 50715,
        "arrow_cancel": 50727,
        "text_buttons": {"sm": 50719, "md": 50749},
        "bars": {1366: (50735, "interfac"), 1600: (50739, "interfac"), 1920: (50743, "interfac"), 2560: (53212, "inter2k")},
    },
    "asian": {
        "label": "Asian",
        "buildings": 50707,
        "button_bg": 50716,
        "arrow_cancel": 50728,
        "text_buttons": {"sm": 50720, "md": 50750},
        "bars": {1366: (50736, "interfac"), 1600: (50740, "interfac"), 1920: (50744, "interfac"), 2560: (53213, "inter2k")},
    },
    "roman": {
        "label": "Roman",
        "buildings": 53005,
        "button_bg": 53006,
        "arrow_cancel": 53009,
        "text_buttons": {"sm": 53007, "md": 53008},
        "bars": {1366: (53010, "interfac"), 1600: (53011, "interfac"), 1920: (53012, "interfac"), 2560: (53214, "inter2k")},
    },
}

# Backgrounds: one master per theme (largest source) + one downscaled variant.
BG_DERIVED_WIDTH = 1920
BG_WEBP_QUALITY = 85

# HUD bars are laid out, not scaled (fixed height):
# - topbar: anchor left, crop the plain right side.
# - bottombar: two layers - left part anchored left, the last `rightCap` px (minimap
#   diamond) anchored right on top. Diamond spans x=2332..2530 in every 2560 bar.
HUD_SLICE = {
    "topbar": {"mode": "anchor-left", "height": 20},
    "bottombar": {"mode": "two-layer", "rightCap": 280, "height": 126},
}

# Folders under assets/ui/ that this script fully regenerates.
MANAGED_CATEGORIES = ("bg", "button", "cursor", "dialog", "font", "fx", "hud", "icon", "logo", "minimap")


def make_windows_cur(
    image: Image.Image,
    hotspot_x: int,
    hotspot_y: int,
    out_path: Path,
) -> None:
    """Generate a valid Windows .cur file with 32-bit RGBA bitmap and hotspot."""
    im = image.convert("RGBA")
    w, h = im.size

    # BGRA pixel data (bottom-up scanlines)
    xor_data = bytearray()
    for y in reversed(range(h)):
        for x in range(w):
            r, g, b, a = im.getpixel((x, y))
            xor_data.extend((b, g, r, a))

    # 1-bit AND transparency mask (bottom-up, 32-bit aligned per row)
    row_bytes = (w + 31) // 32 * 4
    and_mask = bytearray()
    for y in reversed(range(h)):
        row = bytearray(row_bytes)
        for x in range(w):
            _, _, _, a = im.getpixel((x, y))
            if a == 0:
                row[x // 8] |= 1 << (7 - (x % 8))
        and_mask.extend(row)

    dib_header = struct.pack(
        "<IIIHHIIIIII",
        40,
        w,
        h * 2,  # biHeight includes both XOR and AND masks
        1,
        32,
        0,
        len(xor_data) + len(and_mask),
        0,
        0,
        0,
        0,
    )
    image_data = dib_header + bytes(xor_data) + bytes(and_mask)

    # CUR Header: Reserved(0), Type(2 for CUR), Count(1)
    header = struct.pack("<HHH", 0, 2, 1)
    # Directory Entry: Width, Height, Colors(0), Reserved(0), HotspotX, HotspotY, BytesInRes, Offset(22)
    entry = struct.pack(
        "<BBBBHHII",
        min(255, w),
        min(255, h),
        0,
        0,
        max(0, hotspot_x),
        max(0, hotspot_y),
        len(image_data),
        22,
    )

    out_path.parent.mkdir(parents=True, exist_ok=True)
    with open(out_path, "wb") as f:
        f.write(header + entry + image_data)


class AssetOrganizer:
    """Manages the curation, naming, and exporting of UI assets."""

    def __init__(self, raw_dir: Path, output_dir: Path, game_data_dir: Path | None = None):
        self.raw_dir = raw_dir
        self.output_dir = output_dir
        self.game_data_dir = game_data_dir
        self.index: dict[str, Any] = {
            "version": "1.0",
            "categories": {},
            "assets": {},
        }
        self.total_exported = 0
        self.errors = 0

    def record_asset(
        self,
        key: str,
        category: str,
        rel_path: str,
        orig_id: int,
        orig_drs: str,
        desc: str,
        extra: dict[str, Any] | None = None,
    ) -> None:
        item: dict[str, Any] = {
            "key": key,
            "category": category,
            "path": rel_path.replace("\\", "/"),
            "original_id": orig_id,
            "original_drs": orig_drs,
            "description": desc,
        }
        if extra:
            item.update(extra)
        self.index["assets"][key] = item
        self.index["categories"].setdefault(category, []).append(key)
        self.total_exported += 1

    def copy_file(self, src: Path, dest: Path) -> bool:
        try:
            dest.parent.mkdir(parents=True, exist_ok=True)
            shutil.copy2(src, dest)
            return True
        except Exception as e:
            self.errors += 1
            print(f"[ERROR] Failed to copy {src} to {dest}: {e}", file=sys.stderr)
            return False

    def export_backgrounds(self) -> None:
        """Curate theme backgrounds across resolutions."""
        bg_mapping = [
            # scr1
            ("scr1-1366", 50100, "interfac", "scr1", "1366x768", "Theme 1 (Main Menu) - HD 768p"),
            ("scr1-1600", 50103, "interfac", "scr1", "1600x900", "Theme 1 (Main Menu) - HD+ 900p"),
            ("scr1-1920", 50105, "interfac", "scr1", "1920x1080", "Theme 1 (Main Menu) - FHD 1080p"),
            ("scr1-2560", 53201, "inter2k", "scr1", "2560x1440", "Theme 1 (Main Menu) - 2K QHD"),
            # scr2
            ("scr2-1366", 50107, "interfac", "scr2", "1366x768", "Theme 2 (Single Player) - HD 768p"),
            ("scr2-1600", 50109, "interfac", "scr2", "1600x900", "Theme 2 (Single Player) - HD+ 900p"),
            ("scr2-1920", 50111, "interfac", "scr2", "1920x1080", "Theme 2 (Single Player) - FHD 1080p"),
            ("scr2-2560", 53202, "inter2k", "scr2", "2560x1440", "Theme 2 (Single Player) - 2K QHD"),
            # scr3
            ("scr3-1366", 50113, "interfac", "scr3", "1366x768", "Theme 3 (Multiplayer / Lobby) - HD 768p"),
            ("scr3-1600", 50115, "interfac", "scr3", "1600x900", "Theme 3 (Multiplayer / Lobby) - HD+ 900p"),
            ("scr3-1920", 50117, "interfac", "scr3", "1920x1080", "Theme 3 (Multiplayer / Lobby) - FHD 1080p"),
            ("scr3-2560", 53203, "inter2k", "scr3", "2560x1440", "Theme 3 (Multiplayer / Lobby) - 2K QHD"),
            # scr4
            ("scr4-1366", 50119, "interfac", "scr4", "1366x768", "Theme 4 (Campaign) - HD 768p"),
            ("scr4-1600", 50121, "interfac", "scr4", "1600x900", "Theme 4 (Campaign) - HD+ 900p"),
            ("scr4-1920", 50123, "interfac", "scr4", "1920x1080", "Theme 4 (Campaign) - FHD 1080p"),
            ("scr4-2560", 53204, "inter2k", "scr4", "2560x1440", "Theme 4 (Campaign) - 2K QHD"),
            # scr5
            ("scr5-800", 50125, "interfac", "scr5", "800x600", "Theme 5 - 800x600"),
            # scr7
            ("scr7-1366", 50131, "interfac", "scr7", "1366x768", "Theme 7 - HD 768p"),
            ("scr7-1600", 50133, "interfac", "scr7", "1600x900", "Theme 7 - HD+ 900p"),
            ("scr7-1920", 50135, "interfac", "scr7", "1920x1080", "Theme 7 - FHD 1080p"),
            ("scr7-2560", 53206, "inter2k", "scr7", "2560x1440", "Theme 7 - 2K QHD"),
            # scr8
            ("scr8-1366", 50137, "interfac", "scr8", "1366x768", "Theme 8 - HD 768p"),
            ("scr8-1600", 50139, "interfac", "scr8", "1600x900", "Theme 8 - HD+ 900p"),
            ("scr8-1920", 50141, "interfac", "scr8", "1920x1080", "Theme 8 - FHD 1080p"),
            ("scr8-2560", 53208, "inter2k", "scr8", "2560x1440", "Theme 8 - 2K QHD"),
            # scr9
            ("scr9-1024", 50143, "interfac", "scr9", "1024x768", "Theme 9 - 1024x768"),
            # scr10
            ("scr10-1366", 50149, "interfac", "scr10", "1366x768", "Theme 10 - HD 768p"),
            ("scr10-1600", 50151, "interfac", "scr10", "1600x900", "Theme 10 - HD+ 900p"),
            ("scr10-1920", 50153, "interfac", "scr10", "1080p", "Theme 10 - FHD 1080p"),
            ("scr10-2560", 53209, "inter2k", "scr10", "2560x1440", "Theme 10 - 2K QHD"),
        ]

        # Keep one master per theme: the largest source. Smaller game resolutions are the
        # same artwork; downscaling the master looks better than upscaling a small one.
        # Other resolutions stay available in raw/.
        masters: dict[str, tuple[int, str, str]] = {}
        for _name, fid, drs, theme, _res, desc in bg_mapping:
            src = self.raw_dir / drs / f"{fid}.png"
            if not src.is_file():
                continue
            with Image.open(src) as im:
                width = im.width
            if theme not in masters or width > masters[theme][0]:
                masters[theme] = (width, f"{drs}/{fid}", desc.split(" - ")[0])

        for theme, (_width, src_rel, desc) in masters.items():
            drs, fid = src_rel.split("/")
            src = self.raw_dir / drs / f"{fid}.png"
            try:
                master = Image.open(src).convert("RGB")
                variants = [(theme, master)]
                if master.width > BG_DERIVED_WIDTH:
                    h = round(master.height * BG_DERIVED_WIDTH / master.width)
                    variants.append((f"{theme}-{BG_DERIVED_WIDTH}", master.resize((BG_DERIVED_WIDTH, h), Image.LANCZOS)))
                for name, img in variants:
                    rel = f"bg/{name}.webp"
                    dest = self.output_dir / rel
                    dest.parent.mkdir(parents=True, exist_ok=True)
                    img.save(dest, format="WEBP", quality=BG_WEBP_QUALITY, method=6)
                    self.record_asset(
                        key=f"bg/{name}",
                        category="background",
                        rel_path=rel,
                        orig_id=int(fid),
                        orig_drs=drs,
                        desc=f"{desc} - {img.width}x{img.height}" + (" (master)" if name == theme else " (downscaled from master)"),
                        extra={"theme": theme, "width": img.width, "height": img.height},
                    )
            except Exception as e:
                self.errors += 1
                print(f"[ERROR] Failed to export background {theme}: {e}", file=sys.stderr)

    def export_dialogs(self) -> None:
        """Curate dialog surface textures (tileable, no border: borders are drawn as bevels)."""
        dialog_mapping = [
            ("dlg3-sand", 50204, "interfac", "Dialog texture dlg3: sand / desert (296x140, tileable)"),
            ("dlg6_0-sandstone", 50210, "interfac", "Dialog texture dlg6_0: sandstone (Egyptian), tileable"),
            ("dlg6_1-marble", 50212, "interfac", "Dialog texture dlg6_1: marble (Greek), tileable"),
            ("dlg6_2-brick", 50214, "interfac", "Dialog texture dlg6_2: brick (Babylonian), tileable"),
            ("dlg6_3-wood", 50216, "interfac", "Dialog texture dlg6_3: wood (Asian), tileable"),
            ("dlg6_4-darkstone", 53003, "interfac", "Dialog texture dlg6_4: dark stone (Roman), tileable"),
        ]
        for name, fid, drs, desc in dialog_mapping:
            src = self.raw_dir / drs / f"{fid}.png"
            if src.is_file():
                dest = self.output_dir / "dialog" / f"{name}.png"
                if self.copy_file(src, dest):
                    self.record_asset(
                        key=f"dialog/{name}",
                        category="dialog",
                        rel_path=f"dialog/{name}.png",
                        orig_id=fid,
                        orig_drs=drs,
                        desc=desc,
                    )

    def export_buttons(self) -> None:
        """Curate theme control sprites (button_file of each screen descriptor).

        These SLPs are not "buttons in 4 sizes x 4 states": frames come in pairs
        (normal, pressed) of small controls - checkbox, close X, scroll arrows, blank
        squares. Frames after 15 are extra glyphs (help '?', speed icons...).
        """
        button_mapping = [
            # sprite id, theme (from the screen/dialog descriptor's button_file)
            (50601, "scr2"),
            (50602, "scr3"),
            (50603, "scr4"),
            (50604, "scr5"),
            (50605, "dlg6_0"),
            (50606, "dlg6_1"),
            (50607, "dlg6_2"),
            (50608, "dlg6_3"),
            (53004, "dlg6_4"),
            (50609, "scr7"),
            (50610, "scr8"),
            (50611, "scr9"),
            (50612, "scr10"),
        ]
        controls = [
            "checkbox-off",
            "checkbox-on",
            "blank",
            "close",
            "arrow-up",
            "arrow-down",
            "blank-alt",
            "arrow-down-alt",
        ]
        states = ["normal", "pressed"]

        for fid, theme in button_mapping:
            src_sheet = self.raw_dir / "interfac" / f"{fid}_sheet.png"
            src_json = self.raw_dir / "interfac" / f"{fid}_sheet.json"
            frames_dir = self.raw_dir / "interfac" / f"{fid}_frames"
            if not (src_sheet.is_file() and src_json.is_file()):
                self.errors += 1
                print(f"[ERROR] Missing control sprite sheet {fid}", file=sys.stderr)
                continue

            self.copy_file(src_sheet, self.output_dir / "button" / f"{theme}-sheet.png")
            self.copy_file(src_json, self.output_dir / "button" / f"{theme}-sheet.json")
            frames = json.loads(src_json.read_text(encoding="utf-8")).get("frames", [])

            for f_num, f_info in enumerate(frames):
                if f_num < len(controls) * 2:
                    control, state = controls[f_num // 2], states[f_num % 2]
                    name = f"{theme}-{control}-{state}"
                    desc = f"{theme} control '{control}' ({state})"
                    extra = {"theme": theme, "control": control, "state": state}
                else:
                    name = f"{theme}-extra-{f_num - len(controls) * 2}"
                    desc = f"{theme} extra glyph (frame {f_num})"
                    extra = {"theme": theme, "control": "extra"}
                frame_src = frames_dir / f"frame_{f_num:03d}.png"
                if frame_src.is_file() and self.copy_file(frame_src, self.output_dir / "button" / f"{name}.png"):
                    self.record_asset(
                        key=f"button/{name}",
                        category="button",
                        rel_path=f"button/{name}.png",
                        orig_id=fid,
                        orig_drs="interfac",
                        desc=desc,
                        extra={**extra, "frame": f_num, "width": f_info["width"], "height": f_info["height"]},
                    )

            self.record_asset(
                key=f"button/{theme}-sheet",
                category="button",
                rel_path=f"button/{theme}-sheet.png",
                orig_id=fid,
                orig_drs="interfac",
                desc=f"Full control sprite sheet for {theme}",
                extra={"theme": theme, "json": f"button/{theme}-sheet.json"},
            )

    def export_cursors(self) -> None:
        """Export cursor images and native Windows .cur files with hotspots."""
        # 1. System cursor collection from 51000
        cur_51000_dir = self.raw_dir / "interfac" / "51000_frames"
        cur_51000_json = self.raw_dir / "interfac" / "51000_sheet.json"
        if cur_51000_dir.is_dir() and cur_51000_json.is_file():
            meta = json.loads(cur_51000_json.read_text(encoding="utf-8"))
            cursor_names = {
                0: ("default", "Default arrow cursor"),
                1: ("busy", "Busy / Hourglass cursor"),
                2: ("resize-diag", "Diagonal resize cursor"),
                3: ("scroll", "Scroll / Pan cursor"),
                4: ("crosshair", "Target / Crosshair cursor"),
                5: ("action", "Action / Attack sword cursor"),
                6: ("pointer", "Pointer / Hand cursor"),
            }
            for f in meta.get("frames", []):
                f_idx = f["frame"]
                if f_idx in cursor_names:
                    cname, cdesc = cursor_names[f_idx]
                    src_png = cur_51000_dir / f"frame_{f_idx:03d}.png"
                    if src_png.is_file():
                        im = Image.open(src_png)
                        dest_png = self.output_dir / "cursor" / f"{cname}.png"
                        dest_cur = self.output_dir / "cursor" / f"{cname}.cur"
                        self.copy_file(src_png, dest_png)
                        make_windows_cur(im, f["hotspot_x"], f["hotspot_y"], dest_cur)
                        self.record_asset(
                            key=f"cursor/{cname}",
                            category="cursor",
                            rel_path=f"cursor/{cname}.png",
                            orig_id=51000,
                            orig_drs="interfac",
                            desc=cdesc,
                            extra={
                                "cur_path": f"cursor/{cname}.cur",
                                "hotspot_x": f["hotspot_x"],
                                "hotspot_y": f["hotspot_y"],
                                "width": f["width"],
                                "height": f["height"],
                            },
                        )

        # 2. Theme-specific cursors (51001..51010)
        theme_cursor_ids = [
            (51001, "scr1"),
            (51002, "scr2"),
            (51003, "scr3"),
            (51004, "scr4"),
            (51005, "scr5"),
            (51007, "scr7"),
            (51008, "scr8"),
            (51009, "scr9"),
            (51010, "scr10"),
        ]
        for fid, theme in theme_cursor_ids:
            src_png = self.raw_dir / "interfac" / f"{fid}.png"
            src_json = self.raw_dir / "interfac" / f"{fid}.json"
            if src_png.is_file() and src_json.is_file():
                meta = json.loads(src_json.read_text(encoding="utf-8"))
                dest_png = self.output_dir / "cursor" / f"theme-{theme}.png"
                dest_cur = self.output_dir / "cursor" / f"theme-{theme}.cur"
                self.copy_file(src_png, dest_png)
                im = Image.open(src_png)
                make_windows_cur(im, meta.get("hotspot_x", 0), meta.get("hotspot_y", 0), dest_cur)
                self.record_asset(
                    key=f"cursor/theme-{theme}",
                    category="cursor",
                    rel_path=f"cursor/theme-{theme}.png",
                    orig_id=fid,
                    orig_drs="interfac",
                    desc=f"Arrow cursor for {theme}",
                    extra={
                        "cur_path": f"cursor/theme-{theme}.cur",
                        "hotspot_x": meta.get("hotspot_x", 0),
                        "hotspot_y": meta.get("hotspot_y", 0),
                    },
                )

    def export_sheet(
        self,
        fid: int,
        drs: str,
        key: str,
        category: str,
        desc: str,
        extra: dict[str, Any] | None = None,
    ) -> None:
        """Copy a multi-frame SLP sprite sheet (+ JSON coords) as <category>/<name>-sheet.png."""
        src_sheet = self.raw_dir / drs / f"{fid}_sheet.png"
        src_json = self.raw_dir / drs / f"{fid}_sheet.json"
        if not (src_sheet.is_file() and src_json.is_file()):
            self.errors += 1
            print(f"[ERROR] Missing sprite sheet for {drs}/{fid}", file=sys.stderr)
            return
        name = key.split("/", 1)[1]
        rel_png = f"{category}/{name}-sheet.png"
        rel_json = f"{category}/{name}-sheet.json"
        if self.copy_file(src_sheet, self.output_dir / rel_png) and self.copy_file(
            src_json, self.output_dir / rel_json
        ):
            self.record_asset(key, category, rel_png, fid, drs, desc, {"json": rel_json, **(extra or {})})

    def export_frame(
        self,
        fid: int,
        drs: str,
        frame: int,
        key: str,
        category: str,
        desc: str,
        extra: dict[str, Any] | None = None,
    ) -> None:
        """Copy a single SLP frame as <key>.png."""
        src = self.raw_dir / drs / f"{fid}_frames" / f"frame_{frame:03d}.png"
        if not src.is_file():
            self.errors += 1
            print(f"[ERROR] Missing frame {frame} of {drs}/{fid}", file=sys.stderr)
            return
        rel = f"{key}.png"
        if self.copy_file(src, self.output_dir / rel):
            self.record_asset(key, category, rel, fid, drs, desc, {"frame": frame, **(extra or {})})

    def export_icons_and_sheets(self) -> None:
        """Curate in-game icon sheets: buildings per style, units, techs, resources, effects."""
        for style, info in ARCH_STYLES.items():
            self.export_sheet(
                info["buildings"],
                "interfac",
                f"icon/{style}-buildings",
                "icon",
                f"Building icons, {info['label']} architecture (50 frames, same frame order across styles)",
                {"style": style},
            )

        self.export_sheet(50730, "interfac", "icon/units", "icon", "Unit icons: villager, infantry, archers, cavalry, siege, ships (61 frames)")
        self.export_sheet(50729, "interfac", "icon/techs", "icon", "Technology / research icons (101 frames)")
        self.export_sheet(50732, "interfac", "icon/resources", "icon", "Resource icons, large: wood, stone, food, gold (4 frames)")
        self.export_sheet(50731, "interfac", "icon/stats-small", "icon", "Small top-bar icons: wood, stone, food, gold, population + unit stat icons (11 frames)")
        self.export_sheet(50403, "interfac", "icon/digits", "icon", "White group digits 1-9, 0, 10-19 (20 frames)")

        for frame, rname in enumerate(("wood", "stone", "food", "gold")):
            self.export_frame(50732, "interfac", frame, f"icon/res-{rname}", "icon", f"Resource icon: {rname.capitalize()}")

        # Small in-game effect animations
        self.export_sheet(50404, "interfac", "fx/rally-flag", "fx", "White waving flag animation (7 frames, no player color)")
        self.export_sheet(50405, "interfac", "fx/move-marker", "fx", "Red X move-order marker animation (8 frames)")

    def export_hud_bars(self) -> None:
        """Curate in-game HUD for all 5 architecture styles."""
        for style, info in ARCH_STYLES.items():
            # Bars only differ in length (height is fixed), so keep the widest one and
            # lay it out with slice metadata instead of scaling.
            res = max(info["bars"])
            fid, drs = info["bars"][res]
            for frame, part in ((0, "topbar"), (1, "bottombar")):
                self.export_frame(
                    fid,
                    drs,
                    frame,
                    f"hud/{style}-{part}",
                    "hud",
                    f"{part.capitalize()} {res}px, {info['label']} style",
                    {"style": style, "width": res, "slice": HUD_SLICE[part]},
                )
            self.export_sheet(
                info["button_bg"], "interfac", f"hud/{style}-button-bg", "hud",
                f"Empty square HUD button background, {info['label']} style (4 states)", {"style": style},
            )
            self.export_sheet(
                info["arrow_cancel"], "interfac", f"hud/{style}-arrow-cancel", "hud",
                f"Arrow (next/confirm) and X (cancel) buttons, 2 states each, {info['label']} style", {"style": style},
            )
            for size, fid in info["text_buttons"].items():
                self.export_sheet(
                    fid, "interfac", f"hud/{style}-text-button-{size}", "hud",
                    f"Small in-game text button ({size}), {info['label']} style (2 states)", {"style": style},
                )

        self.export_sheet(50745, "interfac", "hud/health-bar", "hud", "Health / progress bar segments (26 frames)")

        rp_src = self.raw_dir / "interfac" / "50746.png"
        if rp_src.is_file() and self.copy_file(rp_src, self.output_dir / "hud" / "pennant.png"):
            self.record_asset("hud/pennant", "hud", "hud/pennant.png", 50746, "interfac", "Pennant / banner ribbon (126x33)")

    def export_minimap(self) -> None:
        """Curate minimap diamond backgrounds (8-bit BMP with embedded palette)."""
        for name, fid, desc in (
            ("minimap-bg-sm", 50401, "Minimap diamond background, small (220x114)"),
            ("minimap-bg-lg", 50402, "Minimap diamond background, large (275x137)"),
        ):
            src = self.raw_dir / "interfac" / f"{fid}.bmp"
            if not src.is_file():
                continue
            try:
                im = Image.open(src)
                dest_png = self.output_dir / "minimap" / f"{name}.png"
                dest_png.parent.mkdir(parents=True, exist_ok=True)
                im.save(dest_png, format="PNG")
                self.record_asset(
                    f"minimap/{name}", "minimap", f"minimap/{name}.png", fid, "interfac", desc,
                    {"width": im.width, "height": im.height},
                )
            except Exception as e:
                self.errors += 1
                print(f"[ERROR] Failed to convert minimap {src}: {e}", file=sys.stderr)

    def export_fonts(self) -> None:
        """Copy game TrueType fonts into assets/ui/font/."""
        if not self.game_data_dir or not self.game_data_dir.is_dir():
            print("Note: Game data directory not specified, skipping font copy.")
            return

        font_files = [
            ("coprgtl.ttf", "Copperplate Gothic Light (English headings)"),
            ("vncoprgt.ttf", "Copperplate Gothic VN (Vietnamese headings)"),
            ("vnarial.ttf", "Arial Regular VN (Vietnamese body)"),
            ("vnarialb.ttf", "Arial Bold VN (Vietnamese body bold)"),
        ]

        for fname, desc in font_files:
            src = self.game_data_dir / fname
            if src.is_file():
                dest = self.output_dir / "font" / fname
                if self.copy_file(src, dest):
                    self.record_asset(
                        key=f"font/{Path(fname).stem}",
                        category="font",
                        rel_path=f"font/{fname}",
                        orig_id=0,
                        orig_drs="game/data",
                        desc=desc,
                    )

    def export_web_fonts(self) -> None:
        """Copy Vietnamese-capable web fonts (fetched by fetch_web_fonts.py) into font/web/."""
        vendor = Path("vendor/fonts")
        if not vendor.is_dir():
            print("Note: vendor/fonts/ missing, run tools/fetch_web_fonts.py first.")
            return
        for src in sorted(vendor.iterdir()):
            if src.suffix not in (".ttf", ".txt"):
                continue
            rel = f"font/web/{src.name}"
            if self.copy_file(src, self.output_dir / rel) and src.suffix == ".ttf":
                family, weight = src.stem.rsplit("-", 1)
                self.record_asset(
                    key=f"font/web/{src.stem}",
                    category="font",
                    rel_path=rel,
                    orig_id=0,
                    orig_drs="vendor/fonts",
                    desc=f"{family} {weight} (OFL, Vietnamese-capable replacement for game fonts)",
                    extra={"weight": int(weight), "license": f"font/web/{family}-OFL.txt"},
                )

    def write_index(self) -> Path:
        """Write assets/ui/index.json."""
        index_path = self.output_dir / "index.json"
        self.output_dir.mkdir(parents=True, exist_ok=True)
        index_path.write_text(json.dumps(self.index, indent=2, ensure_ascii=False), encoding="utf-8")
        return index_path

    def run_all(self) -> Path:
        print(f"Organizing assets from '{self.raw_dir}' into '{self.output_dir}'...")
        # Output is fully generated: clear category folders so renamed assets leave no stale files.
        for category in MANAGED_CATEGORIES:
            shutil.rmtree(self.output_dir / category, ignore_errors=True)
        self.export_backgrounds()
        self.export_dialogs()
        self.export_buttons()
        self.export_cursors()
        self.export_icons_and_sheets()
        self.export_hud_bars()
        self.export_minimap()
        self.export_fonts()
        self.export_web_fonts()
        index_path = self.write_index()
        print(
            f"Done: {self.total_exported} assets curated across "
            f"{len(self.index['categories'])} categories (errors={self.errors})."
        )
        print(f"Asset index written to: {index_path.resolve()}")
        return index_path


def resolve_game_data_dir(explicit_dir: str | None) -> Path | None:
    if explicit_dir:
        cand = Path(explicit_dir)
        return cand / "data" if (cand / "data").is_dir() else cand
    if env_dir := os.environ.get("AOE_GAME_DIR"):
        cand = Path(env_dir)
        return cand / "data" if (cand / "data").is_dir() else cand
    for lnk_name in ["game.lnk", "../game.lnk"]:
        lnk_p = Path(lnk_name)
        if lnk_p.is_file():
            try:
                content = lnk_p.read_bytes()
                matches = re.findall(rb"[a-zA-Z]:\\[^\x00\r\n\t]+", content)
                for m in matches:
                    cand_str = m.decode("utf-8", errors="ignore").split("\x00")[0].strip()
                    cand_path = Path(cand_str)
                    if cand_path.exists():
                        return cand_path / "data" if (cand_path / "data").is_dir() else cand_path
            except Exception:
                pass
    return None


def main() -> int:
    parser = argparse.ArgumentParser(description="Curate game assets into assets/ui/.")
    parser.add_argument("--raw-dir", "-r", default="raw", help="Path to raw/ directory.")
    parser.add_argument("--output-dir", "-o", default="assets/ui", help="Path to assets/ui/ directory.")
    parser.add_argument("--game-dir", "-g", default=None, help="Path to AoE game directory for fonts.")

    args = parser.parse_args()

    raw_dir = Path(args.raw_dir)
    output_dir = Path(args.output_dir)
    game_data_dir = resolve_game_data_dir(args.game_dir)

    organizer = AssetOrganizer(raw_dir=raw_dir, output_dir=output_dir, game_data_dir=game_data_dir)
    organizer.run_all()

    return 1 if organizer.errors > 0 else 0


if __name__ == "__main__":
    sys.exit(main())
