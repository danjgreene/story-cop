// The middle pane: the step-by-step path (Spine → … → Pages), the story at
// the current step, and the "Yes, on to…" card at the bottom.
import type { Story } from '../story/types';
import { mutate } from '../story/store';
import { startRoll, zoomOut, buildScenes, writePages, selectQ } from '../ai/tasks';
import { UI } from './state';
import { h } from './dom';
import { render } from './refresh';
import { major, progCard } from './progress';
import { focusComposer } from './common';
import { exportPanel } from './exportPanel';
import { framePanel } from './framePanel';
import { structPanel } from './structPanel';
import { screenplayView } from './screenplay';

const STEPS = [['spine', 'Spine'], ['movements', 'Movements'], ['beats', 'Beats'], ['questions', 'Questions'], ['scenes', 'Scenes'], ['pages', 'Pages']];
function stepInfo(st: Story, id: string) {
  const rv = st.reviewed || {};
  if (['spine', 'movements', 'beats'].includes(id)) return rv[id] ? { done: true, s: 'Reviewed' } : { done: false, s: st.stale ? 'Draft · needs a refresh' : 'Draft ready to review' };
  if (id === 'questions') return st.open.length ? { done: false, s: st.open.length + ' open' } : { done: true, s: 'All answered' };
  if (id === 'scenes') return !st.scenes.length ? { done: false, s: 'Not built yet' } : st.scenesStale ? { done: false, s: 'Needs a rebuild' } : rv.scenes ? { done: true, s: st.scenes.length + ' scenes · reviewed' } : { done: false, s: st.scenes.length + ' scenes to review' };
  const n = Object.keys(st.pages || {}).length, t = st.movements.length;
  return { done: n >= t && t > 0, s: n ? n + ' of ' + t + ' movements written' : 'Not written yet' };
}
function go(id: string) { UI.zoom = id; render(); const c = document.querySelector('.center'); if (c) c.scrollTop = 0; }
function approve(id: string, next: string) { mutate('Reviewed: ' + id, (st) => { st.reviewed = st.reviewed || {}; st.reviewed[id] = true; }); go(next); }
function nextCard(st: Story) {
  const B2 = (label, onclick, cls?) => h('button', { type: 'button', class: 'btn ' + (cls || ''), disabled: !!UI.busy, onclick }, label);
  const card = (q, ...btns) => h('div', { class: 'next' }, h('div', { style: 'font-weight:600' }, q), h('div', { class: 'row' }, btns));
  const z = UI.zoom, n = st.open.length;
  if (z === 'spine') return card('Does the spine feel right?', B2('Change something', () => focusComposer('About the spine: ')), B2('Yes, on to Movements →', () => approve('spine', 'movements'), 'amber'));
  if (z === 'movements') return card('Do the movements hold up?', B2('Change something', () => focusComposer('About the movements: ')), B2('Yes, on to Beats →', () => approve('movements', 'beats'), 'amber'));
  if (z === 'beats') return card('Do the beats work?', B2('Change something', () => focusComposer('About the beats: ')), n ? B2('Yes, on to the open questions (' + n + ') →', () => approve('beats', 'questions'), 'amber') : B2('Yes, on to Scenes →', () => approve('beats', 'scenes'), 'amber'));
  if (z === 'questions') {
    if (st.stale) return card('You\'ve made decisions since the story was drafted. Fold them in before building scenes.', n ? B2('Roll the dice on the rest (' + n + ')', () => startRoll(st.open.map((o) => o.id)), 'teal') : null, B2('Zoom out: update the story', zoomOut, 'amber'));
    if (n) return card('Answer what you can. Anything still open stays flagged in the scenes.', B2('Roll the dice on all ' + n, () => startRoll(st.open.map((o) => o.id)), 'teal'), B2('Skip to Scenes →', () => go('scenes')));
    return card('Every question is answered.', B2('On to Scenes →', () => go('scenes'), 'amber'));
  }
  if (z === 'scenes') {
    if (!st.scenes.length || st.scenesStale) return card(st.scenesStale ? 'The story changed since these scenes were built.' : 'Ready to break the beats into about ' + Math.round(st.runtime / 1.8) + ' scenes?', B2(st.scenesStale ? 'Rebuild the scene list' : 'Build the scene list', buildScenes, 'amber'));
    return card('Do the scenes work?', B2('Rebuild', buildScenes), B2('Yes, on to Pages →', () => approve('scenes', 'pages'), 'amber'));
  }
  const m = UI.pageM, t = st.movements.length;
  if (!st.pages[m]) return card('Write the pages for movement ' + m + ', "' + ((st.movements[m - 1] || {} as any).title || '') + '"?', B2('Write pages', () => writePages(m), 'amber'));
  if (m < t) return card('Movement ' + m + ' is written.', B2('Rewrite', () => writePages(m)), B2('Next: movement ' + (m + 1) + ' →', () => { UI.pageM = m + 1; go('pages'); }, 'amber'));
  return card('That\'s the whole draft. Export it, package it for another AI, or keep giving notes.', B2('Rewrite this movement', () => writePages(m)), B2('Export & save →', () => { UI.exportOpen = true; render(); const c = document.querySelector('.center'); if (c) c.scrollTop = 0; }, 'amber'));
}
const HINT = {
  spine: ['Step 1 of 6 · Spine. ', 'The core of your movie: what your hero wants, what they really need, and what the story is arguing. Everything else is built from this, so get it right first.'],
  movements: ['Step 2 of 6 · Movements. ', 'The movie in big blocks, with run times and what the audience should feel in each one.'],
  beats: ['Step 3 of 6 · Beats. ', 'Every story event, in order. Each one should be caused by something that came before it.'],
  questions: ['Step 4 of 6 · Open questions. ', 'Decisions the story still needs. Pick one to work on: choose an option, write your own, or roll the dice and let me decide. When you\'ve answered some, zoom out to fold them into the story.'],
  scenes: ['Step 5 of 6 · Scenes. ', 'The beats broken into actual scenes, with a location and what happens in each, sized to your run time.'],
  pages: ['Step 6 of 6 · Pages. ', 'Screenplay pages, written one movement at a time from the scenes.']
};
export function centerPane(st: Story) {
  const stepper = h('nav', { 'aria-label': 'Development steps' }, h('div', { class: 'stepper' }, STEPS.map(([id, l], i) => { const inf = stepInfo(st, id);
    return h('button', { type: 'button', class: 'step' + (UI.zoom === id ? ' on' : ''), 'aria-current': UI.zoom === id ? 'step' : null, onclick: () => go(id) },
      h('span', { class: 'dot' + (inf.done ? ' done' : '') }, inf.done ? '✓' : String(i + 1)), h('span', null, h('span', { style: 'font-weight:600;display:block' }, l), h('span', { class: 's' }, inf.s))); })));
  const staleBar = st.stale && ['spine', 'movements', 'beats'].includes(UI.zoom) ? h('div', { class: 'stale' }, h('span', null, 'You\'ve made decisions since this was drafted, so it may be out of date.'), h('button', { type: 'button', class: 'btn amber', disabled: !!UI.busy, onclick: zoomOut }, 'Zoom out to update')) : null;
  let body;
  if (UI.zoom === 'spine') body = [h('div', { class: 'card' }, h('div', { class: 'label', style: 'color:#E8A33D' }, 'Logline'), h('div', { style: 'font-size:18px;line-height:1.5' }, st.logline)), h('div', { class: 'grid' }, st.spine.map((s) => h('div', { class: 'card' }, h('div', { class: 'label', style: 'color:#E8A33D' }, s.k), h('div', null, s.v))))];
  else if (UI.zoom === 'movements') body = h('div', { class: 'grid' }, st.movements.map((m, i) => h('div', { class: 'card', style: 'display:flex;flex-direction:column;gap:6px' }, h('div', { class: 'row', style: 'justify-content:space-between' }, h('b', null, (i + 1) + '. ' + m.title), h('span', { class: 'small muted' }, m.time + ' min')), h('div', null, m.summary), h('div', { class: 'small muted' }, 'Audience feels: ' + m.feel))));
  else if (UI.zoom === 'beats') { const tags = {}; (st.structCheck && !st.structCheck.stale ? st.structCheck.items : []).forEach((it) => { if (it.n) (tags[it.n] = tags[it.n] || []).push(it); });
    body = [structPanel(st), st.movements.map((m, i) => h('div', null, h('div', { style: 'font-weight:600;margin:6px 0' }, (i + 1) + '. ' + m.title + ' ', h('span', { class: 'small muted' }, m.time + ' min')), (m.beats || []).map((b) => h('div', { class: 'beat' }, h('span', { class: 'n' }, b.n), h('span', null, b.t, (tags[b.n] || []).map((it) => h('span', { class: 'stat stat-' + it.status, style: 'margin-left:8px;display:inline-block' }, it.beat)))))))]; }
  else if (UI.zoom === 'questions') body = st.open.length ? h('div', { style: 'display:flex;flex-direction:column;gap:8px;max-width:780px' }, st.open.map((o) => h('div', { class: 'card', style: 'display:flex;flex-direction:column;gap:6px' + (UI.activeQ === o.id ? ';border-color:#2F4A66' : '') },
      h('b', null, o.q), o.job ? h('div', { class: 'small muted' }, 'It must: ' + o.job) : null, o.affects ? h('div', { class: 'small muted' }, o.affects) : null,
      h('div', { class: 'row' }, h('button', { type: 'button', class: 'btn' + (UI.activeQ === o.id ? ' amber' : ''), disabled: !!UI.busy, onclick: () => selectQ(o.id) }, UI.activeQ === o.id ? 'Open in the editor ←' : 'Work on this'), h('button', { type: 'button', class: 'link teal', disabled: !!UI.busy, onclick: () => startRoll([o.id]) }, 'Roll the dice on it')))),
      h('div', { class: 'small muted' }, 'Options open in the editor on the left.'))
    : h('div', { class: 'muted' }, 'No open questions right now.');
  else if (UI.zoom === 'scenes') body = st.scenes.length ? st.movements.map((m, i) => h('div', null, h('div', { style: 'font-weight:600;margin:8px 0 4px' }, (i + 1) + '. ' + m.title), st.scenes.filter((s) => Number(s.m) === i + 1).map((s) => h('div', { class: 'beat' }, h('span', { class: 'n' }, s.n), h('span', null, h('b', { style: 'font-weight:600' }, s.slug), s.does ? ' · ' + s.does : '')))))
    : null;
  else body = [h('div', { class: 'row' }, h('span', { class: 'small muted' }, 'Movement:'), st.movements.map((m, i) => h('button', { type: 'button', class: 'btn' + (UI.pageM === i + 1 ? ' amber' : ''), onclick: () => { UI.pageM = i + 1; render(); } }, (i + 1) + '. ' + m.title + (st.pages[i + 1] ? ' ✓' : '')))),
    st.pages[UI.pageM] ? screenplayView(st.pages[UI.pageM]) : (st.scenes.length ? null : h('div', { class: 'small muted' }, 'Tip: build the scene list (step 5) first for tighter pages. You can also write straight from the beats.'))];
  const hint = HINT[UI.zoom];
  return h('main', { class: 'pane center' }, UI.exportOpen ? exportPanel(st) : null, UI.frameOpen ? framePanel(st) : null, stepper,
    major() ? progCard() : null,
    h('div', { class: 'hint' }, h('b', null, hint[0]), hint[1]),
    staleBar, body, major() ? null : nextCard(st));
}
