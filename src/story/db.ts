// Where stories live. Phase 2 keeps the prototype's localStorage key and format;
// phase 4 moves this to IndexedDB.
import type { Database, Story } from './types';

export const LS = 'storycop.v1';
export const DB: Database = (() => { try { const t = localStorage.getItem(LS); if (t) return JSON.parse(t); } catch (e) {} return { stories: {}, current: null }; })();
export function saveDB() { try { localStorage.setItem(LS, JSON.stringify(DB)); } catch (e) {} }
export const cur = (): Story | null => (DB.current ? DB.stories[DB.current] : null);
