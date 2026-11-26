# Story COP

**From a one-line idea to screenplay pages, with an AI story editor beside you.**

Story COP is a movie development tool built around a "common operating picture" of one story. It isn't a pipeline you push your idea through. It's a single live model of the movie that you look at step by step (Spine → Movements → Beats → Questions → Scenes → Pages), with a story editor you can talk to at any point.

## What it does
- **Pitch, then get a story frame:** genre and blend, tone, rating, runtime and structure lens, suggested from your pitch, plus four questions written for this particular idea.
- **Spine first:** want, need, flaw and theme come before structure, and the movements and beats are built from them.
- **Open questions as first-class items:** for each one, three fleshed-out options, your own answer, or **roll the dice** and let the AI decide (then keep it, spin again, or say "I like it, but…").
- **Canon:** locked decisions (marked yours or rolled), open questions, what the audience knows when, and rejected ideas.
- **Zoom out** rebuilds the story around every decision you've made. The **structure lens** checks the beats against Save the Cat, the Hero's Journey and other models without forcing the story into them.
- **Scenes and pages** in standard screenplay format, written one movement at a time.
- **Export** to PDF, Word, Final Draft (.fdx) and Fountain, plus a development package for getting critique from another AI.
- **Import** an existing script to map it, diagnose it, and keep developing it.

## Status
- `prototype/index.html` is the working prototype. It runs as a Claude artifact and uses your Claude subscription inside Claude.
- The standalone app (web, then desktop with Tauri) is being built from it. See `docs/migration-brief.md`.
- **Phase 2 is done:** the prototype is split into modules in `src/` with no change in behavior.
- **Phase 3 is done:** outside Claude, the app asks for your Anthropic API key (Settings), streams answers from Claude so the progress meter moves, and saves exports as normal browser downloads. Inside Claude (the artifact) it works exactly as before, on your subscription.

## Running it
Needs Node.js 20 or newer.

```
npm install        # once
npm run dev        # the app at http://localhost:5173
npm test           # all tests (about 10 seconds)
npm run build      # type check + production build into dist/
```

On Windows, if PowerShell says "running scripts is disabled", type `npm.cmd` instead of `npm`.

## How the code is organized
| Folder | What's in it |
|---|---|
| `src/ai/` | `prompts.ts` (every prompt, word for word: the product), `client.ts` (talking to Claude), `anthropic.ts` (the Anthropic API with your key: streaming, models, errors), `tasks.ts` (pitch, build, chat, options, roll, zoom out, scenes, pages, import, structure check) |
| `src/story/` | The story's shape (`types.ts`), saving (`db.ts`), changes and undo (`store.ts`), the story frame and structure models, backups, the Last Resort sample |
| `src/export/` | PDF, Word, Final Draft, Fountain, the development package, the zips |
| `src/import/` | Reading Final Draft files and script files |
| `src/platform/` | Things that differ between Claude, the web and the desktop: the AI connection, dictation, saving files |
| `src/ui/` | The screens: Stories, pitch, and the three panes (editor, story, canon) |
| `tests/` | `exporters.test.ts` (exported files match the prototype byte for byte), `parity.test.ts` (inside Claude: clicks through the whole app next to the prototype and checks that every screen, prompt and saved file is identical), `anthropic.test.ts` (the API client, settings and errors, against a fake Anthropic server) and `standalone.test.ts` (outside Claude: Settings, pitch and build through the API, downloads, and the key never leaking into saved files) |

The golden files in `tests/golden/` were made by the prototype itself. Remake them only on purpose, with `npm run goldens`.

## AI access
Story COP uses **Claude**. The standalone app asks for your own **Anthropic API key**, which you can create at console.anthropic.com. A Claude.ai subscription doesn't include API access; API usage is billed separately, pay as you go.

- Open **Settings** (on the Stories screen, or in the header of a story), paste the key, **Save**, then **Test the connection**. The test only looks up the models, so it costs nothing.
- The key stays in your browser and goes only to Anthropic. It is stored apart from your stories, so it never ends up in a backup, an export or the development package. Untick "Remember the key on this computer" on a shared computer.
- Which model does which job is set in Settings. Recommended: **Claude Opus 5.5** for the big jobs (building, zoom out, options, rolling the dice, scenes, pages, import, structure check) and **Claude Sonnet 5.5** for the opening questions and the conversation.
- On Opus and Sonnet, server-side fallback is on: if Claude's safety checks decline a request, Anthropic retries it on a fallback model in the same call.
