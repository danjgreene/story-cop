// Saving files and copying text. Phase 2 keeps the prototype's 'downloads'
// capability; a plain browser download and the desktop save dialog come later.
import { use } from './claude';
import { UI } from '../ui/state';
import { render } from '../ui/refresh';

let dl: any = null;
export function initDownloads() { use('downloads').then((d) => { dl = d; render(); }).catch(() => {}); }

export async function saveFile(filename: string, data: any) {
  UI.err = ''; UI.note = '';
  if (!dl) { UI.err = 'Downloads aren\'t available in this view. Open Story COP inside Claude to save files.'; render(); return; }
  try { await dl.save({ filename, data }); UI.note = 'Saved ' + filename; }
  catch (e) { if (e && e.code === 'declined') return; UI.err = e && e.code === 'host_unavailable' ? 'This app can\'t save files. Open Story COP in a browser or on a computer.' : 'Couldn\'t save the file' + (e && e.message ? ': ' + e.message : '.'); }
  render();
}

export async function copyText(t: string) {
  try { await navigator.clipboard.writeText(t); UI.note = 'Copied. Paste it into any AI tool.'; }
  catch (e) { UI.err = 'Copying isn\'t allowed here. Download the .md file instead.'; }
  render();
}
