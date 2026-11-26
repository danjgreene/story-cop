// Screen state that isn't part of the story: which view is open, drafts in
// text boxes, what the AI is busy with. Not saved.
import { cur } from '../story/db';

export interface UIState {
  view: 'home' | 'kick' | 'cop' | string;
  zoom: string;
  prog: any;
  progText: string;
  showHelp: boolean;
  exportOpen: boolean;
  frameOpen: boolean;
  fDraft: any;
  kFrame: any;
  lens: string;
  impTitle: string;
  impText: string;
  note: string;
  tab: string;
  busy: string;
  err: string;
  draft: string;
  pTitle: string;
  pIdea: string;
  kick: any;
  kAns: Record<string, any>;
  kOther: Record<string, string>;
  activeQ: string | null;
  opts: Record<string, any>;
  showPick: boolean;
  other: string;
  roll: any;
  steer: string;
  butOpen: boolean;
  pageM: number;
  stick?: boolean;
  // Settings screen
  settingsFrom?: string;
  sDraft?: any;
  sTest?: { busy?: boolean; ok: boolean; message: string } | null;
  showKey?: boolean;
}

export const UI: UIState = { view: cur() ? 'cop' : 'home', zoom: 'spine', prog: null, progText: '', showHelp: false, exportOpen: false, frameOpen: false, fDraft: null, kFrame: null, lens: '', impTitle: '', impText: '', note: '', tab: 'open', busy: '', err: '', draft: '', pTitle: '', pIdea: '', kick: null, kAns: {}, kOther: {}, activeQ: null, opts: {}, showPick: false, other: '', roll: null, steer: '', butOpen: false, pageM: 1 };
