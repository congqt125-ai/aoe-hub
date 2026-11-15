"""Decode Age of Empires 1 SLP sprite files to PNG images.

Part of Bước 2 in PLAN.md:
- Full SLP v2.0N decoder: RLE compression commands, transparency, player colors, shadows.
- Automatically selects the correct palette per screen description file (default pal1 50501).
- Multi-frame SLPs -> individual frames + packed sprite sheet with JSON coordinates.
- Validates decoded output.
"""

from __future__ import annotations

import argparse
import json
import math
import os
from pathlib import Path
import re
import struct
import sys
import time
from typing import Any

from PIL import Image

DEFAULT_PALETTE_ID = 50501
# SLPs not referenced by any screen descriptor are in-game graphics (HUD bars,
# icons, flags, group digits...) and are drawn with the main game palette.
GAME_PALETTE_ID = 50500
# Unreferenced SLPs that belong to menu screens instead (verified visually).
UNREFERENCED_PALETTE_OVERRIDES = {
    52001: 50501,
    52002: 50501,
}
DEFAULT_PLAYER = 1


def load_jasc_palette(pal_path: Path) -> tuple[list[int], list[tuple[int, int, int]]]:
    """Parse a JASC-PAL file into raw 768-byte list and RGB tuple list.

    Returns:
        (raw_768_flat_list, list_of_256_rgb_tuples)
    """
    text = pal_path.read_text(encoding="ascii", errors="ignore")
    lines = [line.strip() for line in text.splitlines() if line.strip()]
    if not lines or lines[0] != "JASC-PAL":
        raise ValueError(f"Invalid JASC-PAL file header: {pal_path}")

    num_colors = int(lines[2])
    raw_flat: list[int] = []
    rgb_tuples: list[tuple[int, int, int]] = []

    for line in lines[3 : 3 + num_colors]:
        parts = line.split()
        r, g, b = int(parts[0]), int(parts[1]), int(parts[2])
        raw_flat.extend((r, g, b))
        rgb_tuples.append((r, g, b))

    # Pad to 256 colors (768 ints) if fewer
    while len(rgb_tuples) < 256:
        raw_flat.extend((0, 0, 0))
        rgb_tuples.append((0, 0, 0))

    return raw_flat[:768], rgb_tuples[:256]


def load_all_palettes(raw_dir: Path) -> dict[int, tuple[list[int], list[tuple[int, int, int]]]]:
    """Find and load all .pal files in raw directory."""
    palettes: dict[int, tuple[list[int], list[tuple[int, int, int]]]] = {}
    for pal_file in raw_dir.glob("*/*.pal"):
        try:
            pal_id = int(pal_file.stem)
            palettes[pal_id] = load_jasc_palette(pal_file)
        except (ValueError, Exception):
            pass
    return palettes


def load_player_remap_table(raw_dir: Path, player: int = 1) -> list[int]:
    """Palette indices for player color values 0..15 of player 1..8.

    In palette 50500, player N owns the 10-shade ramp starting at index 16 * N
    (1 blue, 2 red, 3 yellow, 4 brown, 5 orange, 6 green, 7 grey, 8 cyan).
    `raw_dir` is unused; kept for call-site compatibility.
    """
    base = 16 * max(1, min(8, player))
    return [base + min(val, 9) for val in range(16)]


