// The two zip downloads on the Export panel. In the prototype these were
// written inline in the button handlers; the contents are unchanged.
import type { Story } from '../story/types';
import { fountainDoc } from './fountain';
import { makePDF } from './pdf';
import { makeFDX } from './fdx';
import { makeZip } from './zip';
import { devPackage } from './devPackage';

// "Final Draft + Fountain (.zip)"
export const scriptZip = (st: Story, base: string) => makeZip([[base + '.fdx', makeFDX(st)], [base + '.fountain', fountainDoc(st)]]);

// "Everything as one package (.zip)"
export const allZip = (st: Story, base: string, has: boolean) => makeZip([...(has ? [[base + '.pdf', makePDF(st)], [base + '.fdx', makeFDX(st)], [base + '.fountain', fountainDoc(st)]] as [string, string | Uint8Array][] : []), [base + '-development.md', devPackage(st)], [base + '-storycop.json', JSON.stringify({ app: 'storycop', v: 1, stories: { [st.id]: st } })]]);
