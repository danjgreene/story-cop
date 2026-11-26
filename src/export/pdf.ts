// PDF: US Letter, Courier 12, standard screenplay margins, written by hand.
// Copied unchanged from the prototype; protected by tests/exporters.test.ts.
import type { Story } from '../story/types';
import { parseFountain, scriptText } from './fountain';

export const ASCII = (s: string) => String(s).replace(/[‘’]/g, "'").replace(/[“”]/g, '"').replace(/—/g, '--').replace(/–/g, '-').replace(/…/g, '...').replace(/[^\x20-\x7E\n]/g, '?');
export function wrapText(s: string, w: number) {
  const out = [];
  for (const para of String(s).split('\n')) {
    let line = '';
    for (const word of para.split(/\s+/)) { if (!word) continue; if (!line) line = word; else if ((line + ' ' + word).length <= w) line += ' ' + word; else { out.push(line); line = word; } while (line.length > w) { out.push(line.slice(0, w)); line = line.slice(w); } }
    out.push(line);
  }
  return out;
}
export const LAY: Record<string, any> = { scene: { x: 108, w: 57, up: true }, action: { x: 108, w: 61 }, char: { x: 266, w: 30, up: true }, dial: { x: 180, w: 35 }, paren: { x: 223, w: 26 }, trans: { w: 20, right: true, up: true }, center: { w: 61, center: true } };
export function layoutPages(els: { t: string; x: string }[]) {
  const pages = []; let page = [], line = 0; const MAX = 54; const np = () => { pages.push(page); page = []; line = 0; };
  for (let k = 0; k < els.length;) {
    const group = [els[k]]; if (els[k].t === 'char') { let j = k + 1; while (j < els.length && (els[j].t === 'dial' || els[j].t === 'paren')) group.push(els[j++]); }
    const rows = [];
    group.forEach((g) => { const L = LAY[g.t] || LAY.action; wrapText(ASCII(L.up ? g.x.toUpperCase() : g.x), L.w).forEach((t) => rows.push({ x: L.right ? 540 - t.length * 7.2 : L.center ? 324 - t.length * 3.6 : L.x, text: t })); });
    if (line > 0 && line + rows.length + 1 > MAX && rows.length <= MAX) np();
    if (line > 0) line++;
    rows.forEach((r) => { if (line >= MAX) np(); page.push({ x: r.x, line, text: r.text }); line++; });
    k += group.length;
  }
  if (page.length) pages.push(page); return pages;
}

export function makePDF(st: Story) {
  const esc = (s) => s.replace(/\\/g, '\\\\').replace(/\(/g, '\\(').replace(/\)/g, '\\)');
  const T = (x, y, s) => 'BT /F1 12 Tf ' + x.toFixed(1) + ' ' + y + ' Td (' + esc(s) + ') Tj ET\n';
  const ctr = (y, s) => T(306 - s.length * 3.6, y, s);
  const title = ASCII(st.title.toUpperCase());
  const streams = [ctr(500, title) + ctr(464, 'Written by') + (st.author ? ctr(440, ASCII(st.author)) : '')];
  layoutPages(parseFountain(scriptText(st))).forEach((p, pi) => { let s = pi > 0 ? T(540 - String(pi + 1).length * 7.2 - 7.2, 744, (pi + 1) + '.') : ''; p.forEach((r) => { s += T(r.x, 720 - r.line * 12, r.text); }); streams.push(s); });
  const objs = []; objs[1] = '<< /Type /Catalog /Pages 2 0 R >>';
  objs[2] = '<< /Type /Pages /Kids [' + streams.map((_, i) => (4 + i * 2) + ' 0 R').join(' ') + '] /Count ' + streams.length + ' >>';
  objs[3] = '<< /Type /Font /Subtype /Type1 /BaseFont /Courier /Encoding /WinAnsiEncoding >>';
  streams.forEach((s, i) => { objs[4 + i * 2] = '<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 3 0 R >> >> /Contents ' + (5 + i * 2) + ' 0 R >>'; objs[5 + i * 2] = '<< /Length ' + s.length + ' >>\nstream\n' + s + 'endstream'; });
  let out = '%PDF-1.4\n'; const offs = [];
  for (let i = 1; i < objs.length; i++) { offs[i] = out.length; out += i + ' 0 obj\n' + objs[i] + '\nendobj\n'; }
  const x = out.length; out += 'xref\n0 ' + objs.length + '\n0000000000 65535 f \n';
  for (let i = 1; i < objs.length; i++) out += String(offs[i]).padStart(10, '0') + ' 00000 n \n';
  out += 'trailer\n<< /Size ' + objs.length + ' /Root 1 0 R >>\nstartxref\n' + x + '\n%%EOF';
  return new TextEncoder().encode(out);
}