def build_slp_palette_map(raw_dir: Path) -> dict[int, int]:
    """Parse screen description text files to associate each SLP ID with its palette ID."""
    mapping: dict[int, int] = {}

    # 1. Base mappings: in-game gameplay & HUD assets always use 50500 (in-game palette)
    # All 507xx assets (action icons, units 50729, techs 50730, HUD bars 50733..50744, progress bar 50745)
    for fid in range(50700, 50800):
        mapping[fid] = 50500
    # In-game resource icons (meat/wood/stone/gold), digits, civ flags
    for fid in range(50403, 50407):
        mapping[fid] = 50500
    # In-game multi-state cursors (attack sword, hand, target, hourglass)
    mapping[51000] = 50500
    # In-game extended HUD bars and icons
    for fid in range(53004, 53013):
        mapping[fid] = 50500
    for fid in range(53210, 53215):
        mapping[fid] = 50500

    # 2K Menu backgrounds mapped to corresponding menu theme palette
    mapping[53201] = 50501  # scr1
    mapping[53202] = 50502  # scr2
    mapping[53203] = 50503  # scr3
    mapping[53204] = 50504  # scr4
    mapping[53206] = 50505  # scr7
    mapping[53208] = 50506  # scr8
    mapping[53209] = 50508  # scr10

    # 2. Parse screen descriptors (500xx.txt and 53000.txt)
    for txt_path in raw_dir.glob("*/*.txt"):
        stem = txt_path.stem
        # Check if this is a screen descriptor (500xx or 53000)
        if not (stem.startswith("500") or stem == "53000"):
            continue

        try:
            content = txt_path.read_text(encoding="ascii", errors="ignore")
        except Exception:
            continue

        pal_match = re.search(r"palette_file\s+\w+\s+(\d+)", content)
        palette_id = int(pal_match.group(1)) if pal_match else DEFAULT_PALETTE_ID

        # Find all referenced asset IDs in the screen description
        for line in content.splitlines():
            parts = line.strip().split()
            if not parts:
                continue
            for token in parts[1:]:
                if token.isdigit():
                    asset_id = int(token)
                    if asset_id >= 50000 and asset_id != palette_id:
                        # Prioritize screen descriptor declaration
                        mapping[asset_id] = palette_id
        # Also map screen descriptor ID itself
        if stem.isdigit():
            mapping[int(stem)] = palette_id

    return mapping


class SlpFrame:
    """Decoded SLP frame with dimensions, hotspot, and Pillow Image."""

    def __init__(
        self,
        frame_idx: int,
        width: int,
        height: int,
        hotspot_x: int,
        hotspot_y: int,
        image: Image.Image,
    ):
        self.frame_idx = frame_idx
        self.width = width
        self.height = height
        self.hotspot_x = hotspot_x
        self.hotspot_y = hotspot_y
        self.image = image


