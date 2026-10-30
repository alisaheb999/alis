#!/usr/bin/env python3
"""GHOST variant release builder.

    python3 scripts/build-variants.py

Produces three installer archives from the single source tree in
extension-src/, each tuned for one After Effects generation:

  legacy   AE 2019-2022 (CEF 74-88)  profile "lite"      v0.1.x
  standard AE 2023-2024              profile "balanced"  v0.2.x
  current  AE 2025-2026              profile "full"      v3.9.x

The variant identity is written into
"GHOST Creative System/js/ghost-low-device-profile.js" (loaded first by every
panel) and into the CSXS manifest host range, so a package refuses to load in a
host generation it was not built for.
"""
import hashlib
import os
import re
import shutil
import tempfile
import zipfile
import subprocess

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC = os.path.join(ROOT, "extension-src")
PANEL_DIR = "GHOST Creative System"
PUBLIC = os.path.join(ROOT, "public")

VARIANTS = [
    {
        "id": "legacy",
        "version": "0.2.9",
        "profile": "lite",
        "ae_range": "2019 - 2022",
        "host_range": "[16.0,22.9]",
        "csxs": "9.0",
        "label": "GHOST for After Effects 2019-2022 (Lite)",
        "zip": "Ghostae-Installer-AE2019-2022.zip",
    },
    {
        "id": "standard",
        "version": "0.3.2",
        "profile": "balanced",
        "ae_range": "2023 - 2024",
        "host_range": "[23.0,24.9]",
        "csxs": "9.0",
        "label": "GHOST for After Effects 2023-2024",
        "zip": "Ghostae-Installer-AE2023-2024.zip",
    },
    {
        "id": "current",
        "version": "3.12.3",
        "profile": "full",
        "ae_range": "2025 - 2026",
        "host_range": "[25.0,99.9]",
        "csxs": "11.0",
        "label": "GHOST for After Effects 2025-2026",
        "zip": "Ghostae-Installer.zip",
    },
]

VARIANT_BLOCK = re.compile(
    r"/\* ---- variant block.*?---- \*/.*?/\* ---- end variant block ---- \*/",
    re.S,
)


def read(path):
    with open(path, encoding="utf-8") as fh:
        return fh.read()


def write(path, text):
    with open(path, "w", encoding="utf-8", newline="\n") as fh:
        fh.write(text)


def stamp_profile(panel, v):
    path = os.path.join(panel, "js", "ghost-low-device-profile.js")
    block = (
        "/* ---- variant block (rewritten by the release builder) ---- */\n"
        "    var VARIANT = {\n"
        '        id: "%s",\n'
        '        label: "%s",\n'
        '        version: "%s",\n'
        '        aeRange: "%s",\n'
        '        profile: "%s"\n'
        "    };\n"
        "    /* ---- end variant block ---- */"
        % (v["id"], v["label"], v["version"], v["ae_range"], v["profile"])
    )
    text, replacements = VARIANT_BLOCK.subn(lambda _m: block, read(path), count=1)
    if replacements != 1:
        raise RuntimeError("Variant marker missing; refusing to build unstamped package")
    write(path, text)


def stamp_build_version(panel, v):
    path = os.path.join(panel, "js", "build-version.js")
    text = read(path)
    text = re.sub(r'version:\s*"[^"]*"', 'version: "%s"' % v["version"], text)
    text = re.sub(r'edition:\s*"[^"]*"', 'edition: "%s"' % v["label"], text)
    write(path, text)


def stamp_manifest(panel, v):
    path = os.path.join(panel, "CSXS", "manifest.xml")
    text = read(path)
    text = re.sub(
        r'ExtensionBundleVersion="[^"]*"',
        'ExtensionBundleVersion="%s"' % v["version"],
        text,
    )
    text = re.sub(
        r'(<Extension Id="[^"]*" Version=")[^"]*(")',
        lambda m: m.group(1) + v["version"] + m.group(2),
        text,
    )
    text = re.sub(
        r'(<Host Name="AEFT" Version=")[^"]*(")',
        lambda m: m.group(1) + v["host_range"] + m.group(2),
        text,
    )
    text = re.sub(
        r'(<RequiredRuntime Name="CSXS" Version=")[^"]*(")',
        lambda m: m.group(1) + v["csxs"] + m.group(2),
        text,
    )
    if v["profile"] == "lite":
        # Legacy CEF renders autoplaying media on the CPU; drop the flag so the
        # runtime never starts a decode loop behind the panel.
        text = text.replace(
            "<Parameter>--autoplay-policy=no-user-gesture-required</Parameter>", ""
        )
    write(path, text)


