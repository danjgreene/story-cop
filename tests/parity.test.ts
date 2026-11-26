// @vitest-environment jsdom
//
// Parity: the new modular app must behave exactly like the prototype.
// Both apps run side by side in a simulated browser with the same fake Claude.
// A script clicks through the whole workflow in both (pitch, questions, build,
// steps, options, chat, lock, roll the dice, zoom out, undo, scenes, pages,
// export, frame, import) and after every step checks that:
//   - the screen is identical (the full HTML of the app),
//   - the prompt sent to Claude is identical, word for word, with the same model tier,
//   - any saved file is identical, byte for byte.
import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest';
import { loadPrototype, fakeClaude, seeded, blobBytes, type Prototype, type FakeClaude } from './helpers/prototype';
import { respond } from './fixtures/responses';

interface World {
  name: string;
  doc: Document;
  claude: FakeClaude;
  ev?: (code: string) => any;
}

const tick = () => new Promise((r) => setTimeout(r, 0));
async function settle() { for (let i = 0; i < 8; i++) await tick(); }

function findButton(w: World, match: string | RegExp): HTMLElement {
  const els = [...w.doc.querySelectorAll('button, label.btn')] as HTMLElement[];
  const hit = els.find((b) => { const t = (b.textContent || '').trim(); return typeof match === 'string' ? t === match : match.test(t); });
  if (!hit) throw new Error(`[${w.name}] no button matching ${match}. Buttons: ${els.map((b) => JSON.stringify((b.textContent || '').trim())).join(', ')}`);
  return hit;
}
function click(w: World, match: string | RegExp) { findButton(w, match).click(); }
function type(w: World, id: string, value: string) {
  const el = w.doc.getElementById(id) as HTMLInputElement;
  if (!el) throw new Error(`[${w.name}] no field #${id}`);
  el.value = value;
  el.dispatchEvent(new w.doc.defaultView.Event('input'));
  el.dispatchEvent(new w.doc.defaultView.Event('change'));
}
const html = (w: World) => w.doc.getElementById('app').innerHTML;

let proto: Prototype;
let P: World;
let N: World;

beforeAll(async () => {
  // The prototype, untouched.
  const pc = fakeClaude(respond);
  proto = loadPrototype({ claude: pc });
  P = { name: 'prototype', doc: proto.win.document, claude: pc, ev: proto.ev };

  // The new app, in this test's own browser.
  const nc = fakeClaude(respond);
  Math.random = seeded(1);
  vi.spyOn(Date.prototype, 'toLocaleDateString').mockReturnValue('11/25/2026');
  localStorage.clear();
  (window as any).claude = { use: nc.use };
  document.body.innerHTML = '<div id="app"></div>';
  const { start } = await import('../src/app');
  start();
  N = { name: 'new app', doc: document, claude: nc };
  await settle();
});
afterAll(() => { vi.restoreAllMocks(); proto?.win.close(); });

// Do the same thing to both apps, wait for any AI job to finish, then compare.
async function both(fn: (w: World) => void | Promise<void>) {
  await fn(P); await fn(N);
  await settle();
}
function sameScreen(label: string) {
  expect(html(N), `screen differs after: ${label}`).toBe(html(P));
}
function samePrompts(count: number) {
  expect(N.claude.prompts.length, 'number of prompts sent').toBe(P.claude.prompts.length);
  expect(P.claude.prompts.length).toBe(count);
  const p = P.claude.prompts[count - 1], n = N.claude.prompts[count - 1];
  expect(n.prompt).toBe(p.prompt);
  expect(n.opts).toEqual(p.opts);
}
async function sameSaved(count: number) {
  expect(N.claude.saved.length).toBe(P.claude.saved.length);
  expect(P.claude.saved.length).toBe(count);
  const p = P.claude.saved[count - 1], n = N.claude.saved[count - 1];
  expect(n.filename).toBe(p.filename);
  const bytes = async (d: any) => typeof d === 'string' ? new TextEncoder().encode(d) : d instanceof Uint8Array || (d && d.byteLength !== undefined && !d.arrayBuffer) ? new Uint8Array(d) : blobBytes(d);
  expect(Buffer.from(await bytes(n.data)).equals(Buffer.from(await bytes(p.data))), 'saved file differs: ' + p.filename).toBe(true);
}

