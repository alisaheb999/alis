#!/usr/bin/env python3
import os

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC = os.path.join(ROOT, "extension-src", "GHOST Creative System")
CSS_OUT = os.path.join(SRC, "css", "ghost-tw-static.css")

# A broader set of static utilities to prevent unstyled panels in AE 2020
static_css = """/* GHOST precompiled utilities for legacy CEF (v3.9.9) */
body { background-color: #232323; color: #cfcfd4; font-family: sans-serif; margin: 0; padding: 0; }
.flex { display: block; }
.flex-col { display: block; }
.items-center { vertical-align: middle; }
.justify-between { clear: both; }
.hidden { display: none !important; }
.block { display: block !important; }
.inline-block { display: inline-block !important; }
.rounded-xl { border-radius: 12px; }
.rounded-2xl { border-radius: 16px; }
.bg-ae-bg { background-color: #232323; }
.bg-white { background-color: #ffffff; }
.bg-slate-50 { background-color: #f8fafc; }
.text-ae-text { color: #cfcfd4; }
.text-slate-600 { color: #475569; }
.text-blue-600 { color: #2563eb; }
.p-4 { padding: 16px; }
.p-6 { padding: 24px; }
.m-2 { margin: 8px; }
.w-full { width: 100%; }
.h-full { height: 100%; }
.text-xs { font-size: 11px; }
.text-sm { font-size: 13px; }
.font-bold { font-weight: 700; }
.font-black { font-weight: 900; }
.border { border: 1px solid #333; }
.border-slate-200 { border: 1px solid #e2e8f0; }
.transition-all { transition: all 0.2s; }
.gap-2 > * { margin: 4px; }
.gap-4 > * { margin: 8px; }
/* Forced grid cleanup */
.grid { display: block !important; }
.grid > * { margin-bottom: 12px; }
"""

with open(CSS_OUT, "w") as f:
    f.write(static_css)

print("Generated comprehensive static CSS for legacy support.")
