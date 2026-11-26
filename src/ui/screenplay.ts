// The Pages view: Fountain text laid out like a screenplay page.
import { h } from './dom';
import { parseFountain } from '../export/fountain';

export function screenplayView(txt: string) {
  const els = parseFountain(txt);
  return h('div', { class: 'paperwrap' }, h('div', { class: 'paper sp' }, els.map((e) => h('div', { class: 'sp-' + e.t + (e.t === 'dial' || e.t === 'paren' ? ' tight' : '') }, e.x))));
}
