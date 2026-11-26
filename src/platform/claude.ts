// Access to the Claude artifact capabilities (sample, dictation, downloads).
// They only exist when Story COP runs inside Claude; anywhere else use() gives
// null and the app says so. Phase 3 replaces 'sample' with the Anthropic API.
declare global {
  interface Window { claude?: { use: (name: string) => Promise<any> } }
}

export const use = (n: string): Promise<any> => { try { return window.claude && window.claude.use ? window.claude.use(n) : Promise.resolve(null); } catch (e) { return Promise.resolve(null); } };
