// Everything the writer can ask the story editor to do. Each task builds its
// prompt (from prompts.ts), runs it, and applies the answer to the story.
import { DB, saveDB, cur } from '../story/db';
import { makeStory, mutate } from '../story/store';
import { normFrame, frameText, MODELS, STATLBL } from '../story/frame';
import { uid } from '../util/id';
import { UI } from '../ui/state';
import { render } from '../ui/refresh';
import { PROG } from '../ui/progress';
import { speech } from '../platform/speech';
import { ask, run } from './client';
import { SCH, kickPrompt, kickAnswers, buildPrompt, chatPrompt, optionsPrompt, rollPrompt, zoomOutPrompt, scenesPrompt, pagesPrompt, importPrompt, structurePrompt } from './prompts';

export function startKick() {
  const title = UI.pTitle.trim(), idea = UI.pIdea.trim(); if (!idea && !title) return;
  DB.current = null; saveDB();
  run('Reading your pitch…', async () => {
    const j = await ask(kickPrompt(title, idea), SCH.kick, 'default');
    UI.kFrame = normFrame(j.frame);
    UI.kick = { title, idea, read: j.read || '', questions: (j.questions || []).slice(0, 4) }; UI.kAns = {}; UI.kOther = {}; UI.view = 'kick';
  }, PROG.kick);
}
export function buildFromKick() {
  const k = UI.kick;
  const answers = kickAnswers(k.questions, UI.kAns, UI.kOther);
  run('Building the spine, movements and beats…', async () => {
    const j = await ask(buildPrompt(k, answers, frameText(UI.kFrame || normFrame({}))), SCH.story, 'complex');
    const intro = 'Your first pass is drafted: spine, movements and beats, plus the questions the story still needs answered.\n\nStart with step 1, the Spine, in the middle. Read it, and when it feels right press "Yes, on to Movements". If something is off, tell me here.' + (j.proposed ? '\n\nOne connection I\'d suggest (not locked yet): ' + j.proposed : '');
    const nst = makeStory(j, k.title, intro); nst.frame = normFrame(UI.kFrame || {}, nst); nst.runtime = nst.frame.runtime; saveDB(); UI.view = 'cop'; UI.zoom = 'spine'; UI.tab = 'open'; UI.opts = {}; UI.activeQ = null;
  }, PROG.build);
}
export function send() {
  const text = UI.draft.trim(); const st = cur(); if (!text || !st || UI.busy) return;
  if (speech.dict && speech.state === 'listening') speech.dict.stop().catch(() => {});
  st.chat.push({ who: 'you', text }); UI.draft = ''; speech.base = ''; saveDB();
  run('Thinking…', async () => {
    const j = await ask(chatPrompt(), SCH.chat, 'default');
    st.chat.push({ who: 'editor', text: j.reply || '', affects: j.affects || '', changes: (j.changes || []).filter((c) => c && c.text).map((c) => ({ ...c, cid: uid(), state: 'pending' })) }); saveDB();
  });
}
export function applyChange(c) {
  mutate((c.kind === 'kill' ? 'Killed: ' : c.kind === 'open' ? 'New question: ' : 'Locked: ') + c.text, (st) => {
    const live = st.chat.flatMap((m) => m.changes || []).find((x) => x.cid === c.cid); if (live) live.state = 'accepted';
    if (c.kind === 'open') st.open.push({ id: uid(), q: c.text, job: '', affects: '' });
    else if (c.kind === 'kill') st.dead.push(c.text);
    else { st.locked.push({ id: uid(), text: c.text, by: 'you' }); if (c.resolves) st.open = st.open.filter((o) => o.id !== c.resolves); }
    if (c.kind !== 'open') st.stale = true;
  });
}
export function dismissChange(c) { const st = cur(); const live = st.chat.flatMap((m) => m.changes || []).find((x) => x.cid === c.cid); if (live) live.state = 'dismissed'; saveDB(); render(); }
export function selectQ(id: string) {
  UI.activeQ = id; UI.showPick = false; UI.other = ''; UI.roll = null; const o = cur().open.find((x) => x.id === id); if (!o) return;
  if (UI.opts[id]) return render();
  run('Working the problem…', async () => {
    UI.opts[id] = await ask(optionsPrompt(o), SCH.opts, 'complex');
  });
}
export const shortQ = (q: string) => q.replace(/\?$/, '');
export function resolveQ(id: string, text: string, by: string) {
  mutate((by === 'ai' ? 'Rolled: ' : 'Resolved: ') + text, (st) => {
    const o = st.open.find((x) => x.id === id); if (!o) return;
    st.open = st.open.filter((x) => x.id !== id); st.locked.push({ id: uid(), text: shortQ(o.q) + ': ' + text, by }); st.stale = true;
    st.chat.push({ who: 'system', by, text });
  });
  const st = cur(); UI.activeQ = null; UI.other = ''; UI.showPick = false; delete UI.opts[id]; render();
}
export function startRoll(ids: string[]) { if (!ids.length) return; UI.roll = { ids, spins: [] }; UI.activeQ = ids.length === 1 ? ids[0] : null; UI.butOpen = false; spin(''); }
export function spin(note: string) {
  const st = cur(); const R = UI.roll; const qs = st.open.filter((o) => R.ids.includes(o.id));
  const prev = R.spins;
  run('Rolling the dice…', async () => {
    const j = await ask(rollPrompt(qs, prev, note), SCH.roll, 'complex');
    R.spins.push({ fills: (j.fills || []).filter((f) => R.ids.includes(f.id)), connection: j.connection || '', note });
  });
}
export function keepRoll() {
  const R = UI.roll; const s = R.spins[R.spins.length - 1]; if (!s) return;
  mutate('Rolled ' + s.fills.length + ' answer(s)', (st) => {
    s.fills.forEach((f) => { const o = st.open.find((x) => x.id === f.id); if (!o) return; st.open = st.open.filter((x) => x.id !== f.id); st.locked.push({ id: uid(), text: shortQ(o.q) + ': ' + f.text, by: 'ai' }); st.chat.push({ who: 'system', by: 'ai', text: f.text }); });
    st.stale = true;
  });
  UI.roll = null; UI.activeQ = null; render();
}
export function zoomOut() {
  run('Zooming out: rebuilding the story with every decision…', async () => {
    const j = await ask(zoomOutPrompt(), SCH.refresh, 'complex');
    mutate('Zoomed out', (st) => {
      ['logline', 'tone', 'spine', 'movements', 'ledger'].forEach((k) => { if (j[k] && (!Array.isArray(j[k]) || j[k].length)) st[k] = j[k]; });
      if (j.runtime) st.runtime = Number(j.runtime) || st.runtime; st.stale = false; if (st.scenes.length) st.scenesStale = true;
      st.chat.push({ who: 'editor', text: 'Zoomed out. What changed:\n' + (j.changed || []).map((c) => '• ' + c).join('\n') });
      st.reviewed = {}; if (st.structCheck) st.structCheck.stale = true;
    });
  }, PROG.zoom);
}
export function buildScenes() {
  const st = cur(); const n = Math.round(st.runtime / 1.8);
  run('Breaking the beats into scenes…', async () => {
    const j = await ask(scenesPrompt(n, st.runtime), SCH.scenes, 'complex');
    mutate('Built scene list', (s2) => { s2.scenes = j.scenes || []; s2.scenesStale = false; if (s2.reviewed) s2.reviewed.scenes = false; });
  }, { re: /"slug"/g, total: n, unit: 'Scene', est: 90 });
}
export function writePages(m: number) {
  const st = cur(); const mv = st.movements[m - 1]; if (!mv) return;
  const sc = st.scenes.filter((s) => Number(s.m) === m);
  run(`Writing pages for "${mv.title}"…`, async () => {
    let t = await ask(pagesPrompt(m, mv, sc), '', 'complex', true);
    t = t.replace(/^```[a-z]*\n?/i, '').replace(/```\s*$/, '');
    mutate('Wrote pages: ' + mv.title, (s2) => { s2.pages[m] = t; });
  }, { re: /(^|\n)\s*(INT\.|EXT\.|INT\/EXT)/g, total: sc.length || mv.beats.length || 6, unit: 'Scene', est: 120 });
}
export function importScript() {
  let txt = UI.impText.replace(/\r/g, '').trim(); if (!txt) return;
  if (/^title:/i.test(txt)) { const k = txt.search(/\n\s*\n/); if (k > 0) txt = txt.slice(k).trim(); }
  const title = UI.impTitle.trim() || 'Imported script'; const MAX = 220000; const cut = txt.length > MAX; if (cut) txt = txt.slice(0, MAX);
  DB.current = null; saveDB();
  run('Reading your script…', async () => {
    const j = await ask(importPrompt(title, txt, cut), SCH.imp, 'complex');
    const st = makeStory(j, title, 'I\'ve read ' + title + '.\n\n' + (j.diagnosis || '') + '\n\nI mapped it into the steps across the top. Spine, Movements and Beats show the story as it stands now. The Questions step holds the biggest problems I see. Your pages are under step 6, split by movement.');
    const starts = (j.movementStarts || []).map((s) => String(s || '').trim()); const idx = []; let from = 0;
    starts.forEach((s) => { const p = s ? txt.indexOf(s, from) : -1; idx.push(p); if (p >= 0) from = p + 1; });
    if (idx.length === st.movements.length && idx.every((p) => p >= 0)) idx.forEach((p, k) => { st.pages[k + 1] = txt.slice(k === 0 ? 0 : p, k + 1 < idx.length ? idx[k + 1] : txt.length).trim(); });
    else st.pages[1] = txt;
    const re = /^(?:\.(?!\.)|(?:INT|EXT|EST|INT\.?\/EXT|I\/E)[.\s]).*$/gim; let mm;
    while ((mm = re.exec(txt))) { let m = 1; idx.forEach((p, k) => { if (p >= 0 && mm.index >= p) m = k + 1; }); st.scenes.push({ n: st.scenes.length + 1, m, slug: mm[0].replace(/^\./, '').trim().toUpperCase(), does: '' }); }
    st.frame = normFrame(j.frame, st); st.runtime = st.frame.runtime; st.imported = true; st.reviewed = {}; saveDB(); UI.view = 'cop'; UI.zoom = 'questions'; UI.opts = {}; UI.activeQ = null; UI.impText = ''; UI.impTitle = '';
  }, PROG.imp);
}
export function checkStructure(model: string) {
  const M = MODELS[model]; if (!M || !M.beats.length) return;
  run('Checking the beats against ' + M.label + '…', async () => {
    const j = await ask(structurePrompt(M), SCH.struct, 'complex');
    mutate('Structure check: ' + M.label, (st) => { st.structCheck = { model, summary: j.summary || '', stale: false, items: (j.items || []).map((i) => ({ beat: i.beat || '', n: Number(i.n) || null, status: STATLBL[i.status] ? i.status : 'weak', note: i.note || '' })) }; });
  }, { steps: [['Reading the beats', ''], ['Mapping them to ' + M.label, '"items"'], ['Summing up', '"summary"']], est: 40 });
}
