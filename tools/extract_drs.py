"""Extract assets from Age of Empires 1 (.drs) archives.

Part of Bước 1 in PLAN.md:
- Reads DRS header -> table records -> file index (id, offset, size).
- Extracts raw assets to raw/<drs>/<id>.<ext>.
- Generates raw/manifest.json.
- READ-ONLY access to game files.
"""

from __future__ import annotations

import argparse
import json
import os
from pathlib import Path
import re
import struct
import sys
from typing import Any

DEFAULT_DRS_NAMES = [
    "interfac.drs",
    "inter1.drs",
    "inter2.drs",
    "inter2k.drs",
]


def resolve_from_shortcut(lnk_path: Path) -> Path | None:
    """Extract target directory from a Windows .lnk shortcut."""
    if not lnk_path.is_file():
        return None
    try:
        with open(lnk_path, "rb") as f:
            content = f.read()
        matches = re.findall(rb"[a-zA-Z]:\\[^\x00\r\n\t]+", content)
        for m in matches:
            cand_str = m.decode("utf-8", errors="ignore").split("\x00")[0].strip()
            cand_path = Path(cand_str)
            if cand_path.exists():
                return cand_path
    except Exception:
        pass
    return None


def resolve_game_data_dir(explicit_dir: str | None) -> Path:
    """Resolve directory containing game .drs archives.

    Priority:
    1. CLI argument `--game-dir` / `-g`
    2. Environment variable `AOE_GAME_DIR`
    3. Shortcut `game.lnk` in current workspace / directory
    """
    candidate: Path | None = None

    if explicit_dir:
        candidate = Path(explicit_dir)
        if not candidate.exists():
            raise FileNotFoundError(f"Specified game directory does not exist: {candidate}")
    elif env_dir := os.environ.get("AOE_GAME_DIR"):
        candidate = Path(env_dir)
        if not candidate.exists():
            raise FileNotFoundError(f"AOE_GAME_DIR environment path does not exist: {candidate}")
    else:
        # Check game.lnk in workspace
        for lnk_name in ["game.lnk", "../game.lnk"]:
            lnk_path = Path(lnk_name)
            if lnk_path.exists():
                candidate = resolve_from_shortcut(lnk_path)
                if candidate:
                    break

    if not candidate:
        raise ValueError(
            "Game directory not found. Please provide --game-dir <path> "
            "or set the AOE_GAME_DIR environment variable."
        )

    # Check if this directory has data subdirectory containing .drs
    if (candidate / "data").is_dir():
        return candidate / "data"
    return candidate


def detect_file_type_and_ext(
    table_ext: str,
    file_id: int,
    data: bytes,
    force_table_ext: bool = False,
) -> tuple[str, str]:
    """Determine semantic file type and file extension.

    Returns:
        (semantic_type, file_extension)
    """
    clean_table = table_ext.lower().strip()

    if force_table_ext:
        return (clean_table, clean_table)

    if clean_table == "slp":
        return ("slp", "slp")

    if clean_table == "shp":
        return ("shp", "shp")

    if clean_table == "bina":
        if data.startswith(b"JASC-PAL"):
            return ("palette", "pal")
        if data.startswith(b"BM"):
            return ("bmp", "bmp")
        if data.startswith(b"background1_") or file_id == 53000:
            return ("screen_desc", "txt")
        if 50900 <= file_id <= 50911:
            return ("color_table", "txt")
        if file_id == 50800:
            return ("binary", "bin")

        # Fallback heuristic for text vs binary
        try:
            data[:512].decode("ascii")
            return ("text", "txt")
        except UnicodeDecodeError:
            return ("binary", "bin")

    if clean_table == "wav":
        return ("wav", "wav")

    return (clean_table, clean_table)


