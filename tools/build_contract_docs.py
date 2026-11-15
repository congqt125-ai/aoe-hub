"""Generate docs/contract/api-index.md from the contract registries in contract/*.ts.

Reads every `export interface <Module>(Queries|Commands|Events) { ... }` block and lists each entry
("name": { ... }) with its JSDoc line, so the backend handoff table never drifts from the TypeScript source.

Usage: python -I tools/build_contract_docs.py [--contract contract] [--out docs/contract/api-index.md]
"""

from __future__ import annotations

import argparse
import re
import sys
from pathlib import Path

KINDS = ("Queries", "Commands", "Events")
KIND_TITLE = {
    "Queries": "Truy vấn (không đổi trạng thái)",
    "Commands": "Lệnh (đổi trạng thái, kèm X-Request-Id)",
    "Events": "Sự kiện realtime (server → client)",
}
BLOCK_RE = re.compile(r"export interface (\w+?)(Queries|Commands|Events)\s*\{", re.M)
ENTRY_RE = re.compile(r'^\s{2}"([\w.]+)":\s*\{')
TOPIC_RE = re.compile(r"topic:\s*([^;]+);")


def block_body(text: str, start: int) -> str:
    """Return the text between the `{` at `start` and its matching `}`."""
    depth = 0
    for i in range(start, len(text)):
        if text[i] == "{":
            depth += 1
        elif text[i] == "}":
            depth -= 1
            if depth == 0:
                return text[start + 1 : i]
    raise ValueError("unbalanced braces")


def entries(body: str) -> list[tuple[str, str, str]]:
    """(name, doc, topic) for each top-level entry of a registry interface."""
    out: list[tuple[str, str, str]] = []
    lines = body.splitlines()
    doc: list[str] = []
    section = ""
    in_doc = False
    for idx, line in enumerate(lines):
        s = line.strip()
        if s.startswith("/**"):
            in_doc = not s.endswith("*/")
            doc = [s.removeprefix("/**").removesuffix("*/").strip()]
            continue
        if in_doc:
            if s.endswith("*/"):
                in_doc = False
                s = s.removesuffix("*/")
            doc.append(s.lstrip("*").strip())
            continue
        if s.startswith("//"):
            section = s.lstrip("/").strip()  # group comment: applies to every entry below it
            continue
        m = ENTRY_RE.match(line)
        if m:
            rest = "\n".join(lines[idx : idx + 4])
            t = TOPIC_RE.search(rest)
            topic = t.group(1).strip().replace("`", "").replace("${", "{") if t else ""
            note = " ".join(x for x in doc if x).replace("|", r"\|")
            if section:
                note = f"*{section}*" + (f" · {note}" if note else "")
            out.append((m.group(1), note, topic))
            doc = []
        elif s and not s.startswith("payload") and not s.startswith("result"):
            doc = []
    return out


def main() -> int:
    ap = argparse.ArgumentParser(description=__doc__.splitlines()[0])
    ap.add_argument("--contract", default="contract", type=Path)
    ap.add_argument("--out", default=Path("docs/contract/api-index.md"), type=Path)
    args = ap.parse_args()

    rows: dict[str, list[tuple[str, str, str, str]]] = {k: [] for k in KINDS}
    errors = 0
    files = sorted(p for p in args.contract.glob("*.ts"))
    for path in files:
        try:
            text = path.read_text(encoding="utf-8")
            for m in BLOCK_RE.finditer(text):
                body = block_body(text, m.end() - 1)
                for name, doc, topic in entries(body):
                    rows[m.group(2)].append((name, doc, topic, path.name))
        except Exception as exc:  # one bad file must not stop the batch
            errors += 1
            print(f"error: {path}: {exc}", file=sys.stderr)

    lines = [
        "# Danh mục lời gọi và sự kiện",
        "",
        "<!-- Sinh tự động bởi tools/build_contract_docs.py từ contract/*.ts — không sửa tay. -->",
        "",
        "HTTP: `POST <apiBase>/v1/call/<tên>` · WebSocket: `{ t: \"cmd\", id, name: <tên>, payload }`. "
        "Kiểu payload / result: xem file nguồn ở cột cuối. Quy ước: [conventions.md](conventions.md).",
        "",
    ]
    for kind in KINDS:
        items = sorted(rows[kind])
        lines += [f"## {KIND_TITLE[kind]} — {len(items)}", ""]
        if kind == "Events":
            lines += ["| Tên | Chủ đề | Ghi chú | Nguồn |", "|---|---|---|---|"]
            lines += [f"| `{n}` | `{t}` | {d} | [`{f}`](../../contract/{f}) |" for n, d, t, f in items]
        else:
            lines += ["| Tên | Ghi chú | Nguồn |", "|---|---|---|"]
            lines += [f"| `{n}` | {d} | [`{f}`](../../contract/{f}) |" for n, d, _, f in items]
        lines.append("")

    args.out.parent.mkdir(parents=True, exist_ok=True)
    args.out.write_text("\n".join(lines), encoding="utf-8", newline="\n")
    total = sum(len(v) for v in rows.values())
    print(
        f"{args.out}: {len(rows['Queries'])} queries, {len(rows['Commands'])} commands, "
        f"{len(rows['Events'])} events from {len(files)} files; errors: {errors}"
    )
    return 1 if errors or total == 0 else 0


if __name__ == "__main__":
    sys.exit(main())
