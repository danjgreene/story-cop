// Reading a Final Draft file back into Fountain text. Copied unchanged from the prototype.

export function fdxToFountain(xml: string) {
  const d = new DOMParser().parseFromString(xml, 'application/xml'); const out = [];
  d.querySelectorAll('Content > Paragraph').forEach((p) => {
    const ty = p.getAttribute('Type') || 'Action'; const t = [...p.querySelectorAll('Text')].map((x) => x.textContent).join('').trim(); if (!t) return;
    if (ty === 'Dialogue' || ty === 'Parenthetical') out.push(t); else if (ty === 'Character' || ty === 'Scene Heading' || ty === 'Transition') out.push('', t.toUpperCase()); else out.push('', t);
  });
  return out.join('\n').trim();
}
