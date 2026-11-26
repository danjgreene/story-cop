// Runs the original prototype (prototype/index.html) in a simulated browser so
// tests can compare the new modules against it: same files out, same prompts
// sent, same screens drawn.
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { JSDOM } from 'jsdom';
import { Blob as NodeBlob } from 'node:buffer';

// Tests run from the project folder. (import.meta.url isn't a file: URL inside
// the simulated browser, so build the path from the working directory.)
export const PROTOTYPE_PATH = resolve(process.cwd(), 'prototype', 'index.html');

// A repeatable stand-in for Math.random, so story ids match between the two apps.
export function seeded(seed = 1) {
  let s = seed >>> 0;
  return () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; };
}

export interface FakeClaude {
  prompts: { prompt: string; opts: any }[];
  saved: { filename: string; data: any }[];
  respond: (prompt: string) => string;
  use: (name: string) => Promise<any>;
}

// A fake of the artifact's window.claude: records every prompt and every saved file.
export function fakeClaude(respond: (prompt: string) => string = () => '{}'): FakeClaude {
  const fc: FakeClaude = {
    prompts: [], saved: [], respond,
    use: (name) => {
      if (name === 'sample') return Promise.resolve(async (prompt, opts) => { fc.prompts.push({ prompt, opts: { modelTier: opts.modelTier, cache: opts.cache } }); return { text: fc.respond(prompt) }; });
      if (name === 'downloads') return Promise.resolve({ save: async ({ filename, data }) => { fc.saved.push({ filename, data }); } });
      return Promise.resolve(null);
    },
  };
  return fc;
}

export interface Prototype {
  win: any;
  dom: JSDOM;
  ev: (code: string) => any;
}

export function loadPrototype(opts: { claude?: FakeClaude; storage?: string; seed?: number } = {}): Prototype {
  const html = readFileSync(PROTOTYPE_PATH, 'utf8');
  const dom = new JSDOM(html, {
    url: 'http://localhost/',
    runScripts: 'dangerously',
    beforeParse(w: any) {
      w.TextEncoder = TextEncoder;
      w.Blob = NodeBlob;
      w.Math.random = seeded(opts.seed ?? 1);
      w.Date.prototype.toLocaleDateString = () => '11/25/2026';
      if (opts.storage) w.localStorage.setItem('storycop.v1', opts.storage);
      if (opts.claude) w.claude = { use: opts.claude.use };
    },
  });
  const win: any = dom.window;
  return { win, dom, ev: (code) => win.eval(code) };
}

// Pass a plain object into the prototype's world (avoids cross-window quirks).
export const intoPrototype = (p: Prototype, value: any) => p.ev('(' + JSON.stringify(value) + ')');

export async function blobBytes(b: any): Promise<Uint8Array> {
  return new Uint8Array(await b.arrayBuffer());
}
