// Final Draft (.fdx) export. Copied unchanged from the prototype.
import type { Story } from '../story/types';
import { parseFountain, scriptText } from './fountain';

export const XE = (s: string) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
export function makeFDX(st: Story) {
  const TY = { scene: 'Scene Heading', action: 'Action', char: 'Character', dial: 'Dialogue', paren: 'Parenthetical', trans: 'Transition', center: 'Action' };
  const ps = parseFountain(scriptText(st)).flatMap((e) => (e.t === 'action' ? e.x.split('\n') : [e.x]).map((t) => '<Paragraph Type="' + TY[e.t] + '"' + (e.t === 'center' ? ' Alignment="Center"' : '') + '><Text>' + XE(t) + '</Text></Paragraph>')).join('\n');
  return '<?xml version="1.0" encoding="UTF-8" standalone="no" ?>\n<FinalDraft DocumentType="Script" Template="No" Version="5">\n<Content>\n' + ps + '\n</Content>\n<TitlePage>\n<Content>\n<Paragraph Alignment="Center"><Text>' + XE(st.title.toUpperCase()) + '</Text></Paragraph>\n<Paragraph Alignment="Center"><Text>Written by</Text></Paragraph>\n<Paragraph Alignment="Center"><Text>' + XE(st.author || '') + '</Text></Paragraph>\n</Content>\n</TitlePage>\n</FinalDraft>\n';
}
