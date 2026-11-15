"""Download the Vietnamese-capable web fonts that replace the game fonts (Bước 3.2 in PLAN.md).

The game fonts cannot render Unicode Vietnamese (coprgtl.ttf is Latin-1 only, the
.Vn* fonts use the legacy TCVN3 encoding), so the hub uses open-licensed look-alikes:
- Heading: Spectral SC  (closest to Copperplate Gothic: wide small caps, tiny serifs)
- Body:    Arimo        (metric-compatible with Arial, which the game uses for body text)

Fonts are stored in vendor/fonts/ (committed) and copied into assets/ui/font/web/
by organize_assets.py.
"""

from __future__ import annotations

import argparse
from pathlib import Path
import re
import sys
import urllib.request

FONTS = {
    # family: (weights, license url on github.com/google/fonts)
    "Spectral SC": ((400, 600, 700), "https://raw.githubusercontent.com/google/fonts/main/ofl/spectralsc/OFL.txt"),
    "Arimo": ((400, 700), "https://raw.githubusercontent.com/google/fonts/main/ofl/arimo/OFL.txt"),
}
# A plain user agent makes the Google Fonts CSS API return full (unsubsetted) TTF files.
USER_AGENT = "curl/8"


def fetch(url: str) -> bytes:
    req = urllib.request.Request(url, headers={"User-Agent": USER_AGENT})
    with urllib.request.urlopen(req, timeout=60) as resp:
        return resp.read()


def main() -> int:
    parser = argparse.ArgumentParser(description="Download hub web fonts into vendor/fonts/.")
    parser.add_argument("--out-dir", default="vendor/fonts")
    args = parser.parse_args()
    out_dir = Path(args.out_dir)
    out_dir.mkdir(parents=True, exist_ok=True)

    errors = 0
    for family, (weights, license_url) in FONTS.items():
        slug = family.replace(" ", "")
        for weight in weights:
            css_url = f"https://fonts.googleapis.com/css2?family={family.replace(' ', '+')}:wght@{weight}"
            try:
                css = fetch(css_url).decode("utf-8")
                ttf_url = re.search(r"url\((https://[^)]+\.ttf)\)", css)
                if not ttf_url:
                    raise ValueError("no TTF url in CSS response")
                dest = out_dir / f"{slug}-{weight}.ttf"
                dest.write_bytes(fetch(ttf_url.group(1)))
                print(f"  {family} {weight} -> {dest} ({dest.stat().st_size} bytes)")
            except Exception as e:
                errors += 1
                print(f"[ERROR] {family} {weight}: {e}", file=sys.stderr)
        try:
            (out_dir / f"{slug}-OFL.txt").write_bytes(fetch(license_url))
        except Exception as e:
            errors += 1
            print(f"[ERROR] license for {family}: {e}", file=sys.stderr)

    print(f"Done: {len(list(out_dir.glob('*.ttf')))} font files in {out_dir} (errors={errors}).")
    return 1 if errors else 0


if __name__ == "__main__":
    sys.exit(main())
