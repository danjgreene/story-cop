// Dictation (speech to text). The mic button only appears when it's available.
import { use } from './claude';
import { render } from '../ui/refresh';

export const speech: { dict: any; state: string; target: HTMLInputElement | HTMLTextAreaElement | null; base: string } = { dict: null, state: 'idle', target: null, base: '' };

export function initSpeech() {
  use('dictation').then((d) => {
    speech.dict = d; if (!d) return;
    const put = (t) => { if (!speech.target) return; speech.target.value = t; speech.target.dispatchEvent(new Event('input')); };
    d.onPartial(({ text }) => put(speech.base + (speech.base && text ? ' ' : '') + text));
    d.onFinal(({ text }) => { speech.base = speech.base + (speech.base && text ? ' ' : '') + text; put(speech.base); });
    d.onState(({ state }) => { speech.state = state; document.querySelectorAll('.mic').forEach((b) => { b.classList.toggle('on', state === 'listening'); b.setAttribute('aria-label', state === 'listening' ? 'Stop dictation' : 'Dictate'); }); });
    render();
  }).catch(() => {});
}
