// Backing up stories to a .json file and restoring them.
// Format: { app: 'storycop', v: 1, exported, stories } — keep it, so existing
// backups from the artifact keep loading.
import { DB, saveDB } from './db';
import { uid } from '../util/id';
import { UI } from '../ui/state';
import { render } from '../ui/refresh';
import { saveFile } from '../platform/files';

export function backup(stories: Record<string, any>, name: string) { saveFile(name, JSON.stringify({ app: 'storycop', v: 1, exported: new Date().toISOString(), stories }, null, 1)); }
export function restoreFile(file: File) {
  file.text().then((t) => {
    let j; try { j = JSON.parse(t); } catch (e) { UI.err = 'That file isn\'t a Story COP backup.'; render(); return; }
    const list = j && j.stories ? Object.values(j.stories) as any[] : null; if (!list || !list.length) { UI.err = 'No stories found in that backup.'; render(); return; }
    list.forEach((s) => { if (!s || !s.title || !Array.isArray(s.movements)) return; if (DB.stories[s.id]) { s.id = uid(); s.title += ' (restored)'; } DB.stories[s.id] = s; });
    saveDB(); UI.note = 'Restored ' + list.length + ' stor' + (list.length === 1 ? 'y' : 'ies') + '.'; render();
  });
}
