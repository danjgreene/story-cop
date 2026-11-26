// The story frame form (used on the pitch screen and in the header panel).
import type { Story } from '../story/types';
import { GENRES, TONES, RATINGS, MODELS, frameText } from '../story/frame';
import { mutate } from '../story/store';
import { UI } from './state';
import { h } from './dom';
import { render } from './refresh';

const fld = (label, input, id, help?) => h('div', { class: 'fld' }, h('label', { for: id, class: 'small muted' }, label), input, help ? h('div', { class: 'small muted' }, help) : null);
export function frameFields(f) {
  const bl = () => (f.genre || 'Main genre') + ' ' + f.blend + '% / ' + f.genre2 + ' ' + (100 - f.blend) + '%';
  const setBl = () => { const l = document.getElementById('f-bl'); if (l) l.textContent = bl(); };
  return h('div', { class: 'frame' },
    h('datalist', { id: 'dl-genres' }, GENRES.map((g) => h('option', { value: g }))), h('datalist', { id: 'dl-tones' }, TONES.map((g) => h('option', { value: g }))),
    fld('Main genre', h('input', { id: 'f-g', list: 'dl-genres', value: f.genre, oninput: (e) => { f.genre = e.target.value; setBl(); } }), 'f-g'),
    fld('Second genre (optional)', h('input', { id: 'f-g2', list: 'dl-genres', value: f.genre2, placeholder: 'None', onchange: (e) => { f.genre2 = e.target.value.trim(); render(); } }), 'f-g2'),
    f.genre2 ? fld('Blend', h('div', null, h('input', { id: 'f-b', type: 'range', min: '50', max: '90', step: '5', value: String(f.blend), style: 'padding:0', oninput: (e) => { f.blend = Number(e.target.value); setBl(); } }), h('div', { class: 'small', id: 'f-bl' }, bl())), 'f-b') : null,
    fld('Tone', h('input', { id: 'f-t', list: 'dl-tones', value: f.tone, oninput: (e) => { f.tone = e.target.value; } }), 'f-t'),
    fld('Rating', h('select', { id: 'f-r', onchange: (e) => { f.rating = e.target.value; } }, RATINGS.map((r) => h('option', { value: r, selected: r === f.rating }, r))), 'f-r'),
    fld('Runtime (minutes)', h('input', { id: 'f-rt', type: 'number', min: '60', max: '200', step: '5', value: String(f.runtime), oninput: (e) => { f.runtime = Number(e.target.value) || f.runtime; } }), 'f-rt'),
    fld('Structure lens', h('select', { id: 'f-s', onchange: (e) => { f.structure = e.target.value; } }, Object.entries(MODELS).map(([k, m]) => h('option', { value: k, selected: k === f.structure }, m.label))), 'f-s', 'Used to check the beats, not to force them.'));
}
export function framePanel(st: Story) {
  return h('div', { class: 'card', style: 'display:flex;flex-direction:column;gap:12px;border-color:#4A3A1E;max-width:820px' },
    h('div', { class: 'row', style: 'justify-content:space-between' }, h('div', { style: 'font-weight:700;font-size:16px' }, 'Story frame'), h('button', { type: 'button', class: 'link grey', onclick: () => { UI.frameOpen = false; render(); } }, 'Close')),
    h('div', { class: 'small muted' }, 'The basics the whole story is built inside. Changing them is a decision like any other: it\'s versioned, and Zoom out folds it into the story.'),
    frameFields(UI.fDraft),
    h('div', { class: 'row' }, h('button', { type: 'button', class: 'btn amber', onclick: () => {
      const f = { ...UI.fDraft, runtime: Math.min(200, Math.max(60, Number(UI.fDraft.runtime) || 100)) };
      mutate('Changed the story frame', (s2) => { s2.frame = f; s2.runtime = f.runtime; s2.stale = true; s2.chat.push({ who: 'system', text: 'Story frame: ' + frameText(f) + '. Zoom out to fold it into the story.' }); });
      UI.frameOpen = false; render();
    } }, 'Save frame'), h('button', { type: 'button', class: 'btn', onclick: () => { UI.frameOpen = false; render(); } }, 'Cancel')));
}