class SlpDecoder:
    """Decodes Genie Engine SLP v2.0N binary data into RGBA Pillow Images."""

    def __init__(
        self,
        palettes: dict[int, tuple[list[int], list[tuple[int, int, int]]]],
        slp_palette_map: dict[int, int],
        player_table: list[int],
    ):
        self.palettes = palettes
        self.slp_palette_map = slp_palette_map
        self.player_table = player_table

    def get_palette_for_slp(self, slp_id: int, override_pal_id: int | None = None) -> tuple[list[int], int]:
        pal_id = (
            override_pal_id
            or self.slp_palette_map.get(slp_id)
            or UNREFERENCED_PALETTE_OVERRIDES.get(slp_id, GAME_PALETTE_ID)
        )
        if pal_id in self.palettes:
            return self.palettes[pal_id][0], pal_id
        if DEFAULT_PALETTE_ID in self.palettes:
            return self.palettes[DEFAULT_PALETTE_ID][0], DEFAULT_PALETTE_ID
        # Last resort fallback: grayscale palette
        gray = []
        for i in range(256):
            gray.extend((i, i, i))
        return gray, 0

    def decode_slp(
        self,
        slp_path: Path,
        override_palette_id: int | None = None,
    ) -> tuple[list[SlpFrame], int]:
        """Decode all frames in an SLP file.

        Returns:
            (list of SlpFrame, palette_id_used)
        """
        data = slp_path.read_bytes()
        if len(data) < 32:
            raise ValueError(f"SLP file too small: {len(data)} bytes")

        ver = data[:4]
        if ver != b"2.0N":
            raise ValueError(f"Unsupported SLP version: {ver!r} (expected 2.0N)")

        num_frames = struct.unpack("<I", data[4:8])[0]
        slp_id = int(slp_path.stem) if slp_path.stem.isdigit() else 0
        raw_pal, pal_used = self.get_palette_for_slp(slp_id, override_palette_id)

        frames: list[SlpFrame] = []

        for frame_idx in range(num_frames):
            header_offset = 32 + frame_idx * 32
            if header_offset + 32 > len(data):
                raise ValueError(f"Unexpected EOF reading header of frame {frame_idx}")

            f_hdr = data[header_offset : header_offset + 32]
            cmd_off, out_off, pal_off, props, w, h, hx, hy = struct.unpack("<IIIIiiii", f_hdr)

            if w <= 0 or h <= 0:
                # 1x1 empty placeholder
                empty_img = Image.new("RGBA", (1, 1), (0, 0, 0, 0))
                frames.append(SlpFrame(frame_idx, max(1, w), max(1, h), hx, hy, empty_img))
                continue

            pixels = bytearray(w * h)
            alpha = bytearray(w * h)

            outlines = [
                struct.unpack("<HH", data[out_off + y * 4 : out_off + y * 4 + 4])
                for y in range(h)
            ]
            cmd_offsets = [
                struct.unpack("<I", data[cmd_off + y * 4 : cmd_off + y * 4 + 4])[0]
                for y in range(h)
            ]

            data_len = len(data)
            for y in range(h):
                left, right = outlines[y]
                if left == 0x8000:
                    continue  # completely transparent row

                x = left
                pos = cmd_offsets[y]
                row_start = y * w

                while pos < data_len:
                    cmd = data[pos]
                    pos += 1
                    low = cmd & 0x0F
                    low2 = cmd & 0x03

                    if low == 0x0F:  # End of Scanline
                        break

                    if low2 == 0x00:  # Color List
                        cnt = cmd >> 2
                        if cnt == 0:
                            cnt = data[pos]
                            pos += 1
                        idx = row_start + x
                        pixels[idx : idx + cnt] = data[pos : pos + cnt]
                        alpha[idx : idx + cnt] = b"\xff" * cnt
                        pos += cnt
                        x += cnt

                    elif low2 == 0x01:  # Skip (Transparent)
                        cnt = cmd >> 2
                        if cnt == 0:
                            cnt = data[pos]
                            pos += 1
                        x += cnt

                    elif low == 0x02:  # Extended Color List
                        cnt = ((cmd & 0xF0) << 4) | data[pos]
                        pos += 1
                        idx = row_start + x
                        pixels[idx : idx + cnt] = data[pos : pos + cnt]
                        alpha[idx : idx + cnt] = b"\xff" * cnt
                        pos += cnt
                        x += cnt

                    elif low == 0x03:  # Extended Skip
                        cnt = ((cmd & 0xF0) << 4) | data[pos]
                        pos += 1
                        x += cnt

                    elif low == 0x06:  # Player Color List
                        cnt = cmd >> 4
                        if cnt == 0:
                            cnt = data[pos]
                            pos += 1
                        idx = row_start + x
                        for i in range(cnt):
                            val = data[pos + i]
                            # remap player color
                            remap_idx = self.player_table[val & 0x0F]
                            pixels[idx + i] = remap_idx
                        alpha[idx : idx + cnt] = b"\xff" * cnt
                        pos += cnt
                        x += cnt

                    elif low == 0x07:  # Color Fill
                        cnt = cmd >> 4
                        if cnt == 0:
                            cnt = data[pos]
                            pos += 1
                        col_idx = data[pos]
                        pos += 1
                        idx = row_start + x
                        pixels[idx : idx + cnt] = bytes([col_idx]) * cnt
                        alpha[idx : idx + cnt] = b"\xff" * cnt
                        x += cnt

                    elif low == 0x0A:  # Player Color Fill
                        cnt = cmd >> 4
                        if cnt == 0:
                            cnt = data[pos]
                            pos += 1
                        val = data[pos]
                        pos += 1
                        remap_idx = self.player_table[val & 0x0F]
                        idx = row_start + x
                        pixels[idx : idx + cnt] = bytes([remap_idx]) * cnt
                        alpha[idx : idx + cnt] = b"\xff" * cnt
                        x += cnt

                    elif low == 0x0B:  # Shadow / Translucent Fill (50% black)
                        cnt = cmd >> 4
                        if cnt == 0:
                            cnt = data[pos]
                            pos += 1
                        idx = row_start + x
                        pixels[idx : idx + cnt] = b"\x00" * cnt
                        alpha[idx : idx + cnt] = b"\x80" * cnt
                        x += cnt

                    else:
                        # Unknown opcode - skip
                        pass

            # Convert indexed buffer with raw palette to Pillow RGBA
            img_p = Image.frombytes("P", (w, h), bytes(pixels))
            img_p.putpalette(raw_pal)
            rgba_img = img_p.convert("RGBA")
            mask = Image.frombytes("L", (w, h), bytes(alpha))
            rgba_img.putalpha(mask)

            frames.append(SlpFrame(frame_idx, w, h, hx, hy, rgba_img))

        return frames, pal_used