describe('the new app matches the prototype, screen for screen', () => {
  let prompts = 0, saved = 0;

  it('starts on the same home screen', () => { sameScreen('start'); });

  it('pitch → opening questions', async () => {
    await both((w) => { type(w, 'pt', 'Last Resort'); type(w, 'pi', 'Two freebie hunters drive to Canada for a free TV and end up owning a crime ring.'); click(w, 'Start developing'); });
    samePrompts(++prompts); sameScreen('kickoff');
  });

  it('answer questions (a pick, an Other, two skipped) → build the story', async () => {
    await both((w) => { click(w, /^GaryHe signs/); type(w, 'ko1', 'A polite Canadian hacker collective'); });
    sameScreen('answers');
    await both((w) => click(w, 'Build the story'));
    samePrompts(++prompts); sameScreen('built: spine');
  });

  it('walks the steps: spine → movements → beats', async () => {
    await both((w) => click(w, 'Yes, on to Movements →')); sameScreen('movements');
    await both((w) => click(w, 'Yes, on to Beats →')); sameScreen('beats');
  });

  it('structure check', async () => {
    await both((w) => click(w, 'Check the beats'));
    samePrompts(++prompts); sameScreen('structure check');
  });

  it('open questions: options, "What would you do?", pick one', async () => {
    await both((w) => click(w, /^Yes, on to the open questions/)); sameScreen('questions');
    await both((w) => click(w, 'Work on this'));
    samePrompts(++prompts); sameScreen('options');
    await both((w) => click(w, 'What would you do?')); sameScreen('pick shown');
    await both((w) => click(w, /^The fine print clause/)); sameScreen('resolved');
  });

  it('chat → "Lock this?" cards → accept one, dismiss one', async () => {
    await both((w) => { type(w, 'composer', 'What if Donna signs instead of Gary? And drop the drug mule idea.'); click(w, 'Send'); });
    samePrompts(++prompts); sameScreen('chat reply');
    await both((w) => click(w, 'Lock it')); sameScreen('locked');
    await both((w) => click(w, 'Not yet')); sameScreen('dismissed');
  });

  it('roll the dice: spin, spin again, "I like it, but…", keep it', async () => {
    await both((w) => click(w, 'Roll the dice'));
    samePrompts(++prompts); sameScreen('spin 1');
    await both((w) => click(w, 'Spin again'));
    samePrompts(++prompts); sameScreen('spin 2');
    await both((w) => click(w, 'I like it, but…')); sameScreen('steer box');
    await both((w) => { type(w, 'steer', 'keep the hitman, but make him Canadian'); click(w, 'Spin with this'); });
    samePrompts(++prompts); sameScreen('spin 3');
    await both((w) => click(w, 'Keep it')); sameScreen('kept');
  });

  it('canon tabs', async () => {
    for (const t of [/^Locked \(/, 'Audience', 'Dead', /^Open \(/]) { await both((w) => click(w, t)); sameScreen('tab ' + t); }
  });

  it('zoom out, then undo', async () => {
    await both((w) => click(w, 'Zoom out (canon changed)'));
    samePrompts(++prompts); sameScreen('zoomed out');
    await both((w) => click(w, 'Undo')); sameScreen('undone');
    await both((w) => click(w, 'Zoom out (canon changed)'));
    samePrompts(++prompts); sameScreen('zoomed out again');
  });

  it('scenes → pages', async () => {
    await both((w) => click(w, /^5Scenes/)); sameScreen('scenes step');
    await both((w) => click(w, 'Build the scene list'));
    samePrompts(++prompts); sameScreen('scene list');
    await both((w) => click(w, 'Yes, on to Pages →')); sameScreen('pages step');
    await both((w) => click(w, 'Write pages'));
    samePrompts(++prompts); sameScreen('pages written');
    await both((w) => click(w, /^Next: movement 2/)); sameScreen('movement 2');
    await both((w) => click(w, 'Write pages'));
    samePrompts(++prompts); sameScreen('movement 2 written');
  });

  it('chips, help and the guide', async () => {
    await both((w) => click(w, '?')); sameScreen('help open');
    await both((w) => click(w, 'Punch up the dialogue')); sameScreen('chip');
    await both((w) => click(w, 'How this works')); sameScreen('guide');
    await both((w) => click(w, 'Got it')); sameScreen('guide closed');
  });

  it('export panel: every file saved is identical', async () => {
    await both((w) => click(w, 'Export & save')); sameScreen('export panel');
    await both((w) => type(w, 'author', 'Dan Greene'));
    for (const b of ['PDF', 'Word (.docx)', 'Final Draft + Fountain (.zip)', 'Fountain (.txt)', 'Download the package (.md)', 'Everything as one package (.zip)']) {
      await both((w) => click(w, b));
      await sameSaved(++saved);
    }
    sameScreen('after saving');
    await both((w) => click(w, 'Close')); sameScreen('export closed');
  });

  it('story frame panel', async () => {
    await both((w) => (w.doc.querySelector('[title="Edit the story frame"]') as HTMLElement).click()); sameScreen('frame panel');
    await both((w) => { type(w, 'f-g2', 'Thriller'); }); sameScreen('second genre');
    await both((w) => click(w, 'Save frame')); sameScreen('frame saved');
  });

  it('back to Stories, load the sample, delete a story', async () => {
    await both((w) => click(w, '‹ Stories')); sameScreen('home with a story');
    await both((w) => click(w, 'Load Last Resort (sample)')); sameScreen('sample loaded');
    await both((w) => click(w, '‹ Stories'));
    await both((w) => click(w, 'Delete')); sameScreen('confirm delete');
    await both((w) => click(w, 'Tap again to delete')); sameScreen('deleted');
  });

  it('import an existing script', async () => {
    await both((w) => { type(w, 'impt', 'The Revisionist'); type(w, 'impx', IMPORT_SCRIPT); click(w, 'Analyze and bring it in'); });
    samePrompts(++prompts); sameScreen('imported');
    await both((w) => click(w, /^(6|✓)Pages/)); sameScreen('imported pages');
  });

  it('saved data is identical too', () => {
    expect(N.doc.defaultView.localStorage.getItem('storycop.v1')).toBe(P.doc.defaultView.localStorage.getItem('storycop.v1'));
  });
});

const IMPORT_SCRIPT = `Title: The Revisionist
Author: Someone

INT. ARCHIVE - NIGHT

CASSIAN (40s) edits a history book with a red pen.

CASSIAN
Nobody will notice.

EXT. CITY SQUARE - DAY

The statues have changed overnight.

INT. CASSIAN'S APARTMENT - NIGHT

Cassian finds his own name erased from his diploma.`;
