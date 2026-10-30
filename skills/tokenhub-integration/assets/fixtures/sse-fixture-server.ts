// A local stand-in for /chat/completions streaming, for offline checks. No network, no key.
// Each scenario is selected by the request's model id, so the same client code runs unchanged.
import { createServer, type Server } from "node:http";

const chunk = (content: string, finish: string | null = null) =>
  `data: ${JSON.stringify({ id: "chatcmpl-fixture", object: "chat.completion.chunk", choices: [{ index: 0, delta: { content }, finish_reason: finish }] })}\n\n`;
const usage = `data: ${JSON.stringify({ id: "chatcmpl-fixture", object: "chat.completion.chunk", choices: [], usage: { prompt_tokens: 3, completion_tokens: 2, total_tokens: 5 } })}\n\n`;

export const SCENARIOS: Record<string, string[]> = {
  /** A normal stream: a keep-alive comment, two deltas, the usage chunk and [DONE]. */
  "fixture/normal": [": tokenhub processing\n\n", chunk("Hel"), chunk("lo", "stop"), usage, "data: [DONE]\n\n"],
  /** The same bytes, split mid-frame across writes. */
  "fixture/split": [": tokenhub proc", "essing\n\nda", chunk("Hel").slice(2), chunk("lo", "stop").slice(0, 20), chunk("lo", "stop").slice(20), usage, "data: [DO", "NE]\n\n"],
  /** The normal stream with CRLF line endings, a CRLF pair split between writes. */
  "fixture/crlf": [": tokenhub processing\r\n\r", "\n", chunk("Hel").replace(/\n/g, "\r\n"), chunk("lo", "stop").replace(/\n/g, "\r\n"), usage.replace(/\n/g, "\r\n"), "data: [DONE]\r\n\r\n"],
  /** A failure after HTTP 200: one error frame and no terminator. */
  "fixture/error-after-200": [chunk("Hel"), `data: ${JSON.stringify({ error: { code: 502, type: "upstream_error", message: "provider failed" }, finish_reason: "error" })}\n\n`],
  /** A body that stops early with no [DONE]. */
  "fixture/truncated": [chunk("Hel"), chunk("lo")],
};

export function startFixtureServer(port = 0): Promise<{ server: Server; baseUrl: string }> {
  const server = createServer((req, res) => {
    let body = "";
    req.on("data", (d) => (body += d));
    req.on("end", () => {
      const model = (() => { try { return JSON.parse(body).model as string; } catch { return ""; } })();
      const frames = SCENARIOS[model];
      if (!frames) {
        res.writeHead(404, { "content-type": "application/json" });
        res.end(JSON.stringify({ error: { code: 404, type: "model_not_found", message: `no fixture ${model}` } }));
        return;
      }
      res.writeHead(200, { "content-type": "text/event-stream", "x-generation-id": "req_fixture00000000000000000000" });
      let i = 0;
      const next = () => (i < frames.length ? res.write(frames[i++], () => setTimeout(next, 5)) : res.end());
      next();
    });
  });
  return new Promise((resolve) => server.listen(port, "127.0.0.1", () => {
    const address = server.address();
    const actual = typeof address === "object" && address ? address.port : port;
    resolve({ server, baseUrl: `http://127.0.0.1:${actual}` });
  }));
}
