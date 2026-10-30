#!/usr/bin/env python3
"""Build per-panel source packs.

Each GHOST panel (CACHE, COMMAND, TOOLS, TEMPLATE, TEXT, ONE, IDEA) is exported as a
standalone ZIP containing only the files that panel actually loads, plus the shared
core (CSInterface, config, cloud/licence transport, ExtendScript host) and an
AI_CONTEXT.md brief so an external AI can safely customise it in isolation.

Usage:  python3 scripts/build-source-packs.py
Output: public/source/ghost-<panel>-source.zip  (+ manifest.json)
"""
from __future__ import annotations

import json
import re
import shutil
import zipfile
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
SRC = ROOT / "extension-src" / "GHOST Creative System"
OUT = ROOT / "public" / "source"

VERSION = "3.12.0"

# Files every pack needs: CEP bridge, licence/activation transport, ExtendScript host.
SHARED = [
    "CSXS/manifest.xml",
    "js/CSInterface.js",
    "js/ghost-config.js",
    "js/ghost-cloud.js",
    "js/ghost-gate.js",
    "js/ghost-compat.js",
    "js/api-compat.js",
    "js/build-version.js",
    "js/error-handler.js",
    "js/host.jsx",
    "jsx/AEUPM.jsx",
    "css/design-tokens.css",
    "css/ghost-design-system.css",
    "css/ae-theme.css",
]

PANELS = [
    {
        "id": "cache",
        "name": "GHOST CACHE",
        "entry": "index.html",
        "extra_entries": ["core.html"],
        "purpose": "Asset library browser: local + cloud assets, search, categories, bulk download and add-to-timeline.",
        "extra": ["assets", "js/pm"],
    },
    {
        "id": "command",
        "name": "GHOST COMMAND",
        "entry": "command.html",
        "extra_entries": [],
        "purpose": "AI workspace: multi-tab chat, prompt library, provider catalogue, expression generation and auto-apply to layers.",
        "extra": [],
    },
    {
        "id": "tools",
        "name": "GHOST TOOLS",
        "entry": "tools.html",
        "extra_entries": [],
        "purpose": "Utility board: 34 shortcuts (comp setup, layer controls, timeline actions), colour plates, timeline helpers and the editor board.",
        "extra": [],
    },
    {
        "id": "template",
        "name": "GHOST TEMPLATE",
        "entry": "template.html",
        "extra_entries": [],
        "purpose": "Template browser and local template engine: import templates, .aep auto-render, recently used and sorting.",
        "extra": ["js/ghost-template.js", "js/ghost-template-data.js", "css/ghost-template.css"],
    },
    {
        "id": "text",
        "name": "GHOST TEXT",
        "entry": "toolkit.html",
        "extra_entries": [],
        "purpose": "Text styling and animation: FFX presets, language chips, AE-native glow/ramp/shadow styling and caption studio.",
        "extra": ["presets/ffx", "ffx"],
    },
    {
        "id": "one",
        "name": "GHOST ONE",
        "entry": "one.html",
        "extra_entries": [],
        "purpose": "iPhone-style launcher cards that open every other GHOST panel plus plan and licence status.",
        "extra": [],
    },
    {
        "id": "idea",
        "name": "GHOST IDEA",
        "entry": "idea.html",
        "extra_entries": [],
        "purpose": "In-panel reference browser (Pinterest and similar sources) with transfer of found media into After Effects.",
        "extra": [],
    },
    {
        "id": "emoji",
        "name": "GHOST EMOJI",
        "entry": "emoji-panel.html",
        "extra_entries": [],
        "purpose": "Emoji and icon inserter with search across 1,100+ glyphs.",
        "extra": [],
    },
]

REF_RE = re.compile(r'(?:src|href)\s*=\s*["\']([^"\'#]+)["\']', re.I)
JS_REF_RE = re.compile(r'["\']((?:\./)?(?:js|css|assets|presets|ffx)/[A-Za-z0-9_\-./]+)["\']')


def collect_refs(html_path: Path) -> set[str]:
    """Local js/css/asset references from a panel HTML file."""
    text = html_path.read_text(encoding="utf-8", errors="ignore")
    found: set[str] = set()
    for raw in REF_RE.findall(text):
        rel = raw.split("?")[0].lstrip("./")
        if raw.startswith(("http", "//", "data:")):
            continue
        if (SRC / rel).is_file():
            found.add(rel)
    # scripts sometimes load siblings dynamically (ffx paths, worker files)
    for js in list(found):
        if js.endswith(".js"):
            body = (SRC / js).read_text(encoding="utf-8", errors="ignore")
            for raw in JS_REF_RE.findall(body):
                rel = raw.split("?")[0].lstrip("./")
                if (SRC / rel).is_file():
                    found.add(rel)
    return found


def gather(panel: dict) -> list[str]:
    files: set[str] = set(SHARED)
    entries = [panel["entry"], *panel["extra_entries"]]
    for entry in entries:
        p = SRC / entry
        if not p.is_file():
            continue
        files.add(entry)
        files |= collect_refs(p)
    for extra in panel["extra"]:
        base = SRC / extra
        if base.is_dir():
            for f in base.rglob("*"):
                if f.is_file():
                    files.add(str(f.relative_to(SRC)).replace("\\", "/"))
        elif base.is_file():
            files.add(extra)
    return sorted(f for f in files if (SRC / f).is_file())


