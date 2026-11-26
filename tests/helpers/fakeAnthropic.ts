// A stand-in for api.anthropic.com. It answers the real Anthropic SDK the way
// the API does (streamed server-sent events, model lookups, error bodies), so
// tests exercise the actual client code without a network or a bill.
export interface FakeCall { url: string; method: string; headers: Record<string, string>; body: any }

export interface FakeAnthropicOptions {
  respond?: (prompt: string) => string;   // the answer's text for a prompt
  status?: number;                        // force an error status (401, 429, 500…)
  stopReason?: string;                    // e.g. 'refusal', 'max_tokens'
  knownModels?: string[];                 // models that exist for /v1/models/{id}
  chunk?: number;                         // characters per streamed piece
}

const sse = (type: string, data: any) => `event: ${type}\ndata: ${JSON.stringify({ type, ...data })}\n\n`;

export function fakeAnthropic(opts: FakeAnthropicOptions = {}) {
  const calls: FakeCall[] = [];
  const fetchFn = async (input: any, init: any = {}) => {
    const url = typeof input === 'string' ? input : input.url;
    const headers: Record<string, string> = {};
    const h = init.headers || {};
    if (typeof h[Symbol.iterator] === 'function') for (const [k, v] of h) headers[String(k).toLowerCase()] = String(v);
    else Object.entries(h).forEach(([k, v]) => { headers[k.toLowerCase()] = String(v); });
    const body = init.body ? JSON.parse(String(init.body)) : null;
    calls.push({ url, method: init.method || 'GET', headers, body });

    if (opts.status) {
      const type = opts.status === 401 ? 'authentication_error' : opts.status === 429 ? 'rate_limit_error' : opts.status === 404 ? 'not_found_error' : 'api_error';
      return new Response(JSON.stringify({ type: 'error', error: { type, message: 'fake ' + type } }), { status: opts.status, headers: { 'content-type': 'application/json', 'x-should-retry': 'false' } });
    }

    const m = /\/v1\/models\/([^?]+)/.exec(url);
    if (m) {
      const id = decodeURIComponent(m[1]);
      if (opts.knownModels && !opts.knownModels.includes(id)) return new Response(JSON.stringify({ type: 'error', error: { type: 'not_found_error', message: 'model: ' + id } }), { status: 404, headers: { 'content-type': 'application/json', 'x-should-retry': 'false' } });
      return new Response(JSON.stringify({ type: 'model', id, display_name: id, created_at: '2026-01-01T00:00:00Z' }), { status: 200, headers: { 'content-type': 'application/json' } });
    }

    if (/\/v1\/messages/.test(url)) {
      const prompt = body.messages[0].content;
      const text = (opts.respond || (() => '{}'))(prompt);
      const n = opts.chunk || 40;
      let out = sse('message_start', { message: { id: 'msg_fake', type: 'message', role: 'assistant', model: body.model, content: [], stop_reason: null, stop_sequence: null, usage: { input_tokens: 10, output_tokens: 0 } } });
      out += sse('content_block_start', { index: 0, content_block: { type: 'text', text: '' } });
      for (let i = 0; i < text.length; i += n) out += sse('content_block_delta', { index: 0, delta: { type: 'text_delta', text: text.slice(i, i + n) } });
      out += sse('content_block_stop', { index: 0 });
      out += sse('message_delta', { delta: { stop_reason: opts.stopReason || 'end_turn', stop_sequence: null }, usage: { output_tokens: 5 } });
      out += sse('message_stop', {});
      return new Response(out, { status: 200, headers: { 'content-type': 'text/event-stream' } });
    }
    return new Response('not found', { status: 404 });
  };
  return { calls, fetch: fetchFn };
}
