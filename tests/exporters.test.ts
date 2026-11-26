// Golden-file tests for the exporters (PDF, Word, Final Draft, Fountain, the
// development package and the two zips).
//
// The golden files in tests/golden/ were made by the ORIGINAL prototype
// (prototype/index.html) from the test story. Each test checks two things:
//   1. the prototype still makes exactly those bytes (the goldens are honest), and
//   2. the new modules make exactly the same bytes.
// To remake the goldens on purpose: npm run goldens
import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { loadPrototype, intoPrototype, blobBytes, type Prototype } from './helpers/prototype';
import { testStory } from './fixtures/story';
import { fountainDoc, fileBase, parseFountain } from '../src/export/fountain';
import { makePDF } from '../src/export/pdf';
import { makeFDX } from '../src/export/fdx';
import { makeDOCX } from '../src/export/docx';
import { devPackage } from '../src/export/devPackage';
import { scriptZip, allZip } from '../src/export/bundles';

const GOLDEN = fileURLToPath(new URL('./golden/', import.meta.url));
const UPDATE = !!process.env.UPDATE_GOLDENS;
const base = fileBase(testStory().title);

const toBytes = async (x: any): Promise<Uint8Array> =>
  typeof x === 'string' ? new TextEncoder().encode(x) : x instanceof Uint8Array ? x : await blobBytes(x);

// name -> [what the prototype makes, what the new code makes]
type Pair = [(p: Prototype, st: any) => any, (st: any) => any];
const EXPORTS: Record<string, Pair> = {
  [base + '.pdf']: [(p, st) => p.win.makePDF(st), (st) => makePDF(st)],
  [base + '.docx']: [(p, st) => p.win.makeDOCX(st), (st) => makeDOCX(st)],
  [base + '.fdx']: [(p, st) => p.win.makeFDX(st), (st) => makeFDX(st)],
  [base + '.fountain']: [(p, st) => p.win.fountainDoc(st), (st) => fountainDoc(st)],
  [base + '-development.md']: [(p, st) => p.win.devPackage(st), (st) => devPackage(st)],
  // The two zips are written inline in the prototype's Export panel; these are copies of those lines.
  [base + '-script.zip']: [(p, st) => { p.win.__st = st; return p.ev(`makeZip([['${base}.fdx', makeFDX(__st)], ['${base}.fountain', fountainDoc(__st)]])`); }, (st) => scriptZip(st, base)],
  [base + '-all.zip']: [(p, st) => { p.win.__st = st; return p.ev(`(() => { const st = __st, base = '${base}', has = true; return makeZip([...(has ? [[base + '.pdf', makePDF(st)], [base + '.fdx', makeFDX(st)], [base + '.fountain', fountainDoc(st)]] : []), [base + '-development.md', devPackage(st)], [base + '-storycop.json', JSON.stringify({ app: 'storycop', v: 1, stories: { [st.id]: st } })]]); })()`); }, (st) => allZip(st, base, true)],
};

let proto: Prototype;
beforeAll(() => {
  proto = loadPrototype();
  vi.spyOn(Date.prototype, 'toLocaleDateString').mockReturnValue('11/25/2026');
  if (UPDATE) {
    mkdirSync(GOLDEN, { recursive: true });
  }
});
afterAll(() => { vi.restoreAllMocks(); proto?.win.close(); });

describe('exporters match the prototype byte for byte', () => {
  for (const [name, [fromPrototype, fromModules]] of Object.entries(EXPORTS)) {
    it(name, async () => {
      const file = GOLDEN + name;
      const protoBytes = await toBytes(fromPrototype(proto, intoPrototype(proto, testStory())));
      if (UPDATE) writeFileSync(file, protoBytes);
      expect(existsSync(file), 'golden file missing; run npm run goldens').toBe(true);
      const golden = new Uint8Array(readFileSync(file));
      expect(Buffer.from(protoBytes).equals(Buffer.from(golden)), 'the prototype no longer makes the golden file').toBe(true);
      const newBytes = await toBytes(fromModules(testStory()));
      expect(Buffer.from(newBytes).equals(Buffer.from(golden)), 'the new code makes a different file than the prototype').toBe(true);
    });
  }
});

describe('exporters: plain checks a person can read', () => {
  it('PDF is US Letter Courier with a title page and numbered pages', () => {
    const pdf = new TextDecoder().decode(makePDF(testStory()));
    expect(pdf.startsWith('%PDF-1.4')).toBe(true);
    expect(pdf).toContain('/MediaBox [0 0 612 792]');
    expect(pdf).toContain('/BaseFont /Courier');
    expect(pdf).toContain('(LAST RESORT) Tj');
    const pages = Number(/\/Count (\d+)/.exec(pdf)[1]);
    expect(pages).toBeGreaterThanOrEqual(4); // title page + at least 3 script pages
    expect(pdf).toContain('(2.) Tj'); // page numbers start on page 2
    expect(pdf.trimEnd().endsWith('%%EOF')).toBe(true);
  });
  it('Fountain starts with a title page block', () => {
    const f = fountainDoc(testStory());
    expect(f.split('\n').slice(0, 4)).toEqual(['Title: Last Resort', 'Credit: Written by', 'Author: Dan Greene & “Friends”', 'Draft date: 11/25/2026']);
  });
  it('FDX escapes XML characters', () => {
    const x = makeFDX(testStory());
    expect(x).toContain('&lt;the season&gt; &amp; every guest is &quot;family.&quot;');
    expect(x).toContain('<Paragraph Type="Transition"><Text>SMASH CUT TO:</Text></Paragraph>');
  });
  it('parses every screenplay element type', () => {
    const types = new Set(parseFountain(testStory().pages[1] + '\n\n' + testStory().pages[2]).map((e) => e.t));
    expect([...types].sort()).toEqual(['action', 'center', 'char', 'dial', 'paren', 'scene', 'trans']);
  });
});
