// Access to the Claude artifact capabilities (sample, dictation, downloads).
// They only exist when Story COP runs inside Claude; anywhere else use() gives
// null. Outside Claude, the AI goes through the writer's own API key
// (src/ai/anthropic.ts) and files save as normal browser downloads.
declare global {
  interface Window { claude?: { use: (name: string) => Promise<any> } }
}

// True when Story COP is running as an artifact inside Claude.
export const inClaude = () => { try { return !!(window.claude && window.claude.use); } catch (e) { return false; } };

export const use =(n: string): Promise<any> => { try { return window.claude && window.claude.use ? window.claude.use(n) : Promise.resolve(null); } catch (e) { return Promise.resolve(null); } };
