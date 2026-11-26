# Story COP: migration brief (artifact → app in Claude Code)
*Nov 25, 2026. This is the starting context for Claude Code. The working code is `prototype/index.html`; the product thinking is `docs/engine-concept.md`.*

## Where things stand
- **Live prototype:** "Story COP" artifact — https://claude.ai/artifact/DZfcixoFYWzzaLsZXj5gtx (identical to `prototype/index.html`). One self-contained HTML file of about 100 KB, vanilla JS. It works end to end: pitch → story frame and opening questions → spine, movements, beats → open questions (options, Other, roll the dice) → zoom out → scenes → pages → export. It can also import an existing script.
- **It uses three Claude-artifact capabilities** that won't exist in a standalone app: `sample` (AI calls on the viewer's Claude subscription), `dictation` (speech to text) and `downloads` (saving files). They're reached through `window.claude.use(name)`. Everything else is ordinary browser code.
- **Keep the artifact running** as Dan's personal tool and the place to test story quality, until the app catches up.

## Decisions already made
- **Claude only.** In Dan's testing it beats the other models, and the prompts are tuned for it. There is no multi-provider layer, but all AI access stays behind one module so that remains possible later.
- **Bring your own key.** Users paste an Anthropic API key from the Anthropic Console. A Claude subscription does not include API access; the settings screen and README must say so plainly. A hosted or paid version (our own server, accounts, billing) can come later.
- **Web app first, then a desktop app with Tauri,** so keys live in the operating system's secure storage and projects are real files on disk.

## Suggested stack
- Vite + TypeScript. Keep the current DOM approach, or move the UI to Preact or React if that's clearly worth it. The UI is about 15 render functions.
- `@anthropic-ai/sdk`, streaming. The progress meter depends on streamed text.
- Tauri v2 for desktop, with the keychain, file-dialog and filesystem plugins.
- Vitest for unit tests. Golden-file tests for the exporters.

