// THE PROMPTS ARE THE PRODUCT.
// Every word here is carried over from the prototype unchanged, and
// tests/parity.test.ts checks that each prompt sent to Claude is identical to
// what the prototype sends. Change them only on purpose, and re-run the quality
// check when you do.
import type { OpenQuestion, Movement, Scene } from '../story/types';

export const EDITOR = `You are the story editor inside "Story COP", a movie development tool, working one-on-one with a screenwriter.
The writer is the main source of ideas. Your job: catch their ideas, work out the mechanics, connect them to material already in the story, and generate strong options or committed answers when asked.
Craft principles:
- Spine before structure: the protagonist's want, need and flaw, and the theme as an argument, drive everything.
- Every beat is caused by something earlier, and the cause is visible.
- Prefer solutions built from material already in the story (planted objects, habits, relationships, the theme) over new devices. Aim for surprising but inevitable. Never reach for a convenient gadget, coincidence that rescues, or a cliché.
- LOCKED canon is absolute. DEAD ideas never come back in any form. OPEN questions are never silently resolved in beats or pages.
- Respect what the audience is supposed to know and when.
- Comedy comes from character under pressure; horror and thrillers from dread and reversal; drama from choices that cost something.
Voice: plain, punchy English, like a sharp development executive across the table. No jargon, no field names, no filler praise. Be honest when something doesn't work.`;

// The JSON shape each task must answer in.
export const SCH = {
  kick: '{"read":"1-2 sentences","frame":{"genre":"","genre2":"","blend":70,"tone":"","rating":"PG-13","runtime":100,"structure":"three-act"},"questions":[{"id":"k1","q":"question","options":[{"label":"short","note":"one line: what this choice makes the movie"}]}]}',
  story: '{"title":"","logline":"","tone":"","runtime":100,"spine":[{"k":"HERO WANTS","v":""}],"movements":[{"title":"","time":"0–12","summary":"","feel":"","beats":[{"n":1,"t":""}]}],"locked":[""],"rolled":[""],"open":[{"q":"","job":"","affects":"Affects beats 3, 9"}],"ledger":[{"at":"Beat 4: ...","aud":"","them":""}],"proposed":""}',
  chat: '{"reply":"","changes":[{"kind":"lock|open|kill|resolve","text":"","resolves":"OPEN id or empty"}],"affects":""}',
  opts: '{"job":"","options":[{"label":"","text":"","gain":"","cost":""}],"pick":{"index":0,"why":""}}',
  roll: '{"fills":[{"id":"OPEN id","text":""}],"connection":""}',
  refresh: '{"logline":"","tone":"","runtime":100,"spine":[{"k":"","v":""}],"movements":[{"title":"","time":"","summary":"","feel":"","beats":[{"n":1,"t":""}]}],"ledger":[{"at":"","aud":"","them":""}],"changed":[""]}',
  imp: '{"title":"","logline":"","tone":"","runtime":100,"spine":[{"k":"","v":""}],"movements":[{"title":"","time":"","summary":"","feel":"","beats":[{"n":1,"t":""}]}],"locked":[""],"open":[{"q":"","job":"","affects":""}],"ledger":[{"at":"","aud":"","them":""}],"frame":{"genre":"","genre2":"","blend":70,"tone":"","rating":"R","runtime":110,"structure":"three-act"},"diagnosis":"","movementStarts":["INT. EXACT SLUGLINE - DAY"]}',
  struct: '{"items":[{"beat":"Catalyst","n":4,"status":"ok|early|late|weak|missing","note":""}],"summary":""}',
  scenes: '{"scenes":[{"n":1,"m":1,"slug":"INT. LOCATION - DAY","does":""}]}'
};

export const STORY_RULES = `- "logline": 1-2 sentences. "tone": a few words. "runtime": minutes.
- "spine": 6-8 items, labels in caps (e.g. HERO WANTS, HERO NEEDS, FLAW, THEME, CENTRAL QUESTION, ENDING), values 1-2 sentences, using character names (placeholder names are fine).
- "movements": 5-7 blocks covering the runtime, each with "time" in minutes like "0–12", a 1-2 sentence "summary", what the audience "feel"s, and "beats" (24-32 beats total, numbered across the whole film, one sentence each with the cause visible). Prefix the midpoint beat with "MIDPOINT:", the low point with "LOW POINT:", the last with "FINAL IMAGE:".
- "ledger": 3-5 key moments of what the audience knows vs. what the protagonists know.`;

