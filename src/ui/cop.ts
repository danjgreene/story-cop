// The main workspace: header, then the three panes (editor, story, canon).
import { cur, saveDB } from '../story/db';
import { undo } from '../story/store';
import { normFrame, frameText } from '../story/frame';
import { zoomOut, startRoll } from '../ai/tasks';
import { UI } from './state';
import { h, svg, DICE } from './dom';
import { render } from './refresh';
import { editorPane } from './editorPane';
import { centerPane } from './centerPane';
import { canonPane } from './canonPane';

export function cop() {
  const st = cur(); const openIds = st.open.map((o) => o.id);
  return h('div', { class: 'app' },
    h('header', null,
      h('button', { type: 'button', class: 'link grey', onclick: () => { UI.view = 'home'; render(); } }, '‹ Stories'),
      h('span', { class: 'title' }, st.title), h('button', { type: 'button', class: 'link small', style: 'color:#A39E94', title: 'Edit the story frame', onclick: () => { UI.frameOpen = !UI.frameOpen; UI.fDraft = normFrame(st.frame, st); render(); const c = document.querySelector('.center'); if (c) c.scrollTop = 0; } }, (st.frame ? frameText(st.frame) : 'Set the story frame') + '  ✎'),
      h('span', { style: 'flex:1' }),
      h('span', { class: 'muted small' }, 'v' + (st.version || 1)),
      h('button', { type: 'button', class: 'btn', onclick: () => { st.seenGuide = false; saveDB(); render(); } }, 'How this works'),
      h('button', { type: 'button', class: 'btn', onclick: () => { UI.exportOpen = !UI.exportOpen; UI.note = ''; UI.err = ''; render(); const c = document.querySelector('.center'); if (c) c.scrollTop = 0; } }, 'Export & save'),
      h('button', { type: 'button', class: 'btn', disabled: !(st.history && st.history.length) || !!UI.busy, onclick: undo }, 'Undo'),
      h('button', { type: 'button', class: 'btn' + (st.stale ? ' amber' : ''), disabled: !!UI.busy, onclick: zoomOut }, st.stale ? 'Zoom out (canon changed)' : 'Zoom out'),
      h('button', { type: 'button', class: 'btn teal', disabled: !!UI.busy || !openIds.length, onclick: () => startRoll(openIds), style: 'display:flex;gap:8px;align-items:center' }, svg(DICE), 'Roll the dice')),
    h('div', { class: 'body' }, editorPane(st), centerPane(st), canonPane(st)));
}
