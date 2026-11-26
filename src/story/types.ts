// The shape of a story as Story COP saves it. These match the prototype's
// localStorage and backup format exactly, so old backups keep loading.

export interface Beat { n: number; t: string }
export interface Movement { title: string; time: string; summary: string; feel: string; beats: Beat[] }
export interface SpineItem { k: string; v: string }
export interface LockedItem { id: string; text: string; by: 'you' | 'ai' | string }
export interface OpenQuestion { id: string; q: string; job: string; affects: string }
export interface LedgerRow { at: string; aud: string; them: string }
export interface Scene { n: number; m: number; slug: string; does: string }

export interface Frame {
  genre: string;
  genre2: string;
  blend: number;
  tone: string;
  rating: string;
  runtime: number;
  structure: string;
}

export interface Change { kind: string; text: string; resolves?: string; cid?: string; state?: string }

export interface ChatMessage {
  who: 'you' | 'editor' | 'system' | string;
  text: string;
  by?: string;
  affects?: string;
  changes?: Change[];
}

export interface StructItem { beat: string; n: number | null; status: string; note: string }
export interface StructCheck { model: string; summary: string; stale: boolean; items: StructItem[] }

export interface HistoryEntry { label: string; data: any }

export interface Story {
  id: string;
  title: string;
  logline: string;
  tone: string;
  runtime: number;
  spine: SpineItem[];
  movements: Movement[];
  locked: LockedItem[];
  open: OpenQuestion[];
  dead: string[];
  ledger: LedgerRow[];
  scenes: Scene[];
  pages: Record<string, string>;
  chat: ChatMessage[];
  stale: boolean;
  version: number;
  history: HistoryEntry[];
  reviewed: Record<string, boolean>;
  seenGuide: boolean;
  frame: Frame | null;
  author?: string;
  imported?: boolean;
  scenesStale?: boolean;
  structCheck?: StructCheck;
}

export interface Database { stories: Record<string, Story>; current: string | null }