// ---------- task prompts ----------

export const kickPrompt = (title: string, idea: string) =>
  `The writer is pitching a new movie.\nTITLE: ${title || '(none)'}\nIDEA: ${idea || '(title only)'}\n\n1) "read": 1-2 plain sentences naming what drives this movie (its engine), as you see it.\n2) "questions": exactly 4 questions whose answers would most reshape THIS movie (not a generic survey). Each has 3 options that are different in kind, each with a one-line note. Do not mark any option as recommended. Don't ask about genre, tone, rating, runtime or structure; those go in the frame.\n3) "frame": your best guess from the pitch at the main genre, an optional second genre with "blend" = the main genre's share (50-90), tone, rating (G, PG, PG-13, R, NC-17, Unrated), runtime in minutes, and a structure lens (one of: three-act, save-the-cat, heros-journey, five-act, story-circle, sequences).`;

export const kickAnswers = (questions: any[], kAns: Record<string, any>, kOther: Record<string, string>) =>
  questions.map((q) => { const a = (kOther[q.id] || '').trim() || kAns[q.id]; return `Q: ${q.q}\nA: ${a ? a : 'SKIPPED. The writer is rolling the dice: decide this yourself and list your choice in "rolled".'}`; }).join('\n\n');

export const buildPrompt = (k: { title: string; idea: string; read: string }, answers: string, frame: string) =>
  `The writer pitched:\nTITLE: ${k.title || '(none)'}\nIDEA: ${k.idea}\n\nYour read: ${k.read}\n\nTheir answers to your opening questions:\n${answers}\n\nSTORY FRAME (set by the writer; follow it): ${frame}. The runtime governs the movement timings. Use the structure lens only as a light guide: cause and effect come first.\n\nBuild the first development pass. Spine first: decide the protagonist's want, need and flaw and the theme as an argument, then build the structure from them.\n${STORY_RULES}\n- "locked": the writer's decisions so far (from the idea and their answers) as short statements.\n- "rolled": your decisions for any SKIPPED questions.\n- "open": 3-5 genuine open questions the story still needs answered, each with what the answer must accomplish and which beats it affects. Reference them as open in the beats; don't answer them.\n- "proposed": one bold connection or turn you'd suggest, built from the story's own material (or empty).`;

export const chatPrompt = () =>
  `The writer's latest message is the last item in recentConversation. Respond as their story editor.\n- "reply": at most 3 short paragraphs. Catch the idea, work out its mechanics, say what it changes or breaks, and look for a link to material already in the story. If they ask a question, answer it. If they say "zoom out", tell them to press Zoom out. End with at most one question.\n- "changes": only decisions the WRITER made or clearly endorsed in this message, as proposed canon updates. kind "lock" = a new fact/decision; "resolve" = it answers an OPEN question (put that id in "resolves"); "open" = a new unanswered question they raised; "kill" = an idea they rejected. Never include your own suggestions. Empty list if none.\n- "affects": which movements/beats this touches, or "".`;

export const optionsPrompt = (o: OpenQuestion) =>
  `Open question (id ${o.id}): "${o.q}"${o.job ? '\nIt must: ' + o.job : ''}\nRun Problem → Options:\n- "job": one sentence on what the answer must accomplish and must not do, given the canon and audience ledger.\n- Brainstorm at least 10 approaches internally, drawing mostly on material already in the story. Return only the best 3 in "options", different in kind. Each: a short "label", "text" (1-2 sentences, fleshed out), "gain" (one line), "cost" (one line).\n- "pick": your own preference (index 0-2) and one sentence why. It stays hidden unless the writer asks.`;

