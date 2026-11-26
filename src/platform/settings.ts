// The writer's settings: their Anthropic API key and which model handles each
// kind of job. Stored on its own, apart from the stories, so the key never ends
// up in a backup, an export or the development package.
//
// "Remember on this computer" keeps the key in localStorage; otherwise it lives
// in sessionStorage and is gone when the browser tab closes.
// Phase 5 (desktop) moves the key into the operating system's keychain.

export type Tier = 'quick' | 'default' | 'complex';
export type Effort = 'low' | 'medium' | 'high' | 'xhigh' | 'max';

export interface TierSetting { model: string; effort: Effort }
export interface Settings {
  apiKey: string;
  remember: boolean;
  tiers: Record<Tier, TierSetting>;
}

export const SETTINGS_KEY = 'storycop.settings.v1';
export const KEY_KEY = 'storycop.apikey.v1';

// Which model does which job. "complex" does the heavy lifting: building the
// story, zoom out, options, rolling the dice, scenes, pages, import and the
// structure check. "default" handles the pitch questions and the conversation.
export const DEFAULT_TIERS: Record<Tier, TierSetting> = {
  quick: { model: 'claude-haiku-5-5', effort: 'low' },
  default: { model: 'claude-sonnet-5-5', effort: 'medium' },
  complex: { model: 'claude-opus-5-5', effort: 'high' },
};

export const KNOWN_MODELS = ['claude-opus-5-5', 'claude-sonnet-5-5', 'claude-haiku-5-5', 'claude-fable-5-2', 'claude-opus-5', 'claude-sonnet-5'];
export const EFFORTS: Effort[] = ['low', 'medium', 'high', 'xhigh', 'max'];

const read = (store: () => Storage, k: string) => { try { return store().getItem(k); } catch (e) { return null; } };
const write = (store: () => Storage, k: string, v: string | null) => { try { if (v == null) store().removeItem(k); else store().setItem(k, v); } catch (e) {} };
const local = () => localStorage;
const session = () => sessionStorage;

export function loadSettings(): Settings {
  let saved: any = {};
  try { saved = JSON.parse(read(local, SETTINGS_KEY) || '{}') || {}; } catch (e) { saved = {}; }
  const tiers = {} as Record<Tier, TierSetting>;
  (Object.keys(DEFAULT_TIERS) as Tier[]).forEach((t) => {
    const s = (saved.tiers && saved.tiers[t]) || {};
    tiers[t] = { model: String(s.model || '').trim() || DEFAULT_TIERS[t].model, effort: EFFORTS.includes(s.effort) ? s.effort : DEFAULT_TIERS[t].effort };
  });
  const remember = saved.remember !== false;
  const apiKey = (remember ? read(local, KEY_KEY) : read(session, KEY_KEY)) || '';
  return { apiKey, remember, tiers };
}

export function saveSettings(s: Settings) {
  write(local, SETTINGS_KEY, JSON.stringify({ remember: s.remember, tiers: s.tiers }));
  const key = s.apiKey.trim() || null;
  if (s.remember) { write(local, KEY_KEY, key); write(session, KEY_KEY, null); }
  else { write(session, KEY_KEY, key); write(local, KEY_KEY, null); }
}

export function forgetKey() {
  write(local, KEY_KEY, null);
  write(session, KEY_KEY, null);
}

export const hasKey = () => !!loadSettings().apiKey;

// Show only the start and end of a key, e.g. "sk-ant-api…x9Qa".
export const maskKey = (k: string) => (k.length > 16 ? k.slice(0, 10) + '…' + k.slice(-4) : k ? '••••' : '');
