// Export and save: screenplay files, the package for another AI, backups.
import type { Story } from '../story/types';
import { saveDB } from '../story/db';
import { backup } from '../story/backup';
import { fileBase, fountainDoc } from '../export/fountain';
import { makePDF } from '../export/pdf';
import { makeDOCX } from '../export/docx';
import { devPackage } from '../export/devPackage';
import { scriptZip, allZip } from '../export/bundles';
import { saveFile, copyText } from '../platform/files';
import { UI } from './state';
import { h } from './dom';
import { render } from './refresh';
import { status } from './common';

export function exportPanel(st: Story) {
  const n = Object.keys(st.pages || {}).filter((k) => st.pages[k]).length, total = st.movements.length, base = fileBase(st.title), has = n > 0;
  const btn = (label, fn, cls?, dis?) => h('button', { type: 'button', class: 'btn ' + (cls || ''), disabled: !!dis, onclick: fn }, label);
  return h('div', { class: 'card', style: 'display:flex;flex-direction:column;gap:14px;border-color:#4A3A1E;max-width:780px' },
    h('div', { class: 'row', style: 'justify-content:space-between' }, h('div', { style: 'font-weight:700;font-size:16px' }, 'Export and save'), h('button', { type: 'button', class: 'link grey', onclick: () => { UI.exportOpen = false; render(); } }, 'Close')),
    h('div', { style: 'display:flex;flex-direction:column;gap:8px' },
      h('div', { class: 'label' }, 'The screenplay'),
      h('div', { class: 'small muted' }, has ? (n < total ? 'Only ' + n + ' of ' + total + ' movements have pages so far. Exports include what\'s written.' : 'All ' + total + ' movements are written.') : 'No pages yet. Write pages in step 6 first.'),
      h('label', { for: 'author', class: 'small muted' }, 'Name for the title page'),
      h('input', { id: 'author', value: st.author || '', placeholder: 'Your name', style: 'max-width:320px', oninput: (e) => { st.author = e.target.value; saveDB(); } }),
      h('div', { class: 'row' },
        btn('PDF', () => saveFile(base + '.pdf', makePDF(st)), 'amber', !has),
        btn('Word (.docx)', () => saveFile(base + '.docx', makeDOCX(st)), '', !has),
        btn('Final Draft + Fountain (.zip)', () => saveFile(base + '-script.zip', scriptZip(st, base)), '', !has),
        btn('Fountain (.txt)', () => saveFile(base + '.fountain.txt', fountainDoc(st)), '', !has)),
      h('div', { class: 'small muted' }, 'Final Draft opens the .fdx. Highland, WriterSolo and Fade In open the Fountain file. If you download the .txt version, rename it to .fountain.')),
    h('div', { style: 'display:flex;flex-direction:column;gap:8px;border-top:1px solid #2A2A2A;padding-top:12px' },
      h('div', { class: 'label' }, 'Package it for another AI'),
      h('div', { class: 'small muted' }, 'One file with everything (spine, beats, canon, open questions, scenes and pages) plus instructions asking for an honest development critique. Drop it into ChatGPT, Gemini or another Claude chat.'),
      h('div', { class: 'row' }, btn('Download the package (.md)', () => saveFile(base + '-development.md', devPackage(st))), btn('Copy it to the clipboard', () => copyText(devPackage(st))))),
    h('div', { style: 'display:flex;flex-direction:column;gap:8px;border-top:1px solid #2A2A2A;padding-top:12px' },
      h('div', { class: 'label' }, 'Save the project'),
      h('div', { class: 'small muted' }, 'Your stories save automatically in this browser. Back up to keep a copy safe or move it to another computer, then restore it from the Stories screen.'),
      h('div', { class: 'row' }, btn('Back up this story (.json)', () => backup({ [st.id]: st }, base + '-storycop.json')), btn('Everything as one package (.zip)', () => saveFile(base + '-all.zip', allZip(st, base, has))))),
    status());
}
