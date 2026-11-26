// @vitest-environment jsdom
//
// The Anthropic API client and the Settings store, tested with the real SDK
// against a fake Anthropic server (tests/helpers/fakeAnthropic.ts).
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { fakeAnthropic } from './helpers/fakeAnthropic';
import { makeApiSampler, requestFor, textOf, testConnection } from '../src/ai/anthropic';
import { loadSettings, saveSettings, forgetKey, maskKey, DEFAULT_TIERS, SETTINGS_KEY, KEY_KEY } from '../src/platform/settings';

const KEY = 'sk-ant-api03-TESTKEY-0123456789abcdef';
const withKey = () => ({ ...loadSettings(), apiKey: KEY });

beforeEach(() => { localStorage.clear(); sessionStorage.clear(); });
afterEach(() => { vi.unstubAllGlobals(); });

describe('settings', () => {
  it('starts with no key and the recommended models', () => {
    const s = loadSettings();
    expect(s.apiKey).toBe('');
    expect(s.remember).toBe(true);
    expect(s.tiers).toEqual(DEFAULT_TIERS);
    expect(DEFAULT_TIERS.complex.model).toBe('claude-opus-5-5');
    expect(DEFAULT_TIERS.default.model).toBe('claude-sonnet-5-5');
    expect(DEFAULT_TIERS.quick.model).toBe('claude-haiku-5-5');
  });
  it('"Remember" keeps the key in this browser; off keeps it only for this tab', () => {
    saveSettings({ ...loadSettings(), apiKey: KEY, remember: true });
    expect(localStorage.getItem(KEY_KEY)).toBe(KEY);
    expect(loadSettings().apiKey).toBe(KEY);
    saveSettings({ ...loadSettings(), apiKey: KEY, remember: false });
    expect(localStorage.getItem(KEY_KEY)).toBeNull();
    expect(sessionStorage.getItem(KEY_KEY)).toBe(KEY);
    expect(loadSettings().apiKey).toBe(KEY);
  });
  it('the key is stored apart from the settings and the stories', () => {
    saveSettings({ ...loadSettings(), apiKey: KEY });
    expect(localStorage.getItem(SETTINGS_KEY)).not.toContain(KEY);
    expect(localStorage.getItem('storycop.v1')).toBeNull();
  });
  it('Forget the key removes it everywhere', () => {
    saveSettings({ ...loadSettings(), apiKey: KEY });
    forgetKey();
    expect(loadSettings().apiKey).toBe('');
  });
  it('keeps model choices and repairs bad ones', () => {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify({ tiers: { complex: { model: 'claude-fable-5-2', effort: 'xhigh' }, default: { model: '  ', effort: 'loud' } } }));
    const s = loadSettings();
    expect(s.tiers.complex).toEqual({ model: 'claude-fable-5-2', effort: 'xhigh' });
    expect(s.tiers.default).toEqual(DEFAULT_TIERS.default);
  });
  it('masks the key for display', () => {
    expect(maskKey(KEY)).toBe('sk-ant-api…cdef');
    expect(maskKey(KEY)).not.toContain('TESTKEY');
  });
});

describe('the request sent to Anthropic', () => {
  it('uses the tier\'s model and effort, streams, and sends the prompt unchanged', () => {
    const r = requestFor(withKey(), 'complex', 'THE PROMPT');
    expect(r.model).toBe('claude-opus-5-5');
    expect(r.output_config).toEqual({ effort: 'high' });
    expect(r.max_tokens).toBe(64000);
    expect(r.messages).toEqual([{ role: 'user', content: 'THE PROMPT' }]);
    expect(r.thinking).toBeUndefined(); // the models' default: adaptive thinking
  });
  it('turns on server-side fallback for Opus and Sonnet 5.5, not Haiku', () => {
    expect(requestFor(withKey(), 'complex', 'x')).toMatchObject({ betas: ['server-side-fallback-2026-07-01'], fallbacks: 'default' });
    expect(requestFor(withKey(), 'default', 'x')).toMatchObject({ model: 'claude-sonnet-5-5', fallbacks: 'default' });
    const q = requestFor(withKey(), 'quick', 'x');
    expect(q.fallbacks).toBeUndefined();
    expect(q.betas).toBeUndefined();
  });
  it('an unknown tier falls back to "default"', () => {
    expect(requestFor(withKey(), 'nonsense', 'x').model).toBe('claude-sonnet-5-5');
  });
});

