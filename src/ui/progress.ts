// Progress meter for big AI jobs, driven by real signals from the streamed
// answer: sections ticked off as their JSON keys appear, scenes counted.
import { UI } from './state';
import { h } from './dom';

export const PROG = {
  kick: { steps: [['Reading your pitch', ''], ['Finding what drives the movie', '"read"'], ['Sketching the story frame', '"frame"'], ['Writing your questions', '"questions"']], est: 30 },
  build: { steps: [['Reading your answers', ''], ['Writing the spine', '"spine"'], ['Laying out the movements', '"movements"'], ['Writing the beats', '"beats"'], ['Finding open questions', '"open"'], ['Mapping what the audience knows', '"ledger"']], est: 90 },
  imp: { steps: [['Reading the script', ''], ['Finding the spine', '"spine"'], ['Mapping the movements', '"movements"'], ['Tracing the beats', '"beats"'], ['Finding the biggest problems', '"open"'], ['Writing the diagnosis', '"diagnosis"'], ['Splitting the pages by movement', '"movementStarts"']], est: 150 },
  zoom: { steps: [['Reading every decision', ''], ['Updating the spine', '"spine"'], ['Reworking the movements', '"movements"'], ['Rewriting the beats', '"beats"'], ['Updating the audience ledger', '"ledger"'], ['Summing up what changed', '"changed"']], est: 90 }
};
export function progState() {
  const P = UI.prog; if (!P) return null;
  const t = UI.progText && UI.progText !== 'Thinking...' ? UI.progText : ''; const el = Math.round((Date.now() - P.start) / 1000);
  const est = P.est ? ' · usually about ' + (P.est >= 60 ? Math.round(P.est / 60) + ' min' : P.est + ' s') : '';
  if (P.minor) return { el, pct: 0, stage: 0, meta: el + ' s' };
  if (P.steps) {
    let stage = 0; if (t) P.steps.forEach((s, i) => { if (s[1] && t.includes(s[1])) stage = i; });
    const pct = t ? (stage + 0.6) / P.steps.length : Math.min(0.1, el / 150);
    return { el, stage, pct: Math.min(0.97, pct), meta: el + ' s elapsed' + est };
  }
  const c = t ? (t.match(P.re) || []).length : 0;
  return { el, stage: c, pct: Math.min(0.97, t ? Math.max(0.05, c / P.total) : Math.min(0.06, el / 150)), meta: (t ? P.unit + ' ' + Math.min(c, P.total) + ' of ~' + P.total : 'Thinking it through') + ' · ' + el + ' s' + est };
}
export function updateProg() {
  const s = progState(); if (!s) return;
  const f = document.getElementById('pfill'); if (f) f.style.width = Math.round(s.pct * 100) + '%';
  const m = document.getElementById('pmeta'); if (m) m.textContent = s.meta;
  const b = document.getElementById('busyt'); if (b) b.textContent = UI.busy + ' ' + s.el + ' s';
  if (UI.prog.steps) UI.prog.steps.forEach((x, i) => { const li = document.getElementById('ps' + i); if (li) li.className = i < s.stage ? 'done' : i === s.stage ? 'now' : ''; });
}
export function progCard() {
  const P = UI.prog; const s = progState();
  return h('div', { class: 'card prog', role: 'status', 'aria-live': 'polite' },
    h('div', { class: 'label', style: 'color:#6FC7B8' }, 'Working on it'),
    h('div', { style: 'font-weight:600;font-size:16px' }, UI.busy),
    h('div', { class: 'bar' }, h('div', { class: 'fill', id: 'pfill', style: 'width:' + Math.round(s.pct * 100) + '%' })),
    P.steps ? h('ol', { class: 'ps' }, P.steps.map((x, i) => h('li', { id: 'ps' + i, class: i < s.stage ? 'done' : i === s.stage ? 'now' : '' }, x[0]))) : null,
    h('div', { class: 'small muted', id: 'pmeta' }, s.meta));
}
export const major = () => UI.prog && !UI.prog.minor;
