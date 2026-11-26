// Talking to Claude. ask() builds the full prompt (editor brief + story state +
// task + answer shape) and reads the JSON back; run() wraps a job with the busy
// state, progress meter and plain-English errors.
import type { Story } from '../story/types';
import { cur } from '../story/db';
import { frameText } from '../story/frame';
import { UI } from '../ui/state';
import { render } from '../ui/refresh';
import { updateProg } from '../ui/progress';
import { use, inClaude } from '../platform/claude';
import { loadSettings } from '../platform/settings';
import { makeApiSampler } from './anthropic';
import { EDITOR } from './prompts';

export function compact(st: Story) {
  return { title: st.title, storyFrame: st.frame ? frameText(st.frame) : undefined, logline: st.logline, tone: st.tone, runtimeMinutes: st.runtime, spine: st.spine,
    movements: st.movements.map((m, i) => ({ movement: i + 1, title: m.title, time: m.time, summary: m.summary, feel: m.feel, beats: m.beats })),
    LOCKED: st.locked.map((l) => l.text + (l.by === 'ai' ? ' [rolled by AI, kept by writer]' : '')),
    OPEN: st.open.map((o) => ({ id: o.id, question: o.q, mustAccomplish: o.job })), DEAD: st.dead, audienceLedger: st.ledger,
    recentConversation: (st.chat || []).filter((m) => m.who !== 'system').slice(-8).map((m) => ({ who: m.who, text: m.text })) };
}
export function parseJ(t: any) {
  const x = String(t || '').replace(/```(?:json)?/gi, ''); const a = x.indexOf('{'), b = x.lastIndexOf('}');
  if (a < 0 || b < a) throw { message: 'The editor answered in a form I couldn\'t read. Try again.' };
  try { return JSON.parse(x.slice(a, b + 1)); } catch (e) { throw { message: 'The editor answered in a form I couldn\'t read. Try again.' }; }
}
// The exact text sent to Claude for a task.
export function fullPrompt(task: string, schema: string, raw: boolean, st: Story | null) {
  return EDITOR + (st ? '\n\nSTORY STATE (JSON):\n' + JSON.stringify(compact(st)) : '') + '\n\nTASK:\n' + task +
    (raw ? '' : '\n\nReturn ONLY one JSON object, with no code fences and no commentary, in this shape:\n' + schema);
}

// Which way to reach Claude: the writer's own API key if they've added one,
// otherwise the artifact's 'sample' capability when running inside Claude.
let sampleP: Promise<any> | null = null;
async function sampler() {
  if (loadSettings().apiKey) return makeApiSampler();
  if (!inClaude()) throw { code: 'no_key' };
  if (!sampleP) sampleP = use('sample');
  const s = await sampleP; if (!s) throw { code: 'unavailable' };
  return s;
}
export async function ask(task: string, schema: string, tier?: string, raw?: boolean): Promise<any> {
  const s = await sampler();
  const st = cur();
  const prompt = fullPrompt(task, schema, raw, st);
  const r = await s(prompt, { modelTier: tier || 'default', cache: false, onText: ({ text }) => { UI.progText = text || ''; updateProg(); } });
  return raw ? String(r.text || '') : parseJ(r.text);
}

let progTimer: any = null;
export async function run(label: string, fn: () => Promise<void>, prog?: any) {
  if (UI.busy) return; UI.busy = label; UI.err = ''; UI.prog = { ...(prog || { minor: true }), start: Date.now() }; UI.progText = ''; render();
  progTimer = setInterval(updateProg, 1000);
  try { await fn(); } catch (e) {
    UI.err = e && e.code === 'no_key' ? 'Add your Anthropic API key in Settings to use the AI.' : e && e.code === 'not_granted' ? 'Claude access wasn\'t granted for this page.' : e && e.code === 'rate_limited' ? 'Rate limited. Give it a minute, then try again.' : e && e.code === 'unavailable' ? 'Claude isn\'t available in this view. Open this page inside Claude to use the AI.' : (e && e.message) || 'Something went wrong. Try again.';
  }
  clearInterval(progTimer); UI.busy = ''; UI.prog = null; render();
}