def strip_modern_vendor(panel):
    """Lite build: Chromium 74-79 cannot even parse the Tailwind Play JIT or
    Lucide (both use optional chaining), so a SyntaxError there left whole
    panels unstyled and icon-less. Blank both files; the panels fall back to the
    precompiled css/ghost-tw-static.css sheet and CSS glyph placeholders that
    js/ghost-low-device-profile.js wires up."""
    for rel, note in (
        ("js/vendor/tailwind-play.js", "Tailwind Play"),
        ("js/vendor/lucide.min.js", "Lucide"),
        ("js/lucide.min.js", "Lucide"),
    ):
        target = os.path.join(panel, rel)
        if os.path.exists(target):
            write(
                target,
                "/* %s is disabled in the lite (AE 2019-2022) build; see\n"
                "   css/ghost-tw-static.css and js/ghost-low-device-profile.js. */\n" % note,
            )


def compile_legacy_javascript(panel):
    """Compile every panel script for the old CEF parser used by AE 2019/20.

    This includes inline scripts: one unsupported token in an inline block stops
    the complete panel bootstrap, even when all linked files are compatible.
    Vendor files intentionally blanked above are skipped.
    """
    compiler = os.path.join(ROOT, "scripts", "compile-legacy-extension.mjs")
    subprocess.run(
        ["node", compiler, panel],
        cwd=ROOT,
        check=True,
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE,
        text=True,
    )


def write_checksums(panel):
    lines = []
    for base, _dirs, files in os.walk(panel):
        for name in sorted(files):
            full = os.path.join(base, name)
            rel = os.path.relpath(full, panel).replace(os.sep, "/")
            if rel == "checksums.sha256":
                continue
            with open(full, "rb") as fh:
                digest = hashlib.sha256(fh.read()).hexdigest()
            lines.append("%s  %s" % (digest, rel))
    lines.sort()
    write(os.path.join(panel, "checksums.sha256"), "\n".join(lines) + "\n")


def build(v):
    tmp = tempfile.mkdtemp(prefix="ghost-" + v["id"] + "-")
    stage = os.path.join(tmp, "payload")
    shutil.copytree(SRC, stage)
    panel = os.path.join(stage, PANEL_DIR)

    stamp_profile(panel, v)
    stamp_build_version(panel, v)
    stamp_manifest(panel, v)
    if v["profile"] == "lite":
        strip_modern_vendor(panel)
        compile_legacy_javascript(panel)
    shutil.copy2(os.path.join(panel, "clear.cmd"), os.path.join(stage, "clear.cmd"))
    shutil.copy2(os.path.join(panel, "Error.cmd"), os.path.join(stage, "Error.cmd"))
    write_checksums(panel)

    out = os.path.join(PUBLIC, v["zip"])
    if os.path.exists(out):
        os.remove(out)
    with zipfile.ZipFile(out, "w", zipfile.ZIP_DEFLATED) as z:
        for base, _dirs, files in os.walk(stage):
            for name in sorted(files):
                full = os.path.join(base, name)
                z.write(full, os.path.relpath(full, stage).replace(os.sep, "/"))

    with open(out, "rb") as fh:
        digest = hashlib.sha256(fh.read()).hexdigest()
    write(out + ".sha256", "%s  public/%s\n" % (digest, v["zip"]))
    shutil.rmtree(tmp, ignore_errors=True)
    size = os.path.getsize(out) / 1024 / 1024
    print(
        "%-9s v%-7s AE %-11s %-34s %.2f MB\n          sha256 %s"
        % (v["id"], v["version"], v["ae_range"], v["zip"], size, digest)
    )


if __name__ == "__main__":
    import sys

    os.makedirs(PUBLIC, exist_ok=True)
    only = set(sys.argv[1:])
    for variant in VARIANTS:
        if only and variant["id"] not in only:
            continue
        build(variant)
