// @vitest-environment jsdom
//
// Story COP in a plain browser (not inside Claude): the writer adds their own
// API key in Settings, the AI goes through the real Anthropic SDK (to a fake
// Anthropic server), and files save as ordinary downloads.
import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest';
import { fakeAnthropic } from './helpers/fakeAnthropic';
import { respond } from './fixtures/responses';
import { EDITOR, SCH, kickPrompt } from '../src/ai/prompts';

const KEY = 'sk-ant-api03-STANDALONE-TEST-KEY-9876';
const api = fakeAnthropic({ respond, chunk: 25 });
const downloads: { name: string; blob: Blob }[] = [];

const tick = () => new Promise((r) => setTimeout(r, 0));
async function settle() { for (let i = 0; i < 30; i++) await tick(); }
const html = () => document.getElementById('app').innerHTML;
const text = () => document.getElementById('app').textContent;
function click(match: string | RegExp) {
  const els = [...document.querySelectorAll('button')] as HTMLElement[];
  const b = els.find((x) => { const t = (x.textContent || '').trim(); return typeof match === 'string' ? t === match : match.test(t); });
  if (!b) throw new Error('no button ' + match + ' in: ' + els.map((x) => JSON.stringify(x.textContent.trim())).join(', '));
  b.click();
}
function type(id: string, value: string) {
  const el = document.getElementById(id) as HTMLInputElement;
  el.value = value; el.dispatchEvent(new Event('input')); el.dispatchEvent(new Event('change'));
}

beforeAll(async () => {
  localStorage.clear(); sessionStorage.clear();
  delete (window as any).claude;
  vi.stubGlobal('fetch', api.fetch);
  (URL as any).createObjectURL = (b: Blob) => { (URL as any).__last = b; return 'blob:fake'; };
  (URL as any).revokeObjectURL = () => {};
  vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(function (this: HTMLAnchorElement) { downloads.push({ name: this.download, blob: (URL as any).__last }); });
  document.body.innerHTML = '<div id="app"></div>';
  const { start } = await import('../src/app');
  start();
  await settle();
});
afterAll(() => { vi.restoreAllMocks(); vi.unstubAllGlobals(); });

describe('Story COP outside Claude', () => {
  it('asks for an API key first', () => {
    expect(text()).toContain('First: connect to Claude');
    expect(text()).toContain('separate from a Claude.ai subscription');
  });

  it('without a key, the AI says to add one, and nothing is sent', async () => {
    type('pt', 'Last Resort'); type('pi', 'Freebie hunters own a crime ring.');
    click('Start developing'); await settle();
    expect(text()).toContain('Add your Anthropic API key in Settings to use the AI.');
    expect(api.calls.length).toBe(0);
  });

  it('Settings explains the key in plain language', async () => {
    click('Add your API key'); await settle();
    const t = text();
    expect(t).toContain('Your Anthropic API key');
    expect(t).toContain('does not include API access');
    expect(t).toContain('never put in your backups, exports or the development package');
    expect((document.getElementById('apikey') as HTMLInputElement).type).toBe('password');
    expect((document.getElementById('m-complex') as HTMLInputElement).value).toBe('claude-opus-5-5');
    expect((document.getElementById('m-default') as HTMLInputElement).value).toBe('claude-sonnet-5-5');
    expect((document.getElementById('e-complex') as HTMLSelectElement).value).toBe('high');
  });

  it('save the key, then test the connection', async () => {
    type('apikey', KEY);
    click('Save'); await settle();
    expect(text()).toContain('Saved.');
    expect(text()).toContain('saved: sk-ant-api…9876');
    expect(html()).not.toContain('STANDALONE-TEST'); // the full key isn't written into the page
    click('Test the connection'); await settle();
    expect(text()).toContain('Connected. Your key works with');
    expect(api.calls.every((c) => c.method === 'GET')).toBe(true);
    click('‹ Back'); await settle();
    expect(text()).toContain('Using your Anthropic API key.');
  });

  it('pitch → questions, through the API with the "default" model', async () => {
    api.calls.length = 0;
    click('Start developing'); await settle();
    expect(text()).toContain('My read');
    expect(text()).toContain('Who signs the paperwork?');
    const call = api.calls.find((c) => c.method === 'POST');
    expect(call.body.model).toBe('claude-sonnet-5-5');
    expect(call.body.output_config).toEqual({ effort: 'medium' });
    // The same words the artifact sends (the parity test checks those against the prototype).
    expect(call.body.messages[0].content).toBe(EDITOR + '\n\nTASK:\n' + kickPrompt('Last Resort', 'Freebie hunters own a crime ring.') + '\n\nReturn ONLY one JSON object, with no code fences and no commentary, in this shape:\n' + SCH.kick);
  });

  it('build → the workspace, through the API with the "complex" model', async () => {
    api.calls.length = 0;
    click('Build the story'); await settle();
    expect(text()).toContain('Your first pass is drafted');
    expect(api.calls[0].body.model).toBe('claude-opus-5-5');
    expect(api.calls[0].body.fallbacks).toBe('default');
    expect(text()).toContain('Settings'); // header button
  });

  it('downloads work as normal browser downloads, and never contain the key', async () => {
    click('Export & save'); await settle();
    click('Back up this story (.json)'); await settle();
    click('Download the package (.md)'); await settle();
    click('Everything as one package (.zip)'); await settle();
    expect(downloads.map((d) => d.name)).toEqual(['Last-Resort-storycop.json', 'Last-Resort-development.md', 'Last-Resort-all.zip']);
    expect(text()).toContain('Downloaded Last-Resort-all.zip');
    for (const d of downloads) {
      const body = new TextDecoder().decode(new Uint8Array(await d.blob.arrayBuffer()));
      expect(body.length).toBeGreaterThan(100);
      expect(body).not.toContain(KEY);
    }
    const backup = JSON.parse(new TextDecoder().decode(new Uint8Array(await downloads[0].blob.arrayBuffer())));
    expect(backup.app).toBe('storycop');
    expect(Object.values(backup.stories)[0]).toMatchObject({ title: 'Last Resort' });
  });

  it('the saved stories never contain the key', () => {
    expect(localStorage.getItem('storycop.v1')).toContain('Last Resort');
    expect(localStorage.getItem('storycop.v1')).not.toContain(KEY);
  });
});
