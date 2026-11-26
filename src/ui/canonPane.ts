// The right pane: canon (Locked, Open, Audience, Dead).
import type { Story } from '../story/types';
import { selectQ } from '../ai/tasks';
import { UI } from './state';
import { h } from './dom';
import { render } from './refresh';

export function canonPane(st: Story) {
  const T = [['locked', 'Locked (' + st.locked.length + ')'], ['open', 'Open (' + st.open.length + ')'], ['audience', 'Audience'], ['dead', 'Dead']];
  let body;
  if (UI.tab === 'locked') body = st.locked.map((l) => h('div', { class: 'li' }, h('span', { class: 'tag ' + l.by }, l.by === 'ai' ? 'ROLLED' : 'YOU'), l.text));
  else if (UI.tab === 'open') body = st.open.length ? st.open.map((o) => h('button', { type: 'button', class: 'qopen' + (UI.activeQ === o.id ? ' on' : ''), disabled: !!UI.busy, onclick: () => selectQ(o.id) }, h('div', { style: 'font-weight:600' }, o.q), o.affects ? h('div', { class: 'small muted' }, o.affects) : null)) : h('div', { class: 'muted' }, 'No open questions. Zoom out, build scenes, or riff on something new.');
  else if (UI.tab === 'audience') body = [h('div', { class: 'small muted' }, 'Who knows what, and when.'), st.ledger.map((r) => h('div', { class: 'card', style: 'padding:10px 12px' }, h('b', { class: 'small' }, r.at), h('div', { class: 'small' }, h('span', { style: 'color:#E8A33D' }, 'Audience: '), r.aud), h('div', { class: 'small' }, h('span', { style: 'color:#7FB2E5' }, 'Characters: '), r.them)))];
  else body = st.dead.length ? st.dead.map((d) => h('div', { class: 'li muted', style: 'text-decoration:line-through' }, d)) : h('div', { class: 'muted' }, 'Nothing killed yet.');
  return h('aside', { class: 'pane right', 'aria-label': 'Canon' }, h('div', { class: 'label' }, 'Canon'),
    h('div', { class: 'seg', role: 'group', 'aria-label': 'Canon section' }, T.map(([id, l]) => h('button', { type: 'button', class: UI.tab === id ? 'on' : '', 'aria-pressed': UI.tab === id ? 'true' : 'false', onclick: () => { UI.tab = id; render(); } }, l))), body);
}
