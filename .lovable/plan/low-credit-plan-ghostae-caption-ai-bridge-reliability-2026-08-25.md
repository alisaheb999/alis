# Low-credit plan: Ghostae Caption + AI Bridge reliability

## Goal
Caption workflow, Ghost AI Bridge, and panel status UX will be made production-safe with minimal edits. No heavy file rewrite, no new ZIP build until the core fixes are verified.

## Low-credit strategy
- Touch only the small controller/UI files around Caption Worker, Breeze/Bridge panel, and the existing caption insertion host function.
- Do not regenerate large `host.jsx` / `toolkit.js` files.
- Add small fallback functions and status messages instead of rebuilding the whole extension.
- Verify by static checks and local route/file checks only; avoid expensive broad scans.

## Fixes to implement

### 1. Caption output should open into a fresh AE working area
- Update the caption insert function so generated captions can create/open a dedicated composition such as `Ghostae Captions` instead of silently writing into a random active comp.
- Keep manual import still possible: if an active comp exists, it can use it; if not, create a clean comp automatically.
- Add clearer result text: inserted count, target comp name, and failure reason.

### 2. Caption Worker: two Chrome-zone resilience
- Change the worker from a single fragile hidden tab to a safer job runner:
  - open a fresh Gemini tab per job,
  - detect if a usable Gemini tab already exists,
  - retry once in a second tab if the first tab fails to find upload/prompt/send/result controls,
  - always close only the worker-created tab, not the user’s own tab.
- Add progress stages: `opening_ai`, `uploading_media`, `sending_prompt`, `waiting_ai`, `validating_srt`, `submitting`.

### 3. Manual first, AI fallback second
- Keep manual caption generation/import as the primary safe path.
- If manual flow cannot complete, the worker automation will attempt Gemini UI detection and button-finding as fallback.
- The fallback will report exactly which control was missing instead of just “cancelled”.

### 4. Ghost AI Bridge cancellation/speed/status
- Stop showing vague cancel/fail messages.
- Add a visible job timer and stage text in the Bridge panel.
- When cancel is requested, show `Cancel requested`, then either `Cancelled safely` or the exact stage that kept running.
- Reduce UI polling delay where safe so the panel feels faster, without adding artificial AI request timeouts.

### 5. User panel clarity
- Improve status copy only: users should see what is happening, how many stages remain, and what failed.
- Add no new marketing sections and no large redesign.

## Files likely touched
- `extension-src/caption-worker/background.js`
- `extension-src/caption-worker/gemini.js`
- `extension-src/caption-worker/options.js`
- `extension-src/ghostae-bridge/com.ghost.bridge/client/panel.js`
- `extension-src/ghostae-text/com.ghost.text/js/host.jsx` only for the small `ghostInsertCaptions` function

## Verification
- Confirm edited files contain the new progress stages and retry/fallback logic.
- Confirm no AI Gateway timeout/Abort pattern is introduced.
- Confirm no secret values are printed or exposed.
- If packaging is requested after this, rebuild ZIPs separately.
