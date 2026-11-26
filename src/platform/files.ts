// Saving files and copying text. Inside Claude this uses the artifact's
// 'downloads' capability; in a plain browser it's a normal download.
// The desktop save dialog comes in phase 5.
import { use, inClaude } from './claude';
import { UI } from '../ui/state';
import { render } from '../ui/refresh';

let dl: any = null;
export function initDownloads() { use('downloads').then((d) => { dl = d; render(); }).catch(() => {}); }

// Outside Claude: an ordinary browser download (the file goes to your Downloads folder).
export function browserDownload(filename: string, data: any) {
  const blob = data instanceof Blob ? data : new Blob([data], { type: typeFor(filename) });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a'); a.href = url; a.download = filename; a.style.display = 'none';
  document.body.append(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 10000);
}
const typeFor = (name: string) => /\.pdf$/i.test(name) ? 'application/pdf' : /\.json$/i.test(name) ? 'application/json' : /\.(zip|docx)$/i.test(name) ? 'application/zip' : /\.md$/i.test(name) ? 'text/markdown;charset=utf-8' : 'text/plain;charset=utf-8';

export async function saveFile(filename: string, data: any) {
  UI.err = ''; UI.note = '';
  if (!dl && !inClaude()) {
    try { browserDownload(filename, data); UI.note = 'Downloaded ' + filename; } catch (e) { UI.err = 'Couldn\'t save the file' + (e && e.message ? ': ' + e.message : '.'); }
    render(); return;
  }
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
