// Starting the app. Same order as the prototype: dictation, downloads, first draw.
import { setRenderer, render } from './ui/refresh';
import { renderApp } from './ui/render';
import { initSpeech } from './platform/speech';
import { initDownloads } from './platform/files';

export function start() {
  setRenderer(renderApp);
  initSpeech();
  initDownloads();
  render();
}
