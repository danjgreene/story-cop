// The pitch screen: the editor's read, the story frame, and the opening questions.
import { normFrame } from '../story/frame';
import { buildFromKick } from '../ai/tasks';
import { UI } from './state';
import { h } from './dom';
import { render } from './refresh';
import { major, progCard } from './progress';
import { status } from './common';
import { frameFields } from './framePanel';

export function kick() {
  const k = UI.kick;
  if (major()) return h('div', { class: 'home' }, h('div', null, h('div', { class: 'label' }, 'Pitch'), h('div', { class: 'title' }, k.title || 'Untitled')), progCard());
  return h('div', { class: 'home' },
    h('div', null, h('div', { class: 'label' }, 'Pitch'), h('div', { class: 'title' }, k.title || 'Untitled'), h('div', { class: 'muted' }, k.idea)),
    h('div', { class: 'card ed' }, h('div', { class: 'label', style: 'margin-bottom:4px' }, 'My read'), k.read),
    h('div', { class: 'card', style: 'display:flex;flex-direction:column;gap:10px' }, h('div', { class: 'label' }, 'Story frame'), h('div', { class: 'small muted' }, 'My best guess from your pitch. Change anything that\'s off.'), frameFields(UI.kFrame || (UI.kFrame = normFrame({})))),
    h('div', { class: 'hint' }, 'Answer the questions that matter to you. Each answer reshapes the movie. When you\'re done, I\'ll draft the spine, movements and beats in one pass.'),
    k.questions.map((q, i) => h('div', { class: 'card', style: 'display:flex;flex-direction:column;gap:8px' },
      h('div', { style: 'font-weight:600' }, (i + 1) + '. ' + q.q),
      (q.options || []).map((o) => h('button', { type: 'button', class: 'opt' + (UI.kAns[q.id] === o.label && !(UI.kOther[q.id] || '').trim() ? ' on' : ''), onclick: () => { UI.kAns[q.id] = UI.kAns[q.id] === o.label ? null : o.label; UI.kOther[q.id] = ''; render(); } }, h('b', null, o.label), h('span', { class: 'small muted' }, o.note))),
      h('label', { for: 'ko' + i, class: 'small muted' }, 'Other: your own answer'),
      h('input', { id: 'ko' + i, value: UI.kOther[q.id] || '', placeholder: 'Type your own…', oninput: (e) => { UI.kOther[q.id] = e.target.value; } }))),
    h('div', { class: 'muted small' }, 'Skip any question and the AI rolls the dice on it. Its choice is tagged so you can revisit it.'),
    h('div', { class: 'row' }, h('button', { type: 'button', class: 'btn amber', disabled: !!UI.busy, onclick: buildFromKick }, 'Build the story'), h('button', { type: 'button', class: 'btn', onclick: () => { UI.view = 'home'; render(); } }, 'Back'), status()));
}
