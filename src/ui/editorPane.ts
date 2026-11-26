// The left pane: the conversation with the story editor, the open-question
// options, the roll-the-dice panel, and the message box.
import type { Story } from '../story/types';
import { saveDB } from '../story/db';
import { send, applyChange, dismissChange, selectQ, resolveQ, startRoll, spin, keepRoll } from '../ai/tasks';
import { UI } from './state';
import { h } from './dom';
import { render } from './refresh';
import { micBtn, status, focusComposer } from './common';

export function editorPane(st: Story) {
  const msgs = st.chat.map((m) => {
    if (m.who === 'you') return h('div', { class: 'you' }, m.text);
    if (m.who === 'system') return h('div', { class: 'chg' + (m.by === 'ai' ? ' ai' : '') }, h('div', { class: 'label', style: 'color:' + (m.by === 'ai' ? '#6FC7B8' : '#E8A33D') }, m.by === 'ai' ? 'Story changed · rolled by AI, kept by you' : 'Story changed'), h('div', null, m.text));
    return h('div', { style: 'display:flex;flex-direction:column;gap:8px' }, h('div', { class: 'label' }, 'Editor'), h('div', { class: 'ed' }, m.text),
      m.affects ? h('div', { class: 'small muted' }, m.affects) : null,
      (m.changes || []).map((c) => h('div', { class: 'chg' },
        h('div', { class: 'label', style: 'color:#E8A33D' }, c.kind === 'kill' ? 'Kill this idea?' : c.kind === 'open' ? 'New open question?' : c.kind === 'resolve' ? 'Answers an open question. Lock it?' : 'Lock this?'),
        h('div', null, c.text),
        c.state === 'pending' ? h('div', { class: 'row' }, h('button', { type: 'button', class: 'btn amber', onclick: () => applyChange(c) }, c.kind === 'kill' ? 'Kill it' : c.kind === 'open' ? 'Add question' : 'Lock it'), h('button', { type: 'button', class: 'btn', onclick: () => dismissChange(c) }, 'Not yet')) : h('div', { class: 'small muted' }, c.state === 'accepted' ? 'Done' : 'Dismissed'))));
  });
  const guide = st.seenGuide ? null : h('div', { class: 'guide' },
    h('div', { class: 'label', style: 'color:#7FB2E5' }, 'How this works'),
    h('ol', null,
      h('li', null, h('b', null, 'Follow the steps across the top of the middle panel: '), 'Spine → Movements → Beats → Questions → Scenes → Pages. The first three are already drafted. Read each one and press its "Yes, on to…" button when it feels right.'),
      h('li', null, h('b', null, 'Talk to me in the box below, any time. '), 'Pitch an idea, ask a question, or give a note. When you make a decision, I\'ll offer a "Lock this?" card. Nothing changes until you accept it.'),
      h('li', null, h('b', null, 'Don\'t know? Roll the dice '), 'and I\'ll decide for you. You can spin again, or say "I like it, but…". Undo steps back from anything.')),
    h('div', null, h('button', { type: 'button', class: 'btn', onclick: () => { st.seenGuide = true; saveDB(); render(); } }, 'Got it')));
  const CHIPS = { spine: ['Sharpen the hero\'s flaw', 'What is the theme really arguing?', 'Make the ending hurt more'], movements: ['Where does it sag?', 'Is the midpoint big enough?'], beats: ['Which beat feels unearned?', 'Where\'s the weakest cause-and-effect link?'], questions: ['Which question matters most?', 'Talk me through the clause idea'], scenes: ['Which scene could we cut?', 'Is the opening scene strong enough?'], pages: ['Punch up the dialogue', 'Is this too on-the-nose?'] };
  const chips = (CHIPS[UI.zoom] || []).map((c) => h('button', { type: 'button', class: 'chip', onclick: () => focusComposer(c) }, c));
  return h('section', { class: 'pane left', 'aria-label': 'Story editor' },
    h('div', { class: 'label' }, 'Story editor'), msgs, guide, questionPanel(st), rollPanel(st), status(),
    h('div', { style: 'flex:1' }),
    h('div', { style: 'position:sticky;bottom:0;background:#131313;padding-top:10px;display:flex;flex-direction:column;gap:8px;border-top:1px solid #242424' },
      h('div', { class: 'row', style: 'justify-content:space-between' },
        h('label', { for: 'composer', style: 'font-weight:600;font-size:13px' }, 'Talk to your story editor'),
        h('button', { type: 'button', class: 'qmark', 'aria-label': 'What is this box for?', 'aria-expanded': UI.showHelp ? 'true' : 'false', title: 'Pitch an idea, ask a question, or give a note. Decisions become “Lock this?” cards.', onclick: () => { UI.showHelp = !UI.showHelp; render(); } }, '?')),
      UI.showHelp ? h('div', { class: 'help' }, 'This is a conversation with your story editor. You can ', h('b', null, 'pitch an idea'), ' (“What if Donna signs instead of Gary?”), ', h('b', null, 'ask a question'), ' (“Why does the midpoint feel weak?”), or ', h('b', null, 'give a note'), ' (“Make Polly funnier”). I\'ll work it through with you. Any decision you make shows up as a “Lock this?” card, and nothing in the story changes until you accept it. Press the mic to talk instead of typing.') : null,
      chips.length ? h('div', { class: 'row', style: 'gap:6px' }, h('span', { class: 'small muted' }, 'Try:'), chips) : null,
      h('div', { class: 'row', style: 'flex-wrap:nowrap' }, micBtn('composer'),
        h('input', { id: 'composer', value: UI.draft, placeholder: 'Pitch an idea, ask a question, or give a note…', oninput: (e) => { UI.draft = e.target.value; }, onkeydown: (e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); } } }),
        h('button', { type: 'button', class: 'btn amber', disabled: !!UI.busy, onclick: send }, 'Send'))));
}
function questionPanel(st: Story) {
  const o = st.open.find((x) => x.id === UI.activeQ); if (!o || (UI.roll && UI.roll.spins.length)) return null;
  const op = UI.opts[o.id];
  return h('div', { class: 'qa' },
    h('div', { class: 'row', style: 'justify-content:space-between' }, h('div', { class: 'label', style: 'color:#7FB2E5' }, 'Open question'), h('button', { type: 'button', class: 'link grey small', onclick: () => { UI.activeQ = null; render(); } }, 'Close')),
    h('div', { style: 'font-weight:600;font-size:15px' }, o.q),
    op ? [h('div', { class: 'small muted' }, 'Must: ' + (op.job || o.job)),
      (op.options || []).map((x) => h('button', { type: 'button', class: 'opt', onclick: () => resolveQ(o.id, x.label + ': ' + x.text, 'you') }, h('b', null, x.label), h('span', null, x.text), h('span', { class: 'small muted', style: 'display:block;margin-top:4px' }, 'Gains: ' + x.gain + ' · Costs: ' + x.cost))),
      h('label', { for: 'other', class: 'small muted' }, 'Other: your own idea'),
      h('div', { class: 'row', style: 'flex-wrap:nowrap' }, h('input', { id: 'other', value: UI.other, placeholder: 'Type or dictate it…', oninput: (e) => { UI.other = e.target.value; } }), micBtn('other'), h('button', { type: 'button', class: 'btn', onclick: () => { if (UI.other.trim()) resolveQ(o.id, UI.other.trim(), 'you'); } }, 'Use mine')),
      h('div', { class: 'row', style: 'gap:18px' },
        h('button', { type: 'button', class: 'link', onclick: () => { UI.showPick = true; render(); } }, 'What would you do?'),
        h('button', { type: 'button', class: 'link teal', disabled: !!UI.busy, onclick: () => startRoll([o.id]) }, 'I don\'t know. Roll the dice on this one')),
      UI.showPick && op.pick && op.options && op.options[op.pick.index] ? h('div', { class: 'small', style: 'border-top:1px solid #2A2A2A;padding-top:8px' }, 'I\'d go with ' + op.options[op.pick.index].label + '. ' + (op.pick.why || '')) : null,
      h('button', { type: 'button', class: 'link grey small', disabled: !!UI.busy, onclick: () => { delete UI.opts[o.id]; selectQ(o.id); } }, 'New options')]
      : h('div', { class: 'small muted' }, UI.busy ? 'Working…' : ''));
}
function rollPanel(st: Story) {
  const R = UI.roll; if (!R || !R.spins.length) return null; const s = R.spins[R.spins.length - 1];
  const qOf = (id) => (st.open.find((o) => o.id === id) || {} as any).q || '';
  return h('div', { class: 'roll' },
    h('div', { class: 'label', style: 'color:#6FC7B8' }, 'Roll the dice · spin ' + R.spins.length),
    h('div', { class: 'small', style: 'color:#C9D6D3' }, (s.fills.length > 1 ? 'I filled in all ' + s.fills.length + ' open questions.' : 'I filled this one in.') + ' Nothing is locked until you keep it.'),
    s.note ? h('div', { class: 'small', style: 'color:#6FC7B8' }, 'Steered by your note: “' + s.note + '”') : null,
    s.fills.map((f) => h('div', { style: 'border-top:1px solid #24403C;padding-top:8px' }, h('div', { class: 'small muted' }, qOf(f.id)), h('div', null, f.text))),
    s.connection ? h('div', { class: 'small', style: 'color:#C9D6D3;border-top:1px solid #24403C;padding-top:8px' }, 'How it connects: ' + s.connection) : null,
    h('div', { class: 'row' },
      h('button', { type: 'button', class: 'btn tealfill', disabled: !!UI.busy, onclick: keepRoll }, 'Keep it'),
      h('button', { type: 'button', class: 'btn teal', disabled: !!UI.busy, onclick: () => spin('') }, 'Spin again'),
      h('button', { type: 'button', class: 'btn', onclick: () => { UI.butOpen = !UI.butOpen; render(); } }, 'I like it, but…')),
    UI.butOpen ? [h('label', { for: 'steer', class: 'small muted' }, 'What should the next spin keep or change?'),
      h('div', { class: 'row', style: 'flex-wrap:nowrap' }, h('input', { id: 'steer', value: UI.steer, placeholder: 'e.g. keep the hitman, but make him Canadian', oninput: (e) => { UI.steer = e.target.value; } }), micBtn('steer'),
        h('button', { type: 'button', class: 'btn teal', disabled: !!UI.busy, onclick: () => { const n = UI.steer.trim(); if (!n) return; UI.steer = ''; UI.butOpen = false; spin(n); } }, 'Spin with this'))] : null,
    h('button', { type: 'button', class: 'link grey small', onclick: () => { UI.roll = null; render(); } }, 'Back to choosing myself'));
}
