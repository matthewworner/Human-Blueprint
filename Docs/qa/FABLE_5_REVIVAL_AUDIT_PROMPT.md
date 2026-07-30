# The Human Blueprint — Fable 5 Reality + Revival Audit Prompt

> **Status (2026-07-26):** executed and followed by a revival implementation pass. This file is retained as the original audit brief, not current project status. See [`2026-07-05-fable5-revival-audit.md`](2026-07-05-fable5-revival-audit.md) for the implementation correction and `../../STATUS.md` for current evidence.

> **How to use:** Copy the fenced block below into Claude (Fable 5 enabled), run on the
> current `main` HEAD. READ-ONLY — one report file, nothing else.
>
> **Why this audit is different:** The Human Blueprint is a *high-ambition, currently-broken/
> unverified* creative web experience (Three.js + Vite, 2,041 images, gaze tracking, rupture
> system, thread viz; a visionOS build too). Its own README + DEVELOPMENT_FAILURES.md say a
> syntax error (unclosed try block) broke the app for 48+ hours and **nobody has confirmed it
> even loads** — and multiple AI agents missed it. So this is not a quality/compliance/stability
> audit. It answers three questions in order: **(1) does it actually run, (2) what's real vs
> stub vs broken among the claimed features, and (3) is there a real, short path to a
> needle-shifting working version — or is it a rewrite.**
>
> **Do the cheap decisive test FIRST — it's the step that was skipped for 48 hours:**
> `npm install && npm run dev`, open http://localhost:5173, and see if it loads and renders.
> That answers question 1 better than any static read. Use this Fable prompt for the *why it's
> broken / what's real / is it worth reviving* pass that a browser check can't give you.

---

```
You are running a REALITY + REVIVAL AUDIT of "The Human Blueprint" on Fable 5.

Repo: /Users/pro/Projects/Art_History, branch main (verify with `git status -sb`, put the HEAD
SHA in the report). Web app: Three.js + Vite + vanilla JS/TS, ~39 source files, plus a visionOS/
build. READ-ONLY — audit + report only, no code/git/config changes, create no file except the ONE
report at Docs/qa/<YYYY-MM-DD>-fable5-revival-audit.md. Run `ls`, `date +%F`, read the real
source, and read README.md + CLAUDE.md + ARCHITECTURE.md + DEVELOPMENT_FAILURES.md + STATUS.md +
SYNPOSIS.md first.

CRITICAL CONTEXT: this app is UNVERIFIED and was broken for 48h by an undetected syntax error
(unclosed try block) — build appeared to pass due to Vite caching, no automated browser testing,
multiple agents missed it. DO NOT ASSUME IT WORKS. DO NOT trust "build passes" as evidence it
runs. Your job is to find what's actually broken and what's actually real.

Answer these THREE questions, in order:

--- Q1. DOES IT ACTUALLY RUN? (blocking) ---
- Static-trace the entry path: index.html → the module graph → first render. Find every syntax
  error, unclosed block, broken/circular import, missing file, undefined-at-runtime reference,
  and top-level throw that would stop the app loading or leave a blank canvas. (The 48h bug was
  exactly this class — hunt every sibling of it.)
- Identify the Vite-caching trap: anything where `npm run build` / dev-server "success" would NOT
  mean the app actually loads in a browser. Note where a stale cache could mask a real error.
- You cannot run a browser. So for the decisive check, give the operator an EXPLICIT runbook:
  `npm run dev`, open localhost:5173, and a checklist of what "working" looks like vs the failure
  signatures to watch for (blank screen, console error X, images not loading, gear does nothing).

--- Q2. WHAT'S REAL vs STUB vs BROKEN? (honesty inventory) ---
The README lists features "Not Yet Verified": 2,041 images with metadata, gaze tracking, rupture
system, thread visualization, settings panel, user path tracking, "Apple-tier UI polish". For
EACH: read the code and classify —
  REAL      — implemented and wired into the running experience.
  STUB      — scaffolded / hardcoded / placeholder, not actually functional.
  BROKEN    — implemented but has a defect that stops it working.
  ABSENT    — claimed but no real code behind it.
Verify the 2,041 images actually exist and are referenced (not a claimed count with 12 files on
disk). Distinguish "the concept is coded" from "the concept renders on screen".

--- Q3. IS THERE A SHORT PATH TO A NEEDLE-SHIFTING VERSION? (viability — the real question) ---
This is a "shift the needle" creative bet, so assess it as one, honestly:
- Architecture coherence: is the Three.js scene graph + module structure sound enough to build on,
  or is it a tangle that fights every change? Is the visionOS/ build a real port or a stub?
- What is genuinely NOVEL here vs generic scaffolding — the thing worth the bet (the gaze/rupture/
  thread mechanics as an experience, the 50,000-year mark-making concept)?
- The SHORTEST path from "broken/unverified" to "a compelling working demo": the ordered set of
  fixes to get it loading + the core experience rendering, separated from the long tail of polish.
- An honest revive-vs-rewrite call: is the existing code a foundation worth reviving, or would a
  focused rebuild of just the core experience be faster? Say which, and why, with evidence.

--- OUTPUT: Docs/qa/<YYYY-MM-DD>-fable5-revival-audit.md ---
  1. Header — date, HEAD SHA, branch.
  2. Q1 verdict — does it load? The blocking errors found (file:line), + the operator runbook to
     confirm in a browser (the step that was skipped).
  3. Feature reality table — each claimed feature → REAL / STUB / BROKEN / ABSENT, with file:line.
  4. Findings — numbered, SEVERITY-PREFIX title / file:line / What / Why / Fix direction:
       BLOCKER-   stops the app loading/rendering.
       BROKEN-    a claimed feature that doesn't work.
       STUB-      claimed but placeholder/absent (honesty).
       VIABILITY- architecture/coherence issue that threatens the bet.
       INFO-      observation.
  5. The needle question — genuinely novel core vs scaffolding; shortest path to a working demo
     (ordered); and a reasoned revive-vs-rewrite recommendation.
  6. Punch list — ordered "get it loading first, then the core experience, then polish".

Australian English. Every finding cites file:line + a reproducer or "confirm in browser: <what>".
No fabricated claims — if the count/feature can only be confirmed by running it, say so and how.
Be honest about the bet: if the concept is strong but the code is a dead end, say exactly that.
```
