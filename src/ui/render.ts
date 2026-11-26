// Draws whichever screen is current, keeping the conversation scrolled to the bottom.
import { cur } from '../story/db';
import { UI } from './state';
import { home } from './home';
import { kick } from './kick';
import { cop } from './cop';
import { settingsView } from './settings';

export function renderApp() {
  const app = document.getElementById('app'); const keep = document.querySelector('.left') ? document.querySelector('.left').scrollTop : null;
  app.replaceChildren(UI.view === 'settings' ? settingsView() : UI.view === 'cop' && cur() ? cop() : UI.view === 'kick' && UI.kick ? kick() : home());
  const left = document.querySelector('.left'); if (left) left.scrollTop = UI.stick === false && keep != null ? keep : left.scrollHeight;
}
