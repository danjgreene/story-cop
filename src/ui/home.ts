// The Stories screen: pitch a new idea, import a script, open or back up stories.
import { DB, saveDB } from '../story/db';
import { makeStory } from '../story/store';
import { SEED } from '../story/samples';
import { backup, restoreFile } from '../story/backup';
import { startKick, importScript } from '../ai/tasks';
import { loadScriptFile } from '../import/loadScript';
import { UI } from './state';
import { h } from './dom';
import { render } from './refresh';
import { major, progCard } from './progress';
import { micBtn, status } from './common';
import { openSettings } from './settings';
import { inClaude } from '../platform/claude';
import { hasKey } from '../platform/settings';

let confirmDel: string | null = null;

// Outside Claude: a prompt to add an API key, or a quiet link to Settings once there is one.
function keyCard() {
  if (hasKey()) return h('div', { class: 'row small muted', style: 'gap:6px' }, 'Using your Anthropic API key.', h('button', { type: 'button', class: 'link small', onclick: openSettings }, 'Settings'));
  return h('div', { class: 'card', style: 'display:flex;flex-direction:column;gap:8px;border-color:#4A3A1E' },
    h('div', { class: 'label', style: 'color:#E8A33D' }, 'First: connect to Claude'),
    h('div', { class: 'small' }, 'The story editor needs your own Anthropic API key. It takes a minute to set up, and it\'s separate from a Claude.ai subscription.'),
    h('div', null, h('button', { type: 'button', class: 'btn amber', onclick: openSettings }, 'Add your API key')));
}

export function home() {
  const stories = Object.values(DB.stories);
  return h('div', { class: 'home' },
    h('div', null, h('div', { class: 'title', style: 'font-size:22px' }, 'Story COP'), h('div', { class: 'muted' }, 'From a one-line idea to pages, with a story editor beside you.')),
    inClaude() ? null : keyCard(),
    h('div', { class: 'card', style: 'display:flex;flex-direction:column;gap:10px' },
      h('div', { class: 'label' }, 'New idea'),
      h('label', { for: 'pt', class: 'small muted' }, 'Working title'),
      h('input', { id: 'pt', value: UI.pTitle, placeholder: 'e.g. Last Resort', oninput: (e) => { UI.pTitle = e.target.value; } }),
      h('label', { for: 'pi', class: 'small muted' }, 'The idea: as rough or as detailed as you have it'),
      h('div', { class: 'row', style: 'align-items:flex-start;flex-wrap:nowrap' }, h('textarea', { id: 'pi', placeholder: 'Pitch it like you would across a table…', oninput: (e) => { UI.pIdea = e.target.value; } }, UI.pIdea), micBtn('pi')),
      h('div', { class: 'muted small' }, 'Next: I\'ll ask you about four questions that shape the movie, then draft the spine, movements and beats.'),
      h('div', { class: 'row' }, h('button', { type: 'button', class: 'btn amber', disabled: !!UI.busy, onclick: startKick }, 'Start developing'), status())),
    major() ? progCard() : null,
    h('div', { class: 'card', style: 'display:flex;flex-direction:column;gap:10px' },
      h('div', { class: 'label' }, 'Bring in an existing script'),
      h('div', { class: 'small muted' }, 'Upload a Fountain, Final Draft (.fdx) or text file, or paste the script. I\'ll read it, map its spine, movements and beats, flag the biggest problems as open questions, and split your pages so you can keep developing it here. For a PDF, copy its text and paste it in.'),
      h('label', { for: 'impfile', class: 'small muted' }, 'Script file'),
      h('input', { id: 'impfile', type: 'file', accept: '.fountain,.fdx,.txt,.md,.spmd', onchange: (e) => { const f = e.target.files && e.target.files[0]; if (f) loadScriptFile(f); } }),
      h('label', { for: 'impt', class: 'small muted' }, 'Title'),
      h('input', { id: 'impt', value: UI.impTitle, placeholder: 'Script title', oninput: (e) => { UI.impTitle = e.target.value; } }),
      h('label', { for: 'impx', class: 'small muted' }, 'Or paste the script' + (UI.impText ? ' (' + Math.round(UI.impText.length / 1000) + 'k characters loaded)' : '')),
      h('textarea', { id: 'impx', placeholder: 'INT. SOMEWHERE - NIGHT…', style: 'min-height:120px;font-family:Courier Prime,Courier,monospace', oninput: (e) => { UI.impText = e.target.value; } }, UI.impText),
      h('div', { class: 'row' }, h('button', { type: 'button', class: 'btn amber', disabled: !!UI.busy, onclick: importScript }, 'Analyze and bring it in'), h('span', { class: 'small muted' }, 'A feature script takes a couple of minutes.'))),
    h('div', { class: 'card', style: 'display:flex;flex-direction:column;gap:8px' },
      h('div', { class: 'label' }, 'Your stories'),
      stories.length ? stories.map((s) => h('div', { class: 'row li', style: 'justify-content:space-between' },
        h('button', { type: 'button', class: 'link', style: 'color:#ECE6DA;font-weight:600', onclick: () => { DB.current = s.id; saveDB(); UI.view = 'cop'; UI.opts = {}; UI.activeQ = null; UI.roll = null; render(); } }, s.title),
        h('span', { class: 'small muted' }, 'v' + (s.version || 1) + ' · ' + s.open.length + ' open'),
        h('button', { type: 'button', class: 'link grey small', onclick: () => { if (confirmDel === s.id) { delete DB.stories[s.id]; if (DB.current === s.id) DB.current = null; saveDB(); confirmDel = null; } else confirmDel = s.id; render(); } }, confirmDel === s.id ? 'Tap again to delete' : 'Delete'))) : h('div', { class: 'muted' }, 'None yet.'),
      h('div', { class: 'row' },
        h('button', { type: 'button', class: 'btn', disabled: !stories.length, onclick: () => backup(DB.stories, 'Story-COP-backup-' + new Date().toISOString().slice(0, 10) + '.json') }, 'Back up all stories'),
        h('label', { class: 'btn', style: 'display:inline-flex;align-items:center;cursor:pointer;position:relative' }, 'Restore from a backup', h('input', { type: 'file', accept: '.json', style: 'position:absolute;inset:0;opacity:0;cursor:pointer', onchange: (e) => { const f = e.target.files && e.target.files[0]; if (f) restoreFile(f); } }))),
      status(),
      h('div', null, h('button', { type: 'button', class: 'btn', onclick: () => { makeStory({ ...JSON.parse(JSON.stringify(SEED)), reviewed: { spine: true, movements: true, beats: true } }, 'Last Resort', 'Last Resort is loaded where we left it. The spine, movements and beats are reviewed, so you\'re on step 4: the open questions. Pick one in the middle to work on it, or roll the dice on all of them.'); UI.view = 'cop'; UI.zoom = 'questions'; UI.opts = {}; UI.activeQ = null; render(); } }, 'Load Last Resort (sample)'))));
}
