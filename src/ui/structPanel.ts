// The structure lens: checks the beats against a classic model. A check, not a template.
import type { Story } from '../story/types';
import { MODELS, STATLBL } from '../story/frame';
import { checkStructure } from '../ai/tasks';
import { UI } from './state';
import { h } from './dom';
import { focusComposer } from './common';

export function structPanel(st: Story) {
  const sel = UI.lens || (st.frame && st.frame.structure !== 'none' && st.frame.structure) || 'three-act'; const sc = st.structCheck;
  return h('div', { class: 'card', style: 'display:flex;flex-direction:column;gap:10px;max-width:820px' },
    h('div', { class: 'row', style: 'justify-content:space-between' }, h('div', { class: 'label', style: 'color:#E8A33D' }, 'Structure lens'),
      h('div', { class: 'row' }, h('label', { for: 'lens', class: 'small muted' }, 'Check against'),
        h('select', { id: 'lens', style: 'width:auto', onchange: (e) => { UI.lens = e.target.value; } }, Object.entries(MODELS).filter(([k]) => k !== 'none').map(([k, m]) => h('option', { value: k, selected: k === sel }, m.label))),
        h('button', { type: 'button', class: 'btn', disabled: !!UI.busy, onclick: () => checkStructure(UI.lens || sel) }, sc ? 'Check again' : 'Check the beats'))),
    sc ? [sc.stale ? h('div', { class: 'small', style: 'color:#E8A33D' }, 'The beats have changed since this check. Run it again.') : null,
      h('div', null, h('b', null, MODELS[sc.model].label + ': '), sc.summary),
      h('div', { style: 'display:flex;flex-direction:column;gap:6px' }, sc.items.map((it) => h('div', { class: 'row', style: 'flex-wrap:nowrap;align-items:flex-start;gap:10px' },
        h('span', { class: 'stat stat-' + it.status }, STATLBL[it.status]),
        h('div', { style: 'flex:1' }, h('b', { style: 'font-weight:600' }, it.beat + (it.n ? ' · beat ' + it.n : '')), it.note ? h('div', { class: 'small muted' }, it.note) : null),
        it.status !== 'ok' ? h('button', { type: 'button', class: 'link small', onclick: () => focusComposer('Structure (' + MODELS[sc.model].label + '): "' + it.beat + '" is ' + STATLBL[it.status].toLowerCase() + '. ' + it.note + ' How should we fix it?') }, 'Fix this') : null)))]
      : h('div', { class: 'small muted' }, 'See how your beats line up with a classic structure. It\'s a lens, not a rulebook: it flags beats that are missing, early, late or weak, and you decide what to do about them.'));
}