describe('streaming answers', () => {
  it('streams the text so far to the progress meter and returns the whole answer', async () => {
    const answer = '{"read":"An engine.","questions":[],"frame":{}}';
    const api = fakeAnthropic({ respond: () => answer, chunk: 7 });
    vi.stubGlobal('fetch', api.fetch);
    const seen: string[] = [];
    const r = await makeApiSampler(withKey())('PROMPT', { modelTier: 'default', onText: ({ text }) => seen.push(text) });
    expect(r.text).toBe(answer);
    expect(seen.length).toBeGreaterThan(3);
    expect(seen[seen.length - 1]).toBe(answer);
    expect(answer.startsWith(seen[0])).toBe(true); // each update is the text so far, not just the newest piece

    const call = api.calls[0];
    expect(call.url).toMatch(/^https:\/\/api\.anthropic\.com\/v1\/messages/);
    expect(call.headers['authorization']).toBe('Bearer ' + KEY); // this SDK version sends the key this way
    expect(call.headers['anthropic-dangerous-direct-browser-access']).toBe('true');
    expect(call.headers['anthropic-beta']).toContain('server-side-fallback-2026-07-01');
    expect(call.body).toMatchObject({ model: 'claude-sonnet-5-5', stream: true, fallbacks: 'default', messages: [{ role: 'user', content: 'PROMPT' }] });
  });
  it('only the fallback model\'s text counts when one took over', () => {
    expect(textOf({ content: [{ type: 'text', text: 'declined part' }, { type: 'fallback', from: {}, to: {} }, { type: 'text', text: 'A' }, { type: 'text', text: 'B' }] })).toBe('AB');
    expect(textOf({ content: [{ type: 'thinking', thinking: '' }, { type: 'text', text: 'X' }] })).toBe('X');
  });
});

describe('errors, in plain English', () => {
  const failWith = async (o: any) => { vi.stubGlobal('fetch', fakeAnthropic(o).fetch); try { await makeApiSampler(withKey())('P', { modelTier: 'complex' }); } catch (e) { return e; } throw new Error('expected a failure'); };
  it('bad key', async () => { expect((await failWith({ status: 401 })).message).toMatch(/didn't accept your API key/); });
  it('rate limited', async () => { expect((await failWith({ status: 429 })).code).toBe('rate_limited'); });
  it('unknown model', async () => { expect((await failWith({ status: 404 })).message).toMatch(/model wasn't found/); });
  it('Anthropic busy', async () => { expect((await failWith({ status: 529 })).message).toMatch(/busy/); });
  it('refusal', async () => { expect((await failWith({ stopReason: 'refusal' })).message).toMatch(/declined/); });
  it('cut off', async () => { expect((await failWith({ stopReason: 'max_tokens' })).message).toMatch(/cut off/); });
  it('no network', async () => {
    vi.stubGlobal('fetch', async () => { throw new TypeError('Failed to fetch'); });
    const e: any = await makeApiSampler(withKey())('P', {}).catch((x) => x);
    expect(e.message).toMatch(/Couldn't reach Anthropic/);
  }, 20000);
  it('never puts the key in an error message', async () => {
    for (const status of [401, 404, 429, 500]) expect(JSON.stringify(await failWith({ status }))).not.toContain(KEY);
  });
});

describe('Test the connection', () => {
  it('checks the key and every model, for free (model lookups only)', async () => {
    const api = fakeAnthropic();
    vi.stubGlobal('fetch', api.fetch);
    const r = await testConnection(withKey());
    expect(r.ok).toBe(true);
    expect(api.calls.map((c) => c.url.replace(/^.*\/v1\//, ''))).toEqual(['models/claude-haiku-5-5', 'models/claude-sonnet-5-5', 'models/claude-opus-5-5']);
    expect(api.calls.every((c) => c.method === 'GET')).toBe(true);
  });
  it('reports a model name that doesn\'t exist', async () => {
    vi.stubGlobal('fetch', fakeAnthropic({ knownModels: ['claude-haiku-5-5', 'claude-sonnet-5-5'] }).fetch);
    const r = await testConnection(withKey());
    expect(r).toEqual({ ok: false, message: 'That model wasn\'t found. Check the model names in Settings.' });
  });
  it('reports a bad key', async () => {
    vi.stubGlobal('fetch', fakeAnthropic({ status: 401 }).fetch);
    expect((await testConnection(withKey())).message).toMatch(/didn't accept your API key/);
  });
});