class DrsExtractor:
    """Parses DRS container files and extracts resources cleanly."""

    def __init__(
        self,
        output_dir: Path,
        force_table_ext: bool = False,
        dry_run: bool = False,
        verbose: bool = True,
    ):
        self.output_dir = output_dir
        self.force_table_ext = force_table_ext
        self.dry_run = dry_run
        self.verbose = verbose
        self.manifest_entries: list[dict[str, Any]] = []
        self.stats: list[dict[str, Any]] = []
        self.total_errors = 0

    def log(self, message: str) -> None:
        if self.verbose:
            print(message)

    def extract_archive(self, drs_path: Path) -> int:
        """Extract all resources from a single DRS file.

        Returns:
            Number of extracted files in this archive.
        """
        archive_name = drs_path.name
        archive_stem = drs_path.stem.lower()
        drs_dest_dir = self.output_dir / archive_stem

        if not self.dry_run:
            drs_dest_dir.mkdir(parents=True, exist_ok=True)

        self.log(f"Reading DRS archive: {archive_name}")

        try:
            with open(drs_path, "rb") as f:
                header = f.read(64)
                if len(header) < 64:
                    raise ValueError(f"Invalid DRS header size: {len(header)} bytes (expected 64)")

                copyright_str = header[:40].split(b"\x00")[0].decode("ascii", errors="replace")
                version_str = header[40:44].decode("ascii", errors="replace")
                tribe_str = header[44:56].split(b"\x00")[0].decode("ascii", errors="replace")
                num_tables, first_file_offset = struct.unpack("<II", header[56:64])

                self.log(
                    f"  Header: copyright='{copyright_str.strip()}', "
                    f"version='{version_str}', type='{tribe_str}', "
                    f"tables={num_tables}, first_file_offset={first_file_offset}"
                )

                # Read table headers
                raw_tables = [struct.unpack("<4sII", f.read(12)) for _ in range(num_tables)]

                archive_extracted_count = 0
                for table_idx, (ext_raw, table_offset, num_files) in enumerate(raw_tables):
                    # In DRS format, the extension is 4 bytes stored reversed
                    table_ext = ext_raw[::-1].decode("ascii", errors="replace").strip()
                    self.log(
                        f"  Table #{table_idx} [{table_ext}]: "
                        f"{num_files} files (offset {table_offset})"
                    )

                    f.seek(table_offset)
                    file_entries = [struct.unpack("<III", f.read(12)) for _ in range(num_files)]

                    table_success = 0
                    table_bytes = 0

                    for file_id, file_offset, file_size in file_entries:
                        try:
                            f.seek(file_offset)
                            data = f.read(file_size)
                            if len(data) != file_size:
                                raise IOError(
                                    f"Short read for file {file_id}: got {len(data)} of {file_size} bytes"
                                )

                            semantic_type, ext = detect_file_type_and_ext(
                                table_ext=table_ext,
                                file_id=file_id,
                                data=data,
                                force_table_ext=self.force_table_ext,
                            )

                            filename = f"{file_id}.{ext}"
                            out_file_path = drs_dest_dir / filename
                            rel_path = f"{archive_stem}/{filename}"

                            if not self.dry_run:
                                with open(out_file_path, "wb") as out_f:
                                    out_f.write(data)

                            self.manifest_entries.append(
                                {
                                    "id": file_id,
                                    "type": semantic_type,
                                    "table": table_ext,
                                    "drs": archive_stem,
                                    "filename": filename,
                                    "path": rel_path,
                                    "size": file_size,
                                }
                            )

                            table_success += 1
                            table_bytes += file_size
                            archive_extracted_count += 1

                        except Exception as e:
                            self.total_errors += 1
                            print(
                                f"  [ERROR] DRS '{archive_name}', file id {file_id}: {e}",
                                file=sys.stderr,
                            )

                    self.stats.append(
                        {
                            "drs": archive_name,
                            "table": table_ext,
                            "files": table_success,
                            "bytes": table_bytes,
                        }
                    )

            return archive_extracted_count

        except Exception as e:
            self.total_errors += 1
            print(f"[ERROR] Failed to read DRS archive '{archive_name}': {e}", file=sys.stderr)
            return 0

    def write_manifest(self) -> Path:
        """Write raw/manifest.json containing the index of all extracted files."""
        # Sort manifest entries deterministically by (drs, id)
        self.manifest_entries.sort(key=lambda x: (x["drs"], x["id"]))

        manifest_path = self.output_dir / "manifest.json"
        if not self.dry_run:
            self.output_dir.mkdir(parents=True, exist_ok=True)
            with open(manifest_path, "w", encoding="utf-8") as f:
                json.dump(self.manifest_entries, f, indent=2, ensure_ascii=False)
        return manifest_path

    def print_summary(self, manifest_path: Path) -> None:
        """Print a structured summary of extraction results."""
        print("\n" + "=" * 65)
        print("AOE DRS EXTRACTION SUMMARY")
        print("=" * 65)
        print(f"{'DRS Archive':<16} {'Table':<8} {'Files':>8} {'Size (Bytes)':>16} {'Size (MB)':>12}")
        print("-" * 65)

        total_files = 0
        total_bytes = 0
        for s in self.stats:
            total_files += s["files"]
            total_bytes += s["bytes"]
            mb = s["bytes"] / (1024 * 1024)
            print(f"{s['drs']:<16} {s['table']:<8} {s['files']:>8} {s['bytes']:>16,d} {mb:>11.2f} MB")

        print("-" * 65)
        total_mb = total_bytes / (1024 * 1024)
        print(f"{'TOTAL':<25} {total_files:>8} {total_bytes:>16,d} {total_mb:>11.2f} MB")
        print("=" * 65)
        print(f"Total errors: {self.total_errors}")
        print(f"Output directory: {self.output_dir.resolve()}")
        print(f"Manifest written to: {manifest_path.resolve()}")
        if self.dry_run:
            print("(DRY RUN: No files were actually written to disk)")
        print()


