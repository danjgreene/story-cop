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

## AI access
Story COP uses **Claude**. The standalone app will ask for your own **Anthropic API key**, which you can create at console.anthropic.com. A Claude.ai subscription doesn't include API access; API usage is billed separately, pay as you go.
