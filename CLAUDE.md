# Story COP

Concept-to-screenplay development tool for one writer (Dan Greene). Its eventual goal: idea → developed story → screenplay → storyboard → rendered movie.

## Read first
1. `docs/migration-brief.md`: the plan for turning the prototype into an app. **Start here.**
2. `docs/engine-concept.md`: the product thinking (why it's a "Story COP" and not a pipeline), and the test log.
3. `docs/test-last-resort.md`: the test story, which is also the built-in sample.
4. `prototype/index.html`: the working prototype. A single file that runs as a Claude artifact.

## Ground rules
- **The prompts are the product.** Port `EDITOR`, `STORY_RULES`, `SCH.*` and every task prompt word for word. Change them only on purpose, and re-run the quality check when you do.
- **Change behavior and change structure in separate steps.** The first port must match the prototype screen for screen.
- **Claude only, with the user's own API key.** No API key ever goes into the repo, logs or exports.
- **Nothing changes the writer's canon without their accept.** Every pick offers "Other." Hold back the AI's recommendation until it's asked for.
- **Exporters** (PDF, DOCX, FDX, Fountain, zip) are hand-written and already verified. Protect them with golden-file tests before refactoring them.
- **The user is a UX designer, not an engineer.** Explain changes in plain language and show him running builds.