def main() -> int:
    parser = argparse.ArgumentParser(
        description="Extract raw assets from Age of Empires 1 DRS archives."
    )
    parser.add_argument(
        "--game-dir",
        "-g",
        default=None,
        help="Path to AoE game directory or game data directory (default: AOE_GAME_DIR or game.lnk).",
    )
    parser.add_argument(
        "--output-dir",
        "-o",
        default="raw",
        help="Target directory for raw extracted files (default: 'raw').",
    )
    parser.add_argument(
        "--drs",
        nargs="*",
        default=None,
        help="Specific DRS filename(s) to extract (e.g. interfac.drs inter2k.drs), or 'all'.",
    )
    parser.add_argument(
        "--table-ext",
        action="store_true",
        help="Use raw table extension instead of content-type detection (e.g. .bina instead of .pal/.bmp/.txt).",
    )
    parser.add_argument(
        "--dry-run",
        action="store_true",
        help="Parse DRS files and test without writing files to disk.",
    )
    parser.add_argument(
        "--quiet",
        "-q",
        action="store_true",
        help="Suppress detailed per-file and per-table logs.",
    )

    args = parser.parse_args()

    try:
        data_dir = resolve_game_data_dir(args.game_dir)
    except Exception as e:
        print(f"Error resolving game directory: {e}", file=sys.stderr)
        return 1

    output_dir = Path(args.output_dir)

    # Determine which DRS files to process
    if args.drs:
        if len(args.drs) == 1 and args.drs[0].lower() == "all":
            drs_files = sorted(data_dir.glob("*.drs"))
        else:
            drs_files = [data_dir / name if not Path(name).is_file() else Path(name) for name in args.drs]
    else:
        drs_files = [data_dir / name for name in DEFAULT_DRS_NAMES]

    # Verify files exist
    existing_drs = []
    for p in drs_files:
        if p.is_file():
            existing_drs.append(p)
        else:
            print(f"Warning: DRS file not found, skipping: {p}", file=sys.stderr)

    if not existing_drs:
        print(f"Error: No valid DRS files found in {data_dir}", file=sys.stderr)
        return 1

    extractor = DrsExtractor(
        output_dir=output_dir,
        force_table_ext=args.table_ext,
        dry_run=args.dry_run,
        verbose=not args.quiet,
    )

    for p in existing_drs:
        extractor.extract_archive(p)

    manifest_path = extractor.write_manifest()
    extractor.print_summary(manifest_path)

    return 1 if extractor.total_errors > 0 else 0


if __name__ == "__main__":
    sys.exit(main())