def pack_sprite_sheet(
    frames: list[SlpFrame],
    max_sheet_width: int = 2048,
    padding: int = 2,
) -> tuple[Image.Image, list[dict[str, int]]]:
    """Pack multiple frames into a single sprite sheet image.

    Returns:
        (sheet_image, list_of_frame_meta_dicts)
    """
    placed_meta: list[dict[str, int]] = []
    x = 0
    y = 0
    row_height = 0
    sheet_width = 0

    for f in frames:
        if x + f.width > max_sheet_width and x > 0:
            x = 0
            y += row_height + padding
            row_height = 0

        placed_meta.append(
            {
                "frame": f.frame_idx,
                "x": x,
                "y": y,
                "width": f.width,
                "height": f.height,
                "hotspot_x": f.hotspot_x,
                "hotspot_y": f.hotspot_y,
            }
        )
        x += f.width + padding
        row_height = max(row_height, f.height)
        sheet_width = max(sheet_width, x)

    sheet_height = y + row_height
    sheet_width = max(1, sheet_width)
    sheet_height = max(1, sheet_height)

    sheet_img = Image.new("RGBA", (sheet_width, sheet_height), (0, 0, 0, 0))
    for f, meta in zip(frames, placed_meta):
        sheet_img.paste(f.image, (meta["x"], meta["y"]))

    return sheet_img, placed_meta


def export_slp_file(
    slp_path: Path,
    output_dir: Path,
    decoder: SlpDecoder,
    override_palette: int | None = None,
    verbose: bool = True,
) -> dict[str, Any]:
    """Decode and save PNG image(s) and metadata for an SLP file."""
    drs_name = slp_path.parent.name
    slp_stem = slp_path.stem
    slp_id = int(slp_stem) if slp_stem.isdigit() else 0
    dest_dir = output_dir / drs_name
    dest_dir.mkdir(parents=True, exist_ok=True)

    frames, pal_used = decoder.decode_slp(slp_path, override_palette)
    num_frames = len(frames)

    result_meta: dict[str, Any] = {
        "id": slp_id,
        "drs": drs_name,
        "num_frames": num_frames,
        "palette_id": pal_used,
    }

    if num_frames == 1:
        f = frames[0]
        png_path = dest_dir / f"{slp_stem}.png"
        f.image.save(png_path, format="PNG")
        json_path = dest_dir / f"{slp_stem}.json"
        meta = {
            "id": slp_id,
            "drs": drs_name,
            "palette_id": pal_used,
            "width": f.width,
            "height": f.height,
            "hotspot_x": f.hotspot_x,
            "hotspot_y": f.hotspot_y,
            "png": f"{drs_name}/{slp_stem}.png",
        }
        json_path.write_text(json.dumps(meta, indent=2), encoding="utf-8")
        result_meta.update(meta)
        if verbose:
            print(f"  {drs_name}/{slp_stem}.slp -> {slp_stem}.png ({f.width}x{f.height}, pal={pal_used})")

    else:
        # Multi-frame SLP: export individual frames
        frames_dir = dest_dir / f"{slp_stem}_frames"
        frames_dir.mkdir(parents=True, exist_ok=True)
        for f in frames:
            f_path = frames_dir / f"frame_{f.frame_idx:03d}.png"
            f.image.save(f_path, format="PNG")

        # Pack sprite sheet
        sheet_img, frame_coords = pack_sprite_sheet(frames)
        sheet_path = dest_dir / f"{slp_stem}_sheet.png"
        sheet_img.save(sheet_path, format="PNG")

        sheet_json_path = dest_dir / f"{slp_stem}_sheet.json"
        sheet_meta = {
            "id": slp_id,
            "drs": drs_name,
            "num_frames": num_frames,
            "palette_id": pal_used,
            "sheet_width": sheet_img.width,
            "sheet_height": sheet_img.height,
            "sheet_png": f"{drs_name}/{slp_stem}_sheet.png",
            "frames_dir": f"{drs_name}/{slp_stem}_frames",
            "frames": frame_coords,
        }
        sheet_json_path.write_text(json.dumps(sheet_meta, indent=2), encoding="utf-8")
        result_meta.update(sheet_meta)
        if verbose:
            print(
                f"  {drs_name}/{slp_stem}.slp -> {num_frames} frames + sheet "
                f"({sheet_img.width}x{sheet_img.height}, pal={pal_used})"
            )

    return result_meta