def ai_context(panel: dict, files: list[str]) -> str:
    entries = [panel["entry"], *panel["extra_entries"]]
    tree = "\n".join(f"- {f}" for f in files)
    return f"""# AI_CONTEXT — {panel['name']} (source pack v{VERSION})

## What this package is
A standalone slice of the Ghostae After Effects CEP extension containing ONLY the
{panel['name']} panel and the shared runtime it depends on. It is meant to be handed to an
AI agent (or a developer) so this one panel can be customised without reading the whole
extension.

## What this panel does
{panel['purpose']}

## Entry point(s)
{chr(10).join(f'- `{e}`' for e in entries)}

Open the entry HTML first. Every `<script>` and `<link>` in it is present in this package.

## Runtime environment (read before editing)
- Adobe CEP panel = Chromium Embedded Framework. UI is plain HTML/CSS/JS — no build step,
  no bundler, no npm install. Edit files in place; After Effects loads them directly.
- `js/CSInterface.js` is the Adobe bridge. `js/host.jsx` and `jsx/AEUPM.jsx` are
  ExtendScript (ES3) running inside After Effects — no `let`, `const`, arrow functions,
  template literals, `JSON` (a polyfill is included), `Array.prototype.map`, or promises there.
- Panel JS may use modern syntax ONLY for AE 2023+. The legacy build targets Chromium 74,
  so avoid optional chaining, `??`, top-level `await`, CSS `gap` in flexbox, `:has()`,
  and modern colour functions if the change must run on AE 2019–2022.
- Talk to After Effects with `csInterface.evalScript("functionName(args)", callback)`.
  Arguments are strings; return values are strings. Add new host functions in `js/host.jsx`.

## Licence / cloud connection — DO NOT BREAK
- `js/ghost-config.js` holds the API base (`https://ghostae.com/api/public/v1`).
- `js/ghost-cloud.js` performs licence verification, device-seat claiming, plan lookup and
  the AI calls. `js/ghost-gate.js` renders the activation gate and locks panels.
- All panels are governed by ONE licence key. The key is cached machine-wide at
  `Documents/Ghostae/License/activation.json`, so a single activation unlocks every panel.
- Plan entitlements arrive from the server as `locked_modules`; `ghost-cloud.js` disables
  premium controls based on that list. Keep these files, their global names and their
  network calls intact, otherwise activation and AI stop working for the whole product.
- Never hardcode a licence key, an API key or a secret into panel code. Server endpoints
  hold the provider keys.

## Safe change checklist
1. Keep file names and paths — the CEP manifest (`CSXS/manifest.xml`) and other panels
   reference them.
2. Keep global function/object names exported by the shared files.
3. Prefer additive CSS in the panel's own stylesheet over editing `design-tokens.css`.
4. After editing, re-drop the files into the installed extension folder and restart
   After Effects (CEP caches aggressively).

## Files included
{tree}
"""


def readme(panel: dict) -> str:
    return f"""{panel['name']} — Ghostae source pack v{VERSION}

Entry point: {panel['entry']}
Contents:    only this panel + the shared CEP/licence runtime.

Read AI_CONTEXT.md first. It explains the runtime, the ExtendScript limits and which
files must not be renamed so licence activation and cloud AI keep working.

Install for testing (Windows):
  copy the files over your installed extension at
  %APPDATA%\\Adobe\\CEP\\extensions\\com.ghost.creative.system\\
  then restart After Effects.
"""


def main() -> None:
    if OUT.exists():
        shutil.rmtree(OUT)
    OUT.mkdir(parents=True, exist_ok=True)

    manifest = []
    for panel in PANELS:
        files = gather(panel)
        if not files:
            print(f"skip {panel['id']}: no files")
            continue
        zip_name = f"ghost-{panel['id']}-source.zip"
        zip_path = OUT / zip_name
        with zipfile.ZipFile(zip_path, "w", zipfile.ZIP_DEFLATED) as z:
            for rel in files:
                z.write(SRC / rel, f"ghost-{panel['id']}/{rel}")
            z.writestr(f"ghost-{panel['id']}/AI_CONTEXT.md", ai_context(panel, files))
            z.writestr(f"ghost-{panel['id']}/README.txt", readme(panel))
        size = zip_path.stat().st_size
        manifest.append(
            {
                "id": panel["id"],
                "name": panel["name"],
                "zip": f"/source/{zip_name}",
                "entry": panel["entry"],
                "files": len(files) + 2,
                "sizeBytes": size,
                "purpose": panel["purpose"],
            }
        )
        print(f"{zip_name:34} {len(files)+2:4} files  {size/1024:8.1f} KB")

    (OUT / "manifest.json").write_text(
        json.dumps({"version": VERSION, "packs": manifest}, indent=2), encoding="utf-8"
    )
    print(f"\nmanifest.json written with {len(manifest)} packs")


if __name__ == "__main__":
    main()
