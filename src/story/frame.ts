// The story frame (genre, tone, rating, runtime, structure lens) and the
// structure models the lens checks against.
import type { Frame } from './types';

export const GENRES = ['Drama', 'Comedy', 'Thriller', 'Crime', 'Horror', 'Science Fiction', 'Fantasy', 'Action', 'Adventure', 'Romance', 'Mystery', 'Neo-Noir', 'Western', 'War', 'Heist', 'Family', 'Animation', 'Musical', 'Biopic', 'Satire'];
export const TONES = ['Darkly comic', 'Coen-style', 'Grounded and gritty', 'Propulsive popcorn', 'Elevated / literary', 'Warm and humanist', 'Melancholic', 'Operatic', 'Cold and clinical', 'Whimsical'];
export const RATINGS = ['G', 'PG', 'PG-13', 'R', 'NC-17', 'Unrated'];
export const MODELS: Record<string, { label: string; beats: string[] }> = {
  'three-act': { label: 'Three-act', beats: ['Setup / opening image (0-10%)', 'Inciting incident (~10-12%)', 'Lock-in / break into Act 2 (~25%)', 'Midpoint reversal (~50%)', 'Low point / all is lost (~75%)', 'Climax (~85-95%)', 'Resolution / final image (95-100%)'] },
  'save-the-cat': { label: 'Save the Cat', beats: ['Opening Image (1%)', 'Theme Stated (5%)', 'Set-Up (1-10%)', 'Catalyst (10%)', 'Debate (10-20%)', 'Break into Two (20%)', 'B Story (22%)', 'Fun and Games (20-50%)', 'Midpoint (50%)', 'Bad Guys Close In (50-75%)', 'All Is Lost (75%)', 'Dark Night of the Soul (75-80%)', 'Break into Three (80%)', 'Finale (80-99%)', 'Final Image (99-100%)'] },
  'heros-journey': { label: 'Hero\'s Journey', beats: ['Ordinary World', 'Call to Adventure', 'Refusal of the Call', 'Meeting the Mentor', 'Crossing the Threshold (~25%)', 'Tests, Allies, Enemies', 'Approach to the Inmost Cave', 'The Ordeal (~50-60%)', 'Reward', 'The Road Back (~75%)', 'Resurrection (climax)', 'Return with the Elixir'] },
  'five-act': { label: 'Five-act', beats: ['Exposition (0-20%)', 'Rising action (20-40%)', 'Climax / turning point (~50%)', 'Falling action (60-80%)', 'Catastrophe or resolution (80-100%)'] },
  'story-circle': { label: 'Story Circle', beats: ['You: a comfort zone', 'Need: they want something', 'Go: an unfamiliar situation', 'Search: they adapt', 'Find: they get what they wanted (~50%)', 'Take: they pay a heavy price', 'Return: back to the familiar', 'Change: they have changed'] },
  'sequences': { label: 'Eight sequences', beats: ['Seq 1: status quo and inciting incident', 'Seq 2: predicament and lock-in', 'Seq 3: first obstacle', 'Seq 4: first culmination / midpoint', 'Seq 5: subplot and rising stakes', 'Seq 6: main culmination / low point', 'Seq 7: new tension and twist', 'Seq 8: resolution'] },
  'none': { label: 'None (let the story decide)', beats: [] }
};
export const STATLBL: Record<string, string> = { ok: 'On track', early: 'Early', late: 'Late', weak: 'Weak', missing: 'Missing' };
export function normFrame(f?: any, st?: any): Frame {
  f = f || {};
  return { genre: f.genre || '', genre2: f.genre2 || '', blend: Math.min(90, Math.max(50, Number(f.blend) || 70)), tone: f.tone || (st && st.tone) || '',
    rating: RATINGS.includes(f.rating) ? f.rating : 'PG-13', runtime: Math.min(200, Math.max(60, Number(f.runtime) || (st && st.runtime) || 100)), structure: MODELS[f.structure] ? f.structure : 'three-act' };
}
export function frameText(f: Frame | null | undefined) {
  if (!f) return '';
  const g = f.genre2 ? f.genre + ' ' + f.blend + '% / ' + f.genre2 + ' ' + (100 - f.blend) + '%' : f.genre;
  return [g, f.tone, f.rating, '~' + f.runtime + ' min', 'lens: ' + MODELS[f.structure].label].filter(Boolean).join(' · ');
}