## Module map (from the prototype's sections)
| Prototype section | New module | Notes |
|---|---|---|
| `EDITOR` prompt, `SCH`, `STORY_RULES`, every task prompt (kickoff, build, chat, options, roll, zoomOut, scenes, pages, import, structure check) | `src/ai/prompts.ts` | **Port word for word.** These are the product. |
| `ask()`, `parseJ()`, `run()`, `PROG`, `progState()` | `src/ai/client.ts`, `src/ui/progress.ts` | Swap `sample` for the Anthropic Messages API with streaming. Consider tool use or structured output in place of "return only JSON" plus brace-slicing. |
| Model tiers `quick`, `default`, `complex` | `src/ai/models.ts` | Map them to `claude-haiku-5-5`, `claude-sonnet-5-5` and `claude-opus-5-5`, and make them configurable. `complex` handles build, zoom out, options, roll, scenes, pages, import and the structure check. |
| `DB`, `mutate`, `undo`, history snapshots | `src/story/store.ts` | localStorage becomes IndexedDB on the web and `.storycop` project files on desktop. Keep the 30-step undo history. |
| `SEED` (Last Resort) | `src/story/samples.ts` | Keep it as the demo and the test story. |
| `parseFountain`, `layoutPages`, `makePDF`, `makeFDX`, `makeDOCX`, `makeZip`, `fountainDoc`, `devPackage`, `fdxToFountain`, `screenplayView` | `src/export/*`, `src/import/*`, `src/ui/screenplay.ts` | Tested and correct; port as is. The PDF is written by hand (Courier, US Letter, standard margins and indents). |
| Story frame (`normFrame`, `frameText`, `frameFields`, `MODELS`), structure lens (`checkStructure`, `structPanel`) | `src/story/frame.ts`, `src/ui/*` | |
| `saveFile` (the `downloads` capability) | `src/platform/files.ts` | Web: a Blob download link. Tauri: a save dialog. **.fountain and .fdx can now be saved directly** (the artifact's allowlist forced .txt and .zip). |
| `dictation` | `src/platform/speech.ts` | Web Speech API on Chromium. Desktop: decide between the operating system's dictation and a speech-to-text service. Keep the mic hidden when it isn't available. |
| home, kick, cop, editorPane, centerPane (stepper, hints, next cards), canonPane, exportPanel, framePanel, structPanel, questionPanel, rollPanel | `src/ui/*` | Keep the information architecture as it is (see below). |

## UI and workflow rules to keep (learned from Dan's testing)
- **Three panes:** story editor conversation (left), the story at its current step (center), canon (right).
- **A guided path:** a stepper with Spine → Movements → Beats → Questions → Scenes → Pages. Each step opens with a plain-English line explaining it and ends with a "Yes, on to…" card. There is a first-run "How this works" guide, a "?" on the conversation box, and example prompts that change with the step.
- **Progress meter for big AI jobs,** driven by real signals from the stream: sections ticked off as their JSON keys appear, and scenes counted as they arrive.
- **Every pick offers Other.** The AI's recommendation stays hidden until asked ("What would you do?").
- **Roll the dice** on one question or on all of them: Keep it, Spin again (avoiding earlier spins), "I like it, but…" (a steering note), Back to choosing myself. Rolled decisions are tagged "ROLLED" in canon.
- **Nothing changes canon without the writer.** Chat decisions arrive as "Lock this?" cards to accept or dismiss.
- **Zoom out** rebuilds the story from canon. The button lights up when the story is out of date, and an old structure check is marked out of date.
- **Story frame** (genre and an optional second genre with a blend, tone, rating, runtime, structure lens). The AI suggests it from the pitch and the writer edits it in the header.
- **Structure lens is a check, not a template.** It marks each beat of the model On track, Early, Late, Weak or Missing, with a "Fix this" link into the conversation.
- **Pages view uses standard screenplay layout,** measured in ch units: character at 22ch, dialogue at 10ch and 35ch wide, parenthetical at 16ch, transitions right-aligned.

## Porting plan
1. **Repo setup (done).** The prototype is committed unchanged as `prototype/index.html`, with a README, CLAUDE.md and these docs.
2. **Scaffold (done, Nov 25, 2026).** Vite + TypeScript, the code moved into the modules above **without changing behavior**. Golden-file tests protect the exporters, and a parity test drives the prototype and the new app side by side, checking every screen, prompt and saved file. The UI stays plain DOM (`h()`), as in the prototype; a framework can come later if clearly worth it. Inline task prompts are now functions in `src/ai/prompts.ts` that return the same text.
3. **Claude client and Settings screen (done, Nov 25, 2026).** `@anthropic-ai/sdk` with streaming into the progress meter; Settings to paste a key, test it (model lookups, free) and pick a model and effort per tier; plain-English errors (bad key, rate limit, unknown model, no credit, busy, offline, refusal, cut off); server-side fallback on Opus/Sonnet. The key is stored apart from the stories (never in backups or exports). Inside Claude the artifact path is unchanged (the parity test still covers it); outside Claude, exports are browser downloads. Prompts are still sent as one user message, word for word; moving `EDITOR` into a cached system prompt would cut cost but changes the request shape, so it waits for the quality check (phase 6).
4. **Storage:** move to IndexedDB and import the artifact's JSON backups (keep the `{app:'storycop', v:1, stories}` format), so Dan's existing stories carry over.
5. **Tauri desktop build:** keychain storage for the API key, `.storycop` project files with Open, Save and Recent, native save dialogs for exports, and speech.
6. **Quality checks:** a small regression script that runs kickoff, build and a roll on the Last Resort seed and one thin logline, then checks the JSON shape and timing. Run it whenever prompts change.
7. **Releases:** GitHub Actions builds installers for Mac and Windows from tagged releases.

## Backlog (from the design sessions, not built yet)
- Roll the dice on a whole step (all the beats of a movement, or the full scene list), and a creativity dial from safe to wild.
- Editing pages directly in the screenplay view, and notes on a single scene.
- Parallel tracks and branches with side-by-side compare (Dan's Cassian and Cassie versions of The Revisionist).
- Two-way sync between storyboard and script, then shot lists, then the path to rendering.
- Streaming the chat replies (today the reply appears all at once).
- A table read: a producer-level critique of the current step, delivered as up to 5 notes.
- Reading PDF scripts on import (pdf.js) instead of asking the writer to paste the text.
