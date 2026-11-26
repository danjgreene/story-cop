// Word (.docx) export: one document.xml in a zip. Copied unchanged from the prototype.
import type { Story } from '../story/types';
import { parseFountain, scriptText } from './fountain';
import { XE } from './fdx';
import { makeZip } from './zip';

export function makeDOCX(st: Story) {
  const run = (t, caps) => '<w:r><w:rPr><w:rFonts w:ascii="Courier New" w:hAnsi="Courier New" w:cs="Courier New"/><w:sz w:val="24"/></w:rPr><w:t xml:space="preserve">' + XE(caps ? t.toUpperCase() : t) + '</w:t></w:r>';
  const P = (t, o) => { o = o || {}; return '<w:p><w:pPr>' + (o.keep ? '<w:keepNext/>' : '') + '<w:spacing w:before="' + (o.before || 0) + '" w:after="0" w:line="240" w:lineRule="auto"/><w:ind w:left="' + (o.left || 0) + '" w:right="' + (o.right || 0) + '"/>' + (o.jc ? '<w:jc w:val="' + o.jc + '"/>' : '') + '</w:pPr>' + String(t).split('\n').map((x, i) => (i ? '<w:r><w:br/></w:r>' : '') + run(x, o.caps)).join('') + '</w:p>'; };
  const F = { scene: { caps: true, before: 240, keep: true }, action: { before: 240 }, char: { caps: true, before: 240, left: 3168, keep: true }, dial: { left: 1440, right: 2160 }, paren: { left: 2304, right: 2880, keep: true }, trans: { caps: true, before: 240, jc: 'right' }, center: { before: 240, jc: 'center' } };
  const body = P(st.title, { caps: true, jc: 'center', before: 4320 }) + P('Written by', { jc: 'center', before: 480 }) + P(st.author || '', { jc: 'center', before: 240 }) + '<w:p><w:r><w:br w:type="page"/></w:r></w:p>' +
    parseFountain(scriptText(st)).map((e, i) => P(e.x, { ...F[e.t], before: i === 0 ? 0 : F[e.t].before })).join('');
  const doc = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:body>' + body + '<w:sectPr><w:pgSz w:w="12240" w:h="15840"/><w:pgMar w:top="1440" w:right="1440" w:bottom="1440" w:left="2160" w:header="720" w:footer="720" w:gutter="0"/></w:sectPr></w:body></w:document>';
  return makeZip([
    ['[Content_Types].xml', '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/></Types>'],
    ['_rels/.rels', '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/></Relationships>'],
    ['word/document.xml', doc]]);
}
