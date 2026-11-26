// Talking to Claude through the Anthropic API with the writer's own key.
//
// makeApiSampler() returns a function shaped exactly like the artifact's
// 'sample' capability, (prompt, { modelTier, onText }) => { text }, so the rest
// of the app doesn't care which one it's using.
//
// - The answer streams, and onText gets the text so far, which drives the
//   progress meter (sections ticked off as their JSON keys appear).
// - Each tier (quick / default / complex) uses the model and effort from Settings.
// - Thinking is left at the models' default (adaptive).
// - On models that support it, server-side fallback is on: if a safety check
//   declines a request, the API retries it on a fallback model in the same call.
import Anthropic from '@anthropic-ai/sdk';
import { loadSettings, type Settings, type Tier } from '../platform/settings';

const FALLBACK_MODELS = new Set(['claude-opus-5-5', 'claude-sonnet-5-5', 'claude-opus-5', 'claude-fable-5-2', 'claude-fable-5-1']);
const FALLBACK_BETA = 'server-side-fallback-2026-07-01';
const MAX_TOKENS = 64000;

// The client is created in the browser on purpose: each writer uses their own
// key, which never leaves their computer except to go to Anthropic.
export function makeClient(apiKey: string) {
  // Only the writer's key, only to Anthropic. Passing the key means the SDK
  // reads no other credential; the address is pinned too.
  return new Anthropic({ apiKey, baseURL: 'https://api.anthropic.com', dangerouslyAllowBrowser: true, maxRetries: 2 });
}

export function requestFor(settings: Settings, tier: string, prompt: string): any {
  const t = settings.tiers[(tier as Tier)] || settings.tiers.default;
  const req: any = {
    model: t.model,
    max_tokens: MAX_TOKENS,
    output_config: { effort: t.effort },
    messages: [{ role: 'user', content: prompt }],
  };
  if (FALLBACK_MODELS.has(t.model)) { req.betas = [FALLBACK_BETA]; req.fallbacks = 'default'; }
  return req;
}

// The answer's text. If a fallback model took over, only its part counts.
export function textOf(message: any): string {
  const blocks: any[] = message.content || [];
  let start = 0;
  blocks.forEach((b, i) => { if (b.type === 'fallback') start = i + 1; });
  return blocks.slice(start).filter((b) => b.type === 'text').map((b) => b.text).join('');
}

// Turn any failure into something run() can show in plain English.
export function toAppError(e: any): { code?: string; message?: string } {
  if (e && (e.code || e.message) && !(e instanceof Error)) return e; // already ours
  if (e instanceof Anthropic.AuthenticationError) return { code: 'bad_key', message: 'Anthropic didn\'t accept your API key. Check it in Settings.' };
  if (e instanceof Anthropic.PermissionDeniedError) return { message: 'Your API key isn\'t allowed to use this model. Check your Anthropic Console, or pick another model in Settings.' };
  if (e instanceof Anthropic.NotFoundError) return { message: 'That model wasn\'t found. Check the model names in Settings.' };
  if (e instanceof Anthropic.RateLimitError) return { code: 'rate_limited' };
  if (e instanceof Anthropic.BadRequestError) {
    const m = String(e.message || '');
    if (/credit balance/i.test(m)) return { message: 'Your Anthropic account is out of credit. Add credit in the Anthropic Console, then try again.' };
    return { message: 'Anthropic rejected the request: ' + m };
  }
  if (e instanceof Anthropic.APIConnectionError) return { message: 'Couldn\'t reach Anthropic. Check your internet connection, then try again.' };
  if (e instanceof Anthropic.APIError && (e.status === 529 || (e.status || 0) >= 500)) return { message: 'Anthropic is busy right now. Give it a minute, then try again.' };
  if (e instanceof Anthropic.APIUserAbortError) return { message: 'Stopped.' };
  return { message: (e && e.message) || 'Something went wrong. Try again.' };
}

export function makeApiSampler(settings: Settings = loadSettings(), client: any = makeClient(settings.apiKey)) {
  return async (prompt: string, opts: { modelTier?: string; onText?: (x: { text: string }) => void } = {}) => {
    let so_far = '';
    try {
      const stream = client.beta.messages.stream(requestFor(settings, opts.modelTier || 'default', prompt));
      stream.on('text', (delta: string) => { so_far += delta; if (opts.onText) opts.onText({ text: so_far }); });
      const message = await stream.finalMessage();
      if (message.stop_reason === 'refusal') throw { message: 'Claude declined this request. Try rewording it, or change the story element that triggered it.' };
      if (message.stop_reason === 'max_tokens') throw { message: 'The answer was too long and got cut off. Try again, or ask for a smaller piece.' };
      return { text: textOf(message) };
    } catch (e) {
      throw toAppError(e);
    }
  };
}

// Settings → "Test the connection": checks the key and each model name without
// spending anything (looking up a model is free).
export async function testConnection(settings: Settings, client: any = makeClient(settings.apiKey)): Promise<{ ok: boolean; message: string }> {
  const models = [...new Set(Object.values(settings.tiers).map((t) => t.model))];
  try {
    for (const m of models) await client.models.retrieve(m);
    return { ok: true, message: 'Connected. Your key works with ' + models.join(', ') + '.' };
  } catch (e) {
    const err = toAppError(e);
    return { ok: false, message: err.code === 'rate_limited' ? 'Rate limited. Give it a minute, then try again.' : err.message || 'Something went wrong.' };
  }
}
