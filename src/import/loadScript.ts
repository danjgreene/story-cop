// Reading a script file the writer picked (Fountain, Final Draft, text).
import { UI } from '../ui/state';
import { render } from '../ui/refresh';
import { fdxToFountain } from './fdx';

export function loadScriptFile(file: File) {
  file.text().then((t) => { UI.impText = /\.fdx$/i.test(file.name) ? fdxToFountain(t) : t; if (!UI.impTitle) UI.impTitle = file.name.replace(/\.[^.]+$/, '').replace(/[-_]+/g, ' '); render(); });
}
