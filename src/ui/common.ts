// Small pieces shared by several screens.
import { UI } from './state';
import { h, svg, MIC } from './dom';
import { render } from './refresh';
import { major } from './progress';
import { speech } from '../platform/speech';

export function micBtn(id: string) {
  if (!speech.dict) return null;
  return h('button', { type: 'button', class: 'mic' + (speech.state === 'listening' ? ' on' : ''), 'aria-label': speech.state === 'listening' ? 'Stop dictation' : 'Dictate', onclick: () => {
    if (speech.state === 'listening') { speech.dict.stop().catch(() => {}); return; }
    const el = document.getElementById(id) as HTMLInputElement; speech.target = el; speech.base = el ? el.value : '';
    speech.dict.start().catch((e) => { if (e && e.code === 'not_granted') { speech.dict = null; render(); } });
  } }, svg(MIC));
}
export const status = () => [UI.busy && !major() ? h('div', { class: 'busy', role: 'status', id: 'busyt' }, UI.busy) : null, UI.err ? h('div', { class: 'err', role: 'alert' }, UI.err) : null, UI.note ? h('div', { class: 'busy', role: 'status' }, UI.note) : null];
export const focusComposer = (text?: string) => { if (text != null) UI.draft = text; render(); setTimeout(() => { const c = document.getElementById('composer') as HTMLInputElement; if (c) { c.focus(); c.setSelectionRange(c.value.length, c.value.length); } }, 0); };
