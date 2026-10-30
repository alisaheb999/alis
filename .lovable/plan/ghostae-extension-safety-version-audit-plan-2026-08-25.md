# Ghostae Extension Safety + Version Audit Plan

## Goal
Production release-এর আগে ৪টি launch panel যাচাই করা:
- Ghostae Cache
- Ghostae Text
- Ghostae Breeze
- Ghostae Presets

Main focus:
1. AE 2026 / AE 2024 version compatibility ঠিক আছে কিনা।
2. Installer/ZIP-এর কারণে Windows Defender বা browser false-positive virus warning হওয়ার মতো risky pattern আছে কিনা।
3. Extension package-এ missing `index.html`, wrong panel path, wrong name, wrong version, missing asset আছে কিনা।
4. Download package clean, predictable, checksum সহ verify করা যায় কিনা।

## Low-credit strategy
- Full rewrite বা heavy refactor করব না।
- শুধু static audit + targeted critical patches।
- ZIP rebuild শুধু যদি installer/package metadata fix লাগে।
- Antivirus “100% no warning” guarantee করা যায় না যদি installer unsigned থাকে, কিন্তু false-positive কমানোর জন্য risky code/packaging pattern remove/check করব।

## Audit steps
1. Manifest audit
   - সব panel-এর `CSXS/manifest.xml` check করব।
   - MainPath file সত্যিই আছে কিনা verify করব।
   - Visible names: Cache, Text, Breeze, Presets consistent কিনা দেখব।
   - AE 2024/2026 supported host ranges ঠিক করব।

2. Installer safety audit
   - `.cmd`, `.command`, `.ps1` files scan করব।
   - Suspicious flags/commands check করব: hidden download, encoded PowerShell, remote execution, unknown exe, forced admin, destructive delete।
   - প্রয়োজন হলে wording/flow safer করব: backup-first, no hidden download, no admin requirement, clear install path।

3. Virus false-positive reduction
   - Unnecessary obfuscation/minification-like suspicious blocks avoid করব যেখানে possible।
   - Installer ZIP-এর checksum regenerate করব।
   - README-তে clean install + checksum verification note add করব।
   - Code signing থাকলে best solution; certificate ছাড়া warning পুরোপুরি বন্ধ করা যায় না।

4. Package integrity audit
   - Final Windows/macOS ecosystem ZIP list verify করব।
   - Caption Worker included কিনা check করব।
   - Panel MainPath files return/present কিনা check করব।
   - Build output files 200 OK কিনা verify করব।

## Expected fixes if issues are found
- Missing `index.html`/wrong MainPath fix for Breeze or any panel.
- Wrong “Motion Cloud”/old naming leftovers remove.
- AE 2024/2026 manifest range correction.
- Safer installer text/logic if current commands look suspicious.
- Regenerate package + SHA256 only after targeted fixes.

## Verification before final reply
- `rg` audit summary: no old wrong names in visible package files.
- Scripted check: every manifest MainPath exists.
- Scripted check: no encoded PowerShell / remote exe download pattern in installers.
- Download URLs return 200.
- SHA256 files updated for rebuilt packages.