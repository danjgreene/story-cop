// Settings: the writer's Anthropic API key and which model does which job.
// Only shown outside Claude; inside Claude the artifact uses the writer's subscription.
import { loadSettings, saveSettings, forgetKey, maskKey, DEFAULT_TIERS, KNOWN_MODELS, EFFORTS, type Settings, type Tier } from '../platform/settings';
import { testConnection } from '../ai/anthropic';
import { UI } from './state';
import { h } from './dom';
import { render } from './refresh';

const TIER_INFO: [Tier, string, string][] = [
  ['complex', 'Big jobs', 'Building the story, zoom out, options, rolling the dice, scenes, pages, import and the structure check. Use your strongest model here.'],
  ['default', 'Conversation', 'Your opening questions and the conversation with the story editor.'],
  ['quick', 'Small jobs', 'Reserved for quick lookups. Nothing uses it yet.'],
];

export function openSettings() {
  UI.settingsFrom = UI.view === 'settings' ? UI.settingsFrom : UI.view;
  UI.sDraft = loadSettings(); UI.sTest = null; UI.showKey = false; UI.err = ''; UI.note = '';
  UI.view = 'settings'; render();
}
function closeSettings() { UI.view = UI.settingsFrom || 'home'; UI.sDraft = null; UI.sTest = null; UI.note = ''; render(); }

export function settingsView() {
  const d: Settings = UI.sDraft || (UI.sDraft = loadSettings());
  const saved = loadSettings();
  const t = UI.sTest;
  return h('div', { class: 'home' },
    h('div', { class: 'row', style: 'justify-content:space-between' },
      h('div', null, h('div', { class: 'title', style: 'font-size:22px' }, 'Settings'), h('div', { class: 'muted' }, 'How Story COP reaches Claude.')),
      h('button', { type: 'button', class: 'link grey', onclick: closeSettings }, '‹ Back')),

    h('div', { class: 'card', style: 'display:flex;flex-direction:column;gap:10px' },
      h('div', { class: 'label' }, 'Your Anthropic API key'),
      h('div', { class: 'small muted' }, 'Story COP uses Claude through your own API key. Create one in the Anthropic Console (console.anthropic.com, then API keys). A Claude.ai subscription such as Pro or Max does not include API access: API use is billed separately to your Anthropic account, pay as you go.'),
      h('label', { for: 'apikey', class: 'small muted' }, saved.apiKey ? 'API key (saved: ' + maskKey(saved.apiKey) + ')' : 'API key'),
      h('div', { class: 'row', style: 'flex-wrap:nowrap' },
        h('input', { id: 'apikey', type: UI.showKey ? 'text' : 'password', value: d.apiKey, placeholder: 'sk-ant-…', autocomplete: 'off', spellcheck: 'false', oninput: (e) => { d.apiKey = e.target.value.trim(); } }),
        h('button', { type: 'button', class: 'btn', 'aria-pressed': UI.showKey ? 'true' : 'false', onclick: () => { UI.showKey = !UI.showKey; render(); } }, UI.showKey ? 'Hide' : 'Show')),
      h('label', { class: 'row small', style: 'flex-wrap:nowrap;align-items:flex-start;gap:10px;cursor:pointer' },
        h('input', { id: 'remember', type: 'checkbox', checked: d.remember, style: 'width:auto;margin-top:3px', onchange: (e) => { d.remember = e.target.checked; } }),
        h('span', null, 'Remember the key on this computer', h('span', { class: 'muted', style: 'display:block' }, 'Turn this off on a shared computer: the key is then forgotten when you close this tab.'))),
      h('div', { class: 'small muted' }, 'Your key stays in this browser and is sent only to Anthropic. It is never put in your backups, exports or the development package.'),
      h('div', { class: 'row' },
        h('button', { type: 'button', class: 'btn amber', onclick: () => { saveSettings(d); UI.sTest = null; UI.err = ''; UI.note = 'Saved.'; render(); } }, 'Save'),
        h('button', { type: 'button', class: 'btn teal', disabled: !d.apiKey || (t && t.busy), onclick: async () => {
          UI.sTest = { busy: true, ok: false, message: 'Testing…' }; UI.note = ''; render();
          UI.sTest = await testConnection(d); render();
        } }, 'Test the connection'),
        saved.apiKey ? h('button', { type: 'button', class: 'btn', onclick: () => { forgetKey(); d.apiKey = ''; UI.sTest = null; UI.note = 'Key removed from this computer.'; render(); } }, 'Forget the key') : null),
      t ? h('div', { class: t.busy ? 'busy' : t.ok ? 'busy' : 'err', role: t.ok || t.busy ? 'status' : 'alert' }, t.message) : null,
      UI.note ? h('div', { class: 'busy', role: 'status' }, UI.note) : null),

    h('div', { class: 'card', style: 'display:flex;flex-direction:column;gap:12px' },
      h('div', { class: 'label' }, 'Models'),
      h('div', { class: 'small muted' }, 'Which Claude model does each kind of job, and how hard it thinks (effort). More effort and stronger models give better story work but take longer and cost more.'),
      h('datalist', { id: 'dl-models' }, KNOWN_MODELS.map((m) => h('option', { value: m }))),
      TIER_INFO.map(([tier, name, what]) => h('div', { style: 'display:flex;flex-direction:column;gap:6px;border-top:1px solid #2A2A2A;padding-top:10px' },
        h('div', { style: 'font-weight:600' }, name),
        h('div', { class: 'small muted' }, what),
        h('div', { class: 'frame' },
          h('div', { class: 'fld' }, h('label', { for: 'm-' + tier, class: 'small muted' }, 'Model'),
            h('input', { id: 'm-' + tier, list: 'dl-models', value: d.tiers[tier].model, spellcheck: 'false', oninput: (e) => { d.tiers[tier].model = e.target.value.trim(); } })),
          h('div', { class: 'fld' }, h('label', { for: 'e-' + tier, class: 'small muted' }, 'Effort'),
            h('select', { id: 'e-' + tier, onchange: (e) => { d.tiers[tier].effort = e.target.value; } }, EFFORTS.map((x) => h('option', { value: x, selected: x === d.tiers[tier].effort }, x))))))),
      h('div', { class: 'row' },
        h('button', { type: 'button', class: 'btn amber', onclick: () => { saveSettings(d); UI.note = 'Saved.'; render(); } }, 'Save'),
        h('button', { type: 'button', class: 'link grey', onclick: () => { d.tiers = JSON.parse(JSON.stringify(DEFAULT_TIERS)); render(); } }, 'Reset to the recommended models'))));
}
