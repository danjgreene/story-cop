// The development package: one Markdown file with everything, plus instructions
// for another AI to critique it. Copied unchanged from the prototype.
import type { Story } from '../story/types';
import { scriptText } from './fountain';

export function devPackage(st: Story) {
  const L = ['# ' + st.title + ': development package', '', '*Exported from Story COP on ' + new Date().toLocaleDateString() + ' (version ' + (st.version || 1) + ').*', '',
    '## For the reviewer', 'You are reviewing a feature film in development. Below is its current state: the spine, the structure, the writer\'s locked decisions (marked where an AI suggested it and the writer kept it), open questions, what the audience knows when, rejected ideas, and any written pages.', '',
    'Give an honest, specific development critique:', '1. Does the spine (want, need, flaw, theme) actually drive the structure?', '2. Where does cause and effect break, or where do events feel invented as they go?', '3. Pacing: where does it sag? Are the midpoint and low point strong enough?', '4. Characters: who is thin, inconsistent, or missing a turn?', '5. Open questions: which matter most, and what would you do?', '6. If pages exist: dialogue, subtext, and whether the scenes play.', 'Name exact beats or scenes. Skip the praise padding.', '',
    '## Logline', st.logline, '', '**Tone:** ' + st.tone + ' · **Runtime:** about ' + st.runtime + ' minutes', '', '## Spine', ...st.spine.map((s) => '- **' + s.k + ':** ' + s.v), '', '## Movements and beats'];
  st.movements.forEach((m, i) => L.push('', '### ' + (i + 1) + '. ' + m.title + ' (' + m.time + ' min)', m.summary, '*Audience feels: ' + m.feel + '*', '', ...(m.beats || []).map((b) => b.n + '. ' + b.t)));
  L.push('', '## Locked decisions', ...st.locked.map((l) => '- ' + l.text + (l.by === 'ai' ? ' *(AI suggestion, kept by the writer)*' : '')), '', '## Open questions', ...(st.open.length ? st.open.map((o) => '- ' + o.q + (o.job ? ' (it must: ' + o.job + ')' : '')) : ['- None']),
    '', '## What the audience knows, and when', ...st.ledger.map((r) => '- **' + r.at + ':** the audience knows ' + r.aud + '; the characters know ' + r.them), '', '## Rejected ideas', ...(st.dead.length ? st.dead.map((d) => '- ' + d) : ['- None']), '');
  if (st.scenes.length) L.push('## Scene list', ...st.scenes.map((s) => s.n + '. ' + s.slug + (s.does ? ': ' + s.does : '')), '');
  const n = Object.keys(st.pages || {}).length, sc = scriptText(st);
  L.push('## Screenplay pages', n ? '*' + n + ' of ' + st.movements.length + ' movements written. Fountain format.*' : '*No pages written yet.*', '');
  if (sc) L.push('```fountain', sc, '```');
  return L.join('\n');
}
