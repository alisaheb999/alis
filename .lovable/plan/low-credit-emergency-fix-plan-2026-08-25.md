# Low-credit emergency fix plan

## Goal
Production release unblock with minimum edits: fix the visible 404/download problem and the Text/Presets panel animation/apply mismatch, then rebuild the two public installer ZIPs.

## Strict low-credit strategy
- No large rewrite.
- No new feature build.
- Only small path/mapping patches in existing files.
- Reuse the four final extension sources already present: Cache, Text, Presets, Bridge.
- Verify with direct URL checks and lightweight source/package checks only.

## Work steps
1. Fix public download reliability
   - Confirm `/downloads/Ghostae-Ecosystem-Windows.zip` and `/downloads/Ghostae-Ecosystem-macOS.zip` return 200.
   - If needed, rebuild both packages from the current four panel folders.

2. Fix Presets preview 404
   - Patch the preview resolver so it can find preview files with real names like `button2.png`, `scene-1.png`, and category folder names.
   - Keep fallback behavior so the panel does not break if the server is unavailable.

3. Fix Text animation apply issue
   - Patch the animation apply path so names like `Bold Kinetic Lift 027` resolve to the correct built-in animation instead of showing `Unknown animation`.
   - Do not change the big animation library content.

4. Rebuild release ZIPs
   - Re-run the existing ecosystem packager only.
   - Confirm both ZIPs exist and contain Cache, Text, Presets, and Bridge.

5. Report concise verification
   - State only what was fixed and what was checked.
