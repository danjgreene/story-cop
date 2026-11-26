// Creating stories and changing them. Every change goes through mutate(), which
// snapshots the story first so Undo can step back (up to 30 steps).
import type { Story } from './types';
import { DB, saveDB, cur } from './db';
import { uid } from '../util/id';
import { normFrame } from './frame';
import { UI } from '../ui/state';
import { render } from '../ui/refresh';

export function makeStory(j: any, fallbackTitle?: string, intro?: string): Story {
  const st: Story = { id: uid(), title: j.title || fallbackTitle || 'Untitled', logline: j.logline || '', tone: j.tone || '', runtime: Number(j.runtime) || 100, spine: j.spine || [], movements: j.movements || [],
    locked: [...(j.locked || []).map((t) => ({ id: uid(), text: t, by: 'you' })), ...(j.rolled || []).map((t) => ({ id: uid(), text: t, by: 'ai' }))],
    open: (j.open || []).map((o) => ({ id: uid(), q: o.q, job: o.job || '', affects: o.affects || '' })), dead: j.dead || [], ledger: j.ledger || [],
    scenes: [], pages: {}, chat: intro ? [{ who: 'editor', text: intro }] : [], stale: false, version: 1, history: [], reviewed: j.reviewed || {}, seenGuide: false, frame: j.frame ? normFrame(j.frame) : null };
  DB.stories[st.id] = st; DB.current = st.id; saveDB(); return st;
}

// ---------- versioning ----------
export function mutate(label: string, fn: (st: Story) => void) {
  const st = cur(); if (!st) return;
  const copy = JSON.parse(JSON.stringify(st)); delete copy.history;
  st.history = st.history || []; st.history.push({ label, data: copy }); if (st.history.length > 30) st.history.shift();
  fn(st); st.version = (st.version || 1) + 1; saveDB(); render();
}
export function undo() {
  const st = cur(); if (!st || !st.history || !st.history.length) return;
  const last = st.history.pop(); const restored = { ...last.data, history: st.history, version: (st.version || 1) + 1 };
  restored.chat = (restored.chat || []).concat([{ who: 'system', text: 'Undid: ' + last.label }]);
  DB.stories[st.id] = restored; saveDB(); UI.roll = null; render();
}