export function rollPrompt(qs: OpenQuestion[], prev: { fills: { id: string; text: string }[] }[], note: string) {
  const last = prev[prev.length - 1];
  const list = qs.map((o) => `- id ${o.id}: ${o.q}${o.job ? ' (must: ' + o.job + ')' : ''}`).join('\n');
  let extra = '';
  if (note && last) extra = `\nThe writer liked parts of your last spin but wants changes.\nLAST SPIN:\n${last.fills.map((f) => '- ' + f.id + ': ' + f.text).join('\n')}\nTHEIR NOTE: "${note}"\nKeep what they liked, change what they named.`;
  else if (prev.length) extra = `\nThe writer passed on these earlier spins. Do something genuinely different in kind:\n${prev.flatMap((p) => p.fills.map((f) => '- ' + f.text)).join('\n')}`;
  return `The writer doesn't know, and is handing these open questions to you (roll the dice):\n${list}\nFor EACH one, commit to an answer and flesh it out in 2-3 vivid sentences. Not a menu, a decision. Build from the story's own material; surprising but inevitable; it should make the protagonist's flaw hurt.${extra}\n"connection": one sentence on how these answers connect to each other or the theme (or "").`;
}

export const zoomOutPrompt = () =>
  `Zoom out. Regenerate the logline, tone, runtime, spine, movements (with beats) and audience ledger so they fully incorporate every LOCKED decision (including rolled ones) and the recent conversation. Keep what already works; change only what the canon requires. OPEN questions stay open: reference them as open, don't answer them. Never use DEAD ideas.\n${STORY_RULES}\n- "changed": 2-5 short bullets on what changed in this pass.`;

export const scenesPrompt = (n: number, runtime: number) =>
  `Break the beats into a scene list of about ${n} scenes for a ${runtime}-minute film. Each scene: "n" (running number), "m" (movement number, from 1), "slug" (INT./EXT. LOCATION - DAY/NIGHT), "does" (one short sentence: what happens and how the scene turns). Every beat is covered; open questions stay open.`;

export const pagesPrompt = (m: number, mv: Movement, sc: Scene[]) =>
  `Write the screenplay pages for movement ${m}, "${mv.title}" (${mv.time} min).\n${sc.length ? 'Its scenes:\n' + sc.map((s) => `${s.n}. ${s.slug}: ${s.does}`).join('\n') : 'Its beats:\n' + mv.beats.map((b) => b.n + '. ' + b.t).join('\n')}\nWrite in strict Fountain plain text, standard screenplay format: each scene heading in caps on its own line (INT./EXT. LOCATION - DAY/NIGHT) with a blank line before it; action in present tense, only what the camera sees and hears; each speaking character's name in CAPS on its own line with a blank line before it, then any parenthetical on its own line in (parentheses), then the dialogue on the line(s) directly below with NO blank line in between; transitions like CUT TO: in caps on their own line. Never put dialogue on the same line as the name. No markdown, bold, asterisks or scene numbers. Dialogue with subtext; no on-the-nose exposition. Honor LOCKED canon; keep OPEN questions unresolved. Return ONLY the Fountain text.`;

export const importPrompt = (title: string, txt: string, cut: boolean) =>
  `The writer imported an existing screenplay or draft, titled "${title}". Reverse-engineer its development so they can keep working on it here, then give an honest diagnosis.\nSCRIPT:\n<<<\n${txt}\n>>>\n${cut ? '(The script was cut off here because of length.)\n' : ''}\nDescribe the story as the script actually has it, not as it should be.\n${STORY_RULES}\n- "locked": what the script firmly establishes (premise, characters, key events), as short statements.\n- "open": the 3-6 biggest problems or unresolved questions, phrased as questions the writer must answer, each with what the answer must accomplish and which beats it affects.\n- "frame": the script's genre (and optional second genre with the main genre's share, 50-90), tone, rating, runtime in minutes (about a minute per page), and the structure it most resembles (three-act, save-the-cat, heros-journey, five-act, story-circle, sequences).\n- "diagnosis": an honest 3-5 sentence read: what works, what doesn't, and the single biggest thing to fix.\n- "movementStarts": for each movement, the scene heading in the script where it begins, copied exactly.`;

export const structurePrompt = (M: { label: string; beats: string[] }) =>
  `Check the beat sheet against the ${M.label} structure. Its beats, with their typical place in the runtime:\n${M.beats.map((b) => '- ' + b).join('\n')}\nFor each model beat, give the number of the story beat that serves it ("n", or null if none), and a status: "ok" (present and well placed), "early", "late", "weak" (present but doesn't do the job), or "missing". Judge timing from the movements' minute ranges. "note": one plain, specific sentence. This is a lens, not a rulebook: if the story deliberately breaks the model and it works, mark it "ok" and say why.\n"summary": 2-3 honest sentences on whether the structure holds, and the one fix that matters most.`;
