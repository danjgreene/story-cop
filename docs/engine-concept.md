# Movie Development Engine — Teardown & New Concept (v1)
*Nov 25, 2026. Updated after the first live tests and the prototype reviews (see Parts 5 and 6).*

---

## Part 1 — What the earlier builds were

**They were all the same app.** ChatGPT and Google AI Studio were both rebuilding the 412-line `movie-developer-engine-recreation-spec.md` that Meta's Muse produced. That's why they felt like copies of each other: they shared one product definition, and it had a few core design mistakes. Swapping models wouldn't fix them.

### The Muse spec's pipeline
Setup form (genre blend, tone, rating, runtime, budget, POV, structure model, 10 "pattern macros," a 6-question survey, a locked/proposed/rejected element board)
→ **Diagnosis** → **Beat Sheet** (exactly 40 beats, one sentence of 25 words or fewer each) → **Treatment** (6 fixed "movements," max 5 characters at one sentence each) → **Script** (one scene per beat, 300 words or fewer per scene) → **Honest Assessment** → **Second Pass**, with a mandatory critique, revision and acceptance gate between every stage.

### Why it produced boring, lackluster ideas
1. **It was built to prevent bad ideas, not to generate good ones.** Nearly every prompt was defensive ("no invented plot points," "inventions are problems, not creativity"). A model told not to invent fills the gaps with the blandest connecting tissue it can find. Nothing asked for **surprising but inevitable**.
2. **Character arrived after plot.** Characters first appeared in the Treatment, after the 40 beats were set, at one sentence each. Tension comes from a person under pressure, and the structure was built with no person in it.
3. **The math produced a short script, not a feature.** 40 scenes at 300 words is about 45–50 pages. A 125-minute film runs about 120 pages and 55–70 scenes.
4. **The setup questions fit only one story.** They were tuned to the Unsung test case ("Is the protagonist actually guilty?").
5. **Gates instead of flow.** Critique-and-accept gates at every stage caused the information overload.
6. **Generation in disconnected chunks.** Later passes saw only the last 3 scenes.

### What's worth keeping
Locked / proposed / rejected decisions · the causal-chain test (as a critique tool, not a generation restriction) · writer's notes outrank AI notes · Fountain output · silent version history.

---

## Part 2 — How Dan actually works (from the Revisionist chats)
- **He generates, the AI shapes.** His best material comes as spoken riffs, often anchored in films ("like the chair in *Contact*," "a bottle-label fragment stuck to his boot"). The AI is most useful when it catches the idea, works out its mechanics, and plays back what it changes.
- **He alternates between zooming in and zooming out.** Hours deep on one problem, then: *"We've been in the weeds. Time to zoom out and see the big picture,"* and he wants the whole beat sheet regenerated with every decision folded in.
- **The AI's best moves:** naming what a beat must accomplish before solving it; untangling threads; offering 2–3 directions with honest trade-offs; refusing to fill a blank just to fill it.
- **Questions stay open on purpose.** "Still undecided" is a legitimate state for days.
- **Hard rules about what the audience can know.** His stories run on reveals.
- **Everything is versioned, and alternate tracks run in parallel.**
- **The beat sheet he liked was prose,** with an emotional spine, runtime timestamps and notes on what the audience should feel.

---

## Part 3 — The concept: a Story COP
**Don't build a pipeline; build a common operating picture of one movie.** One live model of the story, viewed step by step, with a story editor beside it in conversation. Every artifact (beat sheet, treatment, script) is a view generated from that one model.

- **Three panes:** story editor (conversation, voice-first) · the story (Spine → Movements → Beats → Questions → Scenes → Pages) · canon (locked decisions, open questions, the audience-knowledge ledger, dead ideas).
- **Spine before structure:** want, need, flaw, the theme as an argument, the ending's emotional state.
- **Zoom out** regenerates the higher levels from canon. Anything out of date is flagged.
- **"Story changed" cards:** decisions in conversation become "Lock this?" cards. Nothing changes without the writer.

### Idea generation: Problem → Options
1. Define the job: what the answer must accomplish, and what it must not do.
2. Generate wide, show narrow: brainstorm 10+ approaches drawn from the story's own material, and show the best 3, different in kind, each with what it gains and what it costs.
3. Judge them on four tests: caused by something already in the story, surprising, inevitable in hindsight, and it presses on the protagonist's flaw.
4. **Always include "Other."**
5. **Hold back the recommendation** until the writer asks for it. In the Last Resort test, the writer picked the "Recommended" option 4 out of 4 times, so the label anchors choices.
6. Don't lock until the writer says so.
7. **Connect new input to existing material,** like Last Resort's "the circuit is the mesh."

The bottle-label solution is the model: a mundane object planted in Act 1, paid off through memory, with thematic irony.

### Roll the dice
On one question, or on every open question at once. Each spin is a proposal: **Keep it** (tagged "rolled by AI, kept by you"), **Spin again** (avoiding earlier spins), **"I like it, but…"** (a steering note), or back to choosing yourself. Later: roll a whole step, and a creativity dial from safe to wild.

### Critique: on demand, not gated
Quick checks flag problems in place, and a table read (on request) gives at most 5 producer-level notes. There are no approval gates.

### The fast path: concept to draft in about an hour
Pitch → story frame and about 4 questions written for this idea → spine → movements and beats → open questions → scenes → pages → export.

### Later: storyboard and render
Scenes become shot lists, and shot lists become storyboard frames, with two-way sync between storyboard and script.

---

## Part 5 — Test log
- **Test 1, The Revisionist** (Problem → Options on three open problems): every pick reused material the story had already planted. Writer verdict: "the kind of help I'm looking for." This test added the always-offer-Other rule.
- **Test 2, Last Resort** (a raw logline): the spine and 6 movements took two exchanges. The writer's own additions were stronger and stranger than the generated options, which confirms the engine's job is to **catch and connect** the writer's ideas more than to originate them.
- **Test 3, the prototype review:** added roll the dice.

## Part 6 — Changes from the working-prototype reviews
- **A guided workflow:** a numbered stepper with plain-English explanations and a "Yes, on to…" card at the end of every step. A first-run guide, help on the conversation box, and example prompts that change with the step. (Dan: without these "there's no implied workflow.")
- **A progress meter** for big AI jobs, driven by the streamed answer.
- **Export:** PDF, Word, Final Draft, Fountain, and a development package for critique from another AI. Backup and restore, and import of an existing script for diagnosis.
- **Pages view in standard screenplay layout.**
- **A story frame instead of an intake form.** The AI suggests genre and blend, tone, rating, runtime and structure lens from the pitch, and the writer adjusts them. Structure models act as a lens on the Beats step (On track, Early, Late, Weak or Missing), not as a template.
- **Claude only, with the user's own Anthropic API key, for the standalone app.**