def main() -> int:
    parser = argparse.ArgumentParser(
        description="Decode Age of Empires 1 SLP files to PNG images."
    )
    parser.add_argument(
        "--raw-dir",
        "-r",
        default="raw",
        help="Directory containing extracted raw DRS data (default: 'raw').",
    )
    parser.add_argument(
        "--output-dir",
        "-o",
        default="raw",
        help="Target directory for PNG output (default: 'raw').",
    )
    parser.add_argument(
        "--slp",
        nargs="*",
        default=None,
        help="Specific SLP file(s) or ID(s) to decode (e.g. 50100 or raw/interfac/50100.slp).",
    )
    parser.add_argument(
        "--palette",
        "-p",
        type=int,
        default=None,
        help="Force specific palette ID (e.g. 50501). Default: auto-detected per screen descriptor.",
    )
    parser.add_argument(
        "--player",
        type=int,
        default=DEFAULT_PLAYER,
        help=f"Player color index (1..8, default {DEFAULT_PLAYER}).",
    )
    parser.add_argument(
        "--quiet",
        "-q",
        action="store_true",
        help="Suppress per-file log output.",
    )

    args = parser.parse_args()

    raw_dir = Path(args.raw_dir)
    output_dir = Path(args.output_dir)

    if not raw_dir.is_dir():
        print(f"Error: raw directory does not exist: {raw_dir}", file=sys.stderr)
        return 1

    t0 = time.time()
    palettes = load_all_palettes(raw_dir)
    if not palettes:
        print(f"Error: No .pal palette files found in {raw_dir}", file=sys.stderr)
        return 1

    slp_palette_map = build_slp_palette_map(raw_dir)
    player_table = load_player_remap_table(raw_dir, args.player)

    decoder = SlpDecoder(
        palettes=palettes,
        slp_palette_map=slp_palette_map,
        player_table=player_table,
    )

    # Resolve target files
    if args.slp:
        slp_files: list[Path] = []
        for item in args.slp:
            p = Path(item)
            if p.is_file():
                slp_files.append(p)
            else:
                matches = list(raw_dir.glob(f"*/{item}.slp")) or list(raw_dir.glob(f"*/{item}"))
                if matches:
                    slp_files.extend(matches)
                else:
                    print(f"Warning: SLP file not found: {item}", file=sys.stderr)
    else:
        slp_files = sorted(raw_dir.glob("*/*.slp"))

    if not slp_files:
        print("No SLP files found to decode.", file=sys.stderr)
        return 1

    if not args.quiet:
        print(f"Starting SLP to PNG decoding ({len(slp_files)} SLP files, {len(palettes)} palettes loaded)...")

    decoded_manifest: list[dict[str, Any]] = []
    errors = 0
    total_frames_exported = 0

    for slp_path in slp_files:
        try:
            meta = export_slp_file(
                slp_path=slp_path,
                output_dir=output_dir,
                decoder=decoder,
                override_palette=args.palette,
                verbose=not args.quiet,
            )
            decoded_manifest.append(meta)
            total_frames_exported += meta["num_frames"]
        except Exception as e:
            errors += 1
            print(f"[ERROR] Failed to decode {slp_path}: {e}", file=sys.stderr)

    # Save slp manifest
    slp_manifest_path = output_dir / "slp_manifest.json"
    slp_manifest_path.write_text(json.dumps(decoded_manifest, indent=2), encoding="utf-8")

    dt = time.time() - t0
    print("\n" + "=" * 60)
    print("SLP TO PNG DECODING SUMMARY")
    print("=" * 60)
    print(f"Total SLP files processed: {len(slp_files)}")
    print(f"Total frames exported:    {total_frames_exported}")
    print(f"Total errors:             {errors}")
    print(f"Elapsed time:             {dt:.2f} seconds")
    print(f"SLP manifest written to:  {slp_manifest_path.resolve()}")
    print("=" * 60)

    return 1 if errors > 0 else 0


if __name__ == "__main__":
    sys.exit(main())

