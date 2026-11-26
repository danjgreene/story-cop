// Fountain: parsing screenplay text into elements, and the plain-text export.
// Copied unchanged from the prototype; protected by tests/exporters.test.ts.
import type { Story } from '../story/types';

export const fileBase = (s: string) => (s || 'Untitled').replace(/[^\w\- ]+/g, '').trim().replace(/\s+/g, '-') || 'Untitled';
export function scriptText(st: Story) { return st.movements.map((m, i) => (st.pages[i + 1] || '').trim()).filter(Boolean).join('\n\n'); }
export function fountainDoc(st: Story) { return 'Title: ' + st.title + '\nCredit: Written by\nAuthor: ' + (st.author || '') + '\nDraft date: ' + new Date().toLocaleDateString() + '\n\n' + scriptText(st) + '\n'; }

export function parseFountain(txt: string): { t: string; x: string }[] {
  const L = String(txt).replace(/\r/g, '').split('\n'); const out = []; let i = 0;
  const isScene = (s) => /^(\.(?!\.)|(INT|EXT|EST|INT\.?\/EXT|I\/E)[\.\s])/i.test(s);
  const isTrans = (s) => /^[A-Z0-9 .\-']+TO:$/.test(s) || (/^>/.test(s) && !/<$/.test(s));
  const isChar = (s) => (/^@/.test(s)) || (/^[A-Z0-9][A-Z0-9 .\-'’#&]*(\s*\(.*\))?\s*\^?$/.test(s) && /[A-Z]/.test(s) && s.length < 42);
  const clean = (s) => s.replace(/\*{1,3}|(^|\s)_|_(\s|$)/g, '$1$2');
  while (i < L.length) {
    const s = L[i].trim(); if (!s) { i++; continue; }
    const prevBlank = i === 0 || !L[i - 1].trim(); const nextBlank = !L[i + 1] || !L[i + 1].trim();
    if (prevBlank && isScene(s)) { out.push({ t: 'scene', x: s.replace(/^\./, '').toUpperCase() }); i++; continue; }
    if (/^>.*<$/.test(s)) { out.push({ t: 'center', x: clean(s.replace(/^>\s*|\s*<$/g, '')) }); i++; continue; }
    if (prevBlank && nextBlank && isTrans(s)) { out.push({ t: 'trans', x: s.replace(/^>\s*/, '') }); i++; continue; }
    if (prevBlank && !nextBlank && isChar(s)) {
      out.push({ t: 'char', x: s.replace(/^@/, '') }); i++;
      while (i < L.length && L[i].trim()) { const d = L[i].trim(); out.push({ t: /^\(.*\)$/.test(d) ? 'paren' : 'dial', x: clean(d) }); i++; }
      continue;
    }
    const buf = []; while (i < L.length && L[i].trim()) { buf.push(clean(L[i].trim().replace(/^!/, ''))); i++; }
    out.push({ t: 'action', x: buf.join('\n') });
  }
  return out;
}
